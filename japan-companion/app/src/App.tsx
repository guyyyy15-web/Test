import { useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import { PhrasesView } from './features/phrases/PhrasesView'
import { BuilderView } from './features/builder/BuilderView'
import { SignsView } from './features/signs/SignsView'
import { MoneyView } from './features/money/MoneyView'
import { GuideView } from './features/guide/GuideView'
import { useI18n } from './i18n'
import { load, save } from './lib/storage'

const TAB_KEY = 'jc.tab'

export function App() {
  const { t, lang, setLang } = useI18n()
  const [tab, setTabState] = useState<Tab>(() => load<Tab>(TAB_KEY, 'phrases'))
  const setTab = (next: Tab) => {
    setTabState(next)
    save(TAB_KEY, next)
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="logo" aria-hidden>⛩️</span> {t('app.title')}
        </h1>
        <button className="lang" onClick={() => setLang(lang === 'he' ? 'en' : 'he')}>
          {t('app.langToggle')}
        </button>
      </header>
      <main>
        {tab === 'phrases' && <PhrasesView />}
        {tab === 'builder' && <BuilderView />}
        {tab === 'signs' && <SignsView />}
        {tab === 'money' && <MoneyView />}
        {tab === 'guide' && <GuideView />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
