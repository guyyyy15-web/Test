import { getClass } from '../data/classes.js'
import { MAX_LEVEL, xpToNext } from './formulas.js'
import { clampVitals, deriveStats } from './stats.js'

/**
 * Character creation and progression. Every function here is pure and returns
 * a new character rather than mutating the one it was given.
 */

/** Statuses that survive the end of a battle and follow you into the field. */
export const PERSISTENT_STATUSES = new Set(['poison', 'ko', 'stone'])

export function spellsKnownAt(classDef, level) {
  const known = []
  for (const [atLevel, spellIds] of Object.entries(classDef.spellsByLevel ?? {})) {
    if (Number(atLevel) <= level) known.push(...spellIds)
  }
  return known
}

export function spellsLearnedAtLevel(classDef, level) {
  return classDef.spellsByLevel?.[level] ?? []
}

export function createCharacter({ id, name, classId, level = 1, equipment = {} }) {
  const classDef = getClass(classId)
  const base = {
    id,
    name,
    classId,
    level,
    xp: 0,
    hp: 1,
    mp: 0,
    equipment: {
      weapon: null,
      offhand: null,
      head: null,
      body: null,
      accessory: null,
      ...equipment,
    },
    spells: spellsKnownAt(classDef, level),
    statuses: [],
  }
  const { maxHp, maxMp } = deriveStats(base)
  return { ...base, hp: maxHp, mp: maxMp }
}

export function isKO(character) {
  return character.hp <= 0 || character.statuses?.includes('ko')
}

/** A character who can act: alive, not petrified. */
export function isActive(character) {
  return !isKO(character) && !character.statuses?.includes('stone')
}

export function restore(character) {
  const { maxHp, maxMp } = deriveStats(character)
  return {
    ...character,
    hp: maxHp,
    mp: maxMp,
    statuses: character.statuses?.filter((s) => !PERSISTENT_STATUSES.has(s)) ?? [],
  }
}

export function heal(character, amount) {
  if (isKO(character)) return character
  const { maxHp } = deriveStats(character)
  return { ...character, hp: Math.min(maxHp, character.hp + amount) }
}

export function restoreMp(character, amount) {
  const { maxMp } = deriveStats(character)
  return { ...character, mp: Math.min(maxMp, character.mp + amount) }
}

export function damage(character, amount) {
  const hp = Math.max(0, character.hp - amount)
  const statuses = hp === 0 ? addStatus(character.statuses, 'ko') : character.statuses
  return { ...character, hp, statuses }
}

export function revive(character, percent) {
  if (!isKO(character)) return character
  const { maxHp } = deriveStats(character)
  const hp = Math.max(1, Math.floor((maxHp * percent) / 100))
  return {
    ...character,
    hp,
    statuses: (character.statuses ?? []).filter((s) => s !== 'ko'),
  }
}

export function addStatus(statuses = [], status) {
  return statuses.includes(status) ? statuses : [...statuses, status]
}

export function removeStatuses(character, cures) {
  const statuses = (character.statuses ?? []).filter((s) => !cures.includes(s))
  return statuses.length === character.statuses?.length ? character : { ...character, statuses }
}

/**
 * Award XP and apply every level gained. Returns the new character plus what
 * changed, so the UI can show the classic "Level up! Learned Fire!" screen.
 */
export function gainXp(character, amount) {
  if (character.level >= MAX_LEVEL) {
    return { character, levelsGained: 0, learnedSpells: [], statGains: null }
  }

  const classDef = getClass(character.classId)
  const before = deriveStats(character)

  let level = character.level
  let xp = character.xp + Math.max(0, amount)
  let levelsGained = 0
  const learnedSpells = []

  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level)
    level += 1
    levelsGained += 1
    learnedSpells.push(
      ...spellsLearnedAtLevel(classDef, level).filter(
        (spellId) => !character.spells.includes(spellId) && !learnedSpells.includes(spellId),
      ),
    )
  }

  if (levelsGained === 0) {
    return { character: { ...character, xp }, levelsGained: 0, learnedSpells: [], statGains: null }
  }

  const levelled = {
    ...character,
    level,
    xp,
    spells: [...character.spells, ...learnedSpells],
  }
  const after = deriveStats(levelled)

  // Levelling grants the difference in maximums, so a level-up in a dungeon
  // is a real reward rather than a full heal.
  return {
    character: {
      ...levelled,
      hp: character.hp + (after.maxHp - before.maxHp),
      mp: character.mp + (after.maxMp - before.maxMp),
    },
    levelsGained,
    learnedSpells,
    statGains: {
      maxHp: after.maxHp - before.maxHp,
      maxMp: after.maxMp - before.maxMp,
      str: after.str - before.str,
      agi: after.agi - before.agi,
      vit: after.vit - before.vit,
      int: after.int - before.int,
      luk: after.luk - before.luk,
    },
  }
}

/** The mid-game class change. Level, XP and gear all carry over. */
export function promote(character) {
  const classDef = getClass(character.classId)
  if (!classDef.promotion) return character

  const promoted = getClass(classDef.promotion)
  const merged = {
    ...character,
    classId: promoted.id,
    spells: Array.from(
      new Set([...character.spells, ...spellsKnownAt(promoted, character.level)]),
    ),
  }
  return clampVitals(merged)
}

export function xpToNextFor(character) {
  return xpToNext(character.level)
}

/** Party-wide helpers. */
export function isPartyWiped(party) {
  return party.every((member) => !isActive(member))
}

export function livingMembers(party) {
  return party.filter(isActive)
}
