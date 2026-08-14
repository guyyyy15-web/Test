import { describe, it, expect } from 'vitest'
import {
  MAX_STACK,
  addItem,
  buy,
  canEquip,
  countItem,
  equipItem,
  equippableFor,
  hasItem,
  removeItem,
  sell,
  sellPrice,
  unequipSlot,
} from './inventory.js'
import { createCharacter } from './character.js'
import { deriveStats } from './stats.js'

const hero = (classId = 'warrior') =>
  createCharacter({ id: 'h1', name: 'Ryn', classId, level: 5 })

describe('inventory stacking', () => {
  it('adds a new entry and then stacks onto it', () => {
    let inv = addItem([], 'potion', 3)
    expect(inv).toEqual([{ id: 'potion', qty: 3 }])
    inv = addItem(inv, 'potion', 2)
    expect(countItem(inv, 'potion')).toBe(5)
    expect(inv).toHaveLength(1)
  })

  it('caps a stack', () => {
    const inv = addItem(addItem([], 'potion', 90), 'potion', 50)
    expect(countItem(inv, 'potion')).toBe(MAX_STACK)
  })

  it('never mutates the array it was given', () => {
    const original = addItem([], 'potion', 1)
    const snapshot = JSON.parse(JSON.stringify(original))
    addItem(original, 'potion', 5)
    removeItem(original, 'potion', 1)
    expect(original).toEqual(snapshot)
  })

  it('drops the entry entirely when the last one is used', () => {
    const inv = removeItem(addItem([], 'potion', 1), 'potion', 1)
    expect(inv).toEqual([])
    expect(hasItem(inv, 'potion')).toBe(false)
  })

  it('ignores removal of something not held', () => {
    const inv = addItem([], 'potion', 1)
    expect(removeItem(inv, 'ether', 1)).toEqual(inv)
  })

  it('rejects an unknown item id at the point of authoring', () => {
    expect(() => addItem([], 'not-a-real-item', 1)).toThrow(/Unknown item/)
  })

  it('preserves acquisition order', () => {
    let inv = addItem([], 'potion', 1)
    inv = addItem(inv, 'ether', 1)
    inv = addItem(inv, 'antidote', 1)
    inv = addItem(inv, 'potion', 1)
    expect(inv.map((entry) => entry.id)).toEqual(['potion', 'ether', 'antidote'])
  })
})

describe('equip restrictions', () => {
  it('lets a Warrior wear heavy plate and a Black Mage not', () => {
    expect(canEquip(hero('warrior'), 'iron-plate')).toBe(true)
    expect(canEquip(hero('blackMage'), 'iron-plate')).toBe(false)
  })

  it('lets only the right classes hold each weapon type', () => {
    expect(canEquip(hero('warrior'), 'battle-axe')).toBe(true)
    expect(canEquip(hero('thief'), 'battle-axe')).toBe(false)
    expect(canEquip(hero('thief'), 'elven-bow')).toBe(true)
    expect(canEquip(hero('blackMage'), 'arcane-rod')).toBe(true)
    expect(canEquip(hero('blackMage'), 'iron-sword')).toBe(false)
  })

  it('lets everyone wear any accessory', () => {
    for (const classId of ['warrior', 'thief', 'monk', 'whiteMage', 'blackMage', 'redMage']) {
      expect(canEquip(hero(classId), 'ribbon')).toBe(true)
    }
  })

  it('refuses to equip a consumable', () => {
    expect(canEquip(hero(), 'potion')).toBe(false)
  })
})

describe('equipping', () => {
  it('moves the item out of the bag and onto the character', () => {
    const inv = addItem([], 'iron-sword', 1)
    const result = equipItem(hero(), inv, 'iron-sword')
    expect(result.equipped).toBe(true)
    expect(result.character.equipment.weapon).toBe('iron-sword')
    expect(hasItem(result.inventory, 'iron-sword')).toBe(false)
  })

  it('returns the previous item to the bag instead of destroying it', () => {
    let inv = addItem(addItem([], 'bronze-sword', 1), 'iron-sword', 1)
    let character = hero()
    ;({ character, inventory: inv } = equipItem(character, inv, 'bronze-sword'))
    ;({ character, inventory: inv } = equipItem(character, inv, 'iron-sword'))

    expect(character.equipment.weapon).toBe('iron-sword')
    expect(countItem(inv, 'bronze-sword')).toBe(1)
  })

  it('refuses when the class cannot use the item', () => {
    const inv = addItem([], 'iron-plate', 1)
    const result = equipItem(hero('blackMage'), inv, 'iron-plate')
    expect(result.equipped).toBe(false)
    expect(result.character.equipment.body).toBeNull()
    expect(countItem(result.inventory, 'iron-plate')).toBe(1)
  })

  it('refuses when the item is not in the bag', () => {
    const result = equipItem(hero(), [], 'iron-sword')
    expect(result.equipped).toBe(false)
  })

  it('raises attack when a weapon goes on', () => {
    const inv = addItem([], 'iron-sword', 1)
    const before = deriveStats(hero()).attack
    const { character } = equipItem(hero(), inv, 'iron-sword')
    expect(deriveStats(character).attack).toBe(before + 14)
  })

  it('clamps current HP when unequipping drops the maximum', () => {
    const inv = addItem([], 'mage-robe', 1)
    let character = createCharacter({ id: 'h', name: 'M', classId: 'blackMage', level: 5 })
    ;({ character } = equipItem(character, inv, 'mage-robe'))
    character = { ...character, hp: deriveStats(character).maxHp }

    const stripped = unequipSlot(character, [], 'body')
    expect(stripped.character.hp).toBeLessThanOrEqual(deriveStats(stripped.character).maxHp)
  })

  it('lists only what this character could actually wear', () => {
    let inv = addItem([], 'iron-plate', 1)
    inv = addItem(inv, 'mage-robe', 1)
    inv = addItem(inv, 'potion', 1)

    expect(equippableFor(hero('warrior'), inv, 'body').map((e) => e.id)).toEqual(['iron-plate'])
    expect(equippableFor(hero('blackMage'), inv, 'body').map((e) => e.id)).toEqual(['mage-robe'])
  })
})

describe('shopping', () => {
  const state = { gold: 1000, inventory: [] }

  it('buys when affordable', () => {
    const next = buy(state, 'potion', 2)
    expect(next.gold).toBe(900)
    expect(countItem(next.inventory, 'potion')).toBe(2)
  })

  it('refuses when it cannot be afforded', () => {
    expect(buy(state, 'elixir', 1)).toBe(state)
  })

  it('sells at half price', () => {
    const withItem = { gold: 0, inventory: addItem([], 'iron-sword', 1) }
    const next = sell(withItem, 'iron-sword', 1)
    expect(next.gold).toBe(sellPrice('iron-sword'))
    expect(hasItem(next.inventory, 'iron-sword')).toBe(false)
  })

  it('refuses to sell key items', () => {
    const withKey = { gold: 0, inventory: addItem([], 'sunstone', 1) }
    expect(sell(withKey, 'sunstone', 1)).toBe(withKey)
  })

  it('refuses to sell what is not held', () => {
    expect(sell(state, 'potion', 1)).toBe(state)
  })
})
