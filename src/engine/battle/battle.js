import { gainXp, isActive } from '../character.js'
import { addItem } from '../inventory.js'
import { makeRng } from '../rng.js'
import { performAction } from './actions.js'
import { chooseEnemyCommand } from './ai.js'
import {
  canAct,
  combatantFromCharacter,
  combatantFromEnemy,
  effectiveStats,
  enemySide,
  findCombatant,
  isDown,
  labelDuplicates,
  partySide,
  replaceCombatant,
} from './combatant.js'
import { getStatus, persistentStatusIds, removeStatus, skipsTurn } from './status.js'
import { livingOn } from './targeting.js'

/**
 * The battle loop.
 *
 * `resolveRound` is the single entry point: hand it the commands the player
 * entered and it plays the entire round -- turn order, enemy decisions,
 * actions, status ticks -- returning the new state and a transcript of
 * everything that happened. Nothing here draws, waits or animates.
 */

export const BATTLE_PHASES = {
  COMMAND: 'command',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  FLED: 'fled',
}

/** A Thief in the party makes a good opening far likelier and a bad one rare. */
function rollOpening(party, rng) {
  const sneaky = party.some((member) => ['thief', 'ninja'].includes(member.classId))
  if (rng.chance(sneaky ? 22 : 8)) return 'preemptive'
  if (rng.chance(sneaky ? 4 : 9)) return 'ambush'
  return 'normal'
}

export function createBattle({
  party,
  inventory = [],
  enemyIds,
  seed = 1,
  canFlee = true,
  opening,
  background = 'plains',
  returnMode = null,
  onVictory = null,
}) {
  const rng = makeRng(seed)

  const combatants = labelDuplicates([
    ...party.map((member, index) => combatantFromCharacter(member, index)),
    ...enemyIds.map((enemyId, index) => combatantFromEnemy(enemyId, index)),
  ])

  const resolvedOpening = opening ?? rollOpening(party, rng)

  return {
    combatants,
    inventory: inventory.map((entry) => ({ ...entry })),
    round: 0,
    phase: BATTLE_PHASES.COMMAND,
    opening: resolvedOpening,
    canFlee,
    fleeAttempts: 0,
    background,
    // Where to go when the dust settles, and what winning is worth beyond
    // XP -- a boss flag, a key item. Carried on the battle so the screen that
    // started the fight does not have to still be around to remember.
    returnMode,
    onVictory,
    rngState: rng.state,
    rewards: null,
  }
}

function initiativeOrder(battle, rng) {
  const entries = battle.combatants.filter(canAct).map((combatant) => {
    const stats = effectiveStats(combatant)
    // Agility decides, with a small random jitter so identical enemies do not
    // always act in the same order.
    let initiative = stats.agi * 100 + rng.int(0, 99)

    if (battle.round === 1) {
      if (battle.opening === 'preemptive' && combatant.side === 'party') initiative += 1000000
      if (battle.opening === 'ambush' && combatant.side === 'enemy') initiative += 1000000
    }

    return { id: combatant.id, initiative }
  })

  return entries.sort((a, b) => b.initiative - a.initiative).map((entry) => entry.id)
}

function outcomeFor(battle) {
  if (livingOn(battle, 'enemy').length === 0) return BATTLE_PHASES.VICTORY
  if (livingOn(battle, 'party').length === 0) return BATTLE_PHASES.DEFEAT
  return null
}

function rollRewards(battle, rng) {
  let xp = 0
  let gold = 0
  const drops = []

  for (const enemy of enemySide(battle)) {
    xp += enemy.xp ?? 0
    gold += enemy.gold ?? 0
    for (const drop of enemy.drops ?? []) {
      if (rng.chance(drop.chance)) drops.push(drop.itemId)
    }
  }

  return { xp, gold, drops }
}

/** End-of-round upkeep: poison, waking up, buff and status durations. */
function endOfRound(battle, rng, events) {
  let current = battle

  for (const combatant of current.combatants) {
    let updated = findCombatant(current, combatant.id)
    if (!updated) continue

    // Defending only lasts the round it was declared.
    if (updated.defending) updated = { ...updated, defending: false }

    if (!isDown(updated)) {
      // Poison bites at the end of every round and can finish someone off.
      for (const entry of updated.statuses) {
        const status = getStatus(entry.id)
        if (!status?.tickPercent) continue
        const stats = effectiveStats(updated)
        const amount = Math.max(1, Math.floor((stats.maxHp * status.tickPercent) / 100))
        updated = { ...updated, hp: Math.max(0, updated.hp - amount) }
        events.push({ type: 'statusTick', targetId: updated.id, status: entry.id, amount })
        if (updated.hp <= 0) events.push({ type: 'ko', targetId: updated.id })
      }

      // Sleep and paralysis get a chance to break on their own.
      for (const entry of [...updated.statuses]) {
        const status = getStatus(entry.id)
        if (status?.wakeChance && rng.chance(status.wakeChance)) {
          updated = removeStatus(updated, entry.id)
          events.push({ type: 'wake', targetId: updated.id, status: entry.id })
        }
      }
    }

    // Timed statuses and buffs count down.
    updated = {
      ...updated,
      statuses: updated.statuses
        .map((entry) => (entry.turns === Infinity ? entry : { ...entry, turns: entry.turns - 1 }))
        .filter((entry) => entry.turns > 0),
      buffs: updated.buffs
        .map((buff) => ({ ...buff, turns: buff.turns - 1 }))
        .filter((buff) => buff.turns > 0),
    }

    current = replaceCombatant(current, updated)
  }

  return current
}

