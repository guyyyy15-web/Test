import { useState } from 'react'
import { getItem } from '../../data/items.js'
import { getTown } from '../../data/towns/index.js'
import { MODES } from '../../engine/game.js'
import { describeInventory, sellPrice } from '../../engine/inventory.js'
import { useGame } from '../GameProvider.jsx'
import { writeSlot } from '../save/slots.js'
import MenuList from '../components/MenuList.jsx'
import PartyRow from '../components/PartyRow.jsx'
import SaveSlotList from '../components/SaveSlotList.jsx'
import TextBox from '../components/TextBox.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * A town: inn, shops, people to talk to, and the only place the game can be
 * saved. Menu-driven rather than walkable, which is the hybrid the game is
 * built around -- dungeons are where walking earns its keep.
 */

function ShopPanel({ shop, onClose }) {
  const { state, dispatch } = useGame()
  const [mode, setMode] = useState('buy')
  const [cursor, setCursor] = useState(0)

  const buyItems = shop.stock.map((itemId) => {
    const item = getItem(itemId)
    return {
      key: itemId,
      label: item.name,
      detail: `${item.price} G`,
      disabled: item.price > state.gold,
    }
  })

  const sellItems = describeInventory(state.inventory, (item) => item.kind !== 'key').map(
    (entry) => ({
      key: entry.id,
      label: entry.item.name,
      detail: `x${entry.qty} - ${sellPrice(entry.id)} G`,
    }),
  )

  const items = mode === 'buy' ? buyItems : sellItems
  const highlighted = items[Math.min(cursor, items.length - 1)]

  return (
    <div className="panes">
      <div className="pane u-scroll">
        <Window title={`${shop.name} - ${mode === 'buy' ? 'Buy' : 'Sell'}`}>
          <MenuList
            items={items}
            index={cursor}
            onIndexChange={setCursor}
            onCancel={onClose}
            emptyLabel={mode === 'buy' ? 'Sold out.' : 'Nothing to sell.'}
            ariaLabel="Shop stock"
            onSelect={(item) => {
              if (mode === 'buy') dispatch({ type: 'buyItem', itemId: item.key })
              else dispatch({ type: 'sellItem', itemId: item.key })
            }}
          />
        </Window>
      </div>

      <div className="pane u-scroll">
        <Window title={highlighted ? getItem(highlighted.key).name : shop.name}>
          <p className="class-blurb">
            {highlighted
              ? (getItem(highlighted.key).description ?? shop.greeting)
              : shop.greeting}
          </p>
          <p className="menu-screen__gold">{state.gold} G</p>
          <div className="u-row">
            <button
              type="button"
              className="button"
              onClick={() => {
                setMode(mode === 'buy' ? 'sell' : 'buy')
                setCursor(0)
              }}
            >
              {mode === 'buy' ? 'Sell instead' : 'Buy instead'}
            </button>
            <button type="button" className="button" onClick={onClose}>
              Leave shop
            </button>
          </div>
        </Window>
      </div>
    </div>
  )
}

