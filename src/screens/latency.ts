import { html, type Screen } from '../app/context'
import { load, save } from '../app/storage'

const BPM = 90
const TAPS = 8
const COUNT_IN = 4

/**
 * Measure this phone's delay from pluck to detection: pluck along with
 * metronome clicks and take the median gap. Tempo mode subtracts it.
 */
export const latency: Screen = (root, app) => {
  app.setTitle('כיול תזמון')
  root.innerHTML = html`
    <div class="card center">
      <p>כשתלחץ "התחל" יהיו ${COUNT_IN} נקישות הכנה, ואחריהן ${TAPS} נקישות. <b>פרוט על לשונית כלשהי בדיוק יחד עם כל אחת מ-${TAPS} הנקישות.</b></p>
      <p class="hint">כך האפליקציה לומדת כמה זמן לוקח לטלפון שלך לשמוע את הקלימבה, ומצב הטמפו יוכל לשפוט מוקדם/מאוחר בדיוק.</p>
      <div id="lt-count" class="big-pct">–</div>
      <p id="lt-msg" class="hint">ערך נוכחי: ${load('latencyMs', 40)}ms</p>
      <div class="row center-row">
        <button id="lt-start" class="chip-btn primary big-action">▶ התחל</button>
        <button id="lt-back" class="chip-btn">חזרה</button>
      </div>
    </div>
  `
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
  let off: (() => void) | null = null
  let raf = 0

  $('lt-back').addEventListener('click', () => history.back())
  $('lt-start').addEventListener('click', async () => {
    await app.requireAudio()
    const { synth, mic } = app.engine
    const ctx = mic.ctx
    if (!synth || !ctx || !app.engine.listening) {
      $('lt-msg').textContent = 'צריך מיקרופון פעיל בשביל הכיול.'
      return
    }
    $('lt-start').hidden = true
    const beatMs = 60000 / BPM
    const start = performance.now() + 500
    const ticks: number[] = []
    for (let k = 0; k < COUNT_IN + TAPS; k++) {
      const at = start + k * beatMs
      synth.tick(ctx.currentTime + (at - performance.now()) / 1000, k % 4 === 0)
      if (k >= COUNT_IN) ticks.push(at)
    }
    const gaps: number[] = []
    off?.()
    off = app.engine.onNote((n) => {
      const nearest = ticks.reduce((a, b) => (Math.abs(b - n.time) < Math.abs(a - n.time) ? b : a))
      const gap = n.time - nearest
      if (Math.abs(gap) < beatMs / 2) gaps.push(gap)
    })
    const end = ticks[ticks.length - 1] + beatMs
    const loop = (now: number) => {
      const k = Math.floor((now - start) / beatMs)
      $('lt-count').textContent = now < start ? '…' : k < COUNT_IN ? String(COUNT_IN - k) : k < COUNT_IN + TAPS ? '🎵' : '✓'
      if (now < end) {
        raf = requestAnimationFrame(loop)
        return
      }
      off?.()
      off = null
      $('lt-start').hidden = false
      $('lt-start').textContent = '↺ שוב'
      if (gaps.length < TAPS / 2) {
        $('lt-msg').textContent = `נקלטו רק ${gaps.length} פריטות מתוך ${TAPS}. נסה שוב, ופרוט חזק יותר.`
        return
      }
      const sorted = [...gaps].sort((a, b) => a - b)
      const median = sorted[sorted.length >> 1]
      const ms = Math.round(Math.max(0, Math.min(250, median)))
      save('latencyMs', ms)
      $('lt-msg').textContent = `✓ נשמר: ${ms}ms (לפי ${gaps.length} פריטות).`
    }
    raf = requestAnimationFrame(loop)
  })

  return () => {
    off?.()
    cancelAnimationFrame(raf)
  }
}
