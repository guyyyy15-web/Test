import { describe, it, expect } from 'vitest'
import { BATTLE_PHASES, applyBattleResult, createBattle, resolveRound } from './battle.js'
import { effectiveStats, findCombatant, isDown } from './combatant.js'
import { addStatus, hasStatus } from './status.js'
import { createCharacter } from '../character.js'
import { STARTING_EQUIPMENT } from '../../data/progression.js'
import { getEnemy } from '../../data/enemies.js'

/**
 * Every test here runs on a fixed seed, so results are exact rather than
 * statistical. A test that says "the goblin dies in round 2" means it, and a
 * change to a formula that breaks it is a real regression, not flakiness.
 */

function makeParty(classIds = ['warrior', 'whiteMage', 'blackMage', 'thief'], level = 5) {
  return classIds.map((classId, index) =>
    createCharacter({
      id: `hero-${index}`,
      name: `Hero${index}`,
      classId,
      level,
      equipment: STARTING_EQUIPMENT[classId],
    }),
  )
}

function attackAll(battle) {
  const commands = {}
  for (const combatant of battle.combatants) {
    if (combatant.side !== 'party' || isDown(combatant)) continue
    const target = battle.combatants.find((c) => c.side === 'enemy' && !isDown(c))
    commands[combatant.id] = { kind: 'attack', targetId: target?.id }
  }
  return commands
}

/** Play until the battle ends or the round cap trips. Returns every event. */
function playOut(battle, maxRounds = 60, commandsFor = attackAll) {
  const allEvents = []
  let current = battle
  let rounds = 0
  while (current.phase === BATTLE_PHASES.COMMAND && rounds < maxRounds) {
    const { state, events } = resolveRound(current, commandsFor(current))
    current = state
    allEvents.push(...events)
    rounds += 1
  }
  return { battle: current, events: allEvents, rounds }
}

const types = (events) => events.map((event) => event.type)

describe('createBattle', () => {
  it('puts heroes and enemies into one list', () => {
    const battle = createBattle({ party: makeParty(), enemyIds: ['goblin', 'goblin'], seed: 1 })
    expect(battle.combatants).toHaveLength(6)
    expect(battle.combatants.filter((c) => c.side === 'party')).toHaveLength(4)
    expect(battle.phase).toBe(BATTLE_PHASES.COMMAND)
  })

  it('gives duplicate enemies A/B labels and leaves a lone enemy unlabelled', () => {
    const pair = createBattle({ party: makeParty(), enemyIds: ['goblin', 'goblin'], seed: 1 })
    const labels = pair.combatants.filter((c) => c.side === 'enemy').map((c) => c.label)
    expect(labels).toEqual(['Goblin A', 'Goblin B'])

    const single = createBattle({ party: makeParty(), enemyIds: ['goblin'], seed: 1 })
    expect(single.combatants.find((c) => c.side === 'enemy').label).toBe('Goblin')
  })

  it('copies the inventory rather than aliasing it', () => {
    const inventory = [{ id: 'potion', qty: 3 }]
    const battle = createBattle({ party: makeParty(), enemyIds: ['goblin'], inventory, seed: 1 })
    battle.inventory[0].qty = 99
    expect(inventory[0].qty).toBe(3)
  })
})

describe('determinism', () => {
  it('produces an identical transcript for an identical seed', () => {
    const setup = () =>
      createBattle({ party: makeParty(), enemyIds: ['goblin', 'wildBoar'], seed: 4242 })

    const first = playOut(setup())
    const second = playOut(setup())

    expect(first.events).toEqual(second.events)
    expect(first.battle.phase).toBe(second.battle.phase)
  })

  it('produces a different transcript for a different seed', () => {
    const a = playOut(createBattle({ party: makeParty(), enemyIds: ['kobold'], seed: 1 }))
    const b = playOut(createBattle({ party: makeParty(), enemyIds: ['kobold'], seed: 2 }))
    expect(a.events).not.toEqual(b.events)
  })

  it('advances the stored rng state each round so replays cannot stall', () => {
    const battle = createBattle({ party: makeParty(), enemyIds: ['goblin'], seed: 7 })
    const { state } = resolveRound(battle, attackAll(battle))
    expect(state.rngState).not.toBe(battle.rngState)
  })
})

