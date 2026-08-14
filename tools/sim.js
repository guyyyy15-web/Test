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
import { STARTING_EQUIPMENT } from '../src/data/progression.js'
import { getSpell } from '../src/data/spells.js'
import { BATTLE_PHASES, createBattle, resolveRound } from '../src/engine/battle/battle.js'
import { effectiveStats, isDown } from '../src/engine/battle/combatant.js'
import { getEnemy } from '../src/data/enemies.js'
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

/**
 * What the party is plausibly wearing at each point in the story.
 *
 * Simulating a level 40 party in the rusted sword they started with produces
 * numbers that describe a game nobody will play. Gear is half the power curve,
 * so the model has to include it.
 */
const GEAR_TIERS = [
  { level: 1, items: ['rusted-sword', 'knife', 'oak-staff', 'ash-rod', 'leather-armor', 'cloth-robe'] },
  {
    level: 6,
    items: [
      'bronze-sword', 'bronze-dagger', 'hand-axe', 'short-spear', 'short-bow', 'iron-claw',
      'silver-staff', 'ember-rod', 'bronze-plate', 'studded-leather', 'silk-robe',
      'buckler', 'leather-cap', 'bronze-helm', 'silk-hood',
    ],
  },
  {
    level: 13,
    items: [
      'iron-sword', 'iron-dagger', 'battle-axe', 'war-lance', 'hunter-bow', 'tiger-claw',
      'iron-plate', 'chain-vest', 'mage-robe', 'iron-shield', 'iron-helm', 'mage-hat',
      'feather-cap', 'power-band',
    ],
  },
  {
    level: 21,
    items: [
      'silver-sword', 'assassin-dagger', 'great-axe', 'dragon-lance', 'elven-bow',
      'dragon-claw', 'sage-staff', 'arcane-rod', 'war-hammer', 'mythril-plate',
      'mythril-shield', 'mythril-helm', 'guard-charm',
    ],
  },
  {
    level: 30,
    items: ['flame-sword', 'venom-fang', 'dragon-plate', 'aegis', 'ribbon'],
  },
  { level: 36, items: ['crown-blade'] },
]

function gearFor(character, level) {
  const pool = GEAR_TIERS.filter((tier) => tier.level <= level).flatMap((tier) => tier.items)
  const equipment = {}

  for (const slot of ['weapon', 'offhand', 'head', 'body', 'accessory']) {
    const best = pool
      .filter((itemId) => getItem(itemId).slot === slot && canEquip(character, itemId))
      .sort((a, b) => itemPower(getItem(b)) - itemPower(getItem(a)))[0]
    if (best) equipment[slot] = best
  }

  return equipment
}

function itemPower(item) {
  const stats = Object.values(item.stats ?? {}).reduce((total, value) => total + value, 0)
  return (item.atk ?? 0) + (item.def ?? 0) + (item.mdef ?? 0) * 0.5 + stats * 2
}

function buildParty(classIds, level) {
  return classIds.map((classId, index) => {
    const bare = createCharacter({
      id: `hero-${index}`,
      name: classId,
      classId,
      level,
      equipment: STARTING_EQUIPMENT[classId],
    })
    // The Monk is the exception: bare hands beat every claw in the game past
    // the opening hours, so leaving the weapon slot empty is correct play.
    const equipment = gearFor(bare, level)
    if (bare.classId === 'monk' || bare.classId === 'master') delete equipment.weapon
    return createCharacter({ id: bare.id, name: bare.name, classId, level, equipment })
  })
}

/**
 * The auto-battler's policy. Deliberately competent but not optimal: heal when
 * someone is badly hurt, sweep with magic when the room is crowded, otherwise
 * swing. Numbers produced against a perfect player would flatter the balance.
 */
