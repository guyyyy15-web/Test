import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { createTitleState, gameReducer } from '../engine/game.js'

/**
 * Holds the save-shaped game state and exposes `dispatch`.
 *
 * This is deliberately thin: all the logic lives in the pure reducer in
 * src/engine, so the game can be tested and simulated without React.
 */
const GameContext = createContext(null)

const PLAYTIME_TICK_MS = 10000

export function GameProvider({ initialState, children }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialState,
    (initial) => initial ?? createTitleState(),
  )

  // Playtime is wall-clock, so the UI measures it and feeds the engine deltas.
  const lastTickRef = useRef(0)
  const onTitle = state.mode === 'title'

  useEffect(() => {
    if (onTitle) return undefined
    lastTickRef.current = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const deltaMs = now - lastTickRef.current
      lastTickRef.current = now
      dispatch({ type: 'tickPlaytime', deltaMs })
    }, PLAYTIME_TICK_MS)
    return () => clearInterval(timer)
  }, [onTitle])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside a GameProvider')
  return context
}
