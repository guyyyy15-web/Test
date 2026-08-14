import { useState } from 'react'
import { WORLD_NODES, destinationsFrom, getNode, isUnlocked, visibleNodes } from '../../data/world.js'
import { MODES } from '../../engine/game.js'
import { useGame } from '../GameProvider.jsx'
import MenuList from '../components/MenuList.jsx'
import PartyRow from '../components/PartyRow.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * The world map: a schematic of places and the roads between them.
 *
 * Node positions are percentages, so the map scales to any screen without a
 * tileset, and a node only appears once the story flag that unlocks it is set.
 */

function MapDiagram({ nodes, currentId, highlightId, flags }) {
  const drawn = new Set()

  return (
    <div className="worldmap__diagram" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="worldmap__roads">
        {nodes.flatMap((node) =>
          node.links
            .filter((linkId) => {
              const key = [node.id, linkId].sort().join('-')
              if (drawn.has(key)) return false
              const target = WORLD_NODES[linkId]
              if (!target || !isUnlocked(target, flags)) return false
              drawn.add(key)
              return true
            })
            .map((linkId) => {
              const target = getNode(linkId)
              return (
                <line
                  key={`${node.id}-${linkId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  className="worldmap__road"
                />
              )
            }),
        )}
      </svg>

      {nodes.map((node) => (
        <span
          key={node.id}
          className={[
            'worldmap__node',
            `worldmap__node--${node.kind}`,
            node.id === currentId ? 'worldmap__node--current' : '',
            node.id === highlightId ? 'worldmap__node--target' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <span className="worldmap__dot" />
          <span className="worldmap__label">{node.name}</span>
        </span>
      ))}
    </div>
  )
}

export function WorldMapScreen() {
  const { state, dispatch } = useGame()
  const [cursor, setCursor] = useState(0)

  const currentId = state.location?.nodeId ?? 'emberfall'
  const current = getNode(currentId)
  const nodes = visibleNodes(state.flags)
  const destinations = destinationsFrom(currentId, state.flags)

  const items = [
    ...(current.kind === 'town'
      ? [{ key: current.id, label: `Enter ${current.name}`, detail: 'town' }]
      : []),
    ...destinations.map((node) => ({
      key: node.id,
      label: node.name,
      detail: node.kind === 'dungeon' ? `Lv ${node.recommended ?? '?'}` : 'town',
    })),
    { key: '__menu', label: 'Party', detail: `${state.gold} G` },
  ]

  const highlighted = items[Math.min(cursor, items.length - 1)]
  const highlightNode = highlighted && WORLD_NODES[highlighted.key] ? highlighted.key : null

  return (
    <div className="screen worldmap">
      <div className="creation__header">
        <h1 className="creation__title">{current.name}</h1>
        <span className="menu-screen__gold">{state.gold} G</span>
      </div>

      <MapDiagram
        nodes={nodes}
        currentId={currentId}
        highlightId={highlightNode}
        flags={state.flags}
      />

      <div className="panes">
        <div className="pane">
          <Window title="Travel to">
            <MenuList
              items={items}
              index={cursor}
              onIndexChange={setCursor}
              ariaLabel="Destinations"
              onSelect={(item) => {
                if (item.key === '__menu') dispatch({ type: 'setMode', mode: MODES.MENU })
                else dispatch({ type: 'travel', nodeId: item.key })
              }}
            />
          </Window>
        </div>
        <div className="pane u-scroll">
          <Window title="Party">
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

export default WorldMapScreen
