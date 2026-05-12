import type {
  LiveCalculatorId,
  SelfLiveSheetState,
  SheetResult,
  TalentLiveSheetState,
  TalentVideoSheetState,
} from '../types'
import { LIVE_ROI_META, LIVE_ROI_NOTES } from '../data/liveRoiConfigs'
import { Button } from './Button'
import { InfoTip } from './InfoTip'
import { InputField } from './InputField'
import { RadioGroup } from './RadioGroup'

interface LiveRoiField {
  label: string
  kind: 'input' | 'readonly'
  value?: number
  display?: string
  percent?: boolean
  suffix?: string
  tone?: 'default' | 'gray' | 'profit'
  appearance?: 'default' | 'linked' | 'computed'
  tooltip?: string
  note?: string
  onChange?: (value: number) => void
}

interface LiveRoiModeSection {
  eyebrow: string
  title: string
  description: string
  fields: LiveRoiField[]
  notes?: string[]
  toggle?: {
    label: string
    name: string
    value: 'linked' | 'custom'
    onChange: (value: 'linked' | 'custom') => void
  }
}

type LiveRoiSummaryTone = 'neutral' | 'positive' | 'negative'

interface LiveRoiSummaryItem {
  label: string
  value: string
  tone?: LiveRoiSummaryTone
}

interface LiveRoiSummarySection {
  title: string
  items: LiveRoiSummaryItem[]
}

interface LiveRoiSummaryModel {
  title: string
  heroLabel: string
  heroValue: string
  heroNote: string
  heroTone?: LiveRoiSummaryTone
  sections: LiveRoiSummarySection[]
}

interface LiveRoiViewModel {
  baseDescription: string
  baseFields: LiveRoiField[]
  modeA: LiveRoiModeSection
  modeB: LiveRoiModeSection
  summary: LiveRoiSummaryModel
}

interface LiveRoiCalculatorProps {
  id: LiveCalculatorId
  state: SelfLiveSheetState | TalentLiveSheetState | TalentVideoSheetState
  result: SheetResult
  onFieldChange: (field: string, value: number | 'linked' | 'custom') => void
  onReset: () => void
}

const formatRoi = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '/'
  return `${value.toFixed(2)} 倍`
}

const formatPercentValue = (value: number | null, digits = 2): string => {
  if (value === null || !Number.isFinite(value)) return '/'
  return `${(value * 100).toFixed(digits)}%`
}

