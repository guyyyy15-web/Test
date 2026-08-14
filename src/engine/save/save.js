import { SAVE_VERSION, createNewGameState } from '../game.js'

/**
 * Save serialization and migration.
 *
 * Pure: no storage, no clock. The browser adapter (src/ui/save/slots.js) owns
 * localStorage and supplies the timestamp, which keeps this module testable
 * and keeps the engine free of both.
 *
 * The save IS the game state, minus the handful of fields that only make
 * sense in the moment. Saving is only offered in towns and on the world map,
 * so an in-progress battle is never something that needs preserving.
 */

const TRANSIENT_KEYS = ['battle', 'notice']

export function serialize(state, { savedAt = 0 } = {}) {
  const data = { ...state }
  for (const key of TRANSIENT_KEYS) delete data[key]
  return { ...data, version: SAVE_VERSION, savedAt }
}

export class SaveError extends Error {}

/**
 * Migrations run oldest-first. Each one takes the previous shape and returns
 * the next, so a save from any released version can be walked forward.
 */
const MIGRATIONS = {
  // 0 -> 1 exists to prove the path works and to catch pre-versioned saves.
  0: (data) => ({ ...data, version: 1 }),
}

export function migrate(data) {
  let current = { ...data }
  let version = Number(current.version ?? 0)

  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version]
    if (!step) throw new SaveError(`No migration from save version ${version}`)
    current = step(current)
    const next = Number(current.version ?? version + 1)
    if (next <= version) throw new SaveError(`Migration from ${version} did not advance`)
    version = next
  }

  return current
}

const REQUIRED_KEYS = ['party', 'inventory', 'gold', 'flags', 'rngState']

export function deserialize(raw) {
  if (!raw || typeof raw !== 'object') throw new SaveError('Save data is not an object')
  if (Number(raw.version ?? 0) > SAVE_VERSION) {
    throw new SaveError('Save was written by a newer version of the game')
  }

  const data = migrate(raw)

  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) throw new SaveError(`Save is missing "${key}"`)
  }
  if (!Array.isArray(data.party) || data.party.length === 0) {
    throw new SaveError('Save has no party')
  }

  // Fill in anything a newer build added, then let the save win.
  return { ...createNewGameState(data.rngState), ...data, battle: null, notice: null }
}

/** One-line summary for the save slot list. */
export function describeSave(data) {
  if (!data) return null
  return {
    version: data.version,
    savedAt: data.savedAt ?? 0,
    playtimeMs: data.playtimeMs ?? 0,
    gold: data.gold ?? 0,
    party: (data.party ?? []).map((member) => ({
      name: member.name,
      classId: member.classId,
      level: member.level,
    })),
    location: data.location ?? null,
  }
}
