import { deserialize, describeSave, serialize } from '../../engine/save/save.js'

/**
 * The browser side of saving: localStorage and the clock.
 *
 * Kept out of src/engine on purpose -- the engine is not allowed to touch
 * storage or Date.now, and this is where both live.
 */

export const SLOT_COUNT = 3
const KEY_PREFIX = 'emberCrown.save.'

const keyFor = (slot) => `${KEY_PREFIX}${slot}`

function storage() {
  try {
    // Private-mode Safari and some embeds throw on access rather than on use.
    const probe = window.localStorage
    probe.getItem(KEY_PREFIX)
    return probe
  } catch {
    return null
  }
}

export function writeSlot(slot, state) {
  const store = storage()
  if (!store) return { ok: false, reason: 'Storage is unavailable in this browser.' }

  try {
    store.setItem(keyFor(slot), JSON.stringify(serialize(state, { savedAt: Date.now() })))
    return { ok: true }
  } catch {
    return { ok: false, reason: 'There was no room to write the save.' }
  }
}

export function readSlot(slot) {
  const store = storage()
  if (!store) return null

  const raw = store.getItem(keyFor(slot))
  if (!raw) return null

  try {
    return deserialize(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Slot summaries for the load menu. Corrupt slots come back as `corrupt`. */
export function listSlots() {
  const store = storage()

  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const slot = index + 1
    if (!store) return { slot, empty: true }

    const raw = store.getItem(keyFor(slot))
    if (!raw) return { slot, empty: true }

    try {
      return { slot, empty: false, summary: describeSave(deserialize(JSON.parse(raw))) }
    } catch {
      return { slot, empty: false, corrupt: true }
    }
  })
}

export function deleteSlot(slot) {
  storage()?.removeItem(keyFor(slot))
}

export function hasAnySave() {
  return listSlots().some((entry) => !entry.empty)
}
