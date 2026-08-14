import { createContext, useContext, useEffect, useMemo, useRef } from 'react'

/**
 * One abstract input stream for keyboard, touch and on-screen controls.
 *
 * Screens subscribe to actions ('up', 'confirm', ...) and never learn which
 * device produced them, so every screen works on phone and desktop unchanged.
 * Discrete presses are delivered as events; the dungeon also needs to know
 * what is currently *held*, so held state is tracked alongside.
 */

export const DIRECTIONS = ['up', 'down', 'left', 'right']

const KEY_ACTIONS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Enter: 'confirm',
  Space: 'confirm',
  KeyZ: 'confirm',
  Escape: 'cancel',
  KeyX: 'cancel',
  Backspace: 'cancel',
  Tab: 'menu',
  ShiftLeft: 'run',
  ShiftRight: 'run',
}

const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

const InputContext = createContext(null)

export function InputProvider({ children }) {
  const listenersRef = useRef(null)
  const heldRef = useRef(null)
  if (listenersRef.current === null) listenersRef.current = new Set()
  if (heldRef.current === null) heldRef.current = new Set()

  const api = useMemo(() => {
    const listeners = listenersRef.current
    const held = heldRef.current

    function emit(action, source = 'key') {
      // Copy first: a handler may unsubscribe or push a screen mid-dispatch.
      for (const listener of Array.from(listeners)) listener(action, source)
    }

    return {
      subscribe(listener) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      emit,
      /** Touch/virtual-button press: fires once and marks the action held. */
      press(action, source = 'touch') {
        if (!action) return
        held.add(action)
        emit(action, source)
      },
      release(action) {
        held.delete(action)
      },
      releaseAll() {
        held.clear()
      },
      isHeld(action) {
        return held.has(action)
      },
      /** Highest-priority held direction, or null. Used by grid movement. */
      heldDirection() {
        for (const direction of DIRECTIONS) {
          if (held.has(direction)) return direction
        }
        return null
      },
    }
  }, [])

  useEffect(() => {
    const held = heldRef.current

    function onKeyDown(event) {
      // Let the browser keyboard do its job inside name entry fields.
      if (TEXT_ENTRY_TAGS.has(event.target?.tagName)) return
      const action = KEY_ACTIONS[event.code]
      if (!action) return
      event.preventDefault()
      held.add(action)
      api.emit(action, event.repeat ? 'repeat' : 'key')
    }

    function onKeyUp(event) {
      const action = KEY_ACTIONS[event.code]
      if (action) held.delete(action)
    }

    function onBlur() {
      api.releaseAll()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [api])

  return <InputContext.Provider value={api}>{children}</InputContext.Provider>
}

export function useInputApi() {
  const api = useContext(InputContext)
  if (!api) throw new Error('useInputApi must be used inside an InputProvider')
  return api
}

/**
 * Run `handler(action, source)` for every input while `enabled`.
 * The handler is read through a ref, so it never needs to be memoized.
 */
export function useInput(handler, enabled = true) {
  const api = useInputApi()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return undefined
    return api.subscribe((action, source) => handlerRef.current?.(action, source))
  }, [api, enabled])
}
