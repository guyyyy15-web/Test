/** Case- and accent-insensitive "every word appears somewhere" match. */
export function matches(query: string, fields: string[]): boolean {
  const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-֑ͯ-ׇ']/g, '')
  const hay = norm(fields.join(' '))
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w))
}
