import vocabJson from '../content/vocab.json'
import { PATTERNS, type Pattern, type WordType } from '../content/patterns'

export interface Word {
  id: string
  types: WordType[]
  ja: string
  kana: string
  romaji: string
  he_pron: string
  /** Label in the word list. */
  en: string
  he: string
  he_def: string
  /** English inside sentences when it differs from the label ("this (point at it)" → "this"). */
  en_bare?: string
  en_a?: string
  en_the?: string
  counter?: 'tsu' | 'mai'
}

export const VOCAB = vocabJson as Word[]

export interface Built {
  ja: string
  kana: string
  romaji: string
  he_pron: string
  he: string
  en: string
}

/** Counters 1–5: general things take 〜つ, flat things (tickets, maps, towels) take 〜枚. */
export const COUNTERS = {
  tsu: [
    { ja: '一つ', kana: 'ひとつ', romaji: 'hitotsu', he_pron: 'היטוצו' },
    { ja: '二つ', kana: 'ふたつ', romaji: 'futatsu', he_pron: 'פוטאצו' },
    { ja: '三つ', kana: 'みっつ', romaji: 'mittsu', he_pron: 'מיצו' },
    { ja: '四つ', kana: 'よっつ', romaji: 'yottsu', he_pron: 'יוצו' },
    { ja: '五つ', kana: 'いつつ', romaji: 'itsutsu', he_pron: 'איצוצו' },
  ],
  mai: [
    { ja: '一枚', kana: 'いちまい', romaji: 'ichimai', he_pron: 'איצ\'ימאי' },
    { ja: '二枚', kana: 'にまい', romaji: 'nimai', he_pron: 'נימאי' },
    { ja: '三枚', kana: 'さんまい', romaji: 'sanmai', he_pron: 'סאנמאי' },
    { ja: '四枚', kana: 'よんまい', romaji: 'yonmai', he_pron: 'יונמאי' },
    { ja: '五枚', kana: 'ごまい', romaji: 'gomai', he_pron: 'גומאי' },
  ],
} as const

export const MAX_COUNT = 5

const JAPANESE = /[぀-ヿ㐀-鿿]/

/** A word typed or pasted by the user, e.g. a place name copied from Google Maps. */
export function customWord(text: string): Word {
  const t = text.trim()
  const isJa = JAPANESE.test(t)
  return {
    id: 'custom',
    types: ['custom'],
    ja: t,
    kana: t,
    romaji: isJa ? '…' : t,
    he_pron: isJa ? '…' : t,
    en: t,
    he: t,
    he_def: t,
    en_bare: t,
    en_a: t,
    en_the: t,
  }
}

export function fits(pattern: Pattern, word: Word): boolean {
  return word.types.some((t) => pattern.accepts.includes(t))
}

export function wordsFor(pattern: Pattern): Word[] {
  return VOCAB.filter((w) => fits(pattern, w))
}

function article(en: string): string {
  return /^[aeiou]/i.test(en) ? `an ${en}` : `a ${en}`
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m))
}

export function build(pattern: Pattern, word: Word, count = 1): Built {
  const n = Math.min(Math.max(1, Math.round(count)), MAX_COUNT)
  const c = COUNTERS[word.counter ?? 'tsu'][n - 1]
  const bare = word.en_bare ?? word.en
  const the = word.en_the ?? `the ${bare}`
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)
  const en = {
    en: bare,
    En: cap(bare),
    a: word.en_a ?? article(bare),
    the,
    The: cap(the),
    n: String(n),
  }
  return {
    ja: fill(pattern.ja, { N: word.ja, C: c.ja }),
    kana: fill(pattern.kana, { N: word.kana, C: c.kana }),
    romaji: fill(pattern.romaji, { N: word.romaji, C: c.romaji }),
    he_pron: fill(pattern.he_pron, { N: word.he_pron, C: c.he_pron }),
    he: fill(pattern.he, { he: word.he, he_def: word.he_def, n: String(n) }),
    en: fill(pattern.en, en),
  }
}

export { PATTERNS }
