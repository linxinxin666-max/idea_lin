import { useEffect, useMemo, useState, useOptimistic, type ReactNode } from 'react'
import type { CalculatorId, CalculatorState, LiveCalculatorId, SheetResult, Tool } from './types'
import {
  calculateGross,
  calculateUpflip,
  calculateRoi,
  calculateMerchant,
  calculateGrowthRecovery,
  buildGrossCopyText,
  buildUpflipCopyText,
  buildRoiCopyText,
  buildMerchantCopyText,
  buildGrowthRecoveryCopyText,
  buildScanIntentCopyText,
  DEFAULT_GROSS_PRICE_TOOLS,
  DEFAULT_GROSS_STATE,
  DEFAULT_UPFLIP_STATE,
  UPFLIP_FIXED_CHANNEL_RATE,
  DEFAULT_ROI_STATE,
  DEFAULT_MERCHANT_STATE,
  DEFAULT_GROWTH_RECOVERY_STATE,
  DEFAULT_SCAN_INTENT_STATE,
  calculateScanIntent,
  DEFAULT_SELF_LIVE_STATE,
  DEFAULT_TALENT_LIVE_STATE,
  DEFAULT_TALENT_VIDEO_STATE,
  calculateSelfLiveSheet,
  calculateTalentLiveSheet,
  calculateTalentVideoSheet,
} from './calculators'
import { formatNumber, formatPercent, formatInputPercent } from './utils/numbers'
import { trackCalMetric, trackCalculatorCardClick } from './utils/metrics'
import { loadFromStorage, saveToStorage } from './hooks/useLocalStorage'
import { CalculatorCard } from './components/CalculatorCard'
import { BackButton } from './components/BackButton'
import { Button } from './components/Button'
import { InputField } from './components/InputField'
import { InfoTip } from './components/InfoTip'
import { ResultItem } from './components/ResultItem'
import { RadioGroup } from './components/RadioGroup'
import { Collapsible } from './components/Collapsible'
import { CategorySelector } from './components/CategorySelector'
import { MerchantCategorySelector } from './components/MerchantCategorySelector'
import { UpflipCategorySelector } from './components/UpflipCategorySelector'
import { RoiCategorySelector } from './components/RoiCategorySelector'
import { ScanIntentCategorySelector } from './components/ScanIntentCategorySelector'
import { LiveRoiCalculator } from './components/LiveRoiCalculator'
import { LIVE_ROI_META } from './data/liveRoiConfigs'
import './styles.css'

const STORAGE_KEY = 'calculator_state_v3'
const EXCEL_COUPON_MERCHANT_OPTIONS = [0, 3, 5, 7, 10]
const EXCEL_CPS_RATE_OPTIONS = [0, 0.05, 0.1, 0.15, 0.2]
const ROI_MARGIN_PRESETS = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.525, 0.5333, 0.6, 0.7, 0.8, 0.9]
const COPY_DEFAULT_LABELS: Record<string, string> = {
  gross: '复制当前方案话术',
  grossMerchant: '复制三档数据',
  upflip: '一键复制结果',
  roi: '一键复制结果',
  merchant: '一键复制结果&沟通话术',
  growthRecovery: '一键复制结果',
  scanIntent: '复制与商家沟通话术',
}
const COPY_RISK_ACK_KEY = 'copy_risk_ack_v1'
const COPY_RISK_CONFIRM_TEXT =
  '风险提示：复制内容仅供参考，请使用者自行核对业务口径并确认后再使用。若因使用不当导致问题，需由使用者自行负责。\n\n是否继续复制？'
const GROSS_PRICE_TOOL_FIELDS = [
  { name: '秒杀', label: '秒杀促后价' },
  { name: '超值团', label: '超值团一口价' },
  { name: '获客卡', label: '获客卡专享价' },
] as const
type GrossInsightTab = 'sensitivity' | 'risk' | 'logic'

const normalizeGrossTools = (tools: Tool[]): Tool[] =>
  DEFAULT_GROSS_PRICE_TOOLS.map((defaultTool) => {
    const matched = tools.find((tool) => tool.name === defaultTool.name)
    return matched ? { ...defaultTool, price: matched.price } : { ...defaultTool }
  })

const formatScanAmount = (value: number): string => {
  const rounded = Math.round(value * 100) / 100
  const isInteger = Math.abs(rounded - Math.round(rounded)) < 1e-9
  return rounded.toLocaleString('zh-CN', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  })
}

const formatScanCount = (value: number): string => {
  return Math.round(value).toLocaleString('zh-CN')
}

const getDefaultState = (): CalculatorState => ({
  view: 'hub',
  currentId: null,
    data: {
      gross: DEFAULT_GROSS_STATE,
      upflip: DEFAULT_UPFLIP_STATE,
      roi: DEFAULT_ROI_STATE,
      merchant: DEFAULT_MERCHANT_STATE,
      growthRecovery: DEFAULT_GROWTH_RECOVERY_STATE,
      scanIntent: DEFAULT_SCAN_INTENT_STATE,
      selfLive: DEFAULT_SELF_LIVE_STATE,
      talentLive: DEFAULT_TALENT_LIVE_STATE,
      talentVideo: DEFAULT_TALENT_VIDEO_STATE,
    },
  })

const mergeState = (saved: CalculatorState | null): CalculatorState => {
  const defaultState = getDefaultState()
  if (!saved) return defaultState

  const result: CalculatorState = {
    ...defaultState,
    ...saved,
    data: {
      gross: { ...defaultState.data.gross, ...(saved.data?.gross || {}) },
      upflip: { ...defaultState.data.upflip, ...(saved.data?.upflip || {}) },
      roi: { ...defaultState.data.roi, ...(saved.data?.roi || {}) },
      merchant: { ...defaultState.data.merchant, ...(saved.data?.merchant || {}) },
      growthRecovery: { ...defaultState.data.growthRecovery, ...(saved.data?.growthRecovery || {}) },
      scanIntent: { ...defaultState.data.scanIntent, ...(saved.data?.scanIntent || {}) },
      selfLive: { ...defaultState.data.selfLive, ...(saved.data?.selfLive || {}) },
      talentLive: { ...defaultState.data.talentLive, ...(saved.data?.talentLive || {}) },
      talentVideo: { ...defaultState.data.talentVideo, ...(saved.data?.talentVideo || {}) },
    },
  }

  if (result.data.merchant.channelRatio1 === 0.4 && result.data.merchant.channelRatio2 === 0.3 && result.data.merchant.channelRatio3 === 0.3) {
    result.data.merchant.channelRatio1 = 0.95
    result.data.merchant.channelRatio2 = 0.05
    result.data.merchant.channelRatio3 = 0
  }

  if (!EXCEL_COUPON_MERCHANT_OPTIONS.includes(result.data.gross.couponMerchant)) {
    result.data.gross.couponMerchant = 0
  }
  if (!EXCEL_CPS_RATE_OPTIONS.includes(result.data.gross.cpsRate)) {
    result.data.gross.cpsRate = 0
  }
  result.data.gross.tools = normalizeGrossTools(result.data.gross.tools || [])

  return result
}

const titles: Record<CalculatorId, string> = {
  gross: '毛利计算器',
  upflip: '上翻激励计算器',
  roi: 'ROI活动计算器',
  merchant: '产品三开-商家算账计算器',
  growthRecovery: '成长积分回收计算器',
  scanIntent: '促扫码意愿-预估成本收益计算器',
  selfLive: LIVE_ROI_META.selfLive.title,
  talentLive: LIVE_ROI_META.talentLive.title,
  talentVideo: LIVE_ROI_META.talentVideo.title,
}

const subtitles: Record<CalculatorId, string> = {
  gross: '用于测算商家到手价、预计收入金额和毛利率',
  upflip: '用于测算返佣金额、激励金额和商户实际成本',
  roi: '用于推演活动 ROI、保本涨幅与收益增量',
  merchant: '用于测算产品组合下的每单预计入账价',
  growthRecovery: '用于校准月中回收动作，判断成长任务积分是否可回收',
  scanIntent: '用于帮助 BD 按免佣 / 不免佣口径快速测算扫码成本、交易额增长和商家沟通话术',
  selfLive: LIVE_ROI_META.selfLive.subtitle,
  talentLive: LIVE_ROI_META.talentLive.subtitle,
  talentVideo: LIVE_ROI_META.talentVideo.subtitle,
}

type ContributorInfo = {
  label?: string
  name: string
}

const createLineIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const hubIcons: Record<CalculatorId, ReactNode> = {
  gross: createLineIcon(
    <>
      <circle cx="7.5" cy="8.5" r="3" />
      <path d="M7.5 6.8v3.4" />
      <path d="M5.8 8.5h3.4" />
      <path d="M12 15.5l3.1-3.1 2.3 2.3L21 11.1" />
      <path d="M17.4 11.1H21v3.6" />
    </>,
  ),
  roi: createLineIcon(
    <>
      <circle cx="11.5" cy="12.5" r="8" />
      <circle cx="11.5" cy="12.5" r="4.2" />
      <circle cx="11.5" cy="12.5" r="1.8" />
      <path d="M16.8 7.2 21 3" />
      <path d="M17.9 3H21v3.1" />
    </>,
  ),
  upflip: createLineIcon(
    <>
      <path d="M13.5 4.2c3.8 0 6.3 2.5 6.3 6.3-2.2.2-4.3 1.1-6 2.8-1.7 1.7-2.6 3.8-2.8 6C7.2 19.3 4.7 16.8 4.7 13c0-4.9 3.9-8.8 8.8-8.8Z" />
      <circle cx="14.5" cy="9.5" r="1.5" />
      <path d="M8.9 15.1 6.2 17.8" />
      <path d="M6 18.9 4 20l1.1-2 1.1-1.1" />
    </>,
  ),
  merchant: createLineIcon(
    <>
      <path d="M6.5 4.5h11A1.5 1.5 0 0 1 19 6v12.3l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M9 8.5h6" />
      <path d="M9 11.8h6" />
      <path d="M9 15.1h3.6" />
    </>,
  ),
  growthRecovery: createLineIcon(
    <>
      <path d="M12 3.7 18 6v5.5c0 4-2.4 7.6-6 9-3.6-1.4-6-5-6-9V6l6-2.3Z" />
      <path d="M9.2 12.2a2.8 2.8 0 1 0 4.8-2" />
      <path d="M14 10.2h2.6V7.6" />
    </>,
  ),
  scanIntent: createLineIcon(
    <>
      <path d="M4.5 5.5h15v9h-8l-4 4v-4h-3z" />
      <path d="M9 9.2h6" />
      <path d="M9 12h4" />
      <path d="M8.6 15.4 10.2 17a1.8 1.8 0 0 0 2.4 0l1.3-1.1" />
      <path d="M13.8 14.5 15 15.5a1.4 1.4 0 0 0 2 0l1-.9" />
    </>,
  ),
  selfLive: createLineIcon(
    <>
      <path d="M5 18V8.8a1.8 1.8 0 0 1 1.8-1.8h6.8" />
      <path d="M13.5 4.5 19 10v7.2A1.8 1.8 0 0 1 17.2 19H8.8A1.8 1.8 0 0 1 7 17.2V6.8A1.8 1.8 0 0 1 8.8 5h4.7Z" />
      <path d="M10 12.5h6" />
      <path d="M10 15.5h6" />
    </>,
  ),
  talentLive: createLineIcon(
    <>
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="9.5" r="2.5" />
      <path d="M4.8 18.5c.7-2.4 2.3-3.8 4.7-3.8s4 1.4 4.7 3.8" />
      <path d="M12.5 18.5c.5-1.9 1.8-3 3.9-3 2 0 3.4 1.1 3.9 3" />
    </>,
  ),
  talentVideo: createLineIcon(
    <>
      <rect x="4.5" y="6" width="12.5" height="12" rx="2" />
      <path d="m11 10 4 2.5-4 2.5Z" />
      <path d="M17 10.2 20 8.6v8.8L17 15.8" />
    </>,
  ),
}

