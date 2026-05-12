interface BackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button className="back-btn" onClick={onClick}>
      ← 返回门户
    </button>
  )
}
