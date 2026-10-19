import { beforeEach, describe, expect, it } from 'vitest'
import { allSongs, deleteUserSong, makeBackup, restoreBackup, saveUserSong, userSongs } from './store'

beforeEach(() => {
  const data = new Map<string, string>()
  const shim = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true })
})

const mine = { id: '', title: 'My song', difficulty: 'easy' as const, category: 'שלי', tags: [], bpm: 90, tab: '1 2 3' }

describe('song store', () => {
  it('saves, edits and deletes user songs next to the library', () => {
    const id = saveUserSong(mine)
    expect(allSongs().find((s) => s.id === id)?.title).toBe('My song')
    saveUserSong({ ...mine, id, title: 'Renamed' })
    expect(userSongs()).toHaveLength(1)
    expect(userSongs()[0].title).toBe('Renamed')
    deleteUserSong(id)
    expect(userSongs()).toHaveLength(0)
  })

  it('round-trips a backup and merges by id', () => {
    const id = saveUserSong(mine)
    const backup = JSON.parse(JSON.stringify(makeBackup([])))
    deleteUserSong(id)
    saveUserSong({ ...mine, id: 'other', title: 'Other' })
    expect(restoreBackup(backup)).toEqual({ songs: 1 })
    expect(userSongs().map((s) => s.title).sort()).toEqual(['My song', 'Other'])
  })

  it('rejects files that are not backups', () => {
    expect(() => restoreBackup({ hello: 1 })).toThrow()
    expect(() => restoreBackup(null)).toThrow()
  })
})
