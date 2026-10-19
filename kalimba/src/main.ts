import './style.css'
import { K17_C, degreeLabel, midiToHz, type Tine } from './config/tunings'
import { MicError, MicInput } from './audio/mic'
import { createYin, rmsDb } from './detect/yin'
import { snapToTine } from './detect/snap'
import { DEGREE_COLORS } from './theme'

const tuning = K17_C
const FRAME = 2048
/** Below this level nothing counts as a note (room noise). */
const GATE_DB = -55
const MIN_CONFIDENCE = 0.8
const MIN_HZ = 220
const MAX_HZ = 1500

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const mic = new MicInput(FRAME)
const frame = new Float32Array(FRAME)
let yin: ReturnType<typeof createYin> | null = null
let running = false

// ---- Tine strip (physical left-to-right order, never mirrored) -------------
const tineEls = new Map<number, HTMLElement>()
const maxDist = Math.max(...tuning.tines.map((t) => Math.abs(t.pos - 9)))
for (const t of tuning.tines) {
  const el = document.createElement('div')
  el.className = 'tine'
  // Centre tine is the longest; length falls off toward the edges.
  const len = 100 - (Math.abs(t.pos - 9) / maxDist) * 45
  el.style.setProperty('--len', `${len}%`)
  el.style.setProperty('--c', DEGREE_COLORS[t.degree])
  el.innerHTML = `<b>${degreeLabel(t)}</b><i>${t.note.replace(/\d/, '')}</i>`
  $('tines').appendChild(el)
  tineEls.set(t.pos, el)
}

// ---- Pitch trace ------------------------------------------------------------
const trace = $<HTMLCanvasElement>('trace')
const tctx = trace.getContext('2d')!
const HISTORY = 180
const TRACE_LEFT = 42
const history: { hz: number | null; tine: Tine | null }[] = []

function yForHz(hz: number, h: number) {
  const lo = Math.log2(240)
  const hi = Math.log2(1400)
  return h - ((Math.log2(hz) - lo) / (hi - lo)) * h
}

function drawTrace() {
  const dpr = window.devicePixelRatio || 1
  const w = trace.clientWidth
  const h = trace.clientHeight
  if (trace.width !== w * dpr) {
    trace.width = w * dpr
    trace.height = h * dpr
  }
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  tctx.clearRect(0, 0, w, h)
  tctx.font = '9px system-ui'
  // Semitone neighbours (E/F, B/C) sit close together: stagger their labels.
  let prevY = Infinity
  let col = 0
  for (const t of [...tuning.tines].sort((a, b) => a.midi - b.midi)) {
    const y = yForHz(midiToHz(t.midi), h)
    col = prevY - y < 9 ? 1 - col : 0
    prevY = y
    tctx.strokeStyle = 'rgba(160,140,255,0.12)'
    tctx.beginPath()
    tctx.moveTo(TRACE_LEFT, y)
    tctx.lineTo(w, y)
    tctx.stroke()
    tctx.fillStyle = DEGREE_COLORS[t.degree]
    tctx.fillText(t.note, col * 20, y + 3)
  }
  history.forEach((p, i) => {
    if (!p.hz) return
    const x = TRACE_LEFT + (i / HISTORY) * (w - TRACE_LEFT)
    const y = yForHz(p.hz, h)
    tctx.fillStyle = p.tine ? DEGREE_COLORS[p.tine.degree] : '#888'
    tctx.shadowColor = tctx.fillStyle
    tctx.shadowBlur = p.tine ? 8 : 0
    tctx.beginPath()
    tctx.arc(x, y, 2.2, 0, Math.PI * 2)
    tctx.fill()
  })
  tctx.shadowBlur = 0
}

// ---- Analysis loop ----------------------------------------------------------
let lastShown = 0
let heldTine: Tine | null = null
let heldUntil = 0

function tick(now: number) {
  if (!running) return
  requestAnimationFrame(tick)
  if (!mic.read(frame) || !yin) return

  const db = rmsDb(frame)
  const gated = db < GATE_DB
  const est = gated ? { hz: null, confidence: 0 } : yin(frame)
  const confident = est.hz !== null && est.confidence >= MIN_CONFIDENCE
  const snapped = confident ? snapToTine(est.hz!, tuning.tines) : null

  history.push({ hz: confident ? est.hz : null, tine: snapped?.tine ?? null })
  if (history.length > HISTORY) history.shift()

  if (snapped) {
    heldTine = snapped.tine
    heldUntil = now + 400
  }

  // Meters every frame, text ~15×/s so it is readable.
  const levelPct = Math.max(0, Math.min(100, ((db + 80) / 80) * 100))
  $('meter-fill').style.width = `${levelPct}%`
  $('conf-fill').style.width = `${Math.round(est.confidence * 100)}%`
  for (const [pos, el] of tineEls) el.classList.toggle('lit', !!heldTine && now < heldUntil && heldTine.pos === pos)
  drawTrace()

  if (now - lastShown < 66) return
  lastShown = now
  $('db').textContent = Number.isFinite(db) ? `${db.toFixed(0)} dB` : '−∞'
  $('conf').textContent = `${Math.round(est.confidence * 100)}%`
  if (confident) {
    $('hz').textContent = est.hz!.toFixed(1)
    if (snapped) {
      $('tine-big').textContent = degreeLabel(snapped.tine)
      $('tine-big').style.color = DEGREE_COLORS[snapped.tine.degree]
      $('note-name').textContent = `${snapped.tine.note} · לשונית ${snapped.tine.pos}`
      const c = Math.round(snapped.cents)
      $('cents').textContent = `${c > 0 ? '+' : ''}${c}¢`
      $('cents').dataset.state = Math.abs(c) <= 10 ? 'ok' : 'off'
    } else {
      $('tine-big').textContent = '?'
      $('tine-big').style.color = ''
      $('note-name').textContent = 'לא תו של הקלימבה'
      $('cents').textContent = ''
    }
  }
  const s = mic.settings
  $('debug').textContent = [
    `sampleRate      ${mic.sampleRate}`,
    `context         ${mic.ctx?.state}`,
    `echoCancel      ${s?.echoCancellation}`,
    `noiseSuppress   ${s?.noiseSuppression}`,
    `autoGain        ${s?.autoGainControl}`,
    `level           ${db.toFixed(1)} dBFS (gate ${GATE_DB})`,
    `raw hz          ${est.hz?.toFixed(2) ?? '–'}`,
    `confidence      ${est.confidence.toFixed(3)}`,
    `nearest         ${snapped ? `${snapped.tine.note} ${snapped.cents.toFixed(1)}¢` : '–'}`,
  ].join('\n')
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
  yin = createYin(FRAME, { sampleRate: mic.sampleRate, minHz: MIN_HZ, maxHz: MAX_HZ, threshold: 0.15 })
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
  if (!mic.isLive) $('resume').hidden = false
})
