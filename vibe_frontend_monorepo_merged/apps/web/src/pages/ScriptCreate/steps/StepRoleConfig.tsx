import { useCreateStore } from '../../../stores/useCreateStore';
import { RETENTION_LEVEL_OPTIONS, DIALOG_STYLE_OPTIONS, IDENTITY_OPTIONS } from '../../../utils/constants';
import './StepRoleConfig.css';

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

export function StepRoleConfig() {
  const { form, updateForm } = useCreateStore();

  return (
    <div className="step-role-config">
      <h2 className="step-title">角色配置</h2>
      <p className="step-desc">配置 AI 角色的身份、挽回程度、对话风格</p>

      <div className="form-section">
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
    </div>
  );
}
