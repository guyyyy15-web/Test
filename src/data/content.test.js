import { describe, it, expect } from 'vitest'
import { STONE_QUESTS, WORLD_NODES, destinationsFrom, getNode, isUnlocked } from './world.js'
import { TOWNS } from './towns/index.js'
import { DUNGEONS } from './maps/index.js'
import { ENEMIES } from './enemies.js'
import { ITEMS } from './items.js'
import { SPELLS } from './spells.js'
import { ALL_CLASSES, STARTING_CLASS_IDS } from './classes.js'
import { ENCOUNTER_TABLES } from './encounterTables.js'

/**
 * Content integrity.
 *
 * These are not unit tests of code -- they are proofs about the game itself:
 * that every reference resolves, and that a player who beats each boss in turn
 * can actually reach the end. A typo'd item id or a gate whose flag nobody
 * grants is a soft-lock, and neither is visible reading the data file.
 */

/** Everything a boss awards, gathered from every floor of every dungeon. */
function bossTriggers() {
  const found = []
  for (const dungeon of Object.values(DUNGEONS)) {
    for (const floor of dungeon.floors) {
      for (const detail of Object.values(floor.props)) {
        if (detail.kind === 'boss') found.push({ dungeon, floor, ...detail })
      }
    }
  }
  return found
}

describe('the world graph', () => {
  it('points every node at something that exists', () => {
    for (const node of Object.values(WORLD_NODES)) {
      if (node.kind === 'town') expect(TOWNS[node.townId], node.id).toBeTruthy()
      else {
        const dungeon = DUNGEONS[node.dungeonId]
        expect(dungeon, node.id).toBeTruthy()
        expect(dungeon.floors.some((floor) => floor.id === node.floorId)).toBe(true)
      }
    }
  })

  it('links only to nodes that exist, in both directions', () => {
    for (const node of Object.values(WORLD_NODES)) {
      for (const linkId of node.links) {
        const target = WORLD_NODES[linkId]
        expect(target, `${node.id} links to missing ${linkId}`).toBeTruthy()
        expect(
          target.links.includes(node.id),
          `${linkId} does not link back to ${node.id}`,
        ).toBe(true)
      }
    }
  })

  it('gates every node behind a flag some boss actually grants', () => {
    const granted = new Set(bossTriggers().map((boss) => boss.flag))
    for (const node of Object.values(WORLD_NODES)) {
      if (!node.requires) continue
      expect(granted.has(node.requires), `${node.id} needs ungranted ${node.requires}`).toBe(true)
    }
  })

  it('agrees with the towns about what unlocks them', () => {
    for (const node of Object.values(WORLD_NODES)) {
      if (node.kind !== 'town') continue
      const town = TOWNS[node.townId]
      if (town.requires) expect(node.requires).toBe(town.requires)
    }
  })
})

/**
 * The one that matters: play the game the way a player would -- go where you
 * can, beat what is there, repeat -- and prove it ends.
 */
describe('the game can be finished', () => {
  it('reaches the final boss by beating each one in turn', () => {
    const bosses = bossTriggers()
    const flags = {}
    let position = 'emberfall'
    const beaten = []

    for (let step = 0; step < 40; step++) {
      // Everything reachable from here with the flags held so far.
      const seen = new Set([position])
      const frontier = [position]
      while (frontier.length > 0) {
        for (const next of destinationsFrom(frontier.pop(), flags)) {
          if (seen.has(next.id)) continue
          seen.add(next.id)
          frontier.push(next.id)
        }
      }

      const available = bosses.find(
        (boss) =>
          !flags[boss.flag] &&
          [...seen].some((nodeId) => WORLD_NODES[nodeId]?.dungeonId === boss.dungeon.id),
      )
      if (!available) break

      flags[available.flag] = true
      beaten.push(available.flag)
      position = Object.values(WORLD_NODES).find(
        (node) => node.dungeonId === available.dungeon.id,
      ).id
      if (available.flag === 'emberKingDefeated') break
    }

    expect(beaten).toContain('emberKingDefeated')
  })

  it('awards all four stones along the way', () => {
    const rewards = new Set(bossTriggers().map((boss) => boss.reward?.itemId))
    for (const quest of STONE_QUESTS) {
      expect(rewards.has(quest.itemId), `nothing awards the ${quest.name}`).toBe(true)
    }
  })

  it('ties each stone to the boss flag that gates the road onward', () => {
    const bosses = bossTriggers()
    for (const quest of STONE_QUESTS) {
      const boss = bosses.find((entry) => entry.reward?.itemId === quest.itemId)
      expect(boss.flag).toBe(quest.flag)
    }
  })

  it('has exactly one boss that ends the game', () => {
    expect(bossTriggers().filter((boss) => boss.endsGame)).toHaveLength(1)
  })

  it('never gates a node behind a flag from a dungeon that node unlocks', () => {
    // A dungeon whose own boss unlocks the road to it is unreachable forever.
    for (const boss of bossTriggers()) {
      const node = Object.values(WORLD_NODES).find((n) => n.dungeonId === boss.dungeon.id)
      expect(node.requires).not.toBe(boss.flag)
    }
  })
})

