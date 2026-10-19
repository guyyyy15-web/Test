// Test-signal helpers: kalimba-like tones rendered offline into Float32Arrays.

export interface ToneSpec {
  hz: number
  /** Amplitude of the fundamental. */
  amp?: number
  /** Extra partials as [frequency ratio, relative amplitude]. */
  partials?: [number, number][]
  /** Decay time constant in seconds. */
  decay?: number
}

export function renderTone(spec: ToneSpec, sampleRate: number, length: number, startAt = 0): Float32Array {
  const out = new Float32Array(length)
  const amp = spec.amp ?? 0.5
  const decay = spec.decay ?? 0.6
  const partials: [number, number][] = [[1, 1], ...(spec.partials ?? [])]
  for (let i = 0; i < length; i++) {
    const t = (i - startAt) / sampleRate
    if (t < 0) continue
    const env = amp * Math.exp(-t / decay)
    let s = 0
    for (const [ratio, rel] of partials) s += rel * Math.sin(2 * Math.PI * spec.hz * ratio * t)
    out[i] = env * s
  }
  return out
}

export function mix(...signals: Float32Array[]): Float32Array {
  const out = new Float32Array(Math.max(...signals.map((s) => s.length)))
  for (const s of signals) for (let i = 0; i < s.length; i++) out[i] += s[i]
  return out
}

/** Deterministic white noise (mulberry32), so tests never flake. */
export function noise(length: number, amp: number, seed = 1): Float32Array {
  let a = seed >>> 0
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    out[i] = amp * ((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1)
  }
  return out
}

export interface Pluck {
  /** Tine frequency. */
  hz: number
  /** Start, seconds. */
  at: number
  amp?: number
  /** Decay time constant, seconds. Real tines: ~1.5 s low, ~0.5 s high. */
  decay?: number
  partials?: [number, number][]
  /** Muted by the thumb at this time, seconds (a sharp 0.5 ms cut, the worst case). */
  until?: number
}

/**
 * Render a performance. Re-plucking a tine that is still ringing first stops
 * it under the thumb (15 ms fade), as on the real instrument; other tines keep
 * ringing and overlap.
 */
export function renderPerformance(plucks: Pluck[], seconds: number, sampleRate: number): Float32Array {
  const out = new Float32Array(Math.ceil(seconds * sampleRate))
  const fade = 0.015
  plucks.forEach((p, i) => {
    const next = plucks.slice(i + 1).find((q) => q.hz === p.hz && q.at > p.at)
    const stopAt = Math.min(next ? next.at - fade : Infinity, p.until ?? Infinity)
    const fadeLen = p.until !== undefined && stopAt === p.until ? 0.0005 : fade
    const amp = p.amp ?? 0.4
    const decay = p.decay ?? defaultDecay(p.hz)
    const partials: [number, number][] = [[1, 1], ...(p.partials ?? [[5.9, 0.15]])]
    const start = Math.floor(p.at * sampleRate)
    for (let n = start; n < out.length; n++) {
      const t = (n - start) / sampleRate
      const abs = n / sampleRate
      let env = amp * Math.exp(-t / decay) * Math.min(1, t / 0.002)
      if (abs >= stopAt) {
        const k = 1 - (abs - stopAt) / fadeLen
        if (k <= 0) break
        env *= k
      }
      let s = 0
      // Upper partials die much faster than the fundamental.
      for (const [ratio, rel] of partials) s += rel * (ratio === 1 ? 1 : Math.exp(-t / 0.08)) * Math.sin(2 * Math.PI * p.hz * ratio * t)
      out[n] += env * s
    }
  })
  return out
}

function defaultDecay(hz: number) {
  return Math.max(0.5, 1.6 - (hz - 260) / 1000)
}
