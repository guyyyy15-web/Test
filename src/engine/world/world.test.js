import { describe, it, expect } from 'vitest'
import {
  chestFlag,
  isPassable,
  keyOf,
  parseFloor,
  reachableFrom,
  stepFrom,
  tileAt,
  triggerAt,
  triggerTiles,
} from './tilemap.js'
import { encounterChance, rollEncounter } from './encounters.js'
import { DUNGEONS } from '../../data/maps/index.js'
import { ENCOUNTER_TABLES } from '../../data/encounterTables.js'
import { ENEMIES } from '../../data/enemies.js'
import { ITEMS } from '../../data/items.js'
import { makeRng } from '../rng.js'

describe('parseFloor', () => {
  it('rejects ragged rows', () => {
    expect(() =>
      parseFloor({ id: 'bad', tiles: ['####', '###'] }),
    ).toThrow(/row 1 is 3 wide/)
  })

  it('rejects unknown glyphs', () => {
    expect(() => parseFloor({ id: 'bad', tiles: ['#?#'] })).toThrow(/unknown tile/)
  })

  it('records the dimensions', () => {
    const floor = parseFloor({ id: 'ok', tiles: ['####', '#..#', '####'] })
    expect(floor.width).toBe(4)
    expect(floor.height).toBe(3)
  })
})

describe('movement', () => {
  const floor = parseFloor({
    id: 'test',
    dungeonId: 'test',
    tiles: ['#####', '#...#', '#.D.#', '#...#', '#####'],
    props: { '2,2': { flag: 'hasKey' } },
  })

  it('walks onto open floor', () => {
    expect(stepFrom(floor, { x: 1, y: 1 }, 'right')).toMatchObject({
      x: 2,
      y: 1,
      blocked: false,
    })
  })

  it('is stopped by a wall but still turns to face it', () => {
    const result = stepFrom(floor, { x: 1, y: 1 }, 'up')
    expect(result).toMatchObject({ x: 1, y: 1, facing: 'up', blocked: true })
  })

  it('treats a locked door as a wall until the flag is set', () => {
    expect(isPassable(floor, 2, 2)).toBe(false)
    expect(isPassable(floor, 2, 2, { hasKey: true })).toBe(true)
  })

  it('refuses an unknown direction', () => {
    expect(stepFrom(floor, { x: 1, y: 1 }, 'sideways').blocked).toBe(true)
  })

  it('treats everything outside the map as wall', () => {
    expect(tileAt(floor, -1, 0).solid).toBe(true)
    expect(tileAt(floor, 99, 99).solid).toBe(true)
  })
})

describe('triggers', () => {
  const floor = parseFloor({
    id: 'test',
    dungeonId: 'test',
    tiles: ['#####', '#C.B#', '#####'],
    props: { '1,1': { itemId: 'potion' }, '3,1': { flag: 'bossDown' } },
  })

  it('reports a chest until it has been opened', () => {
    expect(triggerAt(floor, 1, 1)).toMatchObject({ kind: 'chest', itemId: 'potion' })
    expect(triggerAt(floor, 1, 1, { [chestFlag(floor, 1, 1)]: true })).toBeNull()
  })

  it('reports a boss until it has been beaten', () => {
    expect(triggerAt(floor, 3, 1)).toMatchObject({ kind: 'boss' })
    expect(triggerAt(floor, 3, 1, { bossDown: true })).toBeNull()
  })

  it('reports nothing on plain floor', () => {
    expect(triggerAt(floor, 2, 1)).toBeNull()
  })
})

/**
 * The content tests. A chest walled off by one mistyped '#' is invisible in
 * review and infuriating in play, so every trigger on every floor has to be
 * provably reachable from where the party arrives.
 */
