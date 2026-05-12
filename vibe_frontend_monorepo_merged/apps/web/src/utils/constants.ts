export const BUSINESS_ACTION_OPTIONS = [
  { value: '新开', label: '新开' },
  { value: '上品', label: '上品' },
  { value: '促三品', label: '促三品' },
  { value: '发文', label: '发文' },
  { value: '开播', label: '开播' },
  { value: '商品优化', label: '商品优化' },
  { value: '达人合作', label: '达人合作' },
  { value: '活动报名', label: '活动报名' },
  { value: '店铺装修', label: '店铺装修' },
  { value: '评价管理', label: '评价管理' },
  { value: '客服配置', label: '客服配置' },
  { value: '物流优化', label: '物流优化' },
  { value: '数据分析', label: '数据分析' },
  { value: '广告投放', label: '广告投放' },
  { value: '会员运营', label: '会员运营' },
  { value: '售后处理', label: '售后处理' },
  { value: '团购配置', label: '团购配置' },
  { value: '权益开通', label: '权益开通' }
] as const;

export const IDENTITY_OPTIONS = [
  { value: '抖音官方客服', label: '抖音官方客服' },
  { value: '生活服务运营', label: '生活服务运营' },
  { value: '普通用户', label: '普通用户' }
] as const;

export const RETENTION_LEVEL_OPTIONS = [
  { value: '轻度', label: '轻度', description: '非无法解析用户意图的情况下，用户拒绝后不重复询问' },
  { value: '均衡', label: '均衡', description: '非用户强烈拒绝的情况下，挽回1~2次' },
  { value: '重度', label: '重度', description: '在均衡的基础上，用户强烈拒绝后，仍然挽回1次' }
] as const;

export const DIALOG_STYLE_OPTIONS = [
  { value: '温和', label: '温和', description: '轻声细语、安抚、耐心' },
  { value: '自然', label: '自然', description: '不冷不热、得体、标准' },
  { value: '热情', label: '热情', description: '活泼、积极、有感染力' }
] as const;

export const CONTENT_TYPE_OPTIONS = [
  { value: 'info_notify', label: '信息通知类' },
  { value: 'info_verify', label: '信息核实类' },
  { value: 'intent_inspire', label: '意向激发类' }
] as const;

export const SKILL_TYPE_OPTIONS = [
  { value: 'none', label: '不需要技能' },
  { value: 'sms', label: '发送短信消息' },
  { value: 'wechat_msg', label: '发送微信消息' },
  { value: 'wecom', label: '添加企业微信' }
] as const;

export const TRIGGER_INTENT_OPTIONS = [
  { value: '低意向', label: '低意向' },
  { value: '中意向', label: '中意向' },
  { value: '高意向', label: '高意向' }
] as const;

export const SCRIPT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', color: 'grey' },
  { value: 'online', label: '已上线', color: 'green' },
  { value: 'offline', label: '已下线', color: 'red' }
] as const;

export const CORE_CONTENT_MODE_OPTIONS = [
  { value: 'initial', label: '初始模式', description: 'AI 根据对话方向自动生成' },
  { value: 'case', label: '案例模式', description: '从案例库选择已有案例' },
  { value: 'manual', label: '手动模式', description: '手动配置核心外呼对话' }
] as const;

export const OPENING_TEMPLATES = [
  { id: '1', content: '您好，请问是{{POI名称}}的老板吗？我是抖音来客的官方运营！' },
  { id: '2', content: '您好，请问是{{商户名称}}的老板吗？我是抖音这边的' },
  { id: '3', content: '老板，您好，您这边是{{商户名称}}吗？' }
] as const;

export const CLOSING_TEMPLATES = [
  { id: '1', content: '感谢您的耐心聆听，祝您生意兴隆！' },
  { id: '2', content: '感谢您的配合，如有问题随时联系我们！' },
  { id: '3', content: '祝您生意红火，期待下次合作！' }
] as const;

export const STATUS_LABEL_MAP: Record<string, string> = {
  'draft': '草稿',
  'online': '已上线',
  'offline': '已下线'
};

export const STATUS_COLOR_MAP: Record<string, string> = {
  'draft': 'grey',
  'online': 'green',
  'offline': 'red'
};

export const SKILL_TYPE_LABEL_MAP: Record<string, string> = {
  'none': '不需要技能',
  'sms': '发送短信消息',
  'wecom': '添加企业微信',
  'wechat_msg': '发送微信消息'
};

export const CONTENT_TYPE_LABEL_MAP: Record<string, string> = {
  'info_notify': '信息通知类',
  'info_verify': '信息核实类',
  'intent_inspire': '意向激发类'
};

export const BACKEND_AUTHORIZATION = 'ZG91ZG91X3Rlc3RfMDYxNg==';
