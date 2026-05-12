import { useState } from 'react';
import {
  Modal, Button, Radio, RadioGroup,
  Checkbox, CheckboxGroup, Select, Input, Upload,
} from '@douyinfe/semi-ui';
import { IconSend } from '@douyinfe/semi-icons';
import type { OnlineConfig, VoiceProvider, ScheduleType, BaseModel, CallListSource } from '../../types/script';
import { MOCK_BUSINESS_LINES } from '../../stores/useOnlineStatusStore';
import { TimeSlotPicker } from '../TimeSlotPicker/TimeSlotPicker';
import { chatCompletions } from '../../services/arkApi';
import './OnlineConfigModal.css';

const WEEKDAYS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const EMPTY_SLOTS = new Array(48).fill(false);

const SCHEDULE_PARSE_PROMPT = `你是一个日程解析助手，将用户对外呼时间安排的自然语言描述转换为结构化JSON。

输出格式（只输出JSON，不要其他文字）：
{
  "scheduleType": "daily" | "once",
  "weekdays": number[],  // 1=周一...7=周日，scheduleType为daily时有效
  "timeSlots": boolean[] // 长度48，每位对应半小时，index 0=00:00, 1=00:30 ... 47=23:30
}

例：用户说"工作日早上9点到11点半"
=> { "scheduleType": "daily", "weekdays": [1,2,3,4,5], "timeSlots": [false×18, true×5, false×25] }`;

interface Props {
  visible: boolean;
  onOk: (config: OnlineConfig) => void;
  onCancel: () => void;
}

