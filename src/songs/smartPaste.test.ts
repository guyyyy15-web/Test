import { describe, expect, it } from 'vitest'
import { K17_C } from '../config/tunings'
import { parseTab } from './parse'
import { extractSong } from './smartPaste'

const playable = new Set(K17_C.tines.map((t) => t.midi))
const get = (text: string) => extractSong(text, playable)!
const midis = (tab: string) => parseTab(tab).notes.map((n) => n.midi)

describe('extractSong', () => {
  it('reads a typical tab page: title, headings, notes with lyrics underneath', () => {
    const s = get(`Twinkle Twinkle Little Star - Traditional | Kalimba Tabs

[Verse 1]
1 1 5 5 6 6 5
Twinkle twinkle little star
4 4 3 3 2 2 1
How I wonder what you are`)
    expect(s.title).toBe('Twinkle Twinkle Little Star')
    expect(s.artist).toBe('Traditional')
    expect(s.tab).toBe('1 1 5 5 6 6 5\n4 4 3 3 2 2 1')
    expect(s.lyrics).toEqual(['Twinkle twinkle little star', 'How I wonder what you are'])
    expect(s.skipped).toEqual(['[Verse 1]'])
    expect(s.noteCount).toBe(14)
    expect(s.shift).toBe(0)
  })

  it('splits glued notes and reads dot-above octave marks', () => {
    const s = get('1155665\n1̇ 2̇ 3̇ 1˙ 5°')
    expect(midis(s.tab)).toEqual([60, 60, 67, 67, 69, 69, 67, 72, 74, 76, 72, 79])
  })

  it('reads a double quote as two octave marks', () => {
    expect(midis(get('1" 3"').tab)).toEqual([84, 88])
  })

  it('expands x2 repeats and shares the lyrics', () => {
    const s = get('3 2 1 (x2)\nhot cross buns')
    expect(s.tab.split('\n')).toHaveLength(2)
    expect(s.lyrics).toEqual(['hot cross buns', 'hot cross buns'])
  })

  it('skips chord lines when the melody is in numbers', () => {
    const s = get('C        G\n1 1 5 5 6 6 5\nAm   F   C\n4 4 3 3 2 2 1')
    expect(s.tab).toBe('1 1 5 5 6 6 5\n4 4 3 3 2 2 1')
    expect(s.lyrics).toBeUndefined()
  })

  it('reads letter-notation tabs', () => {
    const s = get('Ode to Joy\nE E F G G F E D\nC C D E E D D')
    expect(s.format).toBe('letters')
    expect(s.noteCount).toBe(15)
  })

  it('handles Hebrew headings and lyrics', () => {
    const s = get('יונתן הקטן\nבית:\n5 3 3 4 2 2\nיונתן הקטן רץ בבוקר אל הגן')
    expect(s.title).toBe('יונתן הקטן')
    expect(s.lyrics).toEqual(['יונתן הקטן רץ בבוקר אל הגן'])
    expect(s.skipped).toEqual(['בית:'])
  })

  it('shifts a tab that sits too low', () => {
    const s = get('5, 1 2 3 5, 5, 1')
    expect(s.shift).toBe(12)
    expect(s.unplayable).toBe(0)
  })

  it('guesses difficulty from length, range and speed', () => {
    expect(get('1 2 3 1 1 2 3 1 3 4 5').difficulty).toBe('easy')
    const long = Array.from({ length: 12 }, () => "1_ 5_ 3'_ 1''_ 7_ 2'_ 6'_ 4_ 3''_ 5'_").join('\n')
    expect(get(long).difficulty).toBe('hard')
  })

  it('returns null when there are no notes at all', () => {
    expect(extractSong('just some words\nand more words', playable)).toBeNull()
  })
})