/**
 * Play one whole round.
 *
 * @param battle   current battle state
 * @param commands map of party combatant id -> command
 * @returns {{ state, events }} -- `events` is the transcript the UI replays.
 */
export function resolveRound(battle, commands) {
  if (battle.phase !== BATTLE_PHASES.COMMAND) return { state: battle, events: [] }

  const rng = makeRng(battle.rngState)
  const events = []

  let current = { ...battle, round: battle.round + 1 }
  events.push({ type: 'roundStart', round: current.round })

  if (current.round === 1 && current.opening !== 'normal') {
    events.push({ type: 'opening', opening: current.opening })
  }

  for (const actorId of initiativeOrder(current, rng)) {
    if (current.phase !== BATTLE_PHASES.COMMAND) break

    const actor = findCombatant(current, actorId)
    if (!actor || !canAct(actor)) continue

    const blocking = skipsTurn(actor)
    if (blocking) {
      events.push({ type: 'skipTurn', actorId, reason: blocking.id })
      continue
    }

    events.push({ type: 'turnStart', actorId })

    const command =
      actor.side === 'party' ? commands[actorId] : chooseEnemyCommand(current, actor, rng)

    current = performAction(current, actorId, command, rng, events)

    const outcome = outcomeFor(current)
    if (outcome) {
      current = { ...current, phase: outcome }
      break
    }
  }

  if (current.phase === BATTLE_PHASES.COMMAND) {
    current = endOfRound(current, rng, events)
    const outcome = outcomeFor(current)
    if (outcome) current = { ...current, phase: outcome }
    events.push({ type: 'roundEnd', round: current.round })
  }

  if (current.phase === BATTLE_PHASES.VICTORY && !current.rewards) {
    const rewards = rollRewards(current, rng)
    current = { ...current, rewards }
    events.push({ type: 'victory', ...rewards })
  } else if (current.phase === BATTLE_PHASES.DEFEAT) {
    events.push({ type: 'defeat' })
  } else if (current.phase === BATTLE_PHASES.FLED) {
    events.push({ type: 'fled' })
  }

  return { state: { ...current, rngState: rng.state }, events }
}

export function isOver(battle) {
  return battle.phase !== BATTLE_PHASES.COMMAND
}

/** Party members who still need a command entered this round. */
export function awaitingCommands(battle) {
  return partySide(battle).filter((combatant) => canAct(combatant) && !skipsTurn(combatant))
}

/**
 * Fold the battle back into the save: HP, MP, statuses, XP, gold and drops.
 * Only survivors earn experience -- the classic rule, and the reason reviving
 * someone before the last enemy falls actually matters.
 */
export function applyBattleResult(state, battle) {
  const levelUps = []

  let party = state.party.map((member, index) => {
    const combatant = findCombatant(battle, `p${index}`)
    if (!combatant) return member
    return {
      ...member,
      hp: combatant.hp,
      mp: combatant.mp,
      statuses: [...persistentStatusIds(combatant), ...(combatant.hp <= 0 ? ['ko'] : [])],
    }
  })

  let inventory = battle.inventory
  let gold = state.gold

  if (battle.phase === BATTLE_PHASES.VICTORY && battle.rewards) {
    const survivors = party.filter(isActive).length
    const share = survivors > 0 ? Math.floor(battle.rewards.xp / survivors) : 0

    party = party.map((member, index) => {
      if (!isActive(member)) return member
      const result = gainXp(member, share)
      if (result.levelsGained > 0) {
        levelUps.push({
          characterIndex: index,
          name: member.name,
          levels: result.levelsGained,
          learnedSpells: result.learnedSpells,
          statGains: result.statGains,
        })
      }
      return result.character
    })

    gold += battle.rewards.gold
    for (const itemId of battle.rewards.drops) inventory = addItem(inventory, itemId, 1)
  }

  return {
    state: { ...state, party, inventory, gold, battle: null },
    levelUps,
  }
}

export { partySide, enemySide, findCombatant, effectiveStats, isDown, canAct }
