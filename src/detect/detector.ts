// Turns a stream of audio frames into discrete kalimba notes.
//
// Pure and clock-agnostic: feed it the newest samples plus a timestamp as
// often as you like (every animation frame, every 8 ms in a test) and it
// returns the notes that started. No DOM, no Web Audio.
//
// A kalimba note rings for seconds and overlaps the next, so "a pitch is
// present" is not a note. A note is:
//
//   1. An onset, from either of two cues:
//      - The 2–8 kHz band jumps `hfRiseDb` over its decaying peak envelope
//        (or the overall level jumps and the band at least half as much).
//        That band holds the pluck's click and the tine's fast-dying upper
//        modes (~6× the fundamental) and little of the fundamentals already
//        ringing, so it fires on every pluck, a re-plucked tine included.
//      - One tine's amplitude jumps `tineRiseDb` over its own envelope. This
//        still works while ringing high tines keep the band busy.
//      Envelopes rather than a recent minimum, because two neighbouring
//      tines ringing together beat 20–40 times a second.
//
//   2. The tine that grew. Shortly after the onset, the amplitude at each of
//      the 17 tine frequencies is compared with its low point around the
//      onset. Ringing notes only decay, so the new note is the tine that grew
//      most, even when an older note is as loud. Growth spread over many
//      tines is a knock, not a pluck. YIN on the newest samples
//      referees between neighbours, rejects notes that are not on the
//      instrument, and supplies the cents.
//
// A ringing note never re-triggers by itself because it only gets quieter.

import { midiToHz, type Tine } from '../config/tunings'
import { biquad } from './filter'
import { createSalience } from './salience'
import { snapToTine, tineHz, type Snapped } from './snap'
import { createYin, type PitchEstimate } from './yin'

export interface DetectorConfig {
  sampleRate: number
  tines: Tine[]
  /** Calibration: how far each tine (by position) sits from its nominal pitch, cents. */
  offsets?: Record<number, number>
  /** Samples for the tine amplitudes; long enough to separate E4 from F4. */
  frameSize: number
  /** Newest samples given to YIN. */
  pitchWindow: number
  /** How long after an onset the note is decided, ms. */
  decideAfterMs: number
  /** Samples used for the short-term levels that drive onsets. */
  levelWindow: number
  minHz: number
  maxHz: number
  yinThreshold: number
  minConfidence: number
  /** Absolute floor; the gate also sits `gateAboveNoiseDb` over the measured room noise. */
  gateDb: number
  gateAboveNoiseDb: number
  maxCents: number
  onsetRiseDb: number
  hfRiseDb: number
  hfAboveFloorDb: number
  /** Per-tine onset: rise over the tine's own envelope, which falls at `tineEnvDecay` dB/s. */
  tineRiseDb: number
  tineEnvDecay: number
  /** How fast the onset reference envelopes fall, dB/s. */
  levelEnvDecay: number
  hfEnvDecay: number
  refractoryMs: number
  /** A different tine rising can start a new note this soon (fast runs). */
  fastOnsetMs: number
  /** Level may fall at most this much from just before an onset to the decision. */
  maxDropDb: number
  /**
   * Share of the winning tine's amplitude that must be new. Small on
   * purpose: a re-plucked tine only regains what it had lost.
   */
  minGrowth: number
}

export const DEFAULT_CONFIG: Omit<DetectorConfig, 'sampleRate' | 'tines'> = {
  frameSize: 4096,
  pitchWindow: 2048,
  decideAfterMs: 60,
  levelWindow: 480,
  minHz: 220,
  maxHz: 1500,
  yinThreshold: 0.15,
  minConfidence: 0.8,
  gateDb: -58,
  gateAboveNoiseDb: 10,
  maxCents: 50,
  onsetRiseDb: 4,
  hfRiseDb: 6,
  hfAboveFloorDb: 12,
  tineRiseDb: 6,
  tineEnvDecay: 20,
  levelEnvDecay: 30,
  hfEnvDecay: 100,
  refractoryMs: 70,
  fastOnsetMs: 35,
  maxDropDb: 6,
  minGrowth: 0.05,
}

