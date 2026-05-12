import type { MerchantState, MerchantResult, MerchantScenario } from '../types'
import { toNum, clampPercent, clampNonNegative } from '../utils/numbers'

export function calculateMerchant(s: MerchantState): MerchantResult {
  const rawPrice = toNum(s.rawPrice)
  const zengliangbaoRate = clampPercent(toNum(s.zengliangbaoRate))
  const huokekaDiscount = clampPercent(toNum(s.huokekaDiscount))
  const pengzhangquanMerchantContribution = clampNonNegative(toNum(s.pengzhangquanMerchantContribution))
  const categoryCommissionRate = clampPercent(toNum(s.categoryCommissionRate))
  const serviceProviderCommission = clampPercent(toNum(s.serviceProviderCommission))
  const serviceProviderZengliangbaoCommission = clampPercent(toNum(s.serviceProviderZengliangbaoCommission))
  const channelRatio1 = clampPercent(toNum(s.channelRatio1))
  const channelRatio2 = clampPercent(toNum(s.channelRatio2))
  const channelRatio3 = clampPercent(toNum(s.channelRatio3))
  const productRatioZengliangbao = clampPercent(toNum(s.productRatioZengliangbao))
  const productRatioPengzhangquan = clampPercent(toNum(s.productRatioPengzhangquan))
  const productRatioHuokeka = clampPercent(toNum(s.productRatioHuokeka))

  const calculateScenario = (hasHuokeka: boolean, hasPengzhangquan: boolean, hasZengliangbao: boolean) => {
    let priceAfterHuokeka = rawPrice
    if (hasHuokeka) {
      priceAfterHuokeka = rawPrice * huokekaDiscount
    }

    let consumerPrice = priceAfterHuokeka
    if (hasPengzhangquan) {
      consumerPrice = clampNonNegative(priceAfterHuokeka - pengzhangquanMerchantContribution)
    }

    let priceAfterZengliangbao = consumerPrice
    if (hasZengliangbao) {
      priceAfterZengliangbao = clampNonNegative(consumerPrice - consumerPrice * zengliangbaoRate)
    }

    const merchantTakeHomeBeforeService = clampNonNegative(priceAfterZengliangbao - consumerPrice * categoryCommissionRate)

    return {
      priceAfterHuokeka,
      consumerPrice,
      priceAfterZengliangbao,
      merchantTakeHomeBeforeService,
    }
  }

  const scenarios: Array<{
    name: string
    hasHuokeka: boolean
    hasPengzhangquan: boolean
    hasZengliangbao: boolean
  }> = [
    { name: '获客卡、膨胀券、增量宝同时生效', hasHuokeka: true, hasPengzhangquan: true, hasZengliangbao: true },
    { name: '获客卡和增量宝同时生效', hasHuokeka: true, hasPengzhangquan: false, hasZengliangbao: true },
    { name: '膨胀券和增量宝同时生效', hasHuokeka: false, hasPengzhangquan: true, hasZengliangbao: true },
    { name: '获客卡和膨胀券同时生效', hasHuokeka: true, hasPengzhangquan: true, hasZengliangbao: false },
    { name: '仅获客卡生效', hasHuokeka: true, hasPengzhangquan: false, hasZengliangbao: false },
    { name: '仅膨胀券生效', hasHuokeka: false, hasPengzhangquan: true, hasZengliangbao: false },
    { name: '仅增量宝生效', hasHuokeka: false, hasPengzhangquan: false, hasZengliangbao: true },
    { name: '基础团购场景（自然流量/无营销叠加）', hasHuokeka: false, hasPengzhangquan: false, hasZengliangbao: false },
  ]

  const calculateChannelSplit = (
    scenario: ReturnType<typeof calculateScenario>,
    hasHuokeka: boolean,
    hasZengliangbao: boolean,
  ) => {
    const base = scenario.merchantTakeHomeBeforeService
    const consumerPrice = scenario.consumerPrice

    let channel1 = base
    let channel2: number | null = null
    let channel3: number | null = null

    // Align with Excel: when Huokeka is active, only channel1 is used (channel2/3 are "/").
    if (hasHuokeka) {
      return { channel1, channel2, channel3, avgPrice: channel1 }
    }

    if (hasZengliangbao) {
      channel2 = base - consumerPrice * serviceProviderZengliangbaoCommission
      channel3 = base - consumerPrice * serviceProviderCommission
    } else {
      channel3 = base - consumerPrice * serviceProviderCommission
    }

    let avgPrice: number
    if (hasZengliangbao) {
      const total = channelRatio1 + channelRatio2 + channelRatio3
      avgPrice =
        total > 0
          ? (channel1 * channelRatio1 + (channel2 ?? 0) * channelRatio2 + (channel3 ?? 0) * channelRatio3) / total
          : channel1
    } else {
      const total = channelRatio1 + channelRatio3
      avgPrice =
        total > 0
          ? (channel1 * channelRatio1 + (channel3 ?? 0) * channelRatio3) / total
          : channel1
    }

    return { channel1, channel2, channel3, avgPrice }
  }

  const productRatios = [
    productRatioZengliangbao * productRatioPengzhangquan * productRatioHuokeka,
    productRatioZengliangbao * productRatioHuokeka * (1 - productRatioPengzhangquan),
    productRatioPengzhangquan * productRatioZengliangbao * (1 - productRatioHuokeka),
    productRatioHuokeka * productRatioPengzhangquan * (1 - productRatioZengliangbao),
    productRatioHuokeka * (1 - productRatioPengzhangquan) * (1 - productRatioZengliangbao),
    productRatioPengzhangquan * (1 - productRatioHuokeka) * (1 - productRatioZengliangbao),
    productRatioZengliangbao * (1 - productRatioPengzhangquan) * (1 - productRatioHuokeka),
    (1 - productRatioZengliangbao) * (1 - productRatioPengzhangquan) * (1 - productRatioHuokeka),
  ]

  const calculatedScenarios: MerchantScenario[] = scenarios.map((sc, idx) => {
    const scenarioResult = calculateScenario(sc.hasHuokeka, sc.hasPengzhangquan, sc.hasZengliangbao)
    return {
      ...sc,
      ...scenarioResult,
      channelSplit: calculateChannelSplit(scenarioResult, sc.hasHuokeka, sc.hasZengliangbao),
      productRatio: productRatios[idx],
    }
  })

  const weightedTotal = calculatedScenarios.reduce((sum, sc) => sum + sc.productRatio, 0)
  const finalTakeHome =
    weightedTotal > 0
      ? calculatedScenarios.reduce((sum, sc) => sum + sc.productRatio * sc.channelSplit.avgPrice, 0) / weightedTotal
      : 0

  return {
    scenarios: calculatedScenarios,
    weightedTotal,
    finalTakeHome,
  }
}

