import { parseFloor } from '../../engine/world/tilemap.js'
import { emberMine } from './emberMine.js'

/**
 * The dungeon registry.
 *
 * Floors are parsed once at import: a ragged row or an unknown glyph throws
 * here, at startup, instead of turning into a mysterious wall halfway down
 * a dungeon.
 */

const RAW_DUNGEONS = [emberMine]

function prepare(dungeon) {
  return {
    ...dungeon,
    floors: dungeon.floors.map((floor) =>
      parseFloor({ ...floor, dungeonId: dungeon.id }),
    ),
  }
}

export const DUNGEONS = Object.fromEntries(
  RAW_DUNGEONS.map((dungeon) => [dungeon.id, prepare(dungeon)]),
)

export function getDungeon(dungeonId) {
  const dungeon = DUNGEONS[dungeonId]
  if (!dungeon) throw new Error(`Unknown dungeon: ${dungeonId}`)
  return dungeon
}

export function getFloor(dungeonId, floorId) {
  const dungeon = getDungeon(dungeonId)
  const floor = dungeon.floors.find((entry) => entry.id === floorId)
  if (!floor) throw new Error(`Unknown floor: ${dungeonId}/${floorId}`)
  return floor
}

/** The floor the party is standing on, from a save's `location`. */
export function floorFor(location) {
  if (!location || location.type !== 'dungeon') return null
  return getFloor(location.dungeonId, location.floorId)
}
