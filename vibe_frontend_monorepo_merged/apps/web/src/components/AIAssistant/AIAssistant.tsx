import { useRef, useEffect, useState } from 'react';
import { Button, Input, Spin, Progress, Tag, TextArea } from '@douyinfe/semi-ui';
import { IconSend, IconChevronLeft, IconChevronRight, IconTick, IconClose } from '@douyinfe/semi-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAIAssistantStore } from '../../stores/useAIAssistantStore';
import type { ChatMessage, ExtractionMetadata, CompletenessMetadata, ModificationMetadata, FillMetadata, KBPreviewMetadata, KBProposalItem } from './types';
import './AIAssistant.css';

interface AIAssistantProps {
  mode: 'create' | 'edit';
  collapsed: boolean;
  onToggleCollapse: () => void;
  onFillForm?: (fields: Record<string, unknown>) => void;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface MessageItemProps {
  message: ChatMessage;
  onFillForm?: (fields: Record<string, unknown>) => void;
  pendingModifications?: any[] | null;
  applyModification?: () => void;
  clearPendingModification?: () => void;
}

const formatValue = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '(空)';
  if (Array.isArray(val)) return val.length === 0 ? '(空)' : JSON.stringify(val, null, 2);
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
};

// Render a field value in a human-readable way (no raw JSON)
const FieldValueRenderer = ({ fieldKey, value }: { fieldKey: string; value: unknown }) => {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--semi-color-text-3)' }}>(空)</span>;
  }

  // coreContents: array of dialog items
  if (fieldKey === 'coreContents' && Array.isArray(value)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {(value as any[]).map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.7)', borderRadius: 6,
            padding: '8px 10px', border: '1px solid rgba(0,180,42,0.15)',
          }}>
            <div style={{ fontSize: 11, color: '#00b42a', fontWeight: 600, marginBottom: 4 }}>
              内容 {i + 1}（{item.type}）
            </div>
            <div style={{ fontSize: 12, color: 'var(--semi-color-text-1)', lineHeight: 1.5, marginBottom: item.parseItems?.length ? 6 : 0 }}>
              {item.content}
            </div>
            {Array.isArray(item.parseItems) && item.parseItems.map((pi: any, j: number) => (
              <div key={j} style={{ fontSize: 11, color: 'var(--semi-color-text-2)', marginTop: 4 }}>
                <span style={{ fontWeight: 500 }}>解析：{pi.question}</span>
                <span style={{ marginLeft: 6 }}>
                  {(pi.tags as string[]).map((t, k) => (
                    <span key={k} style={{
                      display: 'inline-block', background: '#f0f5ff', color: '#3370ff',
                      borderRadius: 4, padding: '1px 6px', fontSize: 11, marginLeft: 4,
                    }}>{t}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Arrays of strings (triggerIntents, selectedKBIds, etc.)
  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: 'var(--semi-color-text-3)' }}>(空)</span>;
    return (
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(value as string[]).map((v, i) => (
          <span key={i} style={{
            display: 'inline-block', background: '#f0f5ff', color: '#3370ff',
            borderRadius: 4, padding: '1px 7px', fontSize: 12,
          }}>{String(v)}</span>
        ))}
      </span>
    );
  }

  return <span>{String(value)}</span>;
};

// Summary fields to always show in collapsed mode
const SUMMARY_FIELD_KEYS = new Set(['name', 'businessAction']);

const KBPreviewCard = ({ message }: { message: ChatMessage }) => {
  const metadata = message.metadata as KBPreviewMetadata;
  const [items, setItems] = useState<KBProposalItem[]>(metadata.items);
  const [result, setResult] = useState<{ kbName: string; isNew: boolean; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await useAIAssistantStore.getState().confirmKBOptimization(items, metadata.scriptName, metadata.selectedKBIds);
      setResult(res);
    } catch (e: any) {
      setResult({ kbName: '', isNew: false, error: e?.message || '写入失败，请稍后重试' });
    }
    setLoading(false);
  };

  if (result) {
    if (result.error) {
      return (
        <div className="kb-preview-card">
          <div style={{ color: '#f53f3f', fontWeight: 600, padding: '12px 0' }}>
            ❌ {result.error}
          </div>
        </div>
      );
    }
    return (
      <div className="kb-preview-card">
        <div style={{ color: '#00b42a', fontWeight: 600, padding: '8px 0 4px' }}>
          ✅ 已成功写入知识库
        </div>
        <div style={{ fontSize: 13, color: '#4e5969', marginTop: 4 }}>
          {result.isNew
            ? `新建知识库「${result.kbName}」，写入 ${items.length} 条话术`
            : `补充到知识库「${result.kbName}」，写入 ${items.length} 条话术`}
        </div>
      </div>
    );
  }

  return (
    <div className="kb-preview-card">
      <div style={{ fontWeight: 600, marginBottom: 12, color: '#1d2129' }}>{message.content}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, index) => (
          <div key={index} style={{
            border: '1px solid #e5e6eb',
            borderRadius: 8,
            padding: '10px 12px',
            background: '#fafafa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#86909c', fontWeight: 500 }}>条目 {index + 1}</span>
              <span
                style={{ fontSize: 12, color: '#f53f3f', cursor: 'pointer', padding: '0 4px' }}
                onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
              >
                删除
              </span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: '#86909c', marginBottom: 3 }}>触发词 / 用户问题</div>
              <TextArea
                value={item.trigger}
                onChange={(v) => setItems(prev => prev.map((it, i) => i === index ? { ...it, trigger: v } : it))}
                autosize
                style={{ fontSize: 13 }}
              />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: '#86909c', marginBottom: 3 }}>优化后客服回复</div>
              <TextArea
                value={item.reply}
                onChange={(v) => setItems(prev => prev.map((it, i) => i === index ? { ...it, reply: v } : it))}
                autosize
                style={{ fontSize: 13 }}
              />
            </div>
            {item.reason && (
              <div style={{ fontSize: 12, color: '#86909c', background: '#f0f5ff', borderRadius: 4, padding: '4px 8px', marginTop: 4 }}>
                💡 {item.reason}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button
          type="primary"
          size="small"
          loading={loading}
          disabled={items.length === 0}
          onClick={handleConfirm}
        >
          确认写入知识库
        </Button>
        <Button
          size="small"
          onClick={() => setConfirmed(true)}
        >
          取消
        </Button>
      </div>
    </div>
  );
};

