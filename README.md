# Ember Crown

A classic turn-based JRPG that runs in a browser, on a phone or a desktop.

Build a party of four heroes from six classes, walk the Ember Mine, take the
drowned coast road, climb the Storm Spire, and go down into the caldera after
the crown. Four stones, four keepers, one ending.

```bash
npm install
npm run dev      # play it
npm test         # 213 tests
npm run lint
npm run build
npm run sim -- --sweep     # balance report
```

## What it is

| | |
|---|---|
| Exploration | Towns and the world map are menus; dungeons are walkable tile maps |
| Party | FF1 style — four blank heroes, name and class each, at the start |
| Combat | Pure turn-based: enter all four commands, the round resolves in speed order |
| Art | Colour-and-shape placeholders behind a swappable interface |
| Controls | Arrows/WASD, Z or Enter to confirm, X or Esc to cancel; virtual d-pad on touch |

Six classes — Warrior, Thief, Monk, White Mage, Black Mage, Red Mage — each
with a mid-game promotion. Six dungeons (one optional), five towns, 41 enemies,
~40 spells, ~60 pieces of equipment.

## How it is built

React + Vite, canvas 2D for dungeon floors, **no runtime dependencies beyond
React**.

The one architectural rule everything else follows:

> `src/engine/` is pure, deterministic JavaScript. It never imports React,
> never touches the DOM, never calls `Math.random` or `Date.now`.

`src/engine/determinism.test.js` fails the build if that stops being true.
Three things fall out of it:

**Battles are a transcript, not an animation.** `resolveRound(battle, commands)`
plays a whole round and returns `{ state, events }`. The engine decides
everything; the UI is a dumb player of the event list. That is why combat can
be asserted on exactly, and why `tools/sim.js` can play ten thousand fights
from the command line.

**The save file is the game state.** Nothing that affects play lives anywhere
else — no opened-chest flag in component state, no NPC progress in a ref. The
save round-trip test enforces it, so a chest cannot quietly reopen after a
reload.

**Randomness is seeded and stored.** One `mulberry32` generator, its position
kept in the save, threaded through every roll. Same seed, same fight, every
time.

```
src/
  engine/       pure game logic — rng, formulas, stats, characters, inventory,
                battle/, world/, save/
  data/         all content — classes, spells, items, enemies, maps, towns,
                world graph, encounter tables
  ui/           React: screens, components, input, canvas renderer
tools/sim.js    headless balance simulator
```

## Content is data

Dungeon floors are ASCII. A 20×14 room is twenty lines you edit in place:

```js
tiles: [
  '####################',
  '#E.......#.........#',
  '#.##.###.#.###.###.#',
  ...
],
props: {
  '4,4': { itemId: 'potion', qty: 2 },
  '17,12': { floor: 'b2', x: 1, y: 11 },
},
```

The tests treat content as something to prove things about, not just parse.
They flood-fill every floor to show each chest, staircase and boss is
reachable from where the party arrives; they check every item, enemy and spell
id resolves; and they play the whole game the way a player would — go where
you can, beat what is there, repeat — asserting it terminates at the final
boss. A gate whose flag nobody grants is a soft-lock that is invisible in
review and impossible to merge.

## Balancing

Hand-tuning a level curve by playing it does not work; you cannot feel the
difference between a 78% and a 92% win rate. `npm run sim -- --sweep` plays
every encounter group and every boss in the game at its intended level and
reports win rate, rounds, HP/MP drain and deaths, flagging anything out of
band.

```
npm run sim -- --sweep
npm run sim -- --level 24 --enemies stormLord --runs 5000
```

The sweep derives itself from the world map and the encounter tables, so
adding an enemy adds a row.

## Deploying

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The Vite `base` is `/Test/`.
