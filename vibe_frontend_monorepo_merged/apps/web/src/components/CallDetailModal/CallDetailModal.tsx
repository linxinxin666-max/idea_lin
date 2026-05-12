import { Modal, Tag } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import './CallDetailModal.css';

interface CallDetailModalProps {
  visible: boolean;
  callId: string;
  onClose: () => void;
}

interface CallDetail {
  id: string;
  duration: string;
  score: number;
  intent: string;
  execution: {
    opening: 'complete' | 'partial' | 'missing';
    coreContent: string;
    closing: 'complete' | 'partial' | 'missing';
    skillTriggered: boolean;
  };
  intentAnalysis: {
    finalIntent: string;
    keySignal: string;
    intentChange: string;
    conversionNode: string;
  };
  dialog: Array<{
    role: 'bot' | 'user';
    content: string;
    time: string;
  }>;
}

// Parse "MM:SS" or "HH:MM:SS" to seconds
const timeToSeconds = (t: string): number => {
  const parts = t.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

// Format seconds to "MM:SS"
const secondsToTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Parse "Xm Ys" duration string to seconds
const durationToSeconds = (d: string): number => {
  const m = d.match(/(\d+)m/);
  const s = d.match(/(\d+)s/);
  return (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
};

function AudioTimeline({ duration, dialogTimes, onSeek }: {
  duration: string;
  dialogTimes: string[];
  onSeek: (seconds: number) => void;
}) {
  const totalSec = durationToSeconds(duration);
  const [currentSec, setCurrentSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hoverSec, setHoverSec] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSecondsFromEvent = useCallback((e: React.MouseEvent) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.round(ratio * totalSec);
  }, [totalSec]);

  const handleBarClick = (e: React.MouseEvent) => {
    const sec = getSecondsFromEvent(e);
    setCurrentSec(sec);
    onSeek(sec);
  };

  const handleBarMouseMove = (e: React.MouseEvent) => {
    setHoverSec(getSecondsFromEvent(e));
  };

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentSec(prev => {
          if (prev >= totalSec) { setPlaying(false); return totalSec; }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, totalSec]);

  const pct = totalSec > 0 ? (currentSec / totalSec) * 100 : 0;

  return (
    <div className="audio-timeline">
      <div className="audio-tl-header">
        <button
          className="audio-play-btn"
          onClick={() => setPlaying(p => !p)}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <span className="audio-tl-time">{secondsToTime(currentSec)}</span>
        <span className="audio-tl-sep">/</span>
        <span className="audio-tl-total">{secondsToTime(totalSec)}</span>
      </div>

      {/* Progress bar */}
      <div
        ref={barRef}
        className="audio-tl-bar"
        onClick={handleBarClick}
        onMouseMove={handleBarMouseMove}
        onMouseLeave={() => setHoverSec(null)}
      >
        <div className="audio-tl-track">
          <div className="audio-tl-progress" style={{ width: `${pct}%` }} />
          <div className="audio-tl-thumb" style={{ left: `${pct}%` }} />
        </div>

        {/* Dialog timestamp markers */}
        {dialogTimes.map((t, i) => {
          const sec = timeToSeconds(t);
          const markerPct = totalSec > 0 ? (sec / totalSec) * 100 : 0;
          return (
            <div
              key={i}
              className="audio-tl-marker"
              style={{ left: `${markerPct}%` }}
              title={t}
              onClick={(e) => { e.stopPropagation(); setCurrentSec(sec); onSeek(sec); }}
            />
          );
        })}

        {/* Hover tooltip */}
        {hoverSec !== null && (
          <div
            className="audio-tl-tooltip"
            style={{ left: `${(hoverSec / totalSec) * 100}%` }}
          >
            {secondsToTime(hoverSec)}
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="audio-tl-labels">
        <span>00:00</span>
        <span>{secondsToTime(Math.round(totalSec / 2))}</span>
        <span>{secondsToTime(totalSec)}</span>
      </div>

      <p className="audio-hint">音频功能即将上线，时间轴已就绪</p>
    </div>
  );
}

export function CallDetailModal({ visible, callId, onClose }: CallDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  useEffect(() => {
    if (visible && callId) {
      setLoading(true);
      
      setTimeout(() => {
        setDetail({
          id: callId,
          duration: '2m 30s',
          score: 88,
          intent: '高意向',
          execution: {
            opening: 'complete',
            coreContent: '3/3',
            closing: 'partial',
            skillTriggered: true,
          },
          intentAnalysis: {
            finalIntent: '高意向',
            keySignal: '"可以了解一下"',
            intentChange: '低 → 中 → 高',
            conversionNode: '第3轮对话',
          },
          dialog: [
            { role: 'bot', content: '您好，我是抖音来客的官方客服，祝您新春快乐！', time: '00:00' },
            { role: 'user', content: '嗯，什么事？', time: '00:15' },
            { role: 'bot', content: '是这样的，我们注意到您的店铺经营状况良好，想给您介绍一下我们的春节促销活动。', time: '00:20' },
            { role: 'user', content: '哦，可以了解一下', time: '00:45' },
            { role: 'bot', content: '好的！这次活动主要是针对优质商家，参与后可以获得平台流量扶持和优惠券补贴...', time: '00:50' },
            { role: 'user', content: '听起来不错，怎么参加？', time: '01:30' },
            { role: 'bot', content: '您只需要点击我发送的链接，填写简单的信息即可报名。我已经通过短信发送给您了。', time: '01:35' },
          ],
        });
        setLoading(false);
      }, 500);
    }
  }, [visible, callId]);

  const getStatusIcon = (status: 'complete' | 'partial' | 'missing') => {
    switch (status) {
      case 'complete':
        return <span className="status-icon complete">✅</span>;
      case 'partial':
        return <span className="status-icon partial">⚠️</span>;
      case 'missing':
        return <span className="status-icon missing">❌</span>;
    }
  };

  return (
    <Modal
      title={`通话详情 #${callId?.replace('call-', '').padStart(3, '0')}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 50 }}
    >
      {loading ? (
        <div className="modal-loading">加载中...</div>
      ) : detail ? (
        <div className="call-detail-content">
          <div className="detail-left">
            <div className="audio-player">
              <p className="audio-placeholder">🔊 音频回放</p>
              <AudioTimeline
                duration={detail.duration}
                dialogTimes={detail.dialog.map(m => m.time)}
                onSeek={(s) => setSeekTime(s)}
              />
            </div>
            
            <div className="dialog-section">
              <h4>💬 对话文本</h4>
              <div className="dialog-list">
                {detail.dialog.map((msg, index) => (
                  <div key={index} className={`dialog-message ${msg.role}`}>
                    <div className="message-bubble">
                      {msg.content}
                    </div>
                    <span className="message-time">{msg.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="detail-right">
            <div className="evaluation-section">
              <h4>📊 评估数据</h4>
              <div className="score-display">
                <span className="score-label">剧本得分</span>
                <span className="score-value">{detail.score}/100</span>
              </div>
              <div className="evaluation-items">
                <div className="evaluation-item">
                  {getStatusIcon(detail.execution.opening)}
                  <span>开场白执行: {detail.execution.opening === 'complete' ? '完整' : detail.execution.opening === 'partial' ? '部分' : '缺失'}</span>
                </div>
                <div className="evaluation-item">
                  {getStatusIcon('complete')}
                  <span>核心内容传达: {detail.execution.coreContent}</span>
                </div>
                <div className="evaluation-item">
                  {getStatusIcon(detail.execution.closing)}
                  <span>结束语执行: {detail.execution.closing === 'complete' ? '完整' : detail.execution.closing === 'partial' ? '部分' : '缺失'}</span>
                </div>
                <div className="evaluation-item">
                  {getStatusIcon(detail.execution.skillTriggered ? 'complete' : 'missing')}
                  <span>技能触发: {detail.execution.skillTriggered ? '已发短信' : '未触发'}</span>
                </div>
              </div>
            </div>
            
            <div className="intent-section">
              <h4>🎯 意图解析</h4>
              <div className="intent-items">
                <div className="intent-item">
                  <span className="intent-label">最终意向</span>
                  <Tag color="green">{detail.intentAnalysis.finalIntent}</Tag>
                </div>
                <div className="intent-item">
                  <span className="intent-label">关键信号</span>
                  <span>{detail.intentAnalysis.keySignal}</span>
                </div>
                <div className="intent-item">
                  <span className="intent-label">意向变化</span>
                  <span>{detail.intentAnalysis.intentChange}</span>
                </div>
                <div className="intent-item">
                  <span className="intent-label">转化节点</span>
                  <span>{detail.intentAnalysis.conversionNode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
