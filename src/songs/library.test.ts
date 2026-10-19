import { describe, expect, it } from 'vitest'
import { K17_C } from '../config/tunings'
import { LIBRARY } from './library'
import { outOfRange, parseTab } from './parse'
import { atLevel, songLevels, songNotes } from './song'

const playable = new Set(K17_C.tines.map((t) => t.midi))

describe('built-in library', () => {
  it('has unique ids', () => {
    expect(new Set(LIBRARY.map((s) => s.id)).size).toBe(LIBRARY.length)
  })

  for (const song of LIBRARY) {
    for (const level of songLevels(song)) {
      it(`${song.title} (${level.difficulty}) parses cleanly and fits the 17 tines`, () => {
        const r = parseTab(level.tab)
        expect(r.format).toBe('numbers')
        expect(r.unknown).toEqual([])
        expect(outOfRange(r.notes, playable)).toEqual([])
        expect(songNotes(atLevel(song, level.difficulty)).length).toBeGreaterThan(10)
      })
    }

    it(`${song.title} has at most one arrangement per difficulty`, () => {
      const ds = songLevels(song).map((l) => l.difficulty)
      expect(new Set(ds).size).toBe(ds.length)
    })
  }

  it('keeps the bare id for a song\'s own level and suffixes the others', () => {
    const ode = LIBRARY.find((s) => s.id === 'ode-to-joy')!
    expect(atLevel(ode, 'easy').id).toBe('ode-to-joy')
    expect(atLevel(ode, 'hard').id).toBe('ode-to-joy@hard')
    expect(atLevel(ode, 'hard').tab).not.toBe(ode.tab)
  })

  it('matches the spec openings', () => {
    const degrees = (id: string, n: number) =>
      songNotes(LIBRARY.find((s) => s.id === id)!)
        .slice(0, n)
        .map((x) => [0, 2, 4, 5, 7, 9, 11].indexOf((x.midi - 60) % 12) + 1)
        .join(' ')
    expect(degrees('yonatan', 13)).toBe('5 3 3 4 2 2 1 2 3 4 5 5 5')
    expect(degrees('twinkle', 14)).toBe('1 1 5 5 6 6 5 4 4 3 3 2 2 1')
    expect(degrees('ode-to-joy', 15)).toBe('3 3 4 5 5 4 3 2 1 1 2 3 3 2 2')
  })
})