/** YIN confidence of a single clean tone (~0.999). Two tines ringing together
 * can still score 0.96 at a phantom pitch between them, so the bar is high. */
const CLEAN_CONFIDENCE = 0.985

export interface NoteEvent {
  tine: Tine
  /** Measured frequency; the tine's nominal one when YIN could not confirm. */
  hz: number
  /** Cents off the tine, or null when the note was found in a chord-like mix. */
  cents: number | null
  /** When the note started (onset), ms. */
  time: number
  /** When it was confirmed, ms; `detectedAt - time` is the latency. */
  detectedAt: number
}

export type DetectorPhase = 'idle' | 'capturing' | 'muted'

/** Everything the debug panel shows, per frame. */
export interface FrameInfo {
  time: number
  levelDb: number
  hfDb: number
  noiseFloorDb: number
  gateDb: number
  estimate: PitchEstimate
  snapped: Snapped | null
  /** Amplitude per tine, same order as `config.tines`. Reused: valid until the next call. */
  salience: Float32Array
  onset: boolean
  phase: DetectorPhase
}

export class NoteDetector {
  readonly config: DetectorConfig
  private yin: (frame: Float32Array) => PitchEstimate
  private salience: (frame: Float32Array) => Float32Array
  private hfBuf: Float32Array
  private levelEnv = -Infinity
  private hfEnv = -Infinity
  private hfFloor = Infinity
  private noiseFloor = NaN
  private lastTime = -Infinity
  private lastOnset = -Infinity
  private mutedUntil = -Infinity
  private phase: DetectorPhase = 'idle'
  private onsetTime = 0
  private prevLevelDb = -Infinity
  /** The last note's tine, while its growth may still spill into the next decision. */
  private carry: { pos: number; until: number } | null = null
  private glitchUntil = -Infinity
  private windowMs: number
  private preOnsetDb = -Infinity
  /** Tine amplitudes from the last frame, and from just before the current onset. */
  private prevSalience: Float32Array
  /** Per-tine decaying peak envelope, dB. */
  private tineEnv: Float32Array
  private baseline: Float32Array

  constructor(config: Partial<DetectorConfig> & Pick<DetectorConfig, 'sampleRate' | 'tines'>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    const c = this.config
    this.yin = createYin(c.pitchWindow, { sampleRate: c.sampleRate, minHz: c.minHz, maxHz: c.maxHz, threshold: c.yinThreshold })
    this.salience = createSalience(c.frameSize, c.sampleRate, c.tines.map((t) => tineHz(t, c.offsets)))
    this.hfBuf = new Float32Array(c.levelWindow + 384)
    this.windowMs = (c.frameSize / c.sampleRate) * 1000
    this.prevSalience = new Float32Array(c.tines.length)
    this.baseline = new Float32Array(c.tines.length)
    this.tineEnv = new Float32Array(c.tines.length).fill(-Infinity)
  }

  /** Ignore everything until `time` (e.g. while the guide note plays through the speaker). */
  suppressUntil(time: number) {
    this.mutedUntil = Math.max(this.mutedUntil, time)
  }

  reset() {
    this.levelEnv = -Infinity
    this.hfEnv = -Infinity
    this.hfFloor = Infinity
    this.phase = 'idle'
    this.lastOnset = -Infinity
    this.prevSalience.fill(0)
    this.tineEnv.fill(-Infinity)
  }

