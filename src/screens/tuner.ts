import { html, type Screen } from '../app/context'
import { degreeLabel, midiToHz, type Tine } from '../config/tunings'
import { centsBetween } from '../detect/snap'
import { DEGREE_COLORS } from '../theme'
import { KalimbaView } from '../ui/kalimba'

/** Readings kept for the median, and how long a reading stays on screen. */
const SMOOTH = 9
const HOLD_MS = 1500
const IN_TUNE = 5

export const tuner: Screen = (root, app) => {
  app.setTitle('כיוון')
  root.innerHTML = html`
    <div class="card tuner">
      <div class="tuner-target"><span id="t-tine">–</span><small id="t-note">נגן לשונית אחת</small></div>
      <svg viewBox="-110 -105 220 120" class="gauge" dir="ltr" aria-hidden="true">
        <path d="M -100 0 A 100 100 0 0 1 100 0" class="g-arc" />
        <path d="${arc(-15, 15)}" class="g-near" />
        <path d="${arc(-IN_TUNE, IN_TUNE)}" class="g-ok" />
        ${[-50, -25, 0, 25, 50].map((c) => `<line ${tick(c)} class="g-tick" />`).join('')}
        <text x="-96" y="14" class="g-label">-50</text>
        <text x="96" y="14" class="g-label" text-anchor="end">+50</text>
        <line id="t-needle" x1="0" y1="0" x2="0" y2="-92" class="g-needle" />
        <circle r="6" class="g-hub" />
      </svg>
      <div id="t-cents" class="tuner-cents" dir="ltr">–</div>
      <div id="t-advice" class="tuner-advice">הקש על לשונית למטה כדי לבחור אותה, או פשוט נגן ואזהה לבד.</div>
      <div id="t-diagram" class="tuner-diagram"></div>
    </div>
    <div class="card">
      <div class="row space">
        <b>בחר לשונית</b>
        <button id="t-auto" class="chip-btn">🔍 זיהוי אוטומטי</button>
      </div>
      <div id="t-kalimba"></div>
    </div>
    <div class="card">
      <b>טיפים לכיוון</b>
      <ul class="tips">
        <li>הקשות קטנות מאוד בכל פעם (כלי קטן כמו מברג או הכלי שהגיע עם הקלימבה), ובדיקה אחרי כל הקשה.</li>
        <li><b>גבוה מדי (חד)</b>: הקש על הקצה העליון של הלשונית, ליד הגשר, כך שהיא זזה לכיוונך. החלק הרוטט מתארך והצליל יורד.</li>
        <li><b>נמוך מדי</b>: הקש על קצה הנגינה כדי לדחוף את הלשונית פנימה. החלק הרוטט מתקצר והצליל עולה.</li>
      </ul>
    </div>
    <div class="card">
      <div class="row space">
        <div><b>כיול הזיהוי</b><p class="hint" id="c-status"></p></div>
        <button id="c-start" class="chip-btn primary">התחל כיול</button>
      </div>
      <p class="hint">נגן כל לשונית פעם אחת והאפליקציה תלמד בדיוק איך הקלימבה שלך נשמעת. שימושי אם יש לשוניות שקצת לא מכוונות.</p>
      <div id="c-run" hidden>
        <p id="c-prompt" class="prompt"></p>
        <div class="row"><button id="c-skip" class="chip-btn">דלג</button><button id="c-cancel" class="chip-btn">ביטול</button></div>
      </div>
      <button id="c-clear" class="chip-btn" hidden>מחק כיול</button>
    </div>
  `
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
  const tines = [...app.tuning.tines].sort((a, b) => a.pos - b.pos)
  let locked: Tine | null = null
  const kalimba = new KalimbaView($('t-kalimba'), app.tuning, {
    onTap: (t) => {
      locked = t
      kalimba.clearMarks()
      kalimba.mark(t, 'target')
      app.engine.playGuide(t.midi)
      readings.length = 0
    },
  })
  $('t-auto').addEventListener('click', () => {
    locked = null
    kalimba.clearMarks()
  })

  // ---- Live reading ----
  const readings: { hz: number; t: number }[] = []
  let lastShown = 0

  function show(tine: Tine, cents: number) {
    $('t-tine').textContent = degreeLabel(tine)
    $('t-tine').style.color = DEGREE_COLORS[tine.degree]
    $('t-note').textContent = `${tine.note} · ${midiToHz(tine.midi).toFixed(1)} Hz`
    const clamped = Math.max(-50, Math.min(50, cents))
    $('t-needle').setAttribute('transform', `rotate(${clamped * 1.8})`)
    $('t-needle').classList.toggle('ok', Math.abs(cents) <= IN_TUNE)
    const c = Math.round(cents)
    $('t-cents').textContent = `${c > 0 ? '+' : ''}${c}¢`
    $('t-cents').className = `tuner-cents ${Math.abs(cents) <= IN_TUNE ? 'ok' : Math.abs(cents) <= 15 ? 'near' : 'far'}`
    let advice: string
    let diagram: 'sharp' | 'flat' | null = null
    if (Math.abs(cents) <= IN_TUNE) advice = '✓ מכוון! אפשר לעבור ללשונית הבאה.'
    else if (cents > 0) {
      advice = `<b>גבוה מדי ↑</b> הקש קלות על הקצה העליון, ליד הגשר, כדי למשוך את הלשונית אליך (מאריך → מוריד את הצליל).`
      diagram = 'sharp'
    } else {
      advice = `<b>נמוך מדי ↓</b> הקש קלות על קצה הנגינה כדי לדחוף את הלשונית פנימה (מקצר → מעלה את הצליל).`
      diagram = 'flat'
    }
    if (Math.abs(cents) > 50) advice += ' <small>(רחוק מאוד: אולי ניגנת לשונית אחרת?)</small>'
    $('t-advice').innerHTML = advice
    $('t-diagram').innerHTML = diagram ? tapDiagram(diagram, DEGREE_COLORS[tine.degree]) : ''
  }

  const offFrame = app.engine.onFrame((info, now) => {
    const hz = info.estimate.hz
    if (hz && info.estimate.confidence >= 0.9 && !calibrating) {
      const tine = locked ?? info.snapped?.tine
      if (tine && Math.abs(centsBetween(hz, midiToHz(tine.midi))) < 120) {
        if (readings.length && Math.abs(centsBetween(hz, readings[readings.length - 1].hz)) > 80) readings.length = 0
        readings.push({ hz, t: now })
        if (readings.length > SMOOTH) readings.shift()
        if (readings.length >= 3) {
          const med = median(readings.map((r) => r.hz))
          show(tine, centsBetween(med, midiToHz(tine.midi)))
          lastShown = now
        }
      }
    }
    if (calibrating) calibrateFrame(hz, info.estimate.confidence)
    root.querySelector('.tuner')!.classList.toggle('stale', now - lastShown > HOLD_MS)
  })

  // ---- Calibration: play each tine once, remember where it sits ----
  let calibrating = false
  let calIdx = 0
  let calReadings: number[] = []
  let calResult: Record<number, number> = {}

  function calStatus() {
    const n = Object.keys(app.engine.calibration).length
    $('c-status').textContent = n ? `מכויל: ${n} לשוניות` : 'לא מכויל'
    $('c-clear').hidden = !n
  }

  function calPrompt() {
    const t = tines[calIdx]
    kalimba.clearMarks()
    kalimba.mark(t, 'target')
    $('c-prompt').innerHTML = `נגן <b style="color:${DEGREE_COLORS[t.degree]}">${degreeLabel(t)} (${t.note})</b> והשאר אותה לצלצל · ${calIdx + 1}/${tines.length}`
  }

  function calNext() {
    calIdx++
    calReadings = []
    if (calIdx >= tines.length) {
      calibrating = false
      app.engine.setCalibration(calResult)
      $('c-run').hidden = true
      $('c-start').hidden = false
      kalimba.clearMarks()
      const worst = Object.entries(calResult).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]
      $('c-status').textContent = `✓ נשמר. ${worst ? `הכי רחוקה: לשונית ${worst[0]} (${worst[1] > 0 ? '+' : ''}${Math.round(worst[1])}¢)` : ''}`
      $('c-clear').hidden = false
      return
    }
    calPrompt()
  }

  function calibrateFrame(hz: number | null, confidence: number) {
    const t = tines[calIdx]
    if (!hz || confidence < 0.95) return
    const cents = centsBetween(hz, midiToHz(t.midi))
    if (Math.abs(cents) > 80) return
    calReadings.push(cents)
    if (calReadings.length >= 8) {
      calResult[t.pos] = Math.round(median(calReadings) * 10) / 10
      kalimba.mark(t, 'ok')
      calNext()
    }
  }

  $('c-start').addEventListener('click', async () => {
    await app.requireAudio()
    calibrating = true
    calIdx = 0
    calReadings = []
    calResult = {}
    $('c-run').hidden = false
    $('c-start').hidden = true
    calPrompt()
  })
  $('c-skip').addEventListener('click', calNext)
  $('c-cancel').addEventListener('click', () => {
    calibrating = false
    $('c-run').hidden = true
    $('c-start').hidden = false
    kalimba.clearMarks()
    calStatus()
  })
  $('c-clear').addEventListener('click', () => {
    app.engine.setCalibration({})
    calStatus()
  })

  calStatus()
  app.requireAudio()
  return () => offFrame()
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Arc on the gauge between two cent values (−50…+50 maps to −90°…+90°). */
function arc(from: number, to: number) {
  const p = (c: number) => {
    const a = ((c * 1.8 - 90) * Math.PI) / 180
    return `${(Math.cos(a) * 100).toFixed(2)} ${(Math.sin(a) * 100).toFixed(2)}`
  }
  return `M ${p(from)} A 100 100 0 0 1 ${p(to)}`
}

