import { canAct, findCombatant, isDown } from './combatant.js'

/**
 * Who an action actually lands on.
 *
 * Targets are chosen when commands are entered but resolved a moment later,
 * by which point the goblin you aimed at may already be dead. Rather than
 * wasting the turn -- the famous FF1 "ineffective" bug -- we retarget to
 * another valid combatant and report it as an event so the player can see it.
 */

export function livingOn(battle, side) {
  return battle.combatants.filter((c) => c.side === side && canAct(c))
}

export function downedOn(battle, side) {
  return battle.combatants.filter((c) => c.side === side && isDown(c))
}

function opposite(side) {
  return side === 'party' ? 'enemy' : 'party'
}

/**
 * @returns {{ targetIds: string[], retargetedFrom: string|null }}
 * An empty `targetIds` means the action fizzles -- nothing valid was left.
 */
export function resolveTargets(battle, actor, scope, requestedId, rng) {
  switch (scope) {
    case 'self':
      return { targetIds: [actor.id], retargetedFrom: null }

    case 'allEnemies':
      return { targetIds: livingOn(battle, opposite(actor.side)).map((c) => c.id), retargetedFrom: null }

    case 'allAllies':
      return { targetIds: livingOn(battle, actor.side).map((c) => c.id), retargetedFrom: null }

    case 'deadAlly': {
      const requested = requestedId ? findCombatant(battle, requestedId) : null
      if (requested && isDown(requested) && requested.side === actor.side) {
        return { targetIds: [requested.id], retargetedFrom: null }
      }
      const alternative = rng.pick(downedOn(battle, actor.side))
      return {
        targetIds: alternative ? [alternative.id] : [],
        retargetedFrom: alternative && requestedId ? requestedId : null,
      }
    }

    case 'ally': {
      const requested = requestedId ? findCombatant(battle, requestedId) : null
      if (requested && canAct(requested) && requested.side === actor.side) {
        return { targetIds: [requested.id], retargetedFrom: null }
      }
      const alternative = rng.pick(livingOn(battle, actor.side))
      return {
        targetIds: alternative ? [alternative.id] : [],
        retargetedFrom: alternative && requestedId ? requestedId : null,
      }
    }

    case 'enemy':
    default: {
      const requested = requestedId ? findCombatant(battle, requestedId) : null
      if (requested && canAct(requested) && requested.side !== actor.side) {
        return { targetIds: [requested.id], retargetedFrom: null }
      }
      const alternative = rng.pick(livingOn(battle, opposite(actor.side)))
      return {
        targetIds: alternative ? [alternative.id] : [],
        retargetedFrom: alternative && requestedId ? requestedId : null,
      }
    }
  }
}

/** A single swing needs a live body; used between multi-hit strikes. */
export function pickLivingEnemy(battle, actor, preferredId, rng) {
  const preferred = preferredId ? findCombatant(battle, preferredId) : null
  if (preferred && canAct(preferred) && preferred.side !== actor.side) return preferred
  return rng.pick(livingOn(battle, opposite(actor.side))) ?? null
}
