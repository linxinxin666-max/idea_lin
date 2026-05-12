import type { AgentCallConfig } from '../types/script';
import { BACKEND_AUTHORIZATION } from '../utils/constants';

const ARK_API_KEY = 'cc8892ed-2596-4acd-96fa-5c35ea38c465';
const ENDPOINT_ID = 'ep-20250714174753-xvhhd';
const API_URL = 'https://ark-cn-beijing.bytedance.net/api/v3/chat/completions';

// 从环境变量获取 API 基础地址，提供默认值作为回退
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/self_help/api/agent_call';

const MEMORY_API_URL = `${BASE_URL}/memory/create_short_memory_session`;
const UPDATE_MEMORY_API_URL = `${BASE_URL}/memory/update_short_memory`;
const LONG_MEMORY_SAVE_URL = `${BASE_URL}/memory/long_memory_save`;
const TEST_CHARACTER_PE_URL = `${BASE_URL}/memory/test_character_pe`;
const AI_CHARACTER_PE_URL = `${BASE_URL}/generate_ai_character_pe`;
const MERCHANT_CHARACTER_PE_URL = `${BASE_URL}/generate_merchant_character_pe`;
const KNOWLEDGE_RETRIEVAL_URL = `${BASE_URL}/knowledge_retrieval`;
const MOCK_CHARACTER_PE_URL = `${BASE_URL}/mock_character_pe`;
const GEN_SCRIPT_PE_URL = `${BASE_URL}/gen_script_pe`;
const MOCK_KNOWLEDGE_URL = `${BASE_URL}/mock_knowledge`;
const BATCH_MOCK_CHAT_URL = `${BASE_URL}/batch_mock_chat`;
const GET_MOCK_CHAT_RESULT_URL = `${BASE_URL}/get_mock_chat_result`;
const MOCK_RANDOM_CHOICE_ACCOUNT_URL = `${BASE_URL}/mock_random_choice_account`;
const AGENT_FLOW_TEST_TRIGGER_URL = `${BASE_URL}/agent_flow_test_trigger`;

const BACKEND_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: BACKEND_AUTHORIZATION,
};

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MemoryData {
  [key: string]: string | string[];
}

export interface CreateShortMemorySessionRequest {
  task_steps: string[];
  first_text: string;
}

export interface CreateShortMemorySessionResponse {
  data: {
    memory: MemoryData;
    memory_pe: string;
    session_key: string;
  };
  msg: string;
  status_code: number;
}

export interface UpdateShortMemoryRequest {
  session_key: string;
  user_text: string;
  ai_text: string;
}

export interface UpdateShortMemoryResponse {
  data: {
    memory: string | MemoryData;
    memory_pe: string;
    session_key: string;
  };
  msg: string;
  status_code: number;
}

export interface LongMemorySaveRequest {
  full_messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  short_memory: string;
}

export interface LongMemorySaveResponse {
  data: {
    long_memory: string;
  };
  msg: string;
  status_code: number;
}

export interface TestCharacterPEResponse {
  data: {
    pe: string;
  };
  msg: string;
  status_code: number;
}

export interface GenerateAICharacterPERequest {
  identity: string;
  retentionLevel: string;
  conversationStyle: string;
}

export interface GenerateAICharacterPEResponse {
  data: {
    pe: string;
  };
  msg: string;
  status_code: number;
}

export interface GenerateMerchantCharacterPERequest {
  characterType: string;
}

export interface GenerateMerchantCharacterPEResponse {
  data: {
    pe: string;
  };
  msg: string;
  status_code: number;
}

export interface KnowledgeRetrievalRequest {
  query: string;
  businessAction?: string;
}

export interface KnowledgeRetrievalResponse {
  data: {
    knowledge: string;
  };
  msg: string;
  status_code: number;
}

export interface MockRandomChoiceAccountRequest {
  character: string;
}

export interface MockRandomChoiceAccountResponse {
  data: {
    account_info: {
      account_name: string;
      category: string;
    };
  };
  msg: string;
  status_code: number;
}

export interface MockCharacterPERequest {
  character: string;
  scenario_type: string;
  full_messages: {
    role: string;
    content: string;
  }[];
  account_info?: any;
}

export interface MockCharacterPEResponse {
  data: {
    character_pe: string;
    account_info?: any;
  };
  msg: string;
  status_code: number;
}

