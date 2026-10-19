// Tempo mode: the song runs at a fixed BPM and each note has a time window.
// Pure logic on one timeline (ms); the screen feeds it plucks and the clock.

import type { SongNote } from '../songs/song'
import type { Summary } from './waitSession'

export type Timing = 'perfect' | 'early' | 'late'

export type TempoResult =
  | { kind: 'hit'; index: number; offsetMs: number; timing: Timing }
  | { kind: 'wrong'; index: number; expected: number; played: number }
  | { kind: 'stray'; played: number }

export interface TempoOptions {
  bpm: number
  /** When beat 0 happens, ms. */
  startTime: number
  /** |offset| up to this counts as on time. */
  perfectMs?: number
  /** Plucks further than this from any note do not count for it. */
  windowMs?: number
}

type State = 'pending' | 'hit' | 'missed'

export class TempoSession {
  readonly beatMs: number
  readonly perfectMs: number
  readonly windowMs: number
  private state: State[]
  private offsets: (number | null)[]
  private wrong: number[]
  private strays = 0
  private lastEvent = 0
  /** Missed notes reported by update() since the last call. */
  newlyMissed: number[] = []

  constructor(readonly notes: SongNote[], private opts: TempoOptions) {
    this.beatMs = 60000 / opts.bpm
    this.perfectMs = opts.perfectMs ?? 90
    // Generous at slow tempos, never wider than ~half a beat at fast ones.
    this.windowMs = opts.windowMs ?? Math.min(300, Math.max(160, this.beatMs * 0.45))
    this.state = notes.map(() => 'pending')
    this.offsets = notes.map(() => null)
    this.wrong = notes.map(() => 0)
  }

  timeOf(index: number) {
    return this.opts.startTime + this.notes[index].beat * this.beatMs
  }

  /** Song position in beats at time `t`. */
  beatAt(t: number) {
    return (t - this.opts.startTime) / this.beatMs
  }

  get endTime() {
    const last = this.notes[this.notes.length - 1]
    return this.opts.startTime + (last.beat + last.beats) * this.beatMs + this.windowMs
  }

  done(t: number) {
    return t > this.endTime
  }

  /** The first note still waiting to be played (for highlighting). */
  get nextIndex() {
    const i = this.state.indexOf('pending')
    return i < 0 ? this.notes.length : i
  }

  isHit(i: number) {
    return this.state[i] === 'hit'
  }

  isMissed(i: number) {
    return this.state[i] === 'missed'
  }

  played(midi: number, t: number): TempoResult {
    this.update(t)
    this.lastEvent = t
    // Pending notes whose window contains t, nearest first.
    const open = this.notes
      .map((_, i) => i)
      .filter((i) => this.state[i] === 'pending' && Math.abs(t - this.timeOf(i)) <= this.windowMs)
      .sort((a, b) => Math.abs(t - this.timeOf(a)) - Math.abs(t - this.timeOf(b)))
    const match = open.find((i) => this.notes[i].midi === midi)
    if (match !== undefined) {
      const offsetMs = t - this.timeOf(match)
      this.state[match] = 'hit'
      this.offsets[match] = offsetMs
      const timing: Timing = Math.abs(offsetMs) <= this.perfectMs ? 'perfect' : offsetMs < 0 ? 'early' : 'late'
      return { kind: 'hit', index: match, offsetMs, timing }
    }
    if (open.length) {
      this.wrong[open[0]]++
      return { kind: 'wrong', index: open[0], expected: this.notes[open[0]].midi, played: midi }
    }
    this.strays++
    return { kind: 'stray', played: midi }
  }

  /** Advance the clock: notes whose window has closed unplayed become misses. */
  update(t: number) {
    this.newlyMissed = []
    this.state.forEach((s, i) => {
      if (s === 'pending' && t - this.timeOf(i) > this.windowMs) {
        this.state[i] = 'missed'
        this.newlyMissed.push(i)
      }
    })
  }

  /** Hits in a row up to now (a miss or a wrong note breaks it). */
  get combo() {
    let n = 0
    for (let i = this.nextIndex - 1; i >= 0; i--) {
      if (this.state[i] !== 'hit' || this.wrong[i]) break
      n++
    }
    return n
  }

  timingCounts() {
    const out = { perfect: 0, early: 0, late: 0 }
    for (const o of this.offsets) {
      if (o === null) continue
      if (Math.abs(o) <= this.perfectMs) out.perfect++
      else if (o < 0) out.early++
      else out.late++
    }
    return out
  }

  summary(): Summary {
    const total = this.notes.length
    const hits = this.offsets.filter((o) => o !== null) as number[]
    const clean = this.state.filter((s, i) => s === 'hit' && this.wrong[i] === 0).length
    const misses = this.state.filter((s) => s === 'missed').length
    const byMidi = new Map<number, number>()
    this.notes.forEach((n, i) => {
      const bad = this.wrong[i] + (this.state[i] === 'missed' ? 1 : 0)
      if (bad) byMidi.set(n.midi, (byMidi.get(n.midi) ?? 0) + bad)
    })
    return {
      total,
      clean,
      accuracy: total ? hits.length / total : 0,
      mistakes: this.wrong.reduce((a, b) => a + b, 0) + misses + this.strays,
      tricky: [...byMidi].map(([midi, mistakes]) => ({ midi, mistakes })).sort((a, b) => b.mistakes - a.mistakes).slice(0, 3),
      durationMs: Math.max(0, this.lastEvent - this.opts.startTime),
      avgOffsetMs: hits.length ? hits.reduce((a, b) => a + b, 0) / hits.length : 0,
    }
  }
}
