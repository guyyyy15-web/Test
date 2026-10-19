import { load, save } from '../app/storage'

export interface SongHistory {
  /** Best accuracy (0–1) per mode. */
  best: { wait?: number; tempo?: number }
  lastPlayed: string
  plays: number
}

type HistoryMap = Record<string, SongHistory>

export function getHistory(songId: string): SongHistory | null {
  return load<HistoryMap>('history', {})[songId] ?? null
}

/** Record a finished play; returns whether it beat the previous best. */
export function recordPlay(songId: string, mode: 'wait' | 'tempo', accuracy: number): boolean {
  const all = load<HistoryMap>('history', {})
  const h = all[songId] ?? { best: {}, lastPlayed: '', plays: 0 }
  const prev = h.best[mode]
  const isBest = prev === undefined || accuracy > prev
  if (isBest) h.best[mode] = accuracy
  h.lastPlayed = new Date().toISOString()
  h.plays++
  all[songId] = h
  save('history', all)
  return isBest
}

export function getFavorites(): Set<string> {
  return new Set(load<string[]>('favorites', []))
}

export function toggleFavorite(songId: string): boolean {
  const favs = getFavorites()
  const on = !favs.has(songId)
  if (on) favs.add(songId)
  else favs.delete(songId)
  save('favorites', [...favs])
  return on
}
