import { useState } from 'react'
import { STAT_LABELS, getClass } from '../../data/classes.js'
import { EQUIP_SLOTS, SLOT_LABELS } from '../../data/equipment.js'
import { getItem } from '../../data/items.js'
import { getSpell, isFieldSpell } from '../../data/spells.js'
import { isKO, xpToNextFor } from '../../engine/character.js'
import { itemWouldHelp } from '../../engine/effects.js'
import { describeInventory, equippableFor } from '../../engine/inventory.js'
import { deriveStats, equippedIn } from '../../engine/stats.js'
import { MODES } from '../../engine/game.js'
import { useGame } from '../GameProvider.jsx'
import MenuList from '../components/MenuList.jsx'
import PartyRow from '../components/PartyRow.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * The field menu: Item, Magic, Equip, Status.
 *
 * Navigation is an explicit stack of panels, so "cancel" always means "go
 * back one step" without any panel needing to know who pushed it.
 */

/** Closing the menu returns to whatever kind of place the party is standing in. */
const MODE_FOR_LOCATION = {
  world: MODES.WORLD,
  town: MODES.TOWN,
  dungeon: MODES.DUNGEON,
}

const STAT_ROWS = [
  ['attack', 'Attack'],
  ['defense', 'Defense'],
  ['magicAttack', 'M.Atk'],
  ['magicDefense', 'M.Def'],
  ['accuracy', 'Accuracy'],
  ['evasion', 'Evasion'],
  ['critChance', 'Crit %'],
]

function StatusSheet({ character }) {
  const stats = deriveStats(character)
  const classDef = getClass(character.classId)

  return (
    <Window title={`${character.name} - ${classDef.name}`}>
      <div className="stat-grid">
        <div className="stat-grid__row">
          <span className="stat-grid__label">Level</span>
          <span>{character.level}</span>
        </div>
        <div className="stat-grid__row">
          <span className="stat-grid__label">Next</span>
          <span>{Math.max(0, xpToNextFor(character) - character.xp)} xp</span>
        </div>
        <div className="stat-grid__row">
          <span className="stat-grid__label">HP</span>
          <span>
            {character.hp}/{stats.maxHp}
          </span>
        </div>
        <div className="stat-grid__row">
          <span className="stat-grid__label">MP</span>
          <span>
            {character.mp}/{stats.maxMp}
          </span>
        </div>
        {['str', 'agi', 'vit', 'int', 'luk'].map((key) => (
          <div key={key} className="stat-grid__row">
            <span className="stat-grid__label">{STAT_LABELS[key]}</span>
            <span>{stats[key]}</span>
          </div>
        ))}
        {STAT_ROWS.map(([key, label]) => (
          <div key={key} className="stat-grid__row">
            <span className="stat-grid__label">{label}</span>
            <span>{stats[key]}</span>
          </div>
        ))}
      </div>

      <div className="window__title" style={{ marginTop: 'var(--space-3)' }}>
        Equipment
      </div>
      <div className="stat-grid">
        {EQUIP_SLOTS.map((slot) => (
          <div key={slot} className="stat-grid__row">
            <span className="stat-grid__label">{SLOT_LABELS[slot]}</span>
            <span>{equippedIn(character, slot)?.name ?? '-'}</span>
          </div>
        ))}
      </div>
    </Window>
  )
}