export function TownScreen() {
  const { state, dispatch } = useGame()
  const town = getTown(state.location.townId)

  const [panel, setPanel] = useState('root')
  const [shopId, setShopId] = useState(null)
  const [npcId, setNpcId] = useState(null)
  const [cursor, setCursor] = useState(0)
  const [saveNotice, setSaveNotice] = useState(null)

  const npcs = town.npcs.filter((npc) => !npc.requires || state.flags[npc.requires])

  function rootPanel() {
    const items = [
      { key: 'inn', label: 'Inn', detail: `${town.inn.price} G`, disabled: state.gold < town.inn.price },
      ...town.shops.map((shop) => ({ key: `shop:${shop.id}`, label: shop.name })),
      ...(town.shrine && state.flags[town.shrine.requires]
        ? [
            {
              key: 'shrine',
              label: town.shrine.name,
              detail: state.flags[town.shrine.flag] ? 'quiet' : 'ready',
              disabled: Boolean(state.flags[town.shrine.flag]),
            },
          ]
        : []),
      { key: 'talk', label: 'Talk' },
      { key: 'save', label: 'Save' },
      { key: 'party', label: 'Party' },
      { key: 'leave', label: 'Leave town' },
    ]

    return (
      <MenuList
        items={items}
        index={cursor}
        onIndexChange={setCursor}
        ariaLabel="Town menu"
        onSelect={(item) => {
          if (item.key === 'inn') dispatch({ type: 'restAtInn' })
          else if (item.key === 'shrine') dispatch({ type: 'promoteParty' })
          else if (item.key.startsWith('shop:')) {
            setShopId(item.key.slice(5))
            setPanel('shop')
          } else if (item.key === 'talk') {
            setNpcId(npcs[0]?.id ?? null)
            setPanel('talk')
          } else if (item.key === 'save') {
            setSaveNotice(null)
            setPanel('save')
          } else if (item.key === 'party') dispatch({ type: 'setMode', mode: MODES.MENU })
          else if (item.key === 'leave') dispatch({ type: 'toWorldMap' })
        }}
      />
    )
  }

  if (panel === 'shop') {
    const shop = town.shops.find((entry) => entry.id === shopId)
    return (
      <div className="screen">
        <div className="creation__header">
          <h1 className="creation__title">{shop.name}</h1>
          <span className="menu-screen__gold">{state.gold} G</span>
        </div>
        <ShopPanel
          shop={shop}
          onClose={() => {
            setPanel('root')
            setCursor(0)
          }}
        />
        <VirtualDPad />
      </div>
    )
  }

  if (panel === 'talk') {
    const npc = npcs.find((entry) => entry.id === npcId) ?? npcs[0]
    return (
      <div className="screen">
        <div className="creation__header">
          <h1 className="creation__title">{town.name}</h1>
          <span className="menu-screen__gold">{state.gold} G</span>
        </div>

        <div className="panes">
          <div className="pane">
            <Window title="Who?">
              <MenuList
                items={npcs.map((entry) => ({ key: entry.id, label: entry.name }))}
                onIndexChange={(index) => setNpcId(npcs[index]?.id)}
                onCancel={() => setPanel('root')}
                onSelect={(item) => setNpcId(item.key)}
                emptyLabel="Nobody about."
                ariaLabel="People"
              />
            </Window>
          </div>
          <div className="pane u-scroll">
            {npc ? (
              <TextBox pages={npc.lines} speaker={npc.name} enabled={false} />
            ) : null}
            <button type="button" className="button" onClick={() => setPanel('root')}>
              Back
            </button>
          </div>
        </div>
        <VirtualDPad />
      </div>
    )
  }

  if (panel === 'save') {
    return (
      <div className="screen">
        <div className="creation__header">
          <h1 className="creation__title">Save</h1>
          <span className="menu-screen__gold">{state.gold} G</span>
        </div>

        <SaveSlotList
          action="save"
          notice={saveNotice}
          onPick={(slot) => {
            const result = writeSlot(slot, state)
            setSaveNotice(result.ok ? `Saved to slot ${slot}.` : result.reason)
          }}
          onCancel={() => setPanel('root')}
        />
        <VirtualDPad />
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="creation__header">
        <h1 className="creation__title">{town.name}</h1>
        <span className="menu-screen__gold">{state.gold} G</span>
      </div>

      <div className="panes">
        <div className="pane">
          <Window title="Town">{rootPanel()}</Window>
        </div>
        <div className="pane u-scroll">
          <Window title={state.notice ? 'The inn' : town.name}>
            <p className="class-blurb">{state.notice ?? town.blurb}</p>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {state.party.map((member) => (
                <PartyRow key={member.id} character={member} />
              ))}
            </div>
          </Window>
        </div>
      </div>

      <VirtualDPad />
    </div>
  )
}

export default TownScreen
