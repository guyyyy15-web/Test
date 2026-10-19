// How strongly each tine is sounding right now: the amplitude at each tine's
// fundamental, measured with a Hann-windowed Goertzel filter per tine.
//
// Polyphony-safe in the way that matters here: when a new note starts over
// notes that are still ringing, the new tine is the one whose amplitude grew.
// Kalimba tines have almost no energy at 2× their fundamental (their upper
// modes are inharmonic), so an octave neighbour does not light up either.

export function createSalience(frameSize: number, sampleRate: number, freqs: number[]) {
  const window = new Float32Array(frameSize)
  let windowSum = 0
  for (let i = 0; i < frameSize; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1))
    windowSum += window[i]
  }
  const coeffs = freqs.map((f) => 2 * Math.cos((2 * Math.PI * f) / sampleRate))
  const out = new Float32Array(freqs.length)

  /** Peak amplitude of each frequency in the newest `frameSize` samples. */
  return function salience(frame: Float32Array): Float32Array {
    const start = frame.length - frameSize
    for (let k = 0; k < coeffs.length; k++) {
      const coeff = coeffs[k]
      let s1 = 0
      let s2 = 0
      for (let i = 0; i < frameSize; i++) {
        const s0 = frame[start + i] * window[i] + coeff * s1 - s2
        s2 = s1
        s1 = s0
      }
      const power = s1 * s1 + s2 * s2 - coeff * s1 * s2
      out[k] = (2 * Math.sqrt(Math.max(0, power))) / windowSum
    }
    return out
  }
}
