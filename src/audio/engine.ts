// One place that owns the AudioContext, the mic, the note detector and the
// synth, and runs the analysis loop. Screens subscribe to notes and frames.

import { load, save } from '../app/storage'
import type { Tuning } from '../config/tunings'
import { NoteDetector, type FrameInfo, type NoteEvent } from '../detect/detector'
import { MicError, MicInput } from './mic'
import { KalimbaSynth } from './synth'

type NoteListener = (n: NoteEvent) => void
type FrameListener = (info: FrameInfo, now: number, frameMs: number) => void

export class AudioEngine {
  readonly mic = new MicInput()
  synth: KalimbaSynth | null = null
  detector: NoteDetector | null = null
  /** Set when the mic could not start; the synth may still work. */
  micError: MicError | null = null
  /** With headphones the guide tone cannot reach the mic, so no muting is needed. */
  headphones = false

  private frame = new Float32Array(this.mic.frameSize)
  private noteListeners = new Set<NoteListener>()
  private frameListeners = new Set<FrameListener>()
  private running = false
  private lastFrame = 0

  constructor(private tuning: Tuning) {}

  get started() {
    return this.synth !== null
  }

  get listening() {
    return this.running && this.micError === null && this.mic.isLive
  }

  /** Call from a tap. Starts sound and, if allowed, listening. */
  async start(): Promise<void> {
    this.micError = null
    try {
      await this.mic.start()
    } catch (e) {
      this.micError = e instanceof MicError ? e : new MicError('other', String(e))
    }
    const ctx = this.mic.ctx
    if (ctx && !this.synth) this.synth = new KalimbaSynth(ctx)
    if (this.micError) return
    if (!this.detector || this.detector.config.sampleRate !== this.mic.sampleRate) {
      this.buildDetector()
    } else {
      this.detector.reset()
    }
    if (!this.running) {
      this.running = true
      requestAnimationFrame(this.tick)
    }
  }

  /** Per-tine calibration (cents by position), saved on this device. */
  get calibration(): Record<number, number> {
    return load<Record<number, number>>(`calibration:${this.tuning.id}`, {})
  }

  setCalibration(offsets: Record<number, number>) {
    save(`calibration:${this.tuning.id}`, offsets)
    if (this.detector) this.buildDetector()
  }

  private buildDetector() {
    this.detector = new NoteDetector({ sampleRate: this.mic.sampleRate, tines: this.tuning.tines, offsets: this.calibration })
  }

  /** Back from the background: resume quietly if possible. Returns whether a tap is needed. */
  async wake(): Promise<boolean> {
    if (!this.started) return false
    try {
      await this.mic.ctx?.resume()
    } catch {
      /* needs a gesture */
    }
    this.detector?.reset()
    return this.micError === null && !this.mic.isLive
  }

  onNote(fn: NoteListener) {
    this.noteListeners.add(fn)
    return () => this.noteListeners.delete(fn)
  }

  onFrame(fn: FrameListener) {
    this.frameListeners.add(fn)
    return () => this.frameListeners.delete(fn)
  }

  /** Play a tine as a guide; the mic is muted while it rings unless on headphones. */
  playGuide(midi: number, velocity = 0.8) {
    this.synth?.play(midi, velocity)
    if (this.headphones) return
    this.detector?.suppressUntil(performance.now() + KalimbaSynth.AUDIBLE * 1000)
    this.checkAudible(midi)
  }

  /**
   * Called when guide tones seem not to come out of the speaker (the
   * ringer switch on silent, volume at zero): through the speaker the mic
   * always hears its own guide tone, so if it does not, sound is muted.
   */
  onMuted: (() => void) | null = null
  private unheard = 0

  private checkAudible(midi: number) {
    const k = this.tuning.tines.findIndex((t) => t.midi === midi)
    if (k < 0 || !this.listening) return
    const until = performance.now() + 400
    let heard = false
    const off = this.onFrame((info, now) => {
      if (20 * Math.log10(info.salience[k] / Math.SQRT2 || 1e-9) > info.gateDb) heard = true
      if (now < until) return
      off()
      this.unheard = heard ? 0 : this.unheard + 1
      // Two in a row, so one masked by a loud pluck does not count.
      if (this.unheard === 2) this.onMuted?.()
    })
  }

  /** Audio clock in ms on the same timeline as note events (performance.now). */
  get now() {
    return performance.now()
  }

  private tick = (now: number) => {
    if (!this.running) return
    requestAnimationFrame(this.tick)
    if (!this.detector || !this.mic.read(this.frame)) return
    const { info, notes } = this.detector.process(this.frame, now)
    for (const n of notes) for (const fn of this.noteListeners) fn(n)
    const frameMs = this.lastFrame ? now - this.lastFrame : 0
    this.lastFrame = now
    for (const fn of this.frameListeners) fn(info, now, frameMs)
  }
}
