import { midiToHz, type Tine } from '../config/tunings'

export interface Snapped {
  tine: Tine
  /** Signed distance from the tine's pitch; positive = sharp. */
  cents: number
}

export function centsBetween(hz: number, refHz: number): number {
  return 1200 * Math.log2(hz / refHz)
}

/** Nearest tine to `hz`, or null when the closest is further than `maxCents`. */
export function snapToTine(hz: number, tines: Tine[], maxCents = 50): Snapped | null {
  let best: Snapped | null = null
  for (const tine of tines) {
    const cents = centsBetween(hz, midiToHz(tine.midi))
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { tine, cents }
  }
  return best && Math.abs(best.cents) <= maxCents ? best : null
}
