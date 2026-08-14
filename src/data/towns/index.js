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
  highreach: {
    id: 'highreach',
    name: 'Highreach',
    requires: 'tideSerpentDefeated',
    blurb:
      'A monastery town on a shelf of rock, above the weather and most of the arguments.',
    inn: {
      price: 140,
      text: 'A cell, a blanket, and a bell at dawn you are welcome to ignore.',
    },
    /** The class-change shrine. One-time, and the reason to come up here. */
    shrine: {
      requires: 'tideSerpentDefeated',
      flag: 'promoted',
      name: 'The Standing Stones',
      offer:
        'The stones have been waiting for someone carrying two of the four. Step between them.',
      done: 'The stones are quiet now. Whatever they had, you are carrying it.',
    },
    shops: [
      {
        id: 'provisions',
        name: 'Monastery Stores',
        greeting: 'Take what you need. Leave what you can.',
        stock: ['hi-potion', 'ether', 'remedy', 'phoenix-down', 'mega-potion', 'tent'],
      },
      {
        id: 'smithy',
        name: 'Highreach Forge',
        greeting: 'Silver holds an edge against things that should not have one.',
        stock: [
          'silver-sword',
          'assassin-dagger',
          'great-axe',
          'dragon-lance',
          'elven-bow',
          'dragon-claw',
          'war-hammer',
        ],
      },
      {
        id: 'armory',
        name: 'Highreach Armory',
        greeting: 'Mythril. Light enough to climb in, heavy enough to matter.',
        stock: [
          'mythril-plate',
          'mythril-shield',
          'mythril-helm',
          'mage-robe',
          'guard-charm',
          'lucky-coin',
          'ember-charm',
          'frost-charm',
        ],
      },
    ],
    npcs: [
      {
        id: 'abbot',
        name: 'The Abbot',
        lines: [
          'Four stones. Four keepers. Each one put somewhere nobody sensible would go.',
          'That was the plan. It assumed nobody would be that determined.',
        ],
      },
      {
        id: 'watcher',
        name: 'A watcher',
        lines: ['The spire has been lit for eleven nights. Nothing lit it.'],
      },
      {
        id: 'abbot-after',
        name: 'The Abbot',
        requires: 'promoted',
        lines: ['You walk differently. Good. You will need to.'],
      },
    ],
  },

  ashvale: {
    id: 'ashvale',
    name: 'Ashvale',
    requires: 'stormLordDefeated',
    blurb: 'A grey town downwind of the caldera. Everyone here is packed to leave.',
    inn: {
      price: 280,
      text: 'The innkeeper takes your coin and does not ask how long you are staying.',
    },
    shops: [
      {
        id: 'provisions',
        name: 'Last Provisions',
        greeting: 'Elixirs are dear. So is coming back.',
        stock: ['hi-potion', 'mega-potion', 'ether', 'remedy', 'phoenix-down', 'elixir', 'tent'],
      },
      {
        id: 'smithy',
        name: 'Ashvale Forge',
        greeting: 'Fire-forged. Seemed appropriate.',
        stock: ['flame-sword', 'venom-fang', 'dragon-claw', 'sage-staff', 'arcane-rod'],
      },
      {
        id: 'armory',
        name: 'Ashvale Armory',
        greeting: 'Dragon plate. Do not ask which dragon.',
        stock: ['dragon-plate', 'aegis', 'mythril-helm', 'ward-ring', 'power-band', 'sage-pendant'],
      },
    ],
    npcs: [
      {
        id: 'refugee',
        name: 'A refugee',
        lines: ['The reliquary opened by itself. Things walked out of it in order.'],
      },
      {
        id: 'cartographer',
        name: 'Cartographer',
        lines: [
          'Four stones set back into one crown. I have drawn what happens next twice and burned both.',
        ],
      },
    ],
  },

  lastCamp: {
    id: 'lastCamp',
    name: 'The Last Camp',
    requires: 'boneTyrantDefeated',
    blurb:
      'Tents on hot stone at the caldera lip. Nobody here expects to be here long.',
    inn: {
      price: 400,
      text: 'You sleep on warm rock under a sky the colour of a bruise, and it is enough.',
    },
    shops: [
      {
        id: 'provisions',
        name: 'The Quartermaster',
        greeting: 'Everything I have. There is no point saving it.',
        stock: ['mega-potion', 'elixir', 'ether', 'remedy', 'phoenix-down', 'tent'],
      },
      {
        id: 'armory',
        name: 'The Armourer',
        greeting: 'Take the ribbon if you can afford it. It is the only thing that helps.',
        stock: ['crown-blade', 'dragon-plate', 'aegis', 'ribbon', 'ward-ring', 'lucky-coin'],
      },
    ],
    npcs: [
      {
        id: 'captain',
        name: 'The Captain',
        lines: [
          'We hold the lip. We do not go down. That was the order and it is a good one.',
          'You are going down anyway. I will not pretend to stop you.',
        ],
      },
      {
        id: 'scout',
        name: 'A scout',
        lines: ['Four floors. It gets warmer. Then it gets quiet, and that is worse.'],
      },
    ],
  },
}

export function getTown(townId) {
  const town = TOWNS[townId]
  if (!town) throw new Error(`Unknown town: ${townId}`)
  return town
}
