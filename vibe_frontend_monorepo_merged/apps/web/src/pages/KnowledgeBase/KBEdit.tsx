import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Input,
  TextArea,
  Toast,
  Spin,
  Tag,
  Modal,
} from '@douyinfe/semi-ui';
import { IconArrowLeft, IconPlus, IconClose } from '@douyinfe/semi-icons';
import { useKBStore } from '../../stores/useKBStore';
import * as kbService from '../../services/knowledgeService';
import styles from './KBEdit.module.css';

const { Title, Text } = Typography;

export function KBEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useKBStore();

  const { currentKB, items, editLoading } = store;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load KB on mount
  useEffect(() => {
    if (!id) return;

    store.loadKB(id);

    return () => store.resetEditState();
  }, [id]);

  // Sync local name when KB loads
  useEffect(() => {
    if (currentKB) setNameValue(currentKB.name);
  }, [currentKB]);

  const hasDirty = items.some((i) => i.isDirty);

  const handleSave = async () => {
    if (!hasDirty) {
      Toast.info('暂无需要保存的修改');
      return;
    }
    setSaving(true);
    try {
      await store.saveDirtyItems();
      Toast.success('保存成功');
    } catch {
      Toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasDirty) {
      setShowLeaveConfirm(true);
    } else {
      navigate('/self_help/agent_call/knowledge');
    }
  };

  const handleSaveName = async () => {
    if (!currentKB || !nameValue.trim()) return;
    try {
      await kbService.updateKBInfo(currentKB.id, { name: nameValue });
    } catch {
      Toast.error('保存失败');
      return;
    }
    useKBStore.setState((s) => ({
      currentKB: s.currentKB ? { ...s.currentKB, name: nameValue } : null,
    }));
    setEditingName(false);
  };

  const visibleItems = items.filter((i) => !i.isDeleted);

  if (editLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentKB && !editLoading) {
    return (
      <div className={styles.page}>
        <Text>知识库不存在或加载失败</Text>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          {editingName ? (
            <Input
              autoFocus
              value={nameValue}
              onChange={setNameValue}
              onBlur={handleSaveName}
              onEnterPress={handleSaveName}
              style={{ width: 240, fontSize: 20, fontWeight: 600 }}
            />
          ) : (
            <Title
              heading={4}
              style={{ margin: 0, cursor: 'pointer' }}
              onClick={() => setEditingName(true)}
            >
              📚 {currentKB?.name}
            </Title>
          )}
        </div>
        <Button icon={<IconArrowLeft />} onClick={handleBack}>
          返回列表
        </Button>
      </div>

      {/* Description */}
      {currentKB?.description && (
        <div className={styles.tagSection}>
          <Text type="tertiary">{currentKB.description}</Text>
        </div>
      )}

      {/* QA Card List */}
      <div className={styles.tableWrap}>
        {visibleItems.length === 0 && (
          <Text type="tertiary" style={{ display: 'block', padding: '16px 0' }}>
            暂无问题，点击下方添加
          </Text>
        )}

        {visibleItems.map((item, index) => {
          const realIndex = items.indexOf(item);
          const triggers = item.question ? item.question.split('\n') : [''];

          const updateTriggers = (newTriggers: string[]) => {
            store.updateItem(realIndex, 'question', newTriggers.join('\n'));
          };

          const nonEmptyCount = triggers.filter(Boolean).length;

          return (
            <div key={item.id} className={styles.qaCard}>
              <div className={styles.qaCardHeader}>
                <Tag color="blue" size="small">QA #{index + 1}</Tag>
                <Button
                  type="danger"
                  size="small"
                  onClick={() => setDeleteIndex(realIndex)}
                >
                  删除
                </Button>
              </div>

              <div className={styles.qaSection}>
                <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 8 }}>
                  触发话术（{nonEmptyCount} 条）
                </Text>
                {triggers.map((t, ti) => (
                  <div key={ti} className={styles.triggerRow}>
                    <Input
                      value={t}
                      placeholder="输入触发话术示例"
                      onChange={(val) => {
                        const next = [...triggers];
                        next[ti] = val;
                        updateTriggers(next);
                      }}
                    />
                    <Button
                      type="danger"
                      size="small"
                      theme="borderless"
                      icon={<IconClose />}
                      onClick={() => {
                        const next = triggers.filter((_, i) => i !== ti);
                        updateTriggers(next.length ? next : ['']);
                      }}
                    />
                  </div>
                ))}
                <Button
                  theme="borderless"
                  size="small"
                  onClick={() => updateTriggers([...triggers, ''])}
                  style={{ marginTop: 4, paddingLeft: 0, fontSize: 12 }}
                >
                  + 添加
                </Button>
              </div>

              <div className={styles.qaSection}>
                <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 8 }}>
                  回复话术
                </Text>
                <TextArea
                  value={item.answer}
                  placeholder="填写回复话术"
                  autosize={{ minRows: 2, maxRows: 6 }}
                  onChange={(val) => store.updateItem(realIndex, 'answer', val)}
                />
              </div>
            </div>
          );
        })}

        <div className={styles.addItemBtn}>
          <Button theme="borderless" icon={<IconPlus />} onClick={() => store.addItem()}>
            添加问题
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Button size="large" onClick={() => navigate('/self_help/agent_call/knowledge')}>取消</Button>
        <Button size="large" type="primary" theme="solid" loading={saving} onClick={handleSave}>保存</Button>
      </div>

      {/* Delete confirm */}
      <Modal
        title="确定删除该问题？"
        visible={deleteIndex !== null}
        onOk={() => {
          if (deleteIndex !== null) store.markItemDeleted(deleteIndex);
          setDeleteIndex(null);
        }}
        onCancel={() => setDeleteIndex(null)}
        okText="确定"
        cancelText="取消"
        okType="danger"
        centered
      />

      {/* Leave without saving confirm */}
      <Modal
        title="有未保存的更改"
        visible={showLeaveConfirm}
        onOk={async () => {
          await handleSave();
          setShowLeaveConfirm(false);
          navigate('/self_help/agent_call/knowledge');
        }}
        onCancel={() => {
          setShowLeaveConfirm(false);
          navigate('/self_help/agent_call/knowledge');
        }}
        okText="保存并返回"
        cancelText="不保存，直接返回"
        centered
      >
        <Text>您有未保存的更改，是否保存后再返回？</Text>
      </Modal>
    </div>
  );
}
