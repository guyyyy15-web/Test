import { useMemo, useState } from 'react'
import { SIGN_PLACES, signs, type SignPlace } from '../../content'
import { Chips } from '../../components/Chips'
import { Ja } from '../../components/Ja'
import { useI18n } from '../../i18n'
import { matches } from '../../lib/search'

type Filter = 'all' | SignPlace

export function SignsView() {
  const { t, pick } = useI18n()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim()
    return signs.filter((s) =>
      q ? matches(q, [s.kanji, s.reading, s.romaji, s.he, s.en]) : filter === 'all' || s.where === filter,
    )
  }, [query, filter])

  const chips = [
    { id: 'all' as Filter, label: t('signs.all') },
    ...SIGN_PLACES.map((p) => ({ id: p as Filter, label: t(`place.${p}`) })),
  ]

  return (
    <div className="view">
      <input
        className="search"
        type="search"
        placeholder={t('signs.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!query.trim() && <Chips items={chips} value={filter} onChange={setFilter} />}
      {list.length === 0 ? (
        <p className="empty">{t('phrases.noResults')}</p>
      ) : (
        <ul className="signs">
          {list.map((s) => (
            <li key={s.id} className="sign">
              <Ja className="sign-kanji">{s.kanji}</Ja>
              <div className="sign-text">
                <div className="sign-meaning">{pick(s)}</div>
                <div className="sign-reading">
                  <Ja>{s.reading}</Ja> · <span dir="ltr">{s.romaji}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
