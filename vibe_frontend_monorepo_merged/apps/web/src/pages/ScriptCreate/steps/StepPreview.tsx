import { useMemo } from 'react';
import ReactFlow, { Node, Edge, Handle, Position, NodeTypes, Background, BackgroundVariant, MarkerType, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCreateStore } from '../../../stores/useCreateStore';
import { SKILL_TYPE_LABEL_MAP } from '../../../utils/constants';
import './StepPreview.css';

// ── Dialog DAG (read-only) ────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  '意向激发类': { bg: '#fff7e6', color: '#d46b08', border: '#ffd591' },
  '信息通知类': { bg: '#e6f7ff', color: '#096dd9', border: '#91d5ff' },
  '信息核实类': { bg: '#f6ffed', color: '#389e0d', border: '#b7eb8f' },
};

function DagOpeningNode({ data }: { data: any }) {
  const preview = data.text ? (data.text.length > 50 ? data.text.slice(0, 50) + '…' : data.text) : '未配置';
  return (
    <div className="dag-pv-node dag-pv-node--opening">
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <div className="dag-pv-badge dag-pv-badge--opening">开场白</div>
      <p className={`dag-pv-text ${!data.text ? 'dag-pv-text--empty' : ''}`}>{preview}</p>
    </div>
  );
}

function DagDialogNode({ data }: { data: any }) {
  const c = TYPE_COLORS[data.type] ?? { bg: '#fafafa', color: '#595959', border: '#d9d9d9' };
  const preview = data.content ? (data.content.length > 50 ? data.content.slice(0, 50) + '…' : data.content) : '未配置';
  return (
    <div className="dag-pv-node dag-pv-node--dialog">
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ visibility: 'hidden' }} />
      <div className="dag-pv-dialog-header">
        <span className="dag-pv-seq">对话 {data.index + 1}</span>
        {data.type && <span className="dag-pv-type-tag" style={{ background: c.bg, color: c.color, borderColor: c.border }}>{data.type}</span>}
      </div>
      <p className={`dag-pv-text ${!data.content ? 'dag-pv-text--empty' : ''}`}>{preview}</p>
      {data.parseCount > 0 && <div className="dag-pv-parse-hint">解析项 {data.parseCount} 条</div>}
    </div>
  );
}

function DagClosingNode({ data }: { data: any }) {
  const preview = data.text ? (data.text.length > 50 ? data.text.slice(0, 50) + '…' : data.text) : '未配置';
  return (
    <div className="dag-pv-node dag-pv-node--closing">
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <div className="dag-pv-badge dag-pv-badge--closing">结束语</div>
      <p className={`dag-pv-text ${!data.text ? 'dag-pv-text--empty' : ''}`}>{preview}</p>
    </div>
  );
}

function DagSkillNode({ data }: { data: any }) {
  const preview = data.content ? (data.content.length > 50 ? data.content.slice(0, 50) + '…' : data.content) : null;
  return (
    <div className="dag-pv-node dag-pv-node--skill">
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <div className="dag-pv-badge dag-pv-badge--skill">{data.skillLabel}</div>
      {preview ? (
        <p className="dag-pv-text">{preview}</p>
      ) : (
        <p className="dag-pv-text dag-pv-text--empty">未配置消息内容</p>
      )}
      {data.parseValues?.length > 0 && (
        <div className="dag-pv-parse-hint">触发标签: {data.parseValues.join('、')}</div>
      )}
    </div>
  );
}

const DAG_NODE_TYPES: NodeTypes = {
  dagOpening: DagOpeningNode,
  dagDialog: DagDialogNode,
  dagClosing: DagClosingNode,
  dagSkill: DagSkillNode,
};

const NODE_W = 240;
const NODE_GAP = 130;
const NODE_X = 80;

