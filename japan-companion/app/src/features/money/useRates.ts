import { useCallback, useEffect, useState } from 'react'
import { loadRates, refreshRates, type Rates } from '../../lib/money'

export type RefreshState = 'idle' | 'busy' | 'failed'

export function useRates() {
  const [rates, setRates] = useState<Rates>(loadRates)
  const [state, setState] = useState<RefreshState>('idle')

  const refresh = useCallback(async (force: boolean) => {
    setState('busy')
    const fresh = await refreshRates(force)
    if (fresh) setRates(fresh)
    setState(!fresh && force ? 'failed' : 'idle')
  }, [])

  useEffect(() => {
    // Silent background refresh on open; throttled to every 12 h inside refreshRates.
    refreshRates(false).then((fresh) => fresh && setRates(fresh))
  }, [])

  return { rates, state, refresh: () => refresh(true) }
}
