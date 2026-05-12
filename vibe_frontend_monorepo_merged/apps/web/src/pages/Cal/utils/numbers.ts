export const toNum = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export const clampPercent = (v: number): number => Math.max(0, Math.min(1, v))
export const clampNonNegative = (v: number): number => Math.max(0, v)

export const formatNumber = (n: number, decimals = 2): string => {
  return n.toFixed(decimals)
}

export const formatPercent = (n: number, decimals = 2): string => {
  return (n * 100).toFixed(decimals) + '%'
}

export const formatInputNumber = (n: number, maxDecimals = 6): string => {
  if (!Number.isFinite(n)) return ''
  const s = n.toFixed(maxDecimals).replace(/\.?0+$/, '')
  return s === '' ? '0' : s
}

export const formatInputPercent = (ratio: number, maxDecimals = 2): string => {
  return formatInputNumber(ratio * 100, maxDecimals)
}

export const PLATFORM_COUPON_DIVISOR = 1.25
