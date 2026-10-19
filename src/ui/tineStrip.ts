// The kalimba as seen by the player: 17 tines in physical left-to-right order
// (never mirrored, even in the RTL interface), centre tine longest.

import { degreeLabel, type Tine, type Tuning } from '../config/tunings'
import { DEGREE_COLORS } from '../theme'

export type TineMark = 'target' | 'ok' | 'bad' | null

export class TineStrip {
  private els = new Map<number, HTMLElement>()

  constructor(parent: HTMLElement, tuning: Tuning) {
    parent.classList.add('tines')
    parent.dir = 'ltr'
    const centre = tuning.tines.reduce((a, b) => (a.midi < b.midi ? a : b)).pos
    const maxDist = Math.max(...tuning.tines.map((t) => Math.abs(t.pos - centre)))
    for (const t of tuning.tines) {
      const el = document.createElement('div')
      el.className = 'tine'
      el.style.setProperty('--len', `${100 - (Math.abs(t.pos - centre) / maxDist) * 45}%`)
      el.style.setProperty('--c', DEGREE_COLORS[t.degree])
      el.innerHTML = `<b>${degreeLabel(t)}</b><i>${t.note.replace(/\d/, '')}</i>`
      parent.appendChild(el)
      this.els.set(t.pos, el)
    }
  }

  /** Flash a tine; restarts the animation so repeated notes flash again. */
  flash(tine: Tine) {
    const el = this.els.get(tine.pos)
    if (!el) return
    el.classList.remove('flash')
    void el.offsetWidth
    el.classList.add('flash')
  }

  mark(tine: Tine, mark: TineMark) {
    const el = this.els.get(tine.pos)
    if (!el) return
    el.classList.toggle('target', mark === 'target')
    el.classList.toggle('ok', mark === 'ok')
    el.classList.toggle('bad', mark === 'bad')
  }

  clearMarks() {
    for (const el of this.els.values()) el.classList.remove('target', 'ok', 'bad')
  }
}
