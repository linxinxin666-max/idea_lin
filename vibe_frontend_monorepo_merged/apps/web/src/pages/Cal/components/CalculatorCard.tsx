import type { MouseEvent, ReactNode } from 'react'
import type { CalculatorId } from '../types'

interface CalculatorCardProps {
  id: CalculatorId
  icon: ReactNode
  title: string
  badge: string
  description: string
  contributor: string
  contributorLabel?: string
  badgeTone?: 'finance' | 'marketingOrange' | 'marketingPurple' | 'communication' | 'performance'
  tone?: 'blue' | 'green' | 'orange' | 'cyan' | 'indigo'
  onClick: () => void
}

export function CalculatorCard({
  id,
  icon,
  title,
  badge,
  description,
  contributor,
  contributorLabel = '计算器开发者：',
  badgeTone = 'finance',
  tone = 'blue',
  onClick,
}: CalculatorCardProps) {
  const handleCardClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onClick()
  }

  return (
    <a
      className="hub-card"
      data-open-calc={id}
      data-tone={tone}
      href={`#calc-${id}`}
      onClick={handleCardClick}
      aria-label={`进入${title}`}
    >
      <div className="hub-card-top">
        <div className="hub-icon">{icon}</div>
        <div>
          <div className="hub-badge" data-badge-tone={badgeTone}>{badge}</div>
          <div className="hub-title">{title}</div>
        </div>
      </div>
      <div className="hub-desc">{description}</div>
      <div className="hub-card-foot">
        <div className="hub-action">
          <span>开始测算</span>
          <span className="hub-action-arrow" aria-hidden="true">→</span>
        </div>
        <div className="hub-contributor">
          <span className="hub-contributor-label">{contributorLabel}</span>
          <span className="hub-contributor-name">{contributor}</span>
        </div>
      </div>
    </a>
  )
}
