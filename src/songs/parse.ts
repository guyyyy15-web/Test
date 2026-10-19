// Parses kalimba tabs as people write them online.
//
// Number notation (1 = C4 on a C kalimba):
//   1 2 3 | 4 5 6 7        bars are just visual
//   1' 1° 1* 1• 1^         one octave up (repeat the mark for more: 1'')
//   1,                     one octave down
//   5-  5--                held 2 / 3 beats ("-" adds a beat; a lone "-" extends the previous note)
//   5_  5.                 half a beat / dotted (×1.5)
//   0                      a rest
// Letter notation: C D E F G A B, with an octave digit (C4, E5), marks (C'),
// accidentals (F#, Bb) and the same duration suffixes.
// Each line is a phrase.

export interface ParsedNote {
  /** MIDI note, or null for a rest. */
  midi: number | null
  beats: number
  /** Zero-based line (phrase) the note came from. */
  phrase: number
  token: string
}

export interface ParseResult {
  notes: ParsedNote[]
  /** Tokens that could not be read, with their phrase. */
  unknown: { token: string; phrase: number }[]
  format: 'numbers' | 'letters'
}

const DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const UP = "'’°*•^"

const NUMBER_RE = new RegExp(`^([0-7])([${UP}]*)(,*)([-_.]*)$`)
const LETTER_RE = new RegExp(`^([A-Ga-g])([#b♯♭]?)(\\d)?([${UP}]*)(,*)([-_.]*)$`)

function duration(suffix: string): number {
  let beats = 1
  for (const ch of suffix) {
    if (ch === '-') beats += 1
    else if (ch === '_') beats /= 2
    else if (ch === '.') beats *= 1.5
  }
  return beats
}

function tokenize(line: string): string[] {
  return line
    .replace(/[()[\]{}]/g, ' ')
    .split(/[\s|]+/)
    .filter(Boolean)
}

/** Read one token in a format; null if it is not that format. */
function readToken(token: string, format: ParseResult['format'], tonic: number): { midi: number | null; beats: number } | null {
  if (format === 'numbers') {
    const m = NUMBER_RE.exec(token)
    if (!m) return null
    const beats = duration(m[4])
    if (m[1] === '0') return { midi: null, beats }
    return { midi: tonic + DEGREE_SEMITONES[Number(m[1]) - 1] + 12 * (m[2].length - m[3].length), beats }
  }
  const m = LETTER_RE.exec(token)
  if (!m) return null
  const accidental = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0
  const octave = m[3] !== undefined ? Number(m[3]) : 4
  const midi = (octave + 1) * 12 + LETTER_SEMITONES[m[1].toUpperCase()] + accidental + 12 * (m[4].length - m[5].length)
  return { midi, beats: duration(m[6]) }
}

/**
 * Parse a tab. `tonic` is the MIDI note of "1" (60 = C4 for a C kalimba).
 * The format is detected from which reading explains more tokens.
 */
export function parseTab(text: string, tonic = 60): ParseResult {
  const lines = text.split(/\r?\n/).map(tokenize).filter((l) => l.length)
  const all = lines.flat().filter((t) => !/^-+$/.test(t))
  const score = (f: ParseResult['format']) => all.filter((t) => readToken(t, f, tonic)).length
  const format: ParseResult['format'] = score('letters') > score('numbers') ? 'letters' : 'numbers'

  const notes: ParsedNote[] = []
  const unknown: ParseResult['unknown'] = []
  lines.forEach((tokens, phrase) => {
    for (const token of tokens) {
      if (/^-+$/.test(token)) {
        const prev = notes[notes.length - 1]
        if (prev) prev.beats += token.length
        continue
      }
      const read = readToken(token, format, tonic)
      if (read) notes.push({ ...read, phrase, token })
      else unknown.push({ token, phrase })
    }
  })
  return { notes, unknown, format }
}

/** Notes (by index) that the instrument cannot play. */
export function outOfRange(notes: ParsedNote[], playable: Set<number>): number[] {
  return notes.flatMap((n, i) => (n.midi !== null && !playable.has(n.midi) ? [i] : []))
}

/**
 * The smallest shift (in semitones) that makes every note playable,
 * preferring whole octaves. Null if none works.
 */
export function suggestShift(notes: ParsedNote[], playable: Set<number>): number | null {
  const fits = (shift: number) => notes.every((n) => n.midi === null || playable.has(n.midi + shift))
  for (const shift of [0, 12, -12, 24, -24]) if (fits(shift)) return shift
  const others = Array.from({ length: 47 }, (_, i) => i - 23).sort((a, b) => Math.abs(a) - Math.abs(b) || b - a)
  for (const shift of others) if (fits(shift)) return shift
  return null
}
