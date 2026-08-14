import { getItem } from '../../data/items.js'
import { getSpell } from '../../data/spells.js'
import {
  CRIT_MULTIPLIER,
  critChanceFor,
  elementMultiplier,
  fleeChance,
  healPower,
  hitChance,
  magicDamage,
  physicalDamage,
  statusChance,
} from '../formulas.js'
import { removeItem } from '../inventory.js'
import {
  canAct,
  displayName,
  effectiveStats,
  findCombatant,
  isDown,
  isSilenced,
  replaceCombatant,
} from './combatant.js'
import {
  addStatus,
  getStatus,
  hasStatus,
  isImmuneToStatus,
  removeStatus,
  removeStatuses,
} from './status.js'
import { livingOn, pickLivingEnemy, resolveTargets } from './targeting.js'

/**
 * Action resolvers.
 *
 * Every resolver is pure and appends to an `events` array instead of drawing
 * anything. The array is the entire contract with the UI: the engine decides
 * what happened, the UI decides how to show it. That split is why battles can
 * be unit-tested exactly and replayed 10,000 times by the simulator.
 */

// ------------------------------------------------------------- helpers --

function effectivenessOf(multiplier) {
  if (multiplier === 0) return 'immune'
  if (multiplier > 1) return 'weak'
  if (multiplier < 1) return 'resist'
  return null
}

function dealDamage(battle, targetId, rawAmount, meta, events) {
  const target = findCombatant(battle, targetId)
  if (!target || isDown(target)) return battle

  const amount = Math.max(0, Math.floor(rawAmount))
  let updated = { ...target, hp: Math.max(0, target.hp - amount) }

  events.push({ type: 'damage', targetId, amount, ...meta })

  // A sleeping target is shaken awake by any real hit.
  if (amount > 0 && hasStatus(updated, 'sleep') && getStatus('sleep').wakeOnDamage) {
    updated = removeStatus(updated, 'sleep')
    events.push({ type: 'wake', targetId, status: 'sleep' })
  }

  const next = replaceCombatant(battle, updated)
  if (updated.hp <= 0) events.push({ type: 'ko', targetId })
  return next
}

function healTarget(battle, targetId, rawAmount, events) {
  const target = findCombatant(battle, targetId)
  if (!target || isDown(target)) return battle

  const stats = effectiveStats(target)
  const amount = Math.min(Math.floor(rawAmount), stats.maxHp - target.hp)
  if (amount <= 0) {
    events.push({ type: 'noEffect', targetId })
    return battle
  }

  events.push({ type: 'heal', targetId, amount })
  return replaceCombatant(battle, { ...target, hp: target.hp + amount })
}

function restoreMpTo(battle, targetId, rawAmount, events) {
  const target = findCombatant(battle, targetId)
  if (!target) return battle
  const stats = effectiveStats(target)
  const amount = Math.min(Math.floor(rawAmount), stats.maxMp - target.mp)
  if (amount <= 0) return battle
  events.push({ type: 'mp', targetId, amount })
  return replaceCombatant(battle, { ...target, mp: target.mp + amount })
}

function reviveTarget(battle, targetId, percent, events) {
  const target = findCombatant(battle, targetId)
  if (!target || !isDown(target)) {
    events.push({ type: 'noEffect', targetId })
    return battle
  }
  const stats = effectiveStats(target)
  const hp = Math.max(1, Math.floor((stats.maxHp * percent) / 100))
  events.push({ type: 'revive', targetId, hp })
  return replaceCombatant(battle, { ...removeStatus(target, 'stone'), hp })
}

function tryApplyStatus(battle, targetId, statusId, chance, rng, events) {
  const target = findCombatant(battle, targetId)
  if (!target || isDown(target)) return battle

  if (isImmuneToStatus(target, statusId)) {
    events.push({ type: 'statusImmune', targetId, status: statusId })
    return battle
  }
  if (hasStatus(target, statusId)) {
    events.push({ type: 'noEffect', targetId })
    return battle
  }
  if (!rng.chance(chance)) {
    events.push({ type: 'statusResisted', targetId, status: statusId })
    return battle
  }

  events.push({ type: 'statusApplied', targetId, status: statusId })
  return replaceCombatant(battle, addStatus(target, statusId))
}

// -------------------------------------------------------------- attack --

