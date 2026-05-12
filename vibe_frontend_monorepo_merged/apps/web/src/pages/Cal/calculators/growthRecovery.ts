import type { GrowthRecoveryResult, GrowthRecoveryState } from '../types'
import { clampNonNegative, toNum } from '../utils/numbers'

const EPSILON = 1e-9

const safeDivide = (numerator: number, denominator: number): number => {
  return Math.abs(denominator) > EPSILON ? numerator / denominator : 0
}

export function calculateGrowthRecovery(s: GrowthRecoveryState): GrowthRecoveryResult {
  const newMerchantPerformanceTarget = clampNonNegative(toNum(s.newMerchantPerformanceTarget))
  const stockMerchantPerformanceTarget = clampNonNegative(toNum(s.stockMerchantPerformanceTarget))
  const currentTargetPoints = clampNonNegative(toNum(s.currentTargetPoints))
  const verificationTarget = clampNonNegative(toNum(s.verificationTarget))
  const estimatedFinalVerificationCompletion = clampNonNegative(toNum(s.estimatedFinalVerificationCompletion))
  const finalGrowthTaskCompletion = clampNonNegative(toNum(s.finalGrowthTaskCompletion))
  const recycleGrowthTaskStockDenominator = clampNonNegative(toNum(s.recycleGrowthTaskStockDenominator))
  const recycleGrowthTaskNewMerchantDenominator = clampNonNegative(toNum(s.recycleGrowthTaskNewMerchantDenominator))
  const recycleGmvByMonth = clampNonNegative(toNum(s.recycleGmvByMonth))
  const recycleGrowthTaskNumerator = clampNonNegative(toNum(s.recycleGrowthTaskNumerator))
  const estimatedIssueTaskDenominator = clampNonNegative(toNum(s.estimatedIssueTaskDenominator))

  // C7 = C3 + C6 * C1
  const finalTargetPoints = currentTargetPoints + estimatedIssueTaskDenominator * newMerchantPerformanceTarget
  // B10 (按语义推导) = C4 * B9
  const estimatedFinalVerificationAbsolute = verificationTarget * estimatedFinalVerificationCompletion
  // D10 = C7 * D9
  const finalGrowthTaskCompletionAbsolute = finalTargetPoints * finalGrowthTaskCompletion
  // B15 = B14 / C4
  const verificationImpact = safeDivide(recycleGmvByMonth, verificationTarget)
  // D15 = (D10-D14)/(C7-D12*C2-D13*C1)-D9
  const taskImpactDenominator =
    finalTargetPoints -
    recycleGrowthTaskStockDenominator * stockMerchantPerformanceTarget -
    recycleGrowthTaskNewMerchantDenominator * newMerchantPerformanceTarget
  const taskImpact =
    safeDivide(finalGrowthTaskCompletionAbsolute - recycleGrowthTaskNumerator, taskImpactDenominator) -
    finalGrowthTaskCompletion
  // B16 = B15 * 70 * 100
  const verificationWeightImpact = verificationImpact * 70 * 100
  // D16 = D15 * 20 * 100
  const taskWeightImpact = taskImpact * 20 * 100
  // C19 = IF(D16>B16, "是", "否")
  const canRecycle = taskWeightImpact > verificationWeightImpact

  return {
    finalTargetPoints,
    estimatedFinalVerificationAbsolute,
    finalGrowthTaskCompletionAbsolute,
    verificationImpact,
    taskImpact,
    verificationWeightImpact,
    taskWeightImpact,
    canRecycle,
  }
}

export function buildGrowthRecoveryCopyText(s: GrowthRecoveryState, res: GrowthRecoveryResult): string {
  const gap = res.taskWeightImpact - res.verificationWeightImpact
  return `${res.canRecycle ? '建议回收' : '暂不建议回收'}。当前按发文:直播:综合=${s.issueRatioArticle}:${s.issueRatioLive}:${s.issueRatioComprehensive}、预计回收GMV ${s.recycleGmvByMonth} 测算，任务权重影响 ${res.taskWeightImpact.toFixed(2)}，核销权重影响 ${res.verificationWeightImpact.toFixed(2)}，差值 ${gap.toFixed(2)}。`
}

export const DEFAULT_GROWTH_RECOVERY_STATE: GrowthRecoveryState = {
  newMerchantPerformanceTarget: 0.7436,
  stockMerchantPerformanceTarget: 0.5923,
  currentTargetPoints: 150.42,
  verificationTarget: 978990,
  estimatedIssue: 27.6,
  issueRatioArticle: 8,
  issueRatioLive: 2,
  issueRatioComprehensive: 1,
  estimatedIssueTaskDenominator: 141.76,
  estimatedFinalVerificationCompletion: 1,
  finalGrowthTaskCompletion: 0.9,
  recycleGrowthTaskStockDenominator: 6,
  recycleGrowthTaskNewMerchantDenominator: 0,
  recycleGmvByMonth: 561,
  recycleGrowthTaskNumerator: 0,
}
