#!/usr/bin/env node
/**
 * Headless balance simulator.
 *
 * Hand-tuning a JRPG level curve by playing it is hopeless -- you cannot feel
 * the difference between a 78% and a 92% win rate, and both are one bad round
 * apart. This plays thousands of fights instead and reports the numbers.
 *
 *   node tools/sim.js --level 12 --enemies kobold,kobold,caveBat --runs 5000
 *   node tools/sim.js --sweep
 *
 * It imports the engine directly. No React, no DOM, no browser -- which is
 * only possible because src/engine never reaches for any of them.
 */

import { createCharacter, isActive } from '../src/engine/character.js'
import { buildReferenceParty, stockFor } from '../src/data/referenceParty.js'
import { getSpell } from '../src/data/spells.js'
import { BATTLE_PHASES, createBattle, resolveRound } from '../src/engine/battle/battle.js'
import { effectiveStats, isDown } from '../src/engine/battle/combatant.js'
import { chooseAutoCommands } from '../src/engine/battle/autoBattle.js'
import { getEnemy } from '../src/data/enemies.js'
import { WORLD_NODES } from '../src/data/world.js'
import { DUNGEONS } from '../src/data/maps/index.js'
import { ENCOUNTER_TABLES } from '../src/data/encounterTables.js'
import { getItem } from '../src/data/items.js'
import { canEquip } from '../src/engine/inventory.js'

const DEFAULT_CLASSES = ['warrior', 'whiteMage', 'blackMage', 'monk']

function parseArgs(argv) {
  const args = { level: 5, runs: 2000, enemies: ['goblin'], classes: DEFAULT_CLASSES, sweep: false }
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[i + 1]
    switch (flag) {
      case '--level':
        args.level = Number(value)
        i++
        break
      case '--runs':
        args.runs = Number(value)
        i++
        break
      case '--enemies':
        args.enemies = value.split(',').map((id) => id.trim())
        i++
        break
      case '--classes':
        args.classes = value.split(',').map((id) => id.trim())
        i++
        break
      case '--sweep':
        args.sweep = true
        break
      case '--help':
        console.log(
          'usage: sim.js [--level N] [--runs N] [--enemies a,b,c] [--classes a,b,c,d] [--sweep]',
        )
        process.exit(0)
        break
      default:
        break
    }
  }
  return args
}

function simulateOne(classIds, level, enemyIds, seed) {
  const party = buildReferenceParty(level, classIds)
  let battle = createBattle({
    party,
    inventory: stockFor(level),
    enemyIds,
    seed,
    canFlee: false,
  })

  let rounds = 0
  while (battle.phase === BATTLE_PHASES.COMMAND && rounds < 100) {
    const { state } = resolveRound(battle, chooseAutoCommands(battle))
    battle = state
    rounds += 1
  }

  const survivors = battle.combatants.filter((c) => c.side === 'party' && !isDown(c))
  const partyMembers = battle.combatants.filter((c) => c.side === 'party')

  const hpRemaining =
    partyMembers.reduce((total, c) => total + Math.max(0, c.hp), 0) /
    partyMembers.reduce((total, c) => total + effectiveStats(c).maxHp, 0)

  const mpSpent =
    partyMembers.reduce((total, c) => total + (effectiveStats(c).maxMp - c.mp), 0) /
    Math.max(1, partyMembers.reduce((total, c) => total + effectiveStats(c).maxMp, 0))

  return {
    won: battle.phase === BATTLE_PHASES.VICTORY,
    rounds,
    deaths: partyMembers.length - survivors.length,
    hpRemaining,
    mpSpent,
    timedOut: rounds >= 100,
  }
}

function simulate({ classes, level, enemies, runs }) {
  const totals = {
    wins: 0,
    rounds: 0,
    deaths: 0,
    hpRemaining: 0,
    mpSpent: 0,
    timeouts: 0,
  }

  for (let run = 0; run < runs; run++) {
    const result = simulateOne(classes, level, enemies, run + 1)
    if (result.won) totals.wins += 1
    if (result.timedOut) totals.timeouts += 1
    totals.rounds += result.rounds
    totals.deaths += result.deaths
    totals.hpRemaining += result.hpRemaining
    totals.mpSpent += result.mpSpent
  }

  return {
    winRate: totals.wins / runs,
    avgRounds: totals.rounds / runs,
    avgDeaths: totals.deaths / runs,
    avgHpLeft: totals.hpRemaining / runs,
    avgMpSpent: totals.mpSpent / runs,
    timeouts: totals.timeouts,
    xp: enemies.reduce((total, id) => total + getEnemy(id).xp, 0),
    gold: enemies.reduce((total, id) => total + getEnemy(id).gold, 0),
  }
}

const percent = (value) => `${(value * 100).toFixed(1)}%`

function printRow(label, result) {
  const health =
    result.winRate >= 0.97 ? 'easy' : result.winRate >= 0.85 ? 'ok' : result.winRate >= 0.6 ? 'HARD' : 'BRUTAL'
  console.log(
    [
      label.padEnd(38),
      `win ${percent(result.winRate).padStart(6)}`,
      `rounds ${result.avgRounds.toFixed(1).padStart(5)}`,
      `hp left ${percent(result.avgHpLeft).padStart(6)}`,
      `mp used ${percent(result.avgMpSpent).padStart(6)}`,
      `deaths ${result.avgDeaths.toFixed(2)}`,
      `xp ${String(result.xp).padStart(5)}`,
      health,
    ].join('  '),
  )
}

