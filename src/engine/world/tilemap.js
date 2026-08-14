/**
 * Dungeon floors, authored as ASCII.
 *
 * A floor is an array of equal-length strings. That is the whole format:
 * a 20x14 room is twenty lines you can read and edit in place, which is the
 * only reason six multi-floor dungeons is a tractable amount of content
 * rather than a reason to go build a map editor first.
 *
 * Anything a tile needs beyond its type -- what is in the chest, where the
 * stairs go -- lives in the floor's `props`, keyed by "x,y".
 */

export const TILES = {
  '#': { id: 'wall', solid: true },
  ' ': { id: 'void', solid: true },
  '.': { id: 'floor', solid: false },
  '"': { id: 'rubble', solid: false },
  '~': { id: 'water', solid: true },
  '<': { id: 'stairsUp', solid: false, trigger: 'link' },
  '>': { id: 'stairsDown', solid: false, trigger: 'link' },
  C: { id: 'chest', solid: false, trigger: 'chest' },
  D: { id: 'door', solid: true, trigger: 'door' },
  B: { id: 'boss', solid: false, trigger: 'boss' },
  E: { id: 'exit', solid: false, trigger: 'exit' },
  N: { id: 'npc', solid: true, trigger: 'npc' },
}

export const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

export function keyOf(x, y) {
  return `${x},${y}`
}

/**
 * Validate and index a floor. Throws on ragged rows or unknown glyphs --
 * loudly, at import time, rather than as a mysterious wall halfway in.
 */
export function parseFloor(floor) {
  const rows = floor.tiles
  if (!rows || rows.length === 0) throw new Error(`Floor ${floor.id} has no tiles`)

  const width = rows[0].length
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(
        `Floor ${floor.id} row ${y} is ${row.length} wide, expected ${width}`,
      )
    }
    for (const glyph of row) {
      if (!TILES[glyph]) throw new Error(`Floor ${floor.id} uses unknown tile "${glyph}"`)
    }
  })

  return {
    ...floor,
    width,
    height: rows.length,
    props: floor.props ?? {},
  }
}

export function glyphAt(floor, x, y) {
  if (x < 0 || y < 0 || y >= floor.height || x >= floor.width) return '#'
  return floor.tiles[y][x]
}

export function tileAt(floor, x, y) {
  return TILES[glyphAt(floor, x, y)] ?? TILES['#']
}

export function isSolid(floor, x, y) {
  return tileAt(floor, x, y).solid
}

/**
 * What happens on arriving at this tile, or null. `flags` decides whether a
 * one-shot trigger (an opened chest, a beaten boss) is still live.
 */
export function triggerAt(floor, x, y, flags = {}) {
  const tile = tileAt(floor, x, y)
  if (!tile.trigger) return null

  const detail = floor.props[keyOf(x, y)] ?? {}
  const trigger = { kind: tile.trigger, x, y, ...detail }

  if (trigger.kind === 'chest' && flags[chestFlag(floor, x, y)]) return null
  if (trigger.kind === 'boss' && trigger.flag && flags[trigger.flag]) return null

  return trigger
}

export function chestFlag(floor, x, y) {
  return `chest:${floor.dungeonId}:${floor.id}:${keyOf(x, y)}`
}

/** A door the party cannot open yet is as solid as the wall beside it. */
export function isPassable(floor, x, y, flags = {}) {
  if (isSolid(floor, x, y)) {
    const detail = floor.props[keyOf(x, y)]
    if (tileAt(floor, x, y).id === 'door' && detail?.flag && flags[detail.flag]) return true
    return false
  }
  return true
}

export function stepFrom(floor, position, direction, flags = {}) {
  const delta = DIRECTIONS[direction]
  if (!delta) return { ...position, blocked: true }

  const x = position.x + delta.dx
  const y = position.y + delta.dy

  if (!isPassable(floor, x, y, flags)) {
    return { x: position.x, y: position.y, facing: direction, blocked: true }
  }
  return { x, y, facing: direction, blocked: false }
}

/**
 * Every tile reachable from `start`. Used by the map tests to prove no chest,
 * staircase or boss was ever walled off by a typo.
 */
export function reachableFrom(floor, start, flags = {}) {
  const seen = new Set()
  const queue = [start]
  seen.add(keyOf(start.x, start.y))

  while (queue.length > 0) {
    const current = queue.pop()
    for (const { dx, dy } of Object.values(DIRECTIONS)) {
      const x = current.x + dx
      const y = current.y + dy
      const key = keyOf(x, y)
      if (seen.has(key)) continue
      if (!isPassable(floor, x, y, flags)) continue
      seen.add(key)
      queue.push({ x, y })
    }
  }

  return seen
}

/** Every tile carrying a trigger, for the reachability tests. */
export function triggerTiles(floor) {
  const found = []
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      const tile = tileAt(floor, x, y)
      if (tile.trigger) found.push({ x, y, kind: tile.trigger })
    }
  }
  return found
}
