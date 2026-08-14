/**
 * The Drowned Causeway -- a road the sea took back.
 *
 * Two floors: a broad causeway with platforms either side, and the deep
 * channel where the serpent waits.
 */

export const drownedCauseway = {
  id: 'drownedCauseway',
  name: "The Drowned Causeway",
  zone: 'coast',
  palette: 'coast',
  floors: [
    {
      id: 'f1',
      name: "Causeway",
      spawn: { x: 1, y: 6 },
      tiles: [
        '####################',
        '####################',
        '###....####......###',
        '###.C..####....C.###',
        '###....####......###',
        '####.########.######',
        '#E.................#',
        '#####.########.###.#',
        '###....####......#.#',
        '###....####......#.#',
        '###.C..####....C.#.#',
        '###....####......#>#',
        '####################',
        '####################',
      ],
      props: {
        '1,6': { kind: 'exit' },
        '4,3': { itemId: 'hi-potion', qty: 2 },
        '15,3': { itemId: 'war-lance' },
        '4,10': { itemId: 'ether', qty: 2 },
        '15,10': { itemId: 'chain-vest' },
        '18,11': { floor: 'f2', x: 1, y: 11 },
      },
    },
    {
      id: 'f2',
      name: "The Deep Channel",
      spawn: { x: 1, y: 11 },
      tiles: [
        '####################',
        '#C................C#',
        '#.#######.########.#',
        '#.#######.########.#',
        '#.####........####.#',
        '#.####........####.#',
        '#.####...B....####.#',
        '#.####........####.#',
        '#.####........####.#',
        '#.#######.########.#',
        '#.#######.########.#',
        '#<.................#',
        '####################',
        '####################',
      ],
      props: {
        '1,11': { floor: 'f1', x: 18, y: 11 },
        '9,6': {
          kind: 'boss',
          enemyIds: ['tideSerpent'],
          flag: 'tideSerpentDefeated',
          reward: { itemId: 'tidestone' },
          intro: "The water goes flat, and then it does not.",
        },
        '1,1': { itemId: 'elixir' },
        '18,1': { itemId: 'mythril-helm' },
      },
    },
  ],
}

export default drownedCauseway
