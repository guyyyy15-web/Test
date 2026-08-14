/**
 * Every number the game argues about, in one file.
 *
 * These are deliberately simple and readable rather than clever: balance is
 * tuned by changing constants here and re-running tools/sim.js, so the shape
 * of each formula has to stay obvious.
 */

export const MAX_LEVEL = 50

/** Base chance to connect, before accuracy and evasion push it around. */
export const BASE_HIT = 85
export const MIN_HIT = 5
export const MAX_HIT = 99

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function hitChance(attacker, defender) {
  return clamp(BASE_HIT + attacker.accuracy - defender.evasion, MIN_HIT, MAX_HIT)
}

/**
 * Physical damage. Attack rolls up to +25% of itself, then defence subtracts
 * flat. A hit always lands for at least 1, so no fight is unwinnable by
 * arithmetic alone.
 */
export function physicalDamage(attacker, defender, rng) {
  const variance = Math.max(1, Math.floor(attacker.attack * 0.25))
  const rolled = attacker.attack + rng.int(0, variance)
  return Math.max(1, rolled - defender.defense)
}

/**
 * Magic ignores physical defence entirely and is resisted by half of magic
 * defence -- which is what makes the Black Mage the answer to armoured
 * enemies and useless against warded ones.
 */
export function magicDamage(power, caster, defender, rng) {
  const base = power + Math.floor(caster.magicAttack * 0.6)
  const variance = Math.max(1, Math.floor(base * 0.12))
  const rolled = base + rng.int(-variance, variance)
  return Math.max(1, rolled - Math.floor(defender.magicDefense * 0.5))
}

export function healPower(power, caster, rng) {
  if (power >= 9999) return 9999
  const base = power + Math.floor(caster.magicAttack * 0.5)
  const variance = Math.max(1, Math.floor(base * 0.1))
  return Math.max(1, base + rng.int(-variance, variance))
}

export function critChanceFor(attacker) {
  return clamp(attacker.critChance, 0, 50)
}

export const CRIT_MULTIPLIER = 2

/** Status landing chance: the spell's own accuracy, resisted by magic defence. */
export function statusChance(spellAccuracy, defender) {
  return clamp(spellAccuracy - Math.floor(defender.magicDefense * 0.4), 5, 95)
}

/**
 * Escape odds. Party agility against enemy agility, with a floor so a fight
 * is never a guaranteed trap, and a ceiling so fleeing is never free.
 */
export function fleeChance(partyAgility, enemyAgility, attempts = 0) {
  const ratio = partyAgility / Math.max(1, enemyAgility)
  return clamp(Math.round(35 + ratio * 25 + attempts * 12), 15, 90)
}

// ------------------------------------------------------------- Elements --

export const ELEMENT_MULTIPLIER = {
  weak: 1.5,
  resist: 0.5,
  immune: 0,
  normal: 1,
}

/**
 * `target` carries `weaknesses`, `resistances` and `immunities` arrays.
 * Being both weak and resistant cancels out to normal, which keeps data
 * authoring forgiving.
 */
export function elementMultiplier(element, target) {
  if (!element) return 1
  const immune = target.immunities?.includes(element)
  if (immune) return ELEMENT_MULTIPLIER.immune

  const weak = target.weaknesses?.includes(element)
  const resistant = target.resistances?.includes(element)
  if (weak && resistant) return ELEMENT_MULTIPLIER.normal
  if (weak) return ELEMENT_MULTIPLIER.weak
  if (resistant) return ELEMENT_MULTIPLIER.resist
  return ELEMENT_MULTIPLIER.normal
}

// ---------------------------------------------------------- Progression --

/**
 * XP needed to go from `level` to `level + 1`.
 * Level 2 costs 28; level 30 costs about 6,900; level 50 about 15,600.
 */
export function xpToNext(level) {
  if (level >= MAX_LEVEL) return Infinity
  return Math.round(28 * level ** 1.6)
}

/** Total XP from level 1 to `level`. Used by the simulator and debug tools. */
export function totalXpForLevel(level) {
  let total = 0
  for (let l = 1; l < level; l++) total += xpToNext(l)
  return total
}

/** Enemy XP and gold payouts scale off this so encounter data stays terse. */
export function encounterReward(enemies) {
  return enemies.reduce(
    (totals, enemy) => ({
      xp: totals.xp + (enemy.xp ?? 0),
      gold: totals.gold + (enemy.gold ?? 0),
    }),
    { xp: 0, gold: 0 },
  )
}
