/**
 * The world map: a graph of places, not a walkable overworld.
 *
 * `x` and `y` are percentages, so the schematic map scales to any screen
 * without a tileset. `requires` gates a node behind a story flag, which is the
 * whole progression system -- beat the Warden, the coast road opens.
 */

export const WORLD_NODES = {
  emberfall: {
    id: 'emberfall',
    name: 'Emberfall',
    kind: 'town',
    townId: 'emberfall',
    x: 18,
    y: 72,
    links: ['emberMine'],
  },

  emberMine: {
    id: 'emberMine',
    name: 'The Ember Mine',
    kind: 'dungeon',
    dungeonId: 'emberMine',
    floorId: 'b1',
    recommended: 4,
    x: 34,
    y: 54,
    links: ['emberfall', 'saltmoor'],
  },

  saltmoor: {
    id: 'saltmoor',
    name: 'Saltmoor',
    kind: 'town',
    townId: 'saltmoor',
    requires: 'mineWardenDefeated',
    x: 58,
    y: 66,
    links: ['emberMine'],
  },
}

export const STARTING_NODE = 'emberfall'

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
