import './style.css'
import { K17_C, degreeLabel, type Tine } from './config/tunings'
import { MicError, MicInput } from './audio/mic'
import { NoteDetector, type FrameInfo, type NoteEvent } from './detect/detector'
import { DebugPanel } from './ui/debugPanel'
import { TineStrip } from './ui/tineStrip'
import { DEGREE_COLORS } from './theme'

const tuning = K17_C
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const mic = new MicInput()
const frame = new Float32Array(mic.frameSize)
let detector: NoteDetector | null = null
let running = false
let lastInfo: FrameInfo | null = null

const strip = new TineStrip($('strip'), tuning)
const debug = new DebugPanel($('debug'), tuning)

// ---- Notes ------------------------------------------------------------------
let count = 0
const recent: NoteEvent[] = []

function onNote(n: NoteEvent) {
  count++
  recent.push(n)
  if (recent.length > 40) recent.shift()
  debug.note(n)
  strip.flash(n.tine)

  const big = $('big')
  big.textContent = degreeLabel(n.tine)
  big.style.color = DEGREE_COLORS[n.tine.degree]
  big.classList.remove('pop')
  void big.offsetWidth
  big.classList.add('pop')
  $('note-name').textContent = `${n.tine.note} · לשונית ${n.tine.pos}`
  const cents = $('cents')
  if (n.cents === null) {
    cents.textContent = ''
  } else {
    const c = Math.round(n.cents)
    cents.textContent = `${c > 0 ? '+' : ''}${c}¢`
    cents.dataset.state = Math.abs(c) <= 10 ? 'ok' : 'off'
  }
  $('count').textContent = String(count)

  const chip = document.createElement('span')
  chip.className = 'chip'
  chip.textContent = degreeLabel(n.tine)
  chip.style.setProperty('--c', DEGREE_COLORS[n.tine.degree])
  const row = $('recent')
  row.appendChild(chip)
  while (row.children.length > 24) row.firstChild!.remove()

  check.onNote(n.tine)
}

$('reset').addEventListener('click', () => {
  count = 0
  recent.length = 0
  $('count').textContent = '0'
  $('recent').innerHTML = ''
})

// ---- 17-tine check: the Phase 1 acceptance test ------------------------------
const check = (() => {
  const order = [...tuning.tines].sort((a, b) => a.pos - b.pos)
  let idx = -1
  let right = 0
  const errors: string[] = []

  function target(): Tine | null {
    return idx >= 0 && idx < order.length ? order[idx] : null
  }

  function show() {
    const t = target()
    $('check-actions').hidden = !t
    $('check-btn').hidden = !!t
    if (t) {
      strip.mark(t, 'target')
      $('check-msg').innerHTML = `נגן את הלשונית המסומנת: <b style="color:${DEGREE_COLORS[t.degree]}">${degreeLabel(t)} (${t.note})</b> · ${idx + 1}/${order.length}`
    }
    $('check-errors').innerHTML = errors.map((e) => `<li>${e}</li>`).join('')
  }

  function advance(ok: boolean, heard: Tine | null) {
    const t = target()!
    strip.mark(t, ok ? 'ok' : 'bad')
    if (ok) right++
    else errors.push(`לשונית ${t.pos} (${t.note}): ${heard ? `זוהה ${heard.note}` : 'לא זוהה'}`)
    idx++
    if (idx >= order.length) {
      const pct = Math.round((right / order.length) * 100)
      $('check-msg').innerHTML = `<b>${right}/${order.length} זוהו נכון (${pct}%)</b> ${pct >= 95 ? '🎉' : '· שלח לי את הדוח מתוך מצב דיבאג'}`
      $('check-btn').textContent = 'בדיקה חוזרת'
      idx = -1
    }
    show()
  }

  $('check-btn').addEventListener('click', () => {
    strip.clearMarks()
    idx = 0
    right = 0
    errors.length = 0
    show()
  })
  $('check-skip').addEventListener('click', () => target() && advance(false, null))
  $('check-stop').addEventListener('click', () => {
    idx = -1
    strip.clearMarks()
    $('check-msg').textContent = 'נגן כל לשונית פעם אחת, משמאל לימין, ובדוק שהיא מזוהה נכון.'
    $('check-btn').textContent = 'התחל בדיקה'
    show()
  })

  return {
    onNote(tine: Tine) {
      const t = target()
      if (t) advance(tine === t, tine)
    },
    summary() {
      return idx >= 0 ? `check in progress ${idx}/${order.length}` : `check ${right}/${order.length}; ${errors.join('; ') || 'no errors'}`
    },
  }
})()

