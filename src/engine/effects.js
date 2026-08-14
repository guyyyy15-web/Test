import { getItem } from '../data/items.js'
import { healPower } from './formulas.js'
import {
  damage as applyDamage,
  heal as applyHeal,
  isKO,
  removeStatuses,
  restoreMp as applyRestoreMp,
  revive as applyRevive,
} from './character.js'
import { deriveStats } from './stats.js'

/**
 * Item effects, resolved against a single character.
 *
 * Shared by the field menu and the battle engine so a Potion cannot heal a
 * different amount depending on where you drank it. Returns the new character
 * plus a description of what happened, which the battle UI replays as an
 * event and the field menu shows as a line of text.
 */

export function canTargetWith(effect, character) {
  switch (effect.target) {
    case 'deadAlly':
      return isKO(character)
    case 'ally':
      return !isKO(character)
    default:
      return true
  }
}

/**
 * @returns {{ character, applied: boolean, result: { kind, amount?, cured? } }}
 */
export function applyEffect(effect, character, rng) {
  switch (effect.kind) {
    case 'heal':
    case 'healAll': {
      if (isKO(character)) return miss(character)
      const { maxHp } = deriveStats(character)
      const amount = Math.min(effect.amount, maxHp - character.hp)
      if (amount <= 0) return miss(character)
      return {
        character: applyHeal(character, effect.amount),
        applied: true,
        result: { kind: 'heal', amount },
      }
    }

    case 'healPercent': {
      if (isKO(character)) return miss(character)
      const stats = deriveStats(character)
      const hpGain = Math.min(
        Math.ceil((stats.maxHp * effect.amount) / 100),
        stats.maxHp - character.hp,
      )
      const mpGain = Math.min(
        Math.ceil((stats.maxMp * effect.amount) / 100),
        stats.maxMp - character.mp,
      )
      if (hpGain <= 0 && mpGain <= 0) return miss(character)
      return {
        character: applyRestoreMp(applyHeal(character, hpGain), mpGain),
        applied: true,
        result: { kind: 'heal', amount: hpGain, mp: mpGain },
      }
    }

    case 'restoreMp': {
      if (isKO(character)) return miss(character)
      const { maxMp } = deriveStats(character)
      const amount = Math.min(effect.amount, maxMp - character.mp)
      if (amount <= 0) return miss(character)
      return {
        character: applyRestoreMp(character, effect.amount),
        applied: true,
        result: { kind: 'mp', amount },
      }
    }

    case 'revive': {
      if (!isKO(character)) return miss(character)
      return {
        character: applyRevive(character, effect.revivePercent ?? 25),
        applied: true,
        result: { kind: 'revive' },
      }
    }

    case 'cure': {
      const cured = (character.statuses ?? []).filter((status) =>
        effect.cures.includes(status),
      )
      if (cured.length === 0) return miss(character)
      return {
        character: removeStatuses(character, effect.cures),
        applied: true,
        result: { kind: 'cure', cured },
      }
    }

    case 'damage':
    case 'damageAll': {
      if (isKO(character)) return miss(character)
      const variance = Math.max(1, Math.floor(effect.power * 0.15))
      const amount = Math.max(1, effect.power + rng.int(-variance, variance))
      return {
        character: applyDamage(character, amount),
        applied: true,
        result: { kind: 'damage', amount },
      }
    }

    default:
      return miss(character)
  }
}

function miss(character) {
  return { character, applied: false, result: { kind: 'noEffect' } }
}

/**
 * Turn a restorative spell into a plain effect so field casting and item use
 * run down the same code path. Battle casting has its own resolver, because
 * it also has to produce events.
 */
export function fieldEffectForSpell(spell, caster, rng) {
  const casterStats = deriveStats(caster)
  switch (spell.kind) {
    case 'heal':
      return { kind: 'heal', amount: healPower(spell.power, casterStats, rng), target: 'ally' }
    case 'healAll':
      return {
        kind: 'healAll',
        amount: healPower(spell.power, casterStats, rng),
        target: 'allAllies',
      }
    case 'cure':
      return { kind: 'cure', cures: spell.cures, target: 'ally' }
    case 'revive':
      return { kind: 'revive', revivePercent: spell.revivePercent ?? 25, target: 'deadAlly' }
    default:
      return null
  }
}

/** Would using this item on this character accomplish anything? */
export function itemWouldHelp(itemId, character) {
  const item = getItem(itemId)
  if (!item.effect) return false

  const rehearsal = applyEffect(item.effect, character, { int: () => 0 })
  return rehearsal.applied
}