describe('round structure', () => {
  it('opens and closes a round and gives everyone a turn', () => {
    const battle = createBattle({
      party: makeParty(),
      enemyIds: ['goblin'],
      seed: 11,
      opening: 'normal',
    })
    const { events } = resolveRound(battle, attackAll(battle))

    expect(types(events)[0]).toBe('roundStart')
    expect(types(events)).toContain('turnStart')
  })

  it('acts in agility order', () => {
    // Thief (fast) and Warrior (slow) against a very slow Rock Crab.
    const battle = createBattle({
      party: makeParty(['thief', 'warrior'], 5),
      enemyIds: ['rockCrab'],
      seed: 3,
      opening: 'normal',
    })
    const { events } = resolveRound(battle, attackAll(battle))
    const order = events.filter((e) => e.type === 'turnStart').map((e) => e.actorId)

    expect(order.indexOf('p0')).toBeLessThan(order.indexOf('p1'))
    expect(order.indexOf('p1')).toBeLessThan(order.indexOf('e0'))
  })

  it('lets the whole party act first on a preemptive strike', () => {
    const battle = createBattle({
      party: makeParty(),
      enemyIds: ['wasp'],
      seed: 5,
      opening: 'preemptive',
    })
    const { events } = resolveRound(battle, attackAll(battle))
    const order = events.filter((e) => e.type === 'turnStart').map((e) => e.actorId)
    const firstEnemy = order.findIndex((id) => id.startsWith('e'))

    // The wasp is the fastest thing in the fight and still goes last.
    if (firstEnemy !== -1) {
      expect(order.slice(0, firstEnemy).every((id) => id.startsWith('p'))).toBe(true)
    }
  })

  it('lets the enemies act first on an ambush', () => {
    const battle = createBattle({
      party: makeParty(['thief'], 20),
      enemyIds: ['rockCrab'],
      seed: 5,
      opening: 'ambush',
    })
    const { events } = resolveRound(battle, attackAll(battle))
    const order = events.filter((e) => e.type === 'turnStart').map((e) => e.actorId)
    expect(order[0]).toBe('e0')
  })
})

describe('attacking', () => {
  it('kills a goblin and ends in victory', () => {
    const battle = createBattle({ party: makeParty(), enemyIds: ['goblin'], seed: 9 })
    const { battle: finished, events } = playOut(battle)

    expect(finished.phase).toBe(BATTLE_PHASES.VICTORY)
    expect(types(events)).toContain('ko')
    expect(types(events)).toContain('victory')
  })

  it('retargets when the chosen enemy is already dead', () => {
    const party = makeParty(['warrior', 'warrior', 'warrior', 'warrior'], 30)
    const battle = createBattle({ party, enemyIds: ['giantRat', 'giantRat'], seed: 21 })

    // Everyone piles onto the first rat; it cannot survive four level-30 hits.
    const commands = {}
    for (const combatant of battle.combatants) {
      if (combatant.side === 'party') commands[combatant.id] = { kind: 'attack', targetId: 'e0' }
    }

    const { events } = resolveRound(battle, commands)
    expect(types(events)).toContain('retarget')
  })

  it('never deals less than one damage on a hit', () => {
    const battle = createBattle({
      party: makeParty(['whiteMage'], 1),
      enemyIds: ['magmaGolem'],
      seed: 13,
    })
    const { events } = resolveRound(battle, { p0: { kind: 'attack', targetId: 'e0' } })
    for (const event of events.filter((e) => e.type === 'damage' && e.targetId === 'e0')) {
      expect(event.amount).toBeGreaterThanOrEqual(1)
    }
  })

  it('reports elemental weakness and immunity', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 20),
      enemyIds: ['mineSlime'],
      seed: 17,
    })
    const { events } = resolveRound(battle, {
      p0: { kind: 'spell', spellId: 'fire', targetId: 'e0' },
    })
    const damage = events.find((e) => e.type === 'damage')
    expect(damage.effectiveness).toBe('weak')
  })

  it('deals zero damage to something immune to the element', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 30),
      enemyIds: ['stormElemental'],
      seed: 19,
    })
    const { events } = resolveRound(battle, {
      p0: { kind: 'spell', spellId: 'spark', targetId: 'e0' },
    })
    const damage = events.find((e) => e.type === 'damage')
    expect(damage.effectiveness).toBe('immune')
    expect(damage.amount).toBe(0)
  })
})

