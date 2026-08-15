/**
 * The world map: a graph of places, not a walkable overworld.
 *
 * `x` and `y` are percentages, so the schematic map scales to any screen
 * without a tileset. `requires` gates a node behind a story flag, which is the
 * entire progression system -- beat the Warden, the coast road opens.
 */

export const WORLD_NODES = {
  emberfall: {
    id: 'emberfall',
    name: 'Emberfall',
    kind: 'town',
    townId: 'emberfall',
    x: 12,
    y: 78,
    links: ['emberMine'],
  },

  emberMine: {
    id: 'emberMine',
    name: 'The Ember Mine',
    kind: 'dungeon',
    dungeonId: 'emberMine',
    floorId: 'b1',
    arrival: 1,
    recommended: 5,
    x: 24,
    y: 62,
    links: ['emberfall', 'saltmoor'],
  },

  saltmoor: {
    id: 'saltmoor',
    name: 'Saltmoor',
    kind: 'town',
    townId: 'saltmoor',
    requires: 'mineWardenDefeated',
    x: 36,
    y: 80,
    links: ['emberMine', 'drownedCauseway'],
  },

  drownedCauseway: {
    id: 'drownedCauseway',
    name: 'The Drowned Causeway',
    kind: 'dungeon',
    dungeonId: 'drownedCauseway',
    floorId: 'f1',
    arrival: 9,
    recommended: 14,
    requires: 'mineWardenDefeated',
    x: 48,
    y: 68,
    links: ['saltmoor', 'sunkenChapel', 'highreach'],
  },

  sunkenChapel: {
    id: 'sunkenChapel',
    name: 'The Sunken Chapel',
    kind: 'dungeon',
    dungeonId: 'sunkenChapel',
    floorId: 'f1',
    arrival: 17,
    recommended: 18,
    requires: 'tideSerpentDefeated',
    optional: true,
    x: 46,
    y: 88,
    links: ['drownedCauseway'],
  },

  highreach: {
    id: 'highreach',
    name: 'Highreach',
    kind: 'town',
    townId: 'highreach',
    requires: 'tideSerpentDefeated',
    x: 60,
    y: 48,
    links: ['drownedCauseway', 'stormSpire'],
  },

  stormSpire: {
    id: 'stormSpire',
    name: 'The Storm Spire',
    kind: 'dungeon',
    dungeonId: 'stormSpire',
    floorId: 'f1',
    arrival: 18,
    recommended: 24,
    requires: 'tideSerpentDefeated',
    x: 72,
    y: 32,
    links: ['highreach', 'ashvale'],
  },

  ashvale: {
    id: 'ashvale',
    name: 'Ashvale',
    kind: 'town',
    townId: 'ashvale',
    requires: 'stormLordDefeated',
    x: 60,
    y: 18,
    links: ['stormSpire', 'boneReliquary'],
  },

  boneReliquary: {
    id: 'boneReliquary',
    name: 'The Bone Reliquary',
    kind: 'dungeon',
    dungeonId: 'boneReliquary',
    floorId: 'f1',
    arrival: 24,
    recommended: 28,
    requires: 'stormLordDefeated',
    x: 42,
    y: 14,
    links: ['ashvale', 'lastCamp'],
  },

  lastCamp: {
    id: 'lastCamp',
    name: 'The Last Camp',
    kind: 'town',
    townId: 'lastCamp',
    requires: 'boneTyrantDefeated',
    x: 24,
    y: 24,
    links: ['boneReliquary', 'emberCaldera'],
  },

  emberCaldera: {
    id: 'emberCaldera',
    name: 'The Ember Caldera',
    kind: 'dungeon',
    dungeonId: 'emberCaldera',
    floorId: 'f1',
    arrival: 34,
    recommended: 36,
    requires: 'boneTyrantDefeated',
    x: 12,
    y: 40,
    links: ['lastCamp'],
  },
}

/**
 * `arrival` is the level the party realistically reaches this dungeon at;
 * `recommended` is roughly where they leave it. Both are simulated -- testing
 * only the recommended level is how the first dungeon shipped unbeatable.
 */
export const STARTING_NODE = 'emberfall'

/** The four stones, and the flag each one is proof of. */
export const STONE_QUESTS = [
  { itemId: 'sunstone', flag: 'mineWardenDefeated', name: 'Sunstone' },
  { itemId: 'tidestone', flag: 'tideSerpentDefeated', name: 'Tidestone' },
  { itemId: 'stormstone', flag: 'stormLordDefeated', name: 'Stormstone' },
  { itemId: 'earthstone', flag: 'boneTyrantDefeated', name: 'Earthstone' },
]

export function getNode(nodeId) {
  const node = WORLD_NODES[nodeId]
  if (!node) throw new Error(`Unknown world node: ${nodeId}`)
  return node
}

export function isUnlocked(node, flags = {}) {
  return !node.requires || Boolean(flags[node.requires])
}

/** Where the party can go from here, given what they have done. */
export function destinationsFrom(nodeId, flags = {}) {
  return getNode(nodeId)
    .links.map((id) => getNode(id))
    .filter((node) => isUnlocked(node, flags))
}

export function visibleNodes(flags = {}) {
  return Object.values(WORLD_NODES).filter((node) => isUnlocked(node, flags))
}

export function stonesGathered(flags = {}) {
  return STONE_QUESTS.filter((quest) => flags[quest.flag]).length
}
