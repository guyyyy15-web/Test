import { getClass } from '../../data/classes.js'
import { getEnemy } from '../../data/enemies.js'
import { deriveStats } from '../stats.js'
import { getStatus, hasStatus } from './status.js'

/**
 * Heroes and enemies become the same shape the moment a fight starts.
 *
 * Every rule in the battle loop -- turn order, targeting, damage, status --
 * then works on one type, which is what keeps `actions.js` short instead of
 * branching on "is this a monster?" at every step.
 */

export function combatantFromCharacter(character, index) {
  const stats = deriveStats(character)
  return {
    id: `p${index}`,
    side: 'party',
    sourceIndex: index,
    name: character.name,
    classId: character.classId,
    tag: getClass(character.classId).tag,
    color: getClass(character.classId).color,
    level: character.level,
    hp: character.hp,
    mp: character.mp,
    baseStats: stats,
    spells: character.spells,
    statuses: (character.statuses ?? [])
      .filter((id) => id !== 'ko')
      .map((id) => ({ id, turns: Infinity })),
    buffs: [],
    defending: false,
    traits: [],
    weaknesses: stats.weaknesses,
    resistances: stats.resistances,
    immunities: stats.immunities,
    statusImmunities: stats.statusImmunities,
    ai: null,
  }
}

export function combatantFromEnemy(enemyId, index) {
  const enemy = getEnemy(enemyId)
  return {
    id: `e${index}`,
    side: 'enemy',
    sourceIndex: index,
    enemyId,
    // "Goblin A", "Goblin B" -- so a player can tell three of them apart.
    name: enemy.name,
    label: null,
    tag: enemy.tag,
    color: enemy.color,
    level: enemy.level,
    hp: enemy.hp,
    mp: enemy.mp ?? 0,
    baseStats: {
      maxHp: enemy.hp,
      maxMp: enemy.mp ?? 0,
      attack: enemy.attack,
      defense: enemy.defense,
      magicAttack: enemy.magicAttack ?? 0,
      magicDefense: enemy.magicDefense ?? 0,
      accuracy: enemy.accuracy ?? 0,
      evasion: enemy.evasion ?? 0,
      critChance: enemy.critChance ?? 1,
      agi: enemy.agi,
      attacks: enemy.attacks ?? 1,
      weaponElement: enemy.attackElement ?? null,
    },
    spells: enemy.ai?.filter((entry) => entry.spellId).map((entry) => entry.spellId) ?? [],
    statuses: [],
    buffs: [],
    defending: false,
    traits: enemy.traits ?? [],
    weaknesses: enemy.weaknesses ?? [],
    resistances: enemy.resistances ?? [],
    immunities: enemy.immunities ?? [],
    statusImmunities: enemy.statusImmunities ?? [],
    ai: enemy.ai ?? [{ weight: 1, kind: 'attack' }],
    xp: enemy.xp,
    gold: enemy.gold,
    drops: enemy.drops ?? [],
    boss: enemy.boss ?? false,
  }
}

/** Multiple copies of one enemy get A/B/C suffixes, the classic disambiguator. */
export function labelDuplicates(combatants) {
  const counts = new Map()
  for (const combatant of combatants) {
    if (combatant.side !== 'enemy') continue
    counts.set(combatant.enemyId, (counts.get(combatant.enemyId) ?? 0) + 1)
  }

  const seen = new Map()
  return combatants.map((combatant) => {
    if (combatant.side !== 'enemy') return combatant
    if (counts.get(combatant.enemyId) === 1) return { ...combatant, label: combatant.name }
    const ordinal = (seen.get(combatant.enemyId) ?? 0) + 1
    seen.set(combatant.enemyId, ordinal)
    return {
      ...combatant,
      label: `${combatant.name} ${String.fromCharCode(64 + ordinal)}`,
    }
  })
}

export function displayName(combatant) {
  return combatant.label ?? combatant.name
}

export function isDown(combatant) {
  if (combatant.hp <= 0) return true
  return combatant.statuses.some((entry) => getStatus(entry.id)?.countsAsDown)
}

export function canAct(combatant) {
  return !isDown(combatant)
}

/**
 * Stats as they actually apply right now: base, plus buffs, minus whatever
 * the current statuses are doing, plus the defend bonus.
 */
export function effectiveStats(combatant) {
  const stats = { ...combatant.baseStats }

  for (const buff of combatant.buffs) {
    stats[buff.stat] = (stats[buff.stat] ?? 0) + buff.amount
  }

  for (const entry of combatant.statuses) {
    const status = getStatus(entry.id)
    if (!status) continue
    if (status.accuracyPenalty) stats.accuracy -= status.accuracyPenalty
    if (status.agilityMultiplier) stats.agi = Math.floor(stats.agi * status.agilityMultiplier)
  }

  if (combatant.defending) stats.defense = Math.floor(stats.defense * 2)

  stats.attacks = Math.max(1, stats.attacks ?? 1)
  return stats
}

export function isSilenced(combatant) {
  return hasStatus(combatant, 'silence')
}

export function alliesOf(battle, combatant) {
  return battle.combatants.filter((other) => other.side === combatant.side)
}

export function enemiesOf(battle, combatant) {
  return battle.combatants.filter((other) => other.side !== combatant.side)
}

export function findCombatant(battle, id) {
  return battle.combatants.find((combatant) => combatant.id === id) ?? null
}

export function replaceCombatant(battle, combatant) {
  return {
    ...battle,
    combatants: battle.combatants.map((existing) =>
      existing.id === combatant.id ? combatant : existing,
    ),
  }
}

export function partySide(battle) {
  return battle.combatants.filter((combatant) => combatant.side === 'party')
}

export function enemySide(battle) {
  return battle.combatants.filter((combatant) => combatant.side === 'enemy')
}
