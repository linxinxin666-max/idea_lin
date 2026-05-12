import { useEffect, useState, useRef } from 'react';
import { Select, Checkbox, CheckboxGroup, TextArea, RadioGroup, Radio, Tag, Empty, Button, Modal, Form, Toast } from '@douyinfe/semi-ui';
import { IconAlertTriangle, IconPlus } from '@douyinfe/semi-icons';
import type { BusinessAction } from '../../../types/script';
import { useCreateStore } from '../../../stores/useCreateStore';
import { SKILL_TYPE_OPTIONS } from '../../../utils/constants';
import * as kbService from '../../../services/knowledgeService';
import type { KnowledgeBase, KnowledgeTheme } from '../../../types/knowledge';
import './StepSkillConfig.css';

function convertKnowledgeThemeToKB(theme: KnowledgeTheme): KnowledgeBase {
  return {
    id: theme.theme_id,
    name: theme.theme_name,
    businessActions: [] as BusinessAction[],
    description: theme.theme_desc,
    itemCount: theme.theme_docs_cnt,
    createdBy: theme.theme_creator,
    createdAt: theme.create_time,
    updatedAt: theme.update_time,
  };
}

interface CreateFormValues {
  businessAction: string;
  description?: string;
}

export function StepSkillConfig() {
  const { form, updateForm } = useCreateStore();
  const coreContents = form.coreContents;
  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const formApi = useRef<{ validate: () => Promise<CreateFormValues> } | null>(null);

  useEffect(() => {
    loadKBList();
  }, []);

  const toggleKB = (id: string) => {
    const current = form.selectedKBIds ?? [];
    if (current.includes(id)) {
      updateForm('selectedKBIds' as any, current.filter((x: string) => x !== id));
    } else {
      updateForm('selectedKBIds' as any, [...current, id]);
    }
  };

  const loadKBList = () => {
    kbService.getAllKnowledgeTheme().then((res) => {
      if (res.data.status_code === 0) {
        setKbList(res.data.data.map(convertKnowledgeThemeToKB));
      }
    }).catch(() => {});
  };

  const handleCreate = async () => {
    if (!formApi.current) return;
    try {
      const values = await formApi.current.validate();
      const scene = values.businessAction.trim();
      const existingScenes = new Set(kbList.map((kb) => kb.name));
      if (existingScenes.has(scene)) {
        Toast.error(`活动场景"${scene}"已被其他知识库使用`);
        return;
      }
      setCreating(true);
      let newId = 'kb-new';
      const res = await kbService.createKB({ name: scene, businessActions: [scene as BusinessAction] });
      newId = res.data.id;
      Toast.success('创建成功');
      setCreateVisible(false);
      loadKBList();
      toggleKB(newId);
    } catch {
      // validation error or API error
    } finally {
      setCreating(false);
    }
  };

  // 只有一个内容时，自动选中内容1并勾选第一个解析值
  useEffect(() => {
    if (
      form.triggerIntentMode === 'by_parse_value' &&
      coreContents.length === 1 &&
      form.triggerContentIndex === null
    ) {
      updateForm('triggerContentIndex' as any, 0);
      const firstTag = coreContents[0]?.parseItems?.[0]?.tags?.[0];
      if (firstTag) {
        updateForm('triggerParseValues' as any, [firstTag]);
      }
    }
  }, [form.triggerIntentMode, coreContents.length]);

  // 当前选中内容项的解析值列表
  const selectedContent = form.triggerContentIndex !== null
    ? coreContents[form.triggerContentIndex]
    : null;
  const availableParseValues = selectedContent?.parseItems?.flatMap(p => p.tags) ?? [];

  const handleContentIndexChange = (val: number | string) => {
    updateForm('triggerContentIndex' as any, val === 'all' ? null : Number(val));
    updateForm('triggerParseValues' as any, []);
  };

  const handleParseValuesChange = (vals: string[]) => {
    updateForm('triggerParseValues' as any, vals);
  };

  return (
    <div className="step-skill-config">
      <h2 className="step-title">技能配置</h2>
      <p className="step-desc">配置技能类型与触发意向</p>

      <div className="form-section">
        <div className="form-item">
          <label className="form-label">技能类型</label>
          <div className="skill-grid">
            {SKILL_TYPE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`skill-card ${form.skillType === option.value ? 'selected' : ''}`}
                onClick={() => updateForm('skillType', option.value as typeof form.skillType)}
              >
                <div className="skill-label">{option.label}</div>
                {form.skillType === option.value && (
                  <div className="skill-card-check">✓</div>
                )}
              </div>
            ))}
            <div className="skill-card skill-card-disabled">
              <div className="skill-label">自定义技能</div>
            </div>
          </div>
        </div>

        {form.skillType !== 'none' && (
          <>
            <div className="form-item">
              <label className="form-label">触发意向</label>

              {/* 模式选择 */}
              <RadioGroup
                direction="vertical"
                value={form.triggerIntentMode as string}
                onChange={(e) => {
                  updateForm('triggerIntentMode' as any, e.target.value);
                  updateForm('triggerContentIndex' as any, null);
                  updateForm('triggerParseValues' as any, []);
                }}
                style={{ marginBottom: 16, gap: 8 }}
              >
                <Radio value="all">全部</Radio>
                <Radio value="by_parse_value">按对话解析值触发</Radio>
              </RadioGroup>

              {/* 按对话解析值触发时展开详细选项 */}
              {form.triggerIntentMode === 'by_parse_value' && (
                <div style={{ paddingLeft: 24, borderLeft: '2px solid var(--semi-color-border)', marginLeft: 8 }}>
                {coreContents.length === 0 ? (
                  <p className="hint-text hint-text-warning"><IconAlertTriangle style={{ marginRight: 6, verticalAlign: 'middle' }} />请先在「对话设计」中添加核心外呼对话</p>
                ) : (
                  <>
                    {/* 第一行：选择内容序号 */}
                    <div className="trigger-intent-row">
                      <span className="trigger-intent-label">选择对话</span>
                      <Select
                        value={form.triggerContentIndex === null ? '' : String(form.triggerContentIndex)}
                        onChange={handleContentIndexChange}
                        placeholder="选择对话"
                        style={{ width: 220, fontSize: 13 }}
                        size="small"
                        className="dialog-select-small"
                      >
                        {coreContents.map((c, i) => (
                          <Select.Option key={i} value={String(i)}>
                            对话 {i + 1}（{c.type}）
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    {/* 第二行：选择解析值（多选） */}
                    {form.triggerContentIndex !== null && (
                      <div className="trigger-intent-row" style={{ marginTop: 12 }}>
                        <span className="trigger-intent-label">解析值</span>
                        <CheckboxGroup
                          value={form.triggerParseValues as string[]}
                          onChange={handleParseValuesChange}
                          direction="horizontal"
                        >
                          {availableParseValues.map((val, i) => (
                            <Checkbox key={i} value={val}>{val}</Checkbox>
                          ))}
                        </CheckboxGroup>
                      </div>
                    )}
                  </>
                )
                }
                </div>
              )}
            </div>

            {form.skillType !== 'wecom' && <div className="form-item">
              <label className="form-label">消息内容</label>
              <TextArea
                key={form.triggerContent ? 'filled' : 'empty'}
                placeholder="请输入消息内容..."
                value={form.triggerContent as string}
                onChange={(val) => updateForm('triggerContent' as any, val)}
                autosize={{ minRows: 2, maxRows: 20 }}
              />
            </div>}
          </>
        )}
      </div>

      {/* 知识库配置 */}
      <div className="form-section" style={{ marginTop: 32 }}>
        <div className="form-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>关联知识库</label>
            <Button
              size="small"
              icon={<IconPlus />}
              onClick={() => setCreateVisible(true)}
            >
              新建知识库
            </Button>
          </div>
          <p className="hint-text" style={{ marginBottom: 12 }}>选择关联的知识库，AI 将在对话中参考这些知识</p>
          {kbList.length === 0 ? (
            <Empty description="暂无知识库，请先在知识库管理中创建" style={{ padding: '24px 0' }} />
          ) : (
            <div className="kb-select-grid">
              {kbList.map((kb) => {
                const selected = (form.selectedKBIds ?? []).includes(kb.id);
                return (
                  <div
                    key={kb.id}
                    className={`kb-select-card ${selected ? 'selected' : ''}`}
                    onClick={() => toggleKB(kb.id)}
                  >
                    <div className="kb-select-name">{kb.name}</div>
                    {kb.description && (
                      <div className="kb-select-desc">{kb.description}</div>
                    )}
                    <div className="kb-select-meta">{kb.itemCount} 条问答</div>
                    {selected && (
                      <div className="kb-select-check">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {(form.selectedKBIds ?? []).length > 0 && (
            <div className="kb-selected-tags">
              <span className="hint-text">已选：</span>
              {(form.selectedKBIds ?? []).map((id: string) => {
                const kb = kbList.find((k) => k.id === id);
                return kb ? (
                  <Tag
                    key={id}
                    closable
                    onClose={() => toggleKB(id)}
                    color="blue"
                    size="small"
                  >
                    {kb.name}
                  </Tag>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        title="新建知识库"
        visible={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okButtonProps={{ loading: creating }}
        okText="创建"
        centered
      >
        <Form
          getFormApi={(api) => {
            formApi.current = api as unknown as { validate: () => Promise<CreateFormValues> };
          }}
          layout="vertical"
        >
          <Form.Input
            field="businessAction"
            label="活动场景"
            placeholder="请输入活动场景名称"
            rules={[{ required: true, message: '请输入活动场景名称' }]}
          />
          <Form.TextArea
            field="description"
            label="场景描述"
            placeholder="请输入场景描述（选填）"
            autosize={{ minRows: 2, maxRows: 4 }}
          />
        </Form>
      </Modal>
    </div>
  );
}
