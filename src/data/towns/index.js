/**
 * Towns.
 *
 * Menu-driven rather than walkable: an inn, some shops, and people to talk to.
 * NPC lines can be gated on story flags, which is how a town reacts to what
 * the party has done without any scripting beyond a `requires` field.
 */

export const TOWNS = {
  emberfall: {
    id: 'emberfall',
    name: 'Emberfall',
    blurb:
      'A mining town that has outlived its mine. The forge still runs, mostly out of habit.',
    inn: {
      price: 20,
      text: 'The innkeeper points at a room without looking up from her ledger.',
    },
    shops: [
      {
        id: 'provisions',
        name: 'Provisioner',
        greeting: 'Everything a body needs to come back out again.',
        stock: ['potion', 'antidote', 'eye-drops', 'echo-herb', 'tent'],
      },
      {
        id: 'smithy',
        name: 'Smithy',
        greeting: 'Bronze, mostly. The good ore stopped coming up years ago.',
        stock: [
          'bronze-sword',
          'bronze-dagger',
          'hand-axe',
          'short-spear',
          'short-bow',
          'iron-claw',
          'silver-staff',
          'ember-rod',
        ],
      },
      {
        id: 'armory',
        name: 'Armorer',
        greeting: 'Take the plate. The mine does not care how fast you are.',
        stock: [
          'leather-armor',
          'studded-leather',
          'bronze-plate',
          'silk-robe',
          'buckler',
          'leather-cap',
          'bronze-helm',
          'silk-hood',
        ],
      },
    ],
    npcs: [
      {
        id: 'smith',
        name: 'Bern the Smith',
        lines: [
          'The mine has been wrong since midwinter. Lamps go out. Ore comes up warm.',
          'Whatever is down there, it is not a cave-in. Cave-ins do not knock.',
        ],
      },
      {
        id: 'child',
        name: 'A child',
        lines: ['My father went down to check the third seam. That was eleven days ago.'],
      },
      {
        id: 'child-after',
        name: 'A child',
        requires: 'mineWardenDefeated',
        lines: ['You went down there. You came back up. Nobody does both.'],
      },
      {
        id: 'elder',
        name: 'Elder Marisse',
        lines: [
          'Four stones were set into the old crown: sun, tide, storm, earth.',
          'They were taken apart for a reason. Whoever is putting them back has not read far enough.',
        ],
      },
    ],
  },

  saltmoor: {
    id: 'saltmoor',
    name: 'Saltmoor',
    requires: 'mineWardenDefeated',
    blurb: 'A harbour town built on stilts over a marsh that is slowly winning.',
    inn: {
      price: 60,
      text: 'The room smells of brine. The bed is dry, which is more than the floor manages.',
    },
    shops: [
      {
        id: 'provisions',
        name: 'Dockside Stores',
        greeting: 'Buy two. The marsh eats the first one.',
        stock: ['potion', 'hi-potion', 'ether', 'antidote', 'remedy', 'phoenix-down', 'tent'],
      },
      {
        id: 'smithy',
        name: 'Saltmoor Forge',
        greeting: 'Iron, and one or two things I should not be selling.',
        stock: [
          'iron-sword',
          'iron-dagger',
          'battle-axe',
          'war-lance',
          'hunter-bow',
          'tiger-claw',
          'sage-staff',
          'arcane-rod',
        ],
      },
      {
        id: 'armory',
        name: 'Saltmoor Armory',
        greeting: 'Plate rusts out here. I sell it anyway.',
        stock: [
          'chain-vest',
          'iron-plate',
          'mage-robe',
          'iron-shield',
          'iron-helm',
          'mage-hat',
          'feather-cap',
          'power-band',
          'swift-boots',
          'sage-pendant',
        ],
      },
    ],
    npcs: [
      {
        id: 'harbourmaster',
        name: 'Harbourmaster',
        lines: [
          'Nothing has sailed in three weeks. Something in the deep channel does not like company.',
        ],
      },
      {
        id: 'sailor',
        name: 'A sailor',
        lines: ['I saw it once. I am not going to describe it and you cannot make me.'],
      },
    ],
  },
}

export function getTown(townId) {
  const town = TOWNS[townId]
  if (!town) throw new Error(`Unknown town: ${townId}`)
  return town
}
