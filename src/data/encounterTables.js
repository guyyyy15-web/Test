/**
 * Random encounter tables, one per zone.
 *
 * `minSteps` is the floor below which nothing can happen. Pure per-step
 * randomness feels terrible -- two fights in three paces, then nothing for a
 * screen -- so every zone guarantees a stretch of quiet first, and the odds
 * only start climbing after that.
 */

export const ENCOUNTER_TABLES = {
  plains: {
    minSteps: 12,
    rate: 7,
    groups: [
      { weight: 5, enemies: ['giantRat', 'giantRat'] },
      { weight: 4, enemies: ['goblin'] },
      { weight: 3, enemies: ['goblin', 'giantRat'] },
      { weight: 2, enemies: ['wasp', 'wasp'] },
      { weight: 1, enemies: ['wildBoar'] },
    ],
  },

  mine: {
    minSteps: 10,
    rate: 9,
    groups: [
      { weight: 5, enemies: ['kobold'] },
      { weight: 4, enemies: ['caveBat', 'caveBat'] },
      { weight: 4, enemies: ['mineSlime'] },
      { weight: 3, enemies: ['kobold', 'caveBat'] },
      { weight: 3, enemies: ['skeleton'] },
      { weight: 2, enemies: ['rockCrab'] },
      { weight: 1, enemies: ['skeleton', 'skeleton', 'mineSlime'] },
    ],
  },

  coast: {
    minSteps: 11,
    rate: 9,
    groups: [
      { weight: 5, enemies: ['sahagin'] },
      { weight: 4, enemies: ['pirate'] },
      { weight: 3, enemies: ['mudToad'] },
      { weight: 3, enemies: ['sahagin', 'sahagin'] },
      { weight: 2, enemies: ['willOWisp'] },
      { weight: 3, enemies: ['drownedSailor'] },
      { weight: 3, enemies: ['marshLurker'] },
      { weight: 1, enemies: ['pirate', 'pirate', 'sahagin'] },
      { weight: 1, enemies: ['drownedSailor', 'drownedSailor', 'sahagin'] },
    ],
  },

  /**
   * The optional chapel sits a good six levels above the coast it is reached
   * from, so it gets its own table rather than borrowing one that would make
   * it a walkover.
   */
  chapel: {
    minSteps: 9,
    rate: 12,
    groups: [
      { weight: 5, enemies: ['deepOne'] },
      { weight: 4, enemies: ['drownedSailor', 'drownedSailor'] },
      { weight: 3, enemies: ['willOWisp', 'willOWisp'] },
      { weight: 3, enemies: ['deepOne', 'marshLurker'] },
      { weight: 2, enemies: ['wraith'] },
      { weight: 1, enemies: ['deepOne', 'deepOne', 'drownedSailor'] },
    ],
  },

  peaks: {
    minSteps: 11,
    rate: 10,
    groups: [
      { weight: 5, enemies: ['harpy'] },
      { weight: 4, enemies: ['gargoyle'] },
      { weight: 3, enemies: ['stormElemental'] },
      { weight: 3, enemies: ['harpy', 'harpy'] },
      { weight: 2, enemies: ['wyvern'] },
      { weight: 4, enemies: ['thunderHawk'] },
      { weight: 3, enemies: ['frostWisp'] },
      { weight: 1, enemies: ['gargoyle', 'stormElemental'] },
      { weight: 1, enemies: ['thunderHawk', 'thunderHawk', 'harpy'] },
    ],
  },

  ruins: {
    minSteps: 10,
    rate: 11,
    groups: [
      { weight: 5, enemies: ['ghoul'] },
      { weight: 4, enemies: ['wraith'] },
      { weight: 3, enemies: ['boneKnight'] },
      { weight: 3, enemies: ['ghoul', 'ghoul'] },
      { weight: 2, enemies: ['lichAcolyte'] },
      { weight: 4, enemies: ['graveMoth'] },
      { weight: 3, enemies: ['boneHound', 'boneHound'] },
      { weight: 1, enemies: ['boneKnight', 'wraith'] },
      { weight: 1, enemies: ['graveMoth', 'graveMoth', 'boneHound'] },
    ],
  },

  caldera: {
    minSteps: 10,
    rate: 12,
    groups: [
      { weight: 5, enemies: ['fireDrake'] },
      { weight: 4, enemies: ['magmaGolem'] },
      { weight: 4, enemies: ['shade'] },
      { weight: 3, enemies: ['dreadKnight'] },
      { weight: 4, enemies: ['cinderImp'] },
      { weight: 3, enemies: ['ashWraith'] },
      { weight: 2, enemies: ['fireDrake', 'shade'] },
      { weight: 2, enemies: ['cinderImp', 'cinderImp', 'ashWraith'] },
      { weight: 1, enemies: ['dreadKnight', 'magmaGolem'] },
    ],
  },
}

export function getEncounterTable(zoneId) {
  const table = ENCOUNTER_TABLES[zoneId]
  if (!table) throw new Error(`Unknown encounter zone: ${zoneId}`)
  return table
}
