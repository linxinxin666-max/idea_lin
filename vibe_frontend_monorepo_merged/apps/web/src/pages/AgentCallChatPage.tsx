
import { useState, useRef, useEffect } from 'react';
import { Card, Button, Typography, Avatar, Space, Tag, Message as ArcoMessage, Select } from '@arco-design/web-react';
import { IconRobot, IconUser, IconArrowLeft, IconCheck } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatCompletionsStream, chatCompletions, Message as ApiMessage, createShortMemorySession, updateShortMemory, MemoryData } from '../services/arkApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_AUTHORIZATION } from '../utils/constants';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function MemoryCard({ memory }: { memory: Record<string, any> }) {
  const fixedOrder = ['待办事项', '处理中事项', '已完成事项'];
  
  const sortedEntries = Object.entries(memory).sort((a, b) => {
    const indexA = fixedOrder.indexOf(a[0]);
    const indexB = fixedOrder.indexOf(b[0]);
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {sortedEntries.map(([key, value]) => (
        <Card 
          key={key}
          style={{ 
            border: '1px solid #e5e6eb',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
          bodyStyle={{ padding: '14px' }}
        >
          <div style={{ marginBottom: '10px' }}>
            <Typography.Text 
              style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#86909c',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {key}
            </Typography.Text>
          </div>
          {Array.isArray(value) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {value.map((item, index) => (
                <div 
                  key={index}
                  style={{ 
                    backgroundColor: '#f7f8fa',
                    border: '1px solid #e5e6eb',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#1d2129',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <Typography.Text 
              style={{ 
                fontSize: '13px', 
                color: '#1d2129',
                lineHeight: 1.6,
                display: 'block'
              }}
            >
              {value}
            </Typography.Text>
          )}
        </Card>
      ))}
    </div>
  );
}

function AgentCallChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [shortTermMemory, setShortTermMemory] = useState<MemoryData>({});
  const [knowledgeRetrieval, setKnowledgeRetrieval] = useState<MemoryData>({});
  const [sessionKey, setSessionKey] = useState<string>('');
  const [memoryPE, setMemoryPE] = useState<string>('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<string>('爽快配合型');
  const [characterPE, setCharacterPE] = useState<string>('');
  const [isAutoChatting, setIsAutoChatting] = useState(false);
  const [conversationTurns, setConversationTurns] = useState(0);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.formData) {
      setFormData(location.state.formData);
      const openingRemarks = location.state.formData.agent_config?.openingRemarks;
      if (openingRemarks) {
        setMessages([
          {
            id: 'opening',
            role: 'assistant',
            content: openingRemarks
          }
        ]);
      }
      
      const coreContents = location.state.formData.agent_config?.coreContents || [];
      if (coreContents.length > 0) {
        const todoItems = coreContents
          .filter((item: any) => item.content?.trim())
          .map((item: any) => item.content.trim());
        if (todoItems.length > 0) {
          setShortTermMemory({
            '待办事项': todoItems
          });
        }
      }
    }
  }, [location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);





  const sendUserMessage = async (
    currentMessages: Message[],
    characterPEValue: string
  ): Promise<string> => {
    const openingMessage = messages.find(m => m.id === 'opening');
    const apiMessages: ApiMessage[] = [
      { role: 'system', content: characterPEValue },
      ...(openingMessage ? [{ role: 'user', content: openingMessage.content }] : []),
      ...currentMessages.map(m => ({
        role: m.role === 'user' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const response = await chatCompletions(apiMessages);
    
    try {
      const parsedResponse = JSON.parse(response);
      return parsedResponse['润色后的回复'] || parsedResponse['商家回复原声'] || response;
    } catch (error) {
      console.error('解析用户响应失败:', error);
      return response;
    }
  };

  const sendUserMessageStream = async (
    currentMessages: Message[],
    characterPEValue: string,
    onUpdate: (content: string) => void
  ): Promise<string> => {
    const openingMessage = messages.find(m => m.id === 'opening');
    const apiMessages: ApiMessage[] = [
      { role: 'system', content: characterPEValue },
      ...(openingMessage ? [{ role: 'user', content: openingMessage.content }] : []),
      ...currentMessages.map(m => ({
        role: m.role === 'user' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    let fullResponse = '';
    for await (const chunk of chatCompletionsStream(apiMessages)) {
      fullResponse += chunk;
      onUpdate(fullResponse);
    }
    return fullResponse;
  };

  const sendAssistantMessageStream = async (
    currentMessages: Message[],
    onUpdate: (content: string) => void
  ): Promise<string> => {
    const openingMessage = messages.find(m => m.id === 'opening');
    const apiMessages: ApiMessage[] = [
      ...(formData?.script_pe ? [{ role: 'system' as const, content: formData.script_pe }] : []),
      ...(memoryPE ? [{ role: 'system' as const, content: memoryPE }] : []),
      ...(openingMessage ? [{ role: openingMessage.role as 'user' | 'assistant' | 'system', content: openingMessage.content }] : []),
      ...currentMessages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    ];

    let fullResponse = '';
    for await (const chunk of chatCompletionsStream(apiMessages)) {
      fullResponse += chunk;
      onUpdate(fullResponse);
    }
    return fullResponse;
  };

  const startAutoChat = async () => {
    if (!formData?.agent_config?.openingRemarks) {
      return;
    }

    if (hasStartedChat) {
      resetConversation();
    }

    setIsAutoChatting(true);
    setConversationTurns(0);
    setHasStartedChat(true);
    
    try {
      const scenarioType = formData?.agent_config?.businessBehavior || '新开';
      const initialFullMessages: Array<{ role: string; content: string }> = [];
      const openingMessage = messages.find(m => m.id === 'opening');
      if (openingMessage) {
        initialFullMessages.push({
          role: 'assistant',
          content: openingMessage.content
        });
      }
      
      const characterPEValue = await fetchMockCharacterPE(simulatedRole, scenarioType, initialFullMessages);
      
      const coreContents = formData?.agent_config?.coreContents || [];
      const validTodos = coreContents
        .filter((item: any) => item.content?.trim())
        .map((item: any) => item.content.trim());
      const openingLine = formData?.agent_config?.openingRemarks;
      
      let initialSessionKey = '';
      if (validTodos.length > 0 && openingLine) {
        const response = await createShortMemorySession({
          todo: validTodos,
          first_text: openingLine
        });
        if (response.status_code === 0) {
          setShortTermMemory(response.data.memory.memory);
          setSessionKey(response.data.session_key);
          setMemoryPE(response.data.memory_pe);
          initialSessionKey = response.data.session_key;
        }
      }
      
      setConversationStarted(true);
      await runAutoChatLoop(characterPEValue, initialSessionKey, scenarioType);
    } catch (error) {
      console.error('Failed to start auto chat:', error);
      setIsAutoChatting(false);
    }
  };

  const shouldEndConversation = (userResponse: string, assistantResponse?: string): boolean => {
    if (userResponse.includes('挂断')) {
      return true;
    }
    if (assistantResponse) {
      const closingRemarks = formData?.agent_config?.closingRemarks;
      if (closingRemarks && assistantResponse.includes(closingRemarks)) {
        return true;
      }
    }
    return false;
  };

  const runAutoChatLoop = async (characterPEValue: string, initialSessionKey: string, scenarioType: string) => {
    let currentMessages = [...messages.filter(m => m.id !== 'opening')];
    let currentTurns = 0;
    let shouldContinue = true;
    let currentSessionKey = initialSessionKey;
    let currentCharacterPE = characterPEValue;
    
    while (shouldContinue && currentTurns < 20) {
      try {
        setIsLoading(true);
        
        const userMessageId = Date.now().toString();
        const userMessage: Message = {
          id: userMessageId,
          role: 'user',
          content: ''
        };
        currentMessages = [...currentMessages, userMessage];
        setMessages(prev => [...prev, userMessage]);
        
        const fullMessagesForPE: Array<{ role: string; content: string }> = [];
        const openingMessage = messages.find(m => m.id === 'opening');
        if (openingMessage) {
          fullMessagesForPE.push({
            role: 'assistant',
            content: openingMessage.content
          });
        }
        currentMessages.slice(0, -1).forEach(msg => {
          fullMessagesForPE.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
        
        currentCharacterPE = await fetchMockCharacterPE(simulatedRole, scenarioType, fullMessagesForPE);
        
        const userResponse = await sendUserMessage(
          currentMessages.slice(0, -1),
          currentCharacterPE
        );
        
        setMessages(prev => prev.map(m => 
          m.id === userMessageId ? { ...m, content: userResponse } : m
        ));
        currentMessages[currentMessages.length - 1].content = userResponse;
        
        if (!conversationStarted) {
          setConversationStarted(true);
        }
        
        if (shouldEndConversation(userResponse)) {
          shouldContinue = false;
        }
        
        if (!shouldContinue) {
          setIsLoading(false);
          break;
        }
        
        await fetchKnowledgeRetrieval([...messages, ...currentMessages]);
        
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: ''
        };
        currentMessages = [...currentMessages, assistantMessage];
        setMessages(prev => [...prev, assistantMessage]);
        
        const assistantResponse = await sendAssistantMessageStream(
          currentMessages.slice(0, -1),
          (content) => {
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content } : m
            ));
          }
        );
        
        currentMessages[currentMessages.length - 1].content = assistantResponse;
        
        currentTurns++;
        setConversationTurns(currentTurns);
        
        if (currentSessionKey && assistantResponse) {
          try {
            const updateResponse = await updateShortMemory({
              session_key: currentSessionKey,
              user_text: userResponse,
              ai_text: assistantResponse
            });
            if (updateResponse.status_code === 0) {
              const parsedMemory = JSON.parse(updateResponse.data.memory);
              setShortTermMemory(parsedMemory);
              currentSessionKey = updateResponse.data.session_key;
              setSessionKey(currentSessionKey);
              setMemoryPE(updateResponse.data.memory_pe);
            }
          } catch (error) {
            console.error('Failed to update memory after LLM:', error);
          }
        }
        
        if (shouldEndConversation(userResponse, assistantResponse)) {
          shouldContinue = false;
        }
        
        setIsLoading(false);
        
        if (shouldContinue) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error('Auto chat loop error:', error);
        setIsLoading(false);
        shouldContinue = false;
      }
    }
    
    setIsAutoChatting(false);
  };

  const resetConversation = () => {
    setIsLoading(false);
    setConversationStarted(false);
    setShortTermMemory({});
    setSessionKey('');
    setMemoryPE('');
    setKnowledgeRetrieval({});
    setIsAutoChatting(false);
    setConversationTurns(0);
    setHasStartedChat(false);
    if (formData?.agent_config?.openingRemarks) {
      setMessages([
        {
          id: 'opening',
          role: 'assistant',
          content: formData.agent_config.openingRemarks
        }
      ]);
    } else {
      setMessages([]);
    }
  };

  const fetchKnowledgeRetrieval = async (currentMessages: Message[]) => {
    try {
      const apiMessages = currentMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/mock_knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: BACKEND_AUTHORIZATION,
        },
        body: JSON.stringify({ full_messages: apiMessages }),
      });
      
      const result = await response.json();
      if (result.status_code === 0 && result.data?.knowledge_list) {
        setKnowledgeRetrieval({
          '推荐话术': result.data.knowledge_list
        });
      }
    } catch (error) {
      console.error('获取知识召回失败:', error);
    }
  };

  const fetchMockCharacterPE = async (character: string, scenarioType: string, fullMessages: Array<{ role: string; content: string }>): Promise<string> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/mock_character_pe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: BACKEND_AUTHORIZATION,
        },
        body: JSON.stringify({ 
          character,
          scenario_type: scenarioType,
          full_messages: fullMessages
        }),
      });
      
      const result = await response.json();
      if (result.status_code === 0 && result.data?.character_pe) {
        const pe = result.data.character_pe;
        setCharacterPE(pe);
        return pe;
      }
      return '';
    } catch (error) {
      console.error('获取角色PE失败:', error);
      return '';
    }
  };

  const handleNextStep = async () => {
    if (!formData?.agent_config) {
      ArcoMessage.error('缺少配置信息');
      return;
    }

    if (!formData?.script_pe) {
      ArcoMessage.error('缺少脚本配置');
      return;
    }

    navigate('/self_help/agent_call/mock_test', { 
      state: { 
        formData: formData
      } 
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', boxSizing: 'border-box', background: '#f2f3f5' }}>
      <Card 
        style={{ borderRadius: '8px', flexShrink: 0, marginBottom: '12px' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconRobot style={{ fontSize: '24px', color: '#165DFF' }} />
            <div>
              <Typography.Title heading={4} style={{ margin: 0, fontSize: '18px' }}>
                AgentCall 对话
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: '13px' }}>
                测试您的智能外呼机器人配置
              </Typography.Text>
            </div>
          </div>
          <Space size="medium">
            <Button 
              icon={<IconArrowLeft />} 
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
            <Button 
              type="primary" 
              icon={<IconCheck />}
              onClick={handleNextStep}
            >
              下一步
            </Button>
          </Space>
        </div>
      </Card>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', boxSizing: 'border-box', gap: '12px' }}>
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px' }}>
            <Card 
              style={{ marginBottom: '12px', border: '1px solid #e5e6eb', flexShrink: 0 }}
              title={<Typography.Text style={{ fontWeight: 600, fontSize: '14px' }}>配置</Typography.Text>}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Typography.Text style={{ fontSize: '13px', fontWeight: 500, color: '#1d2129' }}>
                  模拟角色身份
                </Typography.Text>
                <Select
                  placeholder="请选择模拟角色身份"
                  value={simulatedRole}
                  onChange={(value) => setSimulatedRole(value)}
                  style={{ width: 200 }}
                >
                  <Select.Option value="爽快配合型">爽快配合型</Select.Option>
                  <Select.Option value="忙碌敷衍型">忙碌敷衍型</Select.Option>
                  <Select.Option value="谨慎盘问型">谨慎盘问型</Select.Option>
                  <Select.Option value="价格敏感型">价格敏感型</Select.Option>
                  <Select.Option value="情绪抱怨型">情绪抱怨型</Select.Option>
                </Select>
              </div>
            </Card>
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '12px',
              backgroundColor: '#fafafa',
              borderRadius: '6px',
              marginBottom: '12px',
              minHeight: 0
            }}>
              {messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#86909c', 
                  marginTop: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Avatar 
                    size={56} 
                    style={{ 
                      backgroundColor: '#e8f3ff', 
                      marginBottom: '16px',
                      color: '#165dff'
                    }}
                  >
                    <IconRobot style={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography.Title heading={5} style={{ color: '#1d2129', marginBottom: '8px', fontSize: '18px' }}>
                    AgentCall 对话助手
                  </Typography.Title>
                  <Typography.Text style={{ color: '#86909c', marginBottom: '20px', fontSize: '14px' }}>
                    开始对话，测试您的智能外呼机器人配置
                  </Typography.Text>
                </div>
              ) : (
                messages.map(message => (
                  <div 
                    key={message.id}
                    style={{ 
                      display: 'flex', 
                      marginBottom: '16px',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-start'
                    }}
                  >
                    {message.role === 'assistant' && (
                      <Avatar 
                        size={36} 
                        style={{ 
                          backgroundColor: '#e8f3ff', 
                          color: '#165dff',
                          marginRight: '12px',
                          flexShrink: 0
                        }}
                      >
                        <IconRobot />
                      </Avatar>
                    )}
                    <div 
                      style={{ 
                        maxWidth: '75%',
                        padding: '12px 16px',
                        borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: message.role === 'user' ? '#165DFF' : '#ffffff',
                        color: message.role === 'user' ? '#ffffff' : '#1d2129',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                        border: message.role === 'assistant' ? '1px solid #e5e6eb' : 'none'
                      }}
                    >
                      {message.role === 'user' ? (
                        <Typography.Text style={{ color: 'inherit', lineHeight: 1.6, fontSize: '14px' }}>
                          {message.content}
                        </Typography.Text>
                      ) : (
                        <div style={{ color: 'inherit', lineHeight: 1.7, fontSize: '14px' }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <Typography.Paragraph style={{ margin: '0 0 8px 0', color: 'inherit' }}>{children}</Typography.Paragraph>,
                              h1: ({ children }) => <Typography.Title heading={4} style={{ color: 'inherit', marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>{children}</Typography.Title>,
                              h2: ({ children }) => <Typography.Title heading={5} style={{ color: 'inherit', marginTop: 0, marginBottom: '6px', fontSize: '16px' }}>{children}</Typography.Title>,
                              h3: ({ children }) => <Typography.Title heading={6} style={{ color: 'inherit', marginTop: 0, marginBottom: '4px', fontSize: '14px' }}>{children}</Typography.Title>,
                              ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px', color: 'inherit' }}>{children}</ul>,
                              ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px', color: 'inherit' }}>{children}</ol>,
                              li: ({ children }) => <li style={{ margin: '2px 0', color: 'inherit' }}>{children}</li>,
                              code: ({ children }) => <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#f53f3f', fontFamily: 'Monaco, Consolas, monospace', fontSize: '13px' }}>{children}</code>,
                              pre: ({ children }) => <pre style={{ backgroundColor: '#f7f8fa', padding: '12px', borderRadius: '6px', overflow: 'auto', color: '#1d2129', margin: '8px 0', fontSize: '13px' }}>{children}</pre>,
                              blockquote: ({ children }) => <blockquote style={{ borderLeft: '4px solid #165dff', paddingLeft: '12px', margin: '8px 0', color: '#4e5969', backgroundColor: '#f7f8fa', paddingTop: '6px', paddingBottom: '6px', paddingRight: '12px', borderRadius: '0 4px 4px 0' }}>{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} style={{ color: '#165DFF', textDecoration: 'underline' }}>{children}</a>,
                              strong: ({ children }) => <strong style={{ color: 'inherit', fontWeight: 600 }}>{children}</strong>,
                              em: ({ children }) => <em style={{ color: 'inherit' }}>{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <Avatar 
                        size={36} 
                        style={{ 
                          backgroundColor: '#165dff', 
                          marginLeft: '12px',
                          flexShrink: 0
                        }}
                      >
                        <IconUser />
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div style={{ borderTop: '1px solid #e5e6eb', paddingTop: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                <Space size="medium">
                  <Tag color={isAutoChatting ? 'green' : 'arcoblue'} size="small">
                    {isAutoChatting ? '正在对话中' : '准备就绪'}
                  </Tag>
                  <Tag color="orange" size="small">
                    对话轮次: {conversationTurns}
                  </Tag>
                  <Button 
                    onClick={resetConversation}
                    disabled={isLoading}
                    size="small"
                  >
                    重新开始
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={startAutoChat} 
                    loading={isLoading || isAutoChatting}
                    disabled={!formData?.agent_config?.openingRemarks}
                    size="small"
                  >
                    {isAutoChatting ? '对话进行中...' : '开始自动对话'}
                  </Button>
                </Space>
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px', color: '#86909c', fontSize: '12px' }}>
                内容由AI生成，无法确保真实准确，仅供参考。
              </div>
            </div>
          </Card>
        </div>
        
        <div style={{ width: '340px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box', flexShrink: 0 }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Card 
              style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e5e6eb',
                borderRadius: '8px',
                minHeight: 0
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tag color="arcoblue" size="small" style={{ marginRight: '6px' }}>
                    短期记忆
                  </Tag>
                </div>
              }
              headerStyle={{ 
                borderBottom: '1px solid #e5e6eb',
                padding: '8px 12px',
                backgroundColor: '#f7f8fa',
                flexShrink: 0
              }}
              bodyStyle={{ padding: '10px', overflow: 'auto', flex: 1, minHeight: 0 }}
            >
              {Object.keys(shortTermMemory).length > 0 ? (
                <MemoryCard memory={shortTermMemory} />
              ) : (
                <div style={{ textAlign: 'center', color: '#86909c', padding: '20px 0' }}>
                  <Typography.Text style={{ fontSize: '13px' }}>开始对话后显示短期记忆</Typography.Text>
                </div>
              )}
            </Card>
          </div>
          
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Card 
              style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e5e6eb',
                borderRadius: '8px',
                minHeight: 0
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tag color="green" size="small" style={{ marginRight: '6px' }}>
                    知识召回
                  </Tag>
                </div>
              }
              headerStyle={{ 
                borderBottom: '1px solid #e5e6eb',
                padding: '8px 12px',
                backgroundColor: '#f7f8fa',
                flexShrink: 0
              }}
              bodyStyle={{ padding: '10px', overflow: 'auto', flex: 1, minHeight: 0 }}
            >
              {Object.keys(knowledgeRetrieval).length > 0 ? (
                <MemoryCard memory={knowledgeRetrieval} />
              ) : (
                <div style={{ textAlign: 'center', color: '#86909c', padding: '20px 0' }}>
                  <Typography.Text style={{ fontSize: '13px' }}>暂无知识召回数据</Typography.Text>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentCallChatPage;
