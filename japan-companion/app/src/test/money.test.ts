import { describe, expect, it } from 'vitest'
import { convert, formatMoney, parseRates, taxFreeCheck, TAX_FREE_MIN_PRETAX } from '../lib/money'

const rates = { ILS: 0.02, USD: 0.0065 }

describe('convert', () => {
  it('converts yen to shekels and dollars', () => {
    expect(convert(1000, 'JPY', 'ILS', rates)).toBeCloseTo(20)
    expect(convert(1000, 'JPY', 'USD', rates)).toBeCloseTo(6.5)
  })

  it('converts back to yen and across', () => {
    expect(convert(20, 'ILS', 'JPY', rates)).toBeCloseTo(1000)
    expect(convert(6.5, 'USD', 'ILS', rates)).toBeCloseTo(20)
  })

  it('adds the card fee only when paying in yen', () => {
    expect(convert(1000, 'JPY', 'ILS', rates, 2.5)).toBeCloseTo(20.5)
    expect(convert(20, 'ILS', 'JPY', rates, 2.5)).toBeCloseTo(1000)
  })

  it('is the identity for the same currency', () => {
    expect(convert(1234, 'JPY', 'JPY', rates)).toBe(1234)
  })
})

describe('formatMoney', () => {
  it('shows yen without decimals', () => {
    expect(formatMoney(1234.6, 'JPY', 'en')).toBe('¥1,235')
  })

  it('shows small shekel amounts with 2 decimals and large ones without', () => {
    expect(formatMoney(19.2, 'ILS', 'en')).toBe('₪19.20')
    expect(formatMoney(192.4, 'ILS', 'en')).toBe('₪192')
  })
})

describe('taxFreeCheck', () => {
  it('uses the pre-tax amount for the ¥5,000 threshold', () => {
    expect(taxFreeCheck(5500, true).eligible).toBe(true) // 5,000 before tax
    expect(taxFreeCheck(5400, true).eligible).toBe(false)
    expect(taxFreeCheck(TAX_FREE_MIN_PRETAX, false).eligible).toBe(true)
  })

  it('reports the 10% saving', () => {
    expect(taxFreeCheck(11000, true).saving).toBeCloseTo(1000)
    expect(taxFreeCheck(3000, true).saving).toBe(0)
  })
})

describe('parseRates', () => {
  it('reads an open.er-api.com response', () => {
    const r = parseRates({ result: 'success', time_last_update_unix: 1790000000, rates: { ILS: 0.0192, USD: 0.0063 } })
    expect(r).toEqual({ ILS: 0.0192, USD: 0.0063, asOf: 1790000000000, source: 'live' })
  })

  it('rejects errors and missing currencies', () => {
    expect(parseRates({ result: 'error' })).toBeNull()
    expect(parseRates({ result: 'success', time_last_update_unix: 1, rates: { USD: 0.006 } })).toBeNull()
    expect(parseRates(null)).toBeNull()
  })
})
