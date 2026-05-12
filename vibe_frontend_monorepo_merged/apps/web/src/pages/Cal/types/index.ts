export interface CommissionPolicy {
  name: string
  effective_date: string
  version: string
  published_date: string
  material_id: string
}

export interface CommissionRow {
  l1: string
  l2: string
  l3: string
  rate?: number
  rate_card?: number
  rule?: string
}

export interface PoiRates {
  [l1: string]: {
    [l2: string]: {
      [l3: string]: number
    }
  }
}

export interface CommissionData {
  policy: CommissionPolicy | null
  rows: CommissionRow[]
  poi: PoiRates | null
}

export interface Tool {
  name: string
  price: number
}

export interface GrossState {
  rawPrice: number
  cost: number
  tools: Tool[]
  couponMerchant: number
  industry: string
  categoryL1: string
  categoryL2: string
  categoryL3: string
  categoryPath: string[]
  commissionRate: number
  serviceFee: number
  cpsRate: number
  promoteFee: number
  productType: 'group' | 'card'
  rateGroup: number
  rateCard: number | null
  commissionRule: string
  poiL1: string
  poiL2: string
  poiL3: string
}

export interface UpflipState {
  settlementAmount: number
  flexRebateRatio: number
  summerRebateRatio: number
  quarterRebateRatio: number
  scanAvgPrice: number
  commissionRate: number
  perOrderIncentive: number
  joinDouyinPush: boolean
  bSubsidy: number
  industry: string
  categoryL1: string
  categoryL2: string
  categoryL3: string
  commissionRule: string
  rateGroup: number
  poiL1: string
  poiL2: string
  poiL3: string
  commissionRateEdited: boolean
}

export interface RoiState {
  rawPrice: number
  cost: number
  marginRate: number | null
  customerPayPrice: number | null
  ordersBefore: number
  growthRatio: number
  industry: string
  categoryL1: string
  categoryL2: string
  categoryL3: string
  commissionRule: string
  rateGroup: number
  poiL1: string
  poiL2: string
  poiL3: string
  commissionRate: number
  commissionRateEdited: boolean
}

export interface MerchantState {
  rawPrice: number
  zengliangbaoRate: number
  huokekaDiscount: number
  pengzhangquanMerchantContribution: number
  categoryCommissionRate: number
  serviceProviderCommission: number
  serviceProviderZengliangbaoCommission: number
  channelPreset: 'low' | 'mid' | 'high' | 'custom'
  channelRatio1: number
  channelRatio2: number
  channelRatio3: number
  productRatioZengliangbao: number
  productRatioPengzhangquan: number
  productRatioHuokeka: number
  industry: string
  categoryL1: string
  categoryL2: string
  categoryL3: string
  categoryPath: string[]
  rateGroup: number
  commissionRule: string
  poiL1: string
  poiL2: string
  poiL3: string
}

export interface GrowthRecoveryState {
  newMerchantPerformanceTarget: number
  stockMerchantPerformanceTarget: number
  currentTargetPoints: number
  verificationTarget: number
  estimatedIssue: number
  issueRatioArticle: number
  issueRatioLive: number
  issueRatioComprehensive: number
  estimatedIssueTaskDenominator: number
  estimatedFinalVerificationCompletion: number
  finalGrowthTaskCompletion: number
  recycleGrowthTaskStockDenominator: number
  recycleGrowthTaskNewMerchantDenominator: number
  recycleGmvByMonth: number
  recycleGrowthTaskNumerator: number
}

export interface ScanIntentState {
  mode: 'exempt' | 'nonExempt'
  avgOrderValue: number
  incrementalCustomers: number
  commissionRate: number
  channelFeeRate: number
  growthRate: number
  industry: string
  categoryL1: string
  categoryL2: string
  categoryL3: string
  commissionRule: string
  rateGroup: number
  poiL1: string
  poiL2: string
  poiL3: string
  commissionRateEdited: boolean
}

export interface SheetMetricResult {
  productMargin: number | null
  breakEvenRoi: number | null
  actualRoi: number | null
  profit: number | null
}

export interface PureMetricResult {
  productMargin: number | null
  talentCommissionRate: number | null
  serviceCommissionRate: number | null
  profitRate: number | null
  settlementGmv: number
  profit: number | null
}

export interface SheetResult {
  nonPure: SheetMetricResult
  pure: PureMetricResult
  totalProfit: number | null
}

