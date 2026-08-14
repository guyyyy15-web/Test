/**
 * Status effects.
 *
 * Each status is data: what it blocks, what it modifies, whether it survives
 * the end of a fight. The battle loop reads these fields rather than
 * switching on status names, so adding one is a data change.
 */

export const STATUSES = {
  poison: {
    id: 'poison',
    name: 'Poison',
    short: 'PSN',
    persists: true,
    /** Percent of max HP lost at the end of each round. */
    tickPercent: 8,
  },
  blind: {
    id: 'blind',
    name: 'Blind',
    short: 'BLD',
    accuracyPenalty: 40,
  },
  silence: {
    id: 'silence',
    name: 'Silence',
    short: 'SIL',
    blocksMagic: true,
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    short: 'SLP',
    skipsTurn: true,
    wakeOnDamage: true,
    /** Chance per round of waking on its own. */
    wakeChance: 25,
  },
  paralysis: {
    id: 'paralysis',
    name: 'Paralysis',
    short: 'PAR',
    skipsTurn: true,
    wakeChance: 33,
  },
  slow: {
    id: 'slow',
    name: 'Slow',
    short: 'SLO',
    agilityMultiplier: 0.5,
  },
  stone: {
    id: 'stone',
    name: 'Petrified',
    short: 'STN',
    skipsTurn: true,
    persists: true,
    countsAsDown: true,
  },
}

export function getStatus(statusId) {
  return STATUSES[statusId] ?? null
}

export function hasStatus(combatant, statusId) {
  return combatant.statuses.some((entry) => entry.id === statusId)
}

export function statusIds(combatant) {
  return combatant.statuses.map((entry) => entry.id)
}

/** Statuses that follow a character out of the battle and onto the map. */
export function persistentStatusIds(combatant) {
  return combatant.statuses
    .filter((entry) => getStatus(entry.id)?.persists)
    .map((entry) => entry.id)
}

export function addStatus(combatant, statusId, turns = Infinity) {
  if (hasStatus(combatant, statusId)) return combatant
  return { ...combatant, statuses: [...combatant.statuses, { id: statusId, turns }] }
}

export function removeStatus(combatant, statusId) {
  if (!hasStatus(combatant, statusId)) return combatant
  return {
    ...combatant,
    statuses: combatant.statuses.filter((entry) => entry.id !== statusId),
  }
}

export function removeStatuses(combatant, statusIdList) {
  const removed = combatant.statuses.filter((entry) => statusIdList.includes(entry.id))
  if (removed.length === 0) return { combatant, removed: [] }
  return {
    combatant: {
      ...combatant,
      statuses: combatant.statuses.filter((entry) => !statusIdList.includes(entry.id)),
    },
    removed: removed.map((entry) => entry.id),
  }
}

export function isImmuneToStatus(combatant, statusId) {
  return combatant.statusImmunities?.includes(statusId) ?? false
}

export function blocksMagic(combatant) {
  return combatant.statuses.some((entry) => getStatus(entry.id)?.blocksMagic)
}

/** Sleep and paralysis cost a turn; petrification costs all of them. */
export function skipsTurn(combatant) {
  return combatant.statuses.find((entry) => getStatus(entry.id)?.skipsTurn) ?? null
}