  /**
   * Analyse the newest samples. `frame` must hold at least `frameSize`
   * samples, newest last; `time` is in ms and must increase.
   */
  process(frame: Float32Array, time: number): { info: FrameInfo; notes: NoteEvent[] } {
    const c = this.config
    const dt = Math.max(0, Math.min(500, time - this.lastTime))
    this.lastTime = time
    const notes: NoteEvent[] = []
    const win = frame.length > c.frameSize ? frame.subarray(frame.length - c.frameSize) : frame

    // An audio dropout (a run of exact zeros, which a real mic never gives)
    // looks just like a tine muted and plucked again: its edges click and the
    // tines dip and come back. Ignore onsets while it is in the newest
    // samples, and keep it out of the capture baselines.
    const dropout = hasDropout(win, 0)
    if (hasDropout(win, win.length - 1536)) this.glitchUntil = time + 25
    const glitch = time < this.glitchUntil

    const levelDb = rmsDb(win, c.levelWindow)
    // Over a whole beat period of neighbouring tines, so beating averages out.
    const steadyDb = rmsDb(win, c.pitchWindow)
    const hfDb = this.bandLevel(win)
    const raw: PitchEstimate = levelDb > c.gateDb ? this.yin(win.subarray(win.length - c.pitchWindow)) : { hz: null, confidence: 0 }
    const pitched = raw.hz !== null && raw.confidence >= c.minConfidence
    const sal = this.salience(win)
    this.trackNoiseFloor(levelDb, dt, maxDb(sal))
    const gateDb = Math.max(c.gateDb, (this.noiseFloor || -Infinity) + c.gateAboveNoiseDb)
    const estimate = levelDb > gateDb ? raw : { hz: null, confidence: 0 }
    const snapped = pitched && levelDb > gateDb ? snapToTine(raw.hz!, c.tines, c.maxCents, c.offsets) : null

    // Onset cues (see the top of the file). Each compares against a peak
    // envelope falling at a fixed rate, decayed to now before comparing.
    const first = !Number.isFinite(this.levelEnv)
    const levelRef = Math.max(this.levelEnv - (c.levelEnvDecay * dt) / 1000, this.noiseFloor)
    const hfRef = this.hfEnv - (c.hfEnvDecay * dt) / 1000
    const rising = this.tineRise(sal, dt, gateDb)
    // Inside the refractory time only a different tine rising counts: that
    // is the next note of a fast run, never a second onset of one pluck.
    const lead = this.phase === 'capturing' ? this.leadingTine(sal) : -1
    const carried = this.carry && time < this.carry.until ? c.tines.findIndex((t) => t.pos === this.carry!.pos) : -1
    // A pluck lifts one tine (and a little of its neighbours); a click or a
    // glitch lifts many at once, and must not cut a capture short.
    // Only once the note being captured is clear, and not its frequency
    // neighbours (which rise with it through leakage).
    const near = (k: number, of: number) => of >= 0 && Math.abs(c.tines[k].midi - c.tines[of].midi) <= 2
    const others = lead < 0 ? [] : rising.filter((k) => !near(k, lead) && !near(k, carried))
    const runOnset = time - this.lastOnset >= c.fastOnsetMs && others.length > 0 && rising.length <= 4
    const onset =
      !first &&
      !glitch &&
      time >= this.mutedUntil &&
      levelDb > gateDb &&
      (runOnset ||
        (time - this.lastOnset >= c.refractoryMs &&
      (rising.length > 0 ||
        // The band must stand clear of its own floor: between plucks it
        // holds only faint, beating leakage from the fundamentals.
        (hfDb - this.hfFloor >= c.hfAboveFloorDb &&
          // A level jump alone can be two tines beating; a real pluck always
          // brings at least some high-band energy with it.
          (hfDb - hfRef >= c.hfRiseDb || (levelDb - levelRef >= c.onsetRiseDb && hfDb - hfRef >= c.hfRiseDb / 2))))))
    this.levelEnv = first ? levelDb : Math.max(levelDb, levelRef)
    this.hfEnv = first ? hfDb : Math.max(hfDb, hfRef)
    this.hfFloor = Math.min(hfDb, this.hfFloor + (3 * dt) / 1000)

    if (time < this.mutedUntil) {
      this.phase = 'muted'
    } else {
      if (this.phase === 'muted') this.phase = 'idle'
      if (onset) {
        // A fast run: the next pluck lands while the last one is still being
        // captured. Decide that one now, with what has grown so far.
        if (this.phase === 'capturing') {
          const note = this.pickGrowth(sal, gateDb, snapped, pitched ? raw : null)
          if (note) notes.push(this.emit(note, this.onsetTime, time))
        }
        // Start the baseline from the last frame before the onset.
        this.baseline.set(this.prevSalience)
        this.preOnsetDb = this.prevLevelDb
        this.lastOnset = time
        this.onsetTime = time
        this.phase = 'capturing'
      }
      if (this.phase === 'capturing') {
        if (time - this.onsetTime >= c.decideAfterMs) {
          this.phase = 'idle'
          // A pluck adds energy. A tine stopped dead under the thumb also makes
          // a click and smears into its neighbours' frequencies, but the sound
          // as a whole gets quieter: that is not a note.
          const added = steadyDb >= this.preOnsetDb - c.maxDropDb
          const note = added ? this.pickGrowth(sal, gateDb, snapped, pitched ? raw : null) : null
          if (note) notes.push(this.emit(note, this.onsetTime, time))
        } else {
          // Keep each tine's low point: a re-plucked tine dips under the
          // thumb first, and that shows in the frames around the onset.
          if (!dropout) for (let k = 0; k < sal.length; k++) this.baseline[k] = Math.min(this.baseline[k], sal[k])
        }
      }
    }
    this.prevSalience.set(sal)
    this.prevLevelDb = steadyDb

    return {
      info: { time, levelDb, hfDb, noiseFloorDb: this.noiseFloor, gateDb, estimate, snapped, salience: sal, onset, phase: this.phase },
      notes,
    }
  }

