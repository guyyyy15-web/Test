import { describe, expect, it } from 'vitest'
import { K17_C, midiToHz } from '../config/tunings'
import { NoteDetector, type NoteEvent } from './detector'
import { mix, noise, renderPerformance, type Pluck } from './synth'

const SR = 48000
const tines = K17_C.tines
const hzOf = (note: string) => midiToHz(tines.find((t) => t.note === note)!.midi)

/** Feed `signal` to a fresh detector the way the app does: newest 4096 samples every `hopMs`. */
function detect(signal: Float32Array, hopMs = 16.7, setup?: (d: NoteDetector) => void): NoteEvent[] {
  const d = new NoteDetector({ sampleRate: SR, tines })
  setup?.(d)
  const hop = Math.round((hopMs / 1000) * SR)
  const notes: NoteEvent[] = []
  for (let end = 4096; end <= signal.length; end += hop) {
    notes.push(...d.process(signal.subarray(end - 4096, end), (end / SR) * 1000).notes)
  }
  return notes
}

const names = (ns: NoteEvent[]) => ns.map((n) => n.tine.note)
const quiet = (seconds: number) => noise(Math.ceil(seconds * SR), 0.0005, 7)

describe('NoteDetector', () => {
  for (const hop of [8, 16.7, 33.3]) {
    describe(`at a ${hop} ms frame interval`, () => {
      it('detects every tine played slowly, once each', () => {
        const order = tines.map((t) => t.note)
        const plucks: Pluck[] = order.map((n, i) => ({ hz: hzOf(n), at: 0.3 + i * 0.6 }))
        const sig = mix(renderPerformance(plucks, 0.3 + order.length * 0.6 + 0.5, SR), quiet(11))
        expect(names(detect(sig, hop))).toEqual(order)
      })

      it('follows an overlapping melody (Twinkle, 4 notes/s)', () => {
        const melody = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4']
        const plucks = melody.map((n, i) => ({ hz: hzOf(n), at: 0.2 + i * 0.25 }))
        const sig = mix(renderPerformance(plucks, 4.5, SR), quiet(4.5))
        expect(names(detect(sig, hop))).toEqual(melody)
      })

      it('separates neighbouring tines in a stepwise melody (E/F, B/C at 4 notes/s)', () => {
        const melody = ['E4', 'F4', 'E4', 'F4', 'G4', 'F4', 'E4', 'E4', 'B4', 'C5', 'B4', 'C5', 'C5', 'B4']
        const plucks = melody.map((n, i) => ({ hz: hzOf(n), at: 0.2 + i * 0.25 }))
        const sig = mix(renderPerformance(plucks, 4.5, SR), quiet(4.5))
        expect(names(detect(sig, hop))).toEqual(melody)
      })

      it('counts fast repeated notes on one tine (8/s)', () => {
        const plucks = Array.from({ length: 8 }, (_, i) => ({ hz: hzOf('E4'), at: 0.2 + i * 0.125 }))
        const sig = renderPerformance(plucks, 2, SR)
        expect(names(detect(sig, hop))).toEqual(Array(8).fill('E4'))
      })
    })
  }

  it('does not count a long ringing note twice', () => {
    const sig = renderPerformance([{ hz: hzOf('C4'), at: 0.1, decay: 2.5 }], 4, SR)
    expect(names(detect(sig))).toEqual(['C4'])
  })

  it('does not re-count a low note when a higher one dies under it', () => {
    const sig = renderPerformance(
      [
        { hz: hzOf('C4'), at: 0.1, amp: 0.3, decay: 3 },
        { hz: hzOf('D6'), at: 0.4, amp: 0.5, decay: 0.25 },
      ],
      3,
      SR,
    )
    expect(names(detect(sig))).toEqual(['C4', 'D6'])
  })

  it('confirms notes quickly', () => {
    const sig = renderPerformance([{ hz: hzOf('G4'), at: 0.2 }], 1, SR)
    const [n] = detect(sig)
    expect(n.detectedAt - n.time).toBeLessThan(110)
    expect(Math.abs(n.time - 200)).toBeLessThan(20)
  })

  it('reports in-tune notes near 0 cents and detuned ones accurately', () => {
    const sig = renderPerformance([{ hz: hzOf('A4') * Math.pow(2, 25 / 1200), at: 0.2 }], 1, SR)
    const [n] = detect(sig)
    expect(n.tine.note).toBe('A4')
    expect(n.cents).toBeGreaterThan(20)
    expect(n.cents).toBeLessThan(30)
  })

  it('gives in-tune notes ~0 cents', () => {
    const [n] = detect(renderPerformance([{ hz: hzOf('D5'), at: 0.2 }], 1, SR))
    expect(Math.abs(n.cents!)).toBeLessThan(3)
  })

  it('finds the fundamental when the 2nd harmonic is louder', () => {
    const sig = renderPerformance([{ hz: hzOf('C4'), at: 0.2, partials: [[2, 4]] }], 1, SR)
    expect(names(detect(sig))).toEqual(['C4'])
  })

  it('does not invent a neighbour when a ringing tine is muted', () => {
    for (const note of ['E4', 'C4', 'B4', 'A5']) {
      const sig = mix(renderPerformance([{ hz: hzOf(note), at: 0.2, until: 0.9 }], 1.6, SR), quiet(1.6))
      expect(names(detect(sig)), note).toEqual([note])
    }
  })

  it('ignores room noise and a knock', () => {
    const knock = noise(SR / 50, 0.5, 3) // 20 ms burst
    const sig = mix(noise(SR * 2, 0.003, 11), new Float32Array(SR).fill(0), knock)
    expect(detect(sig)).toEqual([])
  })

  it('hears a neighbour played over a ringing tine (C4 → D4 → C4)', () => {
    const sig = mix(renderPerformance([60, 62, 60].map((m, i) => ({ hz: midiToHz(m), at: 0.5 + i * 0.6 })), 2.5, SR), quiet(2.5))
    expect(names(detect(sig))).toEqual(['C4', 'D4', 'C4'])
  })

  it('ignores notes that are not on the instrument', () => {
    const sig = renderPerformance([{ hz: midiToHz(61), at: 0.2 }], 1, SR) // C#4
    expect(detect(sig)).toEqual([])
  })

  it('stays deaf while suppressed (guide note from the speaker)', () => {
    const sig = renderPerformance(
      [
        { hz: hzOf('G4'), at: 0.2 },
        { hz: hzOf('E4'), at: 1.6 },
      ],
      3,
      SR,
    )
    expect(names(detect(sig, 16.7, (d) => d.suppressUntil(1500)))).toEqual(['E4'])
  })

  it('works over steady background noise', () => {
    const melody = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4']
    const plucks = melody.map((n, i) => ({ hz: hzOf(n), at: 0.5 + i * 0.35 }))
    const sig = mix(renderPerformance(plucks, 3.5, SR), noise(SR * 3.5, 0.01, 5))
    expect(names(detect(sig))).toEqual(melody)
  })

  it('copes with a slightly out-of-tune instrument (±25 cents)', () => {
    const order = tines.map((t) => t.note)
    const detune = (i: number) => Math.pow(2, (((i * 37) % 51) - 25) / 1200)
    const plucks = order.map((n, i) => ({ hz: hzOf(n) * detune(i), at: 0.3 + i * 0.5 }))
    const sig = mix(renderPerformance(plucks, 9.5, SR), quiet(9.5))
    expect(names(detect(sig))).toEqual(order)
  })

  it('gets ≥95% of a long random melody right (60 notes, 3/s, varied loudness)', () => {
    let seed = 42
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    const melody = Array.from({ length: 60 }, () => tines[Math.floor(rand() * tines.length)].note)
    const plucks = melody.map((n, i) => ({ hz: hzOf(n), at: 0.2 + i / 3, amp: 0.2 + rand() * 0.3 }))
    const sig = mix(renderPerformance(plucks, 21, SR), quiet(21))
    const got = names(detect(sig))
    expect(got.length).toBe(melody.length)
    const right = got.filter((n, i) => n === melody[i]).length
    expect(right / melody.length).toBeGreaterThanOrEqual(0.95)
  })

  it('uses calibration to follow a badly detuned tine (+45 cents)', () => {
    const sig = mix(renderPerformance([{ hz: hzOf('G4') * Math.pow(2, 45 / 1200), at: 0.3 }, { hz: hzOf('A4'), at: 1.0 }], 2, SR), quiet(2))
    const g4 = tines.find((t) => t.note === 'G4')!.pos
    const d = (offsets?: Record<number, number>) => {
      const det = new NoteDetector({ sampleRate: SR, tines, offsets })
      const out: NoteEvent[] = []
      for (let end = 4096; end <= sig.length; end += 800) out.push(...det.process(sig.subarray(end - 4096, end), (end / SR) * 1000).notes)
      return out
    }
    const calibrated = d({ [g4]: 45 })
    expect(names(calibrated)).toEqual(['G4', 'A4'])
    expect(Math.abs(calibrated[0].cents!)).toBeLessThan(5)
  })

  describe('fast thumb runs (the left side went missing on a real iPhone)', () => {
    const left = ['D4', 'F4', 'A4', 'C5', 'E5', 'G5', 'B5', 'D6']
    const right = ['E4', 'G4', 'B4', 'D5', 'F5', 'A5', 'C6', 'E6']
    const cases: [string, string[], number, number][] = [
      ['left side out, 60 ms apart', left, 60, 16.7],
      ['left side back in, 70 ms apart', [...left].reverse(), 70, 16.7],
      ['right side out, 70 ms apart', right, 70, 16.7],
      ['left side out, 80 ms apart at 30 fps', left, 80, 33.3],
    ]
    for (const [name, run, gap, hop] of cases) {
      it(name, () => {
        const sig = mix(renderPerformance(run.map((n, i) => ({ hz: hzOf(n), at: 0.3 + (i * gap) / 1000 })), 2.5, SR), quiet(2.5))
        expect(names(detect(sig, hop))).toEqual(run)
      })
    }
  })

  it('does not count audio dropouts in a ringing note as new plucks', () => {
    const melody = ['C4', 'E4', 'G4', 'C5', 'A4', 'F4', 'D4']
    const sig = mix(renderPerformance(melody.map((n, i) => ({ hz: hzOf(n), at: 0.3 + i * 0.6 })), 4.8, SR), quiet(4.8))
    // A 6 ms gap of digital silence 250 ms into every note, like a glitch.
    melody.forEach((_, i) => {
      const at = Math.floor((0.55 + i * 0.6) * SR)
      sig.fill(0, at, at + Math.floor(0.006 * SR))
    })
    expect(names(detect(sig))).toEqual(melody)
  })
})