describe('towns', () => {
  it('stocks only items that exist, at a price above zero', () => {
    for (const town of Object.values(TOWNS)) {
      for (const shop of town.shops) {
        for (const itemId of shop.stock) {
          const item = ITEMS[itemId]
          expect(item, `${town.id}/${shop.id} sells unknown ${itemId}`).toBeTruthy()
          expect(item.price, `${itemId} is free`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('charges more for a bed the further along the story you are', () => {
    const order = ['emberfall', 'saltmoor', 'highreach', 'ashvale', 'lastCamp']
    const prices = order.map((id) => TOWNS[id].inn.price)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1])
    }
  })

  it('gives every NPC something to say', () => {
    for (const town of Object.values(TOWNS)) {
      for (const npc of town.npcs) {
        expect(npc.lines.length, `${town.id}/${npc.id}`).toBeGreaterThan(0)
        for (const line of npc.lines) expect(line.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('offers the class change exactly once, in one place', () => {
    const shrines = Object.values(TOWNS).filter((town) => town.shrine)
    expect(shrines).toHaveLength(1)
    expect(shrines[0].shrine.flag).toBe('promoted')
  })
})

describe('classes and spells', () => {
  it('only teaches spells that exist', () => {
    for (const classDef of Object.values(ALL_CLASSES)) {
      for (const spellIds of Object.values(classDef.spellsByLevel ?? {})) {
        for (const spellId of spellIds) {
          expect(SPELLS[spellId], `${classDef.id} teaches unknown ${spellId}`).toBeTruthy()
        }
      }
    }
  })

  it('gives every starting class a promotion that exists', () => {
    for (const classId of STARTING_CLASS_IDS) {
      const promotion = ALL_CLASSES[classId].promotion
      expect(promotion, `${classId} has no promotion`).toBeTruthy()
      expect(ALL_CLASSES[promotion]).toBeTruthy()
    }
  })

  it('leaves every spell learnable by somebody', () => {
    const taught = new Set(
      Object.values(ALL_CLASSES).flatMap((classDef) =>
        Object.values(classDef.spellsByLevel ?? {}).flat(),
      ),
    )
    // Enemies may also cast, so count their lists too.
    for (const enemy of Object.values(ENEMIES)) {
      for (const option of enemy.ai ?? []) if (option.spellId) taught.add(option.spellId)
    }
    for (const spellId of Object.keys(SPELLS)) {
      expect(taught.has(spellId), `nothing ever casts ${spellId}`).toBe(true)
    }
  })
})

describe('the bestiary', () => {
  it('only casts spells that exist', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const option of enemy.ai ?? []) {
        if (option.spellId) {
          expect(SPELLS[option.spellId], `${enemy.id} casts unknown ${option.spellId}`).toBeTruthy()
        }
      }
    }
  })

  it('only drops items that exist', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const drop of enemy.drops ?? []) {
        expect(ITEMS[drop.itemId], `${enemy.id} drops unknown ${drop.itemId}`).toBeTruthy()
        expect(drop.chance).toBeGreaterThan(0)
        expect(drop.chance).toBeLessThanOrEqual(100)
      }
    }
  })

  it('gives every enemy the stats a fight needs', () => {
    for (const enemy of Object.values(ENEMIES)) {
      for (const key of ['hp', 'attack', 'defense', 'agi', 'level']) {
        expect(typeof enemy[key], `${enemy.id}.${key}`).toBe('number')
        expect(enemy[key], `${enemy.id}.${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('pays out for everything except the final boss', () => {
    for (const enemy of Object.values(ENEMIES)) {
      if (enemy.id === 'emberKing') continue
      expect(enemy.xp, `${enemy.id} gives no xp`).toBeGreaterThan(0)
    }
  })

  it('puts every enemy in an encounter table or a boss room', () => {
    const inTables = new Set(
      Object.values(ENCOUNTER_TABLES).flatMap((table) =>
        table.groups.flatMap((group) => group.enemies),
      ),
    )
    const inBossRooms = new Set(bossTriggers().flatMap((boss) => boss.enemyIds))

    for (const enemy of Object.values(ENEMIES)) {
      expect(
        inTables.has(enemy.id) || inBossRooms.has(enemy.id),
        `${enemy.id} never appears anywhere`,
      ).toBe(true)
    }
  })
})