/**
 * The sweep is derived from the game's own content, not a list kept in step by
 * hand: every dungeon's recommended level, every group in its encounter table,
 * and every boss standing in it. Add an enemy to a table and it shows up here.
 */
function sweepRows() {
  const rows = []

  for (const node of Object.values(WORLD_NODES)) {
    if (node.kind !== 'dungeon') continue
    const dungeon = DUNGEONS[node.dungeonId]
    const level = node.recommended ?? 1
    const arrival = node.arrival ?? level

    // Every zone the dungeon uses, including per-floor overrides.
    const zones = new Set([
      dungeon.zone,
      ...dungeon.floors.map((floor) => floor.zone).filter(Boolean),
    ])

    const entryZone = dungeon.floors[0].zone ?? dungeon.zone

    for (const zoneId of zones) {
      // You meet the entry zone at arrival level and the deeper zones a few
      // levels later, having fought your way down to them.
      const meetAt =
        zoneId === entryZone ? arrival : Math.round((arrival + level) / 2)

      for (const group of ENCOUNTER_TABLES[zoneId].groups) {
        // Arrival matters more than depth: a group that is fine at the
        // recommended level can still be a wipe on the way in.
        rows.push({
          area: dungeon.name,
          level: meetAt,
          enemies: group.enemies,
          kind: 'arrival',
          zone: zoneId,
        })
        // Only the dungeon's main zone is expected to still bite at the
        // recommended level -- an entry floor you have outgrown is meant to
        // be easy on the way back out.
        rows.push({
          area: dungeon.name,
          level,
          enemies: group.enemies,
          kind: 'random',
          main: zoneId === dungeon.zone,
        })
      }
    }

    for (const floor of dungeon.floors) {
      for (const detail of Object.values(floor.props)) {
        if (detail.kind !== 'boss') continue
        rows.push({
          area: dungeon.name,
          // A boss is fought at the end of its dungeon, a couple of levels on.
          level: level + 2,
          enemies: detail.enemyIds,
          kind: 'boss',
        })
      }
    }
  }

  return rows
}

const args = parseArgs(process.argv)

if (args.sweep) {
  console.log(`party: ${args.classes.join(', ')}   runs: ${args.runs} each\n`)
  let area = null
  const offenders = []

  for (const entry of sweepRows()) {
    if (entry.area !== area) {
      area = entry.area
      console.log(`\n== ${area}`)
    }
    const result = simulate({ ...args, level: entry.level, enemies: entry.enemies })
    printRow(
      `Lv${String(entry.level).padStart(2)} ${entry.kind === 'boss' ? '*' : entry.kind === 'arrival' ? '>' : ' '} ${entry.enemies.join('+')}`,
      result,
    )

    /*
     * Win rate alone is the wrong measure for a boss. The auto-battler plays
     * competently -- it revives, group-heals and drinks -- so a good early
     * boss can sit at 100% and still be a real fight if it drains the party
     * getting there. What matters is whether it costs anything.
     */
    if (entry.kind === 'boss') {
      if (result.winRate < 0.45) {
        offenders.push(
          `${entry.area} Lv${entry.level} ${entry.enemies.join('+')} -> ${percent(result.winRate)} (too hard)`,
        )
      } else if (result.winRate > 0.98 && result.avgHpLeft > 0.72 && result.avgMpSpent < 0.45) {
        offenders.push(
          `${entry.area} Lv${entry.level} ${entry.enemies.join('+')} is free (${percent(result.avgHpLeft)} hp, ${percent(result.avgMpSpent)} mp)`,
        )
      }
    } else if (entry.kind === 'arrival') {
      // Walking in should not be a coin flip.
      if (result.winRate < 0.9) {
        offenders.push(
          `${entry.area} ARRIVAL Lv${entry.level} ${entry.enemies.join('+')} -> ${percent(result.winRate)} (${result.avgDeaths.toFixed(1)} deaths)`,
        )
      }
    } else if (result.winRate < 0.85) {
      offenders.push(
        `${entry.area} Lv${entry.level} ${entry.enemies.join('+')} -> ${percent(result.winRate)} (too hard)`,
      )
    }
    if (entry.kind === 'random' && entry.main && result.avgHpLeft > 0.92) {
      offenders.push(
        `${entry.area} Lv${entry.level} ${entry.enemies.join('+')} costs nothing (${percent(result.avgHpLeft)} hp left)`,
      )
    }
  }

  console.log(`\n${offenders.length} out of band:`)
  for (const line of offenders) console.log(`  ${line}`)
} else {
  const result = simulate(args)
  console.log(`party: ${args.classes.join(', ')} at level ${args.level}`)
  console.log(`foes:  ${args.enemies.join(', ')}   runs: ${args.runs}\n`)
  printRow(`Lv${args.level} ${args.enemies.join('+')}`, result)
  if (result.timeouts) console.log(`\n${result.timeouts} fights hit the 100-round cap.`)
}
