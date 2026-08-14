import { randomSeed } from './rng.js'

/**
 * The root game state and its reducer.
 *
 * The state object IS the save file. Nothing that affects the game may live
 * anywhere else -- no opened-chest flags in component state, no "which NPC
 * did I talk to" in a ref -- or it silently resets on reload. Every reducer
 * here is pure: (state, action) -> new state, no I/O, no randomness that
 * isn't drawn from `rngState`.
 */

export const SAVE_VERSION = 1

export const MODES = {
  TITLE: 'title',
  PARTY_CREATION: 'partyCreation',
  WORLD: 'world',
  TOWN: 'town',
  DUNGEON: 'dungeon',
  BATTLE: 'battle',
  MENU: 'menu',
  GAME_OVER: 'gameOver',
  ENDING: 'ending',
}

/** A blank save. Every field a later phase needs already has a home here. */
export function createNewGameState(seed = randomSeed()) {
  return {
    version: SAVE_VERSION,
    mode: MODES.PARTY_CREATION,
    party: [],
    inventory: [],
    gold: 0,
    flags: {},
    location: null,
    battle: null,
    playtimeMs: 0,
    rngState: seed >>> 0,
    stepsSinceEncounter: 0,
  }
}

export function createTitleState() {
  return { ...createNewGameState(0), mode: MODES.TITLE, rngState: 0 }
}

const handlers = {
  newGame: (state, action) => createNewGameState(action.seed),

  loadGame: (state, action) => ({ ...action.state }),

  setMode: (state, action) => ({ ...state, mode: action.mode }),

  returnToTitle: () => createTitleState(),

  /** The UI owns the clock; it hands the engine an explicit elapsed delta. */
  tickPlaytime: (state, action) => ({
    ...state,
    playtimeMs: state.playtimeMs + Math.max(0, action.deltaMs ?? 0),
  }),

  setFlag: (state, action) => ({
    ...state,
    flags: { ...state.flags, [action.flag]: action.value ?? true },
  }),
}

export function gameReducer(state, action) {
  const handler = handlers[action.type]
  if (!handler) {
    throw new Error(`Unknown game action: ${action.type}`)
  }
  return handler(state, action)
}

export function hasFlag(state, flag) {
  return Boolean(state.flags?.[flag])
}

/** "1:23" / "12:05" -- the classic save-slot playtime readout. */
export function formatPlaytime(ms) {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}:${String(minutes).padStart(2, '0')}`
}
