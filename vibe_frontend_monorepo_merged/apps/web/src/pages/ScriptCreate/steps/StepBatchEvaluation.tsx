import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Space, Typography, Table, Tag, Select, Modal, Empty } from '@douyinfe/semi-ui';
import { useCreateStore } from '../../../stores/useCreateStore';
import { useAIAssistantStore } from '../../../stores/useAIAssistantStore';
import {
  batchMockChat,
  getMockChatResult,
  type BatchMockChatRequest,
  type GetMockChatResultRequest
} from '../../../services/arkApi';
import './StepBatchEvaluation.css';

interface ChatScoreDetailItem {
  applicable_behaviors: string;
  behavior_check: string;
  evidence: string;
  reason: string;
  score: number;
  suggestion: string;
}

interface DetailScore {
  [key: string]: ChatScoreDetailItem;
}

interface ChatAnnotationItem {
  chat_text: string;
  chat_mark: string;
}

interface EvaluationRecord {
  id: string;
  merchantRole: string;
  merchantInfo: any;
  conversationText: string;
  conversationAnnotations?: ChatAnnotationItem[];
  conversationType: string;
  totalScore: number;
  detailScores: DetailScore;
  createdAt?: string;
}

export function StepBatchEvaluation() {
  const { scriptId, form } = useCreateStore();
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EvaluationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedMerchantRole, setSelectedMerchantRole] = useState<string>('');
  const [selectedConversationType, setSelectedConversationType] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>('ascend');
  const [activeSummaryCard, setActiveSummaryCard] = useState<string>('total'); // 'total' | severity key | dim name
  const [sortByDimension, setSortByDimension] = useState<string>(''); // 按维度排序
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<DetailScore | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [conversationModalVisible, setConversationModalVisible] = useState(false);
  const [conversationModalData, setConversationModalData] = useState<{ 
    text: string; 
    merchantRole: string;
    annotations?: ChatAnnotationItem[];
  } | null>(null);
  const [resultHistory, setResultHistory] = useState<string[]>([]);

  const uniqueMerchantRoles = useMemo(() => {
    const roles = new Set<string>();
    records.forEach(record => roles.add(record.merchantRole));
    return Array.from(roles);
  }, [records]);

  const uniqueConversationTypes = useMemo(() => {
    const types = new Set<string>();
    records.forEach(record => types.add(record.conversationType));
    return Array.from(types);
  }, [records]);

  const fetchResults = useCallback(async () => {
    if (!scriptId) return false;

    try {
      setIsLoading(true);
      const request: GetMockChatResultRequest = { id: String(scriptId) };
      const response = await getMockChatResult(request);

      if (response.status_code === 0 && response.data) {
        let parsedRecords: EvaluationRecord[] = [];
        
        const mockChatResult = response.data.mock_chat_result || [];
        
        if (Array.isArray(mockChatResult)) {
          parsedRecords = mockChatResult.map((item, index) => ({
            id: item.id ? String(item.id) : `eval-${index}`,
            merchantRole: item.account_character || '未知',
            merchantInfo: item.account_info || {},
            conversationText: item.chat_content || '',
            conversationAnnotations: item.chat_score_detail?.['对话标注结果'] || [],
            conversationType: item.chat_type || '未知',
            totalScore: item.chat_score_final?.总分 || 0,
            detailScores: item.chat_score_detail || {},
            createdAt: item.add_time
          }));
        }

        setRecords(parsedRecords);
        
        return JSON.stringify(parsedRecords);
      }
      return null;
    } catch (error) {
      console.error('获取评测结果失败:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [scriptId]);

  const startBatchEvaluation = useCallback(async () => {
    if (!scriptId) return;

    try {
      setHasStarted(true);
      const request: BatchMockChatRequest = { id: String(scriptId) };
      batchMockChat(request);
      
      await fetchResults();
    } catch (error) {
      console.error('启动批量评测失败:', error);
    }
  }, [scriptId, fetchResults]);

  useEffect(() => {
    const intervalRef = { current: null as ReturnType<typeof setInterval> | null };
    
    const initialFetch = async () => {
      if (scriptId) {
        const result = await fetchResults();
        if (result) {
          setResultHistory([result]);
        }
      }
    };
    initialFetch();

    if (scriptId) {
      intervalRef.current = setInterval(async () => {
        const currentResult = await fetchResults();
        
        if (currentResult) {
          setResultHistory(prev => {
            const newHistory = [...prev, currentResult].slice(-5);
            
            if (newHistory.length === 5) {
              const allSame = newHistory.every(r => r === newHistory[0]);
              if (allSame && intervalRef.current) {
                console.log('连续5次结果相同，停止轮询');
                clearInterval(intervalRef.current);
              }
            }
            
            return newHistory;
          });
        }
      }, 60000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // fetchResults is a useCallback that only depends on scriptId, so using scriptId alone is sufficient
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  useEffect(() => {
    let result = [...records];

    if (selectedMerchantRole) {
      result = result.filter(record => record.merchantRole === selectedMerchantRole);
    }

    if (selectedConversationType) {
      result = result.filter(record => record.conversationType === selectedConversationType);
    }

    if (sortByDimension) {
      result.sort((a, b) => {
        const sa = a.detailScores[sortByDimension]?.score ?? -1;
        const sb = b.detailScores[sortByDimension]?.score ?? -1;
        return sa - sb; // 维度正排（低分在前）
      });
    } else if (sortOrder === 'ascend') {
      result.sort((a, b) => a.totalScore - b.totalScore);
    } else if (sortOrder === 'descend') {
      result.sort((a, b) => b.totalScore - a.totalScore);
    }

    setFilteredRecords(result);
  }, [records, selectedMerchantRole, selectedConversationType, sortOrder, sortByDimension]);

  const renderMerchantInfo = (data: any) => {
    if (data === null || data === undefined) return '-';
    if (typeof data === 'string') return data;

    const accountName = data.account_name || data.accountName || '-';
    const category = data.category || '-';

    return (
      <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 500, color: '#1d2129', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
          {accountName}
        </div>
        <div style={{ color: '#86909c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
          {category}
        </div>
      </div>
    );
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '-';
    
    let rendered = text;
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    rendered = rendered.replace(/\n/g, '<br><br>');
    
    return rendered;
  };

  const renderConversationAnnotations = (annotations: ChatAnnotationItem[]) => {
    if (!annotations || annotations.length === 0) return null;

    const cleanText = (text: string) => {
      return text
        .replace(/^客户：/, '')
        .replace(/^客户:/, '')
        .replace(/^模型：/, '')
        .replace(/^模型:/, '');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' }}>
        {annotations.map((item, index) => {
          const isCustomer = index % 2 === 0;
          const roleLabel = isCustomer ? '客户' : '模型';
          const messageText = cleanText(item.chat_text);

          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: isCustomer ? 'flex-end' : 'flex-start' }}>
              {/* Role label */}
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: isCustomer ? '#3370ff' : '#007d2e',
                padding: '1px 8px',
                background: isCustomer ? '#f0f5ff' : '#f0fff4',
                borderRadius: 10,
                border: `1px solid ${isCustomer ? '#c9d8ff' : '#b7eb8f'}`,
                alignSelf: isCustomer ? 'flex-end' : 'flex-start',
              }}>
                {roleLabel}
              </span>

              {/* Bubble */}
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: isCustomer ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: isCustomer ? '#3370ff' : '#ffffff',
                color: isCustomer ? '#ffffff' : '#1d2129',
                border: isCustomer ? 'none' : '1px solid #e5e6eb',
                fontSize: 14,
                lineHeight: 1.7,
                boxShadow: isCustomer ? '0 2px 8px rgba(51,112,255,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
                wordBreak: 'break-word',
              }}>
                {messageText}
              </div>

              {/* Annotation note */}
              {item.chat_mark && (
                <div style={{
                  maxWidth: '80%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#874d00',
                  lineHeight: 1.6,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>📝</span>
                  <span>{item.chat_mark}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const openConversationModal = (text: string, merchantRole: string, annotations?: ChatAnnotationItem[]) => {
    setConversationModalData({ text, merchantRole, annotations });
    setConversationModalVisible(true);
  };

  const renderScore = (score: number) => {
    const color = score >= 80 ? '#00b42a' : score >= 60 ? '#ff7d00' : '#f53f3f';
    const trackColor = score >= 80 ? '#d1f5db' : score >= 60 ? '#ffe0b2' : '#ffcdd2';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ color, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
          {score}<span style={{ fontSize: 11, fontWeight: 500, marginLeft: 1 }}>分</span>
        </span>
        <div style={{ width: 56, height: 4, background: trackColor, borderRadius: 2 }}>
          <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
      </div>
    );
  };

  const openDetailModal = (detailScores: DetailScore, merchantRole: string) => {
    setModalData(detailScores);
    setModalTitle(`明细得分 - ${merchantRole}`);
    setModalVisible(true);
  };

  const renderChatScoreDetailItem = (item: ChatScoreDetailItem, key: string) => {
    // Safety: skip invalid entries (e.g. annotation arrays passed as score items)
    if (!item || typeof item.score === 'undefined') return null;

    const isNA = item.score === -1;
    const accentColor = isNA ? '#c9cdd4'
      : item.score >= 2 ? '#00b42a'
      : item.score >= 1 ? '#ff7d00'
      : '#f53f3f';
    const bgColor = isNA ? '#f7f8fa'
      : item.score >= 2 ? 'rgba(0,180,42,0.04)'
      : item.score >= 1 ? 'rgba(255,125,0,0.04)'
      : 'rgba(245,63,63,0.04)';
    const badgeBg = isNA ? '#f0f0f0' : accentColor;
    const badgeColor = isNA ? '#86909c' : 'white';
    const hasDetails = item.reason || item.evidence || item.suggestion;

    return (
      <div key={key} style={{
        marginBottom: 10,
        borderRadius: 10,
        border: `1px solid ${isNA ? '#e5e6eb' : accentColor + '55'}`,
        borderLeft: `3px solid ${accentColor}`,
        background: bgColor,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: isNA ? '#86909c' : '#1d2129' }}>{key}</div>
            {item.behavior_check && (
              <div style={{ fontSize: 12, color: '#86909c', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.behavior_check}</div>
            )}
          </div>
          <div style={{
            marginLeft: 12,
            padding: '3px 14px',
            borderRadius: 20,
            background: badgeBg,
            color: badgeColor,
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            {isNA ? '不适用' : `${item.score} / 3`}
          </div>
        </div>

        {/* Details */}
        {hasDetails && (
          <div style={{ borderTop: `1px solid ${isNA ? '#e5e6eb' : accentColor + '30'}`, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {item.reason && (
              <div style={{ fontSize: 13, color: '#4e5969', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600, color: '#1d2129' }}>原因：</span>{item.reason}
              </div>
            )}
            {item.evidence && (
              <div style={{ fontSize: 13, color: '#4e5969', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600, color: '#1d2129' }}>证据：</span>{item.evidence}
              </div>
            )}
            {item.suggestion && (
              <div style={{
                fontSize: 13, color: '#007d2e', lineHeight: 1.6,
                background: 'rgba(0,180,42,0.07)', padding: '6px 10px', borderRadius: 6,
              }}>
                <span style={{ fontWeight: 600 }}>💡 建议：</span>{item.suggestion}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const CONVERSATION_TYPE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
    '异常':    { color: '#cb2a2a', bg: '#fff1f0', border: '#ffcdd2' },
    '存在短板': { color: '#b95c00', bg: '#fff7e8', border: '#ffd591' },
    '正常':    { color: '#007d2e', bg: '#f0fff4', border: '#b7eb8f' },
    '无效':    { color: '#4e5969', bg: '#f7f8fa', border: '#e5e6eb' },
  };

  const columns = [
    {
      title: '商家人设',
      dataIndex: 'merchantRole',
      key: 'merchantRole',
      width: 130,
      render: (role: string) => (
        <Tag style={{ background: '#f0f0ff', color: '#5756d6', border: '1px solid #d3d3f7', borderRadius: 6, fontWeight: 500 }}>
          {role}
        </Tag>
      )
    },
    {
      title: '模拟商家信息',
      dataIndex: 'merchantInfo',
      key: 'merchantInfo',
      width: 210,
      render: renderMerchantInfo
    },
    {
      title: '完整对话',
      dataIndex: 'conversationText',
      key: 'conversationText',
      width: 110,
      render: (text: string, record: EvaluationRecord) => (
        <Button
          size="small"
          style={{ background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff', borderRadius: 6 }}
          onClick={() => openConversationModal(text, record.merchantRole, record.conversationAnnotations)}
        >
          查看对话
        </Button>
      )
    },
    {
      title: '对话类型',
      dataIndex: 'conversationType',
      key: 'conversationType',
      width: 110,
      render: (type: string) => {
        const s = CONVERSATION_TYPE_STYLE[type] || { color: '#4e5969', bg: '#f7f8fa', border: '#e5e6eb' };
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
          }}>
            {type}
          </span>
        );
      }
    },
    {
      title: '总得分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 110,
      sorter: (a: EvaluationRecord, b: EvaluationRecord) => a.totalScore - b.totalScore,
      sortOrder: sortOrder,
      render: renderScore
    },
    {
      title: '明细得分',
      dataIndex: 'detailScores',
      key: 'detailScores',
      width: 110,
      render: (detailScores: DetailScore, record: EvaluationRecord) => (
        <Button
          size="small"
          style={{ background: '#f5f0ff', color: '#7b4df5', border: '1px solid #dac8fc', borderRadius: 6 }}
          onClick={() => openDetailModal(detailScores, record.merchantRole)}
        >
          查看详情
        </Button>
      )
    }
  ];

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    if (sorter.field === 'totalScore') {
      setSortOrder(sorter.order);
    }
  };

  const summaryStats = useMemo(() => {
    if (records.length === 0) return null;

    const avgScore = records.reduce((sum, r) => sum + r.totalScore, 0) / records.length;
    const total = records.length;
    const severityLevels = [
      { key: '异常',    label: '严重异常', color: '#f53f3f', bg: 'rgba(245,63,63,0.08)',   border: '#ffcdd2' },
      { key: '存在短板', label: '存在短板', color: '#ff7d00', bg: 'rgba(255,125,0,0.08)',   border: '#ffe0b2' },
      { key: '正常',    label: '正常对话', color: '#00b42a', bg: 'rgba(0,180,42,0.08)',    border: '#c8e6c9' },
      { key: '无效',    label: '无效对话', color: '#86909c', bg: 'rgba(134,144,156,0.08)', border: '#e5e6eb' },
    ];
    const severityCounts = severityLevels.map(({ key, label, color, bg, border }) => {
      const count = records.filter(r => r.conversationType === key).length;
      return { key, label, color, bg, border, count, total, pct: Math.round(count / total * 1000) / 10 };
    });

    // 按维度聚合，排除 -1（不适用），0~3 换算为 0~100
    const dimensionMap: Record<string, { sum: number; count: number }> = {};
    for (const record of records) {
      for (const [dim, item] of Object.entries(record.detailScores)) {
        if (dim === '对话标注结果') continue;
        if (item.score === -1) continue;
        if (!dimensionMap[dim]) dimensionMap[dim] = { sum: 0, count: 0 };
        dimensionMap[dim].sum += item.score;
        dimensionMap[dim].count += 1;
      }
    }
    const dimensionAvgs = Object.entries(dimensionMap).map(([dim, { sum, count }]) => ({
      dim,
      avg: Math.round((sum / count) * (100 / 3) * 10) / 10,
    }));

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      severityCounts,
      dimensionAvgs,
    };
  }, [records]);

  return (
    <div className="step-batch-evaluation">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="step-title" style={{ margin: 0 }}>批量评测</h2>
        <Button 
          type="primary" 
          onClick={startBatchEvaluation}
        >
          重新评测
        </Button>
      </div>

      <Card
        className="evaluation-results-card"
        title="评测结果"
        bodyStyle={{ padding: 0 }}
        headerExtraContent={
          <Button
            size="small"
            style={{ background: '#f0f5ff', color: '#3370ff', border: '1px solid #c9d8ff', borderRadius: 6 }}
            onClick={() => {
              useAIAssistantStore.getState().startOptimization({
                records,
                scriptName: form.name,
                selectedKBIds: form.selectedKBIds,
              });
            }}
          >
            ✨ 一键优化
          </Button>
        }
      >
        <div style={{ padding: '20px 20px 0 20px' }}>
          {summaryStats && (
            <div style={{ marginBottom: 20 }}>
              {/* 第一行：总分 + 4档分布 */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, marginBottom: 12 }}>
                <div
                  onClick={() => {
                    setActiveSummaryCard('total');
                    setSelectedConversationType('');
                    setSortByDimension('');
                    setSortOrder('ascend');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '16px 20px',
                    borderRadius: 12,
                    color: 'white',
                    boxShadow: activeSummaryCard === 'total' ? '0 0 0 3px #764ba2, 0 4px 12px rgba(102,126,234,0.4)' : '0 4px 12px rgba(102,126,234,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }}>
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>总分</div>
                  <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{summaryStats.avgScore}<span style={{ fontSize: 14, marginLeft: 3 }}>分</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {summaryStats.severityCounts.map(({ key, label, color, bg, border, count, total, pct }) => (
                    <div key={key}
                      onClick={() => {
                        setActiveSummaryCard(key);
                        setSelectedConversationType(key);
                        setSortByDimension('');
                        setSortOrder('ascend');
                      }}
                      style={{
                        background: activeSummaryCard === key ? bg.replace('0.08', '0.18') : bg,
                        border: `2px solid ${activeSummaryCard === key ? color : border}`,
                        borderRadius: 10,
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}>
                      <span style={{ fontSize: 12, color: '#86909c' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color }}>{pct}%</span>
                        <span style={{ fontSize: 11, color: '#86909c' }}>{count}/{total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 第二行：多维度均分（带进度条） */}
              {summaryStats.dimensionAvgs.length > 0 && (
                <div style={{ background: '#f7f8fa', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 14, background: '#667eea', borderRadius: 2 }} />
                    <span style={{ fontSize: 12, color: '#4e5969', fontWeight: 500 }}>维度得分</span>
                    <span style={{ fontSize: 11, color: '#86909c' }}>点击按维度排序</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px' }}>
                    {[...summaryStats.dimensionAvgs]
                      .sort((a, b) => a.avg - b.avg)
                      .map(({ dim, avg }) => {
                        const color = avg >= 80 ? '#00b42a' : avg >= 60 ? '#ff7d00' : '#f53f3f';
                        const trackColor = avg >= 80 ? '#d1f5db' : avg >= 60 ? '#ffe0b2' : '#ffcdd2';
                        const isActive = activeSummaryCard === dim;
                        return (
                          <div key={dim}
                            onClick={() => {
                              setActiveSummaryCard(dim);
                              setSelectedConversationType('');
                              setSortByDimension(dim);
                              setSortOrder('ascend');
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
                              background: isActive ? 'rgba(102,126,234,0.08)' : 'transparent',
                              transition: 'background 0.15s',
                            }}>
                            <span style={{ fontSize: 12, color: isActive ? '#667eea' : '#4e5969', width: 108, flexShrink: 0, fontWeight: isActive ? 600 : 400 }}>{dim}</span>
                            <div style={{ flex: 1, height: 7, background: trackColor, borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${avg}%`, height: '100%', background: color, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color, width: 44, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>{avg}分</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {filteredRecords.length > 0 ? (
          <>
            <Table 
              dataSource={filteredRecords}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              onChange={handleTableChange}
              loading={isLoading}
              tableLayout="fixed"
              style={{ width: '100%' }}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              title={records.length > 0 ? '暂无符合条件的数据' : '暂无评测数据'}
              description={records.length > 0 ? '请调整筛选条件' : '评测数据正在生成中，请稍后查看'}
            >
              {records.length === 0 && (
                <Button type="primary" onClick={fetchResults} loading={isLoading}>
                  刷新查看
                </Button>
              )}
            </Empty>
          </div>
        )}
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📊</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1d2129' }}>明细得分</div>
              {modalTitle.includes(' - ') && (
                <div style={{ fontSize: 12, color: '#86909c', fontWeight: 400, marginTop: 1 }}>{modalTitle.split(' - ')[1]}</div>
              )}
            </div>
          </div>
        }
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={640}
      >
        {modalData && (
          <div style={{ maxHeight: '68vh', overflow: 'auto', paddingRight: 2 }}>
            {Object.entries(modalData)
              .filter(([key, value]) => key !== '对话标注结果' && value && typeof (value as any).score !== 'undefined')
              .map(([key, value]) => renderChatScoreDetailItem(value as ChatScoreDetailItem, key))
            }
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💬</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1d2129' }}>完整对话</div>
              {conversationModalData?.merchantRole && (
                <div style={{ fontSize: 12, color: '#86909c', fontWeight: 400, marginTop: 1 }}>{conversationModalData.merchantRole}</div>
              )}
            </div>
          </div>
        }
        visible={conversationModalVisible}
        onCancel={() => setConversationModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setConversationModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={760}
      >
        {conversationModalData && (
          <div style={{
            maxHeight: '68vh',
            overflow: 'auto',
            background: '#f3f4f6',
            borderRadius: 12,
            padding: '20px 24px',
          }}>
            {conversationModalData.annotations && conversationModalData.annotations.length > 0 ? (
              renderConversationAnnotations(conversationModalData.annotations)
            ) : (
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: 0,
                fontFamily: 'inherit',
                background: '#ffffff',
                padding: 16,
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.7,
              }}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(conversationModalData.text) }} />
              </pre>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}