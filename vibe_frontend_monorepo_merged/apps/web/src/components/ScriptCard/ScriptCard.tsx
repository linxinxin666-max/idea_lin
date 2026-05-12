import { Tag, Button, Modal, Toast } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef } from 'react';
import { IconEdit, IconCopy, IconLineChartStroked, IconDelete, IconMore } from '@douyinfe/semi-icons';
import type { FlowItem, OnlineConfig } from '../../types/script';
import { useOnlineStatusStore } from '../../stores/useOnlineStatusStore';
import { OnlineConfigModal } from '../OnlineConfigModal/OnlineConfigModal';
import './ScriptCard.css';

interface ScriptCardProps {
  flow: FlowItem;
  onEdit: (id: number) => void;
  onCopy: (id: number) => void;
  onViewData: (id: number) => void;
  onDelete: (id: number) => void;
}

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

const STATUS_TAG: Record<string, { color: string; label: string; badgeStyle: React.CSSProperties }> = {
  offline:   { color: 'grey',   label: '未上线', badgeStyle: { background: '#f7f8fa', color: '#86909c',  border: '1px solid #e5e6eb' } },
  online:    { color: 'green',  label: '已上线', badgeStyle: { background: '#f0fff4', color: '#007d2e',  border: '1px solid #b7eb8f' } },
  suspended: { color: 'orange', label: '已下线', badgeStyle: { background: '#fff7e8', color: '#b95c00',  border: '1px solid #ffd591' } },
};

export function ScriptCard({ flow, onEdit, onCopy, onViewData, onDelete }: ScriptCardProps) {
  const { getState, setOnline, setSuspended, resume } = useOnlineStatusStore();
  const flowState = getState(flow.id);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [offlineVisible, setOfflineVisible] = useState(false);
  const [onlineModalVisible, setOnlineModalVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const handleCardClick = () => {
    if (onlineModalVisible || offlineVisible || deleteVisible) return;
    onEdit(flow.id);
  };
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  const handleOnlineConfirm = (config: OnlineConfig) => {
    setOnline(flow.id, config);
    setOnlineModalVisible(false);
    Toast.success('上线成功');
  };

  const handleOfflineConfirm = () => {
    setSuspended(flow.id);
    setOfflineVisible(false);
    Toast.success('已下线');
  };

  const handleResume = () => {
    resume(flow.id);
    Toast.success('已恢复上线');
  };

  const config = flow.agent_call_config;
  const identity = identityMap[config.identity] || config.identity;
  const retentionLevel = retentionLevelMap[config.retentionLevel] || config.retentionLevel;
  const conversationStyle = conversationStyleMap[config.conversationStyle] || config.conversationStyle;
  const statusInfo = STATUS_TAG[flowState.status];

  const btn: React.CSSProperties = {
    background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff',
    borderRadius: 6, height: 26, padding: '0 9px', fontSize: 12,
  };

  return (
    <div
      className="script-card"
      onClick={handleCardClick}
    >
      <div className="card-header">
        <div className="card-title-row">
          <span className="card-title">{flow.name}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            ...statusInfo.badgeStyle,
          }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="card-tags">
        <Tag style={{ background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff', borderRadius: 6 }}>{identity}</Tag>
        <Tag style={{ background: '#f6fff0', color: '#3d8a00', border: '1px solid #b7eb8f', borderRadius: 6 }}>{conversationStyle}</Tag>
        <Tag style={{ background: '#fff7e8', color: '#b95c00', border: '1px solid #ffd591', borderRadius: 6 }}>{retentionLevel}</Tag>
        <Tag style={{ background: '#f5f0ff', color: '#7b4df5', border: '1px solid #dac8fc', borderRadius: 6 }}>{config.businessBehavior}</Tag>
      </div>

      <div className="card-footer">
        <div className="card-meta">
          <div className="meta-item">
            <span className="meta-label">创建人：</span>
            <span className="meta-value">{flow.creator}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">创建时间：</span>
            <span className="meta-value">{new Date(flow.add_time).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        <div className="card-actions" onClick={stopProp}>
          <Button size="small" disabled={flowState.status === 'online'} style={flowState.status === 'online' ? undefined : btn} onClick={() => onEdit(flow.id)}>
            <IconEdit style={{ marginRight: 4 }} />编辑
          </Button>
          <Button size="small" style={btn} onClick={() => onViewData(flow.id)}>
            <IconLineChartStroked style={{ marginRight: 4 }} />数据
          </Button>

          {flowState.status === 'offline' && (
            <Button size="small" style={btn} onClick={() => setOnlineModalVisible(true)}>上线</Button>
          )}
          {flowState.status === 'online' && (
            <Button size="small" style={btn} onClick={() => setOfflineVisible(true)}>下线</Button>
          )}
          {flowState.status === 'suspended' && (
            <Button size="small" style={btn} onClick={handleResume}>恢复上线</Button>
          )}

          <div ref={menuRef} style={{ position: 'relative' }}>
            <Button
              size="small"
              style={{ ...btn, padding: '0 7px' }}
              icon={<IconMore />}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            />
            {menuOpen && (
              <div
                className="card-more-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-more-item card-more-item-primary" onClick={() => { onCopy(flow.id); setMenuOpen(false); }}>
                  <IconCopy size="small" />复制
                </div>
                <div className="card-more-item card-more-item-danger" onClick={() => { setDeleteVisible(true); setMenuOpen(false); }}>
                  <IconDelete size="small" />删除
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 上线配置弹窗 */}
      <OnlineConfigModal
        visible={onlineModalVisible}
        onOk={handleOnlineConfirm}
        onCancel={() => setOnlineModalVisible(false)}
      />

      {/* 下线确认弹窗 */}
      <Modal
        title="确认下线"
        visible={offlineVisible}
        onOk={handleOfflineConfirm}
        onCancel={() => setOfflineVisible(false)}
        okText="确认下线"
        okType="warning"
        cancelText="取消"
        centered
      >
        {flowState.schedulingNow
          ? '当前剧本正在调度中，确认强制下线？下线后当前批次将终止。'
          : '确认下线该剧本？下线后可随时恢复上线。'}
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确定删除该剧本？"
        visible={deleteVisible}
        onOk={() => { onDelete(flow.id); setDeleteVisible(false); }}
        onCancel={() => setDeleteVisible(false)}
        okText="确定"
        cancelText="取消"
        okType="danger"
        centered
      >
        删除后不可恢复。
      </Modal>
    </div>
  );
}
