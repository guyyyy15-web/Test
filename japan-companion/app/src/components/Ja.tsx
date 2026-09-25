import type { ReactNode } from 'react'

/** Japanese text: correct font and never reordered inside Hebrew. */
export function Ja({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span lang="ja" dir="ltr" className={`ja ${className}`}>
      {children}
    </span>
  )
}