  /**
   * Record a detected note. Its tine keeps "growing" in the long analysis
   * window for a while after the pluck; until it has filled the window,
   * that growth must not be taken for the next note.
   */
  private emit(note: { tine: Tine; hz: number; cents: number | null }, onset: number, now: number): NoteEvent {
    this.carry = { pos: note.tine.pos, until: onset + this.windowMs + 25 }
    return { ...note, time: onset, detectedAt: now }
  }

  /** The tine that grew most since the baseline, if it grew enough to be a pluck. */
  private pickGrowth(sal: Float32Array, gateDb: number, snapped: Snapped | null, yin: PitchEstimate | null) {
    const { tines, minGrowth } = this.config
    const growth = Array.from(sal, (v, k) => v - this.baseline[k])
    // The previous note may still be filling the window: not a new pluck.
    if (this.carry && this.lastTime < this.carry.until) {
      const k = tines.findIndex((t) => t.pos === this.carry!.pos)
      if (k >= 0) growth[k] = 0
    }
    let best = -1
    for (let k = 0; k < growth.length; k++) if (growth[k] > 0 && (best < 0 || growth[k] > growth[best])) best = k
    if (best < 0) return null

    // A knock or a clap lifts every tine a little; a pluck lifts one (and
    // a bit of its neighbours). Reject growth spread over many tines.
    const spread = growth.filter((g, k) => Math.abs(k - best) > 1 && g > 0.5 * growth[best]).length
    if (spread >= 3) return null

    // Octave: tines have almost no 2nd harmonic, so growth an octave below
    // means that lower tine was the one plucked.
    const lower = tines.findIndex((t) => t.midi === tines[best].midi - 12)
    if (lower >= 0 && growth[lower] >= 0.25 * growth[best]) best = lower

    // YIN referees, but only on a clean signal: it resolves neighbours far
    // better, yet a mix of two tines can fool it into a pitch in between.
    if (yin?.hz && yin.confidence >= CLEAN_CONFIDENCE) {
      const off = Math.abs(1200 * Math.log2(yin.hz / tineHz(tines[best], this.config.offsets)))
      if (snapped && snapped.tine !== tines[best]) {
        const k = tines.indexOf(snapped.tine)
        if (growth[k] >= 0.5 * growth[best]) best = k
      } else if (!snapped && off < 100) {
        return null // a clean note between the tines: not this instrument
      }
    }

    const amp = sal[best]
    // A sine of peak amplitude A has RMS A/√2.
    const ampDb = 20 * Math.log10(amp / Math.SQRT2)
    if (ampDb < gateDb || growth[best] < minGrowth * amp) return null

    const tine = tines[best]
    const nominal = midiToHz(tine.midi)
    if (snapped && snapped.tine === tine) {
      return { tine, cents: snapped.cents, hz: nominal * Math.pow(2, snapped.cents / 1200) }
    }
    return { tine, cents: null, hz: nominal }
  }

