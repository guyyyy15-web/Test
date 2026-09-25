type Sentinel = { release: () => Promise<void> }

/** Keeps the screen on while a show-card is open. Unsupported or refused → silently does nothing. */
export async function keepAwake(): Promise<() => void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }
    const sentinel = await nav.wakeLock?.request('screen')
    return () => void sentinel?.release().catch(() => {})
  } catch {
    return () => {}
  }
}
