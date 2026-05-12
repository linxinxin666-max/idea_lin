import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography, Tag, Divider, Avatar, Space, Form, Message as ArcoMessage } from '@arco-design/web-react';
import { IconRobot, IconUser, IconMinusCircle, IconPlusCircle } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatCompletionsStream, Message as ApiMessage, createShortMemorySession, updateShortMemory, getTestCharacterPE, saveLongMemory, MemoryData } from '../services/arkApi';

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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {value.map((item, index) => (
                <Tag 
                  key={index} 
                  color="gray" 
                  size="small"
                  style={{ 
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    lineHeight: 1.5
                  }}
                >
                  {item}
                </Tag>
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

function MemoryPlayground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openingLine, setOpeningLine] = useState('老板你好，请问是肯德基老板吗？我是抖音来客的官方运营');
  const [todoItems, setTodoItems] = useState<string[]>(['确认用户身份是否老板', '引导发视频', '协助操作完成发视频动作']);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [shortTermMemory, setShortTermMemory] = useState<MemoryData>({});
  const [longTermMemory, setLongTermMemory] = useState<MemoryData>({});
  const [sessionKey, setSessionKey] = useState<string>('');
  const [characterPE, setCharacterPE] = useState<string>('你是一个友好的助手。');
  const [memoryPE, setMemoryPE] = useState<string>('');
  const [isEndingConversation, setIsEndingConversation] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addTodoItem = () => {
    setTodoItems([...todoItems, '']);
  };

  const removeTodoItem = (index: number) => {
    if (todoItems.length <= 1) return;
    const newItems = [...todoItems];
    newItems.splice(index, 1);
    setTodoItems(newItems);
  };

  const updateTodoItem = (index: number, value: string) => {
    const newItems = [...todoItems];
    newItems[index] = value;
    setTodoItems(newItems);
  };

  const handleSelectAll = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.currentTarget.select();
    }
  };

  const resetConversation = () => {
    setInputValue('');
    setIsLoading(false);
    setConversationStarted(false);
    setShortTermMemory({});
    setLongTermMemory({});
    setSessionKey('');
    setMemoryPE('');
    setIsEndingConversation(false);
    setConversationEnded(false);
    
    if (openingLine.trim()) {
      const openingMessage: Message = {
        id: 'opening',
        role: 'assistant',
        content: openingLine.trim()
      };
      setMessages([openingMessage]);
    } else {
      setMessages([]);
    }
  };

  const endConversation = async () => {
    if (!conversationStarted || !sessionKey) return;
    
    setIsEndingConversation(true);
    
    try {
      const fullMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const shortMemoryStr = JSON.stringify(shortTermMemory);
      
      const response = await saveLongMemory({
        full_messages: fullMessages,
        short_memory: shortMemoryStr
      });
      
      if (response.status_code === 0) {
        const parsedLongMemory = JSON.parse(response.data.long_memory);
        setLongTermMemory(parsedLongMemory);
        setConversationEnded(true);
        ArcoMessage.success('对话已结束，长期记忆已保存');
      }
    } catch (error) {
      console.error('Failed to save long memory:', error);
      ArcoMessage.error('保存长期记忆失败');
    } finally {
      setIsEndingConversation(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchCharacterPE = async () => {
      try {
        const response = await getTestCharacterPE();
        if (response.status_code === 0 && response.data.pe) {
          setCharacterPE(response.data.pe);
        }
      } catch (error) {
        console.error('Failed to fetch character PE:', error);
      }
    };
    
    fetchCharacterPE();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (openingLine.trim()) {
      const openingMessage: Message = {
        id: 'opening',
        role: 'assistant',
        content: openingLine
      };
      setMessages(prev => {
        if (prev.length === 0 || (prev.length === 1 && prev[0].id === 'opening')) {
          return [openingMessage];
        }
        return prev;
      });
    }
  }, [openingLine]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const isFirstMessage = !conversationStarted;
    setConversationStarted(true);

    let currentMemoryPE = memoryPE;
    
    if (isFirstMessage) {
      try {
        const validTodos = todoItems.filter(item => item.trim());
        if (validTodos.length > 0 && openingLine.trim()) {
          const response = await createShortMemorySession({
            todo: validTodos,
            first_text: openingLine.trim()
          });
          if (response.status_code === 0) {
            setShortTermMemory(response.data.memory.memory);
            setSessionKey(response.data.session_key);
            setMemoryPE(response.data.memory_pe);
            currentMemoryPE = response.data.memory_pe;
          }
        }
      } catch (error) {
        console.error('Failed to create memory session:', error);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => {
      let currentMessages = [...prev];
      if (currentMessages.length === 1 && currentMessages[0].id === 'opening') {
        return [currentMessages[0], userMessage];
      }
      return [...currentMessages, userMessage];
    });
    setInputValue('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const openingMessage = messages.find(m => m.id === 'opening');
      const apiMessages: ApiMessage[] = [
        { role: 'system', content: characterPE },
        ...(currentMemoryPE ? [{ role: 'system' as const, content: currentMemoryPE }] : []),
        ...(openingMessage ? [{ role: openingMessage.role as const, content: openingMessage.content }] : []),
        ...messages.filter(m => m.id !== 'opening').map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: inputValue }
      ];

      if (!isFirstMessage && sessionKey) {
        try {
          const updateResponse = await updateShortMemory({
            session_key: sessionKey,
            user_text: inputValue,
            ai_text: ''
          });
          if (updateResponse.status_code === 0) {
            const parsedMemory = JSON.parse(updateResponse.data.memory);
            setShortTermMemory(parsedMemory);
            setSessionKey(updateResponse.data.session_key);
            setMemoryPE(updateResponse.data.memory_pe);
          }
        } catch (error) {
          console.error('Failed to update memory before LLM:', error);
        }
      }

      let fullResponse = '';
      for await (const chunk of chatCompletionsStream(apiMessages)) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: fullResponse }
            : m
        ));
      }

      if (sessionKey && fullResponse) {
        try {
          const updateResponse = await updateShortMemory({
            session_key: sessionKey,
            user_text: inputValue,
            ai_text: fullResponse
          });
          if (updateResponse.status_code === 0) {
            const parsedMemory = JSON.parse(updateResponse.data.memory);
            setShortTermMemory(parsedMemory);
            setSessionKey(updateResponse.data.session_key);
            setMemoryPE(updateResponse.data.memory_pe);
          }
        } catch (error) {
          console.error('Failed to update memory after LLM:', error);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: '抱歉，发生了错误，请稍后重试。' }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', padding: '16px 0', boxSizing: 'border-box' }}>
      <div style={{ width: '70%', height: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
        <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Typography.Title heading={3} style={{ marginBottom: '12px', marginTop: 0, fontSize: '18px' }}>对话区域</Typography.Title>
          
          <Card 
            style={{ marginBottom: '12px', border: '1px solid #e5e6eb', flexShrink: 0 }}
            title={<Typography.Text style={{ fontWeight: 600, fontSize: '14px' }}>配置表单</Typography.Text>}
            bodyStyle={{ padding: '12px 16px' }}
          >
            {!conversationStarted ? (
              <Form layout="vertical">
                <Form.Item
                  label="开场白"
                  required
                  style={{ marginBottom: '12px' }}
                >
                  <Input
                    placeholder="请输入开场白内容"
                    value={openingLine}
                    onChange={(value) => setOpeningLine(value)}
                    onKeyDown={handleSelectAll}
                  />
                </Form.Item>
                
                <Form.Item
                  label="待办事项"
                  required
                  extra="最少需要一个待办事项"
                  style={{ marginBottom: 0 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todoItems.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Input
                          placeholder={`待办事项 ${index + 1}`}
                          value={item}
                          onChange={(value) => updateTodoItem(index, value)}
                          onKeyDown={handleSelectAll}
                          style={{ flex: 1 }}
                        />
                        {todoItems.length > 1 && (
                          <Button
                            type="text"
                            icon={<IconMinusCircle />}
                            onClick={() => removeTodoItem(index)}
                            status="danger"
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="text"
                      icon={<IconPlusCircle />}
                      onClick={addTodoItem}
                      style={{ alignSelf: 'flex-start', color: '#165dff', padding: '4px 8px', height: 'auto' }}
                    >
                      增加待办事项
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {openingLine && (
                  <div>
                    <Typography.Text style={{ fontSize: '12px', color: '#86909c', marginBottom: '4px', display: 'block' }}>
                      开场白
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: '13px', color: '#1d2129' }}>
                      {openingLine}
                    </Typography.Text>
                  </div>
                )}
                {todoItems.filter(item => item.trim()).length > 0 && (
                  <div>
                    <Typography.Text style={{ fontSize: '12px', color: '#86909c', marginBottom: '4px', display: 'block' }}>
                      待办事项
                    </Typography.Text>
                    <Space wrap size={4}>
                      {todoItems.filter(item => item.trim()).map((item, index) => (
                        <Tag key={index} color="gray" size="small">
                          {item}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '12px',
            backgroundColor: '#fafafa',
            borderRadius: '4px',
            marginBottom: '12px',
            minHeight: 0
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#86909c', 
                marginTop: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Avatar 
                  size={48} 
                  style={{ 
                    backgroundColor: '#e8f3ff', 
                    marginBottom: '12px',
                    color: '#165dff'
                  }}
                >
                  <IconRobot style={{ fontSize: 24 }} />
                </Avatar>
                <Typography.Title heading={5} style={{ color: '#1d2129', marginBottom: '6px', fontSize: '16px' }}>记忆可视化助手</Typography.Title>
                <Typography.Text style={{ color: '#86909c', marginBottom: '16px', fontSize: '13px' }}>
                  开始对话，实时查看记忆的更新与变化
                </Typography.Text>
                <Space size={4}>
                  <Tag color="arcoblue" size="small">短期记忆</Tag>
                  <Tag color="green" size="small">长期记忆</Tag>
                </Space>
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id}
                  style={{ 
                    display: 'flex', 
                    marginBottom: '12px',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  {message.role === 'assistant' && (
                    <Avatar 
                      size={32} 
                      style={{ 
                        backgroundColor: '#e8f3ff', 
                        color: '#165dff',
                        marginRight: '10px',
                        flexShrink: 0
                      }}
                    >
                      <IconRobot />
                    </Avatar>
                  )}
                  <div 
                    style={{ 
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: message.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                      backgroundColor: message.role === 'user' ? '#165DFF' : '#ffffff',
                      color: message.role === 'user' ? '#ffffff' : '#1d2129',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                      border: message.role === 'assistant' ? '1px solid #e5e6eb' : 'none'
                    }}
                  >
                    {message.role === 'user' ? (
                      <Typography.Text style={{ color: 'inherit', lineHeight: 1.5, fontSize: '13px' }}>{message.content}</Typography.Text>
                    ) : (
                      <div style={{ color: 'inherit', lineHeight: 1.6, fontSize: '13px' }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <Typography.Paragraph style={{ margin: '0 0 8px 0', color: 'inherit', '&:last-child': { marginBottom: 0 } }}>{children}</Typography.Paragraph>,
                            h1: ({ children }) => <Typography.Title heading={4} style={{ color: 'inherit', marginTop: 0, marginBottom: '8px', fontSize: '16px' }}>{children}</Typography.Title>,
                            h2: ({ children }) => <Typography.Title heading={5} style={{ color: 'inherit', marginTop: 0, marginBottom: '6px', fontSize: '14px' }}>{children}</Typography.Title>,
                            h3: ({ children }) => <Typography.Title heading={6} style={{ color: 'inherit', marginTop: 0, marginBottom: '4px', fontSize: '13px' }}>{children}</Typography.Title>,
                            ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px', color: 'inherit' }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px', color: 'inherit' }}>{children}</ol>,
                            li: ({ children }) => <li style={{ margin: '2px 0', color: 'inherit' }}>{children}</li>,
                            code: ({ children }) => <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '3px', color: '#f53f3f', fontFamily: 'Monaco, Consolas, monospace', fontSize: '12px' }}>{children}</code>,
                            pre: ({ children }) => <pre style={{ backgroundColor: '#f7f8fa', padding: '12px', borderRadius: '6px', overflow: 'auto', color: '#1d2129', margin: '8px 0', fontSize: '12px' }}>{children}</pre>,
                            blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #165dff', paddingLeft: '12px', margin: '8px 0', color: '#4e5969', backgroundColor: '#f7f8fa', paddingTop: '6px', paddingBottom: '6px', paddingRight: '12px', borderRadius: '0 4px 4px 0' }}>{children}</blockquote>,
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
                      size={32} 
                      style={{ 
                        backgroundColor: '#165dff', 
                        marginLeft: '10px',
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, border: '1px solid #e5e6eb', borderRadius: '4px', padding: '6px' }}>
                <Input.TextArea
                  placeholder={conversationEnded ? "对话已结束" : "请输入内容开始对话，回车发送，Shift+回车换行"}
                  value={inputValue}
                  onChange={(value) => setInputValue(value)}
                  onKeyDown={(e) => {
                    handleSelectAll(e);
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !conversationEnded) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading || conversationEnded}
                  rows={2}
                  style={{ border: 'none', boxShadow: 'none', padding: 0, fontSize: '13px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', gap: '6px' }}>
                  <Button 
                    onClick={resetConversation}
                    disabled={isLoading}
                    size="small"
                  >
                    重新开始
                  </Button>
                  {conversationStarted && !conversationEnded && (
                    <Button 
                      onClick={endConversation}
                      loading={isEndingConversation}
                      disabled={isLoading}
                      status="warning"
                      size="small"
                    >
                      结束对话
                    </Button>
                  )}
                  <Button 
                    type="primary" 
                    onClick={handleSend} 
                    loading={isLoading} 
                    disabled={conversationEnded}
                    size="small"
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ width: '30%', height: '100%', padding: '0 16px 16px 0', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
        <div style={{ flex: 1, minHeight: 0, marginTop: '16px' }}>
          <Card 
            style={{ 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e5e6eb',
              borderRadius: '12px'
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tag color="arcoblue" size="small" style={{ marginRight: '6px' }}>
                  短期记忆
                </Tag>
              </div>
            }
            headStyle={{ 
              borderBottom: '1px solid #e5e6eb',
              padding: '10px 14px',
              backgroundColor: '#f7f8fa',
              flexShrink: 0
            }}
            bodyStyle={{ padding: '12px', overflow: 'auto', flex: 1, minHeight: 0 }}
          >
            {Object.keys(shortTermMemory).length > 0 ? (
              <MemoryCard memory={shortTermMemory} />
            ) : (
              <div style={{ textAlign: 'center', color: '#86909c', padding: '30px 0' }}>
                <Typography.Text style={{ fontSize: '13px' }}>开始对话后显示短期记忆</Typography.Text>
              </div>
            )}
          </Card>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Card 
            style={{ 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e5e6eb',
              borderRadius: '12px'
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tag color="green" size="small" style={{ marginRight: '6px' }}>
                  长期记忆
                </Tag>
              </div>
            }
            headStyle={{ 
              borderBottom: '1px solid #e5e6eb',
              padding: '10px 14px',
              backgroundColor: '#f7f8fa',
              flexShrink: 0
            }}
            bodyStyle={{ padding: '12px', overflow: 'auto', flex: 1, minHeight: 0 }}
          >
            {Object.keys(longTermMemory).length > 0 ? (
              <MemoryCard memory={longTermMemory} />
            ) : (
              <div style={{ textAlign: 'center', color: '#86909c', padding: '30px 0' }}>
                <Typography.Text style={{ fontSize: '13px' }}>暂无长期记忆数据</Typography.Text>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MemoryPlayground;
