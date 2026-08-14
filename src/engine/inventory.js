import { getClass } from '../data/classes.js'
import { getItem, isEquipment } from '../data/items.js'
import { clampVitals } from './stats.js'

/**
 * The party inventory: an ordered array of `{ id, qty }`.
 *
 * Ordered rather than keyed, because the item menu shows things in the order
 * you acquired them -- and because a stable order makes save diffs readable.
 * Every function returns a new array; nothing here mutates.
 */

export const MAX_STACK = 99

export function countItem(inventory, itemId) {
  return inventory.find((entry) => entry.id === itemId)?.qty ?? 0
}

export function hasItem(inventory, itemId, qty = 1) {
  return countItem(inventory, itemId) >= qty
}

export function addItem(inventory, itemId, qty = 1) {
  if (qty <= 0) return inventory
  getItem(itemId) // throws early on a typo'd id in content data

  const index = inventory.findIndex((entry) => entry.id === itemId)
  if (index === -1) return [...inventory, { id: itemId, qty: Math.min(qty, MAX_STACK) }]

  const next = inventory.slice()
  next[index] = { ...next[index], qty: Math.min(MAX_STACK, next[index].qty + qty) }
  return next
}

export function removeItem(inventory, itemId, qty = 1) {
  const index = inventory.findIndex((entry) => entry.id === itemId)
  if (index === -1) return inventory

  const remaining = inventory[index].qty - qty
  if (remaining > 0) {
    const next = inventory.slice()
    next[index] = { ...next[index], qty: remaining }
    return next
  }
  return inventory.filter((_, i) => i !== index)
}

/** Inventory entries expanded with their item definition, for menus. */
export function describeInventory(inventory, filter) {
  return inventory
    .map((entry) => ({ ...entry, item: getItem(entry.id) }))
    .filter((entry) => (filter ? filter(entry.item, entry) : true))
}

// ------------------------------------------------------------ Equipment --

export function canEquip(character, itemId) {
  if (!isEquipment(itemId)) return false
  const item = getItem(itemId)
  if (item.slot === 'accessory') return true

  const classDef = getClass(character.classId)
  const allowed = classDef.equip?.[item.slot] ?? []
  return allowed.includes(item.tag)
}

/**
 * Equip from the inventory, returning both halves of the swap. Anything that
 * was already in the slot goes back into the bag -- equipment is never
 * destroyed, which is one less way to strand a player.
 */
export function equipItem(character, inventory, itemId) {
  if (!canEquip(character, itemId)) return { character, inventory, equipped: false }
  if (!hasItem(inventory, itemId)) return { character, inventory, equipped: false }

  const item = getItem(itemId)
  const previous = character.equipment?.[item.slot] ?? null

  let nextInventory = removeItem(inventory, itemId, 1)
  if (previous) nextInventory = addItem(nextInventory, previous, 1)

  const nextCharacter = clampVitals({
    ...character,
    equipment: { ...character.equipment, [item.slot]: itemId },
  })

  return { character: nextCharacter, inventory: nextInventory, equipped: true }
}

export function unequipSlot(character, inventory, slot) {
  const current = character.equipment?.[slot]
  if (!current) return { character, inventory, changed: false }

  return {
    character: clampVitals({
      ...character,
      equipment: { ...character.equipment, [slot]: null },
    }),
    inventory: addItem(inventory, current, 1),
    changed: true,
  }
}

/** Everything in the bag this character could put in this slot. */
export function equippableFor(character, inventory, slot) {
  return describeInventory(
    inventory,
    (item) => item.kind === 'equipment' && item.slot === slot,
  ).filter((entry) => canEquip(character, entry.id))
}

// ---------------------------------------------------------------- Shops --

export const SELL_RATE = 0.5

export function sellPrice(itemId) {
  return Math.floor(getItem(itemId).price * SELL_RATE)
}

export function buy(state, itemId, qty = 1) {
  const cost = getItem(itemId).price * qty
  if (cost > state.gold) return state
  return {
    ...state,
    gold: state.gold - cost,
    inventory: addItem(state.inventory, itemId, qty),
  }
}

export function sell(state, itemId, qty = 1) {
  if (!hasItem(state.inventory, itemId, qty)) return state
  if (getItem(itemId).kind === 'key') return state
  return {
    ...state,
    gold: state.gold + sellPrice(itemId) * qty,
    inventory: removeItem(state.inventory, itemId, qty),
  }
}
