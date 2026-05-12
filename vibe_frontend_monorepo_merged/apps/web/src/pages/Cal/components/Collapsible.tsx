import { useState, type ReactNode } from 'react'

interface CollapsibleProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="side-card">
      <div className="collapse-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="collapse-title">{title}</span>
        <span className="collapse-icon">{isOpen ? '▼' : '▶'}</span>
      </div>
      {isOpen && <div className="collapse-content open">{children}</div>}
    </div>
  )
}
