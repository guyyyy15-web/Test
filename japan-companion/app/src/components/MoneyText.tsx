import { formatMoney, type Currency } from '../lib/money'
import { useI18n } from '../i18n'

/** An amount isolated with <bdi> so the symbol stays on the right side inside Hebrew text. */
export function MoneyText({ amount, currency }: { amount: number; currency: Currency }) {
  const { lang } = useI18n()
  return <bdi className="money">{formatMoney(amount, currency, lang)}</bdi>
}
