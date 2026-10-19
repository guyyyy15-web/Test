// localStorage that never throws (private mode, blocked storage, previews).

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`kc:${key}`)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`kc:${key}`, JSON.stringify(value))
  } catch {
    /* storage unavailable: settings just won't persist */
  }
}
