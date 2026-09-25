import { load, save } from './storage'

export type Currency = 'JPY' | 'ILS' | 'USD'
export type Lang = 'he' | 'en'

/** Units of each currency per 1 JPY. */
export interface Rates {
  ILS: number
  USD: number
  /** Unix ms of the rate itself, not of the fetch. */
  asOf: number
  source: 'bundled' | 'live' | 'manual'
}

// open.er-api.com, 25 Sep 2026. Used only until the first successful fetch.
export const BUNDLED_RATES: Rates = {
  ILS: 0.019199,
  USD: 0.006302,
  asOf: Date.UTC(2026, 8, 25),
  source: 'bundled',
}

export const RATES_URL = 'https://open.er-api.com/v6/latest/JPY'
const RATES_KEY = 'jc.rates'
const FETCHED_KEY = 'jc.ratesFetchedAt'
const REFRESH_MS = 12 * 60 * 60 * 1000

/** 10% consumption tax; tax-free needs ≥ ¥5,000 before tax, same store, same day (rules until 31 Oct 2026). */
export const TAX_RATE = 0.1
export const TAX_FREE_MIN_PRETAX = 5000

export function toJpy(amount: number, from: Currency, rates: Pick<Rates, 'ILS' | 'USD'>): number {
  return from === 'JPY' ? amount : amount / rates[from]
}

export function fromJpy(yen: number, to: Currency, rates: Pick<Rates, 'ILS' | 'USD'>): number {
  return to === 'JPY' ? yen : yen * rates[to]
}

/** Converts, then adds a card/exchange fee in percent (what you actually pay at home). */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Pick<Rates, 'ILS' | 'USD'>,
  feePct = 0,
): number {
  const value = fromJpy(toJpy(amount, from, rates), to, rates)
  return from === 'JPY' && to !== 'JPY' ? value * (1 + feePct / 100) : value
}

export function formatMoney(amount: number, currency: Currency, lang: Lang): string {
  const digits = currency === 'JPY' || Math.abs(amount) >= 100 ? 0 : 2
  return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export interface TaxFreeCheck {
  preTax: number
  eligible: boolean
  saving: number
}

/** `price` is the shelf price; Japanese tags usually show tax-included (税込). */
export function taxFreeCheck(price: number, includesTax: boolean): TaxFreeCheck {
  const preTax = includesTax ? price / (1 + TAX_RATE) : price
  const eligible = preTax >= TAX_FREE_MIN_PRETAX
  return { preTax, eligible, saving: eligible ? preTax * TAX_RATE : 0 }
}

interface ErApiResponse {
  result: string
  time_last_update_unix: number
  rates: Record<string, number>
}

export function parseRates(json: unknown): Rates | null {
  const r = json as ErApiResponse
  if (r?.result !== 'success') return null
  const ILS = r.rates?.ILS
  const USD = r.rates?.USD
  if (!(ILS > 0) || !(USD > 0)) return null
  return { ILS, USD, asOf: r.time_last_update_unix * 1000, source: 'live' }
}

export function loadRates(): Rates {
  return load<Rates>(RATES_KEY, BUNDLED_RATES)
}

export function saveRates(rates: Rates): void {
  save(RATES_KEY, rates)
}

/** Fetches fresh rates at most every 12 h. Never throws; returns null when nothing new. */
export async function refreshRates(force = false): Promise<Rates | null> {
  const last = load<number>(FETCHED_KEY, 0)
  if (!force && Date.now() - last < REFRESH_MS) return null
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null
  try {
    const res = await fetch(RATES_URL, { cache: 'no-store' })
    if (!res.ok) return null
    const rates = parseRates(await res.json())
    if (!rates) return null
    save(FETCHED_KEY, Date.now())
    saveRates(rates)
    return rates
  } catch {
    return null
  }
}