function chooseCommands(battle) {
  const commands = {}
  const party = battle.combatants.filter((c) => c.side === 'party' && !isDown(c))
  const foes = battle.combatants.filter((c) => c.side === 'enemy' && !isDown(c))
  if (foes.length === 0) return commands

  const weakest = party.reduce((worst, member) => {
    const ratio = member.hp / effectiveStats(member).maxHp
    return !worst || ratio < worst.ratio ? { member, ratio } : worst
  }, null)

  const fallen = battle.combatants.find((c) => c.side === 'party' && isDown(c))
  let healerUsed = false

  for (const member of party) {
    const spells = member.spells.map(getSpell)
    const target = foes[0]

    // Revive first: a body on the floor is worse than any amount of damage.
    const revive = spells.find((spell) => spell.kind === 'revive' && member.mp >= spell.mp)
    if (fallen && revive && !healerUsed) {
      commands[member.id] = { kind: 'spell', spellId: revive.id, targetId: fallen.id }
      healerUsed = true
      continue
    }

    // Group-heal when the whole party is being ground down -- which is how a
    // real player answers an enemy that opens with area magic every round.
    const hurtCount = party.filter(
      (other) => other.hp / effectiveStats(other).maxHp < 0.55,
    ).length
    const groupHeal = spells
      .filter((spell) => spell.kind === 'healAll' && member.mp >= spell.mp)
      .sort((a, b) => b.power - a.power)[0]
    if (!healerUsed && groupHeal && hurtCount >= 2) {
      commands[member.id] = { kind: 'spell', spellId: groupHeal.id }
      healerUsed = true
      continue
    }

    // Heal when someone is under 40%.
    const heals = spells
      .filter((spell) => spell.kind === 'heal' && member.mp >= spell.mp)
      .sort((a, b) => b.power - a.power)
    if (!healerUsed && weakest && weakest.ratio < 0.4 && heals.length > 0) {
      commands[member.id] = { kind: 'spell', spellId: heals[0].id, targetId: weakest.member.id }
      healerUsed = true
      continue
    }

    // Out of MP but someone is dying: drink. Players always have a bag full.
    if (!healerUsed && weakest && weakest.ratio < 0.35) {
      const potion = ['elixir', 'hi-potion', 'potion'].find((itemId) =>
        battle.inventory.some((entry) => entry.id === itemId && entry.qty > 0),
      )
      if (potion) {
        commands[member.id] = { kind: 'item', itemId: potion, targetId: weakest.member.id }
        healerUsed = true
        continue
      }
    }

    // Sweep a crowd with the biggest affordable all-target spell.
    if (foes.length >= 3) {
      const sweep = spells
        .filter(
          (spell) =>
            spell.kind === 'damage' && spell.target === 'allEnemies' && member.mp >= spell.mp,
        )
        .sort((a, b) => b.power - a.power)[0]
      if (sweep) {
        commands[member.id] = { kind: 'spell', spellId: sweep.id }
        continue
      }
    }

    // Single-target magic is worth it when it beats a swing outright.
    const nuke = spells
      .filter((spell) => spell.kind === 'damage' && spell.target === 'enemy' && member.mp >= spell.mp)
      .sort((a, b) => b.power - a.power)[0]
    const stats = effectiveStats(member)
    if (nuke && nuke.power + stats.magicAttack * 0.6 > stats.attack * 1.4) {
      commands[member.id] = { kind: 'spell', spellId: nuke.id, targetId: target.id }
      continue
    }

    commands[member.id] = { kind: 'attack', targetId: target.id }
  }

  return commands
}

/** A plausible bag for that point in the game -- players hoard curatives. */
function stockFor(level) {
  if (level >= 28) return [{ id: 'elixir', qty: 2 }, { id: 'hi-potion', qty: 12 }]
  if (level >= 16) return [{ id: 'hi-potion', qty: 10 }]
  if (level >= 8) return [{ id: 'hi-potion', qty: 4 }, { id: 'potion', qty: 8 }]
  return [{ id: 'potion', qty: 8 }]
}

function simulateOne(classIds, level, enemyIds, seed) {
  const party = buildParty(classIds, level)
  let battle = createBattle({
    party,
    inventory: stockFor(level),
    enemyIds,
    seed,
    canFlee: false,
  })

  let rounds = 0
  while (battle.phase === BATTLE_PHASES.COMMAND && rounds < 100) {
    const { state } = resolveRound(battle, chooseCommands(battle))
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

/** Rough intended level for each area, used by --sweep. */
const SWEEP = [
  { level: 1, enemies: ['giantRat', 'giantRat'] },
  { level: 2, enemies: ['goblin', 'goblin'] },
  { level: 4, enemies: ['wildBoar', 'wasp', 'wasp'] },
  { level: 6, enemies: ['goblinChief'] },
  { level: 7, enemies: ['kobold', 'caveBat'] },
  { level: 9, enemies: ['skeleton', 'skeleton', 'mineSlime'] },
  { level: 12, enemies: ['mineWarden'] },
  { level: 13, enemies: ['pirate', 'sahagin'] },
  { level: 15, enemies: ['mudToad', 'willOWisp'] },
  { level: 18, enemies: ['tideSerpent'] },
  { level: 20, enemies: ['harpy', 'gargoyle'] },
  { level: 23, enemies: ['stormElemental', 'wyvern'] },
  { level: 26, enemies: ['stormLord'] },
  { level: 28, enemies: ['ghoul', 'wraith'] },
  { level: 30, enemies: ['boneKnight', 'lichAcolyte'] },
  { level: 32, enemies: ['boneTyrant'] },
  { level: 35, enemies: ['fireDrake', 'shade'] },
  { level: 38, enemies: ['dreadKnight', 'magmaGolem'] },
  { level: 40, enemies: ['emberKing'] },
]

const args = parseArgs(process.argv)

if (args.sweep) {
  console.log(`party: ${args.classes.join(', ')}   runs: ${args.runs} each\n`)
  for (const entry of SWEEP) {
    const result = simulate({ ...args, level: entry.level, enemies: entry.enemies })
    printRow(`Lv${String(entry.level).padStart(2)}  ${entry.enemies.join('+')}`, result)
  }
} else {
  const result = simulate(args)
  console.log(`party: ${args.classes.join(', ')} at level ${args.level}`)
  console.log(`foes:  ${args.enemies.join(', ')}   runs: ${args.runs}\n`)
  printRow(`Lv${args.level} ${args.enemies.join('+')}`, result)
  if (result.timeouts) console.log(`\n${result.timeouts} fights hit the 100-round cap.`)
}
