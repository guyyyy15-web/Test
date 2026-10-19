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