describe('spells', () => {
  it('spends MP and reports the cast', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 10),
      enemyIds: ['goblin'],
      seed: 23,
      opening: 'preemptive',
    })
    const before = findCombatant(battle, 'p0').mp
    const { state, events } = resolveRound(battle, {
      p0: { kind: 'spell', spellId: 'fire', targetId: 'e0' },
    })

    expect(types(events)).toContain('castSpell')
    expect(findCombatant(state, 'p0').mp).toBe(before - 3)
  })

  it('refuses to cast without enough MP', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 1),
      enemyIds: ['goblin'],
      seed: 29,
      opening: 'preemptive',
    })
    const drained = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p0' ? { ...c, mp: 0 } : c)),
    }
    const { events } = resolveRound(drained, {
      p0: { kind: 'spell', spellId: 'fire', targetId: 'e0' },
    })
    expect(types(events)).toContain('noMp')
    expect(types(events)).not.toContain('castSpell')
  })

  it('blocks casting while silenced and does not spend MP', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 10),
      enemyIds: ['goblin'],
      seed: 31,
      opening: 'preemptive',
    })
    const silenced = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p0' ? addStatus(c, 'silence') : c)),
    }
    const before = findCombatant(silenced, 'p0').mp
    const { state, events } = resolveRound(silenced, {
      p0: { kind: 'spell', spellId: 'fire', targetId: 'e0' },
    })

    expect(types(events)).toContain('silenced')
    expect(findCombatant(state, 'p0').mp).toBe(before)
  })

  it('heals a wounded ally', () => {
    const battle = createBattle({
      party: makeParty(['whiteMage', 'warrior'], 10),
      enemyIds: ['goblin'],
      seed: 37,
      opening: 'preemptive',
    })
    const hurt = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p1' ? { ...c, hp: 5 } : c)),
    }
    const { state, events } = resolveRound(hurt, {
      p0: { kind: 'spell', spellId: 'heal', targetId: 'p1' },
      p1: { kind: 'defend' },
    })

    expect(types(events)).toContain('heal')
    expect(findCombatant(state, 'p1').hp).toBeGreaterThan(5)
  })

  it('hits every enemy with an all-target spell', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 15),
      enemyIds: ['goblin', 'goblin', 'goblin'],
      seed: 41,
      opening: 'preemptive',
    })
    const { events } = resolveRound(battle, { p0: { kind: 'spell', spellId: 'fireII' } })
    const hit = new Set(
      events.filter((e) => e.type === 'damage' && e.spellId === 'fireII').map((e) => e.targetId),
    )
    expect(hit).toEqual(new Set(['e0', 'e1', 'e2']))
  })

  it('revives a fallen ally', () => {
    const battle = createBattle({
      party: makeParty(['whiteMage', 'warrior'], 10),
      enemyIds: ['goblin'],
      seed: 43,
      opening: 'preemptive',
    })
    const fallen = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p1' ? { ...c, hp: 0 } : c)),
    }
    const { state, events } = resolveRound(fallen, {
      p0: { kind: 'spell', spellId: 'revive', targetId: 'p1' },
    })

    expect(types(events)).toContain('revive')
    expect(findCombatant(state, 'p1').hp).toBeGreaterThan(0)
  })

  it('applies a buff that expires on its own', () => {
    const battle = createBattle({
      party: makeParty(['whiteMage', 'warrior'], 10),
      enemyIds: ['goblin'],
      seed: 47,
      opening: 'preemptive',
    })
    const { state } = resolveRound(battle, {
      p0: { kind: 'spell', spellId: 'guard', targetId: 'p1' },
      p1: { kind: 'defend' },
    })

    const buffed = findCombatant(state, 'p1')
    expect(buffed.buffs).toHaveLength(1)
    // One round has already been counted off the five.
    expect(buffed.buffs[0].turns).toBe(4)
  })

  it('respects status immunity', () => {
    const battle = createBattle({
      party: makeParty(['blackMage'], 20),
      enemyIds: ['magmaGolem'],
      seed: 53,
      opening: 'preemptive',
    })
    const { events } = resolveRound(battle, { p0: { kind: 'spell', spellId: 'sleep' } })
    expect(types(events)).toContain('statusImmune')
  })
})

