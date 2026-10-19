import { html, type Screen } from '../app/context'

export const home: Screen = (root, app) => {
  app.setTitle('')
  root.innerHTML = html`
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
