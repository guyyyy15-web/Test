/**
 * Weapons and armour.
 *
 * Authored through small builders rather than hand-written object literals:
 * a weapon is one line, so adding a whole shop's stock is a five-line diff
 * and the balance numbers sit in a column you can read down.
 *
 * `tag` is what class `equip` lists match against (see data/classes.js).
 * Slots: weapon, offhand, head, body, accessory.
 */

function weapon(id, name, tag, price, atk, extra = {}) {
  return { id, name, kind: 'equipment', slot: 'weapon', tag, price, atk, ...extra }
}

function armor(id, name, slot, tag, price, def, extra = {}) {
  return { id, name, kind: 'equipment', slot, tag, price, def, ...extra }
}

function accessory(id, name, price, extra = {}) {
  return {
    id,
    name,
    kind: 'equipment',
    slot: 'accessory',
    tag: 'accessory',
    price,
    ...extra,
  }
}

const WEAPONS = [
  // Swords -- Warrior, Thief, Red Mage.
  weapon('rusted-sword', 'Rusted Sword', 'sword', 50, 4, {
    description: 'Notched, pitted, and better than your fists.',
  }),
  weapon('bronze-sword', 'Bronze Sword', 'sword', 200, 8),
  weapon('iron-sword', 'Iron Sword', 'sword', 620, 14),
  weapon('silver-sword', 'Silver Sword', 'sword', 1800, 22, {
    element: 'holy',
    description: 'Undead recoil from the shine.',
  }),
  weapon('flame-sword', 'Flame Sword', 'sword', 4500, 30, {
    element: 'fire',
    description: 'The blade never quite goes out.',
  }),
  weapon('crown-blade', 'Crown Blade', 'sword', 12000, 42, {
    element: 'holy',
    crit: 8,
    description: 'Forged for a king who never got to draw it.',
  }),

  // Daggers -- fast, low damage, everyone can hold one.
  weapon('knife', 'Knife', 'dagger', 30, 3, { crit: 3 }),
  weapon('bronze-dagger', 'Bronze Dagger', 'dagger', 120, 6, { crit: 3 }),
  weapon('iron-dagger', 'Iron Dagger', 'dagger', 400, 10, { crit: 4 }),
  weapon('assassin-dagger', 'Assassin Dagger', 'dagger', 1500, 18, {
    crit: 14,
    accuracy: 4,
    description: 'Finds the seam in any armour.',
  }),
  weapon('venom-fang', 'Venom Fang', 'dagger', 3800, 24, {
    crit: 10,
    inflicts: { status: 'poison', chance: 30 },
    description: 'Still wet, somehow.',
  }),

  // Axes -- Warrior only. Heavy hitting, poor accuracy.
  weapon('hand-axe', 'Hand Axe', 'axe', 260, 9, { accuracy: -4 }),
  weapon('battle-axe', 'Battle Axe', 'axe', 900, 16, { accuracy: -5 }),
  weapon('great-axe', 'Great Axe', 'axe', 3200, 26, { accuracy: -7, crit: 6 }),

  // Spears -- Warrior. Middle ground.
  weapon('short-spear', 'Short Spear', 'spear', 300, 10),
  weapon('war-lance', 'War Lance', 'spear', 1100, 18),
  weapon('dragon-lance', 'Dragon Lance', 'spear', 3600, 28, {
    element: 'lightning',
    description: 'Cut from something that used to fly.',
  }),

  // Bows -- Thief.
  weapon('short-bow', 'Short Bow', 'bow', 220, 7, { accuracy: 6 }),
  weapon('hunter-bow', 'Hunter Bow', 'bow', 700, 13, { accuracy: 6 }),
  weapon('elven-bow', 'Elven Bow', 'bow', 2400, 21, { accuracy: 10, crit: 6 }),

  // Claws -- Monk. Adds to already-formidable bare hands.
  weapon('iron-claw', 'Iron Claw', 'claw', 300, 6, { crit: 5 }),
  weapon('tiger-claw', 'Tiger Claw', 'claw', 1200, 12, { crit: 8 }),
  weapon('dragon-claw', 'Dragon Claw', 'claw', 4000, 20, { crit: 12 }),

  // Staves and rods -- casters. Weak swings, real magic bonuses.
  weapon('oak-staff', 'Oak Staff', 'staff', 80, 4),
  weapon('silver-staff', 'Silver Staff', 'staff', 500, 9, { stats: { int: 2 } }),
  weapon('sage-staff', 'Sage Staff', 'staff', 2200, 15, { stats: { int: 5 }, mdef: 4 }),
  weapon('war-hammer', 'War Hammer', 'hammer', 2600, 20, { accuracy: -3 }),
  weapon('ash-rod', 'Ash Rod', 'rod', 80, 3),
  weapon('ember-rod', 'Ember Rod', 'rod', 500, 8, { stats: { int: 2 } }),
  weapon('arcane-rod', 'Arcane Rod', 'rod', 2200, 14, { stats: { int: 5 } }),
]