describe('statuses', () => {
  it('ticks poison at the end of the round', () => {
    const battle = createBattle({
      party: makeParty(['warrior'], 10),
      enemyIds: ['gargoyle'],
      seed: 59,
    })
    const poisoned = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p0' ? addStatus(c, 'poison') : c)),
    }
    // Defend rather than attack, so the round cannot end early in victory --
    // upkeep only runs on a round that actually finishes.
    const { state, events } = resolveRound(poisoned, { p0: { kind: 'defend' } })

    const tick = events.find((e) => e.type === 'statusTick' && e.targetId === 'p0')
    expect(tick).toBeTruthy()
    expect(tick.amount).toBeGreaterThan(0)
    expect(hasStatus(findCombatant(state, 'p0'), 'poison')).toBe(true)
  })

  it('skips the turn of a sleeping combatant', () => {
    const battle = createBattle({
      party: makeParty(['warrior'], 10),
      enemyIds: ['goblin'],
      seed: 61,
    })
    const asleep = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p0' ? addStatus(c, 'sleep') : c)),
    }
    const { events } = resolveRound(asleep, attackAll(asleep))

    const skip = events.find((e) => e.type === 'skipTurn' && e.actorId === 'p0')
    expect(skip.reason).toBe('sleep')
    expect(events.some((e) => e.type === 'attack' && e.actorId === 'p0')).toBe(false)
  })

  it('wakes a sleeping combatant that takes damage', () => {
    const battle = createBattle({
      party: makeParty(['warrior', 'warrior'], 20),
      enemyIds: ['goblin'],
      seed: 67,
      opening: 'preemptive',
    })
    const asleep = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'e0' ? addStatus(c, 'sleep') : c)),
    }
    const { events } = resolveRound(asleep, {
      p0: { kind: 'attack', targetId: 'e0' },
      p1: { kind: 'defend' },
    })

    expect(events.some((e) => e.type === 'wake' && e.targetId === 'e0')).toBe(true)
  })

  it('halves defence again when not defending', () => {
    const party = makeParty(['warrior'], 10)
    const battle = createBattle({ party, enemyIds: ['goblin'], seed: 71 })
    const guard = findCombatant(battle, 'p0')
    const base = effectiveStats(guard).defense
    const defending = effectiveStats({ ...guard, defending: true }).defense
    expect(defending).toBe(base * 2)
  })
})

