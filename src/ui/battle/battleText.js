import { getItem } from '../../data/items.js'
import { getSpell } from '../../data/spells.js'
import { STATUSES } from '../../engine/battle/status.js'

/**
 * Turns transcript events into the one-line messages a JRPG battle window
 * shows. Purely presentational -- the engine never produces a string.
 */

const statusName = (id) => STATUSES[id]?.name ?? id

export function describeEvent(event, nameOf) {
  switch (event.type) {
    case 'opening':
      return event.opening === 'preemptive' ? 'Preemptive strike!' : 'Ambushed!'

    case 'attack':
      return event.swing > 0 ? null : `${nameOf(event.actorId)} attacks!`

    case 'miss':
      return `${nameOf(event.actorId)} misses ${nameOf(event.targetId)}.`

    case 'damage': {
      if (event.amount === 0) return `${nameOf(event.targetId)} is unaffected.`
      const suffix =
        event.effectiveness === 'weak'
          ? ' A critical weakness!'
          : event.effectiveness === 'resist'
            ? ' It barely stings.'
            : ''
      const prefix = event.crit ? 'Critical hit! ' : ''
      return `${prefix}${nameOf(event.targetId)} takes ${event.amount} damage.${suffix}`
    }

    case 'heal':
      return `${nameOf(event.targetId)} recovers ${event.amount} HP.`

    case 'ko':
      return `${nameOf(event.targetId)} falls.`

    case 'revive':
      return `${nameOf(event.targetId)} is back on their feet.`

    case 'castSpell':
      return `${nameOf(event.actorId)} casts ${getSpell(event.spellId).name}!`

    case 'useItem':
      return `${nameOf(event.actorId)} uses the ${getItem(event.itemId).name}.`

    case 'defend':
      return `${nameOf(event.actorId)} braces.`

    case 'silenced':
      return `${nameOf(event.actorId)} cannot make a sound.`

    case 'noMp':
      return `${nameOf(event.actorId)} does not have the MP.`

    case 'fizzle':
      return 'The spell finds nothing to touch.'

    case 'retarget':
      return `${nameOf(event.toId)} steps into the path.`

    case 'statusApplied':
      return `${nameOf(event.targetId)} is ${statusName(event.status).toLowerCase()}!`

    case 'statusResisted':
      return `${nameOf(event.targetId)} shrugs it off.`

    case 'statusImmune':
      return `It has no hold on ${nameOf(event.targetId)}.`

    case 'statusCured':
      return `${nameOf(event.targetId)} is cured.`

    case 'statusTick':
      return `${nameOf(event.targetId)} suffers ${event.amount} from ${statusName(
        event.status,
      ).toLowerCase()}.`

    case 'buff':
      return `${nameOf(event.targetId)} is bolstered.`

    case 'wake':
      return event.status === 'sleep'
        ? `${nameOf(event.targetId)} wakes up.`
        : `${nameOf(event.targetId)} shakes it off.`

    case 'skipTurn':
      return event.reason === 'sleep'
        ? `${nameOf(event.actorId)} is fast asleep.`
        : `${nameOf(event.actorId)} cannot move.`

    case 'noEffect':
      return 'Nothing happens.'

    case 'flee':
      if (event.blocked) return 'There is no way out of this one.'
      return event.success ? 'You break away!' : 'You cannot escape!'

    case 'escaped':
      return 'The party escapes.'

    default:
      return null
  }
}
