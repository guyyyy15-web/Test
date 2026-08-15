import { STARTING_EQUIPMENT } from './progression.js'
import { getItem } from './items.js'
import { createCharacter } from '../engine/character.js'
import { canEquip } from '../engine/inventory.js'

/**
 * What a player's party plausibly looks like at a given level.
 *
 * The single source of truth for both the balance tests and tools/sim.js. It
 * exists because measuring a level 34 party in the rusted sword they started
 * with produces numbers describing a game nobody will play -- gear is half the
 * power curve, and leaving it out makes the late game look far harder than it
 * is. That mistake has now been made twice, once in each tool, which is why it
 * lives in one place.
 */

const GEAR_TIERS = [
  {
    level: 1,
    items: ['rusted-sword', 'knife', 'oak-staff', 'ash-rod', 'leather-armor', 'cloth-robe'],
  },
  {
    level: 6,
    items: [
      'bronze-sword', 'bronze-dagger', 'hand-axe', 'short-spear', 'short-bow', 'iron-claw',
      'silver-staff', 'ember-rod', 'bronze-plate', 'studded-leather', 'silk-robe',
      'buckler', 'leather-cap', 'bronze-helm', 'silk-hood',
    ],
  },
  {
    level: 13,
    items: [
      'iron-sword', 'iron-dagger', 'battle-axe', 'war-lance', 'hunter-bow', 'tiger-claw',
      'iron-plate', 'chain-vest', 'mage-robe', 'iron-shield', 'iron-helm', 'mage-hat',
      'feather-cap', 'power-band',
    ],
  },
  {
    level: 21,
    items: [
      'silver-sword', 'assassin-dagger', 'great-axe', 'dragon-lance', 'elven-bow',
      'dragon-claw', 'sage-staff', 'arcane-rod', 'war-hammer', 'mythril-plate',
      'mythril-shield', 'mythril-helm', 'guard-charm',
    ],
  },
  { level: 30, items: ['flame-sword', 'venom-fang', 'dragon-plate', 'aegis', 'ribbon'] },
  { level: 36, items: ['crown-blade'] },
]

export const REFERENCE_CLASSES = ['warrior', 'whiteMage', 'blackMage', 'monk']

function itemPower(item) {
  const stats = Object.values(item.stats ?? {}).reduce((total, value) => total + value, 0)
  return (item.atk ?? 0) + (item.def ?? 0) + (item.mdef ?? 0) * 0.5 + stats * 2
}

export function gearFor(character, level) {
  const pool = GEAR_TIERS.filter((tier) => tier.level <= level).flatMap((tier) => tier.items)
  const equipment = {}

  for (const slot of ['weapon', 'offhand', 'head', 'body', 'accessory']) {
    const best = pool
      .filter((itemId) => getItem(itemId).slot === slot && canEquip(character, itemId))
      .sort((a, b) => itemPower(getItem(b)) - itemPower(getItem(a)))[0]
    if (best) equipment[slot] = best
  }

  return equipment
}

export function buildReferenceParty(level, classIds = REFERENCE_CLASSES) {
  return classIds.map((classId, index) => {
    const bare = createCharacter({
      id: `hero-${index}`,
      name: classId,
      classId,
      level,
      equipment: STARTING_EQUIPMENT[classId],
    })
    // The Monk is the exception: bare hands beat every claw in the game past
    // the opening hours, so leaving the weapon slot empty is correct play.
    const equipment = gearFor(bare, level)
    if (bare.classId === 'monk' || bare.classId === 'master') delete equipment.weapon
    return createCharacter({ id: bare.id, name: bare.name, classId, level, equipment })
  })
}

/** A plausible bag for that point in the game -- players hoard curatives. */
export function stockFor(level) {
  if (level >= 28) return [{ id: 'elixir', qty: 2 }, { id: 'hi-potion', qty: 12 }]
  if (level >= 16) return [{ id: 'hi-potion', qty: 10 }]
  if (level >= 8) return [{ id: 'hi-potion', qty: 4 }, { id: 'potion', qty: 8 }]
  return [{ id: 'potion', qty: 8 }]
}
