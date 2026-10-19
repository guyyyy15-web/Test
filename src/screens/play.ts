import { html, type Screen } from '../app/context'
import { load, save } from '../app/storage'
import { degreeLabel, type Tine } from '../config/tunings'
import { getHistory, recordPlay } from '../play/history'
import { WaitSession, stars, type Summary } from '../play/waitSession'
import { DIFFICULTY_LABEL, songNotes } from '../songs/song'
import { findSong } from '../songs/store'
import { DEGREE_COLORS } from '../theme'
import { Highway } from '../ui/highway'
import { KalimbaView } from '../ui/kalimba'

type Mode = 'wait' | 'tempo'

export const play: Screen = (root, app, params) => {
  const song = findSong(decodeURIComponent(params[0] ?? ''))
  if (!song) {
    root.innerHTML = `<div class="card center"><p>השיר לא נמצא.</p><a class="chip-btn" href="#/songs">לרשימת השירים</a></div>`
    return () => {}
  }
  app.setTitle(song.titleHe ?? song.title)
  let stop: () => void = () => {}
  setup()
  return () => stop()

  function setup() {
    stop()
    stop = () => {}
    const notes = songNotes(song!)
    const h = getHistory(song!.id)
    const pct = (v?: number) => (v === undefined ? '–' : `${Math.round(v * 100)}%`)
    app.engine.headphones = load('headphones', false)
    root.innerHTML = html`
      <div class="card song-head">
        <h2>${song!.titleHe ?? song!.title}</h2>
        <p class="hint" dir="auto">${song!.titleHe ? song!.title : ''}${song!.artist ? ` · ${song!.artist}` : ''}</p>
        <div class="row">
          <span class="badge badge-${song!.difficulty}">${DIFFICULTY_LABEL[song!.difficulty]}</span>
          <span class="hint">${notes.length} תווים · ${song!.bpm} BPM</span>
        </div>
        ${h ? `<p class="hint">שיא: המתנה ${pct(h.best.wait)} · טמפו ${pct(h.best.tempo)} · ${h.plays} נגינות</p>` : ''}
      </div>
      <button class="mode-btn" data-mode="wait"><span>⏸</span><b>מצב המתנה</b><small>השיר מחכה לך בכל תו. הכי טוב ללמידה.</small></button>
      <button class="mode-btn" data-mode="tempo" disabled><span>▶</span><b>מצב טמפו</b><small>בקרוב: התווים זורמים בקצב, עם ניקוד על תזמון.</small></button>
      <div class="card settings">
        <label class="toggle"><input type="checkbox" id="opt-guide" ${load('autoGuide', false) ? 'checked' : ''} /> <span>🔊 השמע כל תו לפני שמנגנים</span></label>
        <label class="toggle"><input type="checkbox" id="opt-phones" ${app.engine.headphones ? 'checked' : ''} /> <span>🎧 אני עם אוזניות</span></label>
        <p class="hint">בלי אוזניות, המיקרופון לא מקשיב בזמן שצליל ההדרכה מתנגן, כדי לא לזהות אותו בטעות.</p>
      </div>
    `
    root.querySelector('#opt-guide')!.addEventListener('change', (e) => save('autoGuide', (e.target as HTMLInputElement).checked))
    root.querySelector('#opt-phones')!.addEventListener('change', (e) => {
      app.engine.headphones = (e.target as HTMLInputElement).checked
      save('headphones', app.engine.headphones)
    })
    root.querySelectorAll<HTMLElement>('.mode-btn').forEach((b) =>
      b.addEventListener('click', async () => {
        await app.requireAudio()
        game(b.dataset.mode as Mode)
      }),
    )
  }

  function game(mode: Mode) {
    stop()
    const notes = songNotes(song!)
    const session = new WaitSession(notes)
    const autoGuide = load('autoGuide', false)
    root.innerHTML = html`
      <div class="game">
        <div class="hud">
          <div class="progress"><div id="g-prog"></div></div>
          <div class="hud-row">
            <span id="g-prompt" class="prompt"></span>
            <span id="g-combo" class="combo"></span>
          </div>
        </div>
        <div class="stage" id="g-stage">
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
    const highway = new Highway(canvas, app.tuning, notes)
    const kalimba = new KalimbaView($('g-kalimba'), app.tuning, {
      onTap: (t) => {
        app.engine.playGuide(t.midi)
        handle(t.midi)
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

    function markTargets() {
      kalimba.clearMarks()
      for (let k = 2; k >= 0; k--) {
        const n = notes[session.index + k]
        if (n) kalimba.mark(tineOf(n.midi), k === 0 ? 'target' : 'next')
      }
      const cur = session.current
      if (cur) {
        const t = tineOf(cur.midi)
        $('g-prompt').innerHTML = `נגן <b style="color:${DEGREE_COLORS[t.degree]}">${degreeLabel(t)}</b> <small>(${t.note.replace(/\d/, '')})</small>`
        const lyric = song!.lyrics?.[cur.phrase]
        $('g-lyrics').textContent = lyric ?? ''
      }
      $('g-prog').style.width = `${(session.index / notes.length) * 100}%`
    }

    function guideCurrent() {
      const cur = session.current
      if (cur) app.engine.playGuide(cur.midi)
    }

    function handle(midi: number) {
      const r = session.played(midi, performance.now())
      if (r.kind === 'ignored') return
      const tine = tineOf(midi) as Tine | undefined
      if (r.kind === 'correct') {
        highway.results.set(r.index, 'ok')
        highway.current = session.index
        const combo = session.combo
        highway.burst(midi, r.firstTry ? (combo >= 5 ? `🔥${combo}` : '✓') : '✓')
        if (tine) kalimba.flash(tine)
        $('g-combo').textContent = combo >= 3 ? `קומבו ${combo}` : ''
        if (r.done) {
          setTimeout(() => finish(session.summary()), 700)
          return
        }
        markTargets()
        if (autoGuide) setTimeout(guideCurrent, 250)
      } else {
        const expected = tineOf(r.expected)
        highway.wrong(midi, tine ? `✗ ${degreeLabel(tine)}` : '✗')
        if (tine) {
          kalimba.mark(tine, 'bad')
          setTimeout(() => markTargets(), 500)
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
    $('g-restart').addEventListener('click', () => game(mode))
    $('g-exit').addEventListener('click', setup)

    stop = () => {
      cancelAnimationFrame(raf)
      offNote()
      window.removeEventListener('resize', layout)
    }

    function finish(sum: Summary) {
      stop()
      const isBest = recordPlay(song!.id, mode, sum.accuracy)
      summary(sum, mode, isBest)
    }
  }

  function summary(sum: Summary, mode: Mode, isBest: boolean) {
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
        ${isBest ? '<div class="new-best">🏆 שיא חדש!</div>' : ''}
        <div class="big-pct">${Math.round(sum.accuracy * 100)}%</div>
        <p class="hint">דיוק (תווים שנוגנו נכון בניסיון הראשון)</p>
        <div class="stats">
          <div><b>${sum.clean}/${sum.total}</b><small>נכון מיד</small></div>
          <div><b>${sum.mistakes}</b><small>טעויות</small></div>
          <div><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b><small>זמן</small></div>
          ${sum.avgOffsetMs !== undefined ? `<div><b dir="ltr">${sum.avgOffsetMs > 0 ? '+' : ''}${Math.round(sum.avgOffsetMs)}ms</b><small>תזמון ממוצע</small></div>` : ''}
        </div>
        ${tricky ? `<p class="hint">התווים הכי מאתגרים:</p><div class="row center-row">${tricky}</div>` : '<p>בלי טעויות בכלל! 🎉</p>'}
        <div class="row center-row">
          <button id="s-again" class="chip-btn primary">↺ שוב</button>
          <a class="chip-btn" href="#/songs">לרשימת השירים</a>
        </div>
      </div>
      <canvas id="s-confetti" class="confetti"></canvas>
    `
    root.querySelector('#s-again')!.addEventListener('click', () => game(mode))
    if (st >= 2) confetti(root.querySelector<HTMLCanvasElement>('#s-confetti')!)
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
