import { useState, useEffect, useRef } from 'react';
import { Button, Select, Tag, Input, Toast, Spin } from '@douyinfe/semi-ui';
import { IconPhone, IconRefresh } from '@douyinfe/semi-icons';
import { useCreateStore } from '../../../stores/useCreateStore';
import {
  chatCompletionsStream,
  chatCompletions,
  createShortMemorySession,
  updateShortMemory,
  genScriptPE,
  mockCharacterPE,
  mockRandomChoiceAccount,
  mockKnowledge,
  agentFlowTestTrigger,
  type Message as ApiMessage,
  type MemoryData
} from '../../../services/arkApi';
import './StepAutoChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ParseTask {
  question: string;
  type: 'extraction' | 'classification';
  tags: string[];
}

interface ParseResult extends ParseTask {
  result: string;
}

export function StepAutoChat() {
  const { form, scriptId, setCurrentStep } = useCreateStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [simulatedRole, setSimulatedRole] = useState('谨慎盘问型');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoChatting, setIsAutoChatting] = useState(false);
  const shouldStopRef = useRef(false);
  const [conversationTurns, setConversationTurns] = useState(0);
  const [shortTermMemory, setShortTermMemory] = useState<MemoryData>({});
  const [knowledgeRetrieval, setKnowledgeRetrieval] = useState<MemoryData>({});
  const [sessionKey, setSessionKey] = useState<string>('');
  const [scriptPE, setScriptPE] = useState<string>('');
  const [memoryPE, setMemoryPE] = useState<string>('');
  const [characterPE, setCharacterPE] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isCalling, setIsCalling] = useState(false);
  const [parseResults, setParseResults] = useState<ParseResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateTodoList = () => {
    const todos: string[] = [];
    form.coreContents.forEach((content, index) => {
      todos.push(`核心内容 ${index + 1}: ${content.content}`);
    });
    return todos;
  };

  const buildAgentConfig = () => {
    const identityMap: Record<string, string> = {
      '抖音官方客服': 'douyin_offical_customer_service',
      '生活服务运营': 'life_service_operation',
      '普通用户': 'normal_user'
    };
    const retentionLevelMap: Record<string, string> = {
      '轻度': 'mild',
      '均衡': 'balanced',
      '重度': 'severe'
    };
    const conversationStyleMap: Record<string, string> = {
      '温和': 'gentle',
      '热情': 'enthusiastic',
      '自然': 'natural'
    };
    const skillTypeReverseMap: Record<string, string> = {
      '不需要技能': 'none',
      '发送短信消息': 'sms',
      '添加企业微信': 'wecom',
      '发送微信消息': 'wechat_msg'
    };

    const coreContents = form.coreContents.map((content) => {
      const verifyItems = content.parseItems?.map(item => ({
        question: item.question,
        results: item.tags
      }));
      return {
        content: content.content,
        type: content.type,
        mode: form.contentMode,
        ...(verifyItems && verifyItems.length > 0 ? { verifyItems } : {})
      };
    });

    return {
      businessBehavior: form.businessAction,
      identity: identityMap[form.identity] || form.identity,
      retentionLevel: retentionLevelMap[form.retentionLevel] || form.retentionLevel,
      conversationStyle: conversationStyleMap[form.dialogStyle] || form.dialogStyle,
      openingRemarks: form.openingRemarks,
      closingRemarks: form.closingRemarks,
      coreContents,
      skillType: skillTypeReverseMap[form.skillType] || form.skillType,
      triggerIntents: form.triggerIntents,
      selectedKBIds: form.selectedKBIds,
      triggerIntentMode: form.triggerIntentMode,
      triggerContentIndex: form.triggerContentIndex,
      triggerParseValues: form.triggerParseValues,
      triggerContent: form.triggerContent,
    };
  };

  const checkShouldEndConversation = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return lowerText.includes('挂断') || lowerText.includes('close');
  };

  const sendAIMessageStream = async (
    currentMessages: Message[],
    scriptPEValue: string,
    memoryPEValue: string,
    onContentUpdate: (content: string) => void
  ): Promise<string> => {
    try {
      const apiMessages: ApiMessage[] = [
        { role: 'system', content: scriptPEValue },
        ...(memoryPEValue ? [{ role: 'system' as const, content: memoryPEValue }] : []),
        ...currentMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      ];

      let fullResponse = '';
      for await (const chunk of chatCompletionsStream(apiMessages)) {
        fullResponse += chunk;
        onContentUpdate(fullResponse);
      }
      return fullResponse;
    } catch (error) {
      console.error('Send AI message error:', error);
      const response = '抱歉，发生了错误，请稍后重试。';
      onContentUpdate(response);
      return response;
    }
  };

  const sendUserMessageStream = async (
    currentMessages: Message[],
    characterPEValue: string,
    onContentUpdate: (content: string) => void
  ): Promise<string> => {
    try {
      const apiMessages: ApiMessage[] = [
        { role: 'system', content: characterPEValue },
        ...currentMessages.map(m => ({
          role: (m.role === 'user' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content
        }))
      ];

      let fullResponse = '';
      for await (const chunk of chatCompletionsStream(apiMessages)) {
        fullResponse += chunk;
        onContentUpdate(fullResponse);
      }
      return fullResponse;
    } catch (error) {
      console.error('Send user message error:', error);
      const response = '抱歉，发生了错误，请稍后重试。';
      onContentUpdate(response);
      return response;
    }
  };

  const stopAutoChat = () => {
    shouldStopRef.current = true;
    setIsAutoChatting(false);
    setIsLoading(false);
  };

  const startAutoChat = async () => {
    shouldStopRef.current = false;
    setIsAutoChatting(true);
    setIsLoading(true);
    setMessages([]);
    setConversationTurns(0);

    try {
      const scenarioType = form.businessAction || '新开';

      let localScriptPE = '';
      let localCharacterPE = '';
      let fixedAccountInfo: any = null;

      // 对话开始时调用 mock_random_choice_account，获取固定的 account_info
      try {
        const accountResponse = await mockRandomChoiceAccount({
          character: simulatedRole
        });
        if (accountResponse.status_code === 0 && accountResponse.data?.account_info) {
          fixedAccountInfo = accountResponse.data.account_info;
        }
      } catch (error) {
        console.error('Failed to get random choice account:', error);
      }

      // 对话开始时先调用一次 mock_character_pe 获取初始 character_pe
      try {
        const characterResponse = await mockCharacterPE({
          character: simulatedRole,
          scenario_type: scenarioType,
          full_messages: [],
          account_info: fixedAccountInfo
        });
        if (characterResponse.status_code === 0 && characterResponse.data?.character_pe) {
          localCharacterPE = characterResponse.data.character_pe;
          setCharacterPE(localCharacterPE);
        }
      } catch (error) {
        console.error('Failed to get initial character pe:', error);
      }

      // 对话开始时先调用一次 gen_script_pe 获取初始 script_pe
      try {
        const initialLLMMessages: ApiMessage[] = [
          { role: 'system', content: localScriptPE || '' }
        ];
        const scriptResponse = await genScriptPE(
          {
            agent_call_config: buildAgentConfig(),
            account_info: fixedAccountInfo
          },
          initialLLMMessages
        );
        if (scriptResponse.status_code === 0 && scriptResponse.data?.script_pe) {
          localScriptPE = scriptResponse.data.script_pe;
          setScriptPE(localScriptPE);
        }
      } catch (error) {
        console.error('Failed to get initial script pe:', error);
      }

      let currentMessages: Message[] = [];
      let currentSessionKey = '';
      let currentMemoryPE = '';
      let currentTurns = 0;

      const userFirstMessageId = Date.now().toString();
      const userFirstMessage: Message = {
        id: userFirstMessageId,
        role: 'user',
        content: '喂'
      };
      currentMessages = [...currentMessages, userFirstMessage];
      setMessages(currentMessages);

      if (checkShouldEndConversation('喂')) {
        setIsAutoChatting(false);
        setIsLoading(false);
        return;
      }

      const taskSteps = generateTodoList();
      if (taskSteps.length > 0) {
        const memResponse = await createShortMemorySession({
          task_steps: taskSteps,
          first_text: '喂'
        });
        if (memResponse.status_code === 0) {
          setShortTermMemory(memResponse.data.memory);
          setSessionKey(memResponse.data.session_key);
          setMemoryPE(memResponse.data.memory_pe);
          currentSessionKey = memResponse.data.session_key;
          currentMemoryPE = memResponse.data.memory_pe;
        }
      }

      while (true) {
        if (shouldStopRef.current) break;
        setIsLoading(true);

        // 每轮AI视角开始前调用 gen_script_pe，更新 scriptPE
        const llmMessages: ApiMessage[] = [
          { role: 'system', content: localScriptPE },
          ...(currentMemoryPE ? [{ role: 'system' as const, content: currentMemoryPE }] : []),
          ...currentMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ];

        try {
          const scriptResponse = await genScriptPE(
            {
              agent_call_config: buildAgentConfig(),
              account_info: fixedAccountInfo
            },
            llmMessages
          );

          if (scriptResponse.status_code === 0 && scriptResponse.data?.script_pe) {
            localScriptPE = scriptResponse.data.script_pe;
            setScriptPE(localScriptPE);
          }
        } catch (error) {
          console.error('Failed to gen script pe:', error);
        }

        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          role: 'assistant',
          content: ''
        };
        currentMessages = [...currentMessages, aiMessage];
        setMessages([...currentMessages]);

        const aiResponse = await sendAIMessageStream(
          currentMessages.slice(0, -1),
          localScriptPE,
          currentMemoryPE,
          (content) => {
            setMessages(prev => prev.map(m =>
              m.id === aiMessageId ? { ...m, content } : m
            ));
          }
        );
        if (shouldStopRef.current) break;

        currentMessages = currentMessages.map(m =>
          m.id === aiMessageId ? { ...m, content: aiResponse } : m
        );

        if (currentSessionKey) {
          try {
            const updateResponse = await updateShortMemory({
              session_key: currentSessionKey,
              user_text: currentMessages[currentMessages.length - 2]?.content || '',
              ai_text: aiResponse
            });
            if (updateResponse.status_code === 0) {
              let parsedMemory;
              try {
                parsedMemory = typeof updateResponse.data.memory === 'string'
                  ? JSON.parse(updateResponse.data.memory)
                  : updateResponse.data.memory;
              } catch (parseError) {
                console.error('Failed to parse memory, using raw value:', parseError);
                parsedMemory = updateResponse.data.memory;
              }
              setShortTermMemory(parsedMemory);
              setSessionKey(updateResponse.data.session_key);
              setMemoryPE(updateResponse.data.memory_pe);
              currentMemoryPE = updateResponse.data.memory_pe;
            }
          } catch (error) {
            console.error('Failed to update memory:', error);
          }
        }
        if (shouldStopRef.current) break;

        if (checkShouldEndConversation(aiResponse)) {
          break;
        }

        currentTurns++;
        setConversationTurns(currentTurns);

        if (currentTurns >= 20) {
          break;
        }
        if (shouldStopRef.current) break;

        // 每轮商家视角开始前调用 mock_character_pe，更新 character_pe
        try {
          const characterResponse = await mockCharacterPE({
            character: simulatedRole,
            scenario_type: scenarioType,
            full_messages: currentMessages.map(m => ({
              role: m.role,
              content: m.content
            })),
            account_info: fixedAccountInfo
          });
          if (characterResponse.status_code === 0 && characterResponse.data?.character_pe) {
            localCharacterPE = characterResponse.data.character_pe;
            setCharacterPE(localCharacterPE);
          }
        } catch (error) {
          console.error('Failed to gen character pe:', error);
        }

        const userNextMessageId = (Date.now() + 2).toString();
        const userNextMessage: Message = {
          id: userNextMessageId,
          role: 'user',
          content: ''
        };
        currentMessages = [...currentMessages, userNextMessage];
        setMessages([...currentMessages]);

        const userResponse = await sendUserMessageStream(
          currentMessages.slice(0, -1),
          localCharacterPE,
          (content) => {
            setMessages(prev => prev.map(m =>
              m.id === userNextMessageId ? { ...m, content } : m
            ));
          }
        );
        if (shouldStopRef.current) break;

        currentMessages = currentMessages.map(m =>
          m.id === userNextMessageId ? { ...m, content: userResponse } : m
        );

        if (checkShouldEndConversation(userResponse)) {
          break;
        }

        await fetchKnowledge(currentMessages);
        if (shouldStopRef.current) break;

        if (currentSessionKey) {
          try {
            const updateResponse = await updateShortMemory({
              session_key: currentSessionKey,
              user_text: userResponse,
              ai_text: aiResponse
            });
            if (updateResponse.status_code === 0) {
              let parsedMemory;
              try {
                parsedMemory = typeof updateResponse.data.memory === 'string'
                  ? JSON.parse(updateResponse.data.memory)
                  : updateResponse.data.memory;
              } catch (parseError) {
                console.error('Failed to parse memory, using raw value:', parseError);
                parsedMemory = updateResponse.data.memory;
              }
              setShortTermMemory(parsedMemory);
              setSessionKey(updateResponse.data.session_key);
              setMemoryPE(updateResponse.data.memory_pe);
              currentMemoryPE = updateResponse.data.memory_pe;
            }
          } catch (error) {
            console.error('Failed to update memory:', error);
          }
        }
        if (shouldStopRef.current) break;

        currentTurns++;
        setConversationTurns(currentTurns);

        if (currentTurns >= 20) {
          break;
        }

        setIsLoading(false);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Auto chat error:', error);
    }

    setIsAutoChatting(false);
    setIsLoading(false);
  };

  const fetchKnowledge = async (currentMessages: Message[]) => {
    try {
      const apiMessages = currentMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const result = await mockKnowledge({ full_messages: apiMessages });
      if (result.status_code === 0 && result.data?.knowledge_list) {
        setKnowledgeRetrieval({
          '推荐话术': result.data.knowledge_list
        });
      }
    } catch (error) {
      console.error('获取知识召回失败:', error);
    }
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      Toast.warning('请输入电话号码');
      return;
    }
    if (!scriptId) {
      Toast.warning('请先完成剧本创建后再发起真机拨打');
      return;
    }
    if (!/^1\d{10}$/.test(phoneNumber.trim())) {
      Toast.warning('请输入正确的 11 位手机号');
      return;
    }
    setIsCalling(true);
    try {
      await agentFlowTestTrigger({
        agent_call_id: String(scriptId),
        test_phone: phoneNumber.trim(),
      });
      Toast.success(`已发起拨打：${phoneNumber.trim()}`);
    } catch (error) {
      console.error('真机拨打失败:', error);
      Toast.error('发起拨打失败，请稍后重试');
    } finally {
      setIsCalling(false);
    }
  };

  // Collect parse tasks from coreContents that have questions configured
  const parseTasks: ParseTask[] = form.coreContents.flatMap(content =>
    (content.parseItems || [])
      .filter(item => item.question.trim())
      .map(item => ({
        question: item.question,
        type: item.tags.length > 1 ? 'classification' : 'extraction',
        tags: item.tags,
      }))
  );

  const runParseAnalysis = async () => {
    if (messages.length === 0 || parseTasks.length === 0) return;
    setIsParsing(true);
    try {
      const convText = messages
        .map(m => `${m.role === 'assistant' ? 'AI助手' : '商家'}: ${m.content}`)
        .join('\n');

      const tasksDesc = parseTasks.map((t, i) => {
        if (t.type === 'classification') {
          return `${i}. 【多分类】${t.question}，从以下选项中选一个：${t.tags.join(' / ')}`;
        } else {
          return `${i}. 【内容提取】${t.question}，提取目标：${t.tags[0]}`;
        }
      }).join('\n');

      const prompt = `你是一个对话分析助手。请根据以下通话对话内容，完成解析任务。

【对话内容】
${convText}

【解析任务】
${tasksDesc}

请以JSON数组格式返回结果，格式如下：
[{"id":0,"result":"..."},{"id":1,"result":"..."}]

规则：
- 多分类：从给定选项中选择最匹配的一个，只输出选项原文
- 内容提取：从商家发言中提取相关原文，无相关内容则输出"未提及"
- 只返回JSON数组，不要其他内容`;

      const response = await chatCompletions([{ role: 'user', content: prompt }]);
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { id: number; result: string }[];
        setParseResults(parseTasks.map((task, i) => ({
          ...task,
          result: parsed.find(p => p.id === i)?.result ?? '未获取到结果',
        })));
      }
    } catch (e) {
      console.error('解析失败', e);
      Toast.error('解析失败，请重试');
    } finally {
      setIsParsing(false);
    }
  };

  const resetConversation = () => {
    setIsLoading(false);
    setShortTermMemory({});
    setKnowledgeRetrieval({});
    setIsAutoChatting(false);
    setConversationTurns(0);
    setSessionKey('');
    setCharacterPE('');
    setScriptPE('');
    setMemoryPE('');
    setMessages([]);
    setParseResults([]);
  };

  return (
    <div className="step-auto-chat">
      <h2 className="step-title">模拟对话</h2>

      {/* Config row */}
      <div className="ac-config-row">
        <span className="ac-config-label">商家人设</span>
        <Select
          value={simulatedRole}
          onChange={(value) => setSimulatedRole(String(value ?? ''))}
          style={{ width: 180 }}
        >
          <Select.Option value="爽快配合型">爽快配合型</Select.Option>
          <Select.Option value="忙碌敷衍型">忙碌敷衍型</Select.Option>
          <Select.Option value="谨慎盘问型">谨慎盘问型</Select.Option>
          <Select.Option value="价格敏感型">价格敏感型</Select.Option>
          <Select.Option value="情绪抱怨型">情绪抱怨型</Select.Option>
        </Select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ac-config-label">真机拨打</span>
          <Input
            value={phoneNumber}
            onChange={setPhoneNumber}
            placeholder="输入电话号码"
            style={{ width: 180 }}
            prefix={<IconPhone />}
          />
          <Button
            type="primary"
            icon={<IconPhone />}
            loading={isCalling}
            onClick={handleCall}
          >
            发起拨打
          </Button>
        </div>
      </div>

      {/* Chat window */}
      <div className="ac-chat-wrap">
        <div className="ac-messages">
          {messages.length === 0 ? (
            <div className="ac-empty">
              <div className="ac-empty-icon">🤖</div>
              <div className="ac-empty-title">剧本对话助手</div>
              <div className="ac-empty-desc">点击「开始自动对话」测试您的剧本配置</div>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`message-row ${message.role === 'user' ? 'user-row' : 'assistant-row'}`}>
                {message.role === 'assistant' && <div className="ac-avatar ac-avatar--bot">🤖</div>}
                <div className={`message-bubble ${message.role}`}>{message.content}</div>
                {message.role === 'user' && <div className="ac-avatar ac-avatar--user">👤</div>}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ac-toolbar">
          <Tag color="orange" size="small">对话轮次: {conversationTurns}</Tag>
          <div className="ac-toolbar-right">
            {isAutoChatting ? (
              <Button size="small" type="danger" onClick={stopAutoChat}>暂停对话</Button>
            ) : (
              <>
                <Button size="small" disabled={isLoading} onClick={resetConversation}>重新开始</Button>
                <Button size="small" type="primary" loading={isLoading} onClick={startAutoChat}>
                  开始自动对话
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="ac-panels">
        <div className="ac-panel">
          <div className="ac-panel-header">短期记忆</div>
          <div className="ac-panel-body">
            {Object.keys(shortTermMemory).length > 0 ? (
              <div className="ac-memory-list">
                {Object.entries(shortTermMemory).map(([key, value]) => {
                  const labelMap: Record<string, string> = {
                    current_step: '当前步骤',
                    current_step_retention_count: '当前步骤挽留次数',
                    decision_role: '决策角色',
                    merchant_attitude: '商家态度',
                    task_steps: '任务步骤',
                  };
                  const label = labelMap[key] || key;
                  return (
                    <div key={key} className="ac-memory-item">
                      <span className="ac-memory-key">{label}</span>
                      <span className="ac-memory-value">
                        {Array.isArray(value)
                          ? (value as string[]).map((v, i) => <div key={i}>{v}</div>)
                          : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ac-panel-empty">开始对话后显示短期记忆</div>
            )}
          </div>
        </div>

        <div className="ac-panel">
          <div className="ac-panel-header">知识召回</div>
          <div className="ac-panel-body">
            {Object.keys(knowledgeRetrieval).length > 0 ? (
              Object.entries(knowledgeRetrieval).map(([key, value]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--semi-color-text-2)', marginBottom: 6 }}>{key}</div>
                  {Array.isArray(value)
                    ? value.map((item, i) => <div key={i} className="ac-knowledge-item">{item}</div>)
                    : <div className="ac-knowledge-item">{value as string}</div>
                  }
                </div>
              ))
            ) : (
              <div className="ac-panel-empty">暂无知识召回数据</div>
            )}
          </div>
        </div>
      </div>

      {/* Parse results panel */}
      {parseTasks.length > 0 && (
        <div className="ac-parse-panel">
          <div className="ac-parse-header">
            <span>解析结果</span>
            <Button
              size="small"
              icon={<IconRefresh />}
              loading={isParsing}
              disabled={messages.length === 0}
              onClick={runParseAnalysis}
            >
              {parseResults.length > 0 ? '重新解析' : '开始解析'}
            </Button>
          </div>
          <div className="ac-parse-body">
            {isParsing ? (
              <div className="ac-parse-loading"><Spin size="middle" /><span>正在解析对话...</span></div>
            ) : parseResults.length > 0 ? (
              <div className="ac-parse-results">
                {parseResults.map((r, i) => (
                  <div key={i} className="ac-parse-item">
                    <div className="ac-parse-item-header">
                      <span className={`ac-parse-type-badge ac-parse-type-${r.type}`}>
                        {r.type === 'classification' ? '多分类' : '内容提取'}
                      </span>
                      <span className="ac-parse-question">{r.question}</span>
                      {r.type === 'classification' && (
                        <span className="ac-parse-options">{r.tags.join(' / ')}</span>
                      )}
                    </div>
                    <div className="ac-parse-result">{r.result}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ac-parse-empty">
                {messages.length === 0 ? '对话结束后点击「开始解析」' : '点击「开始解析」提取对话关键信息'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
