import { getClass, STAT_KEYS } from '../data/classes.js'
import { EQUIP_SLOTS } from '../data/equipment.js'
import { getItem } from '../data/items.js'

/**
 * Derived stats are computed, never stored.
 *
 * Only level, XP, current HP/MP and equipment IDs live on a character. Max HP,
 * attack, defence and the rest are recomputed from class + level + gear every
 * time they are needed. That means changing a balance number in data/ takes
 * effect on existing saves instead of leaving them frozen at old values.
 */

export function baseStatsAtLevel(classDef, level) {
  const stats = {}
  for (const key of STAT_KEYS) {
    const base = classDef.base[key] ?? 0
    const growth = classDef.growth[key] ?? 0
    stats[key] = Math.round(base + growth * (level - 1))
  }
  return stats
}

export function equippedItems(character) {
  return EQUIP_SLOTS.map((slot) => character.equipment?.[slot])
    .filter(Boolean)
    .map((itemId) => getItem(itemId))
}

export function equippedIn(character, slot) {
  const itemId = character.equipment?.[slot]
  return itemId ? getItem(itemId) : null
}

export function deriveStats(character) {
  const classDef = getClass(character.classId)
  const level = character.level
  const stats = baseStatsAtLevel(classDef, level)
  const gear = equippedItems(character)

  let attackBonus = 0
  let defenseBonus = 0
  let magicDefenseBonus = 0
  let accuracyBonus = 0
  let evasionBonus = 0
  let critBonus = 0
  const resistances = []
  const immunities = []
  let weaponElement = null

  for (const item of gear) {
    for (const key of STAT_KEYS) {
      if (item.stats?.[key]) stats[key] += item.stats[key]
    }
    attackBonus += item.atk ?? 0
    defenseBonus += item.def ?? 0
    magicDefenseBonus += item.mdef ?? 0
    accuracyBonus += item.accuracy ?? 0
    evasionBonus += item.evasion ?? 0
    critBonus += item.crit ?? 0
    if (item.resist) resistances.push(...item.resist)
    if (item.immune) immunities.push(...item.immune)
    if (item.slot === 'weapon' && item.element) weaponElement = item.element
  }

  // Bare hands scale with level for the classes built around them.
  const hasWeapon = Boolean(character.equipment?.weapon)
  const unarmedBonus = hasWeapon ? 0 : Math.floor(level * (classDef.unarmed ?? 0))

  return {
    ...stats,
    maxHp: Math.max(1, stats.hp),
    maxMp: Math.max(0, stats.mp),
    attack: Math.floor(stats.str * 1.5) + attackBonus + unarmedBonus,
    defense: Math.floor(stats.vit * 0.5) + defenseBonus,
    magicAttack: Math.floor(stats.int * 1.5),
    magicDefense: Math.floor((stats.vit + stats.int) * 0.35) + magicDefenseBonus,
    accuracy: Math.floor(stats.agi / 4) + accuracyBonus,
    evasion: Math.floor(stats.agi / 4) + evasionBonus,
    critChance: 2 + Math.floor(stats.luk / 8) + critBonus,
    attacks: 1,
    weaponElement,
    resistances,
    immunities,
    weaknesses: [],
  }
}

export function maxHpOf(character) {
  return deriveStats(character).maxHp
}

export function maxMpOf(character) {
  return deriveStats(character).maxMp
}

/**
 * Current HP/MP can exceed the maximum after unequipping a stat-boosting
 * item, so anything that touches equipment must run this afterwards.
 */
export function clampVitals(character) {
  const { maxHp, maxMp } = deriveStats(character)
  const hp = Math.min(character.hp, maxHp)
  const mp = Math.min(character.mp, maxMp)
  if (hp === character.hp && mp === character.mp) return character
  return { ...character, hp, mp }
}
