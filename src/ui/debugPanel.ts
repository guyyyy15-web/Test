// Live view of the detector's insides, for tuning it on a real instrument.

import { midiToHz, type Tuning } from '../config/tunings'
import type { FrameInfo, NoteEvent } from '../detect/detector'
import { DEGREE_COLORS } from '../theme'

const HISTORY = 240
const TRACE_LEFT = 42

export class DebugPanel {
  private bars: HTMLElement[] = []
  private trace: HTMLCanvasElement
  private history: { hz: number | null; degree: number | null; onset: boolean }[] = []
  private lastText = 0
  private frameTimes: number[] = []
  private lastNote: NoteEvent | null = null

  constructor(private root: HTMLElement, private tuning: Tuning) {
    const bars = root.querySelector<HTMLElement>('.sal-bars')!
    bars.dir = 'ltr'
    for (const t of tuning.tines) {
      const b = document.createElement('div')
      b.style.setProperty('--c', DEGREE_COLORS[t.degree])
      bars.appendChild(b)
      this.bars.push(b)
    }
    this.trace = root.querySelector('canvas')!
  }

  get visible() {
    return !this.root.hidden
  }

  note(n: NoteEvent) {
    this.lastNote = n
  }

  update(info: FrameInfo, now: number, frameMs: number, settings: MediaTrackSettings | null, sampleRate: number) {
    this.history.push({ hz: info.snapped ? info.estimate.hz : null, degree: info.snapped?.tine.degree ?? null, onset: info.onset })
    if (this.history.length > HISTORY) this.history.shift()
    this.frameTimes.push(frameMs)
    if (this.frameTimes.length > 60) this.frameTimes.shift()
    if (!this.visible) return

    const pct = (db: number) => `${Math.max(0, Math.min(100, ((db + 80) / 80) * 100))}%`
    this.set('.lvl-fill', (el) => (el.style.width = pct(info.levelDb)))
    this.set('.lvl-gate', (el) => (el.style.left = pct(info.gateDb)))
    this.set('.lvl-floor', (el) => (el.style.left = pct(info.noiseFloorDb)))
    this.set('.hf-fill', (el) => (el.style.width = pct(info.hfDb)))
    this.set('.conf-fill', (el) => (el.style.width = `${Math.round(info.estimate.confidence * 100)}%`))
    this.set('.onset-dot', (el) => info.onset && el.classList.add('on'))
    const top = Math.max(1e-6, ...info.salience)
    info.salience.forEach((v, k) => (this.bars[k].style.height = `${Math.round((v / top) * 100)}%`))
    this.drawTrace()

    if (now - this.lastText < 100) return
    this.lastText = now
    this.set('.onset-dot', (el) => el.classList.remove('on'))
    const avgFrame = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.set('pre', (el) => (el.textContent = this.report(info, avgFrame, settings, sampleRate)))
  }

  /** Plain-text state, also what "copy report" puts on the clipboard. */
  report(info: FrameInfo, avgFrameMs: number, settings: MediaTrackSettings | null, sampleRate: number) {
    const n = this.lastNote
    const fps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0
    return [
      `hz          ${info.estimate.hz?.toFixed(1) ?? '–'}`,
      `nearest     ${info.snapped ? `${info.snapped.tine.note} (${info.snapped.cents >= 0 ? '+' : ''}${info.snapped.cents.toFixed(0)}¢)` : '–'}`,
      `confidence  ${info.estimate.confidence.toFixed(2)}`,
      `level       ${info.levelDb.toFixed(1)} dB   gate ${info.gateDb.toFixed(1)}   floor ${info.noiseFloorDb.toFixed(1)}`,
      `high band   ${info.hfDb.toFixed(1)} dB`,
      `phase       ${info.phase}`,
      `last note   ${n ? `${n.tine.note} ${n.cents === null ? '(mix)' : `${n.cents >= 0 ? '+' : ''}${n.cents.toFixed(0)}¢`}  latency ${(n.detectedAt - n.time).toFixed(0)} ms` : '–'}`,
      `frames      ${fps.toFixed(0)} fps`,
      `audio       ${sampleRate} Hz  echoCancel=${settings?.echoCancellation}  noiseSupp=${settings?.noiseSuppression}  agc=${settings?.autoGainControl}`,
    ].join('\n')
  }

  private set(sel: string, fn: (el: HTMLElement) => void) {
    const el = this.root.querySelector<HTMLElement>(sel)
    if (el) fn(el)
  }

  private drawTrace() {
    const c = this.trace
    const ctx = c.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = c.clientWidth
    const h = c.clientHeight
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const lo = Math.log2(240)
    const hi = Math.log2(1400)
    const y = (hz: number) => h - ((Math.log2(hz) - lo) / (hi - lo)) * h
    ctx.font = '9px system-ui'
    // Semitone neighbours (E/F, B/C) sit close together: stagger their labels.
    let prevY = Infinity
    let col = 0
    for (const t of [...this.tuning.tines].sort((a, b) => a.midi - b.midi)) {
      const ty = y(midiToHz(t.midi))
      col = prevY - ty < 9 ? 1 - col : 0
      prevY = ty
      ctx.strokeStyle = 'rgba(160,140,255,0.12)'
      ctx.beginPath()
      ctx.moveTo(TRACE_LEFT, ty)
      ctx.lineTo(w, ty)
      ctx.stroke()
      ctx.fillStyle = DEGREE_COLORS[t.degree]
      ctx.fillText(t.note, col * 20, ty + 3)
    }
    this.history.forEach((p, i) => {
      const x = TRACE_LEFT + (i / HISTORY) * (w - TRACE_LEFT)
      if (p.onset) {
        ctx.fillStyle = 'rgba(255,92,200,0.5)'
        ctx.fillRect(x, 0, 1.5, h)
      }
      if (!p.hz || p.degree === null) return
      ctx.fillStyle = DEGREE_COLORS[p.degree]
      ctx.beginPath()
      ctx.arc(x, y(p.hz), 2, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}
