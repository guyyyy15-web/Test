import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type Key } from './en'
import { he } from './he'
import { load, save } from '../lib/storage'
import type { Lang } from '../lib/money'

const DICTS: Record<Lang, Record<Key, string>> = { en, he }
const LANG_KEY = 'jc.lang'

export function translate(lang: Lang, key: Key, vars?: Record<string, string>): string {
  let s = DICTS[lang][key]
  for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, v)
  return s
}

interface I18n {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: Key, vars?: Record<string, string>) => string
  /** Picks the he/en field of a bilingual content object. */
  pick: (bi: { he: string; en: string }) => string
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => load<Lang>(LANG_KEY, 'he'))

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    document.title = translate(lang, 'app.title')
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    save(LANG_KEY, l)
  }, [])

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      pick: (bi) => bi[lang],
    }),
    [lang, setLang],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}
