import { useState } from 'react'

interface InfoTipProps {
  text: string
  label?: string
}

export function InfoTip({ text, label = '查看字段说明' }: InfoTipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="info-tip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        className="info-tip"
        aria-label={label}
        aria-expanded={visible}
        onClick={(event) => {
          event.preventDefault()
          setVisible((current) => !current)
        }}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        ?
      </button>
      {visible && (
        <span className="info-tip-pop" role="tooltip">
          {text}
        </span>
      )}
    </span>
  )
}
