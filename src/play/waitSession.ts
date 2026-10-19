// Wait mode: the song stops on each note until the right tine is played.
// Pure logic, no DOM: feed it what was played, read back what happened.

import type { SongNote } from '../songs/song'

export type WaitResult =
  | { kind: 'correct'; index: number; firstTry: boolean; done: boolean }
  | { kind: 'wrong'; index: number; expected: number; played: number }
  | { kind: 'ignored' }

export interface Summary {
  total: number
  /** Notes hit on the first try. */
  clean: number
  /** clean / total, 0–1. */
  accuracy: number
  mistakes: number
  /** Expected notes that drew the most mistakes, worst first. */
  tricky: { midi: number; mistakes: number }[]
  durationMs: number
  /** Tempo mode only: mean signed timing error, ms (negative = early). */
  avgOffsetMs?: number
}

export class WaitSession {
  index = 0
  private wrong: number[]
  private startedAt: number | null = null
  private endedAt: number | null = null

  constructor(readonly notes: SongNote[]) {
    this.wrong = notes.map(() => 0)
  }

  get done() {
    return this.index >= this.notes.length
  }

  get current(): SongNote | null {
    return this.notes[this.index] ?? null
  }

  played(midi: number, time: number): WaitResult {
    const target = this.current
    if (!target) return { kind: 'ignored' }
    this.startedAt ??= time
    if (midi !== target.midi) {
      this.wrong[this.index]++
      return { kind: 'wrong', index: this.index, expected: target.midi, played: midi }
    }
    const index = this.index++
    if (this.done) this.endedAt = time
    return { kind: 'correct', index, firstTry: this.wrong[index] === 0, done: this.done }
  }

  /** Correct-first-time streak ending at the last played note. */
  get combo(): number {
    let n = 0
    for (let i = this.index - 1; i >= 0 && this.wrong[i] === 0; i--) n++
    return n
  }

  summary(): Summary {
    const total = this.notes.length
    const clean = this.wrong.slice(0, this.index).filter((w) => w === 0).length
    const byMidi = new Map<number, number>()
    this.notes.forEach((n, i) => this.wrong[i] && byMidi.set(n.midi, (byMidi.get(n.midi) ?? 0) + this.wrong[i]))
    return {
      total,
      clean,
      accuracy: total ? clean / total : 0,
      mistakes: this.wrong.reduce((a, b) => a + b, 0),
      tricky: [...byMidi].map(([midi, mistakes]) => ({ midi, mistakes })).sort((a, b) => b.mistakes - a.mistakes).slice(0, 3),
      durationMs: this.startedAt !== null && this.endedAt !== null ? this.endedAt - this.startedAt : 0,
    }
  }
}

/** 1–3 stars from accuracy. */
export function stars(accuracy: number): number {
  return accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : accuracy > 0 ? 1 : 0
}