const formatMoneyValue = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '/'
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const resolveSummaryTone = (value: number | null): LiveRoiSummaryTone => {
  if (value === null || !Number.isFinite(value)) return 'neutral'
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const buildSummaryModel = (result: SheetResult): LiveRoiSummaryModel => ({
  title: '模式对比总览',
  heroLabel: '总利润',
  heroValue: formatMoneyValue(result.totalProfit),
  heroNote: '模式一 + 模式二的预计合计利润',
  heroTone: resolveSummaryTone(result.totalProfit),
  sections: [
    {
      title: '模式一 · 非纯佣 / 一口价',
      items: [
        { label: '非纯佣盈亏平衡 ROI', value: formatRoi(result.nonPure.breakEvenRoi) },
        { label: '非纯佣实际 ROI', value: formatRoi(result.nonPure.actualRoi) },
        { label: '非纯佣利润', value: formatMoneyValue(result.nonPure.profit), tone: resolveSummaryTone(result.nonPure.profit) },
      ],
    },
    {
      title: '模式二 · 纯佣 / CPS',
      items: [
        { label: '纯佣实际利润率', value: formatPercentValue(result.pure.profitRate), tone: resolveSummaryTone(result.pure.profitRate) },
        { label: '纯佣利润', value: formatMoneyValue(result.pure.profit), tone: resolveSummaryTone(result.pure.profit) },
      ],
    },
  ],
})

function LiveRoiSummaryCard({ summary }: { summary: LiveRoiSummaryModel }) {
  return (
    <section className="card live-roi-summary-card">
      <div className="card-title">{summary.title}</div>

      <div className={`live-roi-summary-hero live-roi-summary-hero--${summary.heroTone || 'neutral'}`.trim()}>
        <div className="live-roi-summary-hero-label">{summary.heroLabel}</div>
        <div className="live-roi-summary-hero-value">{summary.heroValue}</div>
        <div className="live-roi-summary-hero-note">{summary.heroNote}</div>
      </div>

      {summary.sections.map((section) => (
        <div key={section.title} className="live-roi-summary-section">
          <div className="live-roi-summary-section-title">{section.title}</div>
          <div className="live-roi-summary-list">
            {section.items.map((item) => (
              <div key={`${section.title}-${item.label}`} className={`live-roi-summary-item live-roi-summary-item--${item.tone || 'neutral'}`.trim()}>
                <div className="live-roi-summary-item-label">{item.label}</div>
                <div className="live-roi-summary-item-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function LiveRoiFieldItem({ field }: { field: LiveRoiField }) {
  const labelAdornment = field.tooltip ? <InfoTip text={field.tooltip} label={`查看${field.label}说明`} /> : null

  if (field.kind === 'input' && field.onChange) {
    return (
      <InputField
        label={field.label}
        labelAdornment={labelAdornment}
        value={field.percent ? (field.value || 0) * 100 : field.value || 0}
        percent={field.percent}
        suffix={field.suffix}
        hint={field.note}
        onChange={(value) => field.onChange?.(field.percent ? value / 100 : value)}
      />
    )
  }

  return (
    <div
      className={`live-roi-static-field ${
        field.tone === 'gray'
          ? 'live-roi-static-field--gray'
          : field.tone === 'profit'
            ? 'live-roi-static-field--profit'
            : ''
      } ${
        field.appearance === 'linked'
          ? 'live-roi-static-field--linked'
          : field.appearance === 'computed'
            ? 'live-roi-static-field--computed'
            : ''
      }`.trim()}
    >
      <div className="live-roi-static-head">
        <span className="live-roi-static-label">{field.label}</span>
        {labelAdornment}
      </div>
      <div className="live-roi-static-value">{field.display || '/'}</div>
      {field.note && <div className="live-roi-static-note">{field.note}</div>}
    </div>
  )
}

function LiveRoiModeCard({ section }: { section: LiveRoiModeSection }) {
  return (
    <section className="card live-roi-mode-card">
      <div className="live-roi-mode-head">
        <div>
          <div className="live-roi-mode-kicker">{section.eyebrow}</div>
          <div className="live-roi-mode-title">{section.title}</div>
          <div className="live-roi-mode-desc">{section.description}</div>
        </div>
      </div>

      {section.notes && section.notes.length > 0 && (
        <div className="live-roi-mode-note">
          {section.notes.join(' ')}
        </div>
      )}

      {section.toggle && (
        <RadioGroup
          label={section.toggle.label}
          name={section.toggle.name}
          options={[
            { value: 'linked', label: '沿用模式一 GMV' },
            { value: 'custom', label: '独立填写 GMV' },
          ]}
          value={section.toggle.value}
          onChange={(value) => section.toggle?.onChange(value as 'linked' | 'custom')}
          segmented
          horizontal
          span={false}
          className="live-roi-toggle"
        />
      )}

      <div className="live-roi-field-grid">
        {section.fields.map((field) => (
          <LiveRoiFieldItem key={`${section.title}-${field.label}`} field={field} />
        ))}
      </div>
    </section>
  )
}

const buildSelfLiveView = (
  state: SelfLiveSheetState,
  result: SheetResult,
  onFieldChange: (field: keyof SelfLiveSheetState, value: number | 'linked' | 'custom') => void,
): LiveRoiViewModel => ({
  baseDescription: '两种测算模式共用的基础参数先在这里填写，纯佣模式会自动沿用。',
  baseFields: [
    { label: '产品平均客单价', kind: 'input', value: state.averageOrderValue, suffix: '元', onChange: (value) => onFieldChange('averageOrderValue', value) },
    { label: '产品平均成本', kind: 'input', value: state.averageCost, suffix: '元', onChange: (value) => onFieldChange('averageCost', value) },
    { label: '产品利润率', kind: 'readonly', display: formatPercentValue(result.nonPure.productMargin), tone: 'gray', appearance: 'computed', note: '系统会按客单价和成本自动计算' },
    { label: '平台抽成', kind: 'input', value: state.platformRate, percent: true, onChange: (value) => onFieldChange('platformRate', value) },
  ],
  modeA: {
    eyebrow: '模式一',
    title: '非纯佣 / 一口价',
    description: '填写投流、一口价和抽成参数，判断该模式是否达到盈亏线。',
    notes: ['这部分用于测算非纯佣 / 一口价合作下的真实投产表现。'],
    fields: [
      { label: '服务商佣金', kind: 'input', value: state.serviceProviderRate, percent: true, onChange: (value) => onFieldChange('serviceProviderRate', value) },
      { label: '其他全量抽成', kind: 'input', value: state.otherFullRate, percent: true, onChange: (value) => onFieldChange('otherFullRate', value) },
      { label: '投流费用', kind: 'input', value: state.trafficCost, suffix: '元', onChange: (value) => onFieldChange('trafficCost', value) },
      { label: '服务商一口价', kind: 'input', value: state.serviceFlatFee, suffix: '元', onChange: (value) => onFieldChange('serviceFlatFee', value) },
      { label: '直播间运营成本', kind: 'input', value: state.liveOperationCost, suffix: '元', onChange: (value) => onFieldChange('liveOperationCost', value) },
      { label: '核销 GMV', kind: 'input', value: state.settlementGmv, suffix: '元', onChange: (value) => onFieldChange('settlementGmv', value) },
      {
        label: '直播间运营成本比例（参考）',
        kind: 'input',
        value: state.liveOperationRate,
        percent: true,
        note: '保留原表字段，当前网页结果不直接使用这个比例',
        onChange: (value) => onFieldChange('liveOperationRate', value),
      },
    ],
  },
  modeB: {
    eyebrow: '模式二',
    title: '纯佣 / CPS',
    description: '基础信息已自动沿用，只看纯佣模式自己的佣金口径和利润结果。',
    notes: ['客单价、成本和平台抽成都直接沿用上面的“产品基础信息设定”。'],
    toggle: {
      label: '纯佣模式 GMV 口径',
      name: 'self-live-pure-gmv-mode',
      value: state.pureSettlementGmvMode,
      onChange: (value) => {
        onFieldChange('pureSettlementGmvMode', value)
        if (value === 'custom') {
          onFieldChange('pureSettlementGmv', state.settlementGmv)
        }
      },
    },
    fields: [
      {
        label: '服务商佣金',
        kind: 'readonly',
        display: formatPercentValue(result.pure.talentCommissionRate),
        appearance: 'linked',
        note: '自动沿用非纯佣里的“服务商佣金”',
      },
      {
        label: '其他全量抽成',
        kind: 'readonly',
        display: formatPercentValue(result.pure.serviceCommissionRate),
        appearance: 'linked',
        note: '自动沿用非纯佣里的“其他全量抽成”',
      },
      {
        label: '核销 GMV',
        kind: state.pureSettlementGmvMode === 'custom' ? 'input' : 'readonly',
        value: state.pureSettlementGmv,
        display: formatMoneyValue(result.pure.settlementGmv),
        suffix: '元',
        appearance: state.pureSettlementGmvMode === 'custom' ? 'default' : 'linked',
        onChange: (value) => onFieldChange('pureSettlementGmv', value),
        note:
          state.pureSettlementGmvMode === 'custom'
            ? '这里可以单独测算纯佣模式下的 GMV'
            : '当前自动沿用非纯佣模式的核销 GMV',
      },
    ],
  },
  summary: buildSummaryModel(result),
})

const buildTalentLiveView = (
  state: TalentLiveSheetState,
  result: SheetResult,
  onFieldChange: (field: keyof TalentLiveSheetState, value: number | 'linked' | 'custom') => void,
): LiveRoiViewModel => ({
  baseDescription: '先填两种模式共用的产品参数；纯佣模式再补自己专属的成本和佣金字段。',
  baseFields: [
    { label: '产品平均客单价', kind: 'input', value: state.averageOrderValue, suffix: '元', onChange: (value) => onFieldChange('averageOrderValue', value) },
    { label: '产品平均成本', kind: 'input', value: state.averageCost, suffix: '元', onChange: (value) => onFieldChange('averageCost', value) },
    { label: '产品利润率', kind: 'readonly', display: formatPercentValue(result.nonPure.productMargin), tone: 'gray', appearance: 'computed', note: '系统会按客单价和成本自动计算' },
    { label: '平台抽成', kind: 'input', value: state.platformRate, percent: true, onChange: (value) => onFieldChange('platformRate', value) },
  ],
  modeA: {
    eyebrow: '模式一',
    title: '非纯佣 / 一口价',
    description: '适合测算达人直播合作里，包含投流和一口价在内的整体投入产出。',
    notes: ['如果服务商投入已经包含达人成本，不要在达人投入里重复计算。'],
    fields: [
      { label: '服务商佣金', kind: 'input', value: state.serviceProviderRate, percent: true, onChange: (value) => onFieldChange('serviceProviderRate', value) },
      { label: '其他全量抽成', kind: 'input', value: state.otherFullRate, percent: true, onChange: (value) => onFieldChange('otherFullRate', value) },
      { label: '达人总费用（CPS + 一口价）', kind: 'input', value: state.talentTotalFee, suffix: '元', onChange: (value) => onFieldChange('talentTotalFee', value) },
      { label: '投流费用', kind: 'input', value: state.trafficCost, suffix: '元', onChange: (value) => onFieldChange('trafficCost', value) },
      { label: '服务商一口价', kind: 'input', value: state.serviceFlatFee, suffix: '元', onChange: (value) => onFieldChange('serviceFlatFee', value) },
      { label: '核销 GMV', kind: 'input', value: state.settlementGmv, suffix: '元', onChange: (value) => onFieldChange('settlementGmv', value) },
    ],
  },
  modeB: {
    eyebrow: '模式二',
    title: '纯佣 / CPS',
    description: '保留原表纯佣默认值，单独判断纯佣模式下还能剩下多少利润。',
    notes: ['原表纯佣默认值 10 / 0 / 8% 已保留，不擅自改写业务口径。'],
    toggle: {
      label: '纯佣模式 GMV 口径',
      name: 'talent-live-pure-gmv-mode',
      value: state.pureSettlementGmvMode,
      onChange: (value) => {
        onFieldChange('pureSettlementGmvMode', value)
        if (value === 'custom') {
          onFieldChange('pureSettlementGmv', state.settlementGmv)
        }
      },
    },
    fields: [
      { label: '产品平均成本（纯佣）', kind: 'input', value: state.pureAverageCost, suffix: '元', onChange: (value) => onFieldChange('pureAverageCost', value) },
      { label: '达人佣金', kind: 'input', value: state.pureTalentCommissionRate, percent: true, onChange: (value) => onFieldChange('pureTalentCommissionRate', value) },
      { label: '服务商佣金', kind: 'input', value: state.pureServiceCommissionRate, percent: true, onChange: (value) => onFieldChange('pureServiceCommissionRate', value) },
      {
        label: '核销 GMV',
        kind: state.pureSettlementGmvMode === 'custom' ? 'input' : 'readonly',
        value: state.pureSettlementGmv,
        display: formatMoneyValue(result.pure.settlementGmv),
        suffix: '元',
        appearance: state.pureSettlementGmvMode === 'custom' ? 'default' : 'linked',
        onChange: (value) => onFieldChange('pureSettlementGmv', value),
        note:
          state.pureSettlementGmvMode === 'custom'
            ? '这里可以单独测算纯佣模式下的 GMV'
            : '当前自动沿用非纯佣模式的核销 GMV',
      },
    ],
  },
  summary: buildSummaryModel(result),
})

const buildTalentVideoView = (
  state: TalentVideoSheetState,
  result: SheetResult,
  onFieldChange: (field: keyof TalentVideoSheetState, value: number | 'linked' | 'custom') => void,
): LiveRoiViewModel => ({
  baseDescription: '先设置共用的产品参数，下面再分别填短视频一口价模式和纯佣模式的专属参数。',
  baseFields: [
    { label: '产品平均客单价', kind: 'input', value: state.averageOrderValue, suffix: '元', onChange: (value) => onFieldChange('averageOrderValue', value) },
    { label: '产品平均成本', kind: 'input', value: state.averageCost, suffix: '元', onChange: (value) => onFieldChange('averageCost', value) },
    { label: '产品利润率', kind: 'readonly', display: formatPercentValue(result.nonPure.productMargin), tone: 'gray', appearance: 'computed', note: '系统会按客单价和成本自动计算' },
    { label: '平台抽成', kind: 'input', value: state.platformRate, percent: true, onChange: (value) => onFieldChange('platformRate', value) },
  ],
  modeA: {
    eyebrow: '模式一',
    title: '非纯佣 / 一口价',
    description: '适合测算短视频合作里包含达人费用、投流和其他费用的整体表现。',
    notes: ['如果服务商投入已经包含达人成本，不要在达人投入里重复计算。'],
    fields: [
      { label: '服务商佣金', kind: 'input', value: state.serviceProviderRate, percent: true, onChange: (value) => onFieldChange('serviceProviderRate', value) },
      { label: '其他全量抽成', kind: 'input', value: state.otherFullRate, percent: true, onChange: (value) => onFieldChange('otherFullRate', value) },
      { label: '达人总费用（CPS + 一口价）', kind: 'input', value: state.talentTotalFee, suffix: '元', onChange: (value) => onFieldChange('talentTotalFee', value) },
      { label: '投流费用', kind: 'input', value: state.trafficCost, suffix: '元', onChange: (value) => onFieldChange('trafficCost', value) },
      { label: '服务商一口价', kind: 'input', value: state.serviceFlatFee, suffix: '元', onChange: (value) => onFieldChange('serviceFlatFee', value) },
      { label: '其他费用', kind: 'input', value: state.otherFee, suffix: '元', onChange: (value) => onFieldChange('otherFee', value) },
      { label: '核销 GMV', kind: 'input', value: state.settlementGmv, suffix: '元', onChange: (value) => onFieldChange('settlementGmv', value) },
    ],
  },
  modeB: {
    eyebrow: '模式二',
    title: '纯佣 / CPS',
    description: '短视频纯佣模式会保留原表中的单独 GMV 和服务商佣金映射逻辑。',
    notes: ['这个模式的核销 GMV 单独填写，不自动沿用非纯佣模式。'],
    fields: [
      { label: '达人佣金', kind: 'input', value: state.pureTalentCommissionRate, percent: true, onChange: (value) => onFieldChange('pureTalentCommissionRate', value) },
      {
        label: '服务商佣金',
        kind: 'readonly',
        display: formatPercentValue(state.otherFullRate),
        appearance: 'linked',
        note: '自动沿用非纯佣里的“其他全量抽成”',
      },
      { label: '核销 GMV', kind: 'input', value: state.pureSettlementGmv, suffix: '元', onChange: (value) => onFieldChange('pureSettlementGmv', value) },
    ],
  },
  summary: buildSummaryModel(result),
})

export function LiveRoiCalculator({
  id,
  state,
  result,
  onFieldChange,
  onReset,
}: LiveRoiCalculatorProps) {
  const meta = LIVE_ROI_META[id]

  const view =
    id === 'selfLive'
      ? buildSelfLiveView(state as SelfLiveSheetState, result, (field, value) => onFieldChange(field, value))
      : id === 'talentLive'
        ? buildTalentLiveView(state as TalentLiveSheetState, result, (field, value) => onFieldChange(field, value))
        : buildTalentVideoView(state as TalentVideoSheetState, result, (field, value) => onFieldChange(field, value))

  return (
    <div className="calc-content">
      <div className="live-roi-shell">
        <div className="live-roi-layout">
          <div className="live-roi-main">
            <section className="card live-roi-primary-card">
              <div className="live-roi-primary-head">
                <div className="live-roi-intro-copy">
                  <span className="live-roi-sheet-chip">{meta.workbookSheet}</span>
                  <div className="live-roi-intro-title">{meta.workbookTitle}</div>
                  <div className="live-roi-intro-desc">{meta.helper}</div>
                </div>
                <Button onClick={onReset}>重置</Button>
              </div>

              <div className="live-roi-primary-divider" />

              <div className="live-roi-base-head">
                <div className="card-title">产品基础信息设定</div>
                <div className="live-roi-base-desc">{view.baseDescription}</div>
              </div>
              <div className="live-roi-base-grid">
                {view.baseFields.map((field) => (
                  <LiveRoiFieldItem key={`base-${field.label}`} field={field} />
                ))}
              </div>
            </section>

            <div className="live-roi-mode-panels">
              <LiveRoiModeCard section={view.modeA} />
              <LiveRoiModeCard section={view.modeB} />
            </div>
          </div>

          <div className="live-roi-side">
            <LiveRoiSummaryCard summary={view.summary} />

            <details className="card live-roi-notes-disclosure">
              <summary className="live-roi-notes-summary">
                <span className="card-title">使用说明</span>
                <span className="live-roi-notes-summary-hint">展开查看</span>
              </summary>
              <ul className="live-roi-notes">
                {LIVE_ROI_NOTES[id].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