function attackAction(battle, actor, command, rng, events) {
  const actorStats = effectiveStats(actor)
  let current = battle

  for (let swing = 0; swing < actorStats.attacks; swing++) {
    const live = findCombatant(current, actor.id)
    if (!live || !canAct(live)) break

    const target = pickLivingEnemy(current, actor, command.targetId, rng)
    if (!target) break

    if (swing === 0 && command.targetId && target.id !== command.targetId) {
      events.push({ type: 'retarget', actorId: actor.id, fromId: command.targetId, toId: target.id })
    }

    events.push({ type: 'attack', actorId: actor.id, targetId: target.id, swing })

    const targetStats = effectiveStats(target)
    if (!rng.chance(hitChance(actorStats, targetStats))) {
      events.push({ type: 'miss', actorId: actor.id, targetId: target.id })
      continue
    }

    const crit = rng.chance(critChanceFor(actorStats))
    const base = physicalDamage(actorStats, targetStats, rng) * (crit ? CRIT_MULTIPLIER : 1)
    const multiplier = elementMultiplier(actorStats.weaponElement, target)
    const amount = multiplier === 0 ? 0 : Math.max(1, Math.floor(base * multiplier))

    current = dealDamage(
      current,
      target.id,
      amount,
      {
        crit,
        element: actorStats.weaponElement ?? null,
        effectiveness: effectivenessOf(multiplier),
        actorId: actor.id,
      },
      events,
    )

    // Weapons and monster bites can carry a status rider.
    const rider = command.inflicts ?? actorStats.inflicts
    if (rider && !isDown(findCombatant(current, target.id))) {
      current = tryApplyStatus(current, target.id, rider.status, rider.chance, rng, events)
    }
  }

  return current
}

// --------------------------------------------------------------- spell --

function spellAction(battle, actor, command, rng, events) {
  const spell = getSpell(command.spellId)

  if (isSilenced(actor)) {
    events.push({ type: 'silenced', actorId: actor.id })
    return battle
  }
  if (actor.mp < spell.mp) {
    events.push({ type: 'noMp', actorId: actor.id, spellId: spell.id })
    return battle
  }

  let current = replaceCombatant(battle, { ...actor, mp: actor.mp - spell.mp })
  events.push({ type: 'castSpell', actorId: actor.id, spellId: spell.id })

  const { targetIds, retargetedFrom } = resolveTargets(
    current,
    actor,
    spell.target,
    command.targetId,
    rng,
  )
  if (retargetedFrom) {
    events.push({ type: 'retarget', actorId: actor.id, fromId: retargetedFrom, toId: targetIds[0] })
  }
  if (targetIds.length === 0) {
    events.push({ type: 'fizzle', actorId: actor.id, spellId: spell.id })
    return current
  }

  const casterStats = effectiveStats(findCombatant(current, actor.id))

  for (const targetId of targetIds) {
    const target = findCombatant(current, targetId)
    if (!target) continue

    switch (spell.kind) {
      case 'damage': {
        const targetStats = effectiveStats(target)
        const base = magicDamage(spell.power, casterStats, targetStats, rng)
        const multiplier = elementMultiplier(spell.element, target)
        const amount = multiplier === 0 ? 0 : Math.max(1, Math.floor(base * multiplier))
        current = dealDamage(
          current,
          targetId,
          amount,
          {
            element: spell.element ?? null,
            effectiveness: effectivenessOf(multiplier),
            actorId: actor.id,
            spellId: spell.id,
          },
          events,
        )
        break
      }

      case 'drain': {
        const targetStats = effectiveStats(target)
        const base = magicDamage(spell.power, casterStats, targetStats, rng)
        const multiplier = elementMultiplier(spell.element, target)
        const amount = multiplier === 0 ? 0 : Math.max(1, Math.floor(base * multiplier))
        current = dealDamage(
          current,
          targetId,
          amount,
          {
            element: spell.element ?? null,
            effectiveness: effectivenessOf(multiplier),
            actorId: actor.id,
            spellId: spell.id,
          },
          events,
        )
        if (amount > 0) current = healTarget(current, actor.id, amount, events)
        break
      }

      case 'heal':
      case 'healAll':
        current = healTarget(current, targetId, healPower(spell.power, casterStats, rng), events)
        break

      case 'revive':
        current = reviveTarget(current, targetId, spell.revivePercent ?? 25, events)
        break

      case 'cure': {
        const { combatant, removed } = removeStatuses(target, spell.cures)
        if (removed.length === 0) {
          events.push({ type: 'noEffect', targetId })
        } else {
          events.push({ type: 'statusCured', targetId, statuses: removed })
          current = replaceCombatant(current, combatant)
        }
        break
      }

      case 'status':
        current = tryApplyStatus(
          current,
          targetId,
          spell.status,
          statusChance(spell.accuracy ?? 100, effectiveStats(target)),
          rng,
          events,
        )
        break

      case 'buff': {
        const { stat, amount, turns } = spell.buff
        events.push({ type: 'buff', targetId, stat, amount, turns, spellId: spell.id })
        current = replaceCombatant(current, {
          ...target,
          buffs: [...target.buffs.filter((b) => b.stat !== stat), { stat, amount, turns }],
        })
        break
      }

      default:
        events.push({ type: 'noEffect', targetId })
    }
  }

  return current
}

