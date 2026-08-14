import { effectiveStats } from '../../engine/battle/combatant.js'

/**
 * A lightweight mirror of the battle, rebuilt by replaying the transcript.
 *
 * The engine hands back the final state plus a list of everything that
 * happened. Snapping straight to the final state would show the whole round
 * at once, so instead the UI starts from the state *before* the round and
 * walks the events, applying each one as it is narrated.
 *
 * This is a view model, not a second copy of the rules: it only tracks what
 * is drawn -- HP, MP, downed, statuses, and the flash on a sprite.
 */

export function viewFromBattle(battle) {
  const hp = {}
  const mp = {}
  const maxHp = {}
  const maxMp = {}
  const down = {}
  const statuses = {}

  for (const combatant of battle.combatants) {
    const stats = effectiveStats(combatant)
    hp[combatant.id] = combatant.hp
    mp[combatant.id] = combatant.mp
    maxHp[combatant.id] = stats.maxHp
    maxMp[combatant.id] = stats.maxMp
    down[combatant.id] = combatant.hp <= 0
    statuses[combatant.id] = combatant.statuses.map((entry) => entry.id)
  }

  return { hp, mp, maxHp, maxMp, down, statuses, flash: null, seq: 0 }
}

/** Apply one transcript event to the view. Returns a new view. */
export function applyEventToView(view, event) {
  switch (event.type) {
    case 'damage': {
      const hp = Math.max(0, (view.hp[event.targetId] ?? 0) - event.amount)
      return {
        ...view,
        hp: { ...view.hp, [event.targetId]: hp },
        flash: {
          id: event.targetId,
          kind: event.amount === 0 ? 'immune' : 'damage',
          amount: event.amount,
          crit: Boolean(event.crit),
          effectiveness: event.effectiveness ?? null,
        },
        seq: view.seq + 1,
      }
    }

    case 'heal': {
      const hp = Math.min(
        view.maxHp[event.targetId] ?? Infinity,
        (view.hp[event.targetId] ?? 0) + event.amount,
      )
      return {
        ...view,
        hp: { ...view.hp, [event.targetId]: hp },
        flash: { id: event.targetId, kind: 'heal', amount: event.amount },
        seq: view.seq + 1,
      }
    }

    case 'mp': {
      const mp = Math.min(
        view.maxMp[event.targetId] ?? Infinity,
        (view.mp[event.targetId] ?? 0) + event.amount,
      )
      return { ...view, mp: { ...view.mp, [event.targetId]: mp } }
    }

    case 'castSpell':
      // MP is spent the moment the spell goes off, so the bar moves with it.
      return { ...view, flash: { id: event.actorId, kind: 'cast' }, seq: view.seq + 1 }

    case 'statusTick': {
      const hp = Math.max(0, (view.hp[event.targetId] ?? 0) - event.amount)
      return {
        ...view,
        hp: { ...view.hp, [event.targetId]: hp },
        flash: { id: event.targetId, kind: 'damage', amount: event.amount },
        seq: view.seq + 1,
      }
    }

    case 'ko':
      return { ...view, down: { ...view.down, [event.targetId]: true } }

    case 'revive':
      return {
        ...view,
        hp: { ...view.hp, [event.targetId]: event.hp },
        down: { ...view.down, [event.targetId]: false },
        flash: { id: event.targetId, kind: 'heal', amount: event.hp },
        seq: view.seq + 1,
      }

    case 'statusApplied':
      return {
        ...view,
        statuses: {
          ...view.statuses,
          [event.targetId]: [...(view.statuses[event.targetId] ?? []), event.status],
        },
      }

    case 'wake':
      return {
        ...view,
        statuses: {
          ...view.statuses,
          [event.targetId]: (view.statuses[event.targetId] ?? []).filter(
            (id) => id !== event.status,
          ),
        },
      }

    case 'statusCured':
      return {
        ...view,
        statuses: {
          ...view.statuses,
          [event.targetId]: (view.statuses[event.targetId] ?? []).filter(
            (id) => !event.statuses.includes(id),
          ),
        },
      }

    case 'miss':
      return { ...view, flash: { id: event.targetId, kind: 'miss' }, seq: view.seq + 1 }

    default:
      return view
  }
}

/**
 * How long each event should sit on screen. Silent bookkeeping events pass
 * through instantly; anything the player needs to read gets time to be read.
 */
export const EVENT_DURATION = {
  roundStart: 0,
  turnStart: 0,
  roundEnd: 0,
  opening: 900,
  attack: 200,
  miss: 480,
  damage: 400,
  heal: 460,
  mp: 0,
  ko: 520,
  revive: 620,
  castSpell: 520,
  useItem: 520,
  defend: 320,
  flee: 620,
  silenced: 620,
  noMp: 620,
  fizzle: 480,
  retarget: 420,
  statusApplied: 620,
  statusResisted: 460,
  statusImmune: 520,
  statusCured: 560,
  statusTick: 520,
  buff: 560,
  wake: 480,
  noEffect: 380,
  escaped: 700,
  victory: 0,
  defeat: 0,
  fled: 0,
}

export function durationOf(event) {
  return EVENT_DURATION[event.type] ?? 400
}
