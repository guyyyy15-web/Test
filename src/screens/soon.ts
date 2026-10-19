import { html, type Screen } from '../app/context'

export const soon =
  (title: string): Screen =>
  (root, app) => {
    app.setTitle(title)
    root.innerHTML = html`<div class="card center"><p>🚧 בבנייה, יגיע בקרוב.</p><a class="chip-btn" href="#/">חזרה לתפריט</a></div>`
    return () => {}
  }
