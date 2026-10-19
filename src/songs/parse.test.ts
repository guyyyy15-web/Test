import { describe, expect, it } from 'vitest'
import { K17_C } from '../config/tunings'
import { outOfRange, parseTab, suggestShift } from './parse'

const playable = new Set(K17_C.tines.map((t) => t.midi))
const midis = (text: string) => parseTab(text).notes.map((n) => n.midi)

describe('parseTab: numbers', () => {
  it('reads degrees in C with 1 = C4', () => {
    expect(midis('1 2 3 4 5 6 7')).toEqual([60, 62, 64, 65, 67, 69, 71])
  })

  it('reads every common high-octave mark and low commas', () => {
    expect(midis("1' 1° 1* 1• 1^ 1'' 1,")).toEqual([72, 72, 72, 72, 72, 84, 48])
  })

  it('reads durations', () => {
    const beats = parseTab('5 5- 5-- 5_ 5. 5 - -').notes.map((n) => n.beats)
    expect(beats).toEqual([1, 2, 3, 0.5, 1.5, 3])
  })

  it('treats lines as phrases and ignores bars', () => {
    const r = parseTab('1 1 5 5 | 6 6 5\n4 4 3 3 | 2 2 1')
    expect(r.notes.map((n) => n.phrase)).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1])
    expect(r.unknown).toEqual([])
  })

  it('reads rests and reports junk', () => {
    const r = parseTab('1 0 2 x9')
    expect(r.notes.map((n) => n.midi)).toEqual([60, null, 62])
    expect(r.unknown.map((u) => u.token)).toEqual(['x9'])
  })
})

describe('parseTab: letters', () => {
  it('detects letter notation and reads octaves', () => {
    const r = parseTab('C D E F G\nC4 D4 E5 C\' D\'')
    expect(r.format).toBe('letters')
    expect(r.notes.map((n) => n.midi)).toEqual([60, 62, 64, 65, 67, 60, 62, 76, 72, 74])
  })

  it('reads accidentals (which a C kalimba cannot play)', () => {
    expect(midis('F# Bb C#5')).toEqual([66, 70, 73])
    expect(outOfRange(parseTab('C F# G').notes, playable)).toEqual([1])
  })
})

describe('fitting to the instrument', () => {
  it('accepts a song already in range', () => {
    expect(suggestShift(parseTab('1 2 3 1\'').notes, playable)).toBe(0)
  })

  it('suggests an octave when the song sits too low', () => {
    expect(suggestShift(parseTab('5, 1 2 3').notes, playable)).toBe(12)
  })

  it('suggests a key change when no octave works', () => {
    // D major scale: F# and C# are not on a C kalimba; a whole tone down is C major.
    const notes = parseTab('D E F# G A B C#5 D5').notes
    expect(suggestShift(notes, playable)).toBe(-2)
  })
})
