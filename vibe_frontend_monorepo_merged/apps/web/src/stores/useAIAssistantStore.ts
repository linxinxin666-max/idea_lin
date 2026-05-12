import { create } from 'zustand';
import type {
  ChatMessage,
  AIAssistantMode,
  AIAssistantState,
  ExtractionMetadata,
  CompletenessMetadata,
  ModificationAction,
  ModificationMetadata,
  FillMetadata,
  KBProposalItem,
  KBPreviewMetadata,
} from '../components/AIAssistant/types';
import { chatCompletions, chatCompletionsWithThinkingStream } from '../services/arkApi';
import { useCreateStore, type CreateFormState } from './useCreateStore';
import { createKB, batchUpdateItems } from '../services/knowledgeService';
import { useAppStore } from './useAppStore';

const FORM_FIELD_DEFINITIONS = `
- name (剧本名称): string — 剧本的名称
- businessAction (业务动作): string — 业务场景描述，如"续费提醒"、"投诉处理"
- identity (身份配置): enum["抖音官方客服", "生活服务运营", "普通用户"] — AI助手的身份
- retentionLevel (留存等级): enum["轻度", "均衡", "重度"] — 挽留/推进力度
- dialogStyle (对话风格): enum["温和", "热情", "自然"] — 对话风格
- openingRemarks (开场白): string — 对话开场白内容
- closingRemarks (结束语): string — 对话结束语内容
- coreContents (核心内容): array — 核心对话内容列表，每项格式：
    { content: string, type: "意向激发类"|"信息通知类"|"信息核实类", parseItems?: [{question: string, tags: string[]}] }
- skillType (技能类型): enum["none", "sms", "wecom", "wechat_msg"] — none=无技能, sms=发短信（SMS）, wecom=添加企业微信, wechat_msg=发送微信消息; 注意：说"发送企微/微信消息"时优先选wechat_msg，明确说"添加企微/企业微信账号"时选wecom
- triggerIntents (触发技能的意图): string[] — 哪些意图下触发技能，可选值: ["低意向", "中意向", "高意向"]，skillType 不为 none 时填写
- triggerContent (技能消息内容): string — 触发技能时发送的消息文本，skillType 不为 none 时填写
- selectedKBIds (关联知识库): string[] — 关联知识库ID列表，skillType 为 kb 时填写
`.trim();

const SYSTEM_PROMPT_TEMPLATE = `你是一个剧本配置助手，具备以下三种能力，请根据用户意图选择合适的方式响应。

---

## 一、解释功能
当用户询问你能做什么时，告知用户：
- 可以将项目文档、提示词、对话案例等内容直接粘贴进来，你会自动解析并填写对应表单字段
- 可以检查当前表单是否有未填内容、填写质量问题或字段间矛盾，给出优化建议

---

## 二、解析填写

### 表单字段定义
{{FORM_FIELD_DEFINITIONS}}

### 当前表单状态
{{CURRENT_FORM_VALUES}}

### 参考示例剧本（请参考这些示例的格式和内容来填写）
{{FEW_SHOT_EXAMPLES}}

### 输出规则
判断当前表单是否已有实质性内容（即除默认值外用户填写的字段）：

**情况一：表单基本为空（首次解析）**
直接自动填写，输出 type=fill 的 JSON，系统会立即应用到表单，无需用户确认：
\`\`\`json
{
  "type": "fill",
  "summary": "简要说明解析了哪些内容（一句话）",
  "actions": [
    { "fieldKey": "字段键名", "fieldLabel": "字段显示名称", "newValue": "填写的值", "actionType": "update" }
  ]
}
\`\`\`

**情况二：表单已有内容（再次解析或修改）**
对比新旧值，列出差异让用户确认，输出 type=modification 的 JSON：
\`\`\`json
{
  "type": "modification",
  "actions": [
    { "fieldKey": "字段键名", "fieldLabel": "字段显示名称", "oldValue": "当前值", "newValue": "新值", "actionType": "update" }
  ]
}
\`\`\`

---

## 三、检查建议
当用户要求检查表单时，用文字回复，按以下结构输出（不要输出 JSON）：

**✅ 已填写完整的字段**：列出填写良好的字段

**⚠️ 建议优化的字段**：逐条说明哪些字段填写不完善，以及改进建议

**❌ 未填写的字段**：列出空白字段，说明其重要性

**🔄 潜在矛盾**：说明哪些字段之间存在逻辑冲突或不一致

---

## 通用规则
- 如果用户只是提问或聊天，直接文字回复，不要输出 JSON
- 解析时参考示例剧本的格式，尽量多填字段，coreContents 至少填 2～3 条
- actions 数组可包含多个字段，一次修改多个
- actionType 固定填 "update"`;

