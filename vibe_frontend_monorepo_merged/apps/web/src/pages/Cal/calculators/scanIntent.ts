import type { ScanIntentResult, ScanIntentState } from '../types'
import { clampNonNegative, clampPercent, toNum } from '../utils/numbers'

const safeDivide = (numerator: number, denominator: number): number => {
  return denominator > 0 ? numerator / denominator : 0
}

export function calculateScanIntent(s: ScanIntentState): ScanIntentResult {
  const avgOrderValue = clampNonNegative(toNum(s.avgOrderValue))
  const incrementalCustomers = clampNonNegative(toNum(s.incrementalCustomers))
  const commissionRate = clampPercent(toNum(s.commissionRate))
  const channelFeeRate = clampPercent(toNum(s.channelFeeRate))
  const growthRate = clampNonNegative(toNum(s.growthRate))

  const transactionAmount = avgOrderValue * incrementalCustomers
  const commissionCost = s.mode === 'exempt' ? 0 : transactionAmount * commissionRate
  const channelFeeCost = s.mode === 'exempt' ? transactionAmount * channelFeeRate : 0
  const scanCost = commissionCost + channelFeeCost
  const gmvIncrement = transactionAmount * growthRate
  const gmvCostMultiple = safeDivide(gmvIncrement, scanCost)
  const estimatedFans = incrementalCustomers

  return {
    transactionAmount,
    commissionCost,
    channelFeeCost,
    scanCost,
    gmvIncrement,
    gmvCostMultiple,
    estimatedFans,
  }
}

export function buildScanIntentCopyText(s: ScanIntentState, res: ScanIntentResult): string {
  const roundedMultiple = Math.round(res.gmvCostMultiple)
  const policyText =
    s.mode === 'exempt'
      ? `免佣，仅收 ${formatPercentText(s.channelFeeRate)} 通道费`
      : `不免佣，按 ${formatPercentText(s.commissionRate)} 佣金收取`

  return `老板，我知道您是担心扫码上翻之后的佣金成本，我来帮您算一笔账。

举个例子，咱们以您最常见的商品为例，单价是「${formatCurrencyText(s.avgOrderValue)}」，假设咱们上翻「${formatCountText(s.incrementalCustomers)}」个顾客，顾客如果想要领取优惠券需要关注店铺，那您就涨了「${formatCountText(res.estimatedFans)}」个粉丝。

另外咱们行业当前的佣金政策是「${policyText}」，您上翻后，扫码的成本是「${formatCurrencyText(res.scanCost)}」，您的交易额是「${formatCurrencyText(res.transactionAmount)}」，预估您的交易额能增长 ${formatPercentText(s.growthRate, 0)} 的话，增长的交易额是「${formatCurrencyText(res.gmvIncrement)}」，那么比起成本，您投入了「${formatCurrencyText(res.scanCost)}」成本，达到了「${formatCurrencyText(res.gmvIncrement)}」交易额增长，是「${roundedMultiple} 倍」的增长。

总结一下，您上翻后，交易额预估会有「${roundedMultiple} 倍」的增长，预估还会长「${formatCountText(res.estimatedFans)}」个粉丝，另外这些都是您的目标人群精准粉丝，算法会识别后给您推送更大的流量，这些顾客线上下单留下优质评价，对于您的评价和榜单排名都是正向帮助。扫码对您的流量是指数级的增长。您不做，淡季的流量从哪来？同行都开始做了，晚做一天，您就损失了很多的流量啊。`
}

const formatCurrencyText = (value: number): string => {
  const rounded = Math.round(value * 100) / 100
  const isInteger = Math.abs(rounded - Math.round(rounded)) < 1e-9
  return `${rounded.toLocaleString('zh-CN', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  })}元`
}
const formatCountText = (value: number): string => `${Math.round(value).toLocaleString('zh-CN')}`
const formatPercentText = (ratio: number, decimals = 2): string => `${(ratio * 100).toFixed(decimals)}%`

export const DEFAULT_SCAN_INTENT_STATE: ScanIntentState = {
  mode: 'exempt',
  avgOrderValue: 200,
  incrementalCustomers: 10,
  commissionRate: 0.025,
  channelFeeRate: 0.006,
  growthRate: 0.2,
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
