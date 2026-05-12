import { useEffect, useState, type ChangeEvent, type FocusEvent, type ReactNode } from 'react'
import { formatInputNumber } from '../utils/numbers'

interface InputFieldProps {
  label: string
  value: number | string
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  hint?: string
  labelAdornment?: ReactNode
  percent?: boolean
  disabled?: boolean
  allowEmpty?: boolean
  onEmpty?: () => void
  suffix?: string
  zeroAsEmpty?: boolean
}

const isTransientNumberInput = (raw: string): boolean => raw === '-' || raw === '.' || raw === '-.'

const toDraftValue = (value: number | string, zeroAsEmpty = false): string => {
  if (typeof value === 'number') {
    if (zeroAsEmpty && Math.abs(value) < 1e-9) {
      return ''
    }
    return formatInputNumber(value)
  }
  return String(value ?? '')
}

export function InputField({
  label,
  value,
  onChange,
  className,
  placeholder,
  hint,
  labelAdornment,
  percent = false,
  disabled = false,
  allowEmpty = false,
  onEmpty,
  suffix,
  zeroAsEmpty = false,
}: InputFieldProps) {
  const [draft, setDraft] = useState<string>(() => toDraftValue(value, zeroAsEmpty))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDraft(toDraftValue(value, zeroAsEmpty))
    }
  }, [value, isFocused, zeroAsEmpty])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDraft(raw)

    if (raw.trim() === '') {
      if (allowEmpty) {
        onEmpty?.()
      } else {
        onChange(0)
      }
      return
    }

    if (isTransientNumberInput(raw)) return

    const num = Number(raw)
    if (Number.isFinite(num)) {
      onChange(num)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    const raw = e.target.value.trim()

    if (raw === '') {
      if (allowEmpty) {
        setDraft('')
        onEmpty?.()
      } else {
        setDraft(zeroAsEmpty ? '' : '0')
        onChange(0)
      }
      return
    }

    if (isTransientNumberInput(raw)) {
      setDraft(toDraftValue(value, zeroAsEmpty))
      return
    }

    const num = Number(raw)
    if (!Number.isFinite(num)) {
      setDraft(toDraftValue(value, zeroAsEmpty))
      return
    }

    onChange(num)
    setDraft(zeroAsEmpty && Math.abs(num) < 1e-9 ? '' : formatInputNumber(num))
  }

  const suffixText = percent ? '%' : suffix

  return (
    <div className={`form-row ${className || ''}`.trim()}>
      <label className="form-label">
        <span>{label}</span>
        {labelAdornment}
      </label>
      {suffixText ? (
        <div className="input-wrapper-suffix">
          <input
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
          />
          <span className="input-suffix">{suffixText}</span>
        </div>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}
