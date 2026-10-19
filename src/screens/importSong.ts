import { esc, html, type Screen } from '../app/context'
import { degreeLabel, type Tine } from '../config/tunings'
import { outOfRange, parseTab, suggestShift } from '../songs/parse'
import { DIFFICULTY_LABEL, type Difficulty, type Song } from '../songs/song'
import { findSong, saveUserSong } from '../songs/store'
import { DEGREE_COLORS } from '../theme'

const EXAMPLE = `1 1 5 5 | 6 6 5-
4 4 3 3 | 2 2 1-`

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`

/** Add a song from a pasted tab, or edit one of your own (#/import/<id>). */
export const importSong: Screen = (root, app, params) => {
  const editing = params[0] ? findSong(decodeURIComponent(params[0])) : undefined
  const song: Partial<Song> = editing && !editing.builtIn ? editing : {}
  app.setTitle(editing ? 'עריכת שיר' : 'הוספת שיר')
  const playable = new Map<number, Tine>(app.tuning.tines.map((t) => [t.midi, t]))
  let shift = song.shift ?? 0

  root.innerHTML = html`
    <div class="card form">
      <label>שם השיר *<input id="f-title" value="${esc(song.title ?? '')}" dir="auto" autocomplete="off" /></label>
      <label>אמן<input id="f-artist" value="${esc(song.artist ?? '')}" dir="auto" autocomplete="off" /></label>
      <div class="row">
        <label class="grow">BPM<input id="f-bpm" type="number" min="30" max="240" inputmode="numeric" value="${song.bpm ?? 90}" /></label>
        <label class="grow">משקל<select id="f-meter"><option value="4">4/4</option><option value="3"${song.meter === 3 ? ' selected' : ''}>3/4</option></select></label>
        <label class="grow">רמה<select id="f-diff">${(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => `<option value="${d}"${song.difficulty === d ? ' selected' : ''}>${DIFFICULTY_LABEL[d]}</option>`).join('')}</select></label>
      </div>
      <label>תגיות <small>(מופרדות בפסיק: pop, alt-rock, ישראלי)</small><input id="f-tags" value="${esc((song.tags ?? []).join(', '))}" dir="auto" autocomplete="off" /></label>
    </div>

    <div class="card form">
      <label>הטאב *
        <small>מספרים (<span dir="ltr">1 2 3 | 1' 5-</span>) או אותיות (<span dir="ltr">C D E | C5 G</span>). כל שורה היא פראזה.</small>
        <textarea id="f-tab" dir="ltr" rows="7" spellcheck="false" placeholder="${EXAMPLE}">${esc(song.tab ?? '')}</textarea>
      </label>
      <details class="help">
        <summary>איך כותבים טאב?</summary>
        <ul class="tips">
          <li><span dir="ltr">1–7</span> = דו עד סי. <span dir="ltr">1</span> הוא הלשונית האמצעית.</li>
          <li>אוקטבה למעלה: <span dir="ltr">1' 1° 1* 1•</span> · שתיים: <span dir="ltr">1''</span> · למטה: <span dir="ltr">1,</span></li>
          <li>אורך: <span dir="ltr">5-</span> = 2 פעמות, <span dir="ltr">5--</span> = 3, <span dir="ltr">5_</span> = חצי, <span dir="ltr">5.</span> = מנוקד, <span dir="ltr">0</span> = הפסקה</li>
          <li>הקווים <span dir="ltr">|</span> רק לנוחות קריאה.</li>
        </ul>
      </details>
      <label>מילים <small>(לא חובה, שורה לכל פראזה, נשמר רק במכשיר שלך)</small>
        <textarea id="f-lyrics" dir="auto" rows="4">${esc((song.lyrics ?? []).join('\n'))}</textarea>
      </label>
    </div>

    <div class="card">
      <div class="row space"><b>תצוגה מקדימה</b><button id="f-listen" class="chip-btn">🔊 השמע</button></div>
      <p id="f-info" class="hint"></p>
      <div id="f-fix"></div>
      <div id="f-preview" class="preview" dir="ltr"></div>
    </div>

    <p id="f-error" class="error-text"></p>
    <div class="row center-row">
      <button id="f-save" class="chip-btn primary">💾 שמור ונגן</button>
      <a class="chip-btn" href="#/songs">ביטול</a>
    </div>
  `
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!
  const val = (id: string) => ($<HTMLInputElement>(id).value ?? '').trim()

  function preview() {
    const r = parseTab(val('f-tab'))
    const bad = new Set(outOfRange(r.notes.map((n) => ({ ...n, midi: n.midi === null ? null : n.midi + shift })), new Set(playable.keys())))
    const count = r.notes.filter((n) => n.midi !== null).length
    const info: string[] = []
    if (count) info.push(`${count} תווים · ${r.format === 'numbers' ? 'כתיב מספרים' : 'כתיב אותיות'}`)
    if (shift) info.push(`מוזז ${shift > 0 ? '+' : ''}${shift} חצאי טונים`)
    if (r.unknown.length) info.push(`<span class="bad-text">לא הובן: ${r.unknown.map((u) => esc(u.token)).join(' ')}</span>`)
    $('f-info').innerHTML = info.join(' · ')

    // Out of range: offer the smallest shift that fits.
    if (bad.size) {
      const fit = suggestShift(r.notes, new Set(playable.keys()))
      const label = fit === null ? '' : fit % 12 === 0 ? `הזז ${Math.abs(fit / 12)} אוקטבה ${fit > 0 ? 'למעלה' : 'למטה'}` : `העבר סולם (${fit > 0 ? '+' : ''}${fit} חצאי טונים)`
      $('f-fix').innerHTML = `<p class="bad-text">${bad.size} תווים לא קיימים בקלימבה שלך (מסומנים באדום).</p>` + (fit !== null ? `<button id="f-shift" class="chip-btn primary" data-shift="${fit}">✨ ${label}</button>` : '<p class="hint">לא נמצאה הזזה שמתאימה לכל התווים.</p>')
      $('f-fix').querySelector('#f-shift')?.addEventListener('click', (e) => {
        shift = Number((e.currentTarget as HTMLElement).dataset.shift)
        preview()
      })
    } else {
      $('f-fix').innerHTML = shift ? `<button id="f-unshift" class="chip-btn">בטל הזזה</button>` : ''
      $('f-fix').querySelector('#f-unshift')?.addEventListener('click', () => {
        shift = 0
        preview()
      })
    }

    // Notes as coloured chips, one row per phrase.
    const rows: string[][] = []
    r.notes.forEach((n, i) => {
      const row = (rows[n.phrase] ??= [])
      if (n.midi === null) return void row.push(`<span class="chip rest">·</span>`)
      const midi = n.midi + shift
      const tine = playable.get(midi)
      row.push(tine && !bad.has(i) ? `<span class="chip" style="--c:${DEGREE_COLORS[tine.degree]}">${degreeLabel(tine)}</span>` : `<span class="chip bad">${noteName(midi)}</span>`)
    })
    $('f-preview').innerHTML = rows.filter(Boolean).map((r) => `<div class="phrase">${r.join('')}</div>`).join('')
    return { r, bad }
  }

  $('f-tab').addEventListener('input', () => {
    shift = 0
    preview()
  })
  preview()

  $('f-listen').addEventListener('click', async () => {
    await app.requireAudio()
    const synth = app.engine.synth
    const ctx = app.engine.mic.ctx
    if (!synth || !ctx) return
    const beat = 60 / Math.max(30, Number(val('f-bpm')) || 90)
    let t = ctx.currentTime + 0.1
    for (const n of parseTab(val('f-tab')).notes.slice(0, 64)) {
      if (n.midi !== null) synth.play(n.midi + shift, 0.7, t)
      t += n.beats * beat
    }
    // Keep the mic from hearing the preview through the speaker.
    if (!app.engine.headphones) app.engine.detector?.suppressUntil(performance.now() + (t - ctx.currentTime) * 1000 + 1200)
  })

  $('f-save').addEventListener('click', () => {
    const { r, bad } = preview()
    const title = val('f-title')
    const err = !title ? 'חסר שם לשיר.' : !r.notes.some((n) => n.midi !== null) ? 'הטאב ריק או לא מובן.' : bad.size ? 'יש תווים שלא קיימים בקלימבה. השתמש בכפתור ההזזה או תקן את הטאב.' : ''
    $('f-error').textContent = err
    if (err) return
    const id = saveUserSong({
      id: (song.id as string) ?? '',
      title,
      artist: val('f-artist') || undefined,
      bpm: Math.min(240, Math.max(30, Number(val('f-bpm')) || 90)),
      meter: Number(val('f-meter')) === 3 ? 3 : undefined,
      difficulty: val('f-diff') as Difficulty,
      category: 'שלי',
      tags: val('f-tags')
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean),
      tab: val('f-tab'),
      lyrics: val('f-lyrics') ? $<HTMLTextAreaElement>('f-lyrics').value.split('\n') : undefined,
      shift: shift || undefined,
    })
    app.go(`play/${encodeURIComponent(id)}`)
  })

  return () => {}
}

