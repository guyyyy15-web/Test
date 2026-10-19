import { esc, html, type Screen } from '../app/context'
import { load } from '../app/storage'
import { findSong } from '../songs/store'

export const home: Screen = (root, app) => {
  app.setTitle('')
  // "Continue" shortcut to the last song opened (id, optionally /level).
  const last = load<string | null>('lastSong', null)
  const lastSong = last ? findSong(decodeURIComponent(last.split('/')[0])) : undefined
  root.innerHTML = html`
    ${lastSong ? `<a class="continue" href="#/play/${last}"><span>▶</span><div><small>המשך לנגן</small><b dir="auto">${esc(lastSong.titleHe ?? lastSong.title)}</b></div></a>` : ''}
    <div class="menu">
      <a class="tile tile-songs" href="#/songs"><span class="tile-icon">🎵</span><b>שירים</b><small>נגן שירים עם מסלול תווים</small></a>
      <a class="tile tile-free" href="#/free"><span class="tile-icon">🎹</span><b>נגינה חופשית</b><small>הכר את הלשוניות</small></a>
      <a class="tile tile-tuner" href="#/tuner"><span class="tile-icon">🎯</span><b>כיוון</b><small>כוון את הקלימבה</small></a>
      <a class="tile tile-lab" href="#/lab"><span class="tile-icon">🔬</span><b>בדיקת זיהוי</b><small>בדיקת 17 לשוניות ודיבאג</small></a>
    </div>
    <p class="hint center">טיפ: עם אוזניות הטלפון לא ישמע את צלילי ההדרכה של עצמו.</p>
  `
  return () => {}
}
