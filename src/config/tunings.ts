// Instrument layouts live here so other tunings can be added later without
// touching the detector or the UI.

export interface Tine {
  /** 1-based physical position, left to right as the player sees it. */
  pos: number
  /** Scientific pitch name, e.g. "C4". */
  note: string
  /** MIDI note number (C4 = 60). */
  midi: number
  /** Engraved scale degree 1–7. */
  degree: number
  /** Octave dots above the number: 0, 1 (') or 2 (''). */
  dots: number
}

export interface Tuning {
  id: string
  name: string
  tines: Tine[]
}

const NOTE_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export function noteToMidi(note: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note)
  if (!m) throw new Error(`Bad note name: ${note}`)
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  return (Number(m[3]) + 1) * 12 + NOTE_OFFSETS[m[1]] + accidental
}

export function midiToHz(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12)
}

function tine(pos: number, note: string, degree: number, dots: number): Tine {
  return { pos, note, midi: noteToMidi(note), degree, dots }
}

/** Gecko K17, 17 tines in C major, standard layout. */
export const K17_C: Tuning = {
  id: 'k17-c',
  name: 'Gecko K17 · C major',
  tines: [
    tine(1, 'D6', 2, 2),
    tine(2, 'B5', 7, 1),
    tine(3, 'G5', 5, 1),
    tine(4, 'E5', 3, 1),
    tine(5, 'C5', 1, 1),
    tine(6, 'A4', 6, 0),
    tine(7, 'F4', 4, 0),
    tine(8, 'D4', 2, 0),
    tine(9, 'C4', 1, 0),
    tine(10, 'E4', 3, 0),
    tine(11, 'G4', 5, 0),
    tine(12, 'B4', 7, 0),
    tine(13, 'D5', 2, 1),
    tine(14, 'F5', 4, 1),
    tine(15, 'A5', 6, 1),
    tine(16, 'C6', 1, 2),
    tine(17, 'E6', 3, 2),
  ],
}

/** Engraved label, e.g. 1, 3', 2''. */
export function degreeLabel(t: Tine): string {
  return `${t.degree}${"'".repeat(t.dots)}`
}
