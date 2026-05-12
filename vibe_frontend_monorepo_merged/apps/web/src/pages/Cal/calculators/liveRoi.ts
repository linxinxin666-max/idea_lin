import type {
  PureMetricResult,
  SelfLiveSheetState,
  SheetMetricResult,
  SheetResult,
  TalentLiveSheetState,
  TalentVideoSheetState,
} from '../types'

export const DEFAULT_SELF_LIVE_STATE: SelfLiveSheetState = {
  averageOrderValue: 90,
  averageCost: 30,
  platformRate: 0.03,
  serviceProviderRate: 0.03,
  otherFullRate: 0,
  liveOperationRate: 0,
  settlementRateGap: 0,
  trafficCost: 3000,
  serviceFlatFee: 0,
  liveOperationCost: 0,
  settlementGmv: 1000000,
  pureSettlementGmvMode: 'linked',
  pureSettlementGmv: 1000000,
}

export const DEFAULT_TALENT_LIVE_STATE: TalentLiveSheetState = {
  averageOrderValue: 90,
  averageCost: 30,
  platformRate: 0.03,
  serviceProviderRate: 0.05,
  otherFullRate: 0,
  settlementRateGap: 0,
  talentTotalFee: 0,
  trafficCost: 1000,
  serviceFlatFee: 0,
  settlementGmv: 300000,
  pureAverageCost: 10,
  pureTalentCommissionRate: 0,
  pureServiceCommissionRate: 0.08,
  pureSettlementGmvMode: 'linked',
  pureSettlementGmv: 300000,
}

export const DEFAULT_TALENT_VIDEO_STATE: TalentVideoSheetState = {
  averageOrderValue: 200,
  averageCost: 10,
  platformRate: 0.05,
  serviceProviderRate: 0.06,
  otherFullRate: 0.5,
  settlementRateGap: 0,
  talentTotalFee: 50000,
  trafficCost: 0,
  serviceFlatFee: 0,
  otherFee: 0,
  settlementGmv: 150000,
  pureTalentCommissionRate: 0.06,
  pureSettlementGmv: 50000,
}

const safeDivide = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
    return null
  }
  return numerator / denominator
}

const sumNullable = (...values: Array<number | null>): number | null => {
  if (values.some((value) => value === null || !Number.isFinite(value))) return null
  return values.reduce((total, value) => total + (value || 0), 0)
}

const resolvePureSettlementGmv = (
  linkedSettlementGmv: number,
  mode: 'linked' | 'custom',
  customSettlementGmv: number,
): number => (mode === 'custom' ? customSettlementGmv : linkedSettlementGmv)

const createNonPureMetrics = (
  productMargin: number | null,
  roiCostPool: number,
  profitCostPool: number,
  settlementGmv: number,
  ratePool: number,
): SheetMetricResult => {
  const breakEvenRoi = safeDivide(1, ratePool)
  const actualRoi = safeDivide(settlementGmv, roiCostPool)
  const profit =
    breakEvenRoi !== null && actualRoi !== null
      ? profitCostPool * (actualRoi / breakEvenRoi - 1)
      : null

  return {
    productMargin,
    breakEvenRoi,
    actualRoi,
    profit,
  }
}

const createPureMetrics = (
  averageOrderValue: number,
  averageCost: number,
  platformRate: number,
  talentCommissionRate: number,
  serviceCommissionRate: number,
  settlementGmv: number,
): PureMetricResult => {
  const productMargin = safeDivide(averageOrderValue - averageCost, averageOrderValue)
  const profitRate =
    productMargin === null
      ? null
      : productMargin - platformRate - talentCommissionRate - serviceCommissionRate
  const profit = profitRate === null ? null : settlementGmv * profitRate

  return {
    productMargin,
    talentCommissionRate,
    serviceCommissionRate,
    profitRate,
    settlementGmv,
    profit,
  }
}

export const calculateSelfLiveSheet = (state: SelfLiveSheetState): SheetResult => {
  const productMargin = safeDivide(state.averageOrderValue - state.averageCost, state.averageOrderValue)
  const ratePool =
    productMargin === null
      ? Number.NaN
      : productMargin - state.platformRate - state.serviceProviderRate - state.otherFullRate

  const nonPure = createNonPureMetrics(
    productMargin,
    state.trafficCost + state.serviceFlatFee,
    state.trafficCost + state.serviceFlatFee + state.liveOperationCost,
    state.settlementGmv,
    ratePool,
  )

  const pureSettlementGmv = resolvePureSettlementGmv(
    state.settlementGmv,
    state.pureSettlementGmvMode,
    state.pureSettlementGmv,
  )

  const pure = createPureMetrics(
    state.averageOrderValue,
    state.averageCost,
    state.platformRate,
    state.serviceProviderRate,
    state.otherFullRate,
    pureSettlementGmv,
  )

  return {
    nonPure,
    pure,
    totalProfit: sumNullable(nonPure.profit, pure.profit),
  }
}

export const calculateTalentLiveSheet = (state: TalentLiveSheetState): SheetResult => {
  const productMargin = safeDivide(state.averageOrderValue - state.averageCost, state.averageOrderValue)
  const ratePool =
    productMargin === null
      ? Number.NaN
      : productMargin - state.platformRate - state.serviceProviderRate - state.otherFullRate

  const nonPure = createNonPureMetrics(
    productMargin,
    state.talentTotalFee + state.trafficCost + state.serviceFlatFee,
    state.talentTotalFee + state.trafficCost + state.serviceFlatFee,
    state.settlementGmv,
    ratePool,
  )

  const pureSettlementGmv = resolvePureSettlementGmv(
    state.settlementGmv,
    state.pureSettlementGmvMode,
    state.pureSettlementGmv,
  )

  const pure = createPureMetrics(
    state.averageOrderValue,
    state.pureAverageCost,
    state.platformRate,
    state.pureTalentCommissionRate,
    state.pureServiceCommissionRate,
    pureSettlementGmv,
  )

  return {
    nonPure,
    pure,
    totalProfit: sumNullable(nonPure.profit, pure.profit),
  }
}

export const calculateTalentVideoSheet = (state: TalentVideoSheetState): SheetResult => {
  const productMargin = safeDivide(state.averageOrderValue - state.averageCost, state.averageOrderValue)
  const ratePool =
    productMargin === null
      ? Number.NaN
      : productMargin - state.platformRate - state.serviceProviderRate - state.otherFullRate

  const nonPure = createNonPureMetrics(
    productMargin,
    state.talentTotalFee + state.trafficCost + state.serviceFlatFee + state.otherFee,
    state.talentTotalFee + state.trafficCost + state.serviceFlatFee + state.otherFee,
    state.settlementGmv,
    ratePool,
  )

  const pure = createPureMetrics(
    state.averageOrderValue,
    state.averageCost,
    state.platformRate,
    state.pureTalentCommissionRate,
    state.otherFullRate,
    state.pureSettlementGmv,
  )

  return {
    nonPure,
    pure,
    totalProfit: sumNullable(nonPure.profit, pure.profit),
  }
}
