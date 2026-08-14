/**
 * The six classes, in the FF1 tradition: you build a party of four out of
 * these at the start of the game and live with the consequences.
 *
 * Growth is deterministic -- `base + round(growth * (level - 1))` -- rather
 * than randomised per level. That costs a little novelty and buys exact
 * balance testing, which matters far more for a game this size.
 *
 * `tag` is the three-letter abbreviation used as the character's placeholder
 * sprite, the way FF1 labelled its heroes.
 */

export const STAT_KEYS = ['hp', 'mp', 'str', 'agi', 'vit', 'int', 'luk']

export const STAT_LABELS = {
  hp: 'HP',
  mp: 'MP',
  str: 'STR',
  agi: 'AGI',
  vit: 'VIT',
  int: 'INT',
  luk: 'LUK',
}

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    tag: 'WAR',
    color: '#c9483a',
    description:
      'A wall of steel. The highest HP and defence in the game, and the only class that can wear heavy plate from the start.',
    base: { hp: 42, mp: 0, str: 13, agi: 7, vit: 13, int: 3, luk: 6 },
    growth: { hp: 7, mp: 0, str: 1.15, agi: 0.5, vit: 1.1, int: 0.15, luk: 0.5 },
    equip: {
      weapon: ['sword', 'axe', 'spear', 'dagger'],
      offhand: ['shield'],
      head: ['heavy', 'light'],
      body: ['heavy', 'light'],
    },
    school: null,
    spellsByLevel: {},
    promotion: 'knight',
  },

  thief: {
    id: 'thief',
    name: 'Thief',
    tag: 'THF',
    color: '#4aa96c',
    description:
      'Fast, lucky and slippery. Lands the first strike, flees when the party must, and finds more gold than anyone else.',
    base: { hp: 34, mp: 0, str: 9, agi: 14, vit: 8, int: 6, luk: 12 },
    growth: { hp: 5, mp: 0, str: 0.8, agi: 1.3, vit: 0.7, int: 0.4, luk: 1 },
    equip: {
      weapon: ['dagger', 'sword', 'bow'],
      offhand: ['shield'],
      head: ['light'],
      body: ['light'],
    },
    school: null,
    spellsByLevel: {},
    promotion: 'ninja',
  },

  monk: {
    id: 'monk',
    name: 'Monk',
    tag: 'MNK',
    color: '#d9a441',
    description:
      'Fights barehanded and hits harder for it. Needs no weapon and little armour, so every coin can go to the rest of the party.',
    base: { hp: 40, mp: 0, str: 12, agi: 11, vit: 11, int: 4, luk: 8 },
    growth: { hp: 6.5, mp: 0, str: 1.05, agi: 0.9, vit: 0.95, int: 0.2, luk: 0.6 },
    equip: {
      weapon: ['claw'],
      offhand: [],
      head: ['light'],
      body: ['light'],
    },
    // Bare hands scale with level, so a Monk with no weapon out-damages one
    // holding an early claw. Buying them a weapon too soon is a classic trap.
    unarmed: 1.6,
    school: null,
    spellsByLevel: {},
    promotion: 'master',
  },

  whiteMage: {
    id: 'whiteMage',
    name: 'White Mage',
    tag: 'WHM',
    color: '#e8ecff',
    description:
      'The reason the party survives. Heals, revives, cures every status the dungeons throw at you, and burns the undead.',
    base: { hp: 28, mp: 16, str: 6, agi: 8, vit: 7, int: 13, luk: 9 },
    growth: { hp: 4, mp: 3.2, str: 0.45, agi: 0.6, vit: 0.6, int: 1.2, luk: 0.7 },
    equip: {
      weapon: ['staff', 'dagger'],
      offhand: [],
      head: ['robe'],
      body: ['robe'],
    },
    school: 'white',
    spellsByLevel: {
      1: ['heal', 'cleanse'],
      3: ['guard'],
      5: ['smite'],
      7: ['healII', 'revive'],
      10: ['barrier'],
      13: ['healAll'],
      16: ['sanctify'],
      20: ['healIII'],
      24: ['resurrect'],
      28: ['fullHeal'],
    },
    promotion: 'whiteWizard',
  },

  blackMage: {
    id: 'blackMage',
    name: 'Black Mage',
    tag: 'BLM',
    color: '#8b5cf6',
    description:
      'Glass, and a cannon. The only class that can hit every enemy at once, and the only one a stiff breeze can kill.',
    base: { hp: 26, mp: 18, str: 5, agi: 9, vit: 6, int: 15, luk: 8 },
    growth: { hp: 3.8, mp: 3.5, str: 0.4, agi: 0.65, vit: 0.55, int: 1.35, luk: 0.6 },
    equip: {
      weapon: ['rod', 'dagger'],
      offhand: [],
      head: ['robe'],
      body: ['robe'],
    },
    school: 'black',
    spellsByLevel: {
      1: ['fire', 'frost'],
      3: ['sleep'],
      5: ['spark', 'dim'],
      7: ['fireII', 'slow'],
      10: ['frostII', 'venom'],
      13: ['sparkII', 'haste'],
      16: ['quake', 'drain'],
      20: ['fireIII'],
      24: ['frostIII'],
      28: ['flare'],
    },
    promotion: 'blackWizard',
  },

  redMage: {
    id: 'redMage',
    name: 'Red Mage',
    tag: 'RDM',
    color: '#e0518a',
    description:
      'Competent at everything, master of nothing. Swings a sword, casts from both schools, and stops learning where the specialists are just getting started.',
    base: { hp: 34, mp: 10, str: 10, agi: 10, vit: 9, int: 10, luk: 8 },
    growth: { hp: 5.2, mp: 2, str: 0.8, agi: 0.8, vit: 0.8, int: 0.85, luk: 0.6 },
    equip: {
      weapon: ['sword', 'dagger', 'rod', 'staff'],
      offhand: ['shield'],
      head: ['light', 'robe'],
      body: ['light', 'robe'],
    },
    school: 'both',
    spellsByLevel: {
      1: ['fire', 'heal'],
      4: ['frost'],
      6: ['cleanse'],
      8: ['spark', 'sleep'],
      11: ['fireII'],
      14: ['guard', 'healII'],
      18: ['frostII'],
      22: ['slow'],
    },
    promotion: 'redWizard',
  },
}

