import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Steps, Button, Space, Popover, Toast, Spin } from '@douyinfe/semi-ui';
import { IconBulb } from '@douyinfe/semi-icons';
import { useCreateStore } from '../../stores/useCreateStore';
import { useAIAssistantStore } from '../../stores/useAIAssistantStore';
import { StepBasicInfo } from '../ScriptCreate/steps/StepBasicInfo';
import { StepDialogDesign } from '../ScriptCreate/steps/StepDialogDesign';
import { StepSkillConfig } from '../ScriptCreate/steps/StepSkillConfig';
import { StepPreview } from '../ScriptCreate/steps/StepPreview';
import { StepAutoChat } from '../ScriptCreate/steps/StepAutoChat';
import { StepBatchEvaluation } from '../ScriptCreate/steps/StepBatchEvaluation';
import { AIAssistant } from '../../components/AIAssistant/AIAssistant';
import type { FlowDetailResponse } from '../../types/script';
import { BACKEND_AUTHORIZATION } from '../../utils/constants';
import './ScriptEdit.css';

const steps = [
  { title: '基础信息' },
  { title: '对话设计' },
  { title: '技能配置' },
  { title: '预览确认' },
  { title: '模拟对话' },
  { title: '批量评测' },
];

const identityMap: Record<string, string> = {
  'douyin_offical_customer_service': '抖音官方客服',
  'life_service_operation': '生活服务运营',
  'normal_user': '普通用户',
};

const retentionLevelMap: Record<string, string> = {
  'mild': '轻度',
  'balanced': '均衡',
  'severe': '重度',
};

const conversationStyleMap: Record<string, string> = {
  'gentle': '温和',
  'enthusiastic': '热情',
  'natural': '自然',
};

// 后端返回的是英文 key，直接原样使用即可，这里保留做显示备用
const _skillTypeDisplayMap: Record<string, string> = {
  'none': '不需要技能',
  'sms': '发送短信消息',
  'wecom': '添加企业微信',
  'wechat_msg': '发送微信消息',
};

export function ScriptEdit() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentStep, nextStep, prevStep, form, updateForm, setCurrentStep, resetForm, setIsSubmitting, setContentMode, addCoreContent, removeCoreContent, updateCoreContent, setScriptId } = useCreateStore();
  const { setMode, pendingExpand, setPendingExpand } = useAIAssistantStore();
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    setMode('edit');
  }, [setMode]);

  useEffect(() => {
    if (pendingExpand) {
      setAssistantCollapsed(false);
      setPendingExpand(false);
    }
  }, [pendingExpand, setPendingExpand]);

  useEffect(() => {
    if (!id || dataLoaded) {
      return;
    }

    const fetchScript = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/get_flow_detail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: BACKEND_AUTHORIZATION,
          },
          body: JSON.stringify({
            id: parseInt(id || '0'),
          }),
        });
        const data: FlowDetailResponse = await response.json();
        
        console.log('get_flow_detail 返回数据:', data);
        
        if (data.status_code === 0) {
          const store = useCreateStore.getState();
          
          setScriptId(parseInt(id || '0'));
          
          const config = data.data.agent_call_config || {};
          
          console.log('config:', config);
          console.log('config.coreContents:', config.coreContents);
          
          useCreateStore.setState((state) => {
            const coreContentsFromConfig = config.coreContents || config.core_contents || [];
            const mappedCoreContents = coreContentsFromConfig.map((item: any) => ({
              content: item.content || '',
              type: item.type || '信息通知类',
              parseItems: (item.parseItems || item.parse_items || []).map((pi: any) => ({
                question: pi.question || '',
                tags: pi.tags || []
              }))
            }));
            
            console.log('mappedCoreContents:', mappedCoreContents);
          
            return {
              form: {
                ...state.form,
                name: data.data.name || '',
                businessAction: config.businessBehavior || '',
                identity: identityMap[config.identity] || config.identity || state.form.identity,
                retentionLevel: retentionLevelMap[config.retentionLevel] || config.retentionLevel || state.form.retentionLevel,
                dialogStyle: conversationStyleMap[config.conversationStyle] || config.conversationStyle || state.form.dialogStyle,
                openingRemarks: config.openingRemarks || '',
                openingRemarksMode: 'manual',
                closingRemarks: config.closingRemarks || '',
                closingRemarksMode: 'manual',
                skillType: config.skillType || state.form.skillType,
                triggerIntents: config.triggerIntents || [],
                selectedKBIds: config.selectedKBIds || [],
                triggerIntentMode: config.triggerIntentMode || 'all',
                triggerContentIndex: config.triggerContentIndex ?? null,
                triggerParseValues: config.triggerParseValues || [],
                triggerContent: config.triggerContent || '',
                coreContents: mappedCoreContents,
                contentMode: 'manual'
              },
              currentStep: searchParams.get('step') === 'auto_chat' ? 4 : 3
            };
          });
          
          setDataLoaded(true);
        } else {
          Toast.error('获取剧本详情失败: ' + data.msg);
        }
      } catch (e) {
        console.error('获取剧本详情失败:', e);
        Toast.error('获取剧本详情失败');
      }
      
      setLoading(false);
    };
    
    fetchScript();
  }, [id, searchParams]);

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

  if (loading) {
    return (
      <div className="script-edit-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="script-create">
      <div className="steps-sidebar">
        <Steps
          direction="vertical"
          current={currentStep}
          onChange={(step) => useCreateStore.getState().setCurrentStep(step)}
          style={{ width: '100%' }}
        >
          {steps.map((step, index) => (
            <Steps.Step
              key={index}
              title={step.title}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Steps>
      </div>
      
      <div className="form-area">
        {renderStep()}
        
        <div className="form-actions">
          <Space>
            {currentStep > 0 && (
              <Button onClick={prevStep}>← 上一步</Button>
            )}
            {currentStep < 5 && currentStep !== 3 && (
              <Button type="primary" onClick={nextStep}>下一步 →</Button>
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
              <span className="ai-guide-title">智能编辑剧本</span>
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
            mode="edit"
            collapsed={assistantCollapsed}
            onToggleCollapse={() => {
              setAssistantCollapsed(!assistantCollapsed);
              if (showGuide) handleCloseGuide();
            }}
            onFillForm={handleFillForm}
          />
        </div>
      </Popover>
    </div>
  );
}
