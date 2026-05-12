import type { RoiState, RoiResult } from '../types'
import { toNum, clampPercent, clampNonNegative } from '../utils/numbers'

export function calculateRoi(s: RoiState): RoiResult {
  const price = toNum(s.rawPrice)
  const cost = clampNonNegative(toNum(s.cost))
  const marginRate =
    s.marginRate === null || s.marginRate === undefined
      ? price > 0
        ? (price - cost - price * clampPercent(toNum(s.commissionRate))) / price
        : 0
      : clampPercent(toNum(s.marginRate))
  const ordersBefore = clampNonNegative(Math.round(toNum(s.ordersBefore)))
  const growthRatio = clampNonNegative(toNum(s.growthRatio))
  const customerPayPrice =
    s.customerPayPrice === null || s.customerPayPrice === undefined ? price : clampNonNegative(toNum(s.customerPayPrice))
  const discountPerOrder = Math.max(0, price - customerPayPrice)
  const discountRatio = price > 0 ? discountPerOrder / price : 0
  const totalDiscount = ordersBefore * discountPerOrder
  const profitPerOrderBefore = price * marginRate
  const profitPerOrderAfter = profitPerOrderBefore - discountPerOrder
  const orderIncrement = ordersBefore * growthRatio
  const rewardIncome = orderIncrement * profitPerOrderAfter
  const baseProfitBefore = ordersBefore * profitPerOrderBefore
  const profitAfter = ordersBefore * (1 + growthRatio) * profitPerOrderAfter
  const profitDelta = profitAfter - baseProfitBefore
  const roi = totalDiscount > 0 ? rewardIncome / totalDiscount : 0
  const growthDenominator = marginRate - discountRatio
  const requiredGrowth = discountRatio > 0 && Math.abs(growthDenominator) > 1e-9 ? discountRatio / growthDenominator : 0
  const ordersAfter = ordersBefore * (1 + growthRatio)
  const isBreakEven = profitAfter >= baseProfitBefore

  return {
    discountPerOrder,
    discountRatio,
    totalDiscount,
    profitPerOrderBefore,
    profitPerOrderAfter,
    orderIncrement,
    ordersAfter,
    baseProfitBefore,
    profitAfter,
    rewardIncome,
    profitDelta,
    roi,
    requiredGrowth,
    isBreakEven,
  }
}

export function buildRoiCopyText(s: RoiState, res: RoiResult): string {
  const roiText = res.totalDiscount > 0 ? res.roi.toFixed(2) : 'N/A'
  const safeRequiredGrowth = Math.max(0, res.requiredGrowth)
  const breakEvenGrowthText = `${(safeRequiredGrowth * 100).toFixed(2)}%`
  const nearZeroThreshold = Math.max(50, Math.abs(res.baseProfitBefore) * 0.03)
  const isThinMarginCase = res.profitDelta >= 0 && res.profitDelta <= nearZeroThreshold && (res.totalDiscount <= 0 || res.roi >= 0.6)
  const isHighGainCase = res.profitDelta > nearZeroThreshold
  const roiPhrase =
    res.totalDiscount > 0
      ? `投入产出比（ROI）能跑到 ${roiText}`
      : '当前几乎没有折扣补贴压力，增量利润基本都能沉淀下来'

  if (isHighGainCase) {
    return `老板，帮您把这波活动的盘子精算了一下！如果按咱们 ${s.rawPrice} 元的价格上活动，预计能帮门店额外撬动 ${res.profitDelta.toFixed(2)} 元的总利润增量！这笔账非常划算，${roiPhrase}。而且您放心，底线我也帮您算好了：只要活动后单量比平时涨 ${breakEvenGrowthText}，咱们就是纯赚不亏。现在的方案利润空间很好，建议直接推进。`
  }

  if (isThinMarginCase) {
    return `老板，这档活动的盈亏底线我帮您盘清了。咱们这次主打用 ${s.rawPrice} 元的诚意价去冲一波单量。按测算，只要单量能拉动 ${breakEvenGrowthText} 以上，总利润就能稳稳盖住平时收益。相当于咱们是用较低成本在做揽客拉新，${roiPhrase}，营销风险可控，是个获客机会，您看这个力度咱们推进吗？`
  }

  return `老板，这个方案我已经帮您算过了：当前收益增量 ${res.profitDelta.toFixed(2)} 元，ROI ${roiText}，还没有达到理想盈利区间。建议先把折扣再收一点，或者把目标单量涨幅再抬高后再推进，我可以按新参数马上给您复算一版。`
}

export const DEFAULT_ROI_STATE: RoiState = {
  rawPrice: 0,
  cost: 0,
  marginRate: null,
  customerPayPrice: null,
  ordersBefore: 0,
  growthRatio: 0,
  industry: '',
  categoryL1: '',
  categoryL2: '',
  categoryL3: '',
  commissionRule: '',
  rateGroup: 0.025,
  poiL1: '游玩',
  poiL2: '景点',
  poiL3: '其他三级类目',
  commissionRate: 0.025,
  commissionRateEdited: false,
}
