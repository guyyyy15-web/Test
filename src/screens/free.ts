import { html, type Screen } from '../app/context'
import { degreeLabel, type Tine } from '../config/tunings'
import { DEGREE_COLORS } from '../theme'
import { KalimbaView } from '../ui/kalimba'

/** Play anything: the tine you hit lights up with its name. Tap a tine to hear it. */
export const free: Screen = (root, app) => {
  app.setTitle('נגינה חופשית')
  root.innerHTML = html`
    <div class="card readout">
      <div class="tine-big" id="fp-big">–</div>
      <div class="note-line"><span id="fp-name">נגן על הקלימבה, או הקש על לשונית</span></div>
    </div>
    <div class="card" id="fp-kalimba"></div>
    <div class="card">
      <div class="count-row">
        <span>תווים: <b id="fp-count">0</b></span>
        <button id="fp-clear" class="chip-btn">↺ נקה</button>
      </div>
      <div id="fp-recent" class="recent" dir="ltr"></div>
    </div>
    <p id="fp-status" class="hint center"></p>
  `
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
  let count = 0

  function show(t: Tine, source: 'mic' | 'tap') {
    kalimba.flash(t)
    const big = $('fp-big')
    big.textContent = degreeLabel(t)
    big.style.color = DEGREE_COLORS[t.degree]
    big.classList.remove('pop')
    void big.offsetWidth
    big.classList.add('pop')
    $('fp-name').textContent = `${t.note} · לשונית ${t.pos}${source === 'tap' ? ' · הקשה' : ''}`
    if (source === 'mic') {
      $('fp-count').textContent = String(++count)
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.textContent = degreeLabel(t)
      chip.style.setProperty('--c', DEGREE_COLORS[t.degree])
      $('fp-recent').appendChild(chip)
      while ($('fp-recent').children.length > 32) $('fp-recent').firstChild!.remove()
    }
  }

  const kalimba = new KalimbaView($('fp-kalimba'), app.tuning, {
    big: true,
    onTap: async (t) => {
      await app.requireAudio()
      app.engine.playGuide(t.midi)
      show(t, 'tap')
    },
  })

  $('fp-clear').addEventListener('click', () => {
    count = 0
    $('fp-count').textContent = '0'
    $('fp-recent').innerHTML = ''
  })

  const off = app.engine.onNote((n) => show(n.tine, 'mic'))
  app.requireAudio().then(() => {
    $('fp-status').textContent = app.engine.listening ? '🎤 מקשיב…' : '🔇 המיקרופון כבוי: אפשר רק להקיש על הלשוניות'
  })
  return () => {
    off()
  }
}
