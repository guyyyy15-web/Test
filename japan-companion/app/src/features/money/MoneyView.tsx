import { useMemo, useState, type ReactNode } from 'react'
import { MoneyText } from '../../components/MoneyText'
import { useI18n } from '../../i18n'
import { convert, taxFreeCheck, TAX_FREE_MIN_PRETAX, type Currency } from '../../lib/money'
import { load, save } from '../../lib/storage'
import { useRates } from './useRates'

const CURRENCIES: Currency[] = ['JPY', 'ILS', 'USD']
const SYMBOL: Record<Currency, string> = { JPY: '¥', ILS: '₪', USD: '$' }
const ANCHORS = [100, 500, 1000, 3000, 5000, 10000]
const MAX_DIGITS = 9

export function MoneyView() {
  const { t, lang } = useI18n()
  const { rates, state, refresh } = useRates()
  const [from, setFrom] = useState<Currency>('JPY')
  const [input, setInput] = useState('')
  const [feePct, setFeePct] = useState<number>(() => load('jc.feePct', 0))
  const [manual, setManual] = useState<string>(() => load('jc.manualIlsPer1000', ''))
  const [includesTax, setIncludesTax] = useState(true)

  const manualNum = parseFloat(manual)
  const effective = useMemo(
    () => ({ ILS: manualNum > 0 ? manualNum / 1000 : rates.ILS, USD: rates.USD }),
    [manualNum, rates],
  )
  const amount = parseFloat(input) || 0
  const yen = convert(amount, from, 'JPY', effective)
  const targets = CURRENCIES.filter((c) => c !== from)
  const tax = taxFreeCheck(yen, includesTax)

  const press = (k: string) => {
    if (k === '⌫') return setInput((s) => s.slice(0, -1))
    setInput((s) => {
      if (k === '.' && (s.includes('.') || from === 'JPY')) return s
      const next = s === '0' && k !== '.' ? k : s + k
      return next.replace('.', '').length > MAX_DIGITS ? s : next
    })
  }

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', from === 'JPY' ? '000' : '.', '0', '⌫']

  const source = manualNum > 0 ? t('money.rateManual') : rates.source === 'live' ? t('money.rateLive') : t('money.rateBundled')
  const date = new Date(rates.asOf).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="view money-view">
      <div className="seg" role="radiogroup" aria-label={t('money.from')}>
        {CURRENCIES.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={c === from}
            className={c === from ? 'seg-btn active' : 'seg-btn'}
            onClick={() => {
              setFrom(c)
              setInput('')
            }}
          >
            {SYMBOL[c]} {c}
          </button>
        ))}
      </div>

      <div className="display" aria-live="polite">
        <div className="display-input" dir="ltr">
          <span className="display-sym">{SYMBOL[from]}</span>
          <span className="display-num">{input ? Number(input).toLocaleString('en-US', { maximumFractionDigits: 2 }) + (input.endsWith('.') ? '.' : '') : '0'}</span>
        </div>
        {targets.map((c) => (
          <div key={c} className="display-out">
            <MoneyText amount={convert(amount, from, c, effective, feePct)} currency={c} />
          </div>
        ))}
      </div>

      <div className="rate-line">
        <span>
          {t('money.rateFrom', { date })} · {source}
          {feePct > 0 && ` · +${feePct}%`}
        </span>
        <button className="link" onClick={refresh} disabled={state === 'busy'}>
          {state === 'busy' ? t('money.refreshing') : `↻ ${t('money.refresh')}`}
        </button>
      </div>
      {state === 'failed' && <div className="note">{t('money.refreshFailed')}</div>}

      <div className="keypad">
        {keys.map((k) => (
          <button key={k} className="key" onClick={() => press(k)} aria-label={k === '⌫' ? t('money.backspace') : k}>
            {k}
          </button>
        ))}
        <button className="key wide" onClick={() => setInput('')}>{t('money.clear')}</button>
      </div>

      {yen > 0 && (
        <section className="panel">
          <h3>🧾 {t('money.taxFree')}</h3>
          <label className="check">
            <input type="checkbox" checked={includesTax} onChange={(e) => setIncludesTax(e.target.checked)} />
            {t('money.includesTax')}
          </label>
          <p className={tax.eligible ? 'ok' : 'muted'}>
            {tax.eligible ? (
              <>{fill(t('money.eligible', { amount: '\u0000' }), <MoneyText amount={tax.saving} currency="JPY" />)}</>
            ) : (
              <>{fill(t('money.notEligible', { amount: '\u0000' }), <MoneyText amount={TAX_FREE_MIN_PRETAX - tax.preTax} currency="JPY" />)}</>
            )}
          </p>
        </section>
      )}

      <section className="panel">
        <h3>{t('money.anchors')}</h3>
        <table className="anchors">
          <tbody>
            {ANCHORS.map((a) => (
              <tr key={a}>
                <td><MoneyText amount={a} currency="JPY" /></td>
                <td><MoneyText amount={convert(a, 'JPY', 'ILS', effective, feePct)} currency="ILS" /></td>
                <td><MoneyText amount={convert(a, 'JPY', 'USD', effective, feePct)} currency="USD" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <details className="panel">
        <summary>⚙️ {t('money.settings')}</summary>
        <label className="field">
          <span>{t('money.fee')} (%)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={10}
            step={0.5}
            value={feePct}
            onChange={(e) => {
              const v = Math.max(0, Math.min(10, parseFloat(e.target.value) || 0))
              setFeePct(v)
              save('jc.feePct', v)
            }}
          />
          <small>{t('money.feeHint')}</small>
        </label>
        <label className="field">
          <span>{t('money.manualRate')}</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            placeholder={(rates.ILS * 1000).toFixed(2)}
            value={manual}
            onChange={(e) => {
              setManual(e.target.value)
              save('jc.manualIlsPer1000', e.target.value)
            }}
          />
          <small>{t('money.manualHint')}</small>
        </label>
      </details>
    </div>
  )
}

/** Puts a React node where the \u0000 placeholder was in a translated sentence. */
function fill(text: string, node: ReactNode) {
  const [before, after] = text.split('\u0000')
  return (
    <>
      {before}
      {node}
      {after}
    </>
  )
}
