import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'danger' | 'secondary'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

export function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button', className }: ButtonProps) {
  const variantClass = variant === 'danger' ? 'btn-danger' : variant === 'secondary' ? 'btn-secondary' : ''

  return (
    <button
      className={`btn ${variantClass} ${className || ''}`.trim()}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  )
}
