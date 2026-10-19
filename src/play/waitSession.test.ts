import { describe, expect, it } from 'vitest'
import { songNotes } from '../songs/song'
import { WaitSession, stars } from './waitSession'

const song = (tab: string) => songNotes({ id: 't', title: 't', difficulty: 'easy', category: '', tags: [], bpm: 100, tab })

describe('WaitSession', () => {
  it('advances only on the right note', () => {
    const s = new WaitSession(song('1 2 3'))
    expect(s.played(62, 0)).toMatchObject({ kind: 'wrong', expected: 60, played: 62 })
    expect(s.index).toBe(0)
    expect(s.played(60, 100)).toMatchObject({ kind: 'correct', index: 0, firstTry: false })
    expect(s.played(62, 200)).toMatchObject({ kind: 'correct', index: 1, firstTry: true })
    expect(s.played(64, 900)).toMatchObject({ kind: 'correct', done: true })
    expect(s.played(64, 1000)).toEqual({ kind: 'ignored' })
  })

  it('handles repeated notes one pluck at a time', () => {
    const s = new WaitSession(song('3 3 3'))
    s.played(64, 0)
    expect(s.index).toBe(1)
    s.played(64, 1)
    s.played(64, 2)
    expect(s.done).toBe(true)
  })

  it('summarises accuracy, mistakes, tricky notes and time', () => {
    const s = new WaitSession(song('1 2 3 2 1'))
    s.played(60, 1000)
    s.played(64, 1100) // wrong on 2
    s.played(65, 1200) // wrong on 2 again
    s.played(62, 1300)
    s.played(64, 1400)
    s.played(60, 1500) // wrong on the second 2
    s.played(62, 1600)
    s.played(60, 3000)
    const sum = s.summary()
    expect(sum).toMatchObject({ total: 5, clean: 3, mistakes: 3, durationMs: 2000 })
    expect(sum.accuracy).toBeCloseTo(0.6)
    expect(sum.tricky).toEqual([{ midi: 62, mistakes: 3 }])
  })

  it('tracks the combo', () => {
    const s = new WaitSession(song('1 2 3 4'))
    s.played(60, 0)
    s.played(62, 0)
    expect(s.combo).toBe(2)
    s.played(60, 0)
    s.played(64, 0)
    expect(s.combo).toBe(0)
    s.played(65, 0)
    expect(s.combo).toBe(1)
  })

  it('gives stars', () => {
    expect([1, 0.95, 0.9, 0.8, 0.5, 0].map(stars)).toEqual([3, 3, 2, 2, 1, 0])
  })
})
