import { PARTY_SIZE, STARTING_EQUIPMENT, STARTING_GOLD, STARTING_INVENTORY } from '../data/progression.js'
import { getItem } from '../data/items.js'
import { floorFor, getDungeon, getFloor } from '../data/maps/index.js'
import { getTown } from '../data/towns/index.js'
import { STARTING_NODE, getNode, isUnlocked } from '../data/world.js'
import { getSpell, isFieldSpell } from '../data/spells.js'
import { createCharacter, isActive, promote, restore } from './character.js'
import { applyBattleResult, createBattle } from './battle/battle.js'
import { applyEffect, fieldEffectForSpell } from './effects.js'
import { addItem, buy, equipItem, removeItem, sell, unequipSlot } from './inventory.js'
import { makeRng, randomSeed } from './rng.js'
import { rollEncounter } from './world/encounters.js'
import { chestFlag, stepFrom, triggerAt } from './world/tilemap.js'

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
    /** Transient one-liner for the field HUD ("Found 2 Potions!"). */
    notice: null,
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

function toWorldMap(state) {
  return {
    ...state,
    mode: MODES.WORLD,
    location: { type: 'world', nodeId: state.location?.nodeId ?? STARTING_NODE },
    notice: null,
  }
}

/** What stepping onto a chest, staircase, boss marker or exit does. */
function applyTrigger(state, floor, trigger, rng) {
  switch (trigger.kind) {
    case 'chest': {
      const qty = trigger.qty ?? 1
      const item = getItem(trigger.itemId)
      return {
        ...state,
        inventory: addItem(state.inventory, trigger.itemId, qty),
        flags: { ...state.flags, [chestFlag(floor, trigger.x, trigger.y)]: true },
        notice: `Found ${qty > 1 ? `${qty} ` : ''}${item.name}${qty > 1 ? 's' : ''}!`,
      }
    }

    case 'link':
      return {
        ...state,
        location: {
          ...state.location,
          floorId: trigger.floor,
          x: trigger.x,
          y: trigger.y,
        },
        stepsSinceEncounter: 0,
      }

    case 'boss':
      return {
        ...state,
        mode: MODES.BATTLE,
        notice: trigger.intro ?? null,
        battle: createBattle({
          party: state.party,
          inventory: state.inventory,
          enemyIds: trigger.enemyIds,
          seed: rng.int(0, 0xffffffff),
          canFlee: false,
          opening: 'normal',
          returnMode: MODES.DUNGEON,
          onVictory: {
            flag: trigger.flag,
            itemId: trigger.reward?.itemId,
            notice: trigger.reward?.itemId
              ? `Obtained the ${getItem(trigger.reward.itemId).name}.`
              : null,
            mode: trigger.endsGame ? MODES.ENDING : null,
          },
        }),
      }

    case 'exit':
      return toWorldMap(state)

    default:
      return state
  }
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
    location: {
      type: 'town',
      nodeId: STARTING_NODE,
      townId: getNode(STARTING_NODE).townId,
    },
    mode: action.mode ?? MODES.TOWN,
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

  enterDungeon: (state, action) => {
    const floor = getFloor(action.dungeonId, action.floorId)
    return {
      ...state,
      mode: MODES.DUNGEON,
      location: {
        type: 'dungeon',
        dungeonId: action.dungeonId,
        floorId: action.floorId,
        x: action.x ?? floor.spawn.x,
        y: action.y ?? floor.spawn.y,
        facing: action.facing ?? 'down',
      },
      stepsSinceEncounter: 0,
      notice: null,
    }
  },

  /**
   * One step. This is where the dungeon actually happens: collision, the tile
   * trigger you land on, and the encounter roll all resolve here, in the
   * reducer, so every one of them is recorded in the save rather than in some
   * component's state.
   */
  move: (state, action) =>
    withRng(state, (rng) => {
      if (state.mode !== MODES.DUNGEON || state.location?.type !== 'dungeon') return state

      const floor = floorFor(state.location)
      const step = stepFrom(floor, state.location, action.direction, state.flags)
      const facing = { ...state.location, facing: step.facing }

      if (step.blocked) return { ...state, location: facing, notice: null }

      const moved = {
        ...state,
        location: { ...facing, x: step.x, y: step.y },
        stepsSinceEncounter: state.stepsSinceEncounter + 1,
        notice: null,
      }

      const trigger = triggerAt(floor, step.x, step.y, state.flags)
      if (trigger) return applyTrigger(moved, floor, trigger, rng)

      const enemyIds = rollEncounter(
        getDungeon(state.location.dungeonId).zone,
        moved.stepsSinceEncounter,
        rng,
      )
      if (!enemyIds) return moved

      return {
        ...moved,
        stepsSinceEncounter: 0,
        mode: MODES.BATTLE,
        battle: createBattle({
          party: moved.party,
          inventory: moved.inventory,
          enemyIds,
          seed: rng.int(0, 0xffffffff),
          returnMode: MODES.DUNGEON,
        }),
      }
    }),

  leaveDungeon: (state) => toWorldMap(state),

  toWorldMap: (state) => toWorldMap(state),

  /** Travel between world-map nodes. Gated nodes simply refuse. */
  travel: (state, action) => {
    const node = getNode(action.nodeId)
    if (!isUnlocked(node, state.flags)) return state

    if (node.kind === 'town') {
      return {
        ...state,
        mode: MODES.TOWN,
        location: { type: 'town', nodeId: node.id, townId: node.townId },
        notice: null,
      }
    }

    const floor = getFloor(node.dungeonId, node.floorId)
    return {
      ...state,
      mode: MODES.DUNGEON,
      location: {
        type: 'dungeon',
        nodeId: node.id,
        dungeonId: node.dungeonId,
        floorId: node.floorId,
        x: floor.spawn.x,
        y: floor.spawn.y,
        facing: 'down',
      },
      stepsSinceEncounter: 0,
      notice: null,
    }
  },

  /** The one-time class change at the Highreach shrine. */
  promoteParty: (state) => {
    if (state.flags.promoted) return state
    return {
      ...state,
      party: state.party.map(promote),
      flags: { ...state.flags, promoted: true },
      notice: 'The stones go dark. Everyone is standing a little differently.',
    }
  },

  /** The inn: the classic full restore, including the dead. */
  restAtInn: (state) => {
    const town = getTown(state.location?.townId)
    if (state.gold < town.inn.price) return state
    return {
      ...state,
      gold: state.gold - town.inn.price,
      party: state.party.map(restore),
      notice: 'The party wakes rested.',
    }
  },

  clearNotice: (state) => (state.notice ? { ...state, notice: null } : state),

  /**
   * Fold the finished fight back into the save. A total wipe always wins over
   * whatever screen the caller asked to return to.
   */
  endBattle: (state, action) => {
    const battle = state.battle
    if (!battle) return state
    const { state: next } = applyBattleResult(state, battle)
    const wiped = next.party.every((member) => !isActive(member))
    const won = battle.phase === 'victory'
    const onVictory = battle.onVictory
    return {
      ...next,
      mode: wiped
        ? MODES.GAME_OVER
        : (won && onVictory?.mode) || battle.returnMode || action.returnMode || MODES.WORLD,
      ...(won && onVictory
        ? {
            flags: onVictory.flag
              ? { ...next.flags, [onVictory.flag]: true }
              : next.flags,
            inventory: onVictory.itemId
              ? addItem(next.inventory, onVictory.itemId, 1)
              : next.inventory,
            notice: onVictory.notice ?? null,
          }
        : {}),
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
