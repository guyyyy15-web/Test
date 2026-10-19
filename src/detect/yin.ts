// YIN pitch estimator (de Cheveigné & Kawahara, 2002), restricted to the
// kalimba's range. Pure functions: no DOM, no Web Audio, testable in Node.
//
// Two stages. YIN finds the period, which is reliable for *which* note but
// biased by up to ~50 cents on a kalimba: a tine's second vibration mode sits
// at roughly 5.5–6.5× the fundamental, not on a harmonic, and it drags the
// lag minimum. So the frame is then low-passed just above the fundamental and
// the period re-measured within ±15%, where no octave confusion is possible.

import { lowpass } from './filter'

export interface YinOptions {
  sampleRate: number
  minHz: number
  maxHz: number
  /** CMNDF threshold; lower = stricter. 0.10–0.20 is typical. */
  threshold: number
}

export interface PitchEstimate {
  /** Detected frequency, or null when nothing periodic was found. */
  hz: number | null
  /** 1 − CMNDF at the chosen lag: ~1 for a clean tone, ~0 for noise. */
  confidence: number
}

export function createYin(frameSize: number, opts: YinOptions) {
  const tauMin = Math.max(2, Math.floor(opts.sampleRate / opts.maxHz))
  const tauMax = Math.min(Math.ceil(opts.sampleRate / opts.minHz), Math.floor(frameSize / 2))
  const window = frameSize - tauMax
  const diff = new Float32Array(tauMax + 1)
  const cmndf = new Float32Array(tauMax + 1)
  const filtered = new Float32Array(frameSize)

  /** Re-measure the period on a low-passed copy of the frame. */
  function refine(frame: Float32Array, coarseTau: number): number {
    const sr = opts.sampleRate
    // Two passes of a 2nd-order filter ≈ 4th order: the ~6× partial drops ~60 dB.
    lowpass(frame, filtered, (1.5 * sr) / coarseTau, sr)
    lowpass(filtered, filtered, (1.5 * sr) / coarseTau, sr)
    const lo = Math.max(2, Math.floor(coarseTau * 0.85))
    const hi = Math.ceil(coarseTau * 1.15)
    const skip = Math.min(Math.ceil(coarseTau * 2), frameSize >> 2) // filter warm-up
    const win = frameSize - skip - hi - 1
    if (win < coarseTau * 2) return coarseTau

    let bestTau = lo
    let bestVal = Infinity
    const d = (tau: number) => {
      let sum = 0
      for (let j = skip; j < skip + win; j++) {
        const delta = filtered[j] - filtered[j + tau]
        sum += delta * delta
      }
      return sum
    }
    for (let tau = lo; tau <= hi; tau++) {
      const v = d(tau)
      if (v < bestVal) { bestVal = v; bestTau = tau }
    }
    if (bestTau === lo || bestTau === hi) return coarseTau

    // Octave-up guard, done here because the inharmonic partial is filtered
    // out: if the frame repeats much better at twice the period, there is a
    // real component an octave below and that is the fundamental.
    const twice = bestTau * 2
    if (sr / twice >= opts.minHz && skip + win + twice < frameSize) {
      let energy = 0
      for (let j = skip; j < skip + win; j++) energy += filtered[j] * filtered[j]
      const dTwice = Math.min(d(twice - 1), d(twice), d(twice + 1))
      if (bestVal > 0.1 * energy && dTwice < 0.25 * bestVal) return refineAround(twice)
    }
    return refineAround(bestTau)

    function refineAround(tau: number) {
      let t = tau
      while (d(t - 1) < d(t)) t--
      while (d(t + 1) < d(t)) t++
      const a = d(t - 1)
      const b = d(t)
      const c = d(t + 1)
      const denom = a - 2 * b + c
      return denom > 0 ? t + (a - c) / (2 * denom) : t
    }
  }

  return function estimate(frame: Float32Array): PitchEstimate {
    // Difference function d(τ).
    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0
      for (let j = 0; j < window; j++) {
        const delta = frame[j] - frame[j + tau]
        sum += delta * delta
      }
      diff[tau] = sum
    }

    // Cumulative mean normalised difference d'(τ).
    cmndf[0] = 1
    let running = 0
    for (let tau = 1; tau <= tauMax; tau++) {
      running += diff[tau]
      cmndf[tau] = running > 0 ? (diff[tau] * tau) / running : 1
    }

    // First dip under the threshold, and its deepest point. Searching the
    // whole dip (not just the first local minimum) matters for kalimbas: the
    // inharmonic upper partial puts ripples on the dip's walls.
    let best = -1
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmndf[tau] < opts.threshold) {
        best = tau
        while (tau + 1 <= tauMax && cmndf[tau + 1] < opts.threshold) {
          tau++
          if (cmndf[tau] < cmndf[best]) best = tau
        }
        break
      }
    }
    if (best < 0) {
      // No confident dip: report the global minimum's confidence but no pitch.
      let min = 1
      for (let tau = tauMin; tau <= tauMax; tau++) min = Math.min(min, cmndf[tau])
      return { hz: null, confidence: Math.max(0, 1 - min) }
    }

    // Parabolic interpolation for sub-sample lag.
    let refined = best
    if (best > 1 && best < tauMax) {
      const a = cmndf[best - 1]
      const b = cmndf[best]
      const c = cmndf[best + 1]
      const denom = a - 2 * b + c
      if (denom !== 0) refined = best + (a - c) / (2 * denom)
    }
    return { hz: opts.sampleRate / refine(frame, refined), confidence: Math.max(0, 1 - cmndf[best]) }
  }
}

/** Root-mean-square level of a frame, in dBFS (−Infinity for silence). */
export function rmsDb(frame: Float32Array): number {
  let sum = 0
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i]
  return 10 * Math.log10(sum / frame.length)
}
