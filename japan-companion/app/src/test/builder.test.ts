import { describe, expect, it } from 'vitest'
import { build, customWord, PATTERNS, VOCAB, wordsFor } from '../lib/builder'
import type { WordType } from '../content/patterns'
import { en } from '../i18n/en'

const KANA_ONLY = /^[぀-ゟ゠-ヿー]+$/
const HEBREW = /[א-ת]/
const TYPES: WordType[] = [
  'place', 'pointer-place', 'this', 'thing', 'food', 'drink', 'ingredient', 'body', 'belonging', 'usable',
  'sight', 'fixture', 'rentable', 'amenity', 'vehicle', 'request', 'may-i', 'works', 'custom',
]
const HEADING_OF = (t: WordType) => (t === 'pointer-place' || t === 'this' ? 'type.pointer' : t === 'works' ? 'type.usable' : `type.${t}`)
const byId = (id: string) => VOCAB.find((w) => w.id === id)!
const frame = (id: string) => PATTERNS.find((p) => p.id === id)!

describe('vocabulary', () => {
  it('has unique ids, known types and complete fields', () => {
    expect(new Set(VOCAB.map((w) => w.id)).size).toBe(VOCAB.length)
    for (const w of VOCAB) {
      for (const t of w.types) expect(TYPES, w.id).toContain(t)
      expect(w.types, w.id).not.toContain('custom')
      expect(w.kana.replace(/ /g, ''), w.id).toMatch(KANA_ONLY)
      expect(w.romaji, w.id).toMatch(/^[a-z' -]+$/)
      expect(w.he_pron, w.id).toMatch(HEBREW)
      expect(w.he + w.he_def, w.id).toMatch(HEBREW)
      expect(w.en, w.id).toMatch(/[a-z]/i)
      if (w.counter) expect(['tsu', 'mai'], w.id).toContain(w.counter)
    }
  })

  it('puts every word in at least one frame', () => {
    for (const w of VOCAB) expect(PATTERNS.some((p) => wordsFor(p).includes(w)), w.id).toBe(true)
  })
})

describe('frames', () => {
  it('have unique ids, a noun slot and enough words', () => {
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length)
    for (const p of PATTERNS) {
      for (const f of [p.ja, p.kana, p.romaji, p.he_pron]) expect(f, p.id).toContain('{N}')
      if (p.count) expect(p.ja, p.id).toContain('{C}')
      expect(wordsFor(p).length, p.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('never glue a Hebrew prefix letter onto a definite noun (ל+התחנה)', () => {
    for (const p of PATTERNS) expect(p.he, p.id).not.toMatch(/[בלמהוכש]\{he_def\}/)
  })

  it('have a heading for every word type they accept', () => {
    for (const p of PATTERNS)
      for (const t of p.accepts.filter((x) => x !== 'custom'))
        expect(Object.keys(en), `${p.id}/${t}`).toContain(HEADING_OF(t))
  })
})

describe('build', () => {
  it('produces clean sentences for every frame × word', () => {
    for (const p of PATTERNS)
      for (const w of wordsFor(p))
        for (const n of p.count ? [1, 2, 5] : [1]) {
          const s = build(p, w, n)
          const where = `${p.id}+${w.id}×${n}`
          for (const v of Object.values(s)) expect(v, where).not.toMatch(/[{}]/)
          expect(s.kana.replace(/ /g, ''), where).toMatch(KANA_ONLY)
          expect(s.he, where).toMatch(HEBREW)
          expect(s.he_pron, where).toMatch(HEBREW)
        }
  })

  it('builds the sentences travel guides teach', () => {
    expect(build(frame('where'), byId('toilet')).ja).toBe('トイレはどこですか')
    expect(build(frame('where'), byId('station')).romaji).toBe('eki wa doko desu ka')
    expect(build(frame('taxi'), byId('here')).ja).toBe('ここまでお願いします')
    expect(build(frame('without'), byId('wasabi')).ja).toBe('わさび抜きでお願いします')
    expect(build(frame('hurts'), byId('head')).kana).toBe('あたまがいたいです')
    expect(build(frame('can-use'), byId('credit-card')).ja).toBe('ここでクレジットカードは使えますか')
    expect(build(frame('how-much'), byId('this')).ja).toBe('これはいくらですか')
  })

  it('covers asking people to do things, and asking permission', () => {
    expect(build(frame('do-for-me'), byId('do-heat')).ja).toBe('温めてもらえますか')
    expect(build(frame('do-for-me'), byId('do-heat')).en).toBe('Could you heat it up?')
    expect(build(frame('do-for-me'), byId('do-fix')).romaji).toBe('naoshite moraemasu ka')
    expect(build(frame('may-i'), byId('may-photo')).ja).toBe('写真を撮ってもいいですか')
    expect(build(frame('may-i'), byId('may-card')).he).toBe('אפשר לשלם בכרטיס?')
  })

  it('covers renting, pointing, knowing and broken things', () => {
    expect(build(frame('rent-price'), byId('bicycle')).ja).toBe('自転車のレンタルはいくらですか')
    expect(build(frame('rent-price'), byId('bicycle')).en).toBe('How much is it to rent a bicycle?')
    expect(build(frame('how-much'), byId('that')).ja).toBe('それはいくらですか')
    expect(build(frame('how-much'), byId('that')).en).toBe('How much is that?')
    expect(build(frame('can-i-have'), byId('this')).ja).toBe('これをもらえますか')
    expect(build(frame('show-me'), byId('this')).ja).toBe('これを見せてもらえますか')
    expect(build(frame('know'), byId('here')).ja).toBe('ここを知っていますか')
    expect(build(frame('next'), byId('bus')).ja).toBe('次のバスは何時ですか')
    expect(build(frame('broken'), byId('aircon')).ja).toBe('エアコンが壊れています')
    expect(build(frame('not-working'), byId('suica')).en).toBe("My Suica doesn't work")
    expect(build(frame('included'), byId('breakfast')).en).toBe('Is breakfast included?')
  })

  it('uses the right counter', () => {
    const tickets = build(frame('count'), byId('ticket'), 2)
    expect(tickets.ja).toBe('切符を二枚お願いします')
    expect(tickets.kana).toBe('きっぷをにまいおねがいします')
    expect(build(frame('count'), byId('beer'), 3).ja).toBe('ビールを三つお願いします')
    expect(build(frame('count'), byId('beer'), 99).romaji).toBe('biiru o itsutsu onegaishimasu')
  })

  it('reads naturally in English and Hebrew', () => {
    expect(build(frame('nearby'), byId('atm')).en).toBe('Is there an ATM nearby?')
    expect(build(frame('where'), byId('pharmacy')).en).toBe('Where is the pharmacy?')
    expect(build(frame('please'), byId('this')).en).toBe('This, please')
    expect(build(frame('lost'), byId('passport')).en).toBe('I lost my passport')
    expect(build(frame('where'), byId('pharmacy')).he).toBe('איפה בית המרקחת?')
    expect(build(frame('have'), byId('this')).he).toBe('יש לכם כזה?')
    expect(build(frame('can-use'), byId('cash')).he).toBe('אפשר להשתמש כאן במזומן?')
  })

  it('takes custom names, including pasted Japanese', () => {
    const latin = build(frame('taxi'), customWord('  Kinkakuji '))
    expect(latin.ja).toBe('Kinkakujiまでお願いします')
    expect(latin.en).toBe('To Kinkakuji, please')
    const ja = build(frame('where'), customWord('金閣寺'))
    expect(ja.ja).toBe('金閣寺はどこですか')
    expect(ja.romaji).toBe('… wa doko desu ka')
  })
})
