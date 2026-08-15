import { describe, it, expect } from 'vitest'
import { WORLD_NODES } from './world.js'
import { DUNGEONS } from './maps/index.js'
import { ENCOUNTER_TABLES } from './encounterTables.js'
import { buildReferenceParty, stockFor } from './referenceParty.js'
import { BATTLE_PHASES, createBattle, resolveRound } from '../engine/battle/battle.js'
import { chooseAutoCommands } from '../engine/battle/autoBattle.js'
import { isDown } from '../engine/battle/combatant.js'
/**
 * Difficulty regression tests.
 *
 * The Ember Mine once shipped unbeatable: its encounter table was tuned at the
 * dungeon's *recommended* level (5) while players arrive at level 1, because
 * Emberfall to the mine is the only road and there is nowhere to grind first.
 * A pair of skeletons was a 16.8% win with 3.6 deaths out of 4, and nothing
 * caught it, because nothing simulated the level players actually arrive at.
 *
 * These tests play real battles through the real engine at each dungeon's
 * declared `arrival` level. Fixed seeds, so they are exact rather than flaky.
 */

const RUNS = 40

/** Play one fight to the end with the shared auto-battler. */
function fight(level, enemyIds, seed) {
  let battle = createBattle({
    party: buildReferenceParty(level),
    inventory: stockFor(level),
    enemyIds,
    seed,
    canFlee: false,
  })

  let rounds = 0
  while (battle.phase === BATTLE_PHASES.COMMAND && rounds < 60) {
    battle = resolveRound(battle, chooseAutoCommands(battle)).state
    rounds += 1
  }

  return {
    won: battle.phase === BATTLE_PHASES.VICTORY,
    deaths: battle.combatants.filter((c) => c.side === 'party' && isDown(c)).length,
  }
}

function winRate(level, enemyIds, runs = RUNS) {
  let wins = 0
  for (let seed = 1; seed <= runs; seed++) {
    if (fight(level, enemyIds, seed).won) wins += 1
  }
  return wins / runs
}

const dungeonNodes = Object.values(WORLD_NODES).filter((node) => node.kind === 'dungeon')

describe('every dungeon declares where the party meets it', () => {
  it.each(dungeonNodes.map((node) => [node.name, node]))(
    '%s has an arrival level at or below its recommended one',
    (_name, node) => {
      expect(typeof node.arrival, `${node.id} has no arrival level`).toBe('number')
      expect(node.arrival).toBeGreaterThan(0)
      expect(node.arrival).toBeLessThanOrEqual(node.recommended)
    },
  )
})

describe('the first fights of every dungeon are survivable on arrival', () => {
  it.each(
    dungeonNodes.map((node) => {
      const dungeon = DUNGEONS[node.dungeonId]
      // The entry floor is what the party walks into at `arrival`; deeper
      // floors may use a harder table and are met later.
      const zoneId = dungeon.floors[0].zone ?? dungeon.zone
      return [node.name, node, zoneId]
    }),
  )('%s', (_name, node, zoneId) => {
    for (const group of ENCOUNTER_TABLES[zoneId].groups) {
      const rate = winRate(node.arrival, group.enemies)
      expect(
        rate,
        `${node.name} entry zone: ${group.enemies.join('+')} at level ${node.arrival} wins ${(rate * 100).toFixed(0)}%`,
      ).toBeGreaterThanOrEqual(0.85)
    }
  })
})

describe('the Ember Mine specifically', () => {
  const mine = WORLD_NODES.emberMine
  const entryZone = DUNGEONS.emberMine.floors[0].zone

  it('starts a brand new party at level 1', () => {
    expect(mine.arrival).toBe(1)
  })

  it('keeps its own first floor on a gentler table than its depths', () => {
    expect(entryZone).toBe('mineUpper')
    expect(entryZone).not.toBe(DUNGEONS.emberMine.zone)
  })

  it('never puts a level-6 skeleton on the floor a level-1 party walks into', () => {
    const firstFloorEnemies = new Set(
      ENCOUNTER_TABLES[entryZone].groups.flatMap((group) => group.enemies),
    )
    expect(firstFloorEnemies.has('skeleton')).toBe(false)
    expect(firstFloorEnemies.has('rockCrab')).toBe(false)
  })

  it('wins every one of its opening encounters at level 1', () => {
    for (const group of ENCOUNTER_TABLES[entryZone].groups) {
      expect(winRate(1, group.enemies), group.enemies.join('+')).toBeGreaterThanOrEqual(0.95)
    }
  })

  it('is a fight a level-1 party survives, not a formality', () => {
    // The complaint was that it was impossible, not that it was boring -- but
    // a first dungeon with zero risk is its own failure.
    const results = Array.from({ length: RUNS }, (_, i) =>
      fight(1, ['goblin', 'giantRat'], i + 1),
    )
    expect(results.every((r) => r.won)).toBe(true)
    expect(results.some((r) => r.deaths > 0)).toBe(false)
  })
})
