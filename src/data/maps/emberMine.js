/**
 * The Ember Mine -- the first real dungeon.
 *
 * Three floors: a looping upper level that teaches the controls, a symmetrical
 * middle level of side rooms, and a spiral approach to the Warden's chamber.
 *
 * Floors are plain ASCII. Anything a tile needs beyond its type -- what is in
 * the chest, where the stairs lead -- lives in `props`, keyed by "x,y".
 */

export const emberMine = {
  id: 'emberMine',
  name: 'The Ember Mine',
  zone: 'mine',
  palette: 'mine',
  floors: [
    {
      id: 'b1',
      name: 'Ember Mine 1F',
      spawn: { x: 1, y: 1 },
      tiles: [
        '####################',
        '#E.......#.........#',
        '#.##.###.#.###.###.#',
        '#.#....#.#.#.....#.#',
        '#.#.C..#.#.#..C..#.#',
        '#.#....#.#.#.....#.#',
        '#.######.#.#######.#',
        '#........#.........#',
        '#.########.#######.#',
        '#.#......#.......#.#',
        '#.#.####.#######.#.#',
        '#...#..............#',
        '#####.##########.>.#',
        '####################',
      ],
      props: {
        '1,1': { kind: 'exit' },
        '4,4': { itemId: 'potion', qty: 2 },
        '14,4': { itemId: 'bronze-sword' },
        '17,12': { floor: 'b2', x: 1, y: 11 },
      },
    },

    {
      id: 'b2',
      name: 'Ember Mine 2F',
      spawn: { x: 1, y: 11 },
      tiles: [
        '####################',
        '#..................#',
        '#.###.#######.####.#',
        '#.#.....###......#.#',
        '#.#..C..###...C..#.#',
        '#.#.....###......#.#',
        '#.################.#',
        '#.#.....###......#.#',
        '#.#.....###...B..#.#',
        '#.#.....###......#.#',
        '#.###.#######.####.#',
        '#<................>#',
        '####################',
        '####################',
      ],
      props: {
        '5,4': { itemId: 'hi-potion', qty: 2 },
        '14,4': { itemId: 'iron-dagger' },
        '14,8': {
          kind: 'boss',
          enemyIds: ['goblinChief', 'goblin', 'goblin'],
          flag: 'goblinChiefDefeated',
          reward: { itemId: 'bronze-plate' },
          intro: 'The biggest one in the room stands up, and keeps standing up.',
        },
        '1,11': { floor: 'b1', x: 17, y: 12 },
        '18,11': { floor: 'b3', x: 10, y: 12 },
      },
    },

    {
      id: 'b3',
      name: "The Warden's Seam",
      spawn: { x: 10, y: 12 },
      tiles: [
        '####################',
        '#C................C#',
        '#.#######.########.#',
        '#.#######.########.#',
        '#.##............##.#',
        '#.##.##########.##.#',
        '#.##.##C.B...##.##.#',
        '#.##.##......##.##.#',
        '#.##.####.#####.##.#',
        '#.##............##.#',
        '#.################.#',
        '#.################.#',
        '#.........<........#',
        '####################',
      ],
      props: {
        '9,6': {
          kind: 'boss',
          enemyIds: ['mineWarden'],
          flag: 'mineWardenDefeated',
          reward: { itemId: 'sunstone' },
          intro: 'Something very large uncurls from the dark.',
        },
        '1,1': { itemId: 'ether', qty: 2 },
        '18,1': { itemId: 'mythril-shield' },
        '7,6': { itemId: 'phoenix-down' },
        '10,12': { floor: 'b2', x: 18, y: 11 },
      },
    },
  ],
}

export default emberMine
