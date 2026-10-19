import { esc, html, type Screen } from '../app/context'
import { keys, load, save } from '../app/storage'
import { getFavorites, getHistory, toggleFavorite } from '../play/history'
import { stars } from '../play/waitSession'
import { DIFFICULTY_LABEL, type Song } from '../songs/song'
import { allSongs, makeBackup, restoreBackup } from '../songs/store'

type Filter = 'all' | 'easy' | 'medium' | 'hard' | 'fav' | 'mine'

const FILTERS: [Filter, string][] = [
  ['all', 'הכל'],
  ['easy', 'קל'],
  ['medium', 'בינוני'],
  ['hard', 'מאתגר'],
  ['fav', '⭐ מועדפים'],
  ['mine', 'שלי'],
]

export const songs: Screen = (root, app) => {
  app.setTitle('שירים')
  let filter = load<Filter>('songFilter', 'all')
  let query = ''
  root.innerHTML = html`
    <input id="sg-search" class="search" type="search" placeholder="🔎 חיפוש שיר" autocomplete="off" />
    <div id="sg-filters" class="filters"></div>
    <div id="sg-list" class="song-list"></div>
    <a class="chip-btn primary center-btn" href="#/import">＋ הוסף שיר משלך</a>
    <div class="card">
      <b>גיבוי</b>
      <p class="hint">השירים שהוספת, השיאים, המועדפים והכיול נשמרים רק במכשיר הזה. כדי להעביר אותם למכשיר אחר, ייצא קובץ וייבא אותו שם.</p>
      <div class="row">
        <button id="sg-export" class="chip-btn">⬇ ייצוא</button>
        <label class="chip-btn file-btn">⬆ ייבוא<input id="sg-import" type="file" accept="application/json,.json" hidden /></label>
      </div>
      <p id="sg-backup-msg" class="hint"></p>
    </div>
  `
  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!

  function renderFilters() {
    $('sg-filters').innerHTML = FILTERS.map(([f, label]) => `<button class="filter${f === filter ? ' on' : ''}" data-f="${f}">${label}</button>`).join('')
  }

  function matches(s: Song, favs: Set<string>) {
    if (filter === 'fav' && !favs.has(s.id)) return false
    if (filter === 'mine' && s.builtIn) return false
    if ((filter === 'easy' || filter === 'medium' || filter === 'hard') && s.difficulty !== filter) return false
    if (!query) return true
    const hay = [s.title, s.titleHe, s.artist, s.category, ...s.tags].join(' ').toLowerCase()
    return hay.includes(query.toLowerCase())
  }

  function renderList() {
    const favs = getFavorites()
    const list = allSongs().filter((s) => matches(s, favs))
    $('sg-list').innerHTML = list.length
      ? list
          .map((s) => {
            const h = getHistory(s.id)
            const best = Math.max(h?.best.wait ?? 0, h?.best.tempo ?? 0)
            const st = stars(best)
            return html`
              <a class="song-item" href="#/play/${encodeURIComponent(s.id)}">
                <div class="song-main">
                  <b dir="auto">${esc(s.titleHe ?? s.title)}</b>
                  <small dir="auto">${esc(s.titleHe ? s.title : s.artist ?? '')}${s.titleHe && s.artist ? ` · ${esc(s.artist)}` : ''}</small>
                </div>
                <div class="song-side">
                  <span class="badge badge-${s.difficulty}">${DIFFICULTY_LABEL[s.difficulty]}</span>
                  <span class="stars" aria-label="${st} כוכבים">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span>
                </div>
                 <button class="fav${favs.has(s.id) ? ' on' : ''}" data-id="${esc(s.id)}" aria-label="מועדף">${favs.has(s.id) ? '★' : '☆'}</button>
              </a>`
          })
          .join('')
      : `<p class="hint center">לא נמצאו שירים.</p>`
  }

  $('sg-filters').addEventListener('click', (e) => {
    const f = (e.target as HTMLElement).closest<HTMLElement>('[data-f]')?.dataset.f as Filter | undefined
    if (!f) return
    filter = f
    save('songFilter', f)
    renderFilters()
    renderList()
  })
  $('sg-search').addEventListener('input', (e) => {
    query = (e.target as HTMLInputElement).value.trim()
    renderList()
  })
  $('sg-list').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.fav')
    if (!btn) return
    e.preventDefault()
    toggleFavorite(btn.dataset.id!)
    renderList()
  })

  $('sg-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(makeBackup(keys('calibration:')), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kalimba-coach-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  })
  $('sg-import').addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const { songs } = restoreBackup(JSON.parse(await file.text()))
      $('sg-backup-msg').textContent = `✓ יובאו ${songs} שירים.`
      renderList()
    } catch {
      $('sg-backup-msg').textContent = 'הקובץ לא נראה כמו גיבוי של Kalimba Coach.'
    }
  })

  renderFilters()
  renderList()
  return () => {}
}
