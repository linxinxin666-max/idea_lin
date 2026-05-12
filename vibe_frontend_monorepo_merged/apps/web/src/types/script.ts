export type ScriptStatus = 'draft' | 'online' | 'offline';

// ── 上线状态相关类型 ──────────────────────────────────────────
export type OnlineStatus = 'offline' | 'online' | 'suspended'; // 未上线/已上线/已下线
export type VoiceProvider = 'tianrun' | 'ailab';
export type ScheduleType = 'daily' | 'once';
export type BaseModel = 'seed-1.6' | 'seed-1.6-flash' | 'seed-1.8';
export type CallListSource = 'upload' | 'dmp' | 'tqs';

export interface OnlineConfig {
  voiceProvider: VoiceProvider;
  scheduleType: ScheduleType;
  weekdays: number[];       // 1=周一 … 7=周日，仅 daily 时有效
  timeSlots: boolean[];     // 长度 48，每位对应半小时（index 0=00:00, 1=00:30 …）
  naturalLanguageDesc: string;
  baseModel: BaseModel;
  businessLine: string;
  callListSource: CallListSource;
  callListValue: string;    // 文件名 / DMP任务流ID / TQS任务流ID
}

export type BusinessAction = 
  | '新开' | '上品' | '促三品' | '发文' | '开播' | '商品优化' 
  | '达人合作' | '活动报名' | '店铺装修' | '评价管理' | '客服配置' 
  | '物流优化' | '数据分析' | '广告投放' | '会员运营' | '售后处理' 
  | '团购配置' | '权益开通';

export type IdentityType = '抖音官方客服' | '生活服务运营' | '普通用户';

export type RetentionLevel = '轻度' | '均衡' | '重度';

export type DialogStyle = '热情' | '温和' | '自然';

export type SkillType = 'none' | 'sms' | 'wecom' | 'wechat_msg';

export type TriggerIntent = '低意向' | '中意向' | '高意向';

export type ContentType = 'info_notify' | 'info_verify' | 'intent_inspire';

export type CoreContentMode = 'initial' | 'case' | 'manual';

export interface VerifyResult {
  id: string;
  label: string;
}

export interface IntentResult {
  id: string;
  label: string;
}

export interface CoreContentItem {
  id: string;
  contentType: ContentType;
  content: string;
  question?: string;
  verifyResults?: VerifyResult[];
  intentResults?: IntentResult[];
}

export interface OpeningConfig {
  mode: 'template' | 'manual';
  templateId?: string;
  content: string;
}

export interface CoreContentConfig {
  mode: CoreContentMode;
  direction?: string;
  selectedCaseIds?: string[];
  items: CoreContentItem[];
}

export interface ClosingConfig {
  mode: 'template' | 'manual';
  templateId?: string;
  content: string;
}

export interface Script {
  id: string;
  name: string;
  businessAction: BusinessAction;
  identity: IdentityType;
  retentionLevel: RetentionLevel;
  dialogStyle: DialogStyle;
  opening: OpeningConfig;
  coreContent: CoreContentConfig;
  closing: ClosingConfig;
  skillType: SkillType;
  triggerIntent?: TriggerIntent;
  status: ScriptStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    callCount: number;
    connectRate: string;
    scriptScore: number;
  };
}

export interface CreateFormState {
  currentStep: number;
  formData: Partial<Script>;
  stepValidation: Record<number, boolean>;
  isDirty: boolean;
}

export interface ScriptListItem {
  id: string;
  name: string;
  businessAction: BusinessAction;
  identity: IdentityType;
  status: ScriptStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScriptParams {
  name: string;
  businessAction: BusinessAction;
  identity: IdentityType;
  retentionLevel: RetentionLevel;
  dialogStyle: DialogStyle;
  opening: OpeningConfig;
  coreContent: CoreContentConfig;
  closing: ClosingConfig;
  skillType: SkillType;
  triggerIntent?: TriggerIntent;
}

export interface UpdateScriptParams extends Partial<CreateScriptParams> {
  id: string;
}

// 新的接口类型定义
export interface FlowListResponse {
  status_code: number;
  msg: string;
  data: {
    flow_list: FlowItem[];
  };
}

export interface FlowDetailResponse {
  status_code: number;
  msg: string;
  data: {
    name: string;
    agent_call_config: AgentCallConfig;
  };
}

export interface FlowItem {
  id: number;
  name: string;
  creator: string;
  add_time: string;
  mock_mission_id?: string;
  pe_text: string;
  agent_call_config: AgentCallConfig;
  extra?: {
    agent_id?: string;
    agent_script_id?: string;
    flow_code?: string;
    fornax_key?: string;
    prompt_id?: string;
    script_id?: string;
  };
}

export interface AgentCallConfig {
  businessBehavior?: string;
  identity: string;
  retentionLevel: string;
  conversationStyle: string;
  openingRemarks: string;
  coreContents: any[];
  closingRemarks: string;
  skillType: string;
  triggerIntents: string[];
  selectedKBIds: string[];
  triggerIntentMode: 'all' | 'by_parse_value';
  triggerContentIndex: number | null;
  triggerParseValues: string[];
  triggerContent: string;
}

export interface CoreContentItemV2 {
  content: string;
  direction?: string;
  mode: string;
  type: string;
  verifyItems?: VerifyItemV2[];
}

export interface VerifyItemV2 {
  question: string;
  results: string[];
}
