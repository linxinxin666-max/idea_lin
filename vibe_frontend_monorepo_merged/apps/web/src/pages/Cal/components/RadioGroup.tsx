interface RadioGroupProps {
  label?: string
  name: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  className?: string
  horizontal?: boolean
  segmented?: boolean
  span?: boolean
}

export function RadioGroup({ label, name, options, value, onChange, className, horizontal = true, segmented = false, span = true }: RadioGroupProps) {
  return (
    <div className={`form-row ${span ? 'form-row-span' : ''} ${className || ''}`.trim()}>
      {label && <label>{label}</label>}
      <div className={`radio-group ${horizontal ? '' : 'vertical'} ${segmented ? 'segmented' : ''}`}>
        {options.map((option) => (
          <label key={option.value} className="radio-item">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}
