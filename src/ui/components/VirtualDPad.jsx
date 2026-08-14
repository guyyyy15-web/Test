import { useState } from 'react'
import { useInputApi } from '../input/InputContext.jsx'

/**
 * On-screen controls for touch devices.
 *
 * Pointer events (not touch events) so it also works with a mouse for
 * testing; pointer capture keeps a drag off the button from sticking a
 * direction down forever.
 */
function ControlButton({ action, className, label, glyph }) {
  const input = useInputApi()
  const [held, setHeld] = useState(false)

  function down(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setHeld(true)
    input.press(action)
  }

  function up(event) {
    event.preventDefault()
    setHeld(false)
    input.release(action)
  }

  return (
    <button
      type="button"
      className={`${className} ${held ? `${className}--held` : ''}`}
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  )
}

export function VirtualDPad({ forced = false, showRun = false }) {
  return (
    <div className={`touch-controls ${forced ? 'touch-controls--forced' : ''}`}>
      <div className="dpad">
        <ControlButton action="up" className="dpad__btn dpad__btn--up" label="Up" glyph="▲" />
        <ControlButton
          action="left"
          className="dpad__btn dpad__btn--left"
          label="Left"
          glyph="◀"
        />
        <ControlButton
          action="right"
          className="dpad__btn dpad__btn--right"
          label="Right"
          glyph="▶"
        />
        <ControlButton
          action="down"
          className="dpad__btn dpad__btn--down"
          label="Down"
          glyph="▼"
        />
      </div>

      <div className="action-buttons">
        {showRun ? (
          <ControlButton action="run" className="action-btn" label="Run" glyph="RUN" />
        ) : null}
        <ControlButton action="cancel" className="action-btn" label="Cancel" glyph="B" />
        <ControlButton action="confirm" className="action-btn" label="Confirm" glyph="A" />
      </div>
    </div>
  )
}

export default VirtualDPad