const FillCard = ({ message, metadata }: { message: ChatMessage; metadata: FillMetadata }) => {
  const [expanded, setExpanded] = useState(false);
  const summaryActions = metadata.actions.filter(a => SUMMARY_FIELD_KEYS.has(a.fieldKey));
  const detailActions = metadata.actions.filter(a => !SUMMARY_FIELD_KEYS.has(a.fieldKey));
  const hasDetails = detailActions.length > 0;

  return (
    <div className="fill-card">
      <div className="fill-header">
        <IconTick style={{ color: 'var(--semi-color-success)' }} />
        <span>已自动填写</span>
        <span className="modification-count">{metadata.actions.length} 个字段</span>
      </div>
      <div className="fill-summary">{message.content}</div>

      {/* Always-visible summary fields */}
      {summaryActions.length > 0 && (
        <div className="fill-fields">
          {summaryActions.map((action, i) => (
            <div key={i} className="fill-field-item">
              <span className="fill-field-label">{action.fieldLabel}</span>
              <span className="fill-field-value">{String(action.newValue ?? '')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Show more / show less toggle */}
      {hasDetails && (
        <button
          className="fill-show-more"
          onClick={() => setExpanded(p => !p)}
        >
          {expanded ? '▲ 收起详情' : `▼ 展开详情（${detailActions.length} 个字段）`}
        </button>
      )}

      {/* Expanded detail fields */}
      {expanded && hasDetails && (
        <div className="fill-fields fill-fields-detail">
          {detailActions.map((action, i) => (
            <div key={i} className="fill-field-item fill-field-item-block">
              <span className="fill-field-label">{action.fieldLabel}</span>
              <div className="fill-field-value">
                <FieldValueRenderer fieldKey={action.fieldKey} value={action.newValue} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageItem = ({ message, onFillForm, pendingModifications, applyModification, clearPendingModification }: MessageItemProps) => {
  const renderContent = () => {
    if (message.contentType === 'extraction' && message.metadata) {
      const metadata = message.metadata as ExtractionMetadata;
      return (
        <div className="extraction-card">
          <div className="extraction-header">
            <IconTick style={{ color: 'var(--semi-color-success)' }} />
            <span>提取结果</span>
          </div>
          <div className="extraction-fields">
            {metadata.extractedFields.map((field, index) => (
              <div key={index} className="field-item">
                <div className="field-label">{field.fieldLabel}</div>
                <div className="field-value">
                  <span>{String(field.value)}</span>
                  <Tag size="small" color="blue">
                    {Math.round(field.confidence * 100)}%
                  </Tag>
                </div>
              </div>
            ))}
          </div>
          {metadata.canAutoFill && onFillForm && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                const formData: Record<string, unknown> = {};
                metadata.extractedFields.forEach(field => {
                  formData[field.fieldKey] = field.value;
                });
                onFillForm(formData);
                useAIAssistantStore.getState().applyExtraction(metadata);
              }}
              style={{ marginTop: 12 }}
            >
              一键填充到表单
            </Button>
          )}
        </div>
      );
    }

    if (message.contentType === 'fill' && message.metadata) {
      const metadata = message.metadata as FillMetadata;
      return <FillCard message={message} metadata={metadata} />;
    }

    if (message.contentType === 'completeness' && message.metadata) {
      const metadata = message.metadata as CompletenessMetadata;
      return (
        <div className="completeness-card">
          <div className="completeness-header">
            <span>完善度检查</span>
            <Progress
              percent={metadata.overallProgress}
              style={{ width: 100 }}
              size="small"
            />
          </div>
          <div className="sections-list">
            {metadata.sections.map((section, index) => (
              <div key={index} className="section-item">
                <div className="section-status">
                  {section.status === 'complete' && <IconTick style={{ color: 'var(--semi-color-success)' }} />}
                  {section.status === 'incomplete' && <IconClose style={{ color: 'var(--semi-color-danger)' }} />}
                  {section.status === 'warning' && <span style={{ color: 'var(--semi-color-warning)' }}>⚠️</span>}
                </div>
                <div className="section-name">{section.name}</div>
                {section.message && (
                  <span className="section-message">{section.message}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (message.contentType === 'modification' && message.metadata && pendingModifications && pendingModifications.length > 0) {
      const metadata = message.metadata as ModificationMetadata;
      const actions = metadata.actions;
      return (
        <div className="modification-card">
          <div className="modification-header">
            <span>确认修改</span>
            {actions.length > 1 && (
              <span className="modification-count">{actions.length} 个字段</span>
            )}
          </div>
          <div className="modification-content">
            <p>{message.content}</p>
            <div className="modification-fields-list">
              {actions.map((action, index) => (
                <div key={index} className="modification-field-row">
                  <div className="modification-field-name">{action.fieldLabel}</div>
                  <div className="modification-compare">
                    <div className="compare-item old">
                      <div className="compare-label">当前</div>
                      <div className="compare-value">{formatValue(action.oldValue)}</div>
                    </div>
                    <div className="compare-arrow">→</div>
                    <div className="compare-item new">
                      <div className="compare-label">修改为</div>
                      <div className="compare-value">{formatValue(action.newValue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modification-actions">
              <Button
                size="small"
                onClick={clearPendingModification}
              >
                取消
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={applyModification}
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (message.contentType === 'kb_preview' && message.metadata) {
      return <KBPreviewCard message={message} />;
    }

    return (
      <div className="text-content markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-header">
        <span className="message-role">
          {message.role === 'user' ? '你' : '剧本AI助手'}
        </span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="message-body">
        {renderContent()}
      </div>
    </div>
  );
};

export function AIAssistant({ mode, collapsed, onToggleCollapse, onFillForm }: AIAssistantProps) {
  const {
    messages,
    inputText,
    setInputText,
    state,
    sendMessage,
    completenessData,
    pendingModifications,
    applyModification,
    clearPendingModification,
  } = useAIAssistantStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusInput = () => {
    setTimeout(() => {
      if (inputRef.current) {
        if (inputRef.current.focus) {
          inputRef.current.focus();
        } else if (inputRef.current.input) {
          inputRef.current.input.focus();
        } else if (inputRef.current.querySelector) {
          const inputElement = inputRef.current.querySelector('input, textarea');
          inputElement?.focus();
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (state === 'idle') {
      focusInput();
    }
  }, [state]);

  if (collapsed) {
    return (
      <div className="ai-assistant-toggle-collapsed" onClick={onToggleCollapse}>
        <IconChevronLeft />
      </div>
    );
  }

  return (
    <div className="ai-assistant">
      <div className="ai-assistant-toggle" onClick={onToggleCollapse}>
        <IconChevronRight />
      </div>
      
      <div className="assistant-header">
        <span className="assistant-title">剧本AI助手</span>
      </div>

      <div className="ai-assistant-inner">
        {mode === 'edit' && completenessData && (
          <div className="completeness-panel">
            <MessageItem
              message={{
                id: 'completeness',
                role: 'assistant',
                contentType: 'completeness',
                content: '',
                timestamp: Date.now(),
                metadata: completenessData,
              }}
              onFillForm={onFillForm}
            />
          </div>
        )}

        <div className="messages-container">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onFillForm={onFillForm}
              pendingModifications={pendingModifications}
              applyModification={applyModification}
              clearPendingModification={clearPendingModification}
            />
          ))}
          {state === 'analyzing' && (
            <div className="analyzing-indicator">
              <Spin />
              <span>AI 正在分析中...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={setInputText}
            placeholder="输入消息..."
            onKeyDown={handleKeyDown}
            disabled={state === 'analyzing'}
          />
          <Button
            type="primary"
            icon={<IconSend />}
            onClick={handleSend}
            loading={state === 'analyzing'}
            disabled={!inputText.trim()}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