export function buildMerchantCopyText(s: MerchantState, res: MerchantResult): string {
  const weightedTotal = res.weightedTotal > 0 ? res.weightedTotal : 1
  const topScenario = res.scenarios.length
    ? res.scenarios.reduce((best, current) => (current.productRatio > best.productRatio ? current : best), res.scenarios[0])
    : null
  const topScenarioShare = topScenario ? ((topScenario.productRatio / weightedTotal) * 100).toFixed(1) : '0.0'
  const channelSum = s.channelRatio1 + s.channelRatio2 + s.channelRatio3
  const channelHealthy = Math.abs(channelSum - 1) <= 0.001
  const closing = channelHealthy
    ? '这个利润空间还是不错的，可以直接上。'
    : '建议先把渠道占比调到 100%，再按这个口径推进。'

  return `老板，帮您拉了下盘子。按${s.rawPrice}元团购价和${(s.categoryCommissionRate * 100).toFixed(2)}%平台佣金（已含软件服务费）来算，单笔预计入账大概 ${res.finalTakeHome.toFixed(2)} 元。当前占比最高的是“${topScenario?.name || '主导场景'}”，约 ${topScenarioShare}%，说明大部分订单的营销成本压力是可控的。${closing}`
}

export const DEFAULT_MERCHANT_STATE: MerchantState = {
  rawPrice: 69,
  zengliangbaoRate: 0.05,
  huokekaDiscount: 0.92,
  pengzhangquanMerchantContribution: 3,
  categoryCommissionRate: 0.025,
  serviceProviderCommission: 0,
  serviceProviderZengliangbaoCommission: 0,
  channelPreset: 'mid',
  channelRatio1: 0.95,
  channelRatio2: 0.05,
  channelRatio3: 0,
  productRatioZengliangbao: 0.1,
  productRatioPengzhangquan: 0.4,
  productRatioHuokeka: 0.1,
  industry: '',
  categoryL1: '',
  categoryL2: '',
  categoryL3: '',
  categoryPath: [],
  rateGroup: 0.025,
  commissionRule: '',
  poiL1: '游玩',
  poiL2: '景点',
  poiL3: '其他三级类目',
}
