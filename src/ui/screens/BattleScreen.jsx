import { useCallback, useEffect, useMemo, useState } from 'react'
import { getItem } from '../../data/items.js'
import { getSpell } from '../../data/spells.js'
import { STATUSES } from '../../engine/battle/status.js'
import {
  applyBattleResult,
  awaitingCommands,
  displayNameOf,
  resolveRound,
} from '../../engine/battle/index.js'
import { describeInventory } from '../../engine/inventory.js'
import { useGame } from '../GameProvider.jsx'
import { useInput } from '../input/InputContext.jsx'
import { applyEventToView, durationOf, viewFromBattle } from '../battle/battleView.js'
import { describeEvent } from '../battle/battleText.js'
import Bar from '../components/Bar.jsx'
import MenuList from '../components/MenuList.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * The battle screen.
 *
 * It does exactly two things: collect commands, and replay the transcript the
 * engine hands back. It contains no combat rules -- if a number appears here,
 * an event carried it.
 */

function Combatant({ combatant, view, targeted, onPick }) {
  const hp = view.hp[combatant.id] ?? 0
  const maxHp = view.maxHp[combatant.id] ?? 1
  const down = view.down[combatant.id]
  const flashing = view.flash?.id === combatant.id ? view.flash : null
  const statuses = view.statuses[combatant.id] ?? []

  const content = (
    <>
      <span
        key={view.seq}
        className={[
          'combatant__sprite',
          flashing ? `combatant__sprite--${flashing.kind}` : '',
          down ? 'combatant__sprite--down' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--sprite-color': combatant.color }}
      >
        {combatant.tag}
      </span>

      <span className="combatant__body">
        <span className="combatant__name">{displayNameOf(combatant)}</span>
        <Bar value={hp} max={maxHp} kind="hp" />
        {statuses.length > 0 ? (
          <span className="combatant__statuses">
            {statuses.map((id) => STATUSES[id]?.short ?? id).join(' ')}
          </span>
        ) : null}
      </span>

      {flashing && flashing.amount != null ? (
        <span
          key={`fx-${view.seq}`}
          className={`combatant__float combatant__float--${flashing.kind}`}
        >
          {flashing.kind === 'heal' ? '+' : ''}
          {flashing.amount}
          {flashing.crit ? '!' : ''}
        </span>
      ) : null}
      {flashing?.kind === 'miss' ? (
        <span key={`miss-${view.seq}`} className="combatant__float">
          miss
        </span>
      ) : null}
    </>
  )

  if (!onPick) {
    return (
      <div className={`combatant ${down ? 'combatant--down' : ''}`}>{content}</div>
    )
  }

  return (
    <button
      type="button"
      className={`combatant combatant--pickable ${targeted ? 'combatant--targeted' : ''}`}
      onClick={onPick}
    >
      {content}
    </button>
  )
}

export function BattleScreen() {
  const { state, dispatch } = useGame()
  const battle = state.battle

  const [view, setView] = useState(() => viewFromBattle(battle))
  const [queue, setQueue] = useState([])
  const [pendingState, setPendingState] = useState(null)
  const [message, setMessage] = useState('')

  const [commands, setCommands] = useState({})
  const [actorIndex, setActorIndex] = useState(0)
  const [panel, setPanel] = useState('root')
  const [draft, setDraft] = useState(null)
  const [cursor, setCursor] = useState(0)

  const nameOf = useCallback(
    (id) => {
      const combatant = battle.combatants.find((c) => c.id === id)
      return combatant ? displayNameOf(combatant) : '???'
    },
    [battle],
  )

  const playing = queue.length > 0
  const finished = battle.phase !== 'command'
  const actors = useMemo(() => awaitingCommands(battle), [battle])
  const actor = actors[actorIndex] ?? null

  // ------------------------------------------------------- transcript --

  useEffect(() => {
    if (queue.length === 0) return undefined
    const [event, ...rest] = queue

    const text = describeEvent(event, nameOf)
    if (text) setMessage(text)
    setView((current) => applyEventToView(current, event))

    const timer = setTimeout(() => setQueue(rest), Math.max(40, durationOf(event)))
    return () => clearTimeout(timer)
  }, [queue, nameOf])

  // Commit the engine's state only once the whole round has been narrated.
  useEffect(() => {
    if (queue.length > 0 || !pendingState) return
    dispatch({ type: 'updateBattle', battle: pendingState })
    setView(viewFromBattle(pendingState))
    setPendingState(null)
    setCommands({})
    setActorIndex(0)
    setPanel('root')
    setDraft(null)
    setCursor(0)
  }, [queue, pendingState, dispatch])

  function submit(allCommands) {
    const { state: next, events } = resolveRound(battle, allCommands)
    setPendingState(next)
    setQueue(events)
  }

  function assign(command) {
    const next = { ...commands, [actor.id]: command }
    setCommands(next)
    setPanel('root')
    setDraft(null)
    setCursor(0)

    if (actorIndex + 1 < actors.length) setActorIndex(actorIndex + 1)
    else submit(next)
  }

  function stepBack() {
    if (actorIndex === 0) return
    const previous = actors[actorIndex - 1]
    const next = { ...commands }
    delete next[previous.id]
    setCommands(next)
    setActorIndex(actorIndex - 1)
    setCursor(0)
  }

  // Confirm during playback skips the rest of the round.
  useInput((action) => {
    if (action === 'confirm' || action === 'cancel') setQueue([])
  }, playing)

  // -------------------------------------------------------- selection --

  const enemies = battle.combatants.filter((c) => c.side === 'enemy')
  const party = battle.combatants.filter((c) => c.side === 'party')

  function targetsFor(scope) {
    switch (scope) {
      case 'allEnemies':
      case 'allAllies':
      case 'self':
        return null
      case 'ally':
        return party.filter((c) => !view.down[c.id])
      case 'deadAlly':
        return party.filter((c) => view.down[c.id])
      default:
        return enemies.filter((c) => !view.down[c.id])
    }
  }

  function beginTargeting(partial, scope) {
    const options = targetsFor(scope)
    if (!options) {
      assign(partial)
      return
    }
    if (options.length === 0) return
    setDraft({ ...partial, options })
    setPanel('target')
    setCursor(0)
  }

  // ------------------------------------------------------------ panels --

  function rootPanel() {
    const silenced = (view.statuses[actor.id] ?? []).includes('silence')
    const items = [
      { key: 'attack', label: 'Attack' },
      {
        key: 'magic',
        label: 'Magic',
        disabled: actor.spells.length === 0 || silenced,
        detail: silenced ? 'silenced' : undefined,
      },
      { key: 'item', label: 'Item', disabled: battle.inventory.length === 0 },
      { key: 'defend', label: 'Defend' },
      { key: 'flee', label: 'Run', disabled: !battle.canFlee },
    ]

    return (
      <MenuList
        items={items}
        index={cursor}
        onIndexChange={setCursor}
        onCancel={stepBack}
        ariaLabel="Battle commands"
        onSelect={(item) => {
          switch (item.key) {
            case 'attack':
              beginTargeting({ kind: 'attack' }, 'enemy')
              break
            case 'magic':
              setPanel('magic')
              setCursor(0)
              break
            case 'item':
              setPanel('item')
              setCursor(0)
              break
            case 'defend':
              assign({ kind: 'defend' })
              break
            case 'flee':
              assign({ kind: 'flee' })
              break
            default:
              break
          }
        }}
      />
    )
  }

  function magicPanel() {
    const mp = view.mp[actor.id] ?? 0
    const items = actor.spells.map((spellId) => {
      const spell = getSpell(spellId)
      return {
        key: spellId,
        label: spell.name,
        detail: `${spell.mp}`,
        disabled: mp < spell.mp,
      }
    })

    return (
      <MenuList
        items={items}
        index={cursor}
        onIndexChange={setCursor}
        onCancel={() => setPanel('root')}
        emptyLabel="No spells."
        ariaLabel="Spell list"
        onSelect={(item) => {
          const spell = getSpell(item.key)
          beginTargeting({ kind: 'spell', spellId: spell.id }, spell.target)
        }}
      />
    )
  }

  function itemPanel() {
    const usable = describeInventory(battle.inventory, (item) => item.inBattle !== false)
    const items = usable.map((entry) => ({
      key: entry.id,
      label: entry.item.name,
      detail: `x${entry.qty}`,
    }))

    return (
      <MenuList
        items={items}
        index={cursor}
        onIndexChange={setCursor}
        onCancel={() => setPanel('root')}
        emptyLabel="The bag is empty."
        ariaLabel="Item list"
        onSelect={(item) => {
          const definition = getItem(item.key)
          beginTargeting({ kind: 'item', itemId: definition.id }, definition.effect?.target ?? 'self')
        }}
      />
    )
  }

  function targetPanel() {
    const items = draft.options.map((combatant) => ({
      key: combatant.id,
      label: displayNameOf(combatant),
    }))

    return (
      <MenuList
        items={items}
        index={cursor}
        onIndexChange={setCursor}
        onCancel={() => setPanel(draft.kind === 'attack' ? 'root' : draft.kind === 'spell' ? 'magic' : 'item')}
        ariaLabel="Choose a target"
        onSelect={(item) => {
          const { options, ...command } = draft
          void options
          assign({ ...command, targetId: item.key })
        }}
      />
    )
  }

  // ------------------------------------------------------- end panels --

  function outcomePanel() {
    if (battle.phase === 'victory') {
      const { levelUps } = applyBattleResult(state, battle)
      const rewards = battle.rewards ?? { xp: 0, gold: 0, drops: [] }

      return (
        <Window title="Victory">
          <p style={{ marginTop: 0 }}>
            {rewards.xp} experience &middot; {rewards.gold} gold
          </p>
          {rewards.drops.length > 0 ? (
            <p className="u-dim">Found: {rewards.drops.map((id) => getItem(id).name).join(', ')}</p>
          ) : null}
          {levelUps.map((entry) => (
            <p key={entry.characterIndex} className="u-accent">
              {entry.name} reaches level {state.party[entry.characterIndex].level + entry.levels}!
              {entry.learnedSpells.length > 0
                ? ` Learned ${entry.learnedSpells.map((id) => getSpell(id).name).join(', ')}.`
                : ''}
            </p>
          ))}
          <MenuList
            items={[{ key: 'ok', label: 'Continue' }]}
            onSelect={() => dispatch({ type: 'endBattle' })}
            onCancel={() => dispatch({ type: 'endBattle' })}
          />
        </Window>
      )
    }

    return (
      <Window title={battle.phase === 'defeat' ? 'Defeat' : 'Escaped'}>
        <p style={{ marginTop: 0 }}>
          {battle.phase === 'defeat'
            ? 'The party has fallen.'
            : 'You slip away into the dark.'}
        </p>
        <MenuList
          items={[{ key: 'ok', label: 'Continue' }]}
          onSelect={() => dispatch({ type: 'endBattle' })}
          onCancel={() => dispatch({ type: 'endBattle' })}
        />
      </Window>
    )
  }

  // ------------------------------------------------------------ render --

  const showCommands = !playing && !finished && actor

  return (
    <div className="screen battle">
      <div className="battle__enemies">
        {enemies.map((combatant) => (
          <Combatant
            key={combatant.id}
            combatant={combatant}
            view={view}
            targeted={panel === 'target' && draft?.options.some((o) => o.id === combatant.id)}
            onPick={
              panel === 'target' && draft.options.some((o) => o.id === combatant.id)
                ? () => {
                    const { options, ...command } = draft
                    void options
                    assign({ ...command, targetId: combatant.id })
                  }
                : undefined
            }
          />
        ))}
      </div>

      <Window className="battle__log">
        {finished && !playing ? null : (
          <p style={{ margin: 0 }}>
            {message ||
              (showCommands ? `What will ${displayNameOf(actor)} do?` : 'The enemy closes in...')}
          </p>
        )}
        {finished && !playing ? outcomePanel() : null}
      </Window>

      <div className="battle__bottom">
        <div className="battle__party">
          {party.map((combatant) => (
            <Combatant
              key={combatant.id}
              combatant={combatant}
              view={view}
              targeted={
                (panel === 'target' && draft?.options.some((o) => o.id === combatant.id)) ||
                (showCommands && combatant.id === actor.id)
              }
              onPick={
                panel === 'target' && draft.options.some((o) => o.id === combatant.id)
                  ? () => {
                      const { options, ...command } = draft
                      void options
                      assign({ ...command, targetId: combatant.id })
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {showCommands ? (
          <Window className="battle__commands" title={displayNameOf(actor)}>
            {panel === 'root' ? rootPanel() : null}
            {panel === 'magic' ? magicPanel() : null}
            {panel === 'item' ? itemPanel() : null}
            {panel === 'target' ? targetPanel() : null}
          </Window>
        ) : null}
      </div>

      <VirtualDPad />
    </div>
  )
}

export default BattleScreen