export interface GenScriptPERequest {
  agent_call_config: AgentCallConfig;
  account_info?: any;
}

export interface GenScriptPEResponse {
  data: {
    script_pe: string;
  };
  msg: string;
  status_code: number;
}

export interface MockKnowledgeRequest {
  full_messages: {
    role: string;
    content: string;
  }[];
}

export interface MockKnowledgeResponse {
  data: {
    knowledge_list: string[];
  };
  msg: string;
  status_code: number;
}

export interface BatchMockChatRequest {
  id: string;
}

export interface BatchMockChatResponse {
  data: any;
  msg: string;
  status_code: number;
}

export interface GetMockChatResultRequest {
  id: string;
}

export interface GetMockChatResultResponse {
  data: any;
  msg: string;
  status_code: number;
}

export interface AgentFlowTestTriggerRequest {
  agent_call_id: string;
  test_phone: string;
}

export interface ChatCompletionsResult {
  content: string;
  reasoningContent: string;
}

export interface ChatCompletionsOptions {
  thinking?: boolean;
  thinkingBudgetTokens?: number;
  timeoutMs?: number;
  noReasoningTimeoutMs?: number;
}

export interface ChatCompletionsStreamOptions extends ChatCompletionsOptions {
  onContentDelta?: (delta: string) => void;
  onReasoningDelta?: (delta: string) => void;
}

function stringifyMixed(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyMixed(item))
      .filter(Boolean)
      .join('\n');
  }
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (typeof value.content === 'string') return value.content;
    if (Array.isArray(value.content)) return stringifyMixed(value.content);
    if (typeof value.reasoning_content === 'string') return value.reasoning_content;
    if (typeof value.reasoning === 'string') return value.reasoning;
  }
  return '';
}

export async function* chatCompletionsStream(messages: Message[]) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: ENDPOINT_ID,
      messages: messages,
      stream: true,
      thinking: {
        type: 'disabled'
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            yield delta.content;
          }
        } catch (e) {
          console.error('Failed to parse chunk:', data, e);
        }
      }
    }
  }
}

