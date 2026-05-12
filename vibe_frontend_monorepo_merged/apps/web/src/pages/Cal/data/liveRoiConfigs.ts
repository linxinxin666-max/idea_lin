import type { LiveCalculatorId } from '../types'

export interface LiveRoiMeta {
  id: LiveCalculatorId
  title: string
  subtitle: string
  description: string
  badge: string
  badgeTone: 'finance' | 'marketingPurple' | 'communication'
  tone: 'blue' | 'indigo' | 'green'
  contributor: string
  workbookSheet: string
  workbookTitle: string
  helper: string
}

export const LIVE_ROI_ORDER: LiveCalculatorId[] = ['selfLive', 'talentLive', 'talentVideo']

export const LIVE_ROI_META: Record<LiveCalculatorId, LiveRoiMeta> = {
  selfLive: {
    id: 'selfLive',
    title: '自播 ROI 计算器',
    subtitle: '用于按 workbook 原表口径测算自播场景下的盈亏平衡 ROI、实际 ROI 和利润。',
    description: '商家自播场景，保留原表的非纯佣和纯佣两段结果，适合快速判断自播到底赚不赚钱。',
    badge: '直播 ROI',
    badgeTone: 'finance',
    tone: 'blue',
    contributor: '张洁',
    workbookSheet: '👨‍🍳自播',
    workbookTitle: '自播板块盈亏平衡+利润测算',
    helper: '默认值、灰色结果和上下区镜像关系都按 workbook 原表处理。',
  },
  talentLive: {
    id: 'talentLive',
    title: '达播 ROI 计算器',
    subtitle: '用于按 workbook 原表口径测算达人直播合作场景下的 ROI 与利润。',
    description: '达人直播场景，保留原表白格默认值和上下区联动，适合核对达播项目是否达到盈利线。',
    badge: '达人直播 ROI',
    badgeTone: 'marketingPurple',
    tone: 'indigo',
    contributor: '张洁',
    workbookSheet: '💃🏼达播',
    workbookTitle: '达播板块盈亏平衡+利润测算',
    helper: '纯佣区的默认值 `10 / 0 / 8%` 直接保留原表，不做业务口径改写。',
  },
  talentVideo: {
    id: 'talentVideo',
    title: '达人短视频 ROI 计算器',
    subtitle: '用于按 workbook 原表口径测算达人短视频场景下的 ROI 与利润。',
    description: '达人短视频场景，保留原表中的 50% 服务商佣金逻辑和单独 GMV 默认值，适合项目复盘与预估。',
    badge: '达人视频 ROI',
    badgeTone: 'communication',
    tone: 'green',
    contributor: '张洁',
    workbookSheet: '🎬达人视频',
    workbookTitle: '短视频板块盈亏平衡+利润测算',
    helper: '纯佣区 GMV 和佣金默认值都按原表单独设置，避免跟上半区混淆。',
  },
}

export const LIVE_ROI_NOTES: Record<LiveCalculatorId, string[]> = {
  selfLive: [
    '直播间运营成本为固定成本，原表里会计入利润，但不进入“实际 ROI”分母。',
    '如果没有某项费用，直接填 0 即可；灰色区域会自动计算。',
  ],
  talentLive: [
    '“盈亏平衡 ROI”区只填针对全量 GMV 的抽佣；如果不是全量 GMV 抽佣，请改放到“实际 ROI”区按绝对金额录入。',
    '如果商家没有其他费用、投流费用、服务商投入、达人投入，原表说明里给出的兜底办法是填 1；网页里这里直接允许填 0，并按正常口径计算。',
    '如果服务商投入已经包含达人成本，不要在达人投入里重复计算。',
  ],
  talentVideo: [
    '“1-核销率差值”按原表保留，默认是 0；如果实际核销率 30%，就填 70%。',
    '“盈亏平衡 ROI”区只填针对全量 GMV 的抽佣；如果不是全量 GMV 抽佣，请改放到“实际 ROI”区按绝对金额录入。',
    '如果服务商投入已经包含达人成本，不要在达人投入里重复计算。',
  ],
}
