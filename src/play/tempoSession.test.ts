import { describe, expect, it } from 'vitest'
import { songNotes } from '../songs/song'
import { TempoSession } from './tempoSession'

const notes = (tab: string) => songNotes({ id: 't', title: 't', difficulty: 'easy', category: '', tags: [], bpm: 60, tab })

describe('TempoSession', () => {
  // 60 BPM: one beat per second, beat 0 at t=1000.
  const make = (tab = '1 2 3 4') => new TempoSession(notes(tab), { bpm: 60, startTime: 1000 })

  it('scores on-time, early and late plucks', () => {
    const s = make()
    expect(s.played(60, 1030)).toMatchObject({ kind: 'hit', index: 0, timing: 'perfect', offsetMs: 30 })
    expect(s.played(62, 1820)).toMatchObject({ kind: 'hit', index: 1, timing: 'early', offsetMs: -180 })
    expect(s.played(64, 3200)).toMatchObject({ kind: 'hit', index: 2, timing: 'late' })
    expect(s.timingCounts()).toEqual({ perfect: 1, early: 1, late: 1 })
  })

  it('marks notes nobody played as missed once their window closes', () => {
    const s = make()
    s.update(1200)
    expect(s.isMissed(0)).toBe(false)
    s.update(1400)
    expect(s.isMissed(0)).toBe(true)
    expect(s.newlyMissed).toEqual([0])
  })

  it('counts a wrong tine inside a window as a mistake on that note', () => {
    const s = make()
    expect(s.played(67, 1010)).toMatchObject({ kind: 'wrong', index: 0, expected: 60 })
    expect(s.played(60, 1050)).toMatchObject({ kind: 'hit', index: 0 })
    expect(s.combo).toBe(0)
  })

  it('treats a pluck far from any note as a stray', () => {
    const s = make()
    expect(s.played(60, 1600)).toEqual({ kind: 'stray', played: 60 })
  })

  it('matches repeated notes to the nearest one', () => {
    // Notes at 0, 500, 1000 and 1500 ms; both windows overlap at 260.
    const s = new TempoSession(notes('3_ 3_ 3_ 3_'), { bpm: 60, startTime: 0, windowMs: 300 })
    expect(s.played(64, 260)).toMatchObject({ kind: 'hit', index: 1 })
    expect(s.played(64, 990)).toMatchObject({ kind: 'hit', index: 2 })
    expect(s.isMissed(0)).toBe(true)
  })

  it('summarises accuracy, mistakes and mean timing', () => {
    const s = make()
    s.played(60, 1040)
    s.played(62, 2060)
    s.update(3500) // note 3 missed
    s.played(65, 3980)
    s.update(6000)
    const sum = s.summary()
    expect(sum).toMatchObject({ total: 4, clean: 3, mistakes: 1 })
    expect(sum.accuracy).toBeCloseTo(0.75)
    expect(sum.avgOffsetMs).toBeCloseTo((40 + 60 - 20) / 3)
    expect(sum.tricky).toEqual([{ midi: 64, mistakes: 1 }])
    expect(s.done(6000)).toBe(true)
  })
})
