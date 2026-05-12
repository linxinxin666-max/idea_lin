import { useState } from 'react';
import { Button, RadioGroup, Radio, Select, TextArea, Input, Tag } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { useCreateStore } from '../../../stores/useCreateStore';
import { OPENING_TEMPLATES, CLOSING_TEMPLATES } from '../../../utils/constants';
import './StepDialogDesign.css';

export function StepDialogDesign() {
  const {
    form,
    updateForm,
    addCoreContent,
    removeCoreContent,
    updateCoreContent,
    addParseItem,
    removeParseItem,
    updateParseItemQuestion,
    addParseItemTag,
    removeParseItemTag,
  } = useCreateStore();

  const [newTag, setNewTag] = useState<Record<string, string>>({});

  const circled = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

  const handleAddTag = (contentIndex: number, parseIndex: number, tagKey: string) => {
    const tag = newTag[tagKey];
    if (!tag?.trim()) return;
    addParseItemTag(contentIndex, parseIndex, tag.trim());
    setNewTag(prev => ({ ...prev, [tagKey]: '' }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent, contentIndex: number, parseIndex: number, tagKey: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(contentIndex, parseIndex, tagKey);
    }
  };

  return (
    <div className="step-dialog-design">
      <h2 className="step-title">对话设计</h2>
      <p className="step-desc">配置开场白、核心外呼对话、结束语</p>

      <div className="form-section">

        {/* 开场白 */}
        <div className="form-item">
          <label className="form-label">开场白 <span className="required">*</span></label>
          <div className="template-mode">
            <RadioGroup
              type="button"
              value={form.openingRemarksMode}
              onChange={(e) => updateForm('openingRemarksMode', e.target.value as any)}
            >
              <Radio value="template">使用模板</Radio>
              <Radio value="manual">手动输入</Radio>
            </RadioGroup>
          </div>
          {form.openingRemarksMode === 'template' ? (
            <Select
              placeholder="选择开场白模板"
              value={form.openingRemarks}
              onChange={(value) => updateForm('openingRemarks', value as string)}
              style={{ width: '100%' }}
            >
              {OPENING_TEMPLATES.map((template) => (
                <Select.Option key={template.id} value={template.content}>
                  {template.content}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <TextArea
              placeholder="请输入开场白内容"
              value={form.openingRemarks}
              onChange={(value) => updateForm('openingRemarks', value)}
              maxLength={500}
              showClear
              rows={3}
            />
          )}
        </div>

        {/* 核心外呼对话 */}
        <div className="form-item">
          <label className="form-label">核心外呼对话 <span className="required">*</span></label>
          <div className="content-list">
            {form.coreContents.map((content, index) => (
              <div key={index} className="content-item">
                <div className="content-item-header">
                  <span className="content-item-title">对话 {index + 1}</span>
                  <Button
                    type="tertiary"
                    icon={<IconDelete />}
                    size="small"
                    onClick={() => removeCoreContent(index)}
                  />
                </div>

                <div className="content-item-body">
                  <div className="type-select-row">
                    <Select
                      value={content.type}
                      onChange={(value) => updateCoreContent(index, { type: value as any })}
                      style={{ width: 140 }}
                    >
                      <Select.Option value="意向激发类">意向激发类</Select.Option>
                      <Select.Option value="信息通知类">信息通知类</Select.Option>
                      <Select.Option value="信息核实类">信息核实类</Select.Option>
                    </Select>
                    {content.type && (
                      <span className="type-hint-text">
                        {{'意向激发类':'宣传活动，激发商家意向','信息通知类':'通知信息，不需要商家回复','信息核实类':'询问信息，需要商家回复'}[content.type]}
                      </span>
                    )}
                  </div>

                  <TextArea
                    placeholder="请输入外呼内容"
                    value={content.content}
                    onChange={(value) => updateCoreContent(index, { content: value })}
                    rows={2}
                    style={{ marginBottom: 10 }}
                  />

                  {(content.type === '信息核实类' || content.type === '意向激发类') && (
                    <div className="parse-section">
                      <div className="parse-section-header">
                        <span className="parse-section-title">解析内容</span>
                        <Button
                          type="tertiary"
                          icon={<IconPlus />}
                          size="small"
                          onClick={() => addParseItem(index)}
                          style={{ fontSize: 12 }}
                        >
                          添加解析内容
                        </Button>
                      </div>

                      {(content.parseItems || []).map((parseItem, parseIndex) => {
                        const tagKey = `${index}-${parseIndex}`;
                        return (
                          <div key={parseIndex} className="parse-item">
                            <div className="parse-item-header">
                              <span className="parse-item-title">问题 {circled[parseIndex] ?? parseIndex + 1}</span>
                              <Button
                                type="tertiary"
                                icon={<IconDelete />}
                                size="small"
                                onClick={() => removeParseItem(index, parseIndex)}
                              />
                            </div>

                            <Input
                              placeholder="请输入问题"
                              value={parseItem.question}
                              onChange={(value) => updateParseItemQuestion(index, parseIndex, value)}
                              style={{ marginBottom: 8 }}
                            />

                            <div className="tag-section">
                              <div className="parse-item-title" style={{ marginBottom: 6 }}>
                                解析类别 {circled[parseIndex] ?? parseIndex + 1}
                              </div>
                              <div className="tags-row">
                                {parseItem.tags.map((tag, tagIndex) => (
                                  <Tag
                                    key={tagIndex}
                                    size="small"
                                    closable
                                    onClose={() => removeParseItemTag(index, parseIndex, tagIndex)}
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                                {newTag[tagKey] !== undefined ? (
                                  <Input
                                    autoFocus
                                    placeholder="输入类别名"
                                    value={newTag[tagKey] || ''}
                                    onChange={(value) => setNewTag(prev => ({ ...prev, [tagKey]: value }))}
                                    onKeyDown={(e) => handleTagInputKeyDown(e, index, parseIndex, tagKey)}
                                    onBlur={() => {
                                      handleAddTag(index, parseIndex, tagKey);
                                      setNewTag(prev => { const n = {...prev}; delete n[tagKey]; return n; });
                                    }}
                                    size="small"
                                    className="tag-input-small"
                                    style={{ width: 100 }}
                                  />
                                ) : (
                                  <Button
                                    size="small"
                                    type="tertiary"
                                    icon={<IconPlus />}
                                    onClick={() => setNewTag(prev => ({ ...prev, [tagKey]: '' }))}
                                    style={{ fontSize: 12, height: 22, padding: '0 6px' }}
                                  >
                                    添加解析类别
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="tertiary"
              icon={<IconPlus />}
              onClick={addCoreContent}
              style={{ marginTop: 8, marginLeft: 12 }}
            >
              添加对话
            </Button>
          </div>
        </div>

        {/* 结束语 */}
        <div className="form-item">
          <label className="form-label">结束语 <span className="required">*</span></label>
          <div className="template-mode">
            <RadioGroup
              type="button"
              value={form.closingRemarksMode}
              onChange={(e) => updateForm('closingRemarksMode', e.target.value as any)}
            >
              <Radio value="template">使用模板</Radio>
              <Radio value="manual">手动输入</Radio>
            </RadioGroup>
          </div>
          {form.closingRemarksMode === 'template' ? (
            <Select
              placeholder="选择结束语模板"
              value={form.closingRemarks}
              onChange={(value) => updateForm('closingRemarks', value as string)}
              style={{ width: '100%' }}
              dropdownMatchSelectWidth
            >
              {CLOSING_TEMPLATES.map((template) => (
                <Select.Option key={template.id} value={template.content}>
                  {template.content}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <TextArea
              placeholder="请输入结束语内容"
              value={form.closingRemarks}
              onChange={(value) => updateForm('closingRemarks', value)}
              maxLength={500}
              rows={3}
            />
          )}
        </div>

      </div>
    </div>
  );
}
