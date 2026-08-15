import { getSpell } from '../../data/spells.js'
import { effectiveStats, isDown } from './combatant.js'

/**
 * A competent-but-not-optimal player, expressed as code.
 *
 * Used by the balance tests and by tools/sim.js so both measure the game
 * against the same opponent. Deliberately not perfect play: it revives, group
 * heals, drinks when the healer is dry and sweeps crowds with area magic, but
 * it does not track resistances or plan ahead. Numbers produced against a
 * perfect player would flatter the balance and hide exactly the kind of
 * difficulty spike that shipped the first dungeon unbeatable.
 *
 * Pure and deterministic: same battle state in, same commands out.
 */
export function chooseAutoCommands(battle) {
  const commands = {}
  const party = battle.combatants.filter((c) => c.side === 'party' && !isDown(c))
  const foes = battle.combatants.filter((c) => c.side === 'enemy' && !isDown(c))
  if (foes.length === 0) return commands

  const weakest = party.reduce((worst, member) => {
    const ratio = member.hp / effectiveStats(member).maxHp
    return !worst || ratio < worst.ratio ? { member, ratio } : worst
  }, null)

  const fallen = battle.combatants.find((c) => c.side === 'party' && isDown(c))
  let healerUsed = false

  for (const member of party) {
    const spells = member.spells.map(getSpell)
    const target = foes[0]

    // Revive first: a body on the floor is worse than any amount of damage.
    const revive = spells.find((spell) => spell.kind === 'revive' && member.mp >= spell.mp)
    if (fallen && revive && !healerUsed) {
      commands[member.id] = { kind: 'spell', spellId: revive.id, targetId: fallen.id }
      healerUsed = true
      continue
    }

    // Group-heal when the whole party is being ground down -- which is how a
    // real player answers an enemy that opens with area magic every round.
    const hurtCount = party.filter(
      (other) => other.hp / effectiveStats(other).maxHp < 0.55,
    ).length
    const groupHeal = spells
      .filter((spell) => spell.kind === 'healAll' && member.mp >= spell.mp)
      .sort((a, b) => b.power - a.power)[0]
    if (!healerUsed && groupHeal && hurtCount >= 2) {
      commands[member.id] = { kind: 'spell', spellId: groupHeal.id }
      healerUsed = true
      continue
    }

    // Heal when someone is under 40%.
    const heals = spells
      .filter((spell) => spell.kind === 'heal' && member.mp >= spell.mp)
      .sort((a, b) => b.power - a.power)
    if (!healerUsed && weakest && weakest.ratio < 0.4 && heals.length > 0) {
      commands[member.id] = { kind: 'spell', spellId: heals[0].id, targetId: weakest.member.id }
      healerUsed = true
      continue
    }

    // Out of MP but someone is dying: drink. Players always have a bag full.
    if (!healerUsed && weakest && weakest.ratio < 0.35) {
      const potion = ['elixir', 'hi-potion', 'potion'].find((itemId) =>
        battle.inventory.some((entry) => entry.id === itemId && entry.qty > 0),
      )
      if (potion) {
        commands[member.id] = { kind: 'item', itemId: potion, targetId: weakest.member.id }
        healerUsed = true
        continue
      }
    }

    // Sweep a crowd with the biggest affordable all-target spell.
    if (foes.length >= 3) {
      const sweep = spells
        .filter(
          (spell) =>
            spell.kind === 'damage' && spell.target === 'allEnemies' && member.mp >= spell.mp,
        )
        .sort((a, b) => b.power - a.power)[0]
      if (sweep) {
        commands[member.id] = { kind: 'spell', spellId: sweep.id }
        continue
      }
    }

    // Single-target magic is worth it when it beats a swing outright.
    const nuke = spells
      .filter(
        (spell) => spell.kind === 'damage' && spell.target === 'enemy' && member.mp >= spell.mp,
      )
      .sort((a, b) => b.power - a.power)[0]
    const stats = effectiveStats(member)
    if (nuke && nuke.power + stats.magicAttack * 0.6 > stats.attack * 1.4) {
      commands[member.id] = { kind: 'spell', spellId: nuke.id, targetId: target.id }
      continue
    }

    commands[member.id] = { kind: 'attack', targetId: target.id }
  }

  return commands
}

export default chooseAutoCommands
