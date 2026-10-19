// A kalimba-like tone made from scratch: a sine fundamental, a weak upper
// partial at ~5.9× (a tine's second mode, which is not a harmonic) that dies
// fast, and a tiny filtered click for the thumb. No samples to download.

import { midiToHz } from '../config/tunings'

export class KalimbaSynth {
  private out: GainNode
  private click: AudioBuffer

  constructor(private ctx: AudioContext) {
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -12
    comp.ratio.value = 4
    this.out = ctx.createGain()
    this.out.gain.value = 0.8
    this.out.connect(comp).connect(ctx.destination)

    const len = Math.round(ctx.sampleRate * 0.006)
    this.click = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.click.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  }

  /** Seconds a note stays clearly audible (for muting the mic meanwhile). */
  static readonly AUDIBLE = 1.2

  play(midi: number, velocity = 0.8, when = this.ctx.currentTime) {
    const ctx = this.ctx
    const hz = midiToHz(midi)
    // Higher tines ring shorter, like the real thing.
    const decay = Math.max(0.6, 2.2 - (hz - 260) / 700)

    const voice = ctx.createGain()
    voice.connect(this.out)
    voice.gain.setValueAtTime(0, when)
    voice.gain.linearRampToValueAtTime(velocity * 0.5, when + 0.003)
    voice.gain.exponentialRampToValueAtTime(0.0001, when + decay)

    const fund = ctx.createOscillator()
    fund.type = 'sine'
    fund.frequency.value = hz
    fund.connect(voice)

    const upper = ctx.createOscillator()
    upper.type = 'sine'
    upper.frequency.value = hz * 5.9
    const upperGain = ctx.createGain()
    upperGain.gain.setValueAtTime(0.12, when)
    upperGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.25)
    upper.connect(upperGain).connect(voice)

    const click = ctx.createBufferSource()
    click.buffer = this.click
    const clickFilter = ctx.createBiquadFilter()
    clickFilter.type = 'bandpass'
    clickFilter.frequency.value = Math.min(6000, hz * 4)
    const clickGain = ctx.createGain()
    clickGain.gain.value = velocity * 0.08
    click.connect(clickFilter).connect(clickGain).connect(this.out)

    for (const node of [fund, upper]) {
      node.start(when)
      node.stop(when + decay + 0.05)
    }
    click.start(when)
    fund.onended = () => voice.disconnect()
  }

  /**
   * A short metronome tick; `accent` for the first beat of a bar. Pitched
   * well above the highest tine (E6 is 1319 Hz) so the mic never takes it
   * for a note.
   */
  tick(when = this.ctx.currentTime, accent = false) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.frequency.value = accent ? 3200 : 2600
    const g = ctx.createGain()
    g.gain.setValueAtTime(accent ? 0.22 : 0.14, when)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04)
    osc.connect(g).connect(this.out)
    osc.start(when)
    osc.stop(when + 0.06)
  }
}