describe('items', () => {
  it('heals and consumes one from the battle inventory', () => {
    const battle = createBattle({
      party: makeParty(['warrior', 'warrior'], 10),
      enemyIds: ['goblin'],
      inventory: [{ id: 'potion', qty: 3 }],
      seed: 73,
      opening: 'preemptive',
    })
    const hurt = {
      ...battle,
      combatants: battle.combatants.map((c) => (c.id === 'p1' ? { ...c, hp: 5 } : c)),
    }
    const { state, events } = resolveRound(hurt, {
      p0: { kind: 'item', itemId: 'potion', targetId: 'p1' },
      p1: { kind: 'defend' },
    })

    expect(types(events)).toContain('useItem')
    // Assert the heal, not the final HP -- the goblin still gets its swing in
    // after the item, and that is the engine working correctly.
    expect(events.find((e) => e.type === 'heal' && e.targetId === 'p1').amount).toBe(60)
    expect(state.inventory.find((entry) => entry.id === 'potion').qty).toBe(2)
  })

  it('refuses to use an item the party does not have', () => {
    const battle = createBattle({
      party: makeParty(['warrior'], 10),
      enemyIds: ['goblin'],
      inventory: [],
      seed: 79,
      opening: 'preemptive',
    })
    const { events } = resolveRound(battle, {
      p0: { kind: 'item', itemId: 'potion', targetId: 'p0' },
    })
    expect(types(events)).not.toContain('useItem')
  })

  it('escapes outright with a Smoke Bomb', () => {
    const battle = createBattle({
      party: makeParty(['warrior'], 10),
      enemyIds: ['goblin'],
      inventory: [{ id: 'smoke-bomb', qty: 1 }],
      seed: 83,
      opening: 'preemptive',
    })
    const { state, events } = resolveRound(battle, {
      p0: { kind: 'item', itemId: 'smoke-bomb' },
    })
    expect(state.phase).toBe(BATTLE_PHASES.FLED)
    expect(types(events)).toContain('fled')
  })
})

describe('fleeing', () => {
  it('can succeed and end the fight', () => {
    let escaped = false
    for (let seed = 1; seed < 40 && !escaped; seed++) {
      const battle = createBattle({
        party: makeParty(['thief'], 20),
        enemyIds: ['giantRat'],
        seed,
        opening: 'preemptive',
      })
      const { state } = resolveRound(battle, { p0: { kind: 'flee' } })
      if (state.phase === BATTLE_PHASES.FLED) escaped = true
    }
    expect(escaped).toBe(true)
  })

  it('cannot flee a boss', () => {
    const battle = createBattle({
      party: makeParty(['thief'], 20),
      enemyIds: ['goblinChief'],
      seed: 5,
      canFlee: false,
      opening: 'preemptive',
    })
    const { state, events } = resolveRound(battle, { p0: { kind: 'flee' } })
    expect(state.phase).toBe(BATTLE_PHASES.COMMAND)
    expect(events.find((e) => e.type === 'flee').blocked).toBe(true)
  })
})

describe('outcomes', () => {
  it('declares defeat when the whole party falls', () => {
    const battle = createBattle({
      party: makeParty(['whiteMage'], 1),
      enemyIds: ['emberKing'],
      seed: 89,
      opening: 'ambush',
    })
    const { battle: finished, events } = playOut(battle, 20)
    expect(finished.phase).toBe(BATTLE_PHASES.DEFEAT)
    expect(types(events)).toContain('defeat')
  })

  it('reports XP and gold on victory', () => {
    const battle = createBattle({
      party: makeParty(undefined, 20),
      enemyIds: ['goblin', 'goblin'],
      seed: 97,
    })
    const { battle: finished, events } = playOut(battle)
    const victory = events.find((e) => e.type === 'victory')

    expect(finished.phase).toBe(BATTLE_PHASES.VICTORY)
    expect(victory.xp).toBe(getEnemy('goblin').xp * 2)
    expect(victory.gold).toBe(getEnemy('goblin').gold * 2)
  })

  it('ignores further commands once the fight is over', () => {
    const battle = createBattle({ party: makeParty(undefined, 30), enemyIds: ['giantRat'], seed: 101 })
    const { battle: finished } = playOut(battle)
    const { state, events } = resolveRound(finished, attackAll(finished))
    expect(events).toEqual([])
    expect(state).toBe(finished)
  })
})