  /** Tines rising `tineRiseDb` over their decaying envelopes. Updates the envelopes. */
  private tineRise(sal: Float32Array, dt: number, gateDb: number): number[] {
    const { tineRiseDb, tineEnvDecay } = this.config
    const rose: number[] = []
    for (let k = 0; k < sal.length; k++) {
      const db = 20 * Math.log10(sal[k] / Math.SQRT2 || 1e-9)
      const ref = this.tineEnv[k] - (tineEnvDecay * dt) / 1000
      if (db > gateDb && db - ref >= tineRiseDb) rose.push(k)
      this.tineEnv[k] = Math.max(db, ref)
    }
    return rose
  }

  /** The tine clearly growing most in the capture under way, or -1 while unclear. */
  private leadingTine(sal: Float32Array): number {
    let best = -1
    let bestGain = 0
    for (let k = 0; k < sal.length; k++) {
      const gain = sal[k] - this.baseline[k]
      if (gain > bestGain) {
        bestGain = gain
        best = k
      }
    }
    return best >= 0 && bestGain >= 0.25 * sal[best] ? best : -1
  }

  /** Level of the 2–8 kHz band over the newest `levelWindow` samples. */
  private bandLevel(win: Float32Array): number {
    const { levelWindow, sampleRate } = this.config
    const buf = this.hfBuf
    buf.set(win.subarray(win.length - buf.length))
    // 6th-order high-pass: the highest tine (E6, 1.3 kHz) comes out ~20 dB down.
    biquad('highpass', buf, buf, 2000, sampleRate)
    biquad('highpass', buf, buf, 2000, sampleRate)
    biquad('highpass', buf, buf, 2000, sampleRate)
    biquad('lowpass', buf, buf, 8000, sampleRate)
    // The first samples hold the filters' start-up transient.
    return rmsDb(buf, levelWindow)
  }

  /**
   * Room noise: follows the level down at once, and creeps up (3 dB/s) only
   * while the sound is noise-like. With tines ringing, most of the energy
   * sits at tine frequencies; in noise, any one tine holds a sliver of it.
   * So continuous playing, even a dense mix YIN cannot read, never raises it.
   */
  private trackNoiseFloor(levelDb: number, dt: number, loudestTineDb: number) {
    if (!(levelDb >= this.noiseFloor)) this.noiseFloor = levelDb
    else if (loudestTineDb < levelDb - 15) this.noiseFloor = Math.min(levelDb, this.noiseFloor + (3 * dt) / 1000)
  }
}

/**
 * A run of at least 32 exact zeros between stretches of sound, from `from`
 * on: dropped audio. Leading silence (a stream starting) does not count.
 */
function hasDropout(frame: Float32Array, from: number): boolean {
  let run = 0
  let soundBefore = false
  for (let i = 0; i < frame.length; i++) {
    if (frame[i] === 0) {
      run++
      continue
    }
    if (run >= 32 && soundBefore && i >= from) return true
    run = 0
    soundBefore = true
  }
  // Still going at the end of the frame.
  return run >= 32 && soundBefore
}

/** Loudest tine amplitude as an RMS level in dB (a sine of peak A has RMS A/√2). */
function maxDb(sal: Float32Array): number {
  let max = 0
  for (const v of sal) max = Math.max(max, v)
  return 20 * Math.log10(max / Math.SQRT2 || 1e-9)
}

function rmsDb(frame: Float32Array, n: number): number {
  const start = Math.max(0, frame.length - n)
  let sum = 0
  for (let i = start; i < frame.length; i++) sum += frame[i] * frame[i]
  return 10 * Math.log10(sum / (frame.length - start) || 1e-12)
}