export interface SelfLiveSheetState {
  averageOrderValue: number
  averageCost: number
  platformRate: number
  serviceProviderRate: number
  otherFullRate: number
  liveOperationRate: number
  settlementRateGap: number
  trafficCost: number
  serviceFlatFee: number
  liveOperationCost: number
  settlementGmv: number
  pureSettlementGmvMode: 'linked' | 'custom'
  pureSettlementGmv: number
}

export interface TalentLiveSheetState {
  averageOrderValue: number
  averageCost: number
  platformRate: number
  serviceProviderRate: number
  otherFullRate: number
  settlementRateGap: number
  talentTotalFee: number
  trafficCost: number
  serviceFlatFee: number
  settlementGmv: number
  pureAverageCost: number
  pureTalentCommissionRate: number
  pureServiceCommissionRate: number
  pureSettlementGmvMode: 'linked' | 'custom'
  pureSettlementGmv: number
}

export interface TalentVideoSheetState {
  averageOrderValue: number
  averageCost: number
  platformRate: number
  serviceProviderRate: number
  otherFullRate: number
  settlementRateGap: number
  talentTotalFee: number
  trafficCost: number
  serviceFlatFee: number
  otherFee: number
  settlementGmv: number
  pureTalentCommissionRate: number
  pureSettlementGmv: number
}

export interface CalculatorState {
  view:
    | 'hub'
    | 'gross'
    | 'upflip'
    | 'roi'
    | 'merchant'
    | 'growthRecovery'
    | 'scanIntent'
    | 'selfLive'
    | 'talentLive'
    | 'talentVideo'
  currentId: string | null
  data: {
    gross: GrossState
    upflip: UpflipState
    roi: RoiState
    merchant: MerchantState
    growthRecovery: GrowthRecoveryState
    scanIntent: ScanIntentState
    selfLive: SelfLiveSheetState
    talentLive: TalentLiveSheetState
    talentVideo: TalentVideoSheetState
  }
}

export interface GrossResult {
  minPromo: number
  couponMerchant: number
  platformCoupon: number
  merchantTakeHome: number
  platformCommission: number
  totalCommission: number
  finalIncome: number
  grossProfit: number
  margin: number
}

export interface UpflipResult {
  commissionPayable: number
  commissionPayableBeforeExemption: number
  platformCommissionRateBeforeExemption: number
  platformCommissionRateEffective: number
  platformCommissionAmountBeforeExemption: number
  platformCommissionAmountEffective: number
  channelFeeAmount: number
  scanCommissionExemptEligible: boolean
  scanCommissionExemptRate: number
  scanCommissionExemptAmount: number
  rebateAmount: number
  totalRebateRatio: number
  scanOrders: number
  scanIncentive: number
  totalIncentive: number
  actualCost: number
}

export interface RoiResult {
  discountPerOrder: number
  discountRatio: number
  totalDiscount: number
  profitPerOrderBefore: number
  profitPerOrderAfter: number
  orderIncrement: number
  ordersAfter: number
  baseProfitBefore: number
  profitAfter: number
  rewardIncome: number
  profitDelta: number
  roi: number
  requiredGrowth: number
  isBreakEven: boolean
}

export interface MerchantScenario {
  name: string
  hasHuokeka: boolean
  hasPengzhangquan: boolean
  hasZengliangbao: boolean
  priceAfterHuokeka: number
  consumerPrice: number
  priceAfterZengliangbao: number
  merchantTakeHomeBeforeService: number
  channelSplit: {
    channel1: number
    channel2: number | null
    channel3: number | null
    avgPrice: number
  }
  productRatio: number
}

export interface MerchantResult {
  scenarios: MerchantScenario[]
  weightedTotal: number
  finalTakeHome: number
}

export interface GrowthRecoveryResult {
  finalTargetPoints: number
  estimatedFinalVerificationAbsolute: number
  finalGrowthTaskCompletionAbsolute: number
  verificationImpact: number
  taskImpact: number
  verificationWeightImpact: number
  taskWeightImpact: number
  canRecycle: boolean
}

export interface ScanIntentResult {
  transactionAmount: number
  commissionCost: number
  channelFeeCost: number
  scanCost: number
  gmvIncrement: number
  gmvCostMultiple: number
  estimatedFans: number
}

export type LegacyCalculatorId =
  | 'gross'
  | 'upflip'
  | 'roi'
  | 'merchant'
  | 'growthRecovery'
  | 'scanIntent'

export type LiveCalculatorId =
  | 'selfLive'
  | 'talentLive'
  | 'talentVideo'

export type CalculatorId = LegacyCalculatorId | LiveCalculatorId

export interface RateLeaf {
  rate?: number
  rate_card?: number
  rule?: string
}

export type RateNode = RateLeaf | { [key: string]: RateNode | RateLeaf }
