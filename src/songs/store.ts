// All songs: the built-in library plus the user's own imports, which live
// only in this browser (localStorage) and travel via the JSON backup.

import { load, save } from '../app/storage'
import { LIBRARY } from './library'
import type { Song } from './song'

export function userSongs(): Song[] {
  return load<Song[]>('songs', [])
}

export function allSongs(): Song[] {
  return [...LIBRARY.map((s) => ({ ...s, builtIn: true })), ...userSongs()]
}

export function findSong(id: string): Song | undefined {
  return allSongs().find((s) => s.id === id)
}

/** Insert or replace a user song; returns its id. */
export function saveUserSong(song: Song): string {
  const songs = userSongs()
  const id = song.id || `u-${Date.now().toString(36)}`
  const i = songs.findIndex((s) => s.id === id)
  const stored = { ...song, id, builtIn: undefined }
  if (i >= 0) songs[i] = stored
  else songs.push(stored)
  save('songs', songs)
  return id
}

export function deleteUserSong(id: string) {
  save(
    'songs',
    userSongs().filter((s) => s.id !== id),
  )
}

/** Everything personal, for moving between devices. */
export interface Backup {
  app: 'kalimba-coach'
  version: 1
  exportedAt: string
  songs: Song[]
  history: unknown
  favorites: unknown
  calibration: Record<string, unknown>
}

export function makeBackup(calibrationKeys: string[]): Backup {
  const calibration: Record<string, unknown> = {}
  for (const k of calibrationKeys) calibration[k] = load(k, {})
  return {
    app: 'kalimba-coach',
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: userSongs(),
    history: load('history', {}),
    favorites: load('favorites', []),
    calibration,
  }
}

/** Merge a backup in: songs by id (backup wins), favourites unioned, history and calibration only where missing. */
export function restoreBackup(data: unknown): { songs: number } {
  const b = data as Partial<Backup>
  if (!b || b.app !== 'kalimba-coach' || !Array.isArray(b.songs)) throw new Error('not a Kalimba Coach backup')
  const songs = userSongs()
  for (const s of b.songs) {
    if (!s || typeof s.tab !== 'string' || typeof s.title !== 'string') continue
    const i = songs.findIndex((x) => x.id === s.id)
    if (i >= 0) songs[i] = s
    else songs.push(s)
  }
  save('songs', songs)
  save('favorites', [...new Set([...load<string[]>('favorites', []), ...((b.favorites as string[]) ?? [])])])
  save('history', { ...((b.history as object) ?? {}), ...load<object>('history', {}) })
  for (const [k, v] of Object.entries(b.calibration ?? {})) if (Object.keys(load(k, {})).length === 0) save(k, v)
  return { songs: b.songs.length }
}
