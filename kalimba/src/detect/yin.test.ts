import { describe, expect, it } from 'vitest'
import { K17_C, midiToHz } from '../config/tunings'
import { centsBetween, snapToTine } from './snap'
import { mix, noise, renderTone } from './synth'
import { createYin, rmsDb } from './yin'

const SR = 48000
const N = 2048
const yin = createYin(N, { sampleRate: SR, minHz: 220, maxHz: 1500, threshold: 0.15 })

describe('YIN on synthetic kalimba tones', () => {
  for (const tine of K17_C.tines) {
    it(`finds ${tine.note} and snaps to tine ${tine.pos}`, () => {
      const hz = midiToHz(tine.midi)
      // A weak inharmonic upper partial, like a real tine (~5.4–6× fundamental).
      const frame = renderTone({ hz, partials: [[5.6, 0.2]] }, SR, N)
      const est = yin(frame)
      expect(est.hz).not.toBeNull()
      expect(Math.abs(centsBetween(est.hz!, hz))).toBeLessThan(5)
      expect(est.confidence).toBeGreaterThan(0.85)
      expect(snapToTine(est.hz!, K17_C.tines)?.tine.pos).toBe(tine.pos)
    })
  }

  for (const ratio of [5.4, 5.9, 6.3]) {
    it(`is within 3 cents with a strong ${ratio}× partial on every tine`, () => {
      for (const tine of K17_C.tines) {
        const hz = midiToHz(tine.midi)
        const est = yin(renderTone({ hz, partials: [[ratio, 0.5]] }, SR, N))
        expect(Math.abs(centsBetween(est.hz!, hz)), tine.note).toBeLessThan(3)
      }
    })
  }

  it('stays on the fundamental when the 2nd harmonic is strong', () => {
    const hz = midiToHz(60)
    const est = yin(renderTone({ hz, partials: [[2, 0.8]] }, SR, N))
    expect(Math.abs(centsBetween(est.hz!, hz))).toBeLessThan(5)
  })

  it('reports no pitch for noise', () => {
    const est = yin(noise(N, 0.3))
    expect(est.hz).toBeNull()
  })

  it('still finds the pitch with mild background noise', () => {
    const hz = midiToHz(67)
    const est = yin(mix(renderTone({ hz }, SR, N), noise(N, 0.03)))
    expect(Math.abs(centsBetween(est.hz!, hz))).toBeLessThan(10)
  })
})

describe('snapToTine', () => {
  it('rejects notes that are not on the instrument', () => {
    expect(snapToTine(midiToHz(61), K17_C.tines)).toBeNull() // C#4
    expect(snapToTine(100, K17_C.tines)).toBeNull()
  })

  it('reports signed cents', () => {
    const s = snapToTine(midiToHz(69) * Math.pow(2, 20 / 1200), K17_C.tines)
    expect(s?.tine.note).toBe('A4')
    expect(s!.cents).toBeCloseTo(20, 1)
  })
})

describe('rmsDb', () => {
  it('is about −3 dB for a full-scale sine', () => {
    expect(rmsDb(renderTone({ hz: 440, amp: 1, decay: 1e9 }, SR, N))).toBeCloseTo(-3.01, 1)
  })
})
