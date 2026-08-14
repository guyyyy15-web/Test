import { describe, it, expect } from 'vitest'
import { applyEventToView, durationOf, viewFromBattle } from './battleView.js'
import { createBattle, resolveRound } from '../../engine/battle/index.js'
import { createCharacter } from '../../engine/character.js'
import { STARTING_EQUIPMENT } from '../../data/progression.js'

/**
 * The view model is the one place the UI re-derives state the engine already
 * computed, so it has to agree with the engine exactly. These tests replay a
 * real transcript and check the two land in the same place.
 */

function makeParty(level = 8) {
  return ['warrior', 'whiteMage', 'blackMage', 'monk'].map((classId, index) =>
    createCharacter({
      id: `hero-${index}`,
      name: `H${index}`,
      classId,
      level,
      equipment: STARTING_EQUIPMENT[classId],
    }),
  )
}

const replay = (view, events) => events.reduce(applyEventToView, view)

describe('viewFromBattle', () => {
  it('mirrors starting HP, MP and maximums', () => {
    const battle = createBattle({ party: makeParty(), enemyIds: ['goblin'], seed: 1 })
    const view = viewFromBattle(battle)

    for (const combatant of battle.combatants) {
      expect(view.hp[combatant.id]).toBe(combatant.hp)
      expect(view.mp[combatant.id]).toBe(combatant.mp)
      expect(view.down[combatant.id]).toBe(false)
    }
  })
})

describe('replaying a transcript', () => {
  it('lands on the same HP the engine did', () => {
    const battle = createBattle({
      party: makeParty(),
      enemyIds: ['gargoyle'],
      seed: 4242,
    })
    const commands = Object.fromEntries(
      battle.combatants
        .filter((c) => c.side === 'party')
        .map((c) => [c.id, { kind: 'attack', targetId: 'e0' }]),
    )

    const { state, events } = resolveRound(battle, commands)
    const view = replay(viewFromBattle(battle), events)

    for (const combatant of state.combatants) {
      expect(view.hp[combatant.id]).toBe(combatant.hp)
    }
  })

  it('agrees with the engine across a whole fight', () => {
    let battle = createBattle({ party: makeParty(6), enemyIds: ['kobold', 'caveBat'], seed: 77 })
    let view = viewFromBattle(battle)

    for (let round = 0; round < 30 && battle.phase === 'command'; round++) {
      const target = battle.combatants.find((c) => c.side === 'enemy' && c.hp > 0)
      const commands = Object.fromEntries(
        battle.combatants
          .filter((c) => c.side === 'party' && c.hp > 0)
          .map((c) => [c.id, { kind: 'attack', targetId: target?.id }]),
      )
      const { state, events } = resolveRound(battle, commands)
      view = replay(view, events)
      battle = state
    }

    for (const combatant of battle.combatants) {
      expect(view.hp[combatant.id]).toBe(combatant.hp)
      expect(view.down[combatant.id]).toBe(combatant.hp <= 0)
    }
  })
})

describe('individual events', () => {
  const base = {
    hp: { p0: 100, e0: 50 },
    mp: { p0: 20 },
    maxHp: { p0: 100, e0: 50 },
    maxMp: { p0: 20 },
    down: { p0: false, e0: false },
    statuses: { p0: [], e0: [] },
    flash: null,
    seq: 0,
  }

  it('subtracts damage and raises a flash', () => {
    const view = applyEventToView(base, { type: 'damage', targetId: 'e0', amount: 12 })
    expect(view.hp.e0).toBe(38)
    expect(view.flash).toMatchObject({ id: 'e0', kind: 'damage', amount: 12 })
    expect(view.seq).toBe(1)
  })

  it('never heals past the maximum', () => {
    const view = applyEventToView(base, { type: 'heal', targetId: 'p0', amount: 500 })
    expect(view.hp.p0).toBe(100)
  })

  it('never drops HP below zero', () => {
    const view = applyEventToView(base, { type: 'damage', targetId: 'e0', amount: 999 })
    expect(view.hp.e0).toBe(0)
  })

  it('marks a KO and clears it on revive', () => {
    const dead = applyEventToView(base, { type: 'ko', targetId: 'p0' })
    expect(dead.down.p0).toBe(true)

    const back = applyEventToView(dead, { type: 'revive', targetId: 'p0', hp: 25 })
    expect(back.down.p0).toBe(false)
    expect(back.hp.p0).toBe(25)
  })

  it('adds and removes statuses', () => {
    const poisoned = applyEventToView(base, {
      type: 'statusApplied',
      targetId: 'e0',
      status: 'poison',
    })
    expect(poisoned.statuses.e0).toEqual(['poison'])

    const cured = applyEventToView(poisoned, {
      type: 'statusCured',
      targetId: 'e0',
      statuses: ['poison'],
    })
    expect(cured.statuses.e0).toEqual([])
  })

  it('wakes a sleeper', () => {
    const asleep = applyEventToView(base, {
      type: 'statusApplied',
      targetId: 'e0',
      status: 'sleep',
    })
    const awake = applyEventToView(asleep, { type: 'wake', targetId: 'e0', status: 'sleep' })
    expect(awake.statuses.e0).toEqual([])
  })

  it('leaves the view untouched for bookkeeping events', () => {
    expect(applyEventToView(base, { type: 'roundStart', round: 1 })).toBe(base)
    expect(applyEventToView(base, { type: 'turnStart', actorId: 'p0' })).toBe(base)
  })
})

describe('pacing', () => {
  it('passes silent bookkeeping through instantly', () => {
    expect(durationOf({ type: 'roundStart' })).toBe(0)
    expect(durationOf({ type: 'turnStart' })).toBe(0)
  })

  it('gives anything worth reading time to be read', () => {
    expect(durationOf({ type: 'damage' })).toBeGreaterThan(300)
    expect(durationOf({ type: 'statusApplied' })).toBeGreaterThan(300)
    expect(durationOf({ type: 'somethingNew' })).toBeGreaterThan(0)
  })
})
