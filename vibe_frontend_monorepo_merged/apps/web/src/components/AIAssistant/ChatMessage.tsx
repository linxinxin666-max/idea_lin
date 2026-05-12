import { Button, Tag, Progress, Collapse, IconCheck, IconClose, IconChevronRight } from '@douyinfe/semi-icons';
import type { ChatMessage, MessageContentType } from './types';

interface ChatMessageItemProps {
  message: ChatMessage;
  onApplyExtraction?: (metadata: ExtractionMetadata) => void;
}

const contentTypeConfig: Record<MessageContentType, { icon: string; color: string; label: string }> = {
  'text': { icon: '💬', color: 'blue', label: '文本' },
  'file': { icon: '📎', color: 'orange', label: '文件' },
  'image': { icon: '🖼️', color: 'purple', label: '图片' },
  'extraction': { icon: '✨', color: 'green', label: '提取结果' },
  'suggestion': { icon: '💡', color: 'cyan', label: '建议' },
  'completeness': { icon: '📊', color: 'amber', label: '完善度' },
  'error': { icon: '❌', color: 'red', label: '错误' },
  'reasoning': { icon: '🧠', color: 'grey', label: '模型分析过程' },
};

export function ChatMessageItem({ message, onApplyExtraction }: ChatMessageItemProps) {
  const config = contentTypeConfig[message.contentType] || contentTypeConfig.text;
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderTextContent = () => {
    return (
      <div className="text-content">
        {message.content}
      </div>
    );
  };

  const renderContent = () => {
    switch (message.contentType) {
      case 'reasoning':
        return (
          <div className="reasoning-message">
            <div className="reasoning-title">模型分析过程</div>
            <div className="reasoning-block">{message.content}</div>
          </div>
        );
      case 'extraction':
        return (
          <div className="extraction-card">
            <div className="extraction-header">
              <IconCheck style={{ color: 'var(--semi-color-success)' }} />
              <span>提取结果</span>
            </div>
            <div className="extraction-fields">
              {(message.metadata as ExtractionMetadata).extractedFields.map((field, index) => (
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
            {(message.metadata as ExtractionMetadata).canAutoFill && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => onApplyExtraction?.(message.metadata as ExtractionMetadata)}
                style={{ marginTop: 12 }}
              >
                一键填充到表单
              </Button>
            )}
          </div>
        );
      case 'completeness':
        return (
          <div className="completeness-card">
            <div className="completeness-header">
              <span>完善度检查</span>
              <span className="progress-text">
                {(message.metadata as CompletenessMetadata).overallProgress}%
              </span>
            </div>
            <Progress
              percent={(message.metadata as CompletenessMetadata).overallProgress}
              showInfo
              style={{ marginBottom: 12 }}
            />
            <div className="sections-list">
              {(message.metadata as CompletenessMetadata).sections.map((section, index) => (
                <div key={index} className={`section-item ${section.status}`}>
                  <div className="section-status">
                    {section.status === 'complete' && <IconCheck style={{ color: 'var(--semi-color-success)' }} />}
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
      default:
        return renderTextContent();
    }
  };

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-header">
        <span className="message-role">
          {message.role === 'user' ? '你' : 'AI 助手'}
        </span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="message-body">
        {renderContent()}
      </div>
    </div>
  );
}
