import { useEffect, useRef, useState } from 'react'
import { useInput } from '../input/InputContext.jsx'
import Window from './Window.jsx'

/**
 * Dialogue box with the classic typewriter reveal.
 *
 * Confirm once to skip to the end of the current page, again to advance.
 * `pages` is an array of strings; `onDone` fires after the last one.
 */
export function TextBox({
  pages,
  onDone,
  enabled = true,
  speaker,
  charsPerTick = 2,
  tickMs = 22,
}) {
  const [page, setPage] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  // Restart the reveal whenever the script itself changes.
  useEffect(() => {
    setPage(0)
    setRevealed(0)
  }, [pages])

  const text = pages[page] ?? ''
  const complete = revealed >= text.length

  useEffect(() => {
    if (complete) return undefined
    const timer = setInterval(() => {
      setRevealed((current) => Math.min(text.length, current + charsPerTick))
    }, tickMs)
    return () => clearInterval(timer)
  }, [complete, text.length, charsPerTick, tickMs])

  useInput((action) => {
    if (action !== 'confirm' && action !== 'cancel') return
    if (!complete) {
      setRevealed(text.length)
      return
    }
    if (page < pages.length - 1) {
      setPage(page + 1)
      setRevealed(0)
    } else {
      onDoneRef.current?.()
    }
  }, enabled)

  return (
    <Window title={speaker} className="textbox">
      <p style={{ margin: 0 }}>{text.slice(0, revealed)}</p>
      {complete && enabled ? (
        <span className="textbox__more" aria-hidden="true">
          {page < pages.length - 1 ? '▼' : '■'}
        </span>
      ) : null}
    </Window>
  )
}

export default TextBox