const contributors: Record<CalculatorId, ContributorInfo> = {
  gross: { name: '殷莲' },
  upflip: { name: '刘冲' },
  roi: { name: '殷莲' },
  merchant: { name: '张佳玉' },
  growthRecovery: { name: '梅小康, 刘世强' },
  scanIntent: { name: '苍圆圆' },
  selfLive: { name: '张洁' },
  talentLive: { name: '张洁' },
  talentVideo: { name: '张洁' },
}

export default function Cal() {
  const [state, setState] = useState<CalculatorState>(() => mergeState(loadFromStorage<CalculatorState>(STORAGE_KEY)))
  const [copyLabels, setCopyLabels] = useState<Record<string, string>>({})
  const [optimisticCopyLabels, setOptimisticCopyLabels] = useOptimistic(copyLabels, (state, update: Record<string, string>) => ({
    ...state,
    ...update,
  }))
  const [merchantAdvancedOpen, setMerchantAdvancedOpen] = useState(false)
  const [grossInsightTab, setGrossInsightTab] = useState<GrossInsightTab | null>(null)

  useEffect(() => {
    saveToStorage(STORAGE_KEY, state)
  }, [state])

  useEffect(() => {
    trackCalMetric('cal_page_view', { page: '/self_help/cal' })
  }, [])

  const setView = (view: 'hub' | CalculatorId) => {
    trackCalMetric('cal_view_switch', { to_view: view })
    setState((prev) => ({
      ...prev,
      view,
      currentId: view === 'hub' ? null : view,
    }))
  }

  const openCalculator = (id: CalculatorId) => {
    trackCalculatorCardClick(id)
    trackCalMetric('cal_calc_start', { calculator_type: id })
    setView(id)
  }

  const updateCalculator = <T extends CalculatorId>(id: T, updates: Partial<CalculatorState['data'][T]>) => {
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [id]: {
          ...prev.data[id],
          ...updates,
        },
      },
    }))
  }

  const grossPriceTools = useMemo(() => normalizeGrossTools(state.data.gross.tools), [state.data.gross.tools])

  const updateGrossPriceTool = (toolName: string, price: number) => {
    updateCalculator('gross', {
      tools: grossPriceTools.map((tool) =>
        tool.name === toolName ? { ...tool, price } : tool,
      ),
    })
  }

  const resetCalculator = (id: CalculatorId) => {
    const defaults = getDefaultState().data[id]
    updateCalculator(id, defaults)
    if (id === 'gross') {
      setGrossInsightTab(null)
    }
  }

  const handleCopy = async (key: string, text: string) => {
    const hasAckedRisk = (() => {
      try {
        return window.localStorage.getItem(COPY_RISK_ACK_KEY) === '1'
      } catch {
        return false
      }
    })()

    if (!hasAckedRisk && !window.confirm(COPY_RISK_CONFIRM_TEXT)) {
      return
    }

    if (!hasAckedRisk) {
      try {
        window.localStorage.setItem(COPY_RISK_ACK_KEY, '1')
      } catch {
        // ignore storage failure and continue copy flow
      }
    }

    let copyStatus: 'success' | 'fail' = 'success'

    const fallbackCopy = () => {
      const temp = document.createElement('textarea')
      temp.value = text
      temp.setAttribute('readonly', 'true')
      temp.style.position = 'absolute'
      temp.style.left = '-9999px'
      document.body.appendChild(temp)
      temp.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(temp)
      return ok
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setOptimisticCopyLabels({ [key]: '已复制' })
        setCopyLabels((prev) => ({ ...prev, [key]: '已复制' }))
      } else {
        const ok = fallbackCopy()
        copyStatus = ok ? 'success' : 'fail'
        setOptimisticCopyLabels({ [key]: ok ? '已复制' : '复制失败' })
        setCopyLabels((prev) => ({ ...prev, [key]: ok ? '已复制' : '复制失败' }))
      }
    } catch {
      copyStatus = 'fail'
      setOptimisticCopyLabels({ [key]: '复制失败' })
      setCopyLabels((prev) => ({ ...prev, [key]: '复制失败' }))
    }

    trackCalMetric('cal_result_copy', {
      copy_key: key,
      copy_status: copyStatus,
    })

    setTimeout(() => {
      const defaultLabel = COPY_DEFAULT_LABELS[key] || '一键复制结果'
      setOptimisticCopyLabels({ [key]: defaultLabel })
      setCopyLabels((prev) => ({ ...prev, [key]: defaultLabel }))
    }, 1500)
  }

  const currentId = state.view === 'hub' ? null : state.view
  const isLiveRoiView = currentId === 'selfLive' || currentId === 'talentLive' || currentId === 'talentVideo'

  const grossResult = useMemo(() => calculateGross(state.data.gross), [state.data.gross])
  const upflipResult = useMemo(() => calculateUpflip(state.data.upflip), [state.data.upflip])
  const roiResult = useMemo(() => calculateRoi(state.data.roi), [state.data.roi])
  const merchantResult = useMemo(() => calculateMerchant(state.data.merchant), [state.data.merchant])
  const growthRecoveryResult = useMemo(() => calculateGrowthRecovery(state.data.growthRecovery), [state.data.growthRecovery])
  const scanIntentResult = useMemo(() => calculateScanIntent(state.data.scanIntent), [state.data.scanIntent])
  const selfLiveResult = useMemo(() => calculateSelfLiveSheet(state.data.selfLive), [state.data.selfLive])
  const talentLiveResult = useMemo(() => calculateTalentLiveSheet(state.data.talentLive), [state.data.talentLive])
  const talentVideoResult = useMemo(() => calculateTalentVideoSheet(state.data.talentVideo), [state.data.talentVideo])
  const liveRoiResults = useMemo<Record<LiveCalculatorId, SheetResult>>(
    () => ({
      selfLive: selfLiveResult,
      talentLive: talentLiveResult,
      talentVideo: talentVideoResult,
    }),
    [selfLiveResult, talentLiveResult, talentVideoResult],
  )
  const roiSensitivityRows = useMemo(() => {
    const discount = roiResult.discountRatio
    const growth = state.data.roi.growthRatio
    const safeDiscount = discount > 0 ? discount : 0

    return ROI_MARGIN_PRESETS.map((margin) => {
      const roiByGivenGrowth =
        safeDiscount > 0 ? (growth * (margin - safeDiscount)) / safeDiscount : 0
      const growthForPositiveRoi =
        safeDiscount > 0 && Math.abs(margin - safeDiscount) > 1e-9 ? safeDiscount / (margin - safeDiscount) : 0
      const maxDiscountForPositiveRoi = growth > 0 ? (growth * margin) / (1 + growth) : 0

      return {
        margin,
        roiByGivenGrowth,
        growthForPositiveRoi,
        maxDiscountForPositiveRoi,
      }
    })
  }, [roiResult.discountRatio, state.data.roi.growthRatio])

  const merchantRatioSummary = useMemo(() => {
    const s = state.data.merchant
    const channelSum = s.channelRatio1 + s.channelRatio2 + s.channelRatio3
    const productSum = s.productRatioZengliangbao + s.productRatioPengzhangquan + s.productRatioHuokeka
    const channelSummary = Math.abs(channelSum - 1) > 0.001
      ? `渠道占比当前合计 ${(channelSum * 100).toFixed(1)}%，建议先调整到 100%。`
      : '渠道占比合计 100%，可直接用于测算。'
    const productSummary = `产品覆盖率是参考项，可同时存在，不要求合计 100%。当前：增量宝 ${(s.productRatioZengliangbao * 100).toFixed(1)}%，膨胀券 ${(s.productRatioPengzhangquan * 100).toFixed(1)}%，获客卡 ${(s.productRatioHuokeka * 100).toFixed(1)}%，合计 ${(productSum * 100).toFixed(1)}%。`
    return `${channelSummary} ${productSummary}`
  }, [state.data.merchant])

  const grossSensitivity = useMemo(() => {
    const getNeighborOption = (options: number[], current: number, direction: -1 | 1): number => {
      const idx = options.findIndex((v) => Math.abs(v - current) < 1e-9)
      if (idx === -1) return current
      const next = idx + direction
      if (next < 0 || next >= options.length) return current
      return options[next]
    }

    const base = state.data.gross
    const cases = [
      {
        label: '保守档',
        couponMerchant: getNeighborOption(EXCEL_COUPON_MERCHANT_OPTIONS, base.couponMerchant, 1),
        cpsRate: getNeighborOption(EXCEL_CPS_RATE_OPTIONS, base.cpsRate, 1),
      },
      {
        label: '当前档',
        couponMerchant: base.couponMerchant,
        cpsRate: base.cpsRate,
      },
      {
        label: '激进档',
        couponMerchant: getNeighborOption(EXCEL_COUPON_MERCHANT_OPTIONS, base.couponMerchant, -1),
        cpsRate: getNeighborOption(EXCEL_CPS_RATE_OPTIONS, base.cpsRate, -1),
      },
    ]

    return cases.map((item) => {
      const simState = {
        ...base,
        couponMerchant: item.couponMerchant,
        cpsRate: item.cpsRate,
      }
      const sim = calculateGross(simState)
      return {
        ...item,
        takeHome: sim.merchantTakeHome,
        totalCommission: sim.totalCommission,
        income: sim.finalIncome,
        grossMargin: sim.margin,
      }
    })
  }, [state.data.gross])

  const grossInputReady = useMemo(
    () => state.data.gross.rawPrice > 0 && state.data.gross.cost > 0,
    [state.data.gross.cost, state.data.gross.rawPrice],
  )

  const grossConclusion = useMemo(() => {
    if (!grossInputReady) {
      return {
        verdict: '-',
        reason: '-',
        action: '-',
        tone: 'empty' as const,
      }
    }

    const income = grossResult.finalIncome
    const grossProfit = grossResult.grossProfit
    const grossMargin = grossResult.margin

    if (income <= 0) {
      return {
        verdict: '当前方案不建议上线',
        reason: '预计收入金额 <= 0，扣除佣金和推广费后已没有可留存收入。',
        action: '建议先下调“超值券商家出资档位”或“涨佣CPS”后再看结果。',
        tone: 'warning' as const,
      }
    }
    if (grossProfit <= 0 || grossMargin <= 0) {
      return {
        verdict: '当前方案不建议上线',
        reason: `按参考成本 ${formatNumber(state.data.gross.cost)} 元测算，毛利额 ${formatNumber(grossProfit)} 元，毛利率 ${formatPercent(grossMargin, 1)}。`,
        action: '建议先抬高促后价或压低活动成本，再复算。',
        tone: 'warning' as const,
      }
    }
    if (grossMargin < 0.2) {
      return {
        verdict: '当前方案可做，但建议先优化',
        reason: `当前商家到手价 ${formatNumber(grossResult.merchantTakeHome)} 元，毛利率 ${formatPercent(grossMargin, 1)}，利润空间偏薄。`,
        action: '建议优先下调超值券商家出资或涨佣CPS，尽量把毛利率抬高后再推进。',
        tone: 'warning' as const,
      }
    }
    return {
      verdict: '当前方案建议上线',
      reason: `当前商家到手价 ${formatNumber(grossResult.merchantTakeHome)} 元，预计收入金额 ${formatNumber(income)} 元，毛利率 ${formatPercent(grossMargin, 1)}。`,
      action: '可以按当前档位推进；如需更高利润，可尝试下调一个档位后复算。',
      tone: 'positive' as const,
    }
  }, [grossInputReady, grossResult, state.data.gross.cost])

  const upflipConclusion = useMemo(() => {
    const basePayable = upflipResult.commissionPayableBeforeExemption
    const reductionRatio = basePayable > 0 ? Math.max(0, 1 - upflipResult.actualCost / basePayable) : 0

    if (!upflipResult.scanCommissionExemptEligible && upflipResult.platformCommissionRateBeforeExemption <= 0) {
      return {
        verdict: '建议先调整参数后再推进',
        reason: '当前录入佣金率已低于或等于固定通道费率0.6%，平台抽佣部分为0，返佣金额会归零。',
        action: '建议先确认录入佣金率口径（已含0.6%通道费）后再复算。',
      }
    }

    if (upflipResult.actualCost < 0) {
      return {
        verdict: '当前方案建议优先推进',
        reason: `激励金额已覆盖全部佣金，预计净收益 ${Math.abs(upflipResult.actualCost).toFixed(2)} 元。`,
        action: upflipResult.scanCommissionExemptEligible
          ? '已命中扫码免佣，平台抽佣为0，仅收支付手续费。'
          : '建议直接按“倒赚”口径对商家沟通，优先锁定活动名额。',
      }
    }

    if (upflipResult.actualCost === 0) {
      return {
        verdict: '当前方案可推进',
        reason: '激励金额刚好覆盖佣金，商户预计0成本。',
        action: '可按当前参数推进，后续可微调激励争取形成净收益。',
      }
    }

    if (reductionRatio >= 0.4) {
      return {
        verdict: '当前方案可推进',
        reason: `原本应付佣金 ${basePayable.toFixed(2)} 元，活动后实际成本 ${upflipResult.actualCost.toFixed(2)} 元，成本下降 ${(reductionRatio * 100).toFixed(1)}%。`,
        action: '可直接对商家强调“平台补贴后只需承担较低成本”。',
      }
    }

    return {
      verdict: '建议优化后推进',
      reason: `当前实际成本为 ${upflipResult.actualCost.toFixed(2)} 元，降本幅度 ${(reductionRatio * 100).toFixed(1)}%，仍有优化空间。`,
      action: '建议提高扫码激励或补贴后再推进，优先把成本继续压低。',
    }
  }, [upflipResult])

  const upflipIsGain = upflipResult.actualCost < 0
  const upflipIsBreakEven = upflipResult.actualCost === 0
  const upflipPrimaryLabel = upflipIsGain ? '商户净收益（倒赚）' : '商户实际成本'
  const upflipPrimaryValue = upflipIsGain ? Math.abs(upflipResult.actualCost) : upflipResult.actualCost
  const upflipPrimaryValueTone = upflipIsGain || upflipIsBreakEven ? 'decision-metric-value--positive' : 'decision-metric-value--negative'
  const upflipHeroTitle = upflipIsGain ? '这单预计倒赚' : upflipIsBreakEven ? '这单预计打平' : '这单已明显降本'
  const upflipSummaryText = upflipIsGain
    ? '激励金额已完全覆盖佣金，产生超额正收益。'
    : upflipIsBreakEven
      ? '激励金额刚好覆盖佣金，商户成本为 0。'
      : upflipResult.totalIncentive > 0
        ? '平台补贴已覆盖部分佣金，成本显著下降。'
        : '当前尚未形成有效补贴，建议补充激励参数。'

  const grossRiskTips = useMemo(() => {
    if (!grossInputReady) {
      return []
    }

    const tips: string[] = []
    const grossMargin = grossResult.margin

    if (state.data.gross.cpsRate >= 0.15) {
      tips.push('涨佣CPS已达到15%或以上，毛利率会对流量波动更敏感。')
    }
    if (state.data.gross.couponMerchant >= 7) {
      tips.push('超值券商家出资档位较高，若转化不达预期，毛利会被快速侵蚀。')
    }
    if (grossMargin <= 0) {
      tips.push('当前毛利率 <= 0，按参考成本测算大概率亏损。')
    } else if (grossMargin < 0.15) {
      tips.push(`当前毛利率只有 ${formatPercent(grossMargin, 1)}，建议谨慎评估活动投入。`)
    }
    if (grossResult.merchantTakeHome <= 0) {
      tips.push('商家到手价为0或接近0，当前配置存在异常，请检查活动价格。')
    }
    if (tips.length === 0) {
      tips.push('当前参数下毛利率处于可接受区间，可继续按既定方案推进。')
    }
    return tips
  }, [grossInputReady, state.data.gross.couponMerchant, state.data.gross.cpsRate, grossResult])

  const grossThreeTierCopyText = useMemo(() => {
    const lines = grossSensitivity
      .map((x) => `${x.label}：商家出资${x.couponMerchant}元，涨佣CPS ${(x.cpsRate * 100).toFixed(0)}%，商家到手价 ${x.takeHome.toFixed(2)} 元，预计收入金额 ${x.income.toFixed(2)} 元，毛利率 ${formatPercent(x.grossMargin, 1)}`)
      .join('\n')
    return `三档分析（商家易懂版）\n${lines}\n建议：优先参考“当前档”，想冲量看“保守档”，想提利润看“激进档”。`
  }, [grossSensitivity])
  const grossInsightTitle = grossInsightTab === 'sensitivity'
    ? '三档敏感度对比'
    : grossInsightTab === 'risk'
      ? '风险提示'
      : grossInsightTab === 'logic'
        ? '计算逻辑'
        : ''

  const growthRecoveryConclusion = useMemo(() => {
    if (growthRecoveryResult.canRecycle) {
      return {
        verdict: '结论：可以回收',
        reason: `任务权重比影响 ${growthRecoveryResult.taskWeightImpact.toFixed(2)} > 核销权重比影响 ${growthRecoveryResult.verificationWeightImpact.toFixed(2)}。`,
        action: '可按当前参数推进月中回收。',
      }
    }
    return {
      verdict: '结论：暂不建议回收',
      reason: `任务权重比影响 ${growthRecoveryResult.taskWeightImpact.toFixed(2)} ≤ 核销权重比影响 ${growthRecoveryResult.verificationWeightImpact.toFixed(2)}。`,
      action: '建议先调低回收规模或提升任务完成后再复算。',
    }
  }, [growthRecoveryResult.canRecycle, growthRecoveryResult.taskWeightImpact, growthRecoveryResult.verificationWeightImpact])

  const growthRecoveryIssueSplit = useMemo(() => {
    const article = Math.max(0, state.data.growthRecovery.issueRatioArticle)
    const live = Math.max(0, state.data.growthRecovery.issueRatioLive)
    const comprehensive = Math.max(0, state.data.growthRecovery.issueRatioComprehensive)
    const ratioSum = article + live + comprehensive
    if (ratioSum <= 0) {
      return { article: 0, live: 0, comprehensive: 0, ratioSum: 0 }
    }
    const totalIssue = Math.max(0, state.data.growthRecovery.estimatedIssue)
    return {
      article: (totalIssue * article) / ratioSum,
      live: (totalIssue * live) / ratioSum,
      comprehensive: (totalIssue * comprehensive) / ratioSum,
      ratioSum,
    }
  }, [
    state.data.growthRecovery.estimatedIssue,
    state.data.growthRecovery.issueRatioArticle,
    state.data.growthRecovery.issueRatioLive,
    state.data.growthRecovery.issueRatioComprehensive,
  ])

  const growthRecoveryImpactGap = useMemo(
    () => growthRecoveryResult.taskWeightImpact - growthRecoveryResult.verificationWeightImpact,
    [growthRecoveryResult.taskWeightImpact, growthRecoveryResult.verificationWeightImpact],
  )

  const roiInputReady = useMemo(() => {
    const s = state.data.roi
    return s.rawPrice > 0 && s.cost > 0 && s.ordersBefore > 0
  }, [state.data.roi.cost, state.data.roi.ordersBefore, state.data.roi.rawPrice])

  const roiConclusion = useMemo(() => {
    if (!roiInputReady) {
      return {
        verdict: '待输入参数',
        badge: '等待输入',
        reason: '请在左侧先输入团购价、成本、核销前订单量，再查看 ROI 测算结果。',
        action: '建议先填基础信息，再看核心结论和敏感性表。',
        tone: 'empty' as const,
      }
    }

    if (!roiResult.isBreakEven || roiResult.profitDelta < 0) {
      return {
        verdict: '建议优化后再报',
        badge: '亏损预警，需调整折扣',
        reason: `当前收益增量 ${roiResult.profitDelta.toFixed(2)} 元，ROI ${roiResult.totalDiscount > 0 ? roiResult.roi.toFixed(2) : 'N/A'}。`,
        action: '建议先缩小折扣，或提高预估涨幅后再看。',
        tone: 'danger' as const,
      }
    }

    if (roiResult.roi >= 1 && roiResult.profitDelta > 0) {
      return {
        verdict: '强烈建议参与',
        badge: '高 ROI',
        reason: `当前收益增量 ${roiResult.profitDelta.toFixed(2)} 元，ROI ${roiResult.roi.toFixed(2)}。`,
        action: '可按当前折扣和涨幅预期推进活动。',
        tone: 'positive' as const,
      }
    }

    if (roiResult.profitDelta > 0) {
      return {
        verdict: '建议参与',
        badge: '已回本',
        reason: `当前收益增量 ${roiResult.profitDelta.toFixed(2)} 元，保本涨幅 ${(roiResult.requiredGrowth * 100).toFixed(2)}%。`,
        action: '建议继续跟踪核销涨幅，确保结果稳定。',
        tone: 'positive' as const,
      }
    }

    return {
      verdict: '谨慎参与',
      badge: '接近打平',
      reason: `当前方案已接近打平，保本涨幅 ${(roiResult.requiredGrowth * 100).toFixed(2)}%。`,
      action: '建议保守推进，优先提高活动后单量。',
      tone: 'warning' as const,
    }
  }, [roiInputReady, roiResult.isBreakEven, roiResult.profitDelta, roiResult.requiredGrowth, roiResult.roi, roiResult.totalDiscount])

  const merchantDecision = useMemo(() => {
    const denom = merchantResult.weightedTotal > 0 ? merchantResult.weightedTotal : 1
    const topScenario = merchantResult.scenarios.reduce((best, current) =>
      current.productRatio > best.productRatio ? current : best,
    merchantResult.scenarios[0])
    const topScenarioShare = topScenario ? (topScenario.productRatio / denom) * 100 : 0
    const channelSum = state.data.merchant.channelRatio1 + state.data.merchant.channelRatio2 + state.data.merchant.channelRatio3
    const channelHealthy = Math.abs(channelSum - 1) <= 0.001

    return {
      healthy: channelHealthy,
      verdict: channelHealthy ? '可直接沟通' : '先校准占比',
      topScenarioName: topScenario?.name || '暂无主导场景',
      topScenarioShare,
      action: channelHealthy ? '先讲每单预计入账价，再补充主导场景占比。' : '请先把三项渠道占比调到合计 100%，再使用本页结果。',
    }
  }, [merchantResult.scenarios, merchantResult.weightedTotal, state.data.merchant.channelRatio1, state.data.merchant.channelRatio2, state.data.merchant.channelRatio3])

  const merchantTalkTrack = useMemo(
    () => buildMerchantCopyText(state.data.merchant, merchantResult),
    [state.data.merchant, merchantResult],
  )

  const scanIntentRoundedMultiple = useMemo(
    () => Math.round(scanIntentResult.gmvCostMultiple),
    [scanIntentResult.gmvCostMultiple],
  )

  const scanIntentRiskTips = useMemo(() => {
    const tips: string[] = []

    tips.push('定位说明：这是促商家扫码意愿沟通版，核心是直击商家成本顾虑，用举例算账的方式先讲清“扫码成本”和“预估收益”。')
    tips.push('增长口径：模型预估增长区间是 8%-20%，当前默认按 20%（上限）估算；若扫码后商品、视频、直播承接更好，交易额增长可能超过 20%。')
    tips.push('当前默认口径是“顾客领优惠前需要先关注店铺”，因此上翻顾客数会直接计为新增粉丝数。')
    if (state.data.scanIntent.mode === 'exempt') {
      tips.push('免佣模式下，扫码成本只计算通道费，不再叠加佣金。')
    } else {
      tips.push('不免佣模式下，扫码成本按佣金收取，当前页面不再单独叠加通道费。')
    }

    return tips
  }, [state.data.scanIntent.mode])

  const scanIntentTalkTrack = useMemo(
    () => buildScanIntentCopyText(state.data.scanIntent, scanIntentResult),
    [state.data.scanIntent, scanIntentResult],
  )

  return (
    <>
      {state.view === 'hub' && (
        <div id="view-hub" className="page">
          <div className="portal-header">
            <div className="portal-copy">
              <div className="portal-kicker">统一业务测算入口</div>
              <h1 className="portal-title">生服业务测算工具箱</h1>
              <div className="portal-subtitle">按业务场景选择计算器，快速得到可沟通、可复制的测算结果。</div>
              <div className="portal-meta">
                <div className="meta-chip">9 个核心场景</div>
                <div className="meta-chip">结果可复制</div>
                <div className="meta-chip">自动保存</div>
              </div>
            </div>
          </div>
          <div className="hub-grid">
            <CalculatorCard
              id="gross"
              icon={hubIcons.gross}
              title="毛利计算器"
              badge="利润测算"
              badgeTone="finance"
              description="输入价格、成本和活动参数，快速判断商家到手价、预计收入金额和毛利率。"
              contributor={contributors.gross.name}
              tone="blue"
              onClick={() => openCalculator('gross')}
            />
            <CalculatorCard
              id="roi"
              icon={hubIcons.roi}
              title="ROI活动计算器"
              badge="投放决策"
              badgeTone="marketingPurple"
              description="评估活动投入产出，查看保本涨幅和收益增量，判断活动是否值得做。"
              contributor={contributors.roi.name}
              tone="indigo"
              onClick={() => openCalculator('roi')}
            />
            <CalculatorCard
              id="upflip"
              icon={hubIcons.upflip}
              title="上翻激励计算器"
              badge="激励评估"
              badgeTone="marketingOrange"
              description="测算返佣与扫码激励后的商户实际成本，辅助判断方案可行性。"
              contributor={contributors.upflip.name}
              tone="green"
              onClick={() => openCalculator('upflip')}
            />
            <CalculatorCard
              id="merchant"
              icon={hubIcons.merchant}
              title="产品三开-商家算账计算器"
              badge="组合测算"
              badgeTone="finance"
              description="按多产品、多渠道占比推演预计入账价，便于和商家沟通整体经营账。"
              contributor={contributors.merchant.name}
              tone="orange"
              onClick={() => openCalculator('merchant')}
            />
            <CalculatorCard
              id="growthRecovery"
              icon={hubIcons.growthRecovery}
              title="成长积分回收计算器"
              badge="绩效校准"
              badgeTone="performance"
              description="按核销影响与任务影响双权重对比，判断月中是否可以回收成长任务积分。"
              contributor={contributors.growthRecovery.name}
              tone="cyan"
              onClick={() => openCalculator('growthRecovery')}
            />
            <CalculatorCard
              id="scanIntent"
              icon={hubIcons.scanIntent}
              title="促扫码意愿-预估成本收益计算器"
              badge="商家沟通"
              badgeTone="communication"
              description="快速估算扫码带来的 GMV 增量、支付侧成本和粉丝沉淀，辅助 BD 说服商家。"
              contributor={contributors.scanIntent.name}
              tone="green"
              onClick={() => openCalculator('scanIntent')}
            />
            <CalculatorCard
              id="selfLive"
              icon={hubIcons.selfLive}
              title={LIVE_ROI_META.selfLive.title}
              badge={LIVE_ROI_META.selfLive.badge}
              badgeTone={LIVE_ROI_META.selfLive.badgeTone}
              description={LIVE_ROI_META.selfLive.description}
              contributor={contributors.selfLive.name}
              contributorLabel={contributors.selfLive.label}
              tone={LIVE_ROI_META.selfLive.tone}
              onClick={() => openCalculator('selfLive')}
            />
            <CalculatorCard
              id="talentLive"
              icon={hubIcons.talentLive}
              title={LIVE_ROI_META.talentLive.title}
              badge={LIVE_ROI_META.talentLive.badge}
              badgeTone={LIVE_ROI_META.talentLive.badgeTone}
              description={LIVE_ROI_META.talentLive.description}
              contributor={contributors.talentLive.name}
              contributorLabel={contributors.talentLive.label}
              tone={LIVE_ROI_META.talentLive.tone}
              onClick={() => openCalculator('talentLive')}
            />
            <CalculatorCard
              id="talentVideo"
              icon={hubIcons.talentVideo}
              title={LIVE_ROI_META.talentVideo.title}
              badge={LIVE_ROI_META.talentVideo.badge}
              badgeTone={LIVE_ROI_META.talentVideo.badgeTone}
              description={LIVE_ROI_META.talentVideo.description}
              contributor={contributors.talentVideo.name}
              contributorLabel={contributors.talentVideo.label}
              tone={LIVE_ROI_META.talentVideo.tone}
              onClick={() => openCalculator('talentVideo')}
            />
          </div>
        </div>
      )}

      {currentId && (
        <div id="view-exec" className={`page exec-page ${isLiveRoiView ? 'exec-page--live-roi' : ''}`.trim()}>
          <div className={`exec-header ${isLiveRoiView ? 'exec-header--live-roi' : ''}`.trim()}>
            <div className={`exec-header-inner ${isLiveRoiView ? 'exec-header-inner--live-roi' : ''}`.trim()}>
                <div className={`exec-left ${isLiveRoiView ? 'exec-left--live-roi' : ''}`.trim()}>
                  <BackButton onClick={() => setView('hub')} />
                  <div className="exec-titles">
                    <div className="exec-kicker">业务测算</div>
                    <div className="exec-title-row">
                      <h2 className="exec-title">{titles[currentId]}</h2>
                      {currentId === 'upflip' && (
                        <div className="exec-title-tip">使用提示：命中扫码免佣时，平台抽佣自动为 0，佣金固定为 0.6%（仅通道费）。</div>
                      )}
                    </div>
                    <div className="exec-subtitle">{subtitles[currentId]}</div>
                    <div className="exec-contributor">{contributors[currentId].label || '计算器开发者：'}{contributors[currentId].name}</div>
                  </div>
                </div>
              {currentId === 'scanIntent' && (
                <div className="header-tips" aria-label="使用提示">
                  <div className="header-tips-title">使用提示</div>
                  <div className="header-tips-text">左侧先选“免佣 / 不免佣”口径，再录入客单价和上翻顾客数。</div>
                  <div className="header-tips-text">右侧会自动生成对应话术，适合 BD 直接复制去和商家沟通。</div>
                </div>
              )}
            </div>
          </div>

          {currentId === 'gross' && (
            <div className="calc-content">
              <div className="calc-layout calc-layout--gross">
                <div className="calc-main">
                  <div className="card">
                    <div className="card-title-row">
                      <span>参数输入</span>
                      <Button onClick={() => resetCalculator('gross')}>重置</Button>
                    </div>
                    <div className="gross-form-stack">
                      <section className="gross-section">
                        <div className="gross-section-head">
                          <div className="gross-section-title">基础信息</div>
                        </div>
                        <div className="gross-basic-grid">
                          <InputField
                            label="团购价"
                            value={state.data.gross.rawPrice}
                            onChange={(v) => updateCalculator('gross', { rawPrice: v })}
                          />
                          <InputField
                            label="成本"
                            value={state.data.gross.cost}
                            onChange={(v) => updateCalculator('gross', { cost: v })}
                          />
                        </div>
                        <div className="gross-category-shell">
                          <div className="gross-top-grid">
                            <CategorySelector
                              state={state.data.gross}
                              industryClassName="gross-top-grid-industry"
                              industrySpan={false}
                              onChange={(updates) => updateCalculator('gross', updates)}
                            />
                          </div>
                        </div>
                        <InputField
                          label="团购佣金率"
                          labelAdornment={<InfoTip text="按三级类目自动带出，可按实际方案手动调整。" />}
                          percent
                          value={formatInputPercent(state.data.gross.commissionRate)}
                          onChange={(v) => updateCalculator('gross', { commissionRate: v / 100 })}
                        />
                      </section>

                      <div className="gross-activity-grid">
                        <section className="gross-section gross-section--compact">
                          <div className="gross-section-head">
                            <div>
                              <div className="gross-section-title">券类营销工具</div>
                              <div className="gross-section-meta">资产类优惠，互斥取优，可与价类叠加</div>
                            </div>
                            <span className="gross-section-tag">默认不参与</span>
                          </div>
                          <div className="form-row">
                            <label className="form-label">
                              <span>超值券商家出资档位</span>
                            </label>
                            <select
                              value={state.data.gross.couponMerchant}
                              onChange={(e) => updateCalculator('gross', { couponMerchant: Number(e.target.value) })}
                            >
                              {EXCEL_COUPON_MERCHANT_OPTIONS.map((v) => (
                                <option key={v} value={v}>
                                  {v === 0 ? '不参与' : `${v} 元`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </section>

                        <section className="gross-section gross-section--compact">
                          <div className="gross-section-head">
                            <div>
                              <div className="gross-section-title">商品托管工具</div>
                              <div className="gross-section-meta">独立托管工具，按涨佣CPS测算增量成本</div>
                            </div>
                            <span className="gross-section-tag">默认不启用</span>
                          </div>
                          <div className="form-row">
                            <label className="form-label">
                              <span>增量宝涨佣CPS</span>
                            </label>
                            <select
                              value={state.data.gross.cpsRate}
                              onChange={(e) => updateCalculator('gross', { cpsRate: Number(e.target.value) })}
                            >
                              {EXCEL_CPS_RATE_OPTIONS.map((v) => (
                                <option key={v} value={v}>
                                  {v === 0 ? '不启用' : `${(v * 100).toFixed(0)}%`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </section>
                      </div>

                      <section className="gross-section">
                        <div className="gross-section-head">
                          <div>
                            <div className="gross-section-title">价类营销工具</div>
                            <div className="gross-section-meta">直接生效，互斥取优，可与券类叠加</div>
                          </div>
                          <span className="gross-section-tag">默认不参与</span>
                        </div>
                        <div className="gross-price-grid">
                          {GROSS_PRICE_TOOL_FIELDS.map((toolField) => {
                            const currentTool = grossPriceTools.find((tool) => tool.name === toolField.name)
                            return (
                              <InputField
                                key={toolField.name}
                                label={toolField.label}
                                value={currentTool?.price || 0}
                                zeroAsEmpty
                                placeholder="不填则不参与"
                                onChange={(value) => updateGrossPriceTool(toolField.name, value)}
                              />
                            )
                          })}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="calc-side gross-side">
                  <div className="card res-card gross-summary-card">
                    <div className="gross-summary-head">
                      <div className="card-title">测算结果</div>
                      <div className="gross-summary-chip">毛利测算</div>
                    </div>
                    <div className="gross-hero-grid">
                      <div className="gross-hero-card gross-hero-card--income">
                        <div className="gross-hero-label">预计收入金额</div>
                        <div className={`gross-hero-value ${grossInputReady ? (grossResult.finalIncome > 0 ? 'gross-hero-value--positive' : 'gross-hero-value--negative') : ''}`}>
                          {grossInputReady ? formatNumber(grossResult.finalIncome) : '-'}
                        </div>
                      </div>
                      <div className="gross-hero-card gross-hero-card--margin">
                        <div className="gross-hero-label">毛利率</div>
                        <div className={`gross-hero-value gross-hero-value--margin ${grossInputReady ? (grossResult.margin > 0 ? 'gross-hero-value--positive' : 'gross-hero-value--negative') : ''}`}>
                          {grossInputReady ? formatPercent(grossResult.margin, 1) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="gross-summary-grid">
                      <div className="gross-summary-item">
                        <div className="gross-summary-label">最低促后价</div>
                        <div className="gross-summary-value">{grossInputReady ? formatNumber(grossResult.minPromo) : '-'}</div>
                      </div>
                      <div className="gross-summary-item">
                        <div className="gross-summary-label">平台出资</div>
                        <div className="gross-summary-value">{grossInputReady ? formatNumber(grossResult.platformCoupon) : '-'}</div>
                      </div>
                      <div className="gross-summary-item gross-summary-item--wide">
                        <div className="gross-summary-label">商家到手价</div>
                        <div className="gross-summary-value">{grossInputReady ? formatNumber(grossResult.merchantTakeHome) : '-'}</div>
                      </div>
                      <div className="gross-summary-item">
                        <div className="gross-summary-label">佣金合计支出</div>
                        <div className="gross-summary-value">{grossInputReady ? formatNumber(grossResult.totalCommission) : '-'}</div>
                      </div>
                      <div className="gross-summary-item">
                        <div className="gross-summary-label">毛利额</div>
                        <div className={`gross-summary-value ${grossInputReady ? (grossResult.grossProfit > 0 ? 'gross-summary-value--positive' : 'gross-summary-value--negative') : ''}`}>
                          {grossInputReady ? formatNumber(grossResult.grossProfit) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className={`gross-summary-note ${grossInputReady ? '' : 'gross-summary-note--muted'}`}>
                      {grossConclusion.reason}
                    </div>
                    <div className="gross-side-nav">
                      <button
                        type="button"
                        className={`gross-side-link ${grossInsightTab === 'sensitivity' ? 'gross-side-link--active' : ''}`}
                        onClick={() => setGrossInsightTab((prev) => (prev === 'sensitivity' ? null : 'sensitivity'))}
                      >
                        三档对比
                      </button>
                      <button
                        type="button"
                        className={`gross-side-link ${grossInsightTab === 'risk' ? 'gross-side-link--active' : ''}`}
                        onClick={() => setGrossInsightTab((prev) => (prev === 'risk' ? null : 'risk'))}
                      >
                        风险提示
                      </button>
                      <button
                        type="button"
                        className={`gross-side-link ${grossInsightTab === 'logic' ? 'gross-side-link--active' : ''}`}
                        onClick={() => setGrossInsightTab((prev) => (prev === 'logic' ? null : 'logic'))}
                      >
                        计算逻辑
                      </button>
                    </div>
                    <div className="res-actions">
                      <Button className="gross-copy-btn" onClick={() => handleCopy('gross', buildGrossCopyText(state.data.gross, grossResult))}>
                        {optimisticCopyLabels.gross || '复制当前方案话术'}
                      </Button>
                    </div>
                  </div>

                  {grossInsightTab && (
                    <div className="card gross-detail-card">
                      <div className="gross-detail-head">
                        <div className="card-title">{grossInsightTitle}</div>
                        <button type="button" className="text-link-btn" onClick={() => setGrossInsightTab(null)}>
                          收起
                        </button>
                      </div>

                      {grossInsightTab === 'sensitivity' && (
                        <>
                          <div className="table-scroll">
                            <table className="scenarios-table">
                              <thead>
                                <tr>
                                  <th>档位</th>
                                  <th>商家出资</th>
                                  <th>涨佣CPS</th>
                                  <th>预计收入金额</th>
                                  <th>毛利率</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grossSensitivity.map((item) => (
                                  <tr key={item.label}>
                                    <td className="scenario-name">{item.label}</td>
                                    <td>{item.couponMerchant}</td>
                                    <td>{(item.cpsRate * 100).toFixed(0)}%</td>
                                    <td className="scenario-price">{formatNumber(item.income)} 元</td>
                                    <td className={item.grossMargin > 0 ? 'scenario-positive' : 'scenario-negative'}>{formatPercent(item.grossMargin, 1)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="res-actions">
                            <Button variant="secondary" onClick={() => handleCopy('grossMerchant', grossThreeTierCopyText)}>
                              {optimisticCopyLabels.grossMerchant || '复制三档数据'}
                            </Button>
                          </div>
                        </>
                      )}

                      {grossInsightTab === 'risk' && (
                        <div className={`gross-fold-content ${grossInputReady ? '' : 'gross-fold-content--muted'}`}>
                          {grossInputReady ? (
                            <div className="side-list">
                              {grossRiskTips.map((tip, idx) => (
                                <div className="side-item" key={idx}>
                                  <span className="side-dot"></span>
                                  <span>{tip}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="side-item side-item--placeholder">-</div>
                          )}
                        </div>
                      )}

                      {grossInsightTab === 'logic' && (
                        <div className="logic-body">
                          <div className="logic-line"><strong>1. 最低促后价</strong>：价类工具（秒杀 / 超值团 / 获客卡）内部互斥取最低价，若都未填写则用团购价</div>
                          <div className="logic-line"><strong>2. 平台出资</strong>：超值券平台出资 = 商家出资 ÷ 1.25，按 Excel 口径向下取整</div>
                          <div className="logic-line"><strong>3. 商家到手价</strong> = 最低促后价 - 超值券商家出资</div>
                          <div className="logic-line"><strong>4. 平台佣金</strong> = 商家到手价 × 团购佣金率</div>
                          <div className="logic-line"><strong>5. 增量宝推广费</strong> = 商家到手价 × 涨佣CPS</div>
                          <div className="logic-line"><strong>6. 佣金合计支出</strong> = 平台佣金 + 增量宝推广费</div>
                          <div className="logic-line"><strong>7. 预计收入金额</strong> = 商家到手价 - 佣金合计支出</div>
                          <div className="logic-line"><strong>8. 毛利额</strong> = 预计收入金额 - 成本</div>
                          <div className="logic-line"><strong>9. 毛利率</strong> = 毛利额 ÷ 团购价</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentId === 'upflip' && (
            <div className="calc-content">
              <div className="calc-layout">
                <div className="calc-main">
                  <div className="card">
                    <div className="card-title-row">
                      <span>返佣设置</span>
                      <Button onClick={() => resetCalculator('upflip')}>重置</Button>
                    </div>
                    <div className="form-grid">
                      <UpflipCategorySelector state={state.data.upflip} onChange={(updates) => updateCalculator('upflip', updates)} />
                      <div className="form-row form-row-span">
                        <div className="calc-note-chips upflip-note-chips">
                          <span className="calc-note-chip">
                            {upflipResult.scanCommissionExemptEligible ? 'ℹ 已参与扫码免佣' : 'ℹ 未参与扫码免佣'}
                          </span>
                          {upflipResult.scanCommissionExemptEligible && (
                            <span className="calc-note-chip">ℹ 当前计费规则：佣金率固定为 {formatPercent(UPFLIP_FIXED_CHANNEL_RATE)}（仅通道费）</span>
                          )}
                          {!upflipResult.scanCommissionExemptEligible && (
                            <span className="calc-note-chip">ℹ 当前计费规则：按录入佣金率（已含0.6%通道费）计费</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="form-grid">
                      <InputField label="核销金额" value={state.data.upflip.settlementAmount} onChange={(v) => updateCalculator('upflip', { settlementAmount: v })} />
                      {upflipResult.scanCommissionExemptEligible ? (
                        <InputField
                          label="命中免佣后佣金率（仅通道费）"
                          percent
                          value={formatInputPercent(UPFLIP_FIXED_CHANNEL_RATE)}
                          onChange={() => {}}
                          disabled
                          hint="命中扫码免佣后，佣金只收固定 0.6%"
                        />
                      ) : (
                        <div className="upflip-commission-field">
                          <InputField
                            label="录入佣金率（含通道费）"
                            percent
                            value={formatInputPercent(state.data.upflip.commissionRate)}
                            onChange={(v) => updateCalculator('upflip', { commissionRate: v / 100, commissionRateEdited: true })}
                          />
                          <div className="rate-assist-row rate-assist-row--solo">
                            <button
                              type="button"
                              className="text-link-btn"
                              onClick={() =>
                                updateCalculator('upflip', {
                                  commissionRate: state.data.upflip.rateGroup,
                                  commissionRateEdited: false,
                                })
                              }
                            >
                              恢复推荐值
                            </button>
                          </div>
                        </div>
                      )}
                      <InputField label="灵活返佣比例" percent value={formatInputPercent(state.data.upflip.flexRebateRatio)} onChange={(v) => updateCalculator('upflip', { flexRebateRatio: v / 100 })} />
                      <InputField label="暑期返佣比例" percent value={formatInputPercent(state.data.upflip.summerRebateRatio)} onChange={(v) => updateCalculator('upflip', { summerRebateRatio: v / 100 })} />
                      <InputField label="季框返佣比例" percent value={formatInputPercent(state.data.upflip.quarterRebateRatio)} onChange={(v) => updateCalculator('upflip', { quarterRebateRatio: v / 100 })} />
                      <InputField label="扫码客单价" value={state.data.upflip.scanAvgPrice} onChange={(v) => updateCalculator('upflip', { scanAvgPrice: v })} />
                      <InputField label="单均激励金额 (元)" value={state.data.upflip.perOrderIncentive} onChange={(v) => updateCalculator('upflip', { perOrderIncentive: v })} />
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">补贴设置</div>
                    <RadioGroup
                      label="是否有额外B补"
                      name="joinDouyinPush"
                      options={[
                        { value: 'no', label: '否' },
                        { value: 'yes', label: '是' },
                      ]}
                      value={state.data.upflip.joinDouyinPush ? 'yes' : 'no'}
                      segmented
                      span={false}
                      onChange={(v) => updateCalculator('upflip', { joinDouyinPush: v === 'yes' })}
                    />
                    {state.data.upflip.joinDouyinPush && (
                      <div className="form-grid">
                        <InputField label="B补金额" value={state.data.upflip.bSubsidy} onChange={(v) => updateCalculator('upflip', { bSubsidy: v })} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="calc-side">
                  <div className={`card res-card decision-card ${upflipResult.actualCost <= 0 ? 'decision-card--positive' : 'decision-card--warning'}`}>
                    <div className="decision-top">
                      <div>
                        <div className="decision-kicker">销售捷报</div>
                        <div className="decision-title">{upflipHeroTitle}</div>
                      </div>
                      <div className="decision-badge">{upflipResult.scanCommissionExemptEligible ? '扫码免佣' : '常规返佣'}</div>
                    </div>
                    <div className="decision-metrics">
                      <div className="decision-metric upflip-focus-metric">
                        <div className="decision-metric-label">{upflipPrimaryLabel}</div>
                        <div className={`decision-metric-value upflip-focus-value ${upflipPrimaryValueTone}`}>
                          {formatNumber(upflipPrimaryValue)}
                        </div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">原本应付佣金</div>
                        <div className="decision-metric-value">{formatNumber(upflipResult.commissionPayableBeforeExemption)}</div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">激励总额（返现+补贴）</div>
                        <div className="decision-metric-value">{formatNumber(upflipResult.totalIncentive)}</div>
                      </div>
                    </div>
                    <div className="decision-summary">{upflipSummaryText}</div>
                    <div className="upflip-action-text">
                      <span className="upflip-action-label">建议：</span>
                      <span>{upflipConclusion.action}</span>
                    </div>
                  </div>

                  <div className="card upflip-aux-card">
                    <div className="card-title">辅助结果（明细）</div>
                    <div className="snapshot-grid upflip-aux-grid">
                      <div className="snapshot-item">
                        <div className="snapshot-label">扫码免佣状态</div>
                        <div className="snapshot-value">{upflipResult.scanCommissionExemptEligible ? '已命中' : '未命中'}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">总返还比例</div>
                        <div className="snapshot-value">{formatPercent(upflipResult.totalRebateRatio)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">扫码订单数</div>
                        <div className="snapshot-value">{formatNumber(upflipResult.scanOrders, 0)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">扫码激励金额</div>
                        <div className="snapshot-value">{formatNumber(upflipResult.scanIncentive)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">佣金返还金额</div>
                        <div className="snapshot-value">{formatNumber(upflipResult.rebateAmount)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">扫码免佣减免金额</div>
                        <div className="snapshot-value">{formatNumber(upflipResult.scanCommissionExemptAmount)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="res-actions upflip-copy-bar">
                    <Button onClick={() => handleCopy('upflip', buildUpflipCopyText(state.data.upflip, upflipResult))}>
                      {optimisticCopyLabels.upflip || '一键复制结果'}
                    </Button>
                  </div>

                  <Collapsible title="计算逻辑说明">
                    <div className="logic-body">
                      <div className="logic-line">• 录入佣金率已包含固定通道费 0.6%</div>
                      <div className="logic-line">• 免佣前应付佣金 = 核销金额 × 录入佣金率</div>
                      <div className="logic-line">• 命中扫码免佣时，应付佣金固定为核销金额 × 0.6%</div>
                      <div className="logic-line">• 扫码免佣减免金额 = 核销金额 × max(录入佣金率 - 0.6%, 0)</div>
                      <div className="logic-line">• 平台抽佣部分 = max(录入佣金率 - 0.6%, 0)</div>
                      <div className="logic-line">• 总返还比例 = 灵活返佣 + 暑期返佣 + 季框返佣</div>
                      <div className="logic-line">• 佣金返还金额 = 核销金额 × 平台抽佣部分 × 总返还比例（命中免佣时平台抽佣部分为0）</div>
                      <div className="logic-line">• 扫码订单数 = 核销金额 ÷ 扫码客单价（四舍五入）</div>
                      <div className="logic-line">• 扫码激励金额 = 扫码订单数 × 单均激励金额 + B补金额</div>
                      <div className="logic-line">• 激励金额（含返佣） = 佣金返还金额 + 扫码激励金额</div>
                      <div className="logic-line">• 商户实际成本 = 商家需支付佣金 - 激励金额（含返佣）</div>
                    </div>
                  </Collapsible>
                </div>
              </div>
            </div>
          )}

          {currentId === 'roi' && (
            <div className="calc-content">
              <div className="calc-layout">
                <div className="calc-main">
                  <div className="card">
                    <div className="card-title-row">
                      <span>参数输入</span>
                      <Button onClick={() => resetCalculator('roi')}>重置</Button>
                    </div>
                    <div className="form-grid">
                      <div className="calc-subtitle form-row-span">基础信息（必填）</div>
                      <div className="gross-top-grid form-row-span">
                        <InputField
                          className="gross-top-grid-price"
                          label="团购价 (原价)"
                          value={state.data.roi.rawPrice}
                          placeholder="请输入"
                          zeroAsEmpty
                          onChange={(v) => updateCalculator('roi', { rawPrice: v })}
                        />
                        <RoiCategorySelector
                          state={state.data.roi}
                          industryClassName="gross-top-grid-industry"
                          industrySpan={false}
                          onChange={(updates) => updateCalculator('roi', updates)}
                        />
                      </div>
                      <div className="upflip-commission-field form-row-span">
                        <InputField
                          label="平台佣金（已含软件服务费）"
                          percent
                          placeholder="请输入"
                          value={formatInputPercent(state.data.roi.commissionRate)}
                          onChange={(v) => updateCalculator('roi', { commissionRate: v / 100, commissionRateEdited: true })}
                        />
                        <div className="upflip-commission-hint">
                          推荐佣金率：{(state.data.roi.rateGroup * 100).toFixed(2)}%
                          {state.data.roi.commissionRateEdited ? '（已手动修改）' : '（跟随类目）'}
                          {state.data.roi.commissionRateEdited && (
                            <>
                              {' '}
                              <button
                                type="button"
                                className="collapse-trigger"
                                onClick={() =>
                                  updateCalculator('roi', {
                                    commissionRate: state.data.roi.rateGroup,
                                    commissionRateEdited: false,
                                  })
                                }
                              >
                                恢复推荐值
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="calc-subtitle form-row-span">成本预估（核心）</div>
                      <InputField
                        label="成本"
                        value={state.data.roi.cost}
                        placeholder="请输入"
                        zeroAsEmpty
                        onChange={(v) => updateCalculator('roi', { cost: v })}
                      />
                      <InputField
                        label="顾客支付价（扣除所有商促减免）"
                        value={state.data.roi.customerPayPrice === null ? '' : state.data.roi.customerPayPrice}
                        allowEmpty
                        placeholder="请输入"
                        onEmpty={() => updateCalculator('roi', { customerPayPrice: null })}
                        onChange={(v) => updateCalculator('roi', { customerPayPrice: v })}
                        hint="不填默认=团购价"
                      />
                      <InputField
                        label="毛利率（抽佣后）"
                        percent
                        value={state.data.roi.marginRate === null ? '' : state.data.roi.marginRate * 100}
                        allowEmpty
                        placeholder="请输入"
                        zeroAsEmpty
                        onEmpty={() => updateCalculator('roi', { marginRate: null })}
                        onChange={(v) => updateCalculator('roi', { marginRate: v / 100 })}
                        hint="不填默认按（团购价-成本-团购价×平台佣金）/团购价计算"
                      />
                      <div className="calc-subtitle form-row-span">效果预期（变量）</div>
                      <InputField
                        label="核销前订单量"
                        value={state.data.roi.ordersBefore}
                        placeholder="请输入"
                        zeroAsEmpty
                        onChange={(v) => updateCalculator('roi', { ordersBefore: v })}
                      />
                      <InputField
                        label="订单涨幅"
                        hint="由BD自行填写，不作为实际承诺依据"
                        percent
                        placeholder="请输入"
                        value={state.data.roi.growthRatio * 100}
                        zeroAsEmpty
                        onChange={(v) => updateCalculator('roi', { growthRatio: v / 100 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="calc-side">
                  <div
                    className={`card res-card decision-card ${
                      roiConclusion.tone === 'positive'
                        ? 'decision-card--positive'
                        : roiConclusion.tone === 'danger'
                          ? 'decision-card--danger'
                          : roiConclusion.tone === 'warning'
                            ? 'decision-card--warning'
                            : 'decision-card--empty'
                    }`}
                  >
                    <div className="decision-top">
                      <div>
                        <div className="decision-kicker">{roiInputReady ? '核心结论' : '空状态'}</div>
                        <div className="decision-title">{roiConclusion.verdict}</div>
                      </div>
                      <div
                        className={`decision-badge ${
                          roiConclusion.tone === 'positive'
                            ? 'decision-badge--positive'
                            : roiConclusion.tone === 'danger'
                              ? 'decision-badge--danger'
                              : roiConclusion.tone === 'warning'
                                ? 'decision-badge--warning'
                                : 'decision-badge--empty'
                        }`}
                      >
                        {roiConclusion.badge}
                      </div>
                    </div>
                    <div className="decision-metrics">
                      <div className="decision-metric">
                        <div className="decision-metric-label">收益增量</div>
                        <div
                          className={`decision-metric-value ${
                            roiInputReady
                              ? roiResult.profitDelta >= 0
                                ? 'decision-metric-value--positive'
                                : 'decision-metric-value--negative'
                              : ''
                          }`}
                        >
                          {roiInputReady ? formatNumber(roiResult.profitDelta) : '-'}
                        </div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">ROI</div>
                        <div className="decision-metric-value">
                          {roiInputReady ? (roiResult.totalDiscount > 0 ? formatNumber(roiResult.roi) : 'N/A') : '-'}
                        </div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">保本涨幅</div>
                        <div className="decision-metric-value">{roiInputReady ? formatPercent(roiResult.requiredGrowth) : '-'}</div>
                      </div>
                    </div>
                    <div className="decision-summary">{roiConclusion.reason}</div>
                    <div className="decision-notes">
                      <div className="decision-note">
                        <span className="decision-note-label">建议</span>
                        <span>{roiConclusion.action}</span>
                      </div>
                    </div>
                    <div className="res-actions">
                      <Button
                        disabled={!roiInputReady}
                        onClick={() => handleCopy('roi', buildRoiCopyText(state.data.roi, roiResult))}
                      >
                        {optimisticCopyLabels.roi || '一键复制结果'}
                      </Button>
                    </div>
                  </div>

                  <div className="card roi-compare-card">
                    <div className="card-title">前后对比</div>
                    <div className="roi-compare-table-wrap">
                      <table className="roi-compare-table">
                        <thead>
                          <tr>
                            <th>指标</th>
                            <th>活动前</th>
                            <th>活动后</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>单均利润</td>
                            <td>{roiInputReady ? formatNumber(roiResult.profitPerOrderBefore) : '-'}</td>
                            <td className="roi-compare-focus">{roiInputReady ? formatNumber(roiResult.profitPerOrderAfter) : '-'}</td>
                          </tr>
                          <tr>
                            <td>总收益</td>
                            <td>{roiInputReady ? formatNumber(roiResult.baseProfitBefore) : '-'}</td>
                            <td>{roiInputReady ? formatNumber(roiResult.profitAfter) : '-'}</td>
                          </tr>
                          <tr>
                            <td>订单量</td>
                            <td>{roiInputReady ? formatNumber(state.data.roi.ordersBefore, 0) : '-'}</td>
                            <td>{roiInputReady ? formatNumber(roiResult.ordersAfter, 0) : '-'}</td>
                          </tr>
                          <tr>
                            <td>每单优惠金额</td>
                            <td>-</td>
                            <td>{roiInputReady ? formatNumber(roiResult.discountPerOrder) : '-'}</td>
                          </tr>
                          <tr>
                            <td>订单增量</td>
                            <td>-</td>
                            <td>{roiInputReady ? formatNumber(roiResult.orderIncrement, 0) : '-'}</td>
                          </tr>
                          <tr className="roi-compare-row--delta">
                            <td>整体收益增量</td>
                            <td>基线</td>
                            <td
                              className={
                                !roiInputReady
                                  ? ''
                                  : roiResult.profitDelta > 0
                                    ? 'roi-compare-growth'
                                    : roiResult.profitDelta < 0
                                      ? 'roi-compare-loss'
                                      : ''
                              }
                            >
                              {roiInputReady ? formatNumber(roiResult.profitDelta) : '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">敏感性表（辅助谈判）</div>
                    {roiInputReady ? (
                      <>
                        <div className="table-scroll roi-sensitivity-scroll">
                          <table className="scenarios-table roi-sensitivity-table">
                            <thead>
                              <tr>
                                <th>毛利率</th>
                                <th>求ROI</th>
                                <th>需达到目标单量涨幅</th>
                                <th>求折扣比例</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roiSensitivityRows.map((row) => (
                                <tr key={row.margin}>
                                  <td>{formatPercent(row.margin)}</td>
                                  <td className={row.roiByGivenGrowth >= 0 ? 'roi-positive' : 'roi-negative'}>{formatPercent(row.roiByGivenGrowth)}</td>
                                  <td>{formatPercent(row.growthForPositiveRoi)}</td>
                                  <td>{formatPercent(row.maxDiscountForPositiveRoi)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="logic-line roi-sensitivity-hint">
                          当前按固定折扣比例 {formatPercent(roiResult.discountRatio)}、固定活动涨幅 {formatPercent(state.data.roi.growthRatio)}，推演不同毛利率下结果。
                        </div>
                      </>
                    ) : (
                      <div className="roi-empty-block">请先填写左侧关键参数，敏感性表会自动生成。</div>
                    )}
                  </div>

                  <Collapsible title="计算逻辑说明">
                    <div className="logic-body">
                      <div className="logic-line"><strong>ROI 活动逻辑：</strong></div>
                      <div className="logic-line"><strong>① 前后收益一致法：</strong>活动前收益 ≤ 活动后收益</div>
                      <div className="logic-line">• 活动前收益 = 核销前订单量 × 活动前每单毛利润</div>
                      <div className="logic-line">• 活动后收益 = 活动后预估单量 × 活动后每单毛利润</div>
                      <div className="logic-line">• 保本涨幅 = 折扣比例 ÷ (毛利率-折扣比例)</div>
                      <div className="logic-line logic-line--spaced"><strong>② 投入产出比法：</strong>投入 ≤ 产出</div>
                      <div className="logic-line">• 折扣比例 = (原价-顾客支付价) ÷ 原价</div>
                      <div className="logic-line">• 活动优惠总额 = 核销前订单量 × (原价-顾客支付价)</div>
                      <div className="logic-line">• 每单利润（前） = 原价 × 毛利率</div>
                      <div className="logic-line">• 每单利润（后） = 每单利润（前） - 每单折扣</div>
                      <div className="logic-line">• 订单增量 = 核销前订单量 × 订单涨幅</div>
                      <div className="logic-line">• 奖励收入 = 订单增量 × 每单利润（后）</div>
                      <div className="logic-line">• ROI = 奖励收入 ÷ 活动优惠总额</div>
                    </div>
                  </Collapsible>

                </div>
              </div>
              <div className="disclaimer">⚠️ 注：本结果基于预设参数推演，仅供参考，不作实际单量承诺。</div>
            </div>
          )}

          {currentId === 'merchant' && (
            <div className="calc-content">
              <div className="calc-layout">
                <div className="calc-main">
                  <div className="card">
                    <div className="card-title-row">
                      <span>基础参数（先填）</span>
                      <Button onClick={() => resetCalculator('merchant')}>重置</Button>
                    </div>
                    <div className="form-grid">
                      <div className="calc-form-lead form-row-span">
                        先填类目、团购价和平台佣金，右侧会自动生成可沟通的预计入账价和话术。
                      </div>
                      <div className="calc-subtitle form-row-span">类目与扣点</div>
                      <MerchantCategorySelector state={state.data.merchant} onChange={(updates) => updateCalculator('merchant', updates)} />
                    </div>
                    <div className="form-grid">
                      <div className="calc-subtitle form-row-span">活动参数</div>
                      <InputField label="团购价" suffix="元" value={state.data.merchant.rawPrice} onChange={(v) => updateCalculator('merchant', { rawPrice: v })} />
                      <InputField label="平台佣金（已含软件服务费）" percent value={formatInputPercent(state.data.merchant.categoryCommissionRate)} onChange={(v) => updateCalculator('merchant', { categoryCommissionRate: v / 100 })} />
                      <InputField label="增量宝扣点" percent value={formatInputPercent(state.data.merchant.zengliangbaoRate)} onChange={(v) => updateCalculator('merchant', { zengliangbaoRate: v / 100 })} />
                      <InputField label="获客卡专享价折扣" percent value={formatInputPercent(state.data.merchant.huokekaDiscount)} onChange={(v) => updateCalculator('merchant', { huokekaDiscount: v / 100 })} />
                      <InputField label="膨胀券商家出资" suffix="元" value={state.data.merchant.pengzhangquanMerchantContribution} onChange={(v) => updateCalculator('merchant', { pengzhangquanMerchantContribution: v })} />
                      <InputField label="服务商佣金" percent value={formatInputPercent(state.data.merchant.serviceProviderCommission)} onChange={(v) => updateCalculator('merchant', { serviceProviderCommission: v / 100 })} />
                    </div>
                  </div>

                  <div className="collapse-section">
                    <div className="collapse-toggle" onClick={() => setMerchantAdvancedOpen(!merchantAdvancedOpen)}>
                      <span>高级配置（可选，不填也能算）</span>
                      <span className="collapse-icon">{merchantAdvancedOpen ? '▼' : '▶'}</span>
                    </div>
                    {merchantAdvancedOpen && (
                      <div className="collapse-content open">
                        <div className="form-row merchant-channel-preset">
                          <label className="merchant-channel-heading">渠道占比设置：是否会请达人/服务商做短视频或直播</label>
                          <RadioGroup
                            name="merchantChannelPreset"
                            options={[
                              { value: 'low', label: '很少' },
                              { value: 'mid', label: '偶尔' },
                              { value: 'high', label: '经常' },
                              { value: 'custom', label: '自定义' },
                            ]}
                            value={state.data.merchant.channelPreset}
                            segmented
                            onChange={(v) => {
                              if (v === 'custom') {
                                updateCalculator('merchant', { channelPreset: 'custom' })
                                return
                              }
                              const presetConfig: Record<string, { influencer: number; self: number; mall: number }> = {
                                low: { influencer: 1, self: 1, mall: 8 },
                                mid: { influencer: 3, self: 3, mall: 4 },
                                high: { influencer: 5, self: 2, mall: 3 },
                              }
                              const cfg = presetConfig[v]
                              const sum = cfg.influencer + cfg.self + cfg.mall
                              updateCalculator('merchant', {
                                channelPreset: v as 'low' | 'mid' | 'high' | 'custom',
                                channelRatio3: sum > 0 ? cfg.influencer / sum : 0,
                                channelRatio2: sum > 0 ? cfg.self / sum : 0,
                                channelRatio1: sum > 0 ? cfg.mall / sum : 0,
                              })
                            }}
                          />
                          <div className="field-hint">预设比例（达人:自播:商城）：低 1:1:8｜中 3:3:4｜高 5:2:3，可手动改。</div>
                        </div>
                        <div className="form-grid">
                          <InputField label="商城/独立卡GMV占比" percent value={formatInputPercent(state.data.merchant.channelRatio1)} onChange={(v) => updateCalculator('merchant', { channelPreset: 'custom', channelRatio1: v / 100 })} />
                          <InputField label="商家自播GMV占比" percent value={formatInputPercent(state.data.merchant.channelRatio2)} onChange={(v) => updateCalculator('merchant', { channelPreset: 'custom', channelRatio2: v / 100 })} />
                          <InputField label="达人/服务商GMV占比" percent value={formatInputPercent(state.data.merchant.channelRatio3)} onChange={(v) => updateCalculator('merchant', { channelPreset: 'custom', channelRatio3: v / 100 })} />
                        </div>
                        <div className="section-title section-title--spaced">产品覆盖率（参考）</div>
                        <div className="field-hint">三项可以同时存在，不要求合计 100%。</div>
                        <div className="form-grid">
                          <InputField label="增量宝" percent value={formatInputPercent(state.data.merchant.productRatioZengliangbao)} onChange={(v) => updateCalculator('merchant', { productRatioZengliangbao: v / 100 })} />
                          <InputField label="膨胀券" percent value={formatInputPercent(state.data.merchant.productRatioPengzhangquan)} onChange={(v) => updateCalculator('merchant', { productRatioPengzhangquan: v / 100 })} />
                          <InputField label="获客卡" percent value={formatInputPercent(state.data.merchant.productRatioHuokeka)} onChange={(v) => updateCalculator('merchant', { productRatioHuokeka: v / 100 })} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="calc-side">
                  <div className="card res-card decision-card decision-card--neutral merchant-res-card">
                    <div className="decision-top">
                      <div className="decision-kicker">沟通建议</div>
                      <div className={`merchant-status-tag ${merchantDecision.healthy ? '' : 'merchant-status-tag--warn'}`.trim()}>{merchantDecision.verdict}</div>
                    </div>
                    <div className="merchant-focus">
                      <div className="merchant-focus-label">预计入账价（每单）</div>
                      <div className="merchant-focus-value">{formatNumber(merchantResult.finalTakeHome)} 元</div>
                    </div>
                    <div className="decision-metrics">
                      <div className="decision-metric">
                        <div className="decision-metric-label">主导场景占比</div>
                        <div className="decision-metric-value">{formatPercent(merchantDecision.topScenarioShare / 100, 1)}</div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">渠道占比合计</div>
                        <div className="decision-metric-value">{formatPercent(state.data.merchant.channelRatio1 + state.data.merchant.channelRatio2 + state.data.merchant.channelRatio3, 1)}</div>
                      </div>
                    </div>
                    <div className="decision-summary">当前主导场景：{merchantDecision.topScenarioName}</div>
                    <div className="decision-notes">
                      <div className="decision-note">
                        <span className="decision-note-label">动作</span>
                        <span>{merchantDecision.action}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title-row">
                      <span>给商家的沟通话术</span>
                      <Button onClick={() => handleCopy('merchant', merchantTalkTrack)}>
                        {optimisticCopyLabels.merchant || '一键复制结果&沟通话术'}
                      </Button>
                    </div>
                    <div className="script-body">{merchantTalkTrack}</div>
                  </div>

                  <Collapsible title="场景明细（进阶，可选查看）">
                    <div className="field-hint">{merchantRatioSummary}</div>
                    <div className="table-scroll">
                      <table className="scenarios-table">
                        <thead>
                          <tr>
                            <th>营销场景</th>
                            <th>预计入账价</th>
                            <th>订单占比</th>
                          </tr>
                        </thead>
                        <tbody>
                          {merchantResult.scenarios.map((sc, idx) => {
                            const denom = merchantResult.weightedTotal > 0 ? merchantResult.weightedTotal : 1
                            return (
                              <tr key={idx}>
                                <td className="scenario-name">{sc.name}</td>
                                <td className="scenario-price">{formatNumber(sc.channelSplit.avgPrice)} 元</td>
                                <td>{((sc.productRatio / denom) * 100).toFixed(1)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Collapsible>

                  <Collapsible title="计算逻辑（可选）">
                    <div className="logic-body">
                      <div className="logic-line"><strong>1. 先算每个场景下的成交价：</strong>按获客卡、膨胀券、增量宝是否生效，得到每个场景价格。</div>
                      <div className="logic-line"><strong>2. 再扣平台佣金：</strong>场景预计入账价 = 场景成交价 - 平台佣金（已含软件服务费）。</div>
                      <div className="logic-line"><strong>3. 最后做加权：</strong>按渠道占比和产品覆盖率，把 8 种场景加权成最终预计入账价。</div>
                    </div>
                  </Collapsible>

                </div>
              </div>
            </div>
          )}

          {currentId === 'growthRecovery' && (
            <div className="calc-content">
              <div className="calc-layout">
                <div className="calc-main">
                  <div className="card">
                    <div className="card-title-row">
                      <span>目标设置</span>
                      <Button onClick={() => resetCalculator('growthRecovery')}>重置</Button>
                    </div>
                    <div className="form-grid">
                      <div className="calc-subtitle form-row-span">目标基线</div>
                      <InputField
                        label="新商目标系数"
                        percent
                        value={formatInputPercent(state.data.growthRecovery.newMerchantPerformanceTarget, 4)}
                        onChange={(v) => updateCalculator('growthRecovery', { newMerchantPerformanceTarget: v / 100 })}
                      />
                      <InputField
                        label="存量目标系数"
                        percent
                        value={formatInputPercent(state.data.growthRecovery.stockMerchantPerformanceTarget, 4)}
                        onChange={(v) => updateCalculator('growthRecovery', { stockMerchantPerformanceTarget: v / 100 })}
                      />
                      <InputField
                        label="当前目标积分"
                        value={state.data.growthRecovery.currentTargetPoints}
                        onChange={(v) => updateCalculator('growthRecovery', { currentTargetPoints: v })}
                      />
                      <InputField
                        label="本月核销目标"
                        value={state.data.growthRecovery.verificationTarget}
                        onChange={(v) => updateCalculator('growthRecovery', { verificationTarget: v })}
                      />
                      <div className="calc-subtitle form-row-span">下发结构</div>
                      <div className="growth-issue-grid-top form-row-span">
                        <InputField
                          label="预估下发量"
                          value={state.data.growthRecovery.estimatedIssue}
                          onChange={(v) => updateCalculator('growthRecovery', { estimatedIssue: v })}
                        />
                        <InputField
                          label="预估任务分母"
                          value={state.data.growthRecovery.estimatedIssueTaskDenominator}
                          onChange={(v) => updateCalculator('growthRecovery', { estimatedIssueTaskDenominator: v })}
                        />
                      </div>
                      <div className="growth-issue-grid-bottom form-row-span">
                        <InputField
                          label="货架型"
                          value={state.data.growthRecovery.issueRatioComprehensive}
                          onChange={(v) => updateCalculator('growthRecovery', { issueRatioComprehensive: v })}
                        />
                        <InputField
                          label="发文型"
                          value={state.data.growthRecovery.issueRatioArticle}
                          onChange={(v) => updateCalculator('growthRecovery', { issueRatioArticle: v })}
                        />
                        <InputField
                          label="直播型"
                          value={state.data.growthRecovery.issueRatioLive}
                          onChange={(v) => updateCalculator('growthRecovery', { issueRatioLive: v })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">回收评估</div>
                    <div className="form-grid">
                      <div className="calc-subtitle form-row-span">达成预估</div>
                      <InputField
                        label="预计核销达成率"
                        percent
                        value={formatInputPercent(state.data.growthRecovery.estimatedFinalVerificationCompletion, 2)}
                        onChange={(v) => updateCalculator('growthRecovery', { estimatedFinalVerificationCompletion: v / 100 })}
                      />
                      <InputField
                        label="预计任务达成率"
                        percent
                        value={formatInputPercent(state.data.growthRecovery.finalGrowthTaskCompletion, 2)}
                        onChange={(v) => updateCalculator('growthRecovery', { finalGrowthTaskCompletion: v / 100 })}
                      />
                      <div className="calc-subtitle form-row-span">回收动作</div>
                      <div className="growth-action-grid form-row-span">
                        <InputField
                          label="回收存量分母"
                          value={state.data.growthRecovery.recycleGrowthTaskStockDenominator}
                          onChange={(v) => updateCalculator('growthRecovery', { recycleGrowthTaskStockDenominator: v })}
                        />
                        <InputField
                          label="回收新商分母"
                          value={state.data.growthRecovery.recycleGrowthTaskNewMerchantDenominator}
                          onChange={(v) => updateCalculator('growthRecovery', { recycleGrowthTaskNewMerchantDenominator: v })}
                        />
                        <InputField
                          label="预计回收 GMV"
                          value={state.data.growthRecovery.recycleGmvByMonth}
                          onChange={(v) => updateCalculator('growthRecovery', { recycleGmvByMonth: v })}
                        />
                        <InputField
                          label="回收任务分子"
                          value={state.data.growthRecovery.recycleGrowthTaskNumerator}
                          onChange={(v) => updateCalculator('growthRecovery', { recycleGrowthTaskNumerator: v })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="calc-side">
                  <div className={`card res-card decision-card ${growthRecoveryResult.canRecycle ? 'decision-card--positive' : 'decision-card--warning'}`}>
                    <div className="decision-top">
                      <div>
                        <div className="decision-kicker">回收建议</div>
                        <div className="decision-title">{growthRecoveryResult.canRecycle ? '建议回收' : '暂不回收'}</div>
                      </div>
                      <div className="decision-badge">{growthRecoveryResult.canRecycle ? '任务影响更优' : '核销影响更高'}</div>
                    </div>
                    <div className="decision-metrics">
                      <div className="decision-metric">
                        <div className="decision-metric-label">任务权重影响</div>
                        <div className="decision-metric-value">{formatNumber(growthRecoveryResult.taskWeightImpact)}</div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">核销权重影响</div>
                        <div className="decision-metric-value">{formatNumber(growthRecoveryResult.verificationWeightImpact)}</div>
                      </div>
                      <div className="decision-metric">
                        <div className="decision-metric-label">影响差值</div>
                        <div className={`decision-metric-value ${growthRecoveryImpactGap >= 0 ? 'decision-metric-value--positive' : 'decision-metric-value--negative'}`}>
                          {growthRecoveryImpactGap >= 0 ? '+' : ''}{formatNumber(growthRecoveryImpactGap)}
                        </div>
                      </div>
                    </div>
                    <div className="decision-summary">
                      {growthRecoveryResult.canRecycle
                        ? '当前任务侧收益大于核销侧损失，可以推进回收。'
                        : '当前核销侧损失更大，先不要回收。'}
                    </div>
                    <div className="decision-notes">
                      <div className="decision-note">
                        <span className="decision-note-label">原因</span>
                        <span>{growthRecoveryConclusion.reason}</span>
                      </div>
                      <div className="decision-note">
                        <span className="decision-note-label">建议</span>
                        <span>{growthRecoveryConclusion.action}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">计算快照</div>
                    <div className="snapshot-grid">
                      <div className="snapshot-item">
                        <div className="snapshot-label">最终目标分</div>
                        <div className="snapshot-value">{formatNumber(growthRecoveryResult.finalTargetPoints)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">预计核销完成量</div>
                        <div className="snapshot-value">{formatNumber(growthRecoveryResult.estimatedFinalVerificationAbsolute)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">预计任务完成量</div>
                        <div className="snapshot-value">{formatNumber(growthRecoveryResult.finalGrowthTaskCompletionAbsolute)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">任务影响</div>
                        <div className="snapshot-value">{formatPercent(growthRecoveryResult.taskImpact, 3)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">核销影响</div>
                        <div className="snapshot-value">{formatPercent(growthRecoveryResult.verificationImpact)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">拆分-货架型</div>
                        <div className="snapshot-value">{formatNumber(growthRecoveryIssueSplit.comprehensive)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">拆分-发文型</div>
                        <div className="snapshot-value">{formatNumber(growthRecoveryIssueSplit.article)}</div>
                      </div>
                      <div className="snapshot-item">
                        <div className="snapshot-label">拆分-直播型</div>
                        <div className="snapshot-value">{formatNumber(growthRecoveryIssueSplit.live)}</div>
                      </div>
                    </div>
                  </div>

                  <Collapsible title="计算逻辑说明">
                    <div className="logic-body">
                      <div className="logic-line">• 最终目标分 = 当前目标积分 + 任务分母 × 新商目标系数</div>
                      <div className="logic-line">• 预计任务完成量 = 最终目标分 × 预计任务达成率</div>
                      <div className="logic-line">• 核销影响 = 预计回收 GMV ÷ 本月核销目标</div>
                      <div className="logic-line">• 任务影响 = (预计任务完成量 - 回收任务分子) ÷ (最终目标分 - 回收存量分母×存量目标系数 - 回收新商分母×新商目标系数) - 预计任务达成率</div>
                      <div className="logic-line">• 核销权重影响 = 核销影响 × 70 × 100</div>
                      <div className="logic-line">• 任务权重影响 = 任务影响 × 20 × 100</div>
                      <div className="logic-line">• 当任务权重影响大于核销权重影响时，建议回收</div>
                    </div>
                  </Collapsible>

                  <div className="card">
                    <div className="res-actions">
                      <Button onClick={() => handleCopy('growthRecovery', buildGrowthRecoveryCopyText(state.data.growthRecovery, growthRecoveryResult))}>
                        {optimisticCopyLabels.growthRecovery || '一键复制结果'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentId === 'scanIntent' && (
            <div className="calc-content">
              <div className="calc-layout scan-intent-layout">
                <div className="calc-main">
                  <div className="card">
                    <div className="card-title-row">
                      <span>扫码沟通参数</span>
                      <Button onClick={() => resetCalculator('scanIntent')}>重置</Button>
                    </div>
                    <div className="form-grid scan-intent-form-grid">
                      <div className="calc-form-lead form-row-span">
                        这是商家沟通版测算。默认按“顾客领优惠前需先关注店铺”处理，所以上翻顾客数会直接计为新增粉丝数。
                      </div>
                      <div className="scan-intent-top-row form-row-span">
                        <RadioGroup
                          label="佣金口径"
                          name="scanIntentMode"
                          options={[
                            { value: 'exempt', label: '免佣' },
                            { value: 'nonExempt', label: '不免佣' },
                          ]}
                          value={state.data.scanIntent.mode}
                          className="scan-intent-mode"
                          segmented
                          span={false}
                          onChange={(value) => updateCalculator('scanIntent', { mode: value as 'exempt' | 'nonExempt' })}
                        />
                        <ScanIntentCategorySelector
                          state={state.data.scanIntent}
                          onChange={(updates) => updateCalculator('scanIntent', updates)}
                          industryClassName="scan-intent-industry"
                          industrySpan={false}
                          showCategory={false}
                        />
                      </div>
                      <div className="calc-subtitle form-row-span">类目</div>
                      <ScanIntentCategorySelector
                        state={state.data.scanIntent}
                        onChange={(updates) => updateCalculator('scanIntent', updates)}
                        showIndustry={false}
                        showCategoryLabel={false}
                      />
                      <div className="scan-intent-input-grid form-row-span">
                        <InputField
                          label="客单价"
                          value={state.data.scanIntent.avgOrderValue}
                          onChange={(v) => updateCalculator('scanIntent', { avgOrderValue: v })}
                        />
                        <InputField
                          label="预估上翻顾客数"
                          value={state.data.scanIntent.incrementalCustomers}
                          onChange={(v) => updateCalculator('scanIntent', { incrementalCustomers: v })}
                        />
                        {state.data.scanIntent.mode === 'exempt' ? (
                          <>
                            <InputField
                              label="佣金率"
                              percent
                              value="0"
                              onChange={() => {}}
                              disabled
                              hint={`免佣模式下固定按 0% 处理；当前类目常规佣金率参考 ${(state.data.scanIntent.rateGroup * 100).toFixed(2)}%。`}
                            />
                            <InputField
                              label="通道费率"
                              percent
                              value={formatInputPercent(state.data.scanIntent.channelFeeRate, 4)}
                              onChange={(v) => updateCalculator('scanIntent', { channelFeeRate: v / 100 })}
                            />
                          </>
                        ) : (
                          <div className="upflip-commission-field scan-intent-commission-field">
                            <InputField
                              label="佣金率"
                              percent
                              value={formatInputPercent(state.data.scanIntent.commissionRate, 4)}
                              onChange={(v) => updateCalculator('scanIntent', { commissionRate: v / 100, commissionRateEdited: true })}
                            />
                            <div className="rate-assist-row">
                              <div className="field-hint">
                                推荐佣金率：{(state.data.scanIntent.rateGroup * 100).toFixed(2)}%
                                {state.data.scanIntent.commissionRateEdited ? '（已手动修改）' : '（跟随类目）'}
                              </div>
                              <button
                                type="button"
                                className="text-link-btn"
                                onClick={() =>
                                  updateCalculator('scanIntent', {
                                    commissionRate: state.data.scanIntent.rateGroup,
                                    commissionRateEdited: false,
                                  })
                                }
                              >
                                恢复推荐值
                              </button>
                            </div>
                          </div>
                        )}
                        <InputField
                          className={
                            state.data.scanIntent.mode === 'exempt'
                              ? 'scan-intent-growth-rate scan-intent-growth-rate--span'
                              : 'scan-intent-growth-rate'
                          }
                          label="交易额增长率"
                          percent
                          value={formatInputPercent(state.data.scanIntent.growthRate, 2)}
                          onChange={(v) => updateCalculator('scanIntent', { growthRate: v / 100 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="side-card">
                    <div className="side-title">使用说明（沟通口径）</div>
                    <div className="side-list">
                      {scanIntentRiskTips.map((tip, idx) => (
                        <div className="side-item" key={idx}>
                          <span className="side-dot"></span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="calc-side">
                  <div className="card scan-intent-kpi-card">
                    <div className="card-title">关键结果</div>
                    <div className="snapshot-grid scan-intent-kpi-grid">
                      <div className="snapshot-item scan-intent-kpi-item">
                        <div className="snapshot-label">扫码成本</div>
                        <div className="snapshot-value">{formatScanAmount(scanIntentResult.scanCost)}</div>
                      </div>
                      <div className="snapshot-item scan-intent-kpi-item">
                        <div className="snapshot-label">交易额增长</div>
                        <div className="snapshot-value scan-intent-kpi-value--positive">{formatScanAmount(scanIntentResult.gmvIncrement)}</div>
                      </div>
                      <div className="snapshot-item scan-intent-kpi-item">
                        <div className="snapshot-label">粉丝预估增长</div>
                        <div className="snapshot-value">{formatScanCount(scanIntentResult.estimatedFans)}</div>
                      </div>
                      <div className="snapshot-item scan-intent-kpi-item">
                        <div className="snapshot-label">撬动倍数</div>
                        <div className="snapshot-value scan-intent-kpi-value--strong">{scanIntentRoundedMultiple} 倍</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">与商家沟通话术</div>
                    <div className="script-body">{scanIntentTalkTrack}</div>
                    <div className="res-actions">
                      <Button onClick={() => handleCopy('scanIntent', scanIntentTalkTrack)}>
                        {optimisticCopyLabels.scanIntent || '复制与商家沟通话术'}
                      </Button>
                    </div>
                  </div>

                  <Collapsible title="计算逻辑说明">
                    <div className="logic-body">
                      <div className="logic-line"><strong>1. 交易额</strong> = 客单价 × 预估上翻顾客数</div>
                      <div className="logic-line">
                        <strong>2. 扫码成本</strong> = 交易额 × {state.data.scanIntent.mode === 'exempt' ? '(0 + 通道费率)' : '佣金率'}
                      </div>
                      <div className="logic-line"><strong>3. 交易额增长</strong> = 交易额 × 交易额增长率</div>
                      <div className="logic-line"><strong>4. 预计新增粉丝</strong> = 预估上翻顾客数</div>
                      <div className="logic-line"><strong>5. 增长倍数</strong> = 交易额增长 ÷ 扫码成本</div>
                    </div>
                  </Collapsible>
                </div>
              </div>
            </div>
          )}

          {(currentId === 'selfLive' || currentId === 'talentLive' || currentId === 'talentVideo') && (
            <LiveRoiCalculator
              id={currentId}
              state={state.data[currentId]}
              result={liveRoiResults[currentId]}
              onFieldChange={(field, value) =>
                updateCalculator(currentId, { [field]: value } as Partial<CalculatorState['data'][typeof currentId]>)
              }
              onReset={() => resetCalculator(currentId)}
            />
          )}

          <div className="copy-risk-float" role="note" aria-label="风险提醒">
            <span className="copy-risk-float-text">
              风险提醒：计算内容仅供参考，请使用者核对业务口径后再对外使用；若因使用不当导致问题，需由使用者自行负责。
            </span>
          </div>
        </div>
      )}
    </>
  )
}
