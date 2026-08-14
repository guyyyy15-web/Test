import { useCallback, useEffect, useRef, useState } from 'react'
import { useInput } from '../input/InputContext.jsx'

/**
 * The workhorse of the whole UI: a cursor-driven list.
 *
 * Every JRPG menu -- commands, items, shops, targets -- is this component.
 * It is driven by the abstract input stream and is equally usable by tap,
 * so no screen has to care about the input device.
 *
 * Items: { key, label, detail, disabled }
 */
export function MenuList({
  items,
  onSelect,
  onCancel,
  enabled = true,
  columns = 1,
  wrap = true,
  index: controlledIndex,
  onIndexChange,
  emptyLabel = 'Nothing here.',
  className = '',
  ariaLabel,
}) {
  const [internalIndex, setInternalIndex] = useState(0)
  const isControlled = controlledIndex != null
  const rawIndex = isControlled ? controlledIndex : internalIndex
  const index = items.length === 0 ? 0 : Math.min(rawIndex, items.length - 1)

  const onIndexChangeRef = useRef(onIndexChange)
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange
  })

  const moveTo = useCallback(
    (next) => {
      if (items.length === 0) return
      if (!isControlled) setInternalIndex(next)
      onIndexChangeRef.current?.(next)
    },
    [isControlled, items.length],
  )

  // Clamp when the list shrinks under the cursor (e.g. the last potion is used).
  useEffect(() => {
    if (items.length > 0 && rawIndex > items.length - 1) moveTo(items.length - 1)
  }, [items.length, rawIndex, moveTo])

  const step = useCallback(
    (delta) => {
      if (items.length === 0) return
      const next = wrap
        ? (index + delta + items.length) % items.length
        : Math.max(0, Math.min(items.length - 1, index + delta))
      moveTo(next)
    },
    [index, items.length, moveTo, wrap],
  )

  const choose = useCallback(
    (target = index) => {
      const item = items[target]
      if (!item || item.disabled) return
      onSelect?.(item, target)
    },
    [index, items, onSelect],
  )

  useInput((action) => {
    switch (action) {
      case 'up':
        step(-columns)
        break
      case 'down':
        step(columns)
        break
      case 'left':
        if (columns > 1) step(-1)
        break
      case 'right':
        if (columns > 1) step(1)
        break
      case 'confirm':
        choose()
        break
      case 'cancel':
        onCancel?.()
        break
      default:
        break
    }
  }, enabled)

  if (items.length === 0) {
    return <p className={`menu__empty ${className}`}>{emptyLabel}</p>
  }

  return (
    <ul
      className={`menu ${className}`}
      style={columns > 1 ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
      aria-label={ariaLabel}
    >
      {items.map((item, itemIndex) => {
        const active = enabled && itemIndex === index
        return (
          <li key={item.key}>
            <button
              type="button"
              className={[
                'menu__item',
                active ? 'menu__item--active' : '',
                item.disabled ? 'menu__item--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={item.disabled}
              aria-current={active ? 'true' : undefined}
              onClick={() => {
                moveTo(itemIndex)
                choose(itemIndex)
              }}
            >
              <span
                className={`menu__cursor ${active ? '' : 'menu__cursor--hidden'}`}
                aria-hidden="true"
              >
                {'▶'}
              </span>
              <span className="menu__label">{item.label}</span>
              {item.detail != null ? (
                <span className="menu__detail">{item.detail}</span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default MenuList
