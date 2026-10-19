import { esc, html, type App, type Screen } from '../app/context'
import { load, save } from '../app/storage'
import { degreeLabel, type Tine } from '../config/tunings'
import { getHistory, recordPlay } from '../play/history'
import { TempoSession, type Timing } from '../play/tempoSession'
import { WaitSession, stars, type Summary } from '../play/waitSession'
import { DIFFICULTY_LABEL, songNotes, type SongNote } from '../songs/song'
import { deleteUserSong, findSong } from '../songs/store'
import { DEGREE_COLORS } from '../theme'
import { Highway } from '../ui/highway'
import { KalimbaView } from '../ui/kalimba'

type Mode = 'wait' | 'tempo'

/** Assumed delay from a real pluck to the detector's onset, ms (mic + analysis). */
const DEFAULT_LATENCY_MS = 40

export const play: Screen = (root, app, params) => {
  const song = findSong(decodeURIComponent(params[0] ?? ''))
  if (!song) {
    root.innerHTML = `<div class="card center"><p>השיר לא נמצא.</p><a class="chip-btn" href="#/songs">לרשימת השירים</a></div>`
    return () => {}
  }
  app.setTitle(song.titleHe ?? song.title)
  let stop: () => void = () => {}
  const ctl = { setup, game: (mode: Mode) => (mode === 'wait' ? waitGame() : tempoGame()), stopWith: (fn: () => void) => (stop = fn) }
  setup()
  return () => stop()

  function setup() {
    stop()
    stop = () => {}
    const notes = songNotes(song!)
    const h = getHistory(song!.id)
    const pct = (v?: number) => (v === undefined ? '–' : `${Math.round(v * 100)}%`)
    const tempoPct = load('tempoPct', 80)
    app.engine.headphones = load('headphones', false)
    root.innerHTML = html`
      <div class="card song-head">
        <h2 dir="auto">${esc(song!.titleHe ?? song!.title)}</h2>
        <p class="hint" dir="auto">${esc(song!.titleHe ? song!.title : '')}${song!.artist ? ` · ${esc(song!.artist)}` : ''}</p>
        <div class="row">
          <span class="badge badge-${song!.difficulty}">${DIFFICULTY_LABEL[song!.difficulty]}</span>
          <span class="hint">${notes.length} תווים · ${song!.bpm} BPM</span>
        </div>
        ${h ? `<p class="hint">שיא: המתנה ${pct(h.best.wait)} · טמפו ${pct(h.best.tempo)} · ${h.plays} נגינות</p>` : ''}
        ${song!.builtIn ? '' : `<div class="row"><a class="chip-btn" href="#/import/${encodeURIComponent(song!.id)}">✎ עריכה</a><button id="s-del" class="chip-btn">🗑 מחיקה</button></div>`}
      </div>
      <button class="mode-btn" data-mode="wait"><span>⏸</span><b>מצב המתנה</b><small>השיר מחכה לך בכל תו. הכי טוב ללמידה.</small></button>
      <button class="mode-btn" data-mode="tempo"><span>▶</span><b>מצב טמפו</b><small>התווים זורמים בקצב, וכל תו מקבל ניקוד על דיוק ותזמון.</small></button>
      <div class="card settings">
        <label class="slider">
          <span>מהירות בטמפו: <b id="opt-bpm-label">${Math.round((song!.bpm * tempoPct) / 100)} BPM</b> <small>(${tempoPct}%)</small></span>
          <input type="range" id="opt-bpm" min="50" max="120" step="5" value="${tempoPct}" />
        </label>
        <label class="toggle"><input type="checkbox" id="opt-metro" ${load('metronome', true) ? 'checked' : ''} /> <span>🥁 מטרונום בטמפו</span></label>
        <label class="toggle"><input type="checkbox" id="opt-guide" ${load('autoGuide', false) ? 'checked' : ''} /> <span>🔊 השמע כל תו לפני שמנגנים (המתנה)</span></label>
        <label class="toggle"><input type="checkbox" id="opt-phones" ${app.engine.headphones ? 'checked' : ''} /> <span>🎧 אני עם אוזניות</span></label>
        <p class="hint">בלי אוזניות, המיקרופון לא מקשיב בזמן שצליל ההדרכה מתנגן, כדי לא לזהות אותו בטעות. עם אוזניות גם המטרונום לא מפריע לזיהוי.</p>
      </div>
    `
    const bind = (id: string, fn: (el: HTMLInputElement) => void) => root.querySelector<HTMLInputElement>(`#${id}`)!.addEventListener('input', (e) => fn(e.target as HTMLInputElement))
    bind('opt-bpm', (el) => {
      save('tempoPct', Number(el.value))
      root.querySelector('#opt-bpm-label')!.textContent = `${Math.round((song!.bpm * Number(el.value)) / 100)} BPM`
      el.parentElement!.querySelector('small')!.textContent = `(${el.value}%)`
    })
    bind('opt-metro', (el) => save('metronome', el.checked))
    bind('opt-guide', (el) => save('autoGuide', el.checked))
    bind('opt-phones', (el) => {
      app.engine.headphones = el.checked
      save('headphones', el.checked)
    })
    root.querySelector('#s-del')?.addEventListener('click', () => {
      if (!confirm(`למחוק את "${song!.title}"?`)) return
      deleteUserSong(song!.id)
      app.go('songs')
    })
    root.querySelectorAll<HTMLElement>('.mode-btn').forEach((b) =>
      b.addEventListener('click', async () => {
        await app.requireAudio()
        ctl.game(b.dataset.mode as Mode)
      }),
    )
  }

  // ---- Wait mode ----
  function waitGame() {
    stop()
    const notes = songNotes(song!)
    const session = new WaitSession(notes)
    const autoGuide = load('autoGuide', false)
    const g = buildStage(root, app, notes, (midi) => handle(midi), () => waitGame(), setup)
    const { highway, kalimba, $ } = g

    function markTargets() {
      g.markFrom(session.index)
      const cur = session.current
      if (cur) {
        const t = g.tineOf(cur.midi)
        $('g-prompt').innerHTML = `נגן <b style="color:${DEGREE_COLORS[t.degree]}">${degreeLabel(t)}</b> <small>(${t.note.replace(/\d/, '')})</small>`
        $('g-lyrics').textContent = song!.lyrics?.[cur.phrase] ?? ''
      }
      g.progress(session.index / notes.length)
    }

    function guideCurrent() {
      const cur = session.current
      if (cur) app.engine.playGuide(cur.midi)
    }

    function handle(midi: number) {
      const r = session.played(midi, performance.now())
      if (r.kind === 'ignored') return
      const tine = highway.tineFor(midi) as Tine | undefined
      if (r.kind === 'correct') {
        highway.results.set(r.index, 'ok')
        highway.current = session.index
        const combo = session.combo
        highway.burst(midi, r.firstTry && combo >= 5 ? `🔥${combo}` : '✓')
        if (tine) kalimba.flash(tine)
        $('g-combo').textContent = combo >= 3 ? `קומבו ${combo}` : ''
        if (r.done) {
          setTimeout(() => finish(session.summary()), 700)
          return
        }
        markTargets()
        if (autoGuide) setTimeout(guideCurrent, 250)
      } else {
        const expected = g.tineOf(r.expected)
        highway.wrong(midi, tine ? `✗ ${degreeLabel(tine)}` : '✗')
        if (tine) {
          kalimba.mark(tine, 'bad')
          setTimeout(markTargets, 500)
        }
        $('g-combo').textContent = ''
        $('g-prompt').innerHTML = `ניגנת <b class="bad-text">${tine ? degreeLabel(tine) : '?'}</b> · צריך <b style="color:${DEGREE_COLORS[expected.degree]}">${degreeLabel(expected)}</b>`
      }
    }

    const offNote = app.engine.onNote((n) => handle(n.tine.midi))
    let raf = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const target = session.current?.beat ?? notes[notes.length - 1].beat + 2
      highway.scrollBeat += (target - highway.scrollBeat) * 0.12
      highway.draw(now)
    }
    raf = requestAnimationFrame(frame)
    markTargets()
    if (autoGuide) setTimeout(guideCurrent, 400)
    $('g-guide').addEventListener('click', guideCurrent)

    stop = () => {
      cancelAnimationFrame(raf)
      offNote()
      g.dispose()
    }
    ctl.stopWith(stop)

    function finish(sum: Summary) {
      stop()
      summary(sum, 'wait', recordPlay(song!.id, 'wait', sum.accuracy))
    }
  }

  // ---- Tempo mode ----
  function tempoGame() {
    stop()
    const notes = songNotes(song!)
    const meter = song!.meter ?? 4
    const bpm = Math.round((song!.bpm * load('tempoPct', 80)) / 100)
    const beatMs = 60000 / bpm
    const latency = load('latencyMs', DEFAULT_LATENCY_MS)
    const metronome = load('metronome', true)
    const startTime = performance.now() + 400 + meter * beatMs // one bar of count-in
    const session = new TempoSession(notes, { bpm, startTime })
    const g = buildStage(root, app, notes, (midi) => handle(midi, performance.now()), () => tempoGame(), setup, meter)
    const { highway, kalimba, $ } = g
    $('g-guide').hidden = true
    let score = 0
    let nextTick = -meter // beat index of the next metronome tick (count-in first)
    let lastMarked = -1
    let started = false

    const LABEL: Record<Timing, [string, string]> = {
      perfect: ['מושלם!', '#5cf2a0'],
      early: ['מוקדם', '#4fd8ff'],
      late: ['מאוחר', '#ffb44f'],
    }

    function handle(midi: number, t: number) {
      if (t < startTime - session.windowMs) return
      const r = session.played(midi, t)
      const tine = highway.tineFor(midi)
      if (r.kind === 'hit') {
        highway.results.set(r.index, 'ok')
        const combo = session.combo
        score += (r.timing === 'perfect' ? 100 : 60) * (1 + Math.floor(combo / 10))
        const [text, color] = LABEL[r.timing]
        highway.burst(midi, combo >= 10 && r.timing === 'perfect' ? `🔥${combo}` : '')
        highway.popup(midi, text, color)
        if (tine) kalimba.flash(tine)
      } else {
        highway.wrong(midi, tine ? `✗ ${degreeLabel(tine)}` : '✗')
        if (tine) kalimba.mark(tine, 'bad')
        lastMarked = -1
      }
      hud()
    }

    function hud() {
      const combo = session.combo
      $('g-combo').textContent = combo >= 3 ? `קומבו ${combo}` : ''
      $('g-prompt').innerHTML = `ניקוד <b>${score}</b>`
    }

    const offNote = app.engine.onNote((n) => handle(n.tine.midi, n.time - latency))
    let raf = 0
    const ctx = app.engine.mic.ctx
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      // Metronome: schedule ticks slightly ahead on the audio clock.
      const endBeat = notes[notes.length - 1].beat + notes[notes.length - 1].beats
      while (nextTick <= endBeat && startTime + nextTick * beatMs - now < 120) {
        const at = startTime + nextTick * beatMs
        const isCountIn = nextTick < 0
        if ((metronome || isCountIn) && ctx && app.engine.synth && at >= now - 10) {
          app.engine.synth.tick(ctx.currentTime + Math.max(0, at - now) / 1000, ((nextTick % meter) + meter) % meter === 0)
        }
        nextTick++
      }
      if (now < startTime) {
        const left = Math.ceil((startTime - now) / beatMs)
        $('g-prompt').innerHTML = `<span class="countin">${left}</span>`
      } else if (!started) {
        started = true
        hud()
      }

      session.update(now)
      for (const i of session.newlyMissed) {
        highway.results.set(i, 'miss')
        highway.popup(notes[i].midi, 'החמצה', '#ff5c6c')
        hud()
      }
      if (session.nextIndex !== lastMarked) {
        lastMarked = session.nextIndex
        g.markFrom(session.nextIndex)
        g.progress(session.nextIndex / notes.length)
        const cur = notes[session.nextIndex]
        $('g-lyrics').textContent = cur ? song!.lyrics?.[cur.phrase] ?? '' : ''
      }
      highway.current = session.nextIndex
      highway.scrollBeat = session.beatAt(now)
      highway.draw(now)
      if (session.done(now)) finish()
    }
    raf = requestAnimationFrame(frame)

    stop = () => {
      cancelAnimationFrame(raf)
      offNote()
      g.dispose()
    }
    ctl.stopWith(stop)

    function finish() {
      stop()
      const sum = session.summary()
      const t = session.timingCounts()
      const extra = `<p class="hint">מושלם ${t.perfect} · מוקדם ${t.early} · מאוחר ${t.late} · ${bpm} BPM</p>`
      summary(sum, 'tempo', recordPlay(song!.id, 'tempo', sum.accuracy), extra)
    }
  }

  function summary(sum: Summary, mode: Mode, isBest: boolean, extra = '') {
    const st = stars(sum.accuracy)
    const secs = Math.round(sum.durationMs / 1000)
    const tricky = sum.tricky
      .map(({ midi, mistakes }) => {
        const t = app.tuning.tines.find((x) => x.midi === midi)!
        return `<span class="chip" style="--c:${DEGREE_COLORS[t.degree]}">${degreeLabel(t)} · ${mistakes}✗</span>`
      })
      .join(' ')
    root.innerHTML = html`
      <div class="card center summary">
        <div class="big-stars">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></div>
        ${isBest && sum.accuracy > 0 ? '<div class="new-best">🏆 שיא חדש!</div>' : ''}
        <div class="big-pct">${Math.round(sum.accuracy * 100)}%</div>
        <p class="hint">${mode === 'wait' ? 'דיוק (תווים שנוגנו נכון בניסיון הראשון)' : 'דיוק (תווים שנוגנו נכון ובזמן)'}</p>
        <div class="stats">
          <div><b>${sum.clean}/${sum.total}</b><small>${mode === 'wait' ? 'נכון מיד' : 'נקי'}</small></div>
          <div><b>${sum.mistakes}</b><small>טעויות</small></div>
          <div><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b><small>זמן</small></div>
          ${sum.avgOffsetMs !== undefined ? `<div><b dir="ltr">${sum.avgOffsetMs > 0 ? '+' : ''}${Math.round(sum.avgOffsetMs)}ms</b><small>${sum.avgOffsetMs > 0 ? 'נוטה לאחר' : 'נוטה להקדים'}</small></div>` : ''}
        </div>
        ${extra}
        ${tricky ? `<p class="hint">התווים הכי מאתגרים:</p><div class="row center-row">${tricky}</div>` : '<p>בלי טעויות בכלל! 🎉</p>'}
        <div class="row center-row">
          <button id="s-again" class="chip-btn primary">↺ שוב</button>
          <button id="s-setup" class="chip-btn">⚙ הגדרות</button>
          <a class="chip-btn" href="#/songs">לרשימת השירים</a>
        </div>
      </div>
      <canvas id="s-confetti" class="confetti"></canvas>
    `
    root.querySelector('#s-again')!.addEventListener('click', () => ctl.game(mode))
    root.querySelector('#s-setup')!.addEventListener('click', setup)
    if (st >= 2) confetti(root.querySelector<HTMLCanvasElement>('#s-confetti')!)
  }
}