function tick(c: number) {
  const a = ((c * 1.8 - 90) * Math.PI) / 180
  return `x1="${(Math.cos(a) * 88).toFixed(2)}" y1="${(Math.sin(a) * 88).toFixed(2)}" x2="${(Math.cos(a) * 100).toFixed(2)}" y2="${(Math.sin(a) * 100).toFixed(2)}"`
}

/**
 * Side view of a tine over the bridge, with where to tap and which way it moves.
 * The player is at the bottom; the tine's playing tip points toward them.
 */
function tapDiagram(kind: 'sharp' | 'flat', color: string) {
  const sharp = kind === 'sharp'
  return html`
    <svg viewBox="0 0 200 200" class="diagram" aria-hidden="true">
      <text x="100" y="14" class="d-label" text-anchor="middle">${sharp ? 'גבוה מדי' : 'נמוך מדי'}</text>
      <rect x="40" y="58" width="120" height="8" rx="3" class="d-bridge" />
      <text x="40" y="52" class="d-small" text-anchor="middle">גשר</text>
      <rect x="86" y="28" width="28" height="150" rx="8" fill="${color}" opacity="0.85" />
      <text x="100" y="194" class="d-small" text-anchor="middle">אתה כאן</text>
      ${
        sharp
          ? `<circle cx="100" cy="40" r="11" class="d-tap" />
             <text x="100" y="43" class="d-tapt" text-anchor="middle">הקש</text>
             <path d="M 134 90 L 134 150" class="d-arrow" marker-end="url(#ah)" />
             <text x="168" y="124" class="d-small" text-anchor="middle">זז אליך</text>`
          : `<circle cx="100" cy="166" r="11" class="d-tap" />
             <text x="100" y="169" class="d-tapt" text-anchor="middle">הקש</text>
             <path d="M 134 150 L 134 90" class="d-arrow" marker-end="url(#ah)" />
             <text x="168" y="124" class="d-small" text-anchor="middle">נדחף פנימה</text>`
      }
      <defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="d-head" /></marker></defs>
    </svg>`
}