// ---- Debug ------------------------------------------------------------------
$('debug-toggle').addEventListener('click', () => {
  $('debug').hidden = !$('debug').hidden
})

$('copy-report').addEventListener('click', async () => {
  if (!lastInfo) return
  const text = [
    'Kalimba Coach report',
    navigator.userAgent,
    debug.report(lastInfo, 0, mic.settings, mic.sampleRate),
    `notes (${count}): ${recent.map((n) => `${n.tine.note}${n.cents === null ? '' : `${n.cents >= 0 ? '+' : ''}${n.cents.toFixed(0)}`}`).join(' ')}`,
    check.summary(),
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    $('copy-report').textContent = '✓ הועתק'
  } catch {
    $('copy-report').textContent = 'ההעתקה נכשלה'
  }
  setTimeout(() => ($('copy-report').textContent = '📋 העתק דוח'), 2000)
})

// ---- Analysis loop ----------------------------------------------------------
let lastFrame = 0

function tick(now: number) {
  if (!running) return
  requestAnimationFrame(tick)
  if (!detector || !mic.read(frame)) return
  const { info, notes } = detector.process(frame, now)
  lastInfo = info
  for (const n of notes) onNote(n)
  debug.update(info, now, lastFrame ? now - lastFrame : 0, mic.settings, mic.sampleRate)
  lastFrame = now
}

// ---- Start / errors / background -------------------------------------------
function showError(err: unknown) {
  const kind = err instanceof MicError ? err.kind : 'other'
  const messages: Record<string, string> = {
    insecure: 'האתר חייב להיפתח בכתובת https:// כדי לגשת למיקרופון.',
    unsupported: 'הדפדפן הזה לא תומך בגישה למיקרופון. פתח את האתר ב-Safari.',
    denied: `הגישה למיקרופון נחסמה.<br><br>
      <b>איך לאשר באייפון:</b><br>
      1. בשורת הכתובת ב-Safari לחץ על <b>aA</b> (או על סמל ההגדרות).<br>
      2. בחר <b>הגדרות אתר</b> ← <b>מיקרופון</b> ← <b>אפשר</b>.<br>
      3. רענן את הדף ולחץ שוב על התחל.<br><br>
      אם זה לא עוזר: הגדרות ← אפליקציות ← Safari ← מיקרופון ← שאל / אפשר.`,
    'no-device': 'לא נמצא מיקרופון במכשיר.',
    other: `משהו השתבש בהפעלת המיקרופון.<br><code dir="ltr">${String(err)}</code>`,
  }
  $('error').innerHTML = messages[kind]
  $('error').hidden = false
}

async function start() {
  $('error').hidden = true
  try {
    await mic.start()
  } catch (e) {
    showError(e)
    return
  }
  if (!detector || detector.config.sampleRate !== mic.sampleRate) {
    detector = new NoteDetector({ sampleRate: mic.sampleRate, tines: tuning.tines })
  } else {
    detector.reset()
  }
  $('start-screen').hidden = true
  $('live').hidden = false
  $('resume').hidden = true
  if (!running) {
    running = true
    requestAnimationFrame(tick)
  }
}

$('start').addEventListener('click', start)
$('resume').addEventListener('click', start)

// iOS suspends audio and may kill the mic track in the background. On
// return, try to resume silently; if that is not enough, ask for a tap.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || $('live').hidden) return
  try {
    await mic.ctx?.resume()
  } catch {
    /* needs a gesture */
  }
  detector?.reset()
  if (!mic.isLive) $('resume').hidden = false
})
