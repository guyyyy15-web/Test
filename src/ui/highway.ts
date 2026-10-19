// The falling-notes "highway": one lane above each tine, gems falling onto a
// hit line just above the kalimba. Pure canvas; the screen drives the scroll.

import { degreeLabel, type Tine, type Tuning } from '../config/tunings'
import type { SongNote } from '../songs/song'
import { DEGREE_COLORS } from '../theme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface Popup {
  x: number
  y: number
  text: string
  color: string
  life: number
}

export class Highway {
  /** Beat position sitting on the hit line. */
  scrollBeat = 0
  /** Index of the note being waited for / next to play; earlier notes are done. */
  current = 0
  pxPerBeat = 64
  /** Index → 'ok' | 'miss' for notes already resolved (drawn faded or red). */
  results = new Map<number, 'ok' | 'miss'>()
  /** Lane highlighted as a wrong note, until this time. */
  private wrongLane: { pos: number; until: number } | null = null

  private lanes = new Map<number, number>()
  private laneWidth = 20
  private byMidi = new Map<number, Tine>()
  private particles: Particle[] = []
  private popups: Popup[] = []
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private last = 0

  constructor(
    private canvas: HTMLCanvasElement,
    tuning: Tuning,
    private notes: SongNote[],
    private beatsPerBar = 4,
  ) {
    this.ctx = canvas.getContext('2d')!
    for (const t of tuning.tines) this.byMidi.set(t.midi, t)
  }

  /** Lane centres (x, relative to the canvas) keyed by tine position. */
  setLanes(centres: Map<number, number>) {
    this.lanes = centres
    const xs = [...centres.values()].sort((a, b) => a - b)
    this.laneWidth = xs.length > 1 ? (xs[xs.length - 1] - xs[0]) / (xs.length - 1) : 20
  }

  get hitY() {
    return this.h - 18
  }

  tineFor(midi: number) {
    return this.byMidi.get(midi)
  }

  burst(midi: number, text = '') {
    const t = this.byMidi.get(midi)
    if (!t) return
    const x = this.lanes.get(t.pos) ?? 0
    const color = DEGREE_COLORS[t.degree]
    for (let i = 0; i < 18; i++) {
      const a = Math.PI + Math.random() * Math.PI
      const v = 60 + Math.random() * 160
      this.particles.push({ x, y: this.hitY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color })
    }
    if (text) this.popups.push({ x, y: this.hitY - 30, text, color, life: 1 })
  }

  /** Floating text over a tine's lane. */
  popup(midi: number, text: string, color: string) {
    const t = this.byMidi.get(midi)
    if (t) this.popups.push({ x: this.lanes.get(t.pos) ?? 0, y: this.hitY - 30, text, color, life: 1 })
  }

  wrong(played: number, text: string) {
    const t = this.byMidi.get(played)
    if (!t) return
    this.wrongLane = { pos: t.pos, until: performance.now() + 450 }
    this.popups.push({ x: this.lanes.get(t.pos) ?? 0, y: this.hitY - 30, text, color: '#ff5c6c', life: 1 })
  }

  draw(now: number) {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0
    this.last = now
    const c = this.canvas
    const dpr = window.devicePixelRatio || 1
    this.w = c.clientWidth
    this.h = c.clientHeight
    if (c.width !== Math.round(this.w * dpr) || c.height !== Math.round(this.h * dpr)) {
      c.width = Math.round(this.w * dpr)
      c.height = Math.round(this.h * dpr)
    }
    const ctx = this.ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.h)