export async function chatCompletionsWithThinkingStream(
  messages: Message[],
  options: ChatCompletionsStreamOptions = {}
): Promise<ChatCompletionsResult> {
  const {
    thinking = true,
    thinkingBudgetTokens = 2000,
    timeoutMs = 90000,
    noReasoningTimeoutMs,
    onContentDelta,
    onReasoningDelta,
  } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  let noReasoningTimeoutId: number | undefined;

  if (thinking && noReasoningTimeoutMs) {
    noReasoningTimeoutId = window.setTimeout(() => controller.abort(), noReasoningTimeoutMs);
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: ENDPOINT_ID,
      messages,
      stream: true,
      thinking: {
        type: thinking ? 'enabled' : 'disabled',
        ...(thinking ? { budget_tokens: thinkingBudgetTokens } : {}),
      },
    }),
    signal: controller.signal,
  });

  if (!response.ok) {
    window.clearTimeout(timeoutId);
    throw new Error(`API request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    window.clearTimeout(timeoutId);
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let reasoningContent = '';

  const handlePayload = (payload: string) => {
    if (!payload || payload === '[DONE]') return;
    try {
      const parsed = JSON.parse(payload);
      const delta = parsed.choices?.[0]?.delta || {};
      const contentDelta = stringifyMixed(delta.content);
      const reasoningDelta = stringifyMixed(
        delta.reasoning_content ?? delta.reasoning ?? delta.reasoningContent
      );

      if (reasoningDelta) {
        reasoningContent += reasoningDelta;
        if (noReasoningTimeoutId) {
          window.clearTimeout(noReasoningTimeoutId);
          noReasoningTimeoutId = undefined;
        }
        onReasoningDelta?.(reasoningDelta);
      }
      if (contentDelta) {
        content += contentDelta;
        onContentDelta?.(contentDelta);
      }
    } catch (e) {
      console.error('Failed to parse stream chunk:', payload, e);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            return { content, reasoningContent };
          }
          handlePayload(payload);
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      handlePayload(buffer.slice(6).trim());
    }
    return { content, reasoningContent };
  } finally {
    window.clearTimeout(timeoutId);
    if (noReasoningTimeoutId) {
      window.clearTimeout(noReasoningTimeoutId);
    }
  }
}

export async function chatCompletionsWithThinking(
  messages: Message[],
  options: ChatCompletionsOptions = {}
): Promise<ChatCompletionsResult> {
  const {
    thinking = true,
    thinkingBudgetTokens = 8000,
    timeoutMs = 60000,
  } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: ENDPOINT_ID,
      messages: messages,
      stream: false,
      thinking: {
        type: thinking ? 'enabled' : 'disabled',
        ...(thinking ? { budget_tokens: thinkingBudgetTokens } : {}),
      }
    }),
    signal: controller.signal,
  });
  window.clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const result = await response.json();
  const choice = result?.choices?.[0] || {};
  const message = choice?.message || {};

  const content = stringifyMixed(message.content ?? choice.content).trim();

  const reasoningFromContentSegments = Array.isArray(message.content)
    ? message.content
        .filter((segment: any) => /reason/i.test(String(segment?.type || '')))
        .map((segment: any) => stringifyMixed(segment))
        .filter(Boolean)
        .join('\n')
    : '';

  const reasoningCandidates = [
    message.reasoning_content,
    message.reasoning,
    message.reasoningContent,
    choice.reasoning_content,
    choice.reasoning,
    result.reasoning_content,
    result.reasoning,
    reasoningFromContentSegments,
  ];

  const reasoningContent = reasoningCandidates
    .map((value) => stringifyMixed(value).trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  return {
    content,
    reasoningContent,
  };
}

export async function chatCompletions(
  messages: Message[],
  options: ChatCompletionsOptions = {}
): Promise<string> {
  const result = await chatCompletionsWithThinking(messages, options);
  return result.content;
}

export async function createShortMemorySession(
  request: CreateShortMemorySessionRequest
): Promise<CreateShortMemorySessionResponse> {
  const response = await fetch(MEMORY_API_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function updateShortMemory(
  request: UpdateShortMemoryRequest
): Promise<UpdateShortMemoryResponse> {
  const response = await fetch(UPDATE_MEMORY_API_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function getTestCharacterPE(): Promise<TestCharacterPEResponse> {
  const response = await fetch(TEST_CHARACTER_PE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function saveLongMemory(
  request: LongMemorySaveRequest
): Promise<LongMemorySaveResponse> {
  const response = await fetch(LONG_MEMORY_SAVE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function generateAICharacterPE(
  request: GenerateAICharacterPERequest
): Promise<GenerateAICharacterPEResponse> {
  const response = await fetch(AI_CHARACTER_PE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function generateMerchantCharacterPE(
  request: GenerateMerchantCharacterPERequest
): Promise<GenerateMerchantCharacterPEResponse> {
  const response = await fetch(MERCHANT_CHARACTER_PE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function knowledgeRetrieval(
  request: KnowledgeRetrievalRequest
): Promise<KnowledgeRetrievalResponse> {
  const response = await fetch(KNOWLEDGE_RETRIEVAL_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function mockCharacterPE(
  request: MockCharacterPERequest
): Promise<MockCharacterPEResponse> {
  const response = await fetch(MOCK_CHARACTER_PE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function mockRandomChoiceAccount(
  request: MockRandomChoiceAccountRequest
): Promise<MockRandomChoiceAccountResponse> {
  const response = await fetch(MOCK_RANDOM_CHOICE_ACCOUNT_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function genScriptPE(
  request: GenScriptPERequest,
  fullMessages?: Message[]
): Promise<GenScriptPEResponse> {
  const response = await fetch(GEN_SCRIPT_PE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify({
      ...request,
      full_messages: fullMessages
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

export async function mockKnowledge(
  request: MockKnowledgeRequest
): Promise<MockKnowledgeResponse> {
  const response = await fetch(MOCK_KNOWLEDGE_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function batchMockChat(
  request: BatchMockChatRequest
): Promise<BatchMockChatResponse> {
  const response = await fetch(BATCH_MOCK_CHAT_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function getMockChatResult(
  request: GetMockChatResultRequest
): Promise<GetMockChatResultResponse> {
  const response = await fetch(GET_MOCK_CHAT_RESULT_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

export async function agentFlowTestTrigger(
  request: AgentFlowTestTriggerRequest
): Promise<string> {
  const response = await fetch(AGENT_FLOW_TEST_TRIGGER_URL, {
    method: 'POST',
    headers: BACKEND_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.text();
}
