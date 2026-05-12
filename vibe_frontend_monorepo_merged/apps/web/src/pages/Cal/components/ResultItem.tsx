interface ResultItemProps {
  label: string
  value: string
  highlight?: boolean
  hint?: string
}

export function ResultItem({ label, value, highlight = false, hint }: ResultItemProps) {
  return (
    <div className="res-item">
      <span className="res-label">
        {label}
        {hint && <span className="hint-badge">{hint}</span>}
      </span>
      <span className={`res-val ${highlight ? 'highlight' : ''}`}>{value}</span>
    </div>
  )
}
