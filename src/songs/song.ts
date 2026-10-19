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
  builtIn?: boolean
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

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' }
