import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, TabPane, Tabs, Table, Tag, DatePicker, Spin, Toast } from '@douyinfe/semi-ui';
import { IconChevronLeft } from '@douyinfe/semi-icons';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { mockScripts } from '../../mock/scripts';
import { MetricCard } from '../../components/MetricCard/MetricCard';
import { CallDetailModal } from '../../components/CallDetailModal/CallDetailModal';
import type { Script } from '../../types/script';
import { BACKEND_AUTHORIZATION } from '../../utils/constants';
import './ScriptDataDetail.css';

interface CallRecord {
  id: string;
  time: string;
  duration: string;
  intent: '高意向' | '中意向' | '低意向';
  score: number;
}

interface MetricTrend {
  direction: 'up' | 'down';
  value: string;
}

interface ScriptMetrics {
  callCount: number;
  callCountTrend: MetricTrend;
  connectRate: string;
  connectRateTrend: MetricTrend;
  avgDuration: string;
  avgDurationTrend: MetricTrend;
  score: number;
  scoreTrend: MetricTrend;
}

const intentColors: Record<string, 'green' | 'blue' | 'grey'> = {
  '高意向': 'green',
  '中意向': 'blue',
  '低意向': 'grey',
};

export function ScriptDataDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useMockData } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<Script | null>(null);
  const [metrics, setMetrics] = useState<ScriptMetrics | null>(null);
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [parseDistribution, setParseDistribution] = useState<{ question: string; data: { tag: string; count: number; pct: number }[] }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [activeChartTab, setActiveChartTab] = useState('callCount');

  useEffect(() => {
    let scriptName = '';
    const fetchData = async () => {
      setLoading(true);

      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const found = mockScripts.find(s => s.id === id) || {
          id: id || 'mock',
          name: `剧本 #${id}`,
          status: 'online' as const,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        scriptName = found.name;
        setScript(found);
        
        setMetrics({
          callCount: Math.floor(Math.random() * 2000) + 500,
          callCountTrend: { direction: 'up', value: '12.5%' },
          connectRate: (Math.random() * 20 + 60).toFixed(1) + '%',
          connectRateTrend: { direction: 'up', value: '3.2%' },
          avgDuration: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 59)}s`,
          avgDurationTrend: { direction: 'down', value: '5s' },
          score: Math.floor(Math.random() * 30 + 60),
          scoreTrend: { direction: 'up', value: '2' },
        });
        
        // Generate daily trend data for 26 days
        const trendData = Array.from({ length: 26 }, (_, i) => {
          const d = new Date('2026-03-01');
          d.setDate(d.getDate() + i);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          return {
            date: label,
            callCount: Math.floor(40 + Math.sin(i * 0.4) * 15 + Math.random() * 20),
            connectRate: parseFloat((60 + Math.sin(i * 0.3) * 8 + Math.random() * 5).toFixed(1)),
            avgDuration: parseFloat((90 + Math.sin(i * 0.5) * 20 + Math.random() * 15).toFixed(0)),
            score: parseFloat((70 + Math.sin(i * 0.2) * 8 + Math.random() * 5).toFixed(1)),
          };
        });
        setTrendData(trendData);

        const records: CallRecord[] = Array.from({ length: 20 }, (_, i) => ({
          id: `call-${i + 1}`,
          time: `2026-03-${26 - Math.floor(i / 8)} ${10 + (i % 12)}:${(i * 7) % 60}:${(i * 13) % 60}`,
          duration: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 59)}s`,
          intent: (['高意向', '中意向', '低意向'] as const)[Math.floor(Math.random() * 3)],
          score: Math.floor(Math.random() * 30 + 60),
        }));
        setCallRecords(records);
      } else {
        try {
          const response = await fetch(`/api/scripts/${id}/metrics`);
          const data = await response.json();
          setScript(data.script);
          setMetrics(data.metrics);
          setCallRecords(data.callRecords);
        } catch {
          Toast.error('获取数据失败');
        }
      }

      // Fetch flow detail directly to get coreContents parseItems
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/self_help/api/agent_call';
        const flowRes = await fetch(`${baseUrl}/get_flow_detail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: BACKEND_AUTHORIZATION },
          body: JSON.stringify({ id: Number(id) }),
        });
        const flowData = await flowRes.json();

        if (flowData.status_code === 0 && flowData.data) {
          // Also set script name from real flow if in mock mode
          if (useMockData) {
            scriptName = flowData.data.name || scriptName;
          }
          const coreContents: any[] = flowData.data.agent_call_config?.coreContents || [];
          if (coreContents.length > 0) {
          // Collect all parseItems, exclude tags that are only "商家原声"
          const dist: { question: string; data: { tag: string; count: number; pct: number }[] }[] = [];
          const totalCalls = 20; // matches mock call records count

          for (const item of coreContents) {
            if (!Array.isArray(item.parseItems)) continue;
            for (const pi of item.parseItems) {
              const validTags = (pi.tags as string[]).filter((t: string) => t !== '商家原声');
              if (validTags.length === 0) continue;

              // Simulate distribution: use seeded-ish values based on question text
              const seed = pi.question.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
              const rawCounts = validTags.map((_: string, i: number) => Math.max(1, Math.floor(totalCalls * (0.15 + 0.5 * Math.abs(Math.sin(seed + i * 3.7))))));
              const total = rawCounts.reduce((a: number, b: number) => a + b, 0);
              dist.push({
                question: pi.question,
                data: validTags.map((tag: string, i: number) => ({
                  tag,
                  count: rawCounts[i],
                  pct: Math.round(rawCounts[i] / total * 100),
                })),
              });
            }
          }
          setParseDistribution(dist);
          }
        }
      } catch {
        // Silently ignore — parse distribution is optional
      }

      setLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, [id, useMockData]);

  const handleViewDetail = (callId: string) => {
    setSelectedCallId(callId);
    setModalVisible(true);
  };

  const columns = [
    { title: '序号', dataIndex: 'id', key: 'id', render: (id: string) => id.replace('call-', '').padStart(3, '0') },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '时长', dataIndex: 'duration', key: 'duration' },
    { title: '意向', dataIndex: 'intent', key: 'intent', render: (intent: string) => (
      <Tag color={intentColors[intent]}>{intent}</Tag>
    )},
    { title: '得分', dataIndex: 'score', key: 'score' },
    { title: '操作', key: 'action', render: (_: unknown, record: CallRecord) => (
      <Button size="small" style={{ background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff', borderRadius: 6 }} onClick={() => handleViewDetail(record.id)}>详情</Button>
    )},
  ];

  if (loading) {
    return (
      <div className="data-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="data-detail-error">
        <p>剧本不存在</p>
        <Button onClick={() => navigate('/self_help/agent_call/data')}>返回总览</Button>
      </div>
    );
  }

  const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
    online:  { label: '已上线', color: '#007d2e', bg: '#f0fff4', border: '#b7eb8f' },
    offline: { label: '已下线', color: '#b95c00', bg: '#fff7e8', border: '#ffd591' },
    draft:   { label: '草稿',   color: '#86909c', bg: '#f7f8fa', border: '#e5e6eb' },
  };
  const st = STATUS_STYLE[script.status] || STATUS_STYLE.draft;

  const btnBlue: React.CSSProperties = {
    background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff', borderRadius: 6,
  };

  return (
    <div className="script-data-detail">
      <div className="detail-header">
        <Button icon={<IconChevronLeft />} style={btnBlue} onClick={() => navigate('/self_help/agent_call/data')}>
          返回总览
        </Button>
        <div className="header-info">
          <h2 className="page-title">{script.name} — 数据详情</h2>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
          }}>
            {st.label}
          </span>
        </div>
      </div>

      <div className="time-filter">
        <DatePicker type="dateRange" defaultValue={[new Date('2026-03-01'), new Date('2026-03-26')]} />
        <Button style={btnBlue}>今日</Button>
        <Button style={btnBlue}>7天</Button>
        <Button style={btnBlue}>30天</Button>
      </div>

      <div className="metrics-row">
        {metrics && (
          <>
            <MetricCard
              icon="📞"
              title="外呼次数"
              value={metrics.callCount}
              trend={metrics.callCountTrend}
            />
            <MetricCard
              icon="⭐"
              title="剧本得分"
              value={metrics.score}
              trend={metrics.scoreTrend}
            />
            <MetricCard
              icon="⏱️"
              title="平均时长"
              value={metrics.avgDuration}
              trend={metrics.avgDurationTrend}
            />
            <MetricCard
              icon="📱"
              title="接通率"
              value={metrics.connectRate}
              trend={metrics.connectRateTrend}
            />
          </>
        )}
      </div>

      <Card title="趋势图表" style={{ marginBottom: 24 }}>
        <Tabs type="button" activeKey={activeChartTab} onChange={setActiveChartTab}>
          <TabPane tab="外呼量" itemKey="callCount" />
          <TabPane tab="接通率" itemKey="connectRate" />
          <TabPane tab="平均时长" itemKey="avgDuration" />
          <TabPane tab="得分" itemKey="score" />
        </Tabs>
        <div style={{ marginTop: 16 }}>
          {(() => {
            const cfgMap: Record<string, { key: string; color: string; unit: string }> = {
              callCount:   { key: 'callCount',   color: '#3370ff', unit: '次' },
              connectRate: { key: 'connectRate', color: '#00b42a', unit: '%' },
              avgDuration: { key: 'avgDuration', color: '#ff7d00', unit: 's' },
              score:       { key: 'score',       color: '#7b4df5', unit: '分' },
            };
            const cfg = cfgMap[activeChartTab];
            return (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#86909c' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 12, fill: '#86909c' }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e6eb', fontSize: 13 }}
                    formatter={(v: any) => [`${v}${cfg.unit}`, '']}
                    labelStyle={{ color: '#1d2129', fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={cfg.key}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </Card>

      <Card title="意图解析分布" style={{ marginBottom: 24 }}>
        {parseDistribution.length === 0 ? (
          <div style={{ color: '#86909c', padding: '24px 0', textAlign: 'center', fontSize: 13 }}>
            暂无解析数据（该剧本核心内容中未配置解析问题）
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {parseDistribution.map((q) => {
              const TAG_COLORS: Record<string, string> = {
                '高意向': '#00b42a', '中意向': '#3370ff', '低意向': '#86909c',
                '正常营业': '#00b42a', '暂停营业': '#f53f3f', '调整营业时间': '#ff7d00',
              };
              const getColor = (tag: string, i: number) => TAG_COLORS[tag] || ['#3370ff','#00b42a','#ff7d00','#7b4df5','#f53f3f'][i % 5];
              return (
                <div key={q.question}>
                  <div style={{ fontSize: 13, color: '#4e5969', fontWeight: 500, marginBottom: 8 }}>
                    {q.question}
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <ResponsiveContainer width="60%" height={36 * q.data.length}>
                      <BarChart
                        layout="vertical"
                        data={q.data}
                        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="tag" width={80} tick={{ fontSize: 12, fill: '#4e5969' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v: any) => [`${v}%`, '占比']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e6eb', fontSize: 12 }}
                        />
                        <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16}>
                          {q.data.map((entry, i) => (
                            <Cell key={i} fill={getColor(entry.tag, i)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {q.data.map((d, i) => (
                        <div key={d.tag} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: getColor(d.tag, i), flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ color: '#1d2129' }}>{d.tag}</span>
                          <span style={{ color: '#86909c' }}>{d.count} 次 ({d.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="通话明细列表">
        <Table
          columns={columns}
          dataSource={callRecords}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <CallDetailModal
        visible={modalVisible}
        callId={selectedCallId}
        onClose={() => setModalVisible(false)}
      />
    </div>
  );
}
