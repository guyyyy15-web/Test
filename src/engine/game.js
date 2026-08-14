import { PARTY_SIZE, STARTING_EQUIPMENT, STARTING_GOLD, STARTING_INVENTORY } from '../data/progression.js'
import { getItem } from '../data/items.js'
import { getSpell, isFieldSpell } from '../data/spells.js'
import { createCharacter, isActive } from './character.js'
import { applyBattleResult, createBattle } from './battle/battle.js'
import { applyEffect, fieldEffectForSpell } from './effects.js'
import { addItem, buy, equipItem, removeItem, sell, unequipSlot } from './inventory.js'
import { makeRng, randomSeed } from './rng.js'

/**
 * The root game state and its reducer.
 *
 * The state object IS the save file. Nothing that affects the game may live
 * anywhere else -- no opened-chest flags in component state, no "which NPC
 * did I talk to" in a ref -- or it silently resets on reload. Every reducer
 * here is pure: (state, action) -> new state, with randomness drawn from the
 * seeded generator stored in `rngState` so a save resumes the same stream.
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

/**
 * Run `fn` with a generator seeded from the save, and store where it stopped.
 * Every reducer that rolls dice must go through here, or the save drifts out
 * of sync with the stream and replays stop matching.
 */
function withRng(state, fn) {
  const rng = makeRng(state.rngState)
  const next = fn(rng)
  return { ...next, rngState: rng.state }
}

function replaceMember(party, index, member) {
  const next = party.slice()
  next[index] = member
  return next
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

  /**
   * `heroes` is the raw [{ name, classId }] the creation screen collected.
   * The reducer builds the real characters so starting gear and starting
   * spells are decided in one place.
   */
  createParty: (state, action) => ({
    ...state,
    party: action.heroes.slice(0, PARTY_SIZE).map((hero, index) =>
      createCharacter({
        id: `hero-${index}`,
        name: hero.name,
        classId: hero.classId,
        equipment: STARTING_EQUIPMENT[hero.classId] ?? {},
      }),
    ),
    gold: STARTING_GOLD,
    inventory: STARTING_INVENTORY.map((entry) => ({ ...entry })),
    mode: action.mode ?? MODES.MENU,
  }),

  updateParty: (state, action) => ({ ...state, party: action.party }),

  equip: (state, action) => {
    const member = state.party[action.characterIndex]
    if (!member) return state
    const { character, inventory, equipped } = equipItem(member, state.inventory, action.itemId)
    if (!equipped) return state
    return {
      ...state,
      party: replaceMember(state.party, action.characterIndex, character),
      inventory,
    }
  },

  unequip: (state, action) => {
    const member = state.party[action.characterIndex]
    if (!member) return state
    const { character, inventory, changed } = unequipSlot(member, state.inventory, action.slot)
    if (!changed) return state
    return {
      ...state,
      party: replaceMember(state.party, action.characterIndex, character),
      inventory,
    }
  },

  /** Using an item outside battle. Consumed only if it actually did something. */
  useItem: (state, action) =>
    withRng(state, (rng) => {
      const item = getItem(action.itemId)
      if (!item.effect || item.inField === false) return state

      const targetsAll = item.effect.target === 'allAllies'
      const indices = targetsAll
        ? state.party.map((_, index) => index)
        : [action.targetIndex]

      let party = state.party
      let anyApplied = false

      for (const index of indices) {
        const member = party[index]
        if (!member) continue
        const { character, applied } = applyEffect(item.effect, member, rng)
        if (applied) {
          anyApplied = true
          party = replaceMember(party, index, character)
        }
      }

      if (!anyApplied) return state
      return { ...state, party, inventory: removeItem(state.inventory, action.itemId, 1) }
    }),

  /** Casting a restorative spell outside battle. MP is spent only on success. */
  castFieldSpell: (state, action) =>
    withRng(state, (rng) => {
      const caster = state.party[action.casterIndex]
      const spell = getSpell(action.spellId)
      if (!caster || !caster.spells.includes(action.spellId)) return state
      if (!isFieldSpell(spell) || caster.mp < spell.mp) return state

      const effect = fieldEffectForSpell(spell, caster, rng)
      if (!effect) return state

      const indices =
        effect.target === 'allAllies'
          ? state.party.map((_, index) => index)
          : [action.targetIndex]

      let party = state.party
      let anyApplied = false

      for (const index of indices) {
        const member = party[index]
        if (!member) continue
        const { character, applied } = applyEffect(effect, member, rng)
        if (applied) {
          anyApplied = true
          party = replaceMember(party, index, character)
        }
      }

      if (!anyApplied) return state

      const casterIndex = action.casterIndex
      const spent = { ...party[casterIndex], mp: party[casterIndex].mp - spell.mp }
      return { ...state, party: replaceMember(party, casterIndex, spent) }
    }),

  /** Seed the fight from the save's generator so an encounter is replayable. */
  startBattle: (state, action) =>
    withRng(state, (rng) => ({
      ...state,
      mode: MODES.BATTLE,
      battle: createBattle({
        party: state.party,
        inventory: state.inventory,
        enemyIds: action.enemyIds,
        seed: rng.int(0, 0xffffffff),
        canFlee: action.canFlee ?? true,
        background: action.background,
      }),
    })),

  updateBattle: (state, action) => ({ ...state, battle: action.battle }),

  /**
   * Fold the finished fight back into the save. A total wipe always wins over
   * whatever screen the caller asked to return to.
   */
  endBattle: (state, action) => {
    if (!state.battle) return state
    const { state: next } = applyBattleResult(state, state.battle)
    const wiped = next.party.every((member) => !isActive(member))
    return {
      ...next,
      mode: wiped ? MODES.GAME_OVER : (action.returnMode ?? MODES.MENU),
    }
  },

  addItem: (state, action) => ({
    ...state,
    inventory: addItem(state.inventory, action.itemId, action.qty ?? 1),
  }),

  addGold: (state, action) => ({ ...state, gold: Math.max(0, state.gold + action.amount) }),

  buyItem: (state, action) => buy(state, action.itemId, action.qty ?? 1),

  sellItem: (state, action) => sell(state, action.itemId, action.qty ?? 1),
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
