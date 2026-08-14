/**
 * Public surface of the battle engine.
 *
 * The UI imports from here rather than reaching into individual modules, so
 * the internals (targeting, ai, actions) stay free to move around.
 */

export {
  BATTLE_PHASES,
  applyBattleResult,
  awaitingCommands,
  createBattle,
  isOver,
  resolveRound,
} from './battle.js'

export {
  canAct,
  displayName as displayNameOf,
  effectiveStats,
  enemySide,
  findCombatant,
  isDown,
  partySide,
} from './combatant.js'

export { STATUSES, getStatus, hasStatus, statusIds } from './status.js'
