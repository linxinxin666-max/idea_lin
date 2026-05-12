import { useState, useEffect } from 'react';
import { Steps, Button, Space, Popover, Toast, Modal } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { IconBulb } from '@douyinfe/semi-icons';
import { useCreateStore } from '../../stores/useCreateStore';
import { useAIAssistantStore } from '../../stores/useAIAssistantStore';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepDialogDesign } from './steps/StepDialogDesign';
import { StepSkillConfig } from './steps/StepSkillConfig';
import { StepPreview } from './steps/StepPreview';
import { StepAutoChat } from './steps/StepAutoChat';
import { StepBatchEvaluation } from './steps/StepBatchEvaluation';
import { AIAssistant } from '../../components/AIAssistant/AIAssistant';
import { BACKEND_AUTHORIZATION } from '../../utils/constants';
import './ScriptCreate.css';

const steps = [
  { title: '基础信息' },
  { title: '对话设计' },
  { title: '技能配置' },
  { title: '预览确认' },
  { title: '模拟对话' },
  { title: '批量评测' },
];

const stepValidators: ((form: any) => boolean)[] = [
  (f) => !!f.name && !!f.businessAction && !!f.identity && !!f.retentionLevel && !!f.dialogStyle, // 0 基础信息
  (f) => !!f.openingRemarks && f.coreContents.length > 0,  // 1 对话设计
  () => true,                                               // 2 技能配置
  () => true,                                               // 3 预览确认
  () => true,                                               // 4 自动对话
  () => true,                                               // 5 批量评测
];

