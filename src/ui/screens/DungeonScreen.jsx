import { useEffect, useRef } from 'react'
import { getClass } from '../../data/classes.js'
import { floorFor, getDungeon } from '../../data/maps/index.js'
import { MODES } from '../../engine/game.js'
import { deriveStats } from '../../engine/stats.js'
import { isKO } from '../../engine/character.js'
import { useGame } from '../GameProvider.jsx'
import { useInput, useInputApi } from '../input/InputContext.jsx'
import { renderFloor } from '../dungeon/renderFloor.js'
import Bar from '../components/Bar.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * The walkable dungeon.
 *
 * The engine owns discrete tile positions; this screen owns the animation
 * between them. Holding a direction steps at a fixed cadence, and the drawn
 * position glides toward the logical one, which is what makes grid movement
 * feel like walking rather than teleporting.
 */

const STEP_MS = 150
const GLIDE_MS = 130

export function DungeonScreen() {
  const { state, dispatch } = useGame()
  const input = useInputApi()
  const canvasRef = useRef(null)

  // The animation loop is set up once and reads everything through refs, so
  // it never restarts and never closes over a stale state.
  const stateRef = useRef(state)
  const dispatchRef = useRef(dispatch)
  const inputRef = useRef(input)
  const animRef = useRef({ x: state.location?.x ?? 0, y: state.location?.y ?? 0 })

  useEffect(() => {
    stateRef.current = state
    dispatchRef.current = dispatch
    inputRef.current = input
  })

  // A change of floor should not glide the party across the whole map.
  const floorId = state.location?.floorId
  useEffect(() => {
    animRef.current = { x: state.location?.x ?? 0, y: state.location?.y ?? 0 }
    // Only on a floor change; ordinary steps are meant to interpolate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    let frame = 0
    let last = performance.now()
    let cooldown = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { clientWidth, clientHeight } = canvas
      if (canvas.width !== clientWidth * dpr || canvas.height !== clientHeight * dpr) {
        canvas.width = Math.max(1, Math.floor(clientWidth * dpr))
        canvas.height = Math.max(1, Math.floor(clientHeight * dpr))
      }
      return dpr
    }

    function tick(now) {
      const delta = Math.min(64, now - last)
      last = now
      cooldown -= delta

      const current = stateRef.current
      const location = current.location

      if (current.mode === MODES.DUNGEON && location) {
        const direction = inputRef.current.heldDirection()
        if (direction && cooldown <= 0) {
          dispatchRef.current({ type: 'move', direction })
          cooldown = STEP_MS
        }

        // Ease the drawn position toward the logical one.
        const step = Math.min(1, delta / GLIDE_MS)
        const anim = animRef.current
        anim.x += (location.x - anim.x) * step
        anim.y += (location.y - anim.y) * step
        if (Math.abs(location.x - anim.x) < 0.01) anim.x = location.x
        if (Math.abs(location.y - anim.y) < 0.01) anim.y = location.y

        const dpr = resize()
        const floor = floorFor(location)
        const lead = current.party.find((member) => !isKO(member)) ?? current.party[0]

        ctx.save()
        ctx.scale(dpr, dpr)
        ctx.imageSmoothingEnabled = false
        renderFloor(ctx, {
          floor,
          focus: anim,
          facing: location.facing,
          flags: current.flags,
          palette: getDungeon(location.dungeonId).palette,
          partyColor: lead ? getClass(lead.classId).color : '#ffffff',
          width: canvas.width / dpr,
          height: canvas.height / dpr,
        })
        ctx.restore()
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Cancel opens the field menu, the way B does in every game this is copying.
  useInput((action) => {
    if (action === 'cancel' || action === 'menu') {
      dispatch({ type: 'setMode', mode: MODES.MENU })
    }
  })

  if (!state.location) return null

  const floor = floorFor(state.location)

  return (
    <div className="screen dungeon">
      <div className="dungeon__header">
        <span className="dungeon__floor">{floor.name}</span>
        <span className="u-dim dungeon__hint">B / Esc for menu</span>
      </div>

      <div className="dungeon__viewport">
        <canvas ref={canvasRef} className="dungeon__canvas" />
        {state.notice ? <div className="dungeon__notice">{state.notice}</div> : null}
      </div>

      <Window flush className="dungeon__party">
        {state.party.map((member) => {
          const stats = deriveStats(member)
          return (
            <span key={member.id} className="dungeon__member">
              <span className="dungeon__member-name">{member.name}</span>
              <Bar value={member.hp} max={stats.maxHp} kind="hp" />
              <span className="dungeon__member-hp">
                {member.hp}/{stats.maxHp}
              </span>
            </span>
          )
        })}
      </Window>

      <VirtualDPad forced />
    </div>
  )
}

export default DungeonScreen
