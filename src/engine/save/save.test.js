import { describe, it, expect } from 'vitest'
import { SaveError, deserialize, describeSave, migrate, serialize } from './save.js'
import { MODES, SAVE_VERSION, createNewGameState, gameReducer } from '../game.js'

/**
 * The save round-trip is the invariant that keeps "no game-affecting state
 * outside the save object" honest. If a chest flag, a beaten boss or the
 * generator's position fails to survive this, the bug shows up here rather
 * than as a chest that reopens after a reload.
 */

function playedGame() {
  let state = createNewGameState(1234)
  state = gameReducer(state, {
    type: 'createParty',
    heroes: [
      { name: 'Ryn', classId: 'warrior' },
      { name: 'Isa', classId: 'whiteMage' },
      { name: 'Zel', classId: 'blackMage' },
      { name: 'Tam', classId: 'monk' },
    ],
  })
  state = gameReducer(state, { type: 'travel', nodeId: 'emberMine' })
  state = gameReducer(state, { type: 'move', direction: 'down' })
  state = gameReducer(state, { type: 'setFlag', flag: 'mineWardenDefeated' })
  state = gameReducer(state, { type: 'addItem', itemId: 'hi-potion', qty: 3 })
  state = gameReducer(state, { type: 'tickPlaytime', deltaMs: 125000 })
  return state
}

describe('round trip', () => {
  it('preserves everything that affects the game', () => {
    const state = playedGame()
    const restored = deserialize(JSON.parse(JSON.stringify(serialize(state))))

    expect(restored.party).toEqual(state.party)
    expect(restored.inventory).toEqual(state.inventory)
    expect(restored.gold).toBe(state.gold)
    expect(restored.flags).toEqual(state.flags)
    expect(restored.location).toEqual(state.location)
    expect(restored.playtimeMs).toBe(state.playtimeMs)
    expect(restored.stepsSinceEncounter).toBe(state.stepsSinceEncounter)
  })

  it('preserves the generator position, so randomness resumes where it left off', () => {
    const state = playedGame()
    const restored = deserialize(serialize(state))
    expect(restored.rngState).toBe(state.rngState)
  })

  it('keeps opened chests opened', () => {
    let state = playedGame()
    state = { ...state, flags: { ...state.flags, 'chest:emberMine:b1:4,4': true } }
    const restored = deserialize(serialize(state))
    expect(restored.flags['chest:emberMine:b1:4,4']).toBe(true)
  })

  it('drops the fields that only make sense in the moment', () => {
    const state = { ...playedGame(), battle: { fake: true }, notice: 'Found a Potion!' }
    const data = serialize(state)
    expect(data.battle).toBeUndefined()
    expect(data.notice).toBeUndefined()

    const restored = deserialize(data)
    expect(restored.battle).toBeNull()
    expect(restored.notice).toBeNull()
  })

  it('stamps the current version and the supplied timestamp', () => {
    const data = serialize(playedGame(), { savedAt: 999 })
    expect(data.version).toBe(SAVE_VERSION)
    expect(data.savedAt).toBe(999)
  })

  it('survives a second round trip unchanged', () => {
    const once = deserialize(serialize(playedGame()))
    const twice = deserialize(serialize(once))
    expect(twice).toEqual(once)
  })
})

describe('migration', () => {
  it('walks a pre-versioned save forward', () => {
    const migrated = migrate({ party: [], version: 0 })
    expect(migrated.version).toBe(SAVE_VERSION)
  })

  it('leaves a current save alone', () => {
    const data = serialize(playedGame())
    expect(migrate(data)).toEqual(data)
  })

  it('refuses a save from a newer build rather than mangling it', () => {
    expect(() => deserialize({ version: SAVE_VERSION + 5, party: [{}] })).toThrow(SaveError)
  })
})

describe('rejecting broken data', () => {
  it('rejects a non-object', () => {
    expect(() => deserialize(null)).toThrow(SaveError)
    expect(() => deserialize('nope')).toThrow(SaveError)
  })

  it('rejects a save with no party', () => {
    expect(() => deserialize({ version: 1, party: [], inventory: [], gold: 0, flags: {}, rngState: 1 })).toThrow(
      /no party/,
    )
  })

  it('rejects a save missing a required field', () => {
    expect(() => deserialize({ version: 1, party: [{ name: 'A' }] })).toThrow(/missing/)
  })

  it('fills in fields a newer build added', () => {
    const data = serialize(playedGame())
    delete data.stepsSinceEncounter
    expect(deserialize(data).stepsSinceEncounter).toBe(0)
  })
})

describe('describeSave', () => {
  it('summarises a slot for the load menu', () => {
    const summary = describeSave(serialize(playedGame(), { savedAt: 5 }))
    expect(summary.party).toHaveLength(4)
    expect(summary.party[0]).toMatchObject({ name: 'Ryn', classId: 'warrior', level: 1 })
    expect(summary.savedAt).toBe(5)
  })

  it('returns null for nothing', () => {
    expect(describeSave(null)).toBeNull()
  })
})

describe('loading back into the reducer', () => {
  it('resumes at the same place in the world', () => {
    const state = playedGame()
    const loaded = gameReducer(createNewGameState(0), {
      type: 'loadGame',
      state: deserialize(serialize(state)),
    })
    expect(loaded.location).toEqual(state.location)
    expect(loaded.mode).toBe(MODES.DUNGEON)
  })
})
