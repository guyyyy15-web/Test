import { describe, it, expect } from 'vitest'
import {
  createCharacter,
  damage,
  gainXp,
  heal,
  isKO,
  isPartyWiped,
  promote,
  restore,
  revive,
  spellsKnownAt,
} from './character.js'
import { CLASSES, STARTING_CLASS_IDS, getClass } from '../data/classes.js'
import { MAX_LEVEL, totalXpForLevel, xpToNext } from './formulas.js'
import { baseStatsAtLevel, deriveStats } from './stats.js'

function makeHero(classId = 'warrior', level = 1) {
  return createCharacter({ id: 'h1', name: 'Ryn', classId, level })
}

describe('createCharacter', () => {
  it('starts at full HP and MP', () => {
    for (const classId of STARTING_CLASS_IDS) {
      const hero = makeHero(classId)
      const { maxHp, maxMp } = deriveStats(hero)
      expect(hero.hp).toBe(maxHp)
      expect(hero.mp).toBe(maxMp)
    }
  })

  it('knows the level 1 spells of its class and nothing more', () => {
    expect(makeHero('whiteMage').spells).toEqual(['heal', 'cleanse'])
    expect(makeHero('blackMage').spells).toEqual(['fire', 'frost'])
    expect(makeHero('warrior').spells).toEqual([])
  })

  it('starts with every equipment slot empty', () => {
    const hero = makeHero()
    expect(Object.values(hero.equipment).every((slot) => slot === null)).toBe(true)
  })
})

describe('stat growth', () => {
  it('is deterministic for a given class and level', () => {
    const a = baseStatsAtLevel(CLASSES.warrior, 20)
    const b = baseStatsAtLevel(CLASSES.warrior, 20)
    expect(a).toEqual(b)
  })

  it('never goes backwards as level rises', () => {
    for (const classId of STARTING_CLASS_IDS) {
      const classDef = getClass(classId)
      let previous = baseStatsAtLevel(classDef, 1)
      for (let level = 2; level <= MAX_LEVEL; level++) {
        const current = baseStatsAtLevel(classDef, level)
        for (const key of Object.keys(current)) {
          expect(current[key]).toBeGreaterThanOrEqual(previous[key])
        }
        previous = current
      }
    }
  })

  it('keeps the Warrior ahead on HP and the Black Mage ahead on magic', () => {
    const warrior = deriveStats(makeHero('warrior', 25))
    const blackMage = deriveStats(makeHero('blackMage', 25))
    expect(warrior.maxHp).toBeGreaterThan(blackMage.maxHp)
    expect(blackMage.magicAttack).toBeGreaterThan(warrior.magicAttack)
    expect(blackMage.maxMp).toBeGreaterThan(warrior.maxMp)
  })

  it('gives the unarmed Monk more attack than an armed one past the early game', () => {
    const barehanded = makeHero('monk', 10)
    const armed = { ...barehanded, equipment: { ...barehanded.equipment, weapon: 'iron-claw' } }
    expect(deriveStats(barehanded).attack).toBeGreaterThan(deriveStats(armed).attack)
  })
})

describe('gainXp', () => {
  it('accumulates XP without levelling below the threshold', () => {
    const hero = makeHero()
    const result = gainXp(hero, xpToNext(1) - 1)
    expect(result.levelsGained).toBe(0)
    expect(result.character.level).toBe(1)
    expect(result.character.xp).toBe(xpToNext(1) - 1)
  })

  it('levels up and carries the remainder', () => {
    const hero = makeHero()
    const result = gainXp(hero, xpToNext(1) + 5)
    expect(result.levelsGained).toBe(1)
    expect(result.character.level).toBe(2)
    expect(result.character.xp).toBe(5)
  })

  it('handles multiple levels from a single award', () => {
    const hero = makeHero()
    const result = gainXp(hero, totalXpForLevel(6))
    expect(result.character.level).toBe(6)
    expect(result.levelsGained).toBe(5)
  })

  it('reports newly learned spells', () => {
    const mage = makeHero('blackMage')
    const result = gainXp(mage, totalXpForLevel(5))
    expect(result.character.level).toBe(5)
    expect(result.learnedSpells).toContain('sleep')
    expect(result.learnedSpells).toContain('spark')
    expect(result.character.spells).toContain('dim')
  })

  it('grants the max-HP difference rather than a free full heal', () => {
    const hero = damage(makeHero(), 20)
    const before = deriveStats(hero)
    const hpBefore = hero.hp

    const result = gainXp(hero, xpToNext(1))
    const after = deriveStats(result.character)

    expect(result.character.hp).toBe(hpBefore + (after.maxHp - before.maxHp))
    expect(result.character.hp).toBeLessThan(after.maxHp)
  })

  it('stops at the level cap', () => {
    const hero = makeHero('warrior', MAX_LEVEL)
    const result = gainXp(hero, 999999)
    expect(result.character.level).toBe(MAX_LEVEL)
    expect(result.levelsGained).toBe(0)
  })

  it('never awards XP for a negative amount', () => {
    const hero = makeHero()
    expect(gainXp(hero, -500).character.xp).toBe(0)
  })
})

describe('damage, healing and death', () => {
  it('marks a character KO at zero HP', () => {
    const hero = damage(makeHero(), 9999)
    expect(hero.hp).toBe(0)
    expect(isKO(hero)).toBe(true)
    expect(hero.statuses).toContain('ko')
  })

  it('refuses to heal the dead', () => {
    const dead = damage(makeHero(), 9999)
    expect(heal(dead, 50).hp).toBe(0)
  })

  it('revives at a percentage of max HP', () => {
    const dead = damage(makeHero(), 9999)
    const back = revive(dead, 25)
    const { maxHp } = deriveStats(back)
    expect(back.hp).toBe(Math.floor(maxHp * 0.25))
    expect(isKO(back)).toBe(false)
  })

  it('never heals past the maximum', () => {
    const hero = damage(makeHero(), 5)
    const { maxHp } = deriveStats(hero)
    expect(heal(hero, 9999).hp).toBe(maxHp)
  })

  it('restore clears poison and KO but leaves the character intact', () => {
    const dead = damage(makeHero(), 9999)
    const healed = restore(dead)
    expect(isKO(healed)).toBe(false)
    expect(healed.statuses).toEqual([])
  })

  it('detects a party wipe only when everyone is down', () => {
    const alive = makeHero()
    const dead = damage(makeHero(), 9999)
    expect(isPartyWiped([alive, dead])).toBe(false)
    expect(isPartyWiped([dead, dead])).toBe(true)
  })
})

describe('promotion', () => {
  it('keeps level, XP and gear while swapping the class', () => {
    const hero = { ...makeHero('warrior', 20), equipment: { weapon: 'iron-sword' } }
    const knight = promote(hero)
    expect(knight.classId).toBe('knight')
    expect(knight.level).toBe(20)
    expect(knight.equipment.weapon).toBe('iron-sword')
  })

  it('adds the promoted class spells to what the character already knew', () => {
    const mage = makeHero('whiteMage', 10)
    const wizard = promote(mage)
    for (const spell of mage.spells) expect(wizard.spells).toContain(spell)
  })

  it('is a no-op for a class with no promotion', () => {
    const master = makeHero('warrior', 10)
    const promoted = promote(promote(master))
    expect(promoted.classId).toBe('knight')
  })

  it('grants the Knight white magic a Warrior never had', () => {
    expect(spellsKnownAt(getClass('knight'), 1)).toContain('heal')
    expect(spellsKnownAt(getClass('warrior'), 50)).toEqual([])
  })
})
