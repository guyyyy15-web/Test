import { useI18n } from '../i18n'
import type { Key } from '../i18n/en'

export type Tab = 'phrases' | 'builder' | 'signs' | 'money' | 'guide'

const TABS: { id: Tab; icon: string; key: Key }[] = [
  { id: 'phrases', icon: '💬', key: 'tab.phrases' },
  { id: 'builder', icon: '🧩', key: 'tab.builder' },
  { id: 'signs', icon: '🈯', key: 'tab.signs' },
  { id: 'money', icon: '💴', key: 'tab.money' },
  { id: 'guide', icon: '🧭', key: 'tab.guide' },
]

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { t } = useI18n()
  return (
    <nav className="tabbar">
      {TABS.map((x) => (
        <button
          key={x.id}
          className={x.id === tab ? 'tab active' : 'tab'}
          aria-current={x.id === tab ? 'page' : undefined}
          onClick={() => onChange(x.id)}
        >
          <span className="tab-icon" aria-hidden>{x.icon}</span>
          <span>{t(x.key)}</span>
        </button>
      ))}
    </nav>
  )
}