const ARMOR = [
  // Body.
  armor('cloth-robe', 'Cloth Robe', 'body', 'robe', 150, 2),
  armor('silk-robe', 'Silk Robe', 'body', 'robe', 600, 5, { mdef: 3 }),
  armor('mage-robe', 'Mage Robe', 'body', 'robe', 2200, 9, { mdef: 8, stats: { int: 2 } }),
  armor('leather-armor', 'Leather Armor', 'body', 'light', 200, 4),
  armor('studded-leather', 'Studded Leather', 'body', 'light', 750, 8),
  armor('chain-vest', 'Chain Vest', 'body', 'light', 2600, 12, { evasion: -2 }),
  armor('bronze-plate', 'Bronze Plate', 'body', 'heavy', 400, 7, { evasion: -4 }),
  armor('iron-plate', 'Iron Plate', 'body', 'heavy', 1400, 13, { evasion: -6 }),
  armor('mythril-plate', 'Mythril Plate', 'body', 'heavy', 4200, 20, { evasion: -4 }),
  armor('dragon-plate', 'Dragon Plate', 'body', 'heavy', 11000, 28, {
    evasion: -4,
    mdef: 6,
    description: 'Scales that shrugged off a volcano.',
  }),

  // Head.
  armor('cloth-hood', 'Cloth Hood', 'head', 'robe', 60, 1),
  armor('silk-hood', 'Silk Hood', 'head', 'robe', 300, 3, { mdef: 2 }),
  armor('mage-hat', 'Mage Hat', 'head', 'robe', 1200, 6, { mdef: 5, stats: { int: 2 } }),
  armor('leather-cap', 'Leather Cap', 'head', 'light', 100, 2),
  armor('feather-cap', 'Feather Cap', 'head', 'light', 450, 4, { evasion: 3 }),
  armor('bronze-helm', 'Bronze Helm', 'head', 'heavy', 250, 4, { evasion: -2 }),
  armor('iron-helm', 'Iron Helm', 'head', 'heavy', 900, 7, { evasion: -3 }),
  armor('mythril-helm', 'Mythril Helm', 'head', 'heavy', 2800, 11, { evasion: -2 }),

  // Offhand.
  armor('buckler', 'Buckler', 'offhand', 'shield', 180, 3, { evasion: 1 }),
  armor('iron-shield', 'Iron Shield', 'offhand', 'shield', 700, 6),
  armor('mythril-shield', 'Mythril Shield', 'offhand', 'shield', 2400, 10, { mdef: 3 }),
  armor('aegis', 'Aegis Shield', 'offhand', 'shield', 7000, 16, {
    mdef: 8,
    description: 'The last shield of the old guard.',
  }),
]

const ACCESSORIES = [
  accessory('power-band', 'Power Band', 900, { stats: { str: 3 } }),
  accessory('swift-boots', 'Swift Boots', 900, { stats: { agi: 4 }, evasion: 2 }),
  accessory('sage-pendant', 'Sage Pendant', 900, { stats: { int: 4 } }),
  accessory('guard-charm', 'Guard Charm', 1200, { mdef: 6 }),
  accessory('lucky-coin', 'Lucky Coin', 1500, { stats: { luk: 6 }, crit: 3 }),
  accessory('ember-charm', 'Ember Charm', 2000, {
    resist: ['fire'],
    description: 'Warm to the touch. Fire slides off you.',
  }),
  accessory('frost-charm', 'Frost Charm', 2000, { resist: ['ice'] }),
  accessory('ward-ring', 'Ward Ring', 3000, {
    immune: ['poison', 'blind', 'silence'],
    description: 'The small miseries stop sticking.',
  }),
  accessory('ribbon', 'Ribbon', 9000, {
    mdef: 10,
    immune: ['poison', 'blind', 'silence', 'sleep', 'paralysis', 'slow'],
    description: 'Plain, faded, and worth more than a castle.',
  }),
]

export const EQUIPMENT = Object.fromEntries(
  [...WEAPONS, ...ARMOR, ...ACCESSORIES].map((item) => [item.id, item]),
)

export const EQUIP_SLOTS = ['weapon', 'offhand', 'head', 'body', 'accessory']

export const SLOT_LABELS = {
  weapon: 'Weapon',
  offhand: 'Shield',
  head: 'Head',
  body: 'Body',
  accessory: 'Charm',
}
