import './style.css'
import type { App, Screen } from './app/context'
import { AudioEngine } from './audio/engine'
import type { MicError } from './audio/mic'
import { K17_C } from './config/tunings'
import { free } from './screens/free'
import { home } from './screens/home'
import { importSong } from './screens/importSong'
import { lab } from './screens/lab'
import { play } from './screens/play'
import { songs } from './screens/songs'
import { tuner } from './screens/tuner'

const tuning = K17_C
const engine = new AudioEngine(tuning)
const $ = (id: string) => document.getElementById(id)!

const routes: Record<string, Screen> = {
  '': home,
  free,
  lab,
  songs,
  play,
  import: importSong,
  tuner,
}

// ---- Audio gate: iOS only starts audio inside a tap ----
let gateWaiters: (() => void)[] = []

function requireAudio(): Promise<void> {
  if (engine.started) return Promise.resolve()
  $('gate').hidden = false
  return new Promise((resolve) => gateWaiters.push(resolve))
}

$('gate-btn').addEventListener('click', async () => {
  await engine.start()
  $('gate').hidden = true
  if (engine.micError) showMicError(engine.micError)
  const waiters = gateWaiters
  gateWaiters = []
  waiters.forEach((w) => w())
})

function showMicError(err: MicError) {
  const messages: Record<string, string> = {
    insecure: 'האתר חייב להיפתח בכתובת https:// כדי לגשת למיקרופון.',
    unsupported: 'הדפדפן הזה לא תומך בגישה למיקרופון. פתח את האתר ב-Safari.',
    denied: `הגישה למיקרופון נחסמה, אז אפשר רק להקיש על הלשוניות.<br><br>
      <b>איך לאשר באייפון:</b><br>
      1. בשורת הכתובת ב-Safari לחץ על <b>aA</b> (או על סמל ההגדרות).<br>
      2. בחר <b>הגדרות אתר</b> ← <b>מיקרופון</b> ← <b>אפשר</b>.<br>
      3. רענן את הדף.<br><br>
      אם זה לא עוזר: הגדרות ← אפליקציות ← Safari ← מיקרופון ← שאל / אפשר.`,
    'no-device': 'לא נמצא מיקרופון במכשיר.',
    other: `משהו השתבש בהפעלת המיקרופון.<br><code dir="ltr">${err.message}</code>`,
  }
  $('mic-error-text').innerHTML = messages[err.kind]
  $('mic-error').hidden = false
}
$('mic-error-ok').addEventListener('click', () => ($('mic-error').hidden = true))

// ---- Router ----
let cleanup: () => void = () => {}

const app: App = {
  engine,
  tuning,
  go: (route) => (location.hash = `#/${route}`),
  requireAudio,
  setTitle: (title) => ($('screen-title').textContent = title),
}

function render() {
  const [name = '', ...params] = location.hash.replace(/^#\/?/, '').split('/')
  const screen = routes[name] ?? home
  cleanup()
  const root = $('screen')
  root.innerHTML = ''
  root.className = `screen screen-${name || 'home'}`
  $('back').hidden = name === ''
  cleanup = screen(root, app, params)
  window.scrollTo(0, 0)
}

window.addEventListener('hashchange', render)
render()

// iOS suspends audio and may kill the mic in the background. On return,
// resume quietly; if that is not enough, ask for a tap again.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return
  if (await engine.wake()) {
    $('gate').hidden = false
    gateWaiters.push(() => {})
  }
})
