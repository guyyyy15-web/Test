// Minimal biquad filters (RBJ audio-EQ cookbook), run over a whole buffer
// from a zero state.

export type BiquadType = 'lowpass' | 'highpass'

export function biquad(type: BiquadType, input: Float32Array, out: Float32Array, cutoffHz: number, sampleRate: number, q = Math.SQRT1_2) {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate
  const alpha = Math.sin(w0) / (2 * q)
  const cos = Math.cos(w0)
  const a0 = 1 + alpha
  const b0 = (type === 'lowpass' ? (1 - cos) / 2 : (1 + cos) / 2) / a0
  const b1 = (type === 'lowpass' ? 1 - cos : -(1 + cos)) / a0
  const b2 = b0
  const a1 = (-2 * cos) / a0
  const a2 = (1 - alpha) / a0
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x = input[i]
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
    x2 = x1; x1 = x; y2 = y1; y1 = y
    out[i] = y
  }
}

export function lowpass(input: Float32Array, out: Float32Array, cutoffHz: number, sampleRate: number) {
  biquad('lowpass', input, out, cutoffHz, sampleRate)
}