const FORM_FIELD_LABELS: Record<string, string> = {
  name: '剧本名称',
  businessAction: '业务动作',
  identity: '身份配置',
  retentionLevel: '留存等级',
  dialogStyle: '对话风格',
  openingRemarks: '开场白',
  closingRemarks: '结束语',
  coreContents: '核心内容',
  skillType: '技能类型',
  triggerIntents: '触发意图',
  triggerContent: '技能消息内容',
  selectedKBIds: '关联知识库',
};

const formatFormStateForLLM = (form: CreateFormState): string => {
  const lines: string[] = [];
  for (const [key, label] of Object.entries(FORM_FIELD_LABELS)) {
    const value = form[key as keyof CreateFormState];
    if (value !== undefined && value !== null && value !== '' &&
        (!Array.isArray(value) || value.length > 0)) {
      lines.push(`${label} (${key}): ${JSON.stringify(value)}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') : '当前表单为空';
};

const IDENTITY_MAP: Record<string, string> = {
  'douyin_offical_customer_service': '抖音官方客服',
  'life_service_operation': '生活服务运营',
  'normal_user': '普通用户',
};
const RETENTION_MAP: Record<string, string> = {
  'light': '轻度',
  'balanced': '均衡',
  'heavy': '重度',
};
const STYLE_MAP: Record<string, string> = {
  'enthusiastic': '热情',
  'gentle': '温和',
  'natural': '自然',
};

const formatFlowAsFewShot = (flow: any): string => {
  const cfg = flow.agent_call_config || {};
  const parts: string[] = [];
  parts.push(`剧本名称: ${flow.name}`);
  if (cfg.businessBehavior) parts.push(`业务动作 (businessAction): ${cfg.businessBehavior}`);
  if (cfg.identity) parts.push(`身份 (identity): "${IDENTITY_MAP[cfg.identity] ?? cfg.identity}"`);
  if (cfg.retentionLevel) parts.push(`留存等级 (retentionLevel): "${RETENTION_MAP[cfg.retentionLevel] ?? cfg.retentionLevel}"`);
  if (cfg.conversationStyle) parts.push(`对话风格 (dialogStyle): "${STYLE_MAP[cfg.conversationStyle] ?? cfg.conversationStyle}"`);
  if (cfg.openingRemarks) parts.push(`开场白 (openingRemarks): ${cfg.openingRemarks}`);
  if (cfg.closingRemarks) parts.push(`结束语 (closingRemarks): ${cfg.closingRemarks}`);
  if (cfg.coreContents?.length) {
    parts.push(`核心内容 (coreContents): ${JSON.stringify(cfg.coreContents)}`);
  }
  return parts.join('\n');
};

const fetchFewShotExamples = async (form: CreateFormState): Promise<string> => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/self_help/api/agent_call';
    const response = await fetch(`${baseUrl}/get_flow_list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    console.log('[AIAssistant] fetchFewShotExamples response:', data.status_code, 'flow count:', data.data?.flow_list?.length);
    if (data.status_code === 0 && Array.isArray(data.data?.flow_list)) {
      const allFlows: any[] = data.data.flow_list;
      if (allFlows.length === 0) return '暂无参考示例';

      const currentAction = form.businessAction as string | undefined;

      // 优先取相同业务动作的剧本，不足则随机补充
      const matched = currentAction
        ? allFlows.filter((f: any) => f.agent_call_config?.businessBehavior === currentAction)
        : [];
      const unmatched = allFlows.filter((f: any) => !matched.includes(f));

      const shuffledMatched = [...matched].sort(() => Math.random() - 0.5);
      const shuffledUnmatched = [...unmatched].sort(() => Math.random() - 0.5);

      // 最多取 5 条：先放匹配的（最多 3 条），再补其他的
      const sampled = [
        ...shuffledMatched.slice(0, 3),
        ...shuffledUnmatched.slice(0, Math.max(0, 5 - shuffledMatched.length)),
      ].slice(0, 5);

      console.log('[AIAssistant] few-shot sampled:', sampled.map((f: any) => `${f.name}(${f.agent_call_config?.businessBehavior})`));
      return sampled
        .map((f, i) => `### 示例 ${i + 1}\n${formatFlowAsFewShot(f)}`)
        .join('\n\n');
    }
  } catch (e) {
    console.warn('[AIAssistant] Failed to fetch few-shot examples:', e);
  }
  return '暂无参考示例';
};

const buildSystemPrompt = async (form: CreateFormState): Promise<string> => {
  const fewShotExamples = await fetchFewShotExamples(form);
  const prompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{{FORM_FIELD_DEFINITIONS}}', FORM_FIELD_DEFINITIONS)
    .replace('{{CURRENT_FORM_VALUES}}', formatFormStateForLLM(form))
    .replace('{{FEW_SHOT_EXAMPLES}}', fewShotExamples);
  console.log('[AIAssistant] system prompt:\n', prompt);
  return prompt;
};

// 数组类型字段，LLM 有时会返回 JSON 字符串，需要还原为数组
const ARRAY_FIELDS = new Set(['coreContents', 'triggerIntents', 'selectedKBIds']);

const sanitizeFieldValue = (fieldKey: string, value: unknown): unknown => {
  if (ARRAY_FIELDS.has(fieldKey)) {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    if (!Array.isArray(value)) return [];
  }
  return value;
};

type ParsedLLMResult =
  | { type: 'fill'; actions: ModificationAction[]; summary?: string }
  | { type: 'modification'; actions: ModificationAction[] }
  | null;

const parseLLMResponse = (response: string): ParsedLLMResult => {
  try {
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : response.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr);
    const actions: ModificationAction[] = Array.isArray(parsed.actions) && parsed.actions.length > 0
      ? parsed.actions
      : parsed.action ? [parsed.action] : [];

    if (actions.length === 0) return null;

    if (parsed.type === 'fill') {
      return { type: 'fill', actions, summary: parsed.summary };
    }
    if (parsed.type === 'modification') {
      return { type: 'modification', actions };
    }
    return null;
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    return null;
  }
};

const getWelcomeMessage = (mode: AIAssistantMode): ChatMessage => {
  if (mode === 'create') {
    return {
      id: generateId(),
      role: 'assistant',
      contentType: 'text',
      content: '👋 你好！我能帮你做两件事：\n\n- **自动填表**：把场景描述、项目文档或对话案例发给我，我来解析填写\n- **检查表单**：告诉我"帮我检查一下"，我来找问题',
      timestamp: Date.now(),
    };
  } else {
    return {
      id: generateId(),
      role: 'assistant',
      contentType: 'text',
      content: '📋 我已加载当前剧本配置，可以通过对话帮你修改表单内容。例如："把业务动作改成续费" 或 "开场白改成感谢您的咨询"。',
      timestamp: Date.now(),
    };
  }
};

interface AIAssistantStore {
  mode: AIAssistantMode;
  state: AIAssistantState;
  messages: ChatMessage[];
  inputText: string;
  sessionId: string;
  completenessData: CompletenessMetadata | null;
  pendingModifications: ModificationAction[] | null;
  pendingExpand: boolean;

  setMode: (mode: AIAssistantMode) => void;
  setState: (state: AIAssistantState) => void;
  setInputText: (text: string) => void;
  setPendingExpand: (v: boolean) => void;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  setCompletenessData: (data: CompletenessMetadata | null) => void;
  setPendingModifications: (modifications: ModificationAction[] | null) => void;

  sendMessage: () => Promise<void>;
  applyExtraction: (metadata: ExtractionMetadata) => void;
  applyModification: () => void;
  clearPendingModification: () => void;
  reset: () => void;

  startOptimization: (params: { records: any[]; scriptName: string; selectedKBIds: string[] }) => Promise<void>;
  confirmKBOptimization: (items: KBProposalItem[], scriptName: string, selectedKBIds: string[]) => Promise<void>;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAIAssistantStore = create<AIAssistantStore>((set, get) => ({
  mode: 'create',
  state: 'idle',
  messages: [],
  inputText: '',
  sessionId: generateId(),
  completenessData: null,
  pendingModifications: null,
  pendingExpand: false,

  setMode: (mode) => {
    set({
      mode,
      messages: [getWelcomeMessage(mode)],
      completenessData: null,
      pendingModifications: null
    });
  },

  setState: (state) => set({ state }),
  setInputText: (text) => set({ inputText: text }),
  setPendingExpand: (v) => set({ pendingExpand: v }),

  addMessage: (message) => {
    const fullMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, fullMessage] }));
  },

  clearMessages: () => set({ messages: [] }),

  setCompletenessData: (data) => set({ completenessData: data }),
  setPendingModifications: (modifications) => set({ pendingModifications: modifications }),

  sendMessage: async () => {
    const { inputText, addMessage, setState, setPendingModifications, messages } = get();

    if (!inputText.trim()) return;

    const currentInputText = inputText;
    const currentMessages = [...messages];

    set({ inputText: '' });
    setState('analyzing');

    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      contentType: 'text',
      content: currentInputText,
    };

    addMessage(userMessage);

    try {
      const formState = useCreateStore.getState().form;
      const systemPrompt = await buildSystemPrompt(formState);

      const llmMessages = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        ...currentMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content
          })),
        {
          role: 'user' as const,
          content: currentInputText
        }
      ];

      const llmResponse = await chatCompletions(llmMessages);
      const parsed = parseLLMResponse(llmResponse);

      if (parsed?.type === 'fill') {
        // 首次解析：自动填入表单，无需用户确认
        const updateForm = useCreateStore.getState().updateForm;
        const filledKeys = new Set<string>();
        for (const action of parsed.actions) {
          try {
            let safeValue = sanitizeFieldValue(action.fieldKey, action.newValue);
            if (action.fieldKey === 'name' && typeof safeValue === 'string' && safeValue) {
              const now = new Date();
              const suffix = `_${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
              safeValue = safeValue + suffix;
            }
            updateForm(action.fieldKey as keyof CreateFormState, safeValue as CreateFormState[keyof CreateFormState]);
            filledKeys.add(action.fieldKey);
          } catch (e) {
            console.error('fill field error:', action.fieldKey, e);
          }
        }
        // LLM 填了开场白/结束语时，将模式切换为手动输入，避免被模板覆盖
        if (filledKeys.has('openingRemarks')) {
          updateForm('openingRemarksMode', 'manual');
        }
        if (filledKeys.has('closingRemarks')) {
          updateForm('closingRemarksMode', 'manual');
        }
        const fieldNames = parsed.actions.map(a => `「${a.fieldLabel}」`).join('、');
        const metadata: FillMetadata = { type: 'fill', actions: parsed.actions, summary: parsed.summary };
        addMessage({
          role: 'assistant',
          contentType: 'fill',
          content: parsed.summary || `✅ 已自动填写 ${fieldNames}，请检查并补充其余字段。`,
          metadata,
        });
        setState('idle');
      } else if (parsed?.type === 'modification') {
        // 再次解析：展示差异，等待用户确认
        setPendingModifications(parsed.actions);
        const metadata: ModificationMetadata = { type: 'modification', actions: parsed.actions };
        const fieldNames = parsed.actions.map(a => `「${a.fieldLabel}」`).join('、');
        addMessage({
          role: 'assistant',
          contentType: 'modification',
          content: `检测到与当前表单的差异，涉及 ${fieldNames}，请确认是否修改。`,
          metadata,
        });
        setState('idle');
      } else {
        addMessage({
          role: 'assistant',
          contentType: 'text',
          content: llmResponse,
        });
        setState('idle');
      }
    } catch (error) {
      console.error('Failed to send message to LLM:', error);
      addMessage({
        role: 'assistant',
        contentType: 'error',
        content: '抱歉，处理您的请求时出现了错误，请稍后再试。'
      });
      setState('idle');
    }
  },

  applyExtraction: (_metadata) => {
    const { addMessage, setState } = get();

    addMessage({
      role: 'assistant',
      contentType: 'text',
      content: '✅ 已将提取的信息填充到表单，请继续完善其他字段。',
    });

    setState('filled');

    setTimeout(() => setState('idle'), 500);
  },

  applyModification: () => {
    const { pendingModifications, addMessage, setState, clearPendingModification } = get();

    if (!pendingModifications || pendingModifications.length === 0) return;

    const updateForm = useCreateStore.getState().updateForm;
    const failedFields: string[] = [];

    for (const modification of pendingModifications) {
      try {
        let safeValue = sanitizeFieldValue(modification.fieldKey, modification.newValue);
        if (modification.fieldKey === 'name' && typeof safeValue === 'string' && safeValue) {
          const now = new Date();
          const suffix = `_${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
          safeValue = safeValue + suffix;
        }
        updateForm(modification.fieldKey as keyof CreateFormState, safeValue as CreateFormState[keyof CreateFormState]);
      } catch (error) {
        console.error(`Failed to apply modification for field ${modification.fieldKey}:`, error);
        failedFields.push(modification.fieldLabel);
      }
    }

    if (failedFields.length === 0) {
      const fieldNames = pendingModifications.map(m => `「${m.fieldLabel}」`).join('、');
      addMessage({
        role: 'assistant',
        contentType: 'text',
        content: `✅ 已成功修改 ${fieldNames}！`
      });
    } else {
      addMessage({
        role: 'assistant',
        contentType: 'error',
        content: `抱歉，以下字段修改失败：${failedFields.join('、')}`
      });
    }

    clearPendingModification();
    setState('idle');
  },

  clearPendingModification: () => {
    set({ pendingModifications: null });
  },

  reset: () => {
    set({
      state: 'idle',
      messages: [getWelcomeMessage(get().mode)],
      inputText: '',
      sessionId: generateId(),
      completenessData: null,
      pendingModifications: null,
    });
  },

  startOptimization: async ({ records, scriptName, selectedKBIds }) => {
    const { addMessage, setState } = get();

    // Signal parent to expand AI assistant
    set({ pendingExpand: true });

    setState('analyzing');

    const addStep = (content: string) => {
      addMessage({ role: 'assistant', contentType: 'text', content });
    };

    const addStreamingStep = (content: string, contentType: ChatMessage['contentType'] = 'text') => {
      const id = generateId();
      const fullMessage: ChatMessage = {
        role: 'assistant',
        contentType,
        content,
        id,
        timestamp: Date.now(),
      };
      set((state) => ({ messages: [...state.messages, fullMessage] }));
      return id;
    };

    const updateStep = (id: string, content: string) => {
      set((state) => ({
        messages: state.messages.map((message) => (
          message.id === id ? { ...message, content } : message
        )),
      }));
    };

    addStep('✨ **开始一键优化...**\n\n**步骤 1 / 4** — 读取剧本数据');

    const cleanTriggerText = (raw: string) => {
      const text = (raw || '')
        .replace(/^(客户|用户|商家|customer|merchant)\s*[：:]\s*/i, '')
        .replace(/[~～—…【】\[\]（）()]/g, '')
        .replace(/[?？]+$/g, '')
        .replace(/[吗么呢]$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (/^(用户|商家|客户)(表示|语气|情绪|状态|沉默|犹豫|不耐烦)/.test(text)) return '';
      return text;
    };

    const normalizeItems = (items: any[]): KBProposalItem[] => {
      if (!Array.isArray(items)) return [];
      return items
        .map((item) => ({
          trigger: cleanTriggerText(String(item?.trigger || '')),
          reply: String(item?.reply || '').replace(/\s+/g, ' ').trim(),
          reason: String(item?.reason || '').replace(/\s+/g, ' ').trim(),
        }))
        .filter((item) => item.trigger && item.reply)
        .filter((item, index, arr) => (
          arr.findIndex((x) => x.trigger === item.trigger && x.reply === item.reply) === index
        ))
        .slice(0, 30);
    };

    const extractJsonCandidates = (text: string) => {
      const candidates: string[] = [];
      const fenced = Array.from(text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi));
      fenced.forEach((match) => {
        if (match[1]?.trim()) candidates.push(match[1].trim());
      });
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        candidates.push(text.slice(firstBrace, lastBrace + 1).trim());
      }
      return Array.from(new Set(candidates));
    };

    const tryParseOptimizationResult = (text: string): { summary: string; items: KBProposalItem[] } | null => {
      const candidates = extractJsonCandidates(text);
      for (const candidate of candidates) {
        const variants = [candidate, candidate.replace(/,\s*([}\]])/g, '$1')];
        for (const variant of variants) {
          try {
            const obj = JSON.parse(variant);
            const items = normalizeItems(obj?.items);
            return {
              summary: String(obj?.summary || '').trim(),
              items,
            };
          } catch {
            // ignore parse error and continue trying
          }
        }
      }
      return null;
    };

    const buildFallbackItems = (sampleRecords: any[]): KBProposalItem[] => {
      const extractCustomerUtterance = (conversationText: string) => {
        const lines = (conversationText || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const userLine = lines.find((line) => /^(客户|用户|商家|customer|merchant)\s*[：:]/i.test(line)) || lines[0] || '';
        return cleanTriggerText(userLine);
      };

      return sampleRecords
        .map((record) => {
          const weakIssue = Object.entries(record.detailScores || {})
            .find(([dim, item]) => dim !== '对话标注结果' && (item as any)?.score < 2 && (item as any)?.score !== -1);
          const issue = weakIssue?.[1] as any;
          const trigger = extractCustomerUtterance(record.conversationText || '');
          const reply = String(issue?.suggestion || '').replace(/\s+/g, ' ').trim();
          const reason = String(issue?.reason || '基于低分对话提炼的兜底优化建议').replace(/\s+/g, ' ').trim();
          if (!trigger || !reply) return null;
          return { trigger, reply, reason };
        })
        .filter((item): item is KBProposalItem => Boolean(item))
        .filter((item, index, arr) => (
          arr.findIndex((x) => x.trigger === item.trigger && x.reply === item.reply) === index
        ))
        .slice(0, 30);
    };

    // Filter bad conversations
    const badRecords = records.filter(r =>
      r.conversationType === '异常' || r.conversationType === '存在短板'
    );

    const severityPriority: Record<string, number> = {
      '异常': 0,
      '存在短板': 1,
    };
    const sortedBadRecords = [...badRecords]
      .sort((a, b) => {
        const pA = severityPriority[a.conversationType] ?? 2;
        const pB = severityPriority[b.conversationType] ?? 2;
        if (pA !== pB) return pA - pB;
        return (a.totalScore ?? 0) - (b.totalScore ?? 0);
      });
    const lowScoreRecords = [...records]
      .filter((r) => (r.totalScore ?? 0) < 80)
      .sort((a, b) => (a.totalScore ?? 0) - (b.totalScore ?? 0));

    const useLowScoreFallback = badRecords.length < 20;
    const sampleLimit = useLowScoreFallback ? 50 : 20;
    const selectedSampleRecords = (useLowScoreFallback && lowScoreRecords.length > 0
      ? lowScoreRecords
      : sortedBadRecords
    ).slice(0, sampleLimit);

    const strategyText = useLowScoreFallback && lowScoreRecords.length > 0
      ? `异常/短板样本不足 20 条，改用总分 <80 的低分样本（最低分优先）`
      : '使用异常/短板样本（异常优先、低分优先）';

    addStep(`**步骤 2 / 4** — 筛选待优化对话\n\n共 ${records.length} 条评测结果，其中严重异常 ${records.filter(r => r.conversationType === '异常').length} 条、存在短板 ${records.filter(r => r.conversationType === '存在短板').length} 条，低分(<80) ${lowScoreRecords.length} 条。已选取 **${selectedSampleRecords.length}** 条用于 AI 分析（${strategyText}）。`);

    if (selectedSampleRecords.length === 0) {
      addStep('✅ 没有发现需要优化的对话，当前剧本表现良好！');
      setState('idle');
      return;
    }

    // Format bad records for LLM
    const formattedRecords = selectedSampleRecords.map((r, i) => {
      const issues = Object.entries(r.detailScores)
        .filter(([dim, item]) => dim !== '对话标注结果' && (item as any).score < 2 && (item as any).score !== -1)
        .map(([dim, item]) => `  - ${dim}：${(item as any).reason || ''}${(item as any).suggestion ? `（建议：${(item as any).suggestion}）` : ''}`)
        .join('\n');
      return `【对话 ${i + 1}】类型：${r.conversationType}，总分：${r.totalScore}\n对话内容：${r.conversationText.slice(0, 300)}\n问题点：\n${issues || '  无明确问题'}`;
	    }).join('\n\n---\n\n');

	    addStep('**步骤 3 / 4** — 使用 AI 分析问题，提炼优化建议...');
      addStep(`🧠 **分析摘要**\n\n本次将分析 ${selectedSampleRecords.length} 条低分样本，重点抽取客户/商家触发话术、低分原因和可复用客服回复。若模型接口返回 \`reasoning_content\`，会在模型返回后展示；如果未返回，则继续展示最终优化结论。`);

    try {
      const optimizePrompt = `你是一个客服话术优化专家。以下是一批表现不佳的客服对话记录（来自剧本"${scriptName}"）：

${formattedRecords}

请分析这些对话的共性问题，提炼可沉淀到知识库的“话术纠偏条目”，输出为 JSON：

字段语义（非常重要）：
- trigger：必须是“客户/商家可能会说的话（触发词）”，优先从原对话中摘录用户侧原话，不要写成抽象总结。
- reply：对应 trigger 的优化后客服回复（可直接复用）。
- reason：为什么这样优化（一句话）。

示例：
- 错误 trigger：用户表示当前忙碌、用户语气敷衍、不耐烦、先不考虑了～、我现在很忙——回头再说
- 正确 trigger：我现在在忙，没空聊这个

\`\`\`json
	{
	  "summary": "一句话总结主要问题",
	  "items": [
	    {
	      "trigger": "客户/商家可能说的话（可直接听到的口语原话）",
	      "reply": "优化后的客服回复话术（具体、可直接使用）",
	      "reason": "为什么这样改（一句话）"
	    }
	  ]
	}
\`\`\`

要求：
- items 提炼 1~30 条，聚焦共性问题
- trigger 必须是客户/商家视角的原句或近原句，禁止写“用户/商家表示…”“用户语气…”这类描述句
- trigger 不要包含复杂符号（如 ～、——、……、【】、（）等），用自然口语短句表达
- trigger 不要包含情绪/状态描述语（如“用户不耐烦”“用户犹豫”“商家沉默”），必须是可直接听到的说话内容
- trigger 不能使用问句结尾，不要以“？”“?”“吗”“呢”“么”结尾，改写为陈述句
- trigger 尽量保留口语风格，长度 6~40 字
- reply 是具体可用的话术，不超过 100 字
- reply 使用通用客服表述，禁止写单店铺特定信息（如“贵理发店”“你们这家火锅店”“你家美甲店”）
- reply 可用“您这边/店铺/门店/商家”等通用称呼，不要依赖具体行业名或店名
- 如果某条无法提取客户/商家侧可触发的话，就不要生成该条
- 只输出 JSON，不要其他说明`;

	      let llmResponse = '';
	      let reasoningContent = '';
      const reasoningMessageId = addStreamingStep('正在接收流式 `reasoning_content` ...', 'reasoning');
      let lastReasoningUpdate = 0;
      const flushReasoning = (force = false) => {
        const now = Date.now();
        if (!force && now - lastReasoningUpdate < 300) return;
        lastReasoningUpdate = now;
        const preview = reasoningContent
          ? (reasoningContent.length > 3000
            ? `${reasoningContent.slice(0, 3000)}\n\n...（分析过程较长，已截断展示）`
            : reasoningContent)
          : '正在接收流式 `reasoning_content` ...';
        updateStep(reasoningMessageId, preview);
      };

	      try {
        const result = await chatCompletionsWithThinkingStream(
          [{ role: 'user', content: optimizePrompt }],
          {
            thinking: true,
            thinkingBudgetTokens: 2000,
            timeoutMs: 90000,
            noReasoningTimeoutMs: 60000,
            onReasoningDelta: (delta) => {
              reasoningContent += delta;
              flushReasoning();
            },
            onContentDelta: (delta) => {
              llmResponse += delta;
            },
          }
        );
	        llmResponse = result.content;
	        reasoningContent = result.reasoningContent || reasoningContent;
        flushReasoning(true);
	      } catch (e) {
	        console.warn('thinking optimization request failed, fallback to normal request:', e);
        updateStep(reasoningMessageId, '流式 `reasoning_content` 未及时返回，已自动降级为普通优化请求继续生成建议。');
	        llmResponse = await chatCompletions(
	          [{ role: 'user', content: optimizePrompt }],
	          { thinking: false, timeoutMs: 60000 }
	        );
	      }

      addStep(`🧠 **模型返回状态**\n\n最终答案长度：${llmResponse.length} 字；reasoning_content 长度：${reasoningContent.length} 字。`);

      if (!reasoningContent) {
        updateStep(reasoningMessageId, '当前接口本次未返回流式 `reasoning_content`，已继续使用最终答案生成优化结论。');
      }

      let parsed = tryParseOptimizationResult(llmResponse);

      if (!parsed || parsed.items.length === 0) {
        const repairPrompt = `你是 JSON 修复助手。请把下面内容整理成严格 JSON，格式必须为 {"summary":"...","items":[{"trigger":"...","reply":"...","reason":"..."}]}。
要求：
- items 至少 1 条，最多 30 条
- trigger 必须是客户/商家可能说的话（可直接听到的口语原话）
- trigger 不能以“？”“?”“吗”“呢”“么”结尾
- 只输出 JSON，不要任何额外说明

原始内容：
${llmResponse}`;
	        const repairedResponse = await chatCompletions(
          [{ role: 'user', content: repairPrompt }],
          { thinking: false, timeoutMs: 30000 }
        );
        parsed = tryParseOptimizationResult(repairedResponse);
      }

      if ((!parsed || parsed.items.length === 0) && selectedSampleRecords.length > 0) {
        const fallbackItems = buildFallbackItems(selectedSampleRecords);
        if (fallbackItems.length > 0) {
          parsed = {
            summary: '模型返回结果不稳定，已基于低分样本自动提炼兜底优化建议',
            items: fallbackItems,
          };
          addStep('⚠️ AI 原始输出格式不稳定，已启用兜底提炼策略生成可用建议。');
        }
      }

      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        addStep('⚠️ AI 分析完成，但未能提炼出有效的优化建议，请手动检查对话。');
        setState('idle');
        return;
      }

      addStep(`**步骤 4 / 4** — 优化分析完成\n\n${parsed.summary}`);

      const metadata: KBPreviewMetadata = {
        type: 'kb_preview',
        items: parsed.items,
        scriptName,
        selectedKBIds,
      };
      addMessage({
        role: 'assistant',
        contentType: 'kb_preview',
        content: `已提炼 ${parsed.items.length} 条优化话术，请确认是否写入知识库：`,
        metadata,
      });
    } catch (e) {
      console.error('startOptimization LLM error:', e);
      addMessage({ role: 'assistant', contentType: 'error', content: '优化分析失败，请稍后重试。' });
    }

    setState('idle');
  },

  confirmKBOptimization: async (items, scriptName, selectedKBIds) => {
    const { addMessage } = get();
    const { useMockData } = useAppStore.getState();

    try {
      if (useMockData) {
        // Mock mode: simulate success without real API call
        await new Promise((r) => setTimeout(r, 600));
        addMessage({
          role: 'assistant',
          contentType: 'text',
          content: `✅ 已成功将 ${items.length} 条优化话术写入知识库！（模拟模式）`,
        });
        return;
      }

      let kbId: string;

      if (selectedKBIds && selectedKBIds.length > 0) {
        kbId = selectedKBIds[0];
      } else {
        // Create new KB with script name
        const createResult = await createKB({ name: scriptName, businessActions: [] });
        if (!createResult.data?.id) {
          addMessage({ role: 'assistant', contentType: 'error', content: '创建知识库失败，请手动创建后重试。' });
          return;
        }
        kbId = createResult.data.id;
      }

      const upserts = items.map((item, i) => ({
        question: item.trigger,
        answer: item.reply,
        sortOrder: i,
      }));

      await batchUpdateItems(kbId, { upserts, deletes: [] });

      addMessage({
        role: 'assistant',
        contentType: 'text',
        content: `✅ 已成功将 ${items.length} 条优化话术写入知识库！`,
      });
    } catch (e) {
      console.error('confirmKBOptimization error:', e);
      addMessage({ role: 'assistant', contentType: 'error', content: '写入知识库失败，请稍后重试。' });
    }
  },
}));