/** The shared game layout: HUD, highway over a kalimba, lyrics and controls. */
function buildStage(root: HTMLElement, app: App, notes: SongNote[], onTap: (midi: number) => void, restart: () => void, exit: () => void, meter = 4) {
  root.innerHTML = html`
    <div class="game">
      <div class="hud">
        <div class="progress"><div id="g-prog"></div></div>
        <div class="hud-row">
          <span id="g-prompt" class="prompt"></span>
          <span id="g-combo" class="combo"></span>
        </div>
      </div>
      <div class="stage">
        <canvas id="g-highway" class="highway"></canvas>
        <div id="g-kalimba"></div>
      </div>
      <div id="g-lyrics" class="lyrics" dir="auto"></div>
      <div class="controls">
        <button id="g-guide" class="chip-btn">🔊 השמע</button>
        <button id="g-restart" class="chip-btn">↺ מההתחלה</button>
        <button id="g-exit" class="chip-btn">✕ יציאה</button>
      </div>
    </div>
  `
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
  const canvas = $('g-highway') as HTMLCanvasElement
  const highway = new Highway(canvas, app.tuning, notes, meter)
  const kalimba = new KalimbaView($('g-kalimba'), app.tuning, {
    onTap: (t) => {
      app.engine.playGuide(t.midi)
      onTap(t.midi)
    },
  })
  const tineOf = (midi: number) => highway.tineFor(midi)!

  function layout() {
    const base = canvas.getBoundingClientRect().left - kalimba.el.getBoundingClientRect().left
    const centres = new Map<number, number>()
    for (const [pos, x] of kalimba.laneCentres()) centres.set(pos, x - base)
    highway.setLanes(centres)
  }
  layout()
  window.addEventListener('resize', layout)
  $('g-restart').addEventListener('click', restart)
  $('g-exit').addEventListener('click', exit)

  return {
    $,
    highway,
    kalimba,
    tineOf,
    /** Mark the tine to play now and the next two. */
    markFrom(index: number) {
      kalimba.clearMarks()
      for (let k = 2; k >= 0; k--) {
        const n = notes[index + k]
        if (n) kalimba.mark(tineOf(n.midi), k === 0 ? 'target' : 'next')
      }
    },
    progress(fraction: number) {
      $('g-prog').style.width = `${fraction * 100}%`
    },
    dispose() {
      window.removeEventListener('resize', layout)
    },
  }
}

function confetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const w = (canvas.width = innerWidth)
  const h = (canvas.height = innerHeight)
  const colors = Object.values(DEGREE_COLORS)
  const bits = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.5,
    vy: 120 + Math.random() * 180,
    vx: -40 + Math.random() * 80,
    r: Math.random() * Math.PI,
    c: colors[Math.floor(Math.random() * colors.length)],
  }))
  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    ctx.clearRect(0, 0, w, h)
    let alive = false
    for (const b of bits) {
      b.y += b.vy * dt
      b.x += b.vx * dt
      b.r += dt * 6
      if (b.y < h + 20) alive = true
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.r)
      ctx.fillStyle = b.c
      ctx.fillRect(-4, -2, 8, 4)
      ctx.restore()
    }
    if (alive && canvas.isConnected) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