export function OnlineConfigModal({ visible, onOk, onCancel }: Props) {
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>('tianrun');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timeSlots, setTimeSlots] = useState<boolean[]>([...EMPTY_SLOTS]);
  const [naturalDesc, setNaturalDesc] = useState('');
  const [parsing, setParsing] = useState(false);
  const [baseModel, setBaseModel] = useState<BaseModel>('seed-1.6');
  const [businessLine, setBusinessLine] = useState('');
  const [callListSource, setCallListSource] = useState<CallListSource>('upload');
  const [callListValue, setCallListValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleParseSchedule = async () => {
    if (!naturalDesc.trim()) {
      setFormError('请先输入时间描述后再解析');
      return;
    }
    setFormError('');
    setParsing(true);
    try {
      const resp = await chatCompletions([
        { role: 'system', content: SCHEDULE_PARSE_PROMPT },
        { role: 'user', content: naturalDesc },
      ]);
      const jsonMatch = resp.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('解析失败');
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.scheduleType) setScheduleType(parsed.scheduleType);
      if (Array.isArray(parsed.weekdays)) setWeekdays(parsed.weekdays);
      if (Array.isArray(parsed.timeSlots) && parsed.timeSlots.length === 48) {
        setTimeSlots(parsed.timeSlots);
      }
      setFormError('');
    } catch {
      setFormError('解析失败，请手动设置');
    } finally {
      setParsing(false);
    }
  };

  const handleOk = () => {
    if (!businessLine) { setFormError('请选择业务线'); return; }
    if (scheduleType === 'daily' && weekdays.length === 0) { setFormError('请选择至少一个可外呼星期'); return; }
    if (!timeSlots.some(Boolean)) { setFormError('请选择至少一个外呼时间段'); return; }
    if (!callListValue.trim() && callListSource !== 'upload') { setFormError('请填写任务流ID'); return; }
    setFormError('');

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onOk({
        voiceProvider,
        scheduleType,
        weekdays,
        timeSlots,
        naturalLanguageDesc: naturalDesc,
        baseModel,
        businessLine,
        callListSource,
        callListValue,
      });
    }, 600);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      title="上线配置"
      visible={visible}
      onCancel={handleCancel}
      width={600}
      centered
      bodyStyle={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}
      footer={
        <div className="ocm-footer">
          {formError && <span className="ocm-error">{formError}</span>}
          <div className="ocm-footer-btns">
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" loading={submitting} onClick={handleOk}>确认上线</Button>
          </div>
        </div>
      }
    >
      <div className="ocm-form">
        {/* 语音能力供应商 */}
        <div className="ocm-field">
          <label className="ocm-label ocm-required">语音能力供应商</label>
          <RadioGroup value={voiceProvider} onChange={(e) => setVoiceProvider(e.target.value as VoiceProvider)} direction="horizontal">
            <Radio value="tianrun">天润</Radio>
            <Radio value="ailab">AILAB</Radio>
          </RadioGroup>
        </div>

        {/* 基座模型 */}
        <div className="ocm-field">
          <label className="ocm-label ocm-required">基座模型</label>
          <Select value={baseModel} onChange={(v) => setBaseModel(v as BaseModel)} style={{ width: 200 }}>
            <Select.Option value="seed-1.6">seed-1.6</Select.Option>
            <Select.Option value="seed-1.6-flash">seed-1.6-flash</Select.Option>
            <Select.Option value="seed-1.8">seed-1.8</Select.Option>
          </Select>
        </div>

        {/* 业务线 */}
        <div className="ocm-field">
          <label className="ocm-label ocm-required">业务线</label>
          <Select value={businessLine} onChange={(v) => setBusinessLine(v as string)} placeholder="请选择业务线" style={{ width: 200 }}>
            {MOCK_BUSINESS_LINES.map((bl) => (
              <Select.Option key={bl} value={bl}>{bl}</Select.Option>
            ))}
          </Select>
        </div>

        <div className="ocm-divider" />

        {/* 调度周期 */}
        <div className="ocm-field">
          <label className="ocm-label ocm-required">调度周期</label>
          <RadioGroup value={scheduleType} onChange={(e) => setScheduleType(e.target.value as ScheduleType)} direction="horizontal">
            <Radio value="daily">每周</Radio>
            <Radio value="once">一次性</Radio>
          </RadioGroup>
        </div>

        {/* 可外呼星期（天级时显示） */}
        {scheduleType === 'daily' && (
          <div className="ocm-field">
            <label className="ocm-label ocm-required">可外呼星期</label>
            <CheckboxGroup
              value={weekdays}
              onChange={(vals) => setWeekdays(vals as number[])}
              direction="horizontal"
            >
              {WEEKDAYS.map((d) => (
                <Checkbox key={d.value} value={d.value}>{d.label}</Checkbox>
              ))}
            </CheckboxGroup>
          </div>
        )}

        {/* 自然语言描述 + AI 解析 */}
        <div className="ocm-field">
          <label className="ocm-label">自然语言描述调度（可选）</label>
          <div className="ocm-nl-row">
            <Input
              value={naturalDesc}
              onChange={setNaturalDesc}
              placeholder='例如：工作日早上9点到11点，下午2点到5点半'
              style={{ flex: 1 }}
            />
            <Button
              icon={<IconSend />}
              loading={parsing}
              onClick={handleParseSchedule}
              type="primary"
              theme="light"
            >
              AI 解析
            </Button>
          </div>
        </div>

        {/* 时间段格子选择 */}
        <div className="ocm-field">
          <label className="ocm-label ocm-required">每日外呼时间段</label>
          <TimeSlotPicker value={timeSlots} onChange={setTimeSlots} />
        </div>

        <div className="ocm-divider" />

        {/* 外呼名单 */}
        <div className="ocm-field">
          <label className="ocm-label ocm-required">外呼名单来源</label>
          <RadioGroup value={callListSource} onChange={(e) => setCallListSource(e.target.value as CallListSource)} direction="horizontal">
            <Radio value="upload">上传文件</Radio>
            <Radio value="dmp">DMP圈选</Radio>
            <Radio value="tqs">TQS圈选</Radio>
          </RadioGroup>
        </div>

        {callListSource === 'upload' && (
          <div className="ocm-field">
            <label className="ocm-label ocm-required">上传名单文件</label>
            <Upload
              action="#"
              accept=".csv,.xlsx,.xls"
              draggable
              dragMainText="点击或拖拽上传外呼名单"
              dragSubText="支持 .csv / .xlsx 格式"
              onChange={({ fileList }) => {
                if (fileList.length > 0) setCallListValue(fileList[fileList.length - 1].name ?? '');
              }}
            />
          </div>
        )}

        {(callListSource === 'dmp' || callListSource === 'tqs') && (
          <div className="ocm-field">
            <label className="ocm-label ocm-required">{callListSource === 'dmp' ? 'DMP' : 'TQS'} 任务流ID</label>
            <Input
              value={callListValue}
              onChange={setCallListValue}
              placeholder={`请输入${callListSource === 'dmp' ? 'DMP' : 'TQS'}任务流ID`}
              style={{ width: 300 }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