/**
 * Mid-game promotions. Pure data, so the "class change" plot event is nearly
 * free: it swaps `classId` and the character keeps level, XP and gear.
 */
export const PROMOTED_CLASSES = {
  knight: {
    id: 'knight',
    name: 'Knight',
    tag: 'KNT',
    color: '#e0654f',
    description: 'A Warrior sworn to the crown, taught the first prayers of the white school.',
    base: { hp: 46, mp: 6, str: 14, agi: 8, vit: 14, int: 5, luk: 7 },
    growth: { hp: 7.6, mp: 0.8, str: 1.25, agi: 0.6, vit: 1.2, int: 0.3, luk: 0.55 },
    equip: {
      weapon: ['sword', 'axe', 'spear', 'dagger'],
      offhand: ['shield'],
      head: ['heavy', 'light'],
      body: ['heavy', 'light'],
    },
    school: 'white',
    spellsByLevel: { 1: ['heal'], 22: ['cleanse'], 26: ['guard'] },
    promotion: null,
  },

  ninja: {
    id: 'ninja',
    name: 'Ninja',
    tag: 'NIN',
    color: '#5fc98a',
    description: 'A Thief who learned to throw fire as easily as a dagger.',
    base: { hp: 38, mp: 6, str: 11, agi: 16, vit: 9, int: 8, luk: 14 },
    growth: { hp: 5.6, mp: 0.8, str: 0.95, agi: 1.4, vit: 0.8, int: 0.5, luk: 1.05 },
    equip: {
      weapon: ['dagger', 'sword', 'bow'],
      offhand: ['shield'],
      head: ['light'],
      body: ['light'],
    },
    school: 'black',
    spellsByLevel: { 1: ['fire'], 22: ['frost'], 26: ['sleep'] },
    promotion: null,
  },

  master: {
    id: 'master',
    name: 'Master',
    tag: 'MST',
    color: '#f0b957',
    description: 'A Monk who no longer needs a weapon, or an opinion about one.',
    base: { hp: 44, mp: 0, str: 13, agi: 13, vit: 12, int: 5, luk: 9 },
    growth: { hp: 7.2, mp: 0, str: 1.15, agi: 1, vit: 1.05, int: 0.25, luk: 0.65 },
    equip: { weapon: ['claw'], offhand: [], head: ['light'], body: ['light'] },
    unarmed: 2.0,
    school: null,
    spellsByLevel: {},
    promotion: null,
  },

  whiteWizard: {
    id: 'whiteWizard',
    name: 'White Wizard',
    tag: 'WHW',
    color: '#ffffff',
    description: 'A White Mage at the full height of the school.',
    base: { hp: 32, mp: 20, str: 7, agi: 9, vit: 8, int: 15, luk: 10 },
    growth: { hp: 4.4, mp: 3.6, str: 0.5, agi: 0.65, vit: 0.65, int: 1.35, luk: 0.75 },
    equip: {
      weapon: ['staff', 'dagger', 'hammer'],
      offhand: [],
      head: ['robe'],
      body: ['robe'],
    },
    school: 'white',
    spellsByLevel: {},
    promotion: null,
  },

  blackWizard: {
    id: 'blackWizard',
    name: 'Black Wizard',
    tag: 'BLW',
    color: '#a78bfa',
    description: 'A Black Mage at the full height of the school.',
    base: { hp: 30, mp: 22, str: 6, agi: 10, vit: 7, int: 17, luk: 9 },
    growth: { hp: 4.2, mp: 3.9, str: 0.45, agi: 0.7, vit: 0.6, int: 1.5, luk: 0.65 },
    equip: {
      weapon: ['rod', 'dagger'],
      offhand: [],
      head: ['robe'],
      body: ['robe'],
    },
    school: 'black',
    spellsByLevel: {},
    promotion: null,
  },

  redWizard: {
    id: 'redWizard',
    name: 'Red Wizard',
    tag: 'RDW',
    color: '#f472a6',
    description: 'A Red Mage who finally out-ranged the ceiling that held them back.',
    base: { hp: 38, mp: 14, str: 11, agi: 11, vit: 10, int: 12, luk: 9 },
    growth: { hp: 5.8, mp: 2.4, str: 0.9, agi: 0.85, vit: 0.85, int: 1, luk: 0.65 },
    equip: {
      weapon: ['sword', 'dagger', 'rod', 'staff'],
      offhand: ['shield'],
      head: ['light', 'robe'],
      body: ['light', 'robe'],
    },
    school: 'both',
    spellsByLevel: { 26: ['healAll'], 30: ['fireIII'] },
    promotion: null,
  },
}

export const ALL_CLASSES = { ...CLASSES, ...PROMOTED_CLASSES }

/** Selectable at character creation, in menu order. */
export const STARTING_CLASS_IDS = [
  'warrior',
  'thief',
  'monk',
  'whiteMage',
  'blackMage',
  'redMage',
]

export function getClass(classId) {
  const definition = ALL_CLASSES[classId]
  if (!definition) throw new Error(`Unknown class: ${classId}`)
  return definition
}
