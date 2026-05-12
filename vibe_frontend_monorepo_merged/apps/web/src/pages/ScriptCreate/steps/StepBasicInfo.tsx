import { useState } from 'react';
import { Input, Select, Button, Modal, Toast } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';
import { useCreateStore } from '../../../stores/useCreateStore';
import { BUSINESS_ACTION_OPTIONS, RETENTION_LEVEL_OPTIONS, DIALOG_STYLE_OPTIONS, IDENTITY_OPTIONS } from '../../../utils/constants';
import './StepBasicInfo.css';

interface Option {
  value: string;
  label: string;
  description?: string;
}

function RadioCardGroup({
  options,
  value,
  onChange,
}: {
  options: readonly Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="radio-card-group-wrap">
      <div className="radio-card-group">
        {options.map((item) => (
          <div
            key={item.value}
            className={`radio-card ${value === item.value ? 'selected' : ''}`}
            onClick={() => onChange(item.value)}
          >
            <div className="radio-card-label">{item.label}</div>
            {value === item.value && <div className="radio-card-check">✓</div>}
          </div>
        ))}
      </div>
      {selected?.description && (
        <div className="radio-card-desc">{selected.description}</div>
      )}
    </div>
  );
}

export function StepBasicInfo() {
  const { form, updateForm } = useCreateStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (!newOption.trim()) {
      Toast.error('请输入活动场景名称');
      return;
    }
    Toast.success(`已添加: ${newOption}`);
    setNewOption('');
    setShowAddModal(false);
  };

  return (
    <div className="step-basic-info">
      <h2 className="step-title">基础信息</h2>
      <p className="step-desc">配置剧本的基本信息与 AI 角色</p>

      <div className="form-section">
        <div className="form-item">
          <label className="form-label">
            剧本名称 <span className="required">*</span>
          </label>
          <Input
            maxLength={50}
            placeholder="请输入剧本名称"
            value={form.name}
            onChange={(value) => updateForm('name', value)}
          />
        </div>

        <div className="form-item">
          <label className="form-label">
            活动场景 <span className="required">*</span>
          </label>
          <div className="select-with-add">
            <Select
              placeholder="请选择活动场景"
              value={form.businessAction}
              onChange={(value) => updateForm('businessAction', value as string)}
              style={{ width: 200 }}
            >
              {BUSINESS_ACTION_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
            <Button
              icon={<IconPlus />}
              onClick={() => setShowAddModal(true)}
              title="新增活动场景"
            />
          </div>
        </div>

        <div className="form-item">
          <label className="form-label">身份配置 <span className="required">*</span></label>
          <RadioCardGroup
            options={IDENTITY_OPTIONS}
            value={form.identity}
            onChange={(v) => updateForm('identity', v as typeof form.identity)}
          />
        </div>

        <div className="form-item">
          <label className="form-label">挽回程度 <span className="required">*</span></label>
          <RadioCardGroup
            options={RETENTION_LEVEL_OPTIONS}
            value={form.retentionLevel}
            onChange={(v) => updateForm('retentionLevel', v as typeof form.retentionLevel)}
          />
        </div>

        <div className="form-item">
          <label className="form-label">对话风格 <span className="required">*</span></label>
          <RadioCardGroup
            options={DIALOG_STYLE_OPTIONS}
            value={form.dialogStyle}
            onChange={(v) => updateForm('dialogStyle', v as typeof form.dialogStyle)}
          />
        </div>
      </div>

      <Modal
        title="新增活动场景"
        visible={showAddModal}
        onOk={handleAddOption}
        onCancel={() => setShowAddModal(false)}
      >
        <Input
          placeholder="请输入活动场景名称"
          value={newOption}
          onChange={setNewOption}
          maxLength={20}
        />
      </Modal>
    </div>
  );
}
