// All songs: the built-in library plus the user's own imports (Phase 6).

import { load } from '../app/storage'
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