function DialogDagPreview({ openingRemarks, closingRemarks, coreContents, skillType, triggerIntentMode, triggerContentIndex, triggerParseValues, triggerContent, skillLabel }: {
  openingRemarks: string;
  closingRemarks: string;
  coreContents: any[];
  skillType: string;
  triggerIntentMode: string;
  triggerContentIndex: number | null;
  triggerParseValues: string[];
  triggerContent: string;
  skillLabel: string;
}) {
  const hasSkill = skillType !== 'none';
  const skillByParse = hasSkill && triggerIntentMode === 'by_parse_value';
  const skillByAll = hasSkill && triggerIntentMode === 'all';

  const { nodes, edges } = useMemo(() => {
    const _nodes: Node[] = [];
    const _edges: Edge[] = [];
    const edgeStyle = { stroke: '#d9d9d9', strokeWidth: 2 };
    const marker = { type: MarkerType.ArrowClosed, color: '#d9d9d9' };
    const skillEdgeStyle = { stroke: '#52c41a', strokeWidth: 2 };
    const skillMarker = { type: MarkerType.ArrowClosed, color: '#52c41a' };

    _nodes.push({ id: 'opening', type: 'dagOpening', position: { x: NODE_X, y: 0 }, data: { text: openingRemarks }, draggable: false, selectable: false, style: { width: NODE_W } });

    let prevId = 'opening';
    let y = NODE_GAP;

    coreContents.forEach((c, i) => {
      const id = `dialog-${i}`;
      _nodes.push({ id, type: 'dagDialog', position: { x: NODE_X, y }, data: { index: i, type: c.type, content: c.content, parseCount: (c.parseItems ?? []).length }, draggable: false, selectable: false, style: { width: NODE_W } });
      _edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id, type: 'smoothstep', style: edgeStyle, markerEnd: marker });
      prevId = id;
      y += NODE_GAP;
    });

    _nodes.push({ id: 'closing', type: 'dagClosing', position: { x: NODE_X, y }, data: { text: closingRemarks }, draggable: false, selectable: false, style: { width: NODE_W } });
    _edges.push({ id: `e-${prevId}-closing`, source: prevId, target: 'closing', type: 'smoothstep', style: edgeStyle, markerEnd: marker });

    // ── Skill node ─────────────────────────────────────────────────────────
    const skillData = {
      skillLabel,
      content: skillType !== 'wecom' ? triggerContent : null,
      parseValues: skillByParse ? triggerParseValues : [],
    };

    if (skillByAll) {
      // Place skill below closing node
      _nodes.push({ id: 'skill', type: 'dagSkill', position: { x: NODE_X, y: y + NODE_GAP }, data: skillData, draggable: false, selectable: false, style: { width: NODE_W } });
      _edges.push({ id: 'e-closing-skill', source: 'closing', target: 'skill', type: 'smoothstep', style: skillEdgeStyle, markerEnd: skillMarker });
    } else if (skillByParse && triggerContentIndex !== null && triggerContentIndex < coreContents.length) {
      // Place skill to the right of the triggering dialog node
      const dialogY = NODE_GAP * (triggerContentIndex + 1);
      _nodes.push({ id: 'skill', type: 'dagSkill', position: { x: NODE_X + NODE_W + 60, y: dialogY }, data: skillData, draggable: false, selectable: false, style: { width: 200 } });
      _edges.push({ id: 'e-dialog-skill', source: `dialog-${triggerContentIndex}`, sourceHandle: 'right', target: 'skill', type: 'smoothstep', style: skillEdgeStyle, markerEnd: skillMarker });
    }

    return { nodes: _nodes, edges: _edges };
  }, [openingRemarks, closingRemarks, coreContents, skillType, triggerIntentMode, triggerContentIndex, triggerParseValues, triggerContent, skillLabel, skillByAll, skillByParse]);

  const extraRows = skillByAll ? 1 : 0;
  const height = Math.max(360, NODE_GAP * (coreContents.length + 2 + extraRows) + 100);

  return (
    <div style={{ height, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--semi-color-border)' }}>
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={DAG_NODE_TYPES}
        fitView fitViewOptions={{ padding: 0.2, maxZoom: 0.8 }}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        panOnDrag zoomOnScroll={false} zoomOnPinch zoomOnDoubleClick
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#efefef" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="preview-section-block">
      <div className="preview-section-title">{title}</div>
      <div className="preview-section-body">{children}</div>
    </div>
  );
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="preview-row">
      <span className="preview-row-label">{label}</span>
      <span className="preview-row-value">{children}</span>
    </div>
  );
}

export function StepPreview() {
  const { form } = useCreateStore();
  const skillLabel = SKILL_TYPE_LABEL_MAP[form.skillType] || form.skillType;

  return (
    <div className="step-preview">
      <h2 className="step-title">预览确认</h2>
      <p className="step-desc" />

      <div className="preview-body">

        {/* 基础信息 + 角色配置 */}
        <PreviewSection title="基础信息">
          <div className="preview-grid-2col">
            <PreviewRow label="剧本名称">{form.name || <span className="empty-val">未填写</span>}</PreviewRow>
            <PreviewRow label="活动场景">{form.businessAction || <span className="empty-val">未填写</span>}</PreviewRow>
            <PreviewRow label="身份配置">{form.identity || <span className="empty-val">未填写</span>}</PreviewRow>
            <PreviewRow label="挽回程度">{form.retentionLevel || <span className="empty-val">未填写</span>}</PreviewRow>
            <PreviewRow label="对话风格">{form.dialogStyle || <span className="empty-val">未填写</span>}</PreviewRow>
          </div>
        </PreviewSection>

        {/* 对话设计 */}
        <PreviewSection title="外呼预览">
          <DialogDagPreview
            openingRemarks={form.openingRemarks}
            closingRemarks={form.closingRemarks}
            coreContents={form.coreContents}
            skillType={form.skillType}
            triggerIntentMode={form.triggerIntentMode}
            triggerContentIndex={form.triggerContentIndex}
            triggerParseValues={form.triggerParseValues}
            triggerContent={form.triggerContent}
            skillLabel={skillLabel}
          />
        </PreviewSection>


      </div>
    </div>
  );
}
