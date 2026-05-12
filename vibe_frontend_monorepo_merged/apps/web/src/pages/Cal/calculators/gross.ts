import type { GrossState, GrossResult, Tool } from '../types'
import { toNum, clampPercent, clampNonNegative, PLATFORM_COUPON_DIVISOR } from '../utils/numbers'

export const DEFAULT_GROSS_PRICE_TOOLS: Tool[] = [
  { name: '秒杀', price: 0 },
  { name: '超值团', price: 0 },
  { name: '获客卡', price: 0 },
]

export function calculateGross(s: GrossState): GrossResult {
  const price = toNum(s.rawPrice)
  const toolPrices = s.tools.map((t: Tool) => toNum(t.price)).filter((v: number) => v > 0)
  const minPromo = toolPrices.length ? Math.min(...toolPrices) : price
  const couponMerchant = clampNonNegative(toNum(s.couponMerchant))
  const platformCoupon = Math.floor(couponMerchant / PLATFORM_COUPON_DIVISOR)
  const merchantTakeHome = clampNonNegative(minPromo - couponMerchant)
  const platformCommission = merchantTakeHome * clampPercent(toNum(s.commissionRate))
  const promoteFee = merchantTakeHome * clampPercent(toNum(s.cpsRate))
  const totalCommission = platformCommission + promoteFee
  const finalIncome = merchantTakeHome - totalCommission
  const grossProfit = finalIncome - clampNonNegative(toNum(s.cost))
  const margin = price > 0 ? grossProfit / price : 0

  return {
    minPromo,
    couponMerchant,
    platformCoupon,
    merchantTakeHome,
    platformCommission,
    totalCommission,
    finalIncome,
    grossProfit,
    margin,
  }
}

export function buildGrossCopyText(s: GrossState, res: GrossResult): string {
  const costText =
    toNum(s.cost) > 0
      ? `，按参考成本 ${toNum(s.cost).toFixed(2)} 元测算，毛利额 ${res.grossProfit.toFixed(2)} 元，毛利率 ${(res.margin * 100).toFixed(1)}%`
      : '，当前未录入参考成本，毛利率暂不展示'

  return `老板，这个方案按商家口径已经算过了：团购价 ${toNum(s.rawPrice).toFixed(2)} 元，商家到手价 ${res.merchantTakeHome.toFixed(2)} 元，团购佣金率 ${(toNum(s.commissionRate) * 100).toFixed(2)}%，增量宝涨佣CPS ${(toNum(s.cpsRate) * 100).toFixed(0)}%，佣金合计支出 ${res.totalCommission.toFixed(2)} 元，预计收入金额 ${res.finalIncome.toFixed(2)} 元${costText}。`
}

export const DEFAULT_GROSS_STATE: GrossState = {
  rawPrice: 0,
  cost: 0,
  tools: DEFAULT_GROSS_PRICE_TOOLS,
  couponMerchant: 0,
  industry: '',
  categoryL1: '',
  categoryL2: '',
  categoryL3: '',
  categoryPath: [],
  commissionRate: 0.025,
  serviceFee: 0,
  cpsRate: 0,
  promoteFee: 0,
  productType: 'group',
  rateGroup: 0.025,
  rateCard: null,
  commissionRule: '',
  poiL1: '游玩',
  poiL2: '景点',
  poiL3: '其他三级类目',
}
