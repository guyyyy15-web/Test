// Turn whatever someone copied from a kalimba-tab website into a song.
//
// Pasted tabs mix many things: a title, "Verse 1:" headings, chord lines,
// lyrics under the notes, "x2" repeats, notes glued together ("1155665"),
// octave dots in several styles. Each line is classified, note lines become
// the tab, the text line right under a note line becomes its lyrics, and
// the rest (title aside) is skipped and reported.

import { UP, parseTab, readToken, suggestShift, tokenize } from './parse'
import type { Difficulty } from './song'

export interface PastedSong {
  title: string
  artist?: string
  /** Normalised tab, one phrase per line. */
  tab: string
  /** Lyrics per phrase ('' where a phrase has none); undefined if no lyrics at all. */
  lyrics?: string[]
  /** Semitones applied so every note fits the instrument (0 if it already did). */
  shift: number
  /** Notes still unplayable after the best shift (none when shift found). */
  unplayable: number
  noteCount: number
  difficulty: Difficulty
  format: 'numbers' | 'letters'
  /** Lines that were neither notes, lyrics nor the title. */
  skipped: string[]
}

const HEADER_RE = /^(intro|outro|verse|chorus|pre-?chorus|bridge|refrain|interlude|ending|part|section|פתיחה|בית|פזמון|מעבר|סיום|גשר|חלק)\b/i
const CHORD_RE = /^[A-G][#b]?(m|maj|min|sus|dim|aug|add|\d|\/)[\w#/]*$/
const REPEAT_RE = /^[x×*](\d)$|^(\d)[x×]$/i
const TITLE_NOISE = /\b(kalimba|tabs?|tutorial|easy|numbers?|letters?|notes?)\b|קלימבה|טאבים?|תווים/gi

type Format = 'numbers' | 'letters'

/** Split glued notes ("1155665", "1'2'3") into separate tokens. */
function unglue(token: string): string[] {
  const glued = new RegExp(`^(?:[0-7][${UP}]*,*){2,}$`)
  if (!glued.test(token)) return [token]
  return token.match(new RegExp(`[0-7][${UP}]*,*`, 'g')) ?? [token]
}

function normalise(line: string): string {
  return line
    .replace(/ /g, ' ')
    .replace(/[“”"]/g, "''") // some sites write two octave marks as a double quote
    .replace(/[–—]/g, '-')
    .trim()
}

interface Classified {
  kind: 'notes' | 'text' | 'header' | 'chords' | 'blank'
  tokens: string[]
  repeat: number
  raw: string
}

function classify(raw: string, format: Format): Classified {
  const line = normalise(raw)
  if (!line) return { kind: 'blank', tokens: [], repeat: 1, raw }
  let repeat = 1
  const tokens = tokenize(line).flatMap(unglue).filter((t) => {
    const m = REPEAT_RE.exec(t)
    if (m) repeat = Number(m[1] ?? m[2])
    return !m
  })
  const notes = tokens.filter((t) => /^-+$/.test(t) || readToken(t, format, 60))
  if (tokens.length && notes.length / tokens.length >= 0.7 && notes.some((t) => !/^-+$/.test(t))) {
    return { kind: 'notes', tokens, repeat, raw }
  }
  if (tokens.length && tokens.every((t) => CHORD_RE.test(t) || readToken(t, 'letters', 60))) return { kind: 'chords', tokens, repeat, raw }
  if (/:\s*$/.test(line) || (HEADER_RE.test(line) && line.split(/\s+/).length <= 4)) return { kind: 'header', tokens, repeat, raw }
  return { kind: 'text', tokens, repeat, raw }
}

function guessDifficulty(midis: number[], beats: number[]): Difficulty {
  const distinct = new Set(midis).size
  let leaps = 0
  for (let i = 1; i < midis.length; i++) if (Math.abs(midis[i] - midis[i - 1]) > 4) leaps++
  const fast = beats.filter((b) => b < 1).length / Math.max(1, beats.length)
  const score = midis.length / 40 + distinct / 6 + (leaps / Math.max(1, midis.length)) * 4 + fast * 3
  return score < 2.6 ? 'easy' : score < 4.2 ? 'medium' : 'hard'
}

/** Read a pasted tab. Returns null when no line looks like notes. */
export function extractSong(text: string, playable: Set<number>): PastedSong | null {
  const lines = text.split(/\r?\n/)
  // Numbers win if any line reads as number notation: then letter-only
  // lines are chord names, not melody.
  const format: Format = lines.some((l) => classify(l, 'numbers').kind === 'notes') ? 'numbers' : 'letters'
  const rows = lines.map((l) => classify(l, format))

  let title = ''
  let artist: string | undefined
  const phrases: string[] = []
  const lyrics: string[] = []
  const skipped: string[] = []
  let lastWasNotes = false

  for (const row of rows) {
    if (row.kind === 'notes') {
      const phrase = row.tokens.join(' ')
      for (let i = 0; i < row.repeat; i++) {
        phrases.push(phrase)
        lyrics.push('')
      }
      lastWasNotes = true
      continue
    }
    if (row.kind === 'text' && lastWasNotes) {
      // Lyrics sit under their notes; a repeated line shares them.
      for (let i = lyrics.length - 1; i >= 0 && lyrics[i] === '' && phrases[i] === phrases[phrases.length - 1]; i--) lyrics[i] = row.raw.trim()
      lastWasNotes = false
      continue
    }
    if (row.kind === 'text' && !phrases.length && !title) {
      ;[title, artist] = splitTitle(row.raw)
      continue
    }
    if (row.kind !== 'blank') skipped.push(row.raw.trim())
    if (row.kind !== 'blank') lastWasNotes = false
  }
  if (!phrases.length) return null

  const tab = phrases.join('\n')
  const parsed = parseTab(tab).notes
  const shift = suggestShift(parsed, playable)
  const applied = shift ?? 0
  const sounding = parsed.filter((n) => n.midi !== null)
  const unplayable = shift === null ? sounding.filter((n) => !playable.has(n.midi! + applied)).length : 0
  return {
    title: title || 'שיר חדש',
    artist,
    tab,
    lyrics: lyrics.some(Boolean) ? lyrics : undefined,
    shift: applied,
    unplayable,
    noteCount: sounding.length,
    difficulty: guessDifficulty(
      sounding.map((n) => n.midi!),
      sounding.map((n) => n.beats),
    ),
    format,
    skipped,
  }
}

/** "Song – Artist", "Song by Artist", "Artist: Song"… minus tab-site noise. */
function splitTitle(raw: string): [string, string | undefined] {
  const clean = raw.replace(TITLE_NOISE, '').replace(/[()[\]|]/g, ' ').replace(/\s+/g, ' ').replace(/[\s\-–—:]+$/, '').trim()
  const m = /^(.+?)\s+(?:-|–|—|by)\s+(.+)$/i.exec(clean)
  return m ? [m[1].trim(), m[2].trim()] : [clean, undefined]
}