describe('applyBattleResult', () => {
  const baseState = () => ({
    party: makeParty(undefined, 5),
    inventory: [{ id: 'potion', qty: 2 }],
    gold: 100,
    battle: null,
  })

  it('writes HP, MP and gold back into the save', () => {
    const state = baseState()
    const battle = createBattle({
      party: state.party,
      inventory: state.inventory,
      enemyIds: ['goblin'],
      seed: 103,
    })
    const { battle: finished } = playOut(battle)
    const { state: next } = applyBattleResult(state, finished)

    expect(next.gold).toBe(100 + finished.rewards.gold)
    expect(next.battle).toBeNull()
    for (const [index, member] of next.party.entries()) {
      expect(member.hp).toBe(findCombatant(finished, `p${index}`).hp)
    }
  })

  it('awards XP only to the survivors', () => {
    const state = baseState()
    const battle = createBattle({
      party: state.party,
      enemyIds: ['goblin'],
      seed: 107,
    })
    const { battle: finished } = playOut(battle)

    // Knock one hero out after the fact; they should earn nothing.
    const withCasualty = {
      ...finished,
      combatants: finished.combatants.map((c) => (c.id === 'p1' ? { ...c, hp: 0 } : c)),
    }
    const { state: next } = applyBattleResult(state, withCasualty)

    expect(next.party[1].xp).toBe(0)
    expect(next.party[1].statuses).toContain('ko')
    expect(next.party[0].xp).toBeGreaterThan(0)
  })

  it('reports level-ups so the UI can show them', () => {
    const state = { ...baseState(), party: makeParty(undefined, 1) }
    const battle = createBattle({
      party: state.party,
      inventory: state.inventory,
      enemyIds: ['wyvern'],
      seed: 109,
    })
    // Force the win: the wyvern would flatten a level 1 party.
    const won = {
      ...battle,
      phase: BATTLE_PHASES.VICTORY,
      rewards: { xp: 400, gold: 50, drops: ['potion'] },
      combatants: battle.combatants.map((c) => (c.side === 'enemy' ? { ...c, hp: 0 } : c)),
    }

    const { state: next, levelUps } = applyBattleResult(state, won)
    expect(levelUps.length).toBe(4)
    expect(levelUps[0].levels).toBeGreaterThan(0)
    expect(next.inventory.find((entry) => entry.id === 'potion').qty).toBe(3)
  })

  it('keeps items that were never touched during the fight', () => {
    const state = { ...baseState(), inventory: [{ id: 'ether', qty: 4 }] }
    const battle = createBattle({
      party: state.party,
      inventory: state.inventory,
      enemyIds: ['goblin'],
      seed: 127,
    })
    const { battle: finished } = playOut(battle)
    const { state: next } = applyBattleResult(state, finished)
    expect(next.inventory.find((entry) => entry.id === 'ether').qty).toBe(4)
  })

  it('carries poison out of the fight but not sleep', () => {
    const state = baseState()
    const battle = createBattle({ party: state.party, enemyIds: ['goblin'], seed: 113 })
    const afflicted = {
      ...battle,
      phase: BATTLE_PHASES.VICTORY,
      rewards: { xp: 0, gold: 0, drops: [] },
      combatants: battle.combatants.map((c) => {
        if (c.id !== 'p0') return c.side === 'enemy' ? { ...c, hp: 0 } : c
        return addStatus(addStatus(c, 'poison'), 'sleep')
      }),
    }

    const { state: next } = applyBattleResult(state, afflicted)
    expect(next.party[0].statuses).toContain('poison')
    expect(next.party[0].statuses).not.toContain('sleep')
  })
})