function EquipPreview({ character, slot, itemId }) {
  const current = deriveStats(character)
  const swapped = deriveStats({
    ...character,
    equipment: { ...character.equipment, [slot]: itemId },
  })

  const item = itemId ? getItem(itemId) : null

  return (
    <Window title={item ? item.name : 'Remove'}>
      {item?.description ? <p className="class-blurb">{item.description}</p> : null}
      <div className="stat-grid">
        {['attack', 'defense', 'magicDefense', 'evasion', 'maxHp', 'maxMp'].map((key) => {
          const delta = swapped[key] - current[key]
          return (
            <div key={key} className="stat-grid__row">
              <span className="stat-grid__label">{key}</span>
              <span>
                {swapped[key]}
                {delta !== 0 ? (
                  <span
                    className={`stat-grid__delta ${delta < 0 ? 'stat-grid__delta--down' : ''}`}
                  >
                    {' '}
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
    </Window>
  )
}

export function PartyMenuScreen() {
  const { state, dispatch } = useGame()
  const [stack, setStack] = useState([{ panel: 'root' }])
  const [cursor, setCursor] = useState(0)

  const frame = stack[stack.length - 1]
  const push = (next) => {
    setStack((current) => [...current, next])
    setCursor(0)
  }
  const pop = () => {
    setStack((current) => (current.length > 1 ? current.slice(0, -1) : current))
    setCursor(0)
  }

  const partyItems = (filter) =>
    state.party.map((member, index) => ({
      key: member.id,
      label: <PartyRow character={member} />,
      disabled: filter ? !filter(member, index) : false,
      index,
    }))

  // ------------------------------------------------------------- panels --

  function renderRoot() {
    const items = [
      { key: 'item', label: 'Item', detail: `${state.inventory.length}` },
      { key: 'magic', label: 'Magic' },
      { key: 'equip', label: 'Equip' },
      { key: 'status', label: 'Status' },
      { key: 'close', label: 'Close' },
      { key: 'quit', label: 'Quit to Title' },
    ]

    return {
      title: 'Menu',
      menu: (
        <MenuList
          items={items}
          index={cursor}
          onIndexChange={setCursor}
          ariaLabel="Main menu"
          onSelect={(item) => {
            if (item.key === 'quit') dispatch({ type: 'returnToTitle' })
            else if (item.key === 'close')
              dispatch({ type: 'setMode', mode: MODE_FOR_LOCATION[state.location?.type] ?? MODES.WORLD })
            else push({ panel: item.key })
          }}
        />
      ),
      detail: (
        <Window title="Party">
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {state.party.map((member) => (
              <PartyRow key={member.id} character={member} />
            ))}
          </div>
          <p className="menu-screen__gold" style={{ marginBottom: 0 }}>
            {state.gold} G
          </p>
        </Window>
      ),
    }
  }

  function renderItem() {
    const usable = describeInventory(state.inventory, (item) => item.inField !== false)
    const items = usable.map((entry) => ({
      key: entry.id,
      label: entry.item.name,
      detail: `x${entry.qty}`,
    }))

    return {
      title: 'Items',
      menu: (
        <MenuList
          items={items}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          emptyLabel="No usable items."
          ariaLabel="Item list"
          onSelect={(item) => {
            const definition = getItem(item.key)
            if (definition.effect?.target === 'allAllies') {
              dispatch({ type: 'useItem', itemId: item.key })
            } else {
              push({ panel: 'itemTarget', itemId: item.key })
            }
          }}
        />
      ),
      detail: (
        <Window title="Bag">
          <p className="class-blurb">
            {getItem(items[Math.min(cursor, items.length - 1)]?.key ?? 'potion')?.description ??
              'Select an item to use it.'}
          </p>
          <p className="menu-screen__gold" style={{ marginBottom: 0 }}>
            {state.gold} G
          </p>
        </Window>
      ),
    }
  }

  function renderItemTarget() {
    const definition = getItem(frame.itemId)
    return {
      title: `Use ${definition.name}`,
      menu: (
        <MenuList
          items={partyItems((member) => itemWouldHelp(frame.itemId, member))}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          ariaLabel="Choose a target"
          onSelect={(item) => {
            dispatch({ type: 'useItem', itemId: frame.itemId, targetIndex: item.index })
            pop()
          }}
        />
      ),
      detail: (
        <Window title={definition.name}>
          <p className="class-blurb">{definition.description ?? 'Choose who receives it.'}</p>
        </Window>
      ),
    }
  }

  function renderCharacterPicker(nextPanel, title, filter) {
    return {
      title,
      menu: (
        <MenuList
          items={partyItems(filter)}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          ariaLabel="Choose a character"
          onSelect={(item) => push({ panel: nextPanel, characterIndex: item.index })}
        />
      ),
      detail: (
        <Window title="Party">
          <p className="class-blurb">{title}</p>
        </Window>
      ),
    }
  }

  function renderMagicSpell() {
    const caster = state.party[frame.characterIndex]
    const spells = caster.spells.map(getSpell).filter(isFieldSpell)
    const items = spells.map((spell) => ({
      key: spell.id,
      label: spell.name,
      detail: `${spell.mp} MP`,
      disabled: caster.mp < spell.mp,
    }))

    return {
      title: `${caster.name}'s magic`,
      menu: (
        <MenuList
          items={items}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          emptyLabel="No spells to cast out here."
          ariaLabel="Spell list"
          onSelect={(item) => {
            const spell = getSpell(item.key)
            if (spell.target === 'allAllies') {
              dispatch({
                type: 'castFieldSpell',
                casterIndex: frame.characterIndex,
                spellId: spell.id,
              })
            } else {
              push({
                panel: 'magicTarget',
                characterIndex: frame.characterIndex,
                spellId: spell.id,
              })
            }
          }}
        />
      ),
      detail: (
        <Window title="Magic">
          <p className="class-blurb">
            {spells[Math.min(cursor, spells.length - 1)]?.description ??
              'Only restorative magic works outside battle.'}
          </p>
          <p className="u-dim" style={{ marginBottom: 0 }}>
            MP {caster.mp}/{deriveStats(caster).maxMp}
          </p>
        </Window>
      ),
    }
  }

  function renderMagicTarget() {
    const spell = getSpell(frame.spellId)
    const wantsDead = spell.kind === 'revive'

    return {
      title: `Cast ${spell.name}`,
      menu: (
        <MenuList
          items={partyItems((member) => (wantsDead ? isKO(member) : !isKO(member)))}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          ariaLabel="Choose a target"
          onSelect={(item) => {
            dispatch({
              type: 'castFieldSpell',
              casterIndex: frame.characterIndex,
              spellId: frame.spellId,
              targetIndex: item.index,
            })
            pop()
          }}
        />
      ),
      detail: (
        <Window title={spell.name}>
          <p className="class-blurb">{spell.description ?? `Costs ${spell.mp} MP.`}</p>
        </Window>
      ),
    }
  }

  function renderEquipSlot() {
    const character = state.party[frame.characterIndex]
    const items = EQUIP_SLOTS.map((slot) => ({
      key: slot,
      label: SLOT_LABELS[slot],
      detail: equippedIn(character, slot)?.name ?? '-',
    }))

    return {
      title: `${character.name}'s equipment`,
      menu: (
        <MenuList
          items={items}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          ariaLabel="Equipment slots"
          onSelect={(item) =>
            push({
              panel: 'equipChoose',
              characterIndex: frame.characterIndex,
              slot: item.key,
            })
          }
        />
      ),
      detail: <StatusSheet character={character} />,
    }
  }

  function renderEquipChoose() {
    const character = state.party[frame.characterIndex]
    const available = equippableFor(character, state.inventory, frame.slot)
    const items = [
      ...available.map((entry) => ({
        key: entry.id,
        label: entry.item.name,
        detail: `x${entry.qty}`,
      })),
      ...(character.equipment[frame.slot]
        ? [{ key: '__remove', label: 'Remove', detail: '' }]
        : []),
    ]

    const highlighted = items[Math.min(cursor, items.length - 1)]

    return {
      title: `${SLOT_LABELS[frame.slot]}`,
      menu: (
        <MenuList
          items={items}
          index={cursor}
          onIndexChange={setCursor}
          onCancel={pop}
          emptyLabel="Nothing here fits."
          ariaLabel="Equipment choices"
          onSelect={(item) => {
            if (item.key === '__remove') {
              dispatch({
                type: 'unequip',
                characterIndex: frame.characterIndex,
                slot: frame.slot,
              })
            } else {
              dispatch({
                type: 'equip',
                characterIndex: frame.characterIndex,
                itemId: item.key,
              })
            }
            pop()
          }}
        />
      ),
      detail: highlighted ? (
        <EquipPreview
          character={character}
          slot={frame.slot}
          itemId={highlighted.key === '__remove' ? null : highlighted.key}
        />
      ) : (
        <StatusSheet character={character} />
      ),
    }
  }

  function renderStatusSheet() {
    const character = state.party[frame.characterIndex]
    return {
      title: character.name,
      menu: (
        <MenuList
          items={[{ key: 'back', label: 'Back' }]}
          onCancel={pop}
          onSelect={pop}
          ariaLabel="Status"
        />
      ),
      detail: <StatusSheet character={character} />,
    }
  }

  const view = (() => {
    switch (frame.panel) {
      case 'item':
        return renderItem()
      case 'itemTarget':
        return renderItemTarget()
      case 'magic':
        return renderCharacterPicker(
          'magicSpell',
          'Who casts?',
          (member) => !isKO(member) && member.spells.some((id) => isFieldSpell(getSpell(id))),
        )
      case 'magicSpell':
        return renderMagicSpell()
      case 'magicTarget':
        return renderMagicTarget()
      case 'equip':
        return renderCharacterPicker('equipSlot', 'Equip whom?')
      case 'equipSlot':
        return renderEquipSlot()
      case 'equipChoose':
        return renderEquipChoose()
      case 'status':
        return renderCharacterPicker('statusSheet', 'View whom?')
      case 'statusSheet':
        return renderStatusSheet()
      default:
        return renderRoot()
    }
  })()

  return (
    <div className="screen">
      <div className="creation__header">
        <h1 className="creation__title">{view.title}</h1>
        <span className="menu-screen__gold">{state.gold} G</span>
      </div>

      <div className="panes panes--wide-detail">
        <div className="pane u-scroll">
          <Window>{view.menu}</Window>
        </div>
        <div className="pane u-scroll">{view.detail}</div>
      </div>

      <VirtualDPad />
    </div>
  )
}

export default PartyMenuScreen
