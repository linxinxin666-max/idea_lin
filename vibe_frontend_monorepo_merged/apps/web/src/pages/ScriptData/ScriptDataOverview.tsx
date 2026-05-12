import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Empty, Spin, Toast } from '@douyinfe/semi-ui';
import { IconSearch, IconLineChartStroked } from '@douyinfe/semi-icons';
import type { FlowItem } from '../../types/script';
import { BACKEND_AUTHORIZATION } from '../../utils/constants';
import './ScriptDataOverview.css';

const STATUS_TAG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  offline:   { label: '未上线', color: '#86909c', bg: '#f7f8fa', border: '#e5e6eb' },
  online:    { label: '已上线', color: '#007d2e', bg: '#f0fff4', border: '#b7eb8f' },
  suspended: { label: '已下线', color: '#b95c00', bg: '#fff7e8', border: '#ffd591' },
};

export function ScriptDataOverview() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchFlows = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/self_help/api/agent_call';
        const res = await fetch(`${baseUrl}/get_flow_list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BACKEND_AUTHORIZATION },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.status_code === 0) {
          setFlows(data.data.flow_list);
        } else {
          Toast.error('获取列表失败');
        }
      } catch {
        Toast.error('获取数据失败');
      }
      setLoading(false);
    };
    fetchFlows();
  }, []);

  const filtered = useMemo(() =>
    flows.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase())),
    [flows, searchText]
  );

  const btn: React.CSSProperties = {
    background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff',
    borderRadius: 6, height: 26, padding: '0 9px', fontSize: 12,
  };

  return (
    <div className="script-data-overview">
      <div className="list-header">
        <h2 className="page-title">剧本数据</h2>
        {!loading && filtered.length > 0 && (
          <span className="page-count">{filtered.length} 个剧本</span>
        )}
      </div>

      <div className="toolbar">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索剧本..."
          value={searchText}
          onChange={setSearchText}
          style={{ width: 260 }}
        />
      </div>

      <div className="list-content">
        {loading ? (
          <div className="loading-container"><Spin size="large" /></div>
        ) : filtered.length === 0 ? (
          <Empty title="暂无数据" description="没有剧本数据" style={{ padding: '60px 0' }} />
        ) : (
          <div className="card-list">
            {filtered.map(flow => {
              // Use useOnlineStatusStore style — fall back to 'offline' if not in store
              const st = STATUS_TAG['offline'];
              return (
                <div
                  key={flow.id}
                  className="script-card"
                  onClick={() => navigate(`/self_help/agent_call/data/${flow.id}`)}
                >
                  <div className="card-header">
                    <div className="card-title-row">
                      <span className="card-title">{flow.name}</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        flexShrink: 0,
                      }}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <div className="sdo-metrics-row">
                    <div className="sdo-metric-chip">
                      <span className="sdo-chip-value">—</span>
                      <span className="sdo-chip-label">外呼次数</span>
                    </div>
                    <div className="sdo-metric-chip">
                      <span className="sdo-chip-value">—</span>
                      <span className="sdo-chip-label">得分</span>
                    </div>
                    <div className="sdo-metric-chip">
                      <span className="sdo-chip-value">—</span>
                      <span className="sdo-chip-label">接通率</span>
                    </div>
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
                    <div className="card-actions" onClick={e => e.stopPropagation()}>
                      <Button
                        size="small"
                        style={btn}
                        icon={<IconLineChartStroked style={{ marginRight: 4 }} />}
                        onClick={() => navigate(`/self_help/agent_call/data/${flow.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
