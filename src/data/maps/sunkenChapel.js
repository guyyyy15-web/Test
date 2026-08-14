/**
 * The Sunken Chapel -- optional, and the hardest thing in the middle of the
 * game. The Warden guards a Ribbon, which is worth the trip.
 */

export const sunkenChapel = {
  id: 'sunkenChapel',
  name: "The Sunken Chapel",
  zone: 'chapel',
  palette: 'chapel',
  floors: [
    {
      id: 'f1',
      name: "Flooded Nave",
      spawn: { x: 9, y: 1 },
      tiles: [
        '####################',
        '#########E.#########',
        '#########..#########',
        '#..................#',
        '#.#######..#######.#',
        '#C#######..#######.#',
        '#.#######..#######.#',
        '#..................#',
        '#.#######..#######.#',
        '#.#######..#######C#',
        '#.#######..#######.#',
        '#..................#',
        '#########.>#########',
        '####################',
      ],
      props: {
        '9,1': { kind: 'exit' },
        '1,5': { itemId: 'remedy', qty: 3 },
        '18,9': { itemId: 'sage-staff' },
        '10,12': { floor: 'f2', x: 9, y: 12 },
      },
    },
    {
      id: 'f2',
      name: "The Reliquary Below",
      spawn: { x: 9, y: 12 },
      tiles: [
        '####################',
        '####################',
        '#C................C#',
        '#.#######.########.#',
        '#.#######.########.#',
        '#.###C.........###.#',
        '#.###..........###.#',
        '#.###....B.....###.#',
        '#.###..........###.#',
        '#.###..........###.#',
        '#.#######.########.#',
        '#.#######.########.#',
        '#........<.........#',
        '####################',
      ],
      props: {
        '9,12': { floor: 'f1', x: 10, y: 12 },
        '9,7': {
          kind: 'boss',
          enemyIds: ['chapelWarden'],
          flag: 'chapelWardenDefeated',
          reward: { itemId: 'ribbon' },
          intro: "It has been kneeling here a very long time. It stops.",
        },
        '1,2': { itemId: 'elixir', qty: 2 },
        '18,2': { itemId: 'aegis' },
        '5,5': { itemId: 'phoenix-down', qty: 3 },
      },
    },
  ],
}

export default sunkenChapel
