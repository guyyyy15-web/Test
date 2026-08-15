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
      { weight: 4, enemies: ['goblin', 'goblin'] },
      { weight: 3, enemies: ['goblin', 'giantRat'] },
      { weight: 2, enemies: ['wasp', 'wasp'] },
      { weight: 1, enemies: ['wildBoar', 'wildBoar'] },
    ],
  },

  /**
   * The Ember Mine's upper floor. The party reaches it at level 1 -- Emberfall
   * to the mine is the only road in the game, so there is nowhere to grind
   * first and this table has to be beatable straight out of character
   * creation.
   */
  mineUpper: {
    minSteps: 10,
    rate: 9,
    groups: [
      { weight: 6, enemies: ['giantRat', 'giantRat'] },
      { weight: 5, enemies: ['goblin'] },
      { weight: 4, enemies: ['wasp', 'wasp'] },
      { weight: 3, enemies: ['goblin', 'giantRat'] },
      { weight: 2, enemies: ['caveBat'] },
      { weight: 1, enemies: ['wildBoar'] },
    ],
  },

  mine: {
    minSteps: 10,
    rate: 9,
    groups: [
      { weight: 5, enemies: ['goblin', 'goblin'] },
      { weight: 5, enemies: ['caveBat', 'caveBat'] },
      { weight: 4, enemies: ['kobold'] },
      { weight: 4, enemies: ['mineSlime'] },
      { weight: 3, enemies: ['kobold', 'caveBat'] },
      { weight: 3, enemies: ['skeleton'] },
      { weight: 2, enemies: ['rockCrab'] },
      { weight: 2, enemies: ['skeleton', 'caveBat'] },
    ],
  },

  coast: {
    minSteps: 11,
    rate: 9,
    groups: [
      { weight: 5, enemies: ['sahagin', 'sahagin'] },
      { weight: 4, enemies: ['pirate', 'pirate'] },
      { weight: 3, enemies: ['mudToad', 'mudToad'] },
      { weight: 3, enemies: ['sahagin', 'sahagin'] },
      { weight: 2, enemies: ['willOWisp', 'willOWisp'] },
      { weight: 3, enemies: ['drownedSailor', 'drownedSailor'] },
      { weight: 3, enemies: ['marshLurker', 'marshLurker'] },
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
      { weight: 5, enemies: ['deepOne', 'deepOne'] },
      { weight: 4, enemies: ['drownedSailor', 'drownedSailor'] },
      { weight: 3, enemies: ['willOWisp', 'willOWisp'] },
      { weight: 3, enemies: ['deepOne', 'marshLurker'] },
      { weight: 2, enemies: ['wraith', 'wraith'] },
      { weight: 1, enemies: ['deepOne', 'deepOne', 'drownedSailor'] },
    ],
  },

  peaks: {
    minSteps: 11,
    rate: 10,
    groups: [
      { weight: 5, enemies: ['harpy', 'harpy'] },
      { weight: 4, enemies: ['gargoyle'] },
      { weight: 3, enemies: ['stormElemental'] },
      { weight: 3, enemies: ['harpy', 'harpy'] },
      { weight: 2, enemies: ['wyvern'] },
      { weight: 4, enemies: ['thunderHawk', 'thunderHawk'] },
      { weight: 3, enemies: ['frostWisp', 'frostWisp'] },
      { weight: 1, enemies: ['gargoyle', 'harpy'] },
      { weight: 1, enemies: ['thunderHawk', 'harpy'] },
    ],
  },

  ruins: {
    minSteps: 10,
    rate: 11,
    groups: [
      { weight: 5, enemies: ['ghoul', 'ghoul'] },
      { weight: 4, enemies: ['wraith', 'wraith'] },
      { weight: 3, enemies: ['boneKnight'] },
      { weight: 3, enemies: ['ghoul', 'ghoul'] },
      { weight: 2, enemies: ['lichAcolyte'] },
      { weight: 4, enemies: ['graveMoth', 'graveMoth'] },
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
      { weight: 4, enemies: ['shade', 'shade'] },
      { weight: 3, enemies: ['dreadKnight'] },
      { weight: 4, enemies: ['cinderImp', 'cinderImp'] },
      { weight: 3, enemies: ['ashWraith', 'ashWraith'] },
      { weight: 2, enemies: ['fireDrake', 'shade'] },
      { weight: 2, enemies: ['cinderImp', 'cinderImp'] },
    ],
  },
}

export function getEncounterTable(zoneId) {
  const table = ENCOUNTER_TABLES[zoneId]
  if (!table) throw new Error(`Unknown encounter zone: ${zoneId}`)
  return table
}