// ---------------------------------------------------------------- item --

/**
 * Items in battle read their numbers from the same `effect` data the field
 * menu uses, so a Potion always heals for 60 -- only the plumbing differs,
 * because here every step has to become an event.
 */
function itemAction(battle, actor, command, rng, events) {
  const item = getItem(command.itemId)
  if (item.inBattle === false) return battle

  const held = battle.inventory.find((entry) => entry.id === command.itemId)
  if (!held || held.qty <= 0) {
    events.push({ type: 'noEffect', actorId: actor.id })
    return battle
  }

  events.push({ type: 'useItem', actorId: actor.id, itemId: item.id })
  let current = { ...battle, inventory: removeItem(battle.inventory, item.id, 1) }

  const effect = item.effect
  if (!effect) return current

  if (effect.kind === 'escape') {
    events.push({ type: 'escaped', actorId: actor.id })
    return { ...current, phase: 'fled' }
  }

  const { targetIds } = resolveTargets(current, actor, effect.target, command.targetId, rng)
  for (const targetId of targetIds) {
    switch (effect.kind) {
      case 'heal':
      case 'healAll':
        current = healTarget(current, targetId, effect.amount, events)
        break
      case 'healPercent': {
        const target = findCombatant(current, targetId)
        const stats = effectiveStats(target)
        current = healTarget(current, targetId, Math.ceil((stats.maxHp * effect.amount) / 100), events)
        current = restoreMpTo(current, targetId, Math.ceil((stats.maxMp * effect.amount) / 100), events)
        break
      }
      case 'restoreMp':
        current = restoreMpTo(current, targetId, effect.amount, events)
        break
      case 'revive':
        current = reviveTarget(current, targetId, effect.revivePercent ?? 25, events)
        break
      case 'cure': {
        const target = findCombatant(current, targetId)
        const { combatant, removed } = removeStatuses(target, effect.cures)
        if (removed.length === 0) events.push({ type: 'noEffect', targetId })
        else {
          events.push({ type: 'statusCured', targetId, statuses: removed })
          current = replaceCombatant(current, combatant)
        }
        break
      }
      case 'damageAll':
      case 'damage': {
        const target = findCombatant(current, targetId)
        const variance = Math.max(1, Math.floor(effect.power * 0.15))
        const multiplier = elementMultiplier(effect.element, target)
        const rolled = effect.power + rng.int(-variance, variance)
        const amount = multiplier === 0 ? 0 : Math.max(1, Math.floor(rolled * multiplier))
        current = dealDamage(
          current,
          targetId,
          amount,
          {
            element: effect.element ?? null,
            effectiveness: effectivenessOf(multiplier),
            actorId: actor.id,
          },
          events,
        )
        break
      }
      default:
        events.push({ type: 'noEffect', targetId })
    }
  }

  return current
}

// ------------------------------------------------------- defend / flee --

function defendAction(battle, actor, events) {
  events.push({ type: 'defend', actorId: actor.id })
  return replaceCombatant(battle, { ...actor, defending: true })
}

function fleeAction(battle, actor, rng, events) {
  if (!battle.canFlee) {
    events.push({ type: 'flee', actorId: actor.id, success: false, blocked: true })
    return battle
  }

  const party = livingOn(battle, 'party')
  const enemies = livingOn(battle, 'enemy')
  const partyAgility =
    party.reduce((total, c) => total + effectiveStats(c).agi, 0) / Math.max(1, party.length)
  const enemyAgility =
    enemies.reduce((total, c) => total + effectiveStats(c).agi, 0) / Math.max(1, enemies.length)

  const success = rng.chance(fleeChance(partyAgility, enemyAgility, battle.fleeAttempts))
  events.push({ type: 'flee', actorId: actor.id, success })

  if (!success) return { ...battle, fleeAttempts: battle.fleeAttempts + 1 }
  events.push({ type: 'escaped', actorId: actor.id })
  return { ...battle, phase: 'fled' }
}

// ------------------------------------------------------------ dispatch --

export function performAction(battle, actorId, command, rng, events) {
  const actor = findCombatant(battle, actorId)
  if (!actor || !canAct(actor)) return battle

  switch (command?.kind) {
    case 'attack':
      return attackAction(battle, actor, command, rng, events)
    case 'spell':
      return spellAction(battle, actor, command, rng, events)
    case 'item':
      return itemAction(battle, actor, command, rng, events)
    case 'defend':
      return defendAction(battle, actor, events)
    case 'flee':
      return fleeAction(battle, actor, rng, events)
    default:
      return battle
  }
}

export { dealDamage, displayName }
