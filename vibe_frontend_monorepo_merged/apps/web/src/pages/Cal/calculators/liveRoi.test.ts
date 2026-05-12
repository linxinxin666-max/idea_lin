import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SELF_LIVE_STATE,
  DEFAULT_TALENT_LIVE_STATE,
  DEFAULT_TALENT_VIDEO_STATE,
  calculateSelfLiveSheet,
  calculateTalentLiveSheet,
  calculateTalentVideoSheet,
} from './liveRoi'

describe('live ROI workbook calculators', () => {
  it('matches self live workbook defaults', () => {
    const result = calculateSelfLiveSheet(DEFAULT_SELF_LIVE_STATE)

    expect(result.nonPure.breakEvenRoi).toBeCloseTo(1.6483516483, 6)
    expect(result.nonPure.actualRoi).toBeCloseTo(333.3333333333, 6)
    expect(result.nonPure.profit).toBeCloseTo(603666.6666666666, 4)
    expect(result.pure.profitRate).toBeCloseTo(0.6066666667, 6)
    expect(result.pure.profit).toBeCloseTo(606666.6666666667, 4)
    expect(result.totalProfit).toBeCloseTo(1210333.3333333335, 4)
  })

  it('matches talent live workbook defaults', () => {
    const result = calculateTalentLiveSheet(DEFAULT_TALENT_LIVE_STATE)

    expect(result.nonPure.breakEvenRoi).toBeCloseTo(1.7045454545, 6)
    expect(result.nonPure.actualRoi).toBeCloseTo(300, 6)
    expect(result.nonPure.profit).toBeCloseTo(175000, 4)
    expect(result.pure.profitRate).toBeCloseTo(0.7788888889, 6)
    expect(result.pure.profit).toBeCloseTo(233666.6666666667, 4)
    expect(result.totalProfit).toBeCloseTo(408666.6666666666, 4)
  })

  it('matches talent video workbook defaults', () => {
    const result = calculateTalentVideoSheet(DEFAULT_TALENT_VIDEO_STATE)

    expect(result.nonPure.breakEvenRoi).toBeCloseTo(2.9411764706, 6)
    expect(result.nonPure.actualRoi).toBeCloseTo(3, 6)
    expect(result.nonPure.profit).toBeCloseTo(1000, 4)
    expect(result.pure.profitRate).toBeCloseTo(0.34, 6)
    expect(result.pure.profit).toBeCloseTo(17000, 4)
    expect(result.totalProfit).toBeCloseTo(18000, 4)
  })

  it('lets self live pure mode use independent GMV when enabled', () => {
    const result = calculateSelfLiveSheet({
      ...DEFAULT_SELF_LIVE_STATE,
      pureSettlementGmvMode: 'custom',
      pureSettlementGmv: 500000,
    })

    expect(result.nonPure.profit).toBeCloseTo(603666.6666666666, 4)
    expect(result.pure.settlementGmv).toBe(500000)
    expect(result.pure.profit).toBeCloseTo(303333.3333333333, 4)
    expect(result.totalProfit).toBeCloseTo(907000, 4)
  })

  it('lets talent live pure mode use independent GMV when enabled', () => {
    const result = calculateTalentLiveSheet({
      ...DEFAULT_TALENT_LIVE_STATE,
      pureSettlementGmvMode: 'custom',
      pureSettlementGmv: 500000,
    })

    expect(result.nonPure.profit).toBeCloseTo(175000, 4)
    expect(result.pure.settlementGmv).toBe(500000)
    expect(result.pure.profit).toBeCloseTo(389444.44444444444, 4)
    expect(result.totalProfit).toBeCloseTo(564444.4444444445, 4)
  })
})
