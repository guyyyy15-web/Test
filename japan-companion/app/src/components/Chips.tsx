export interface Chip<T extends string> {
  id: T
  label: string
}

export function Chips<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Chip<T>[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="chips" role="tablist">
      {items.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === value}
          className={c.id === value ? 'chip active' : 'chip'}
          onClick={() => onChange(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
