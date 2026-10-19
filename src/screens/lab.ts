import { html, type Screen } from '../app/context'
import { degreeLabel, type Tine } from '../config/tunings'
import type { FrameInfo, NoteEvent } from '../detect/detector'
import { DEGREE_COLORS } from '../theme'
import { DebugPanel } from '../ui/debugPanel'
import { KalimbaView } from '../ui/kalimba'

/** Detection lab: the 17-tine check, a note counter and the debug panel. */
export const lab: Screen = (root, app) => {
  app.setTitle('בדיקת זיהוי')
  root.innerHTML = html`
    <div class="card">
      <div id="lab-kalimba"></div>
      <div class="count-row">
        <span>תווים שזוהו: <b id="lab-count">0</b></span>
        <button id="lab-reset" class="chip-btn">↺ אפס</button>
      </div>
      <div id="lab-recent" class="recent" dir="ltr"></div>
    </div>

    <div class="card">
      <div class="check-head">
        <div>
          <b>בדיקת 17 לשוניות</b>
          <p id="check-msg" class="hint">נגן כל לשונית פעם אחת, משמאל לימין, ובדוק שהיא מזוהה נכון.</p>
        </div>
        <button id="check-btn" class="chip-btn primary">התחל בדיקה</button>
      </div>
      <div id="check-actions" class="row" hidden>
        <button id="check-skip" class="chip-btn">לא זוהה · דלג</button>
        <button id="check-stop" class="chip-btn">עצור</button>
      </div>
      <ul id="check-errors" class="check-errors"></ul>
    </div>

    <div class="card debug" id="lab-debug">
      <div class="meter-label"><span>עוצמה <small>(קו = סף, נקודה = רעש רקע)</small></span></div>
      <div class="meter" dir="ltr"><div class="lvl-fill"></div><div class="lvl-gate"></div><div class="lvl-floor"></div></div>
      <div class="meter-label"><span>תדרים גבוהים <small>(מכת אצבע)</small></span><span class="onset-dot"></span></div>
      <div class="meter" dir="ltr"><div class="hf-fill"></div></div>
      <div class="meter-label"><span>ביטחון YIN</span></div>
      <div class="meter" dir="ltr"><div class="conf-fill"></div></div>
      <div class="meter-label"><span>עוצמה לכל לשונית</span></div>
      <div class="sal-bars"></div>
      <canvas class="trace" dir="ltr"></canvas>
      <pre dir="ltr"></pre>
      <button id="copy-report" class="chip-btn primary">📋 העתק דוח</button>
    </div>
  `
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
  const kalimba = new KalimbaView($('lab-kalimba'), app.tuning)
  const debug = new DebugPanel($('lab-debug'), app.tuning)
  let count = 0
  const recent: NoteEvent[] = []
  let lastInfo: FrameInfo | null = null

  // ---- 17-tine check: the Phase 1 acceptance test ----
  const order = [...app.tuning.tines].sort((a, b) => a.pos - b.pos)
  let idx = -1
  let right = 0
  const errors: string[] = []
  const target = (): Tine | null => (idx >= 0 && idx < order.length ? order[idx] : null)

  function showCheck() {
    const t = target()
    $('check-actions').hidden = !t
    $('check-btn').hidden = !!t
    if (t) {
      kalimba.mark(t, 'target')
      $('check-msg').innerHTML = `נגן את הלשונית המסומנת: <b style="color:${DEGREE_COLORS[t.degree]}">${degreeLabel(t)} (${t.note})</b> · ${idx + 1}/${order.length}`
    }
    $('check-errors').innerHTML = errors.map((e) => `<li>${e}</li>`).join('')
  }

  function advance(ok: boolean, heard: Tine | null) {
    const t = target()!
    kalimba.mark(t, ok ? 'ok' : 'bad')
    if (ok) right++
    else errors.push(`לשונית ${t.pos} (${t.note}): ${heard ? `זוהה ${heard.note}` : 'לא זוהה'}`)
    idx++
    if (idx >= order.length) {
      const pct = Math.round((right / order.length) * 100)
      $('check-msg').innerHTML = `<b>${right}/${order.length} זוהו נכון (${pct}%)</b> ${pct >= 95 ? '🎉' : '· שלח לי את הדוח (למטה)'}`
      $('check-btn').textContent = 'בדיקה חוזרת'
      idx = -1
    }
    showCheck()
  }

  $('check-btn').addEventListener('click', () => {
    kalimba.clearMarks()
    idx = 0
    right = 0
    errors.length = 0
    showCheck()
  })
  $('check-skip').addEventListener('click', () => target() && advance(false, null))
  $('check-stop').addEventListener('click', () => {
    idx = -1
    kalimba.clearMarks()
    $('check-msg').textContent = 'נגן כל לשונית פעם אחת, משמאל לימין, ובדוק שהיא מזוהה נכון.'
    $('check-btn').textContent = 'התחל בדיקה'
    showCheck()
  })

  // ---- Notes ----
  const offNote = app.engine.onNote((n) => {
    count++
    recent.push(n)
    if (recent.length > 40) recent.shift()
    debug.note(n)
    kalimba.flash(n.tine)
    $('lab-count').textContent = String(count)
    const chip = document.createElement('span')
    chip.className = 'chip'
    chip.textContent = degreeLabel(n.tine)
    chip.style.setProperty('--c', DEGREE_COLORS[n.tine.degree])
    $('lab-recent').appendChild(chip)
    while ($('lab-recent').children.length > 24) $('lab-recent').firstChild!.remove()
    if (target()) advance(n.tine === target(), n.tine)
  })
  const offFrame = app.engine.onFrame((info, now, frameMs) => {
    lastInfo = info
    debug.update(info, now, frameMs, app.engine.mic.settings, app.engine.mic.sampleRate)
  })

  $('lab-reset').addEventListener('click', () => {
    count = 0
    recent.length = 0
    $('lab-count').textContent = '0'
    $('lab-recent').innerHTML = ''
  })

  $('copy-report').addEventListener('click', async () => {
    const summary = idx >= 0 ? `check in progress ${idx}/${order.length}` : `check ${right}/${order.length}; ${errors.join('; ') || 'no errors'}`
    const text = [
      'Kalimba Coach report',
      navigator.userAgent,
      lastInfo ? debug.report(lastInfo, 0, app.engine.mic.settings, app.engine.mic.sampleRate) : 'no audio frames',
      `notes (${count}): ${recent.map((n) => `${n.tine.note}${n.cents === null ? '' : `${n.cents >= 0 ? '+' : ''}${n.cents.toFixed(0)}`}`).join(' ')}`,
      summary,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      $('copy-report').textContent = '✓ הועתק'
    } catch {
      $('copy-report').textContent = 'ההעתקה נכשלה'
    }
    setTimeout(() => ($('copy-report').textContent = '📋 העתק דוח'), 2000)
  })

  app.requireAudio()
  return () => {
    offNote()
    offFrame()
  }
}