describe('every authored dungeon', () => {
  const dungeons = Object.values(DUNGEONS)

  it('has at least one dungeon', () => {
    expect(dungeons.length).toBeGreaterThan(0)
  })

  for (const dungeon of dungeons) {
    describe(dungeon.name, () => {
      it('spawns the party somewhere walkable on every floor', () => {
        for (const floor of dungeon.floors) {
          expect(isPassable(floor, floor.spawn.x, floor.spawn.y)).toBe(true)
        }
      })

      it('can reach every chest, staircase, boss and exit from the spawn', () => {
        for (const floor of dungeon.floors) {
          // Assume every door is open: a key gates progress, it should not
          // make a tile permanently unreachable.
          const openDoors = Object.fromEntries(
            Object.values(floor.props)
              .filter((detail) => detail.flag)
              .map((detail) => [detail.flag, true]),
          )
          const reached = reachableFrom(floor, floor.spawn, openDoors)

          for (const trigger of triggerTiles(floor)) {
            expect(
              reached.has(keyOf(trigger.x, trigger.y)),
              `${floor.id}: ${trigger.kind} at ${trigger.x},${trigger.y} is unreachable`,
            ).toBe(true)
          }
        }
      })

      it('links every staircase to a real floor and back again', () => {
        for (const floor of dungeon.floors) {
          for (const trigger of triggerTiles(floor).filter((t) => t.kind === 'link')) {
            const detail = floor.props[keyOf(trigger.x, trigger.y)]
            expect(detail, `${floor.id}: stairs at ${trigger.x},${trigger.y} go nowhere`)
              .toBeTruthy()

            const destination = dungeon.floors.find((entry) => entry.id === detail.floor)
            expect(destination, `${floor.id}: no such floor ${detail.floor}`).toBeTruthy()
            expect(isPassable(destination, detail.x, detail.y)).toBe(true)
          }
        }
      })

      it('only names items and enemies that exist', () => {
        for (const floor of dungeon.floors) {
          for (const detail of Object.values(floor.props)) {
            if (detail.itemId) expect(ITEMS[detail.itemId]).toBeTruthy()
            if (detail.reward?.itemId) expect(ITEMS[detail.reward.itemId]).toBeTruthy()
            for (const enemyId of detail.enemyIds ?? []) {
              expect(ENEMIES[enemyId], `unknown enemy ${enemyId}`).toBeTruthy()
            }
          }
        }
      })

      it('uses an encounter zone that exists', () => {
        expect(ENCOUNTER_TABLES[dungeon.zone]).toBeTruthy()
      })
    })
  }
})

describe('encounters', () => {
  it('cannot fire before the quiet stretch is over', () => {
    const table = ENCOUNTER_TABLES.mine
    for (let steps = 0; steps < table.minSteps; steps++) {
      expect(encounterChance('mine', steps)).toBe(0)
      expect(rollEncounter('mine', steps, makeRng(steps + 1))).toBeNull()
    }
  })

  it('climbs the longer the party goes unbothered', () => {
    const early = encounterChance('mine', 11)
    const later = encounterChance('mine', 25)
    expect(later).toBeGreaterThan(early)
  })

  it('is capped so a corridor never becomes a wall of fights', () => {
    expect(encounterChance('mine', 5000)).toBeLessThanOrEqual(60)
  })

  it('returns a real group of real enemies', () => {
    const rng = makeRng(9)
    let found = null
    for (let attempt = 0; attempt < 200 && !found; attempt++) {
      found = rollEncounter('mine', 40, rng)
    }
    expect(found).toBeTruthy()
    for (const enemyId of found) expect(ENEMIES[enemyId]).toBeTruthy()
  })

  it('names only real enemies in every zone', () => {
    for (const [zoneId, table] of Object.entries(ENCOUNTER_TABLES)) {
      for (const group of table.groups) {
        for (const enemyId of group.enemies) {
          expect(ENEMIES[enemyId], `${zoneId} references unknown enemy ${enemyId}`).toBeTruthy()
        }
      }
    }
  })
})
