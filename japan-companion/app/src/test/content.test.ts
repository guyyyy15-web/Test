import { describe, expect, it } from 'vitest'
import { CATEGORIES, LISTEN_PLACES, SIGN_PLACES, listening, phrases, signs } from '../content'
import { EMERGENCY_CONTACTS, GUIDE } from '../content/guide'

// Hiragana, katakana, the long-vowel mark, spaces and the ellipsis used in fill-in phrases.
const KANA_ONLY = /^[぀-ゟ゠-ヿー …]+$/
const HEBREW = /[א-ת]/
const LATIN = /[a-z]/i

function unique(ids: string[]) {
  expect(new Set(ids).size).toBe(ids.length)
}

describe('phrases', () => {
  it('have unique ids prefixed with their category', () => {
    unique(phrases.map((p) => p.id))
    for (const p of phrases) expect(p.id.startsWith(`${p.cat}.`), p.id).toBe(true)
  })

  it('use known categories and have content in each', () => {
    for (const p of phrases) expect(CATEGORIES, p.id).toContain(p.cat)
    for (const c of CATEGORIES) expect(phrases.some((p) => p.cat === c), c).toBe(true)
  })

  it('have every field filled in the right script', () => {
    for (const p of phrases) {
      expect(p.kana, p.id).toMatch(KANA_ONLY)
      expect(p.he_pron, p.id).toMatch(HEBREW)
      expect(p.he, p.id).toMatch(HEBREW)
      expect(p.en, p.id).toMatch(LATIN)
      expect(p.romaji, p.id).toMatch(/^[a-z' -]+$/)
      expect(typeof p.card, p.id).toBe('boolean')
    }
  })

  it('are at least 100 for the MVP', () => {
    expect(phrases.length).toBeGreaterThanOrEqual(100)
  })
})

describe('listening cards', () => {
  it('are well formed', () => {
    unique(listening.map((l) => l.id))
    for (const l of listening) {
      expect(LISTEN_PLACES, l.id).toContain(l.where)
      expect(l.kana, l.id).toMatch(KANA_ONLY)
      expect(l.he + l.reply_he, l.id).toMatch(HEBREW)
      expect(l.en + l.reply_en, l.id).toMatch(LATIN)
    }
  })
})

describe('signs', () => {
  it('are well formed', () => {
    unique(signs.map((s) => s.id))
    for (const s of signs) {
      expect(SIGN_PLACES, s.id).toContain(s.where)
      expect(s.reading, s.id).toMatch(KANA_ONLY)
      expect(s.he, s.id).toMatch(HEBREW)
      expect(s.en, s.id).toMatch(LATIN)
    }
  })
})

describe('guide', () => {
  it('has both languages for every point', () => {
    for (const s of GUIDE) for (const p of [s.title, ...s.points]) {
      expect(p.he, s.id).toMatch(HEBREW)
      expect(p.en, s.id).toMatch(LATIN)
    }
  })

  it('has diallable emergency numbers', () => {
    for (const c of EMERGENCY_CONTACTS) expect(c.tel).toMatch(/^[0-9-]+$/)
  })
})
