import { parseTab, type ParsedNote } from './parse'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Song {
  id: string
  title: string
  /** Hebrew title, when the song has one people know. */
  titleHe?: string
  artist?: string
  difficulty: Difficulty
  category: string
  tags: string[]
  bpm: number
  /** Beats per bar (default 4). */
  meter?: number
  /** The tab, in number or letter notation; one line per phrase. */
  tab: string
  /** Lyrics per phrase, pasted by the user for their own imported songs. */
  lyrics?: string[]
  /** Semitones to shift the tab to fit the instrument. */
  shift?: number
  /** Other arrangements of the same song, at other difficulties. */
  levels?: SongLevel[]
  /** What this arrangement is, e.g. "the full piece, an octave up". */
  levelNote?: string
  builtIn?: boolean
}

export interface SongLevel {
  difficulty: Difficulty
  tab: string
  bpm?: number
  meter?: number
  note?: string
}

export interface SongNote {
  midi: number
  /** Start, in beats from the beginning. */
  beat: number
  beats: number
  phrase: number
}

/** The playable notes of a song with their positions in beats (rests just take time). */
export function songNotes(song: Song): SongNote[] {
  const { notes } = parseTab(song.tab)
  const out: SongNote[] = []
  let beat = 0
  for (const n of notes as ParsedNote[]) {
    if (n.midi !== null) out.push({ midi: n.midi + (song.shift ?? 0), beat, beats: n.beats, phrase: n.phrase })
    beat += n.beats
  }
  return out
}

const ORDER: Difficulty[] = ['easy', 'medium', 'hard']

/** Every arrangement of a song, easiest first; the song's own tab is one of them. */
export function songLevels(song: Song): SongLevel[] {
  const own: SongLevel = { difficulty: song.difficulty, tab: song.tab, bpm: song.bpm, meter: song.meter, note: song.levelNote }
  return [own, ...(song.levels ?? [])].sort((a, b) => ORDER.indexOf(a.difficulty) - ORDER.indexOf(b.difficulty))
}

/**
 * The song at one difficulty, as a plain Song the game can play. Its id is
 * the history key: the song's own level keeps the bare id (so scores from
 * before levels existed still count), other levels get "id@difficulty".
 */
export function atLevel(song: Song, difficulty?: string): Song {
  const level = song.levels?.find((l) => l.difficulty === difficulty)
  if (!level) return song
  return {
    ...song,
    id: `${song.id}@${level.difficulty}`,
    difficulty: level.difficulty,
    tab: level.tab,
    bpm: level.bpm ?? song.bpm,
    meter: level.meter ?? song.meter,
    levelNote: level.note,
    levels: undefined,
  }
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' }
