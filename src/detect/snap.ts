import { midiToHz, type Tine } from '../config/tunings'

export interface Snapped {
  tine: Tine
  /** Signed distance from the tine's pitch; positive = sharp. */
  cents: number
}

export function centsBetween(hz: number, refHz: number): number {
  return 1200 * Math.log2(hz / refHz)
}

/**
 * Nearest tine to `hz`, or null when the closest is further than `maxCents`.
 * `offsets` (cents, by tine position) moves each tine to where this
 * particular instrument actually sits, from calibration.
 */
export function snapToTine(hz: number, tines: Tine[], maxCents = 50, offsets?: Record<number, number>): Snapped | null {
  let best: Snapped | null = null
  for (const tine of tines) {
    const cents = centsBetween(hz, tineHz(tine, offsets))
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { tine, cents }
  }
  return best && Math.abs(best.cents) <= maxCents ? best : null
}

/** A tine's frequency, shifted by its calibration offset if there is one. */
export function tineHz(tine: Tine, offsets?: Record<number, number>): number {
  return midiToHz(tine.midi) * Math.pow(2, (offsets?.[tine.pos] ?? 0) / 1200)
}
