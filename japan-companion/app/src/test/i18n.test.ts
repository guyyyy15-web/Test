import { describe, expect, it } from 'vitest'
import { en } from '../i18n/en'
import { he } from '../i18n/he'
import { CATEGORIES, LISTEN_PLACES, SIGN_PLACES } from '../content'

describe('i18n dictionaries', () => {
  it('have exactly the same keys', () => {
    expect(Object.keys(he).sort()).toEqual(Object.keys(en).sort())
  })

  it('have no empty strings', () => {
    for (const d of [en, he]) for (const [k, v] of Object.entries(d)) expect(v.trim(), k).not.toBe('')
  })

  it('keep the same {placeholders} in both languages', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(vars(he[k]), k).toEqual(vars(en[k]))
  })

  it('name every category and place', () => {
    for (const c of CATEGORIES) expect(en).toHaveProperty(`cat.${c}`)
    for (const p of [...SIGN_PLACES, ...LISTEN_PLACES]) expect(en).toHaveProperty(`place.${p}`)
  })
})
