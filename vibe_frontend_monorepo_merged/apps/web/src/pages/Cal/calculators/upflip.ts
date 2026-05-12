import type { UpflipState, UpflipResult } from '../types'
import { toNum, clampPercent, clampNonNegative } from '../utils/numbers'
import { getScanExemptionRule } from '../data/scanExemption'

export const UPFLIP_FIXED_CHANNEL_RATE = 0.006

export function calculateUpflip(s: UpflipState): UpflipResult {
  const settlementAmount = clampNonNegative(toNum(s.settlementAmount))
  const commissionRate = clampPercent(toNum(s.commissionRate))
  const flexRebateRatio = clampNonNegative(toNum(s.flexRebateRatio))
  const summerRebateRatio = clampNonNegative(toNum(s.summerRebateRatio))
  const quarterRebateRatio = clampNonNegative(toNum(s.quarterRebateRatio))
  const totalRebateRatio = flexRebateRatio + summerRebateRatio + quarterRebateRatio
  const commissionPayableBeforeExemption = clampNonNegative(settlementAmount * commissionRate)
  const platformCommissionRateBeforeExemption = Math.max(commissionRate - UPFLIP_FIXED_CHANNEL_RATE, 0)
  const platformCommissionAmountBeforeExemption = clampNonNegative(settlementAmount * platformCommissionRateBeforeExemption)
  const channelFeeAmount = clampNonNegative(settlementAmount * UPFLIP_FIXED_CHANNEL_RATE)

  const scanExemptionRule = getScanExemptionRule(s.categoryL1, s.categoryL2)
  const scanCommissionExemptEligible = scanExemptionRule.eligible
  // 口径：录入佣金率已含固定0.6%通道费。命中免佣后仅保留0.6%通道费。
  const platformCommissionRateEffective = scanCommissionExemptEligible ? 0 : platformCommissionRateBeforeExemption
  const scanCommissionExemptRate = scanCommissionExemptEligible ? platformCommissionRateBeforeExemption : 0
  const platformCommissionAmountEffective = clampNonNegative(settlementAmount * platformCommissionRateEffective)
  const commissionPayable = scanCommissionExemptEligible ? channelFeeAmount : commissionPayableBeforeExemption
  const scanCommissionExemptAmount = clampNonNegative(settlementAmount * scanCommissionExemptRate)
  const rebateAmount = clampNonNegative(settlementAmount * platformCommissionRateEffective * totalRebateRatio)
  
  const scanAvgPrice = toNum(s.scanAvgPrice)
  const scanOrders = scanAvgPrice > 0 ? Math.round(settlementAmount / scanAvgPrice) : 0
  const perOrderIncentive = clampNonNegative(toNum(s.perOrderIncentive))
  const scanIncentive =
    scanOrders * perOrderIncentive + (s.joinDouyinPush ? clampNonNegative(toNum(s.bSubsidy)) : 0)
  const totalIncentive = clampNonNegative(rebateAmount + scanIncentive)
  const actualCost = commissionPayable - totalIncentive
  
  return {
    commissionPayable,
    commissionPayableBeforeExemption,
    platformCommissionRateBeforeExemption,
    platformCommissionRateEffective,
    platformCommissionAmountBeforeExemption,
    platformCommissionAmountEffective,
    channelFeeAmount,
    scanCommissionExemptEligible,
    scanCommissionExemptRate,
    scanCommissionExemptAmount,
    rebateAmount,
    totalRebateRatio,
    scanOrders,
    scanIncentive,
    totalIncentive,
    actualCost,
  }
}

export function buildUpflipCopyText(s: UpflipState, res: UpflipResult): string {
  const settlementAmount = s.settlementAmount.toFixed(0)
  const baseCommission = res.commissionPayableBeforeExemption.toFixed(2)
  const totalIncentive = res.totalIncentive.toFixed(2)
  const finalCost = res.actualCost.toFixed(2)
  const exemptHint = res.scanCommissionExemptEligible ? '（已命中扫码免佣，仅保留0.6%支付手续费）' : ''

  if (res.actualCost < 0) {
    return `老板，给您带个好消息！按 ${settlementAmount} 元核销金额测算，原本正常要付佣金 ${baseCommission} 元。参加激励后，平台返现和补贴合计 ${totalIncentive} 元${exemptHint}。也就是说，您这边不仅不用掏佣金，预计还能倒赚 ${Math.abs(res.actualCost).toFixed(2)} 元。`
  }

  return `老板，帮您盘清楚这波激励的底价：按 ${settlementAmount} 元核销，原本应付佣金 ${baseCommission} 元。参加活动后，平台返现和补贴合计 ${totalIncentive} 元${exemptHint}，抵扣后实际佣金成本只剩 ${finalCost} 元，成本压力明显下降。`
}

export const DEFAULT_UPFLIP_STATE: UpflipState = {
  settlementAmount: 10000,
  flexRebateRatio: 0.5,
  summerRebateRatio: 0,
  quarterRebateRatio: 0.2,
  scanAvgPrice: 39,
  commissionRate: 0.025,
  perOrderIncentive: 1,
  joinDouyinPush: false,
  bSubsidy: 0,
  industry: '',
  categoryL1: '',
  categoryL2: '',
  categoryL3: '',
  commissionRule: '',
  rateGroup: 0.025,
  poiL1: '游玩',
  poiL2: '景点',
  poiL3: '其他三级类目',
  commissionRateEdited: false,
}
