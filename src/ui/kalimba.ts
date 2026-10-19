// The kalimba as seen by the player: tines in physical left-to-right order
// (never mirrored, even in the RTL interface), centre tine longest. Tap a
// tine to hear it.

import { degreeLabel, type Tine, type Tuning } from '../config/tunings'
import { DEGREE_COLORS } from '../theme'

export type TineMark = 'target' | 'next' | 'ok' | 'bad' | null

export class KalimbaView {
  readonly el: HTMLElement
  private els = new Map<number, HTMLElement>()

  constructor(parent: HTMLElement, tuning: Tuning, opts: { big?: boolean; onTap?: (t: Tine) => void } = {}) {
    this.el = document.createElement('div')
    this.el.className = opts.big ? 'kalimba big' : 'kalimba'
    this.el.dir = 'ltr'
    const tines = document.createElement('div')
    tines.className = 'tines'
    const centre = tuning.tines.reduce((a, b) => (a.midi < b.midi ? a : b)).pos
    const maxDist = Math.max(...tuning.tines.map((t) => Math.abs(t.pos - centre)))
    for (const t of [...tuning.tines].sort((a, b) => a.pos - b.pos)) {
      const el = document.createElement('div')
      el.className = 'tine'
      el.style.setProperty('--len', `${100 - (Math.abs(t.pos - centre) / maxDist) * 45}%`)
      el.style.setProperty('--c', DEGREE_COLORS[t.degree])
      el.innerHTML = `<b>${degreeLabel(t)}</b><i>${t.note.replace(/\d/, '')}</i>`
      if (opts.onTap) {
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault()
          opts.onTap!(t)
        })
      }
      tines.appendChild(el)
      this.els.set(t.pos, el)
    }
    this.el.appendChild(tines)
    if (opts.big) {
      const bridge = document.createElement('div')
      bridge.className = 'bridge'
      this.el.appendChild(bridge)
    }
    parent.appendChild(this.el)
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
    for (const m of ['target', 'next', 'ok', 'bad']) el.classList.toggle(m, m === mark)
  }

  clearMarks() {
    for (const el of this.els.values()) el.classList.remove('target', 'next', 'ok', 'bad')
  }

  /** Centre x of a tine, relative to this view (for the falling-notes lanes). */
  laneCentres(): Map<number, number> {
    const base = this.el.getBoundingClientRect().left
    const out = new Map<number, number>()
    for (const [pos, el] of this.els) {
      const r = el.getBoundingClientRect()
      out.set(pos, r.left - base + r.width / 2)
    }
    return out
  }
}
