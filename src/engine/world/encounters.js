import { getEncounterTable } from '../../data/encounterTables.js'

/**
 * Random encounters.
 *
 * The odds are a step counter, not a flat per-step roll. A flat roll produces
 * the worst pacing in the genre -- two fights in three paces, then nothing for
 * a whole floor. Instead nothing at all can happen for the zone's `minSteps`,
 * and after that the chance climbs with every quiet step, so encounters land
 * in a predictable-feeling rhythm without being predictable.
 */

export function encounterChance(zoneId, stepsSinceEncounter) {
  const table = getEncounterTable(zoneId)
  const over = stepsSinceEncounter - table.minSteps
  if (over < 0) return 0
  return Math.min(60, table.rate + over * 1.5)
}

export function rollEncounter(zoneId, stepsSinceEncounter, rng) {
  const chance = encounterChance(zoneId, stepsSinceEncounter)
  if (chance <= 0) return null
  if (!rng.chance(chance)) return null

  const table = getEncounterTable(zoneId)
  const group = rng.weighted(
    table.groups.map((entry) => ({ weight: entry.weight, value: entry })),
  )
  return group ? group.enemies.slice() : null
}
