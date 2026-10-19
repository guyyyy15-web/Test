import type { AudioEngine } from '../audio/engine'
import type { Tuning } from '../config/tunings'

export interface App {
  engine: AudioEngine
  tuning: Tuning
  /** Navigate to a hash route, e.g. "free" or "play/twinkle". */
  go(route: string): void
  /** Resolve once sound (and the mic, if allowed) is running; asks for a tap if needed. */
  requireAudio(): Promise<void>
  setTitle(title: string): void
}

/** A screen renders into `root` and returns a cleanup function. */
export type Screen = (root: HTMLElement, app: App, params: string[]) => () => void

export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((out, s, i) => out + s + (i < values.length ? String(values[i]) : ''), '')
}

/** Escape text for use inside HTML (user song titles, imported backups). */
export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
