import { EQUIPMENT } from './equipment.js'

/**
 * Consumables and key items, plus the single registry the rest of the game
 * looks items up in. Equipment lives in equipment.js and is merged in here so
 * inventory code only ever needs `getItem(id)`.
 *
 * effect.kind: heal | healPercent | healAll | restoreMp | revive | cure |
 *              damageAll | escape | buff
 */

function consumable(id, name, price, effect, extra = {}) {
  return {
    id,
    name,
    kind: 'consumable',
    price,
    effect,
    inBattle: true,
    inField: true,
    ...extra,
  }
}

const CONSUMABLES = [
  consumable('potion', 'Potion', 50, { kind: 'heal', amount: 60, target: 'ally' }, {
    description: 'Restores 60 HP to one ally.',
  }),
  consumable('hi-potion', 'Hi-Potion', 300, { kind: 'heal', amount: 220, target: 'ally' }, {
    description: 'Restores 220 HP to one ally.',
  }),
  consumable('mega-potion', 'Mega Potion', 1200, {
    kind: 'healAll',
    amount: 150,
    target: 'allAllies',
  }, { description: 'Restores 150 HP to the whole party.' }),
  consumable('ether', 'Ether', 400, { kind: 'restoreMp', amount: 35, target: 'ally' }, {
    description: 'Restores 35 MP to one ally.',
  }),
  consumable('elixir', 'Elixir', 5000, { kind: 'healPercent', amount: 100, target: 'ally' }, {
    description: 'Fully restores one ally, HP and MP.',
  }),
  consumable('antidote', 'Antidote', 40, { kind: 'cure', cures: ['poison'], target: 'ally' }),
  consumable('eye-drops', 'Eye Drops', 40, { kind: 'cure', cures: ['blind'], target: 'ally' }),
  consumable('echo-herb', 'Echo Herb', 60, { kind: 'cure', cures: ['silence'], target: 'ally' }),
  consumable('soft', 'Soft', 120, { kind: 'cure', cures: ['stone'], target: 'ally' }),
  consumable('remedy', 'Remedy', 500, {
    kind: 'cure',
    cures: ['poison', 'blind', 'silence', 'sleep', 'paralysis', 'stone', 'slow'],
    target: 'ally',
  }, { description: 'Cures every status a body can hold.' }),
  consumable('phoenix-down', 'Phoenix Down', 500, {
    kind: 'revive',
    revivePercent: 30,
    target: 'deadAlly',
  }, { description: 'Brings back a fallen ally at 30% HP.' }),
  consumable('bomb-fragment', 'Bomb Fragment', 200, {
    kind: 'damageAll',
    power: 45,
    element: 'fire',
    target: 'allEnemies',
  }),
  consumable('frost-shard', 'Frost Shard', 200, {
    kind: 'damageAll',
    power: 45,
    element: 'ice',
    target: 'allEnemies',
  }),
  consumable('smoke-bomb', 'Smoke Bomb', 150, { kind: 'escape', target: 'self' }, {
    inField: false,
    description: 'Guarantees escape from any fight that can be escaped.',
  }),
  consumable('tent', 'Tent', 800, { kind: 'healPercent', amount: 50, target: 'allAllies' }, {
    inBattle: false,
    description: 'Restores half the party’s HP and MP. Cannot be used in battle.',
  }),
]

function keyItem(id, name, description) {
  return { id, name, kind: 'key', price: 0, inBattle: false, inField: false, description }
}

const KEY_ITEMS = [
  keyItem('rusted-key', 'Rusted Key', 'Opens something in the old mine. Probably.'),
  keyItem('sunstone', 'Sunstone', 'Warm even in the dark. One of the four.'),
  keyItem('tidestone', 'Tidestone', 'Beads with water that is not there. One of the four.'),
  keyItem('stormstone', 'Stormstone', 'The hair on your arm stands up. One of the four.'),
  keyItem('earthstone', 'Earthstone', 'Heavier than it has any right to be. One of the four.'),
  keyItem('ember-crown', 'Ember Crown', 'The crown itself. It is lighter than you expected.'),
]

export const CONSUMABLE_ITEMS = Object.fromEntries(CONSUMABLES.map((i) => [i.id, i]))
export const KEY_ITEM_LIST = Object.fromEntries(KEY_ITEMS.map((i) => [i.id, i]))

/** Every item in the game: consumables, key items and equipment. */
export const ITEMS = {
  ...CONSUMABLE_ITEMS,
  ...KEY_ITEM_LIST,
  ...EQUIPMENT,
}

export function getItem(itemId) {
  const item = ITEMS[itemId]
  if (!item) throw new Error(`Unknown item: ${itemId}`)
  return item
}

export function isEquipment(itemId) {
  return ITEMS[itemId]?.kind === 'equipment'
}
