import { getSpell } from '../../data/spells.js'
import { effectiveStats, isSilenced } from './combatant.js'
import { livingOn } from './targeting.js'

/**
 * Enemy decision making.
 *
 * An enemy's `ai` is a weighted list of options, optionally gated on how hurt
 * it is. That is enough for bosses to feel like they change gear at low HP
 * without any scripting language, and it stays readable in the data file.
 *
 * Commands are chosen at resolution time, not at the start of the round, so
 * enemies react to what has already happened this round.
 */

function isAvailable(battle, actor, option) {
  const stats = effectiveStats(actor)

  if (option.whenHpBelow != null) {
    if (actor.hp / stats.maxHp > option.whenHpBelow) return false
  }

  if (option.kind === 'spell') {
    if (isSilenced(actor)) return false
    const spell = getSpell(option.spellId)
    if (actor.mp < spell.mp) return false
    // Do not cast a heal-others spell with nobody to help, etc.
    const scope = spell.target
    if (scope === 'allEnemies' || scope === 'enemy') {
      if (livingOn(battle, actor.side === 'party' ? 'enemy' : 'party').length === 0) return false
    }
  }

  return true
}

export function chooseEnemyCommand(battle, actor, rng) {
  const options = (actor.ai ?? []).filter((option) => isAvailable(battle, actor, option))
  const chosen = rng.weighted(options.map((option) => ({ weight: option.weight ?? 1, value: option })))

  if (!chosen) return { kind: 'attack' }

  switch (chosen.kind) {
    case 'defend':
      return { kind: 'defend' }

    case 'spell': {
      const spell = getSpell(chosen.spellId)
      return { kind: 'spell', spellId: chosen.spellId, targetId: pickTargetFor(battle, actor, spell.target, rng) }
    }

    case 'attack':
    default:
      return {
        kind: 'attack',
        targetId: pickTargetFor(battle, actor, 'enemy', rng),
        inflicts: chosen.inflicts,
      }
  }
}

function pickTargetFor(battle, actor, scope, rng) {
  switch (scope) {
    case 'self':
      return actor.id
    case 'ally':
    case 'allAllies':
      return rng.pick(livingOn(battle, actor.side))?.id ?? actor.id
    case 'allEnemies':
    case 'enemy':
    default:
      return rng.pick(livingOn(battle, actor.side === 'party' ? 'enemy' : 'party'))?.id ?? null
  }
}
