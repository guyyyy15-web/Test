/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * Every random decision in the engine flows through one of these. The
 * generator's entire state is a single 32-bit integer, so it can be stored in
 * a save file and resumed exactly -- which is what makes battles reproducible
 * in tests and lets `tools/sim.js` replay a fight.
 *
 * `randomSeed()` is the ONLY sanctioned use of Math.random in src/engine.
 * See engine/determinism.test.js, which fails the build if that changes.
 */

export function makeRng(seed = 1) {
  let state = seed >>> 0

  function float() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Inclusive on both ends: int(1, 6) rolls a die. */
  function int(min, max) {
    if (max <= min) return min
    return min + Math.floor(float() * (max - min + 1))
  }

  /** percent is 0-100. chance(0) is never true, chance(100) always is. */
  function chance(percent) {
    if (percent <= 0) return false
    if (percent >= 100) return true
    return float() * 100 < percent
  }

  function pick(list) {
    if (!list || list.length === 0) return undefined
    return list[Math.floor(float() * list.length)]
  }

  /**
   * Pick from `[{ weight, value }]`. Entries with no weight count as 1.
   * Returns undefined only when the list is empty or every weight is <= 0.
   */
  function weighted(entries) {
    if (!entries || entries.length === 0) return undefined
    let total = 0
    for (const entry of entries) total += Math.max(0, entry.weight ?? 1)
    if (total <= 0) return undefined
    let roll = float() * total
    for (const entry of entries) {
      roll -= Math.max(0, entry.weight ?? 1)
      if (roll < 0) return entry.value
    }
    return entries[entries.length - 1].value
  }

  function shuffle(list) {
    const out = list.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(float() * (i + 1))
      const tmp = out[i]
      out[i] = out[j]
      out[j] = tmp
    }
    return out
  }

  return {
    float,
    int,
    chance,
    pick,
    weighted,
    shuffle,
    /** Serialize into a save, then `makeRng(saved)` resumes the exact stream. */
    get state() {
      return state
    },
    set state(next) {
      state = next >>> 0
    },
    /** Independent generator at the same position -- useful for previews. */
    clone() {
      return makeRng(state)
    },
  }
}

/** Fresh unpredictable seed for a new game. The one sanctioned Math.random. */
export function randomSeed() {
  return (Math.random() * 0xffffffff) >>> 0
}
