// Microphone capture for pitch detection. iOS rules this follows:
//  - the AudioContext is created/resumed inside a user tap (call start() from a click handler);
//  - getUserMedia needs a secure context (HTTPS);
//  - browser voice processing is off, it smears pitch and pumps the level;
//  - the mic track can die while the app is in the background, so the
//    caller re-runs start() when it comes back.

export type MicErrorKind = 'insecure' | 'unsupported' | 'denied' | 'no-device' | 'other'

export class MicError extends Error {
  constructor(public kind: MicErrorKind, message: string) {
    super(message)
  }
}

export class MicInput {
  ctx: AudioContext | null = null
  analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null

  constructor(public frameSize = 4096) {}

  get sampleRate() {
    return this.ctx?.sampleRate ?? 48000
  }

  /** Track settings as the browser actually applied them (for the debug panel). */
  get settings(): MediaTrackSettings | null {
    return this.stream?.getAudioTracks()[0]?.getSettings() ?? null
  }

  get isLive() {
    const track = this.stream?.getAudioTracks()[0]
    return !!track && track.readyState === 'live' && this.ctx?.state === 'running'
  }

  async start(): Promise<void> {
    if (!window.isSecureContext) throw new MicError('insecure', 'Not a secure context')
    if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported', 'getUserMedia missing')

    // Safari 16.4+: record and play together. This category also keeps the
    // guide tones audible when the ringer switch is on silent.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'play-and-record'

    // Create or resume the context first, synchronously inside the tap.
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new AudioContext()
    const resumed = this.ctx.resume()

    this.releaseStream()
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      })
    } catch (e) {
      const name = (e as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('denied', String(e))
      if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new MicError('no-device', String(e))
      throw new MicError('other', String(e))
    }
    await resumed

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = this.frameSize
    // WebKit only pulls nodes that reach the destination, so route the
    // analyser into a muted gain. Nothing is audible, so no feedback.
    const mute = this.ctx.createGain()
    mute.gain.value = 0
    this.source.connect(this.analyser).connect(mute).connect(this.ctx.destination)
  }

  /** Copy the latest frameSize samples into `out`. Returns false when not running. */
  read(out: Float32Array): boolean {
    if (!this.analyser) return false
    this.analyser.getFloatTimeDomainData(out as Float32Array<ArrayBuffer>)
    return true
  }

  private releaseStream() {
    this.source?.disconnect()
    this.analyser?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.source = null
    this.analyser = null
  }

  stop() {
    this.releaseStream()
  }
}