    this.drawLanes(now)
    this.drawBarLines()
    this.drawHitLine()
    this.drawNotes(now)
    this.drawEffects(dt)
  }

  private y(beat: number) {
    return this.hitY - (beat - this.scrollBeat) * this.pxPerBeat
  }

  private drawLanes(now: number) {
    const ctx = this.ctx
    const target = this.notes[this.current]
    const targetPos = target ? this.byMidi.get(target.midi)?.pos : undefined
    for (const [pos, x] of this.lanes) {
      const tine = [...this.byMidi.values()].find((t) => t.pos === pos)!
      const color = DEGREE_COLORS[tine.degree]
      const isTarget = pos === targetPos
      const isWrong = this.wrongLane && this.wrongLane.pos === pos && now < this.wrongLane.until
      const grad = ctx.createLinearGradient(0, 0, 0, this.hitY)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, isWrong ? 'rgba(255,92,108,0.35)' : isTarget ? hexA(color, 0.28) : hexA(color, 0.06))
      ctx.fillStyle = grad
      ctx.fillRect(x - this.laneWidth / 2 + 1, 0, this.laneWidth - 2, this.hitY)
    }
  }

  private drawBarLines() {
    const ctx = this.ctx
    ctx.strokeStyle = 'rgba(160,140,255,0.10)'
    ctx.lineWidth = 1
    const first = Math.floor(this.scrollBeat / this.beatsPerBar) * this.beatsPerBar
    for (let b = first; ; b += this.beatsPerBar) {
      const y = this.y(b)
      if (y < 0) break
      if (y > this.hitY) continue
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.w, y)
      ctx.stroke()
    }
  }

  private drawHitLine() {
    const ctx = this.ctx
    const grad = ctx.createLinearGradient(0, 0, this.w, 0)
    grad.addColorStop(0, 'rgba(79,216,255,0.2)')
    grad.addColorStop(0.5, 'rgba(255,92,200,0.9)')
    grad.addColorStop(1, 'rgba(79,216,255,0.2)')
    ctx.fillStyle = grad
    ctx.shadowColor = '#ff5cc8'
    ctx.shadowBlur = 12
    ctx.fillRect(0, this.hitY - 1.5, this.w, 3)
    ctx.shadowBlur = 0
  }

  private drawNotes(now: number) {
    const ctx = this.ctx
    const r = Math.max(7, Math.min(13, this.laneWidth * 0.46))
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i]
      const y = this.y(n.beat)
      if (y < -r * 2 - n.beats * this.pxPerBeat || y > this.h + r) continue
      const t = this.byMidi.get(n.midi)
      if (!t) continue
      const x = this.lanes.get(t.pos) ?? 0
      const color = DEGREE_COLORS[t.degree]
      const done = i < this.current
      const result = this.results.get(i)
      if (done && result === 'ok') continue // burst away
      // Distance fade: far notes are faint, the next few are clear.
      const ahead = i - this.current
      const alpha = done ? 0.35 : ahead <= 3 ? 1 : Math.max(0.35, 1 - (ahead - 3) * 0.12)
      ctx.globalAlpha = alpha

      // Sustain tail for held notes.
      if (n.beats > 1) {
        const len = (n.beats - 0.4) * this.pxPerBeat
        ctx.fillStyle = hexA(color, 0.35)
        roundRect(ctx, x - r * 0.35, y - len, r * 0.7, len, r * 0.35)
        ctx.fill()
      }

      const isCurrent = i === this.current
      const pulse = isCurrent ? 1 + 0.08 * Math.sin(now / 140) : 1
      ctx.shadowColor = result === 'miss' ? '#ff5c6c' : color
      ctx.shadowBlur = isCurrent ? 22 : 10
      ctx.fillStyle = result === 'miss' ? '#ff5c6c' : color
      ctx.beginPath()
      ctx.arc(x, y, r * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.beginPath()
      ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#140f2e'
      ctx.font = `800 ${Math.round(r * 0.95)}px system-ui`
      ctx.fillText(degreeLabel(t), x, y + 1)
      ctx.globalAlpha = 1
    }
  }

  private drawEffects(dt: number) {
    const ctx = this.ctx
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 300 * dt
      p.life -= dt * 1.6
      if (p.life <= 0) continue
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    this.particles = this.particles.filter((p) => p.life > 0)

    ctx.font = '800 18px system-ui'
    ctx.textAlign = 'center'
    for (const p of this.popups) {
      p.y -= 40 * dt
      p.life -= dt * 1.2
      if (p.life <= 0) continue
      ctx.globalAlpha = Math.min(1, p.life * 1.5)
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10
      ctx.fillText(p.text, clamp(p.x, 30, this.w - 30), p.y)
    }
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
    this.popups = this.popups.filter((p) => p.life > 0)
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