export function ScriptCreate() {
  const { currentStep, visitedSteps, nextStep, prevStep, form, updateForm, setCurrentStep, resetForm, scriptId } = useCreateStore();
  const { setMode } = useAIAssistantStore();
  const navigate = useNavigate();
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const validatePreview = () => {
    const missingFields: string[] = [];
    if (!form.name?.trim()) missingFields.push('剧本名称');
    if (!form.businessAction?.trim()) missingFields.push('活动场景');
    if (!form.identity?.trim()) missingFields.push('身份');
    if (!form.retentionLevel?.trim()) missingFields.push('挽回程度');
    if (!form.dialogStyle?.trim()) missingFields.push('对话风格');
    if (!form.openingRemarks?.trim()) missingFields.push('开场白');
    if (!form.coreContents || form.coreContents.length === 0) {
      missingFields.push('核心外呼对话');
    } else {
      form.coreContents.forEach((content, index) => {
        if (!content.content?.trim()) missingFields.push(`对话 ${index + 1} 的内容`);
      });
    }
    if (!form.closingRemarks?.trim()) missingFields.push('结束语');
    return missingFields;
  };

  const generatePeText = () => {
    const parts: string[] = [];
    parts.push(`剧本名称: ${form.name}`);
    parts.push(`活动场景: ${form.businessAction}`);
    parts.push(`身份: ${form.identity}`);
    parts.push(`挽回程度: ${form.retentionLevel}`);
    parts.push(`对话风格: ${form.dialogStyle}`);
    parts.push('---');
    parts.push(`开场白: ${form.openingRemarks}`);
    parts.push('---');
    parts.push('核心内容:');
    form.coreContents.forEach((content, index) => {
      parts.push(`${index + 1}. [${content.type}] ${content.content}`);
      if (content.parseItems && content.parseItems.length > 0) {
        content.parseItems.forEach((parseItem: any, pi: number) => {
          parts.push(`   解析 ${pi + 1}: ${parseItem.question} - 标签: ${parseItem.tags.join(', ')}`);
        });
      }
    });
    parts.push('---');
    parts.push(`结束语: ${form.closingRemarks}`);
    parts.push('---');
    parts.push(`技能: ${form.skillType}`);
    return parts.join('\n');
  };

  const doEnterAutoChat = async () => {
    setIsCreating(true);
    try {
      const agentConfig = {
        businessBehavior: form.businessAction,
        identity: form.identity === '抖音官方客服' ? 'douyin_offical_customer_service' :
                  form.identity === '生活服务运营' ? 'life_service_operation' : 'normal_user',
        retentionLevel: form.retentionLevel === '轻度' ? 'mild' :
                        form.retentionLevel === '均衡' ? 'balanced' : 'severe',
        conversationStyle: form.dialogStyle === '温和' ? 'gentle' :
                           form.dialogStyle === '热情' ? 'enthusiastic' : 'natural',
        openingRemarks: form.openingRemarks,
        closingRemarks: form.closingRemarks,
        coreContents: form.coreContents,
        skillType: form.skillType,
        triggerIntents: form.triggerIntents,
        selectedKBIds: form.selectedKBIds,
        triggerIntentMode: form.triggerIntentMode,
        triggerContentIndex: form.triggerContentIndex,
        triggerParseValues: form.triggerParseValues,
        triggerContent: form.triggerContent,
      };
      let result;
      if (scriptId) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/update_flow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BACKEND_AUTHORIZATION },
          body: JSON.stringify({ id: scriptId, name: form.name, agent_config: agentConfig }),
        });
        result = await response.json();
        if (result.status_code === 0) {
          setCurrentStep(4);
        } else {
          Toast.error('更新剧本失败: ' + (result.msg || '未知错误'));
        }
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/create_flow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BACKEND_AUTHORIZATION },
          body: JSON.stringify({ pe_text: generatePeText(), name: form.name, creator: '当前用户', agent_config: agentConfig }),
        });
        result = await response.json();
        if (result.status_code === 0) {
          resetForm();
          navigate(`/self_help/agent_call/edit/${result.data.id}?step=auto_chat`);
        } else {
          Toast.error('创建剧本失败: ' + (result.msg || '未知错误'));
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      Toast.error(scriptId ? '更新剧本失败，请稍后重试' : '创建剧本失败，请稍后重试');
    }
    setIsCreating(false);
  };


  useEffect(() => {
    setMode('create');
    
    // 检查是否是首次进入
    const hasSeenGuide = localStorage.getItem('has_seen_ai_guide');
    if (!hasSeenGuide) {
      // 延迟一小段时间显示，让用户先看到页面全貌
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [setMode]);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('has_seen_ai_guide', 'true');
  };

  const handleFillForm = (fields: Record<string, any>) => {
    Object.entries(fields).forEach(([key, value]) => {
      updateForm(key as any, value);
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBasicInfo />;
      case 1:
        return <StepDialogDesign />;
      case 2:
        return <StepSkillConfig />;
      case 3:
        return <StepPreview />;
      case 4:
        return <StepAutoChat />;
      case 5:
        return <StepBatchEvaluation />;
      default:
        return <StepBasicInfo />;
    }
  };

  return (
    <div className="script-create">
      <div className="steps-sidebar">
        <Steps
          direction="vertical"
          current={currentStep}
          onChange={(step) => useCreateStore.getState().setCurrentStep(step)}
          style={{ width: '100%' }}
        >
          {steps.map((step, index) => {
            const wasVisited = visitedSteps.includes(index);
            const isIncomplete = wasVisited && index !== currentStep && !stepValidators[index]?.(form);
            const isCurrent = index === currentStep;
            const isFinished = !isCurrent && index < currentStep && !isIncomplete;

            const iconStyle = (bg: string, color: string) => ({
              display: 'inline-flex' as const,
              alignItems: 'center',
              justifyContent: 'center',
              width: 24, height: 24, borderRadius: '50%',
              background: bg, color,
              fontSize: 13, fontWeight: 700, lineHeight: 1,
              flexShrink: 0,
            });

            let icon;
            if (isIncomplete) {
              icon = <span style={iconStyle('#faad14', '#fff')}>?</span>;
            } else if (isFinished) {
              icon = <span style={iconStyle('#00b42a', '#fff')}>✓</span>;
            } else if (isCurrent) {
              icon = <span style={iconStyle('#0077fa', '#fff')}>{index + 1}</span>;
            } else {
              icon = <span style={iconStyle('#e0e0e0', '#666')}>{index + 1}</span>;
            }

            return (
              <Steps.Step
                key={index}
                title={step.title}
                style={{ cursor: 'pointer' }}
                icon={icon}
              />
            );
          })}
        </Steps>
      </div>
      
      <div className="form-area">
        {renderStep()}

        <div className="form-actions">
          <Space>
            {currentStep > 0 && (
              <Button onClick={prevStep}>← 上一步</Button>
            )}
            {currentStep < 5 && currentStep !== 3 && currentStep !== 4 && (
              <Button type="primary" onClick={nextStep}>下一步 →</Button>
            )}
            {currentStep === 3 && (
              <Button type="primary" loading={isCreating} onClick={() => {
                const missing = validatePreview();
                if (missing.length > 0) {
                  setMissingFields(missing);
                  return;
                }
                doEnterAutoChat();
              }}>下一步 →</Button>
            )}
            {currentStep === 4 && (
              <Button type="primary" onClick={() => setShowBatchConfirm(true)}>进入批量评测 →</Button>
            )}
            {currentStep === 5 && (
              <Button type="primary" onClick={() => navigate('/self_help/agent_call/list')}>完成创建</Button>
            )}
          </Space>
        </div>
      </div>
      
      <Popover
        visible={showGuide && !assistantCollapsed}
        content={
          <div className="ai-guide-popover">
            <div className="ai-guide-header">
              <IconBulb style={{ color: 'var(--semi-color-warning)', marginRight: 8 }} />
              <span className="ai-guide-title">智能创建剧本</span>
            </div>
            <div className="ai-guide-content">
              可以试试先和右侧的剧本AI助手对话哟，把材料发给它，让它帮你一键快速完成表单配置！
            </div>
            <div className="ai-guide-footer">
              <Button size="small" type="primary" onClick={handleCloseGuide}>知道了</Button>
            </div>
          </div>
        }
        trigger="custom"
        position="leftTop"
        showArrow
        arrowPointAtCenter
      >
        <div className="ai-assistant-wrapper">
          <AIAssistant
            mode="create"
            collapsed={assistantCollapsed}
            onToggleCollapse={() => {
              setAssistantCollapsed(!assistantCollapsed);
              if (showGuide) handleCloseGuide();
            }}
            onFillForm={handleFillForm}
          />
        </div>
      </Popover>

      <Modal
        title="请先完善以下内容"
        visible={missingFields.length > 0}
        onOk={() => setMissingFields([])}
        onCancel={() => setMissingFields([])}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="知道了"
      >
        {missingFields.join('、')}
      </Modal>

      <Modal
        title="确认发起大规模评测"
        visible={showBatchConfirm}
        onOk={() => { setShowBatchConfirm(false); nextStep(); }}
        onCancel={() => setShowBatchConfirm(false)}
        okText="确认"
        cancelText="取消"
      >
        点击确认后将触发大规模评测，确认吗？
      </Modal>
    </div>
  );
}
