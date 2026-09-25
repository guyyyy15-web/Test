import { useMemo, useState } from 'react'
import { PATTERNS, type Pattern, type PatternGroup, type WordType } from '../../content/patterns'
import { Ja } from '../../components/Ja'
import { ShowCard, type CardContent } from '../../components/ShowCard'
import { useI18n } from '../../i18n'
import type { Key } from '../../i18n/en'
import { build, customWord, fits, MAX_COUNT, VOCAB, wordsFor, type Word } from '../../lib/builder'
import { matches } from '../../lib/search'
import { canSpeak, speakJapanese } from '../../lib/speech'
import { load, save } from '../../lib/storage'

const GROUPS: PatternGroup[] = ['around', 'order', 'requests', 'problems']
const HEADING: Record<Exclude<WordType, 'custom'>, Key> = {
  place: 'type.place',
  'pointer-place': 'type.pointer',
  this: 'type.pointer',
  thing: 'type.thing',
  food: 'type.food',
  drink: 'type.drink',
  ingredient: 'type.ingredient',
  body: 'type.body',
  belonging: 'type.belonging',
  usable: 'type.usable',
  works: 'type.usable',
  sight: 'type.sight',
  fixture: 'type.fixture',
  rentable: 'type.rentable',
  amenity: 'type.amenity',
  vehicle: 'type.vehicle',
  request: 'type.request',
  'may-i': 'type.may-i',
}

interface Recent {
  p: string
  w: string // word id, or "custom:<text>"
  n: number
}
const RECENT_KEY = 'jc.builderRecent'
const MAX_RECENT = 8

function resolveWord(ref: string): Word | undefined {
  return ref.startsWith('custom:') ? customWord(ref.slice(7)) : VOCAB.find((v) => v.id === ref)
}

export function BuilderView() {
  const { t, lang, pick } = useI18n()
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0])
  const [word, setWord] = useState<Word | null>(null)
  const [count, setCount] = useState(1)
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState('')
  const [recent, setRecent] = useState<Recent[]>(() => load<Recent[]>(RECENT_KEY, []))
  const [card, setCard] = useState<CardContent | null>(null)

  const choosePattern = (p: Pattern) => {
    setPattern(p)
    setCount(1)
    if (word && !fits(p, word)) setWord(null)
  }

  const chooseWord = (w: Word, n = count) => {
    setWord(w)
    const entry: Recent = { p: pattern.id, w: w.id === 'custom' ? `custom:${w.ja}` : w.id, n }
    const next = [entry, ...recent.filter((r) => !(r.p === entry.p && r.w === entry.w && r.n === entry.n))].slice(0, MAX_RECENT)
    setRecent(next)
    save(RECENT_KEY, next)
  }

  const changeCount = (n: number) => {
    const next = Math.min(MAX_COUNT, Math.max(1, n))
    setCount(next)
    if (word) chooseWord(word, next)
  }

  const restore = (r: Recent) => {
    const p = PATTERNS.find((x) => x.id === r.p)
    const w = resolveWord(r.w)
    if (!p || !w) return
    setPattern(p)
    setWord(w)
    setCount(r.n)
  }

  // Words for this frame, grouped under the first accepted type they have.
  const sections = useMemo(() => {
    const q = query.trim()
    const list = wordsFor(pattern).filter((w) => !q || matches(q, [w.en, w.he, w.ja, w.kana, w.romaji]))
    const byHeading = new Map<Key, Word[]>()
    for (const w of list) {
      const type = w.types.find((x) => pattern.accepts.includes(x)) as Exclude<WordType, 'custom'>
      const key = HEADING[type]
      byHeading.set(key, [...(byHeading.get(key) ?? []), w])
    }
    return [...byHeading.entries()]
  }, [pattern, query])

  const result = word ? build(pattern, word, count) : null
  const allowsCustom = pattern.accepts.includes('custom')

  return (
    <div className="view builder">
      {recent.length > 0 && (
        <section>
          <h3 className="step">{t('builder.recent')}</h3>
          <div className="chips">
            {recent.map((r, i) => {
              const p = PATTERNS.find((x) => x.id === r.p)
              const w = resolveWord(r.w)
              if (!p || !w) return null
              return (
                <button key={i} className="chip" onClick={() => restore(r)}>
                  <Ja>{build(p, w, r.n).ja}</Ja>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="step">① {t('builder.step1')}</h3>
        {GROUPS.map((g) => (
          <div key={g} className="frame-group">
            <div className="frame-group-title">{t(`group.${g}`)}</div>
            <div className="frames">
              {PATTERNS.filter((p) => p.group === g).map((p) => (
                <button
                  key={p.id}
                  className={p.id === pattern.id ? 'frame active' : 'frame'}
                  aria-pressed={p.id === pattern.id}
                  onClick={() => choosePattern(p)}
                >
                  {pick(p.label)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="step">② {t('builder.step2')}</h3>
        <input
          className="search"
          type="search"
          placeholder={t('builder.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {sections.map(([heading, words]) => (
          <div key={heading} className="word-group">
            <div className="frame-group-title">{t(heading)}</div>
            <div className="words">
              {words.map((w) => (
                <button
                  key={w.id}
                  className={word?.id === w.id ? 'word active' : 'word'}
                  aria-pressed={word?.id === w.id}
                  onClick={() => chooseWord(w)}
                >
                  <span>{lang === 'he' ? w.he : w.en}</span>
                  <Ja className="word-ja">{w.ja}</Ja>
                </button>
              ))}
            </div>
          </div>
        ))}
        {sections.length === 0 && <p className="empty">{t('phrases.noResults')}</p>}

        {allowsCustom && (
          <form
            className="custom"
            onSubmit={(e) => {
              e.preventDefault()
              if (custom.trim()) chooseWord(customWord(custom))
            }}
          >
            <label className="frame-group-title" htmlFor="custom-word">{t('builder.custom')}</label>
            <div className="custom-row">
              <input
                id="custom-word"
                className="search"
                value={custom}
                placeholder="Kinkakuji / 金閣寺"
                onChange={(e) => setCustom(e.target.value)}
              />
              <button className="frame active" type="submit" disabled={!custom.trim()}>{t('builder.use')}</button>
            </div>
            <small className="muted">{t('builder.customHint')}</small>
          </form>
        )}
      </section>

      {result && word && (
        <section className="builder-result" aria-live="polite">
          <div className="meaning">{lang === 'he' ? result.he : result.en}</div>
          <Ja className="ja-line">{result.ja}</Ja>
          <div className="pron">
            {lang === 'he' && <span>{result.he_pron}</span>}
            <span className="romaji" dir="ltr">{result.romaji}</span>
          </div>
          <div className="actions">
            {pattern.count && (
              <div className="stepper" role="group" aria-label={t('builder.count')}>
                <button className="icon" onClick={() => changeCount(count - 1)} aria-label="−">−</button>
                <span className="stepper-n">{count}</span>
                <button className="icon" onClick={() => changeCount(count + 1)} aria-label="+">+</button>
              </div>
            )}
            {canSpeak() && (
              <button className="icon" aria-label={t('phrases.speak')} onClick={() => speakJapanese(result.kana)}>🔊</button>
            )}
            <button
              className="icon"
              aria-label={t('phrases.show')}
              onClick={() => setCard({ ja: result.ja, kana: result.kana, romaji: result.romaji, meaning: lang === 'he' ? result.he : result.en })}
            >
              🪧
            </button>
          </div>
        </section>
      )}
      {card && <ShowCard card={card} onClose={() => setCard(null)} />}
    </div>
  )
}
