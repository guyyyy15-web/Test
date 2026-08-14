/** HP/MP/XP meter. Turns red below a quarter when `warnLow` is set. */
export function Bar({ value, max, kind = 'hp', warnLow = kind === 'hp' }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const low = warnLow && ratio <= 0.25
  return (
    <div
      className="bar"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`bar__fill bar__fill--${low ? 'low' : kind}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}

export default Bar
