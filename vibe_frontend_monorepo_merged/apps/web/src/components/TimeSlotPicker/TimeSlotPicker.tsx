import { useRef, useState, useCallback } from 'react';
import { Typography } from '@douyinfe/semi-ui';
import './TimeSlotPicker.css';

const { Text } = Typography;

const TOTAL = 48;

// slot index → "HH:MM" string
const slotToTime = (i: number) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
};

// Convert boolean[] to human-readable ranges, e.g. "09:00-12:00, 14:00-18:00"
export const slotsToRangeText = (slots: boolean[]): string => {
  const ranges: string[] = [];
  let start = -1;
  for (let i = 0; i <= TOTAL; i++) {
    const on = i < TOTAL && slots[i];
    if (on && start === -1) start = i;
    if (!on && start !== -1) {
      ranges.push(`${slotToTime(start)}-${slotToTime(i)}`);
      start = -1;
    }
  }
  return ranges.join('、') || '未选择';
};

interface TimeSlotPickerProps {
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

export function TimeSlotPicker({ value, onChange }: TimeSlotPickerProps) {
  const dragging = useRef(false);
  const dragStartVal = useRef(false); // 拖拽时设置为选中还是取消

  const toggle = useCallback(
    (i: number, newVal: boolean) => {
      const next = [...value];
      next[i] = newVal;
      onChange(next);
    },
    [value, onChange],
  );

  const handleMouseDown = (i: number) => {
    dragging.current = true;
    dragStartVal.current = !value[i];
    toggle(i, dragStartVal.current);
  };

  const handleMouseEnter = (i: number) => {
    if (!dragging.current) return;
    toggle(i, dragStartVal.current);
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  // 每 4 格（2小时）显示一个 label
  const labels: { left: string; text: string }[] = [];
  for (let h = 0; h < 24; h += 2) {
    labels.push({ left: `${((h * 2) / TOTAL) * 100}%`, text: `${h.toString().padStart(2, '0')}:00` });
  }

  return (
    <div className="tsp-wrap" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* 时间标签 */}
      <div className="tsp-labels">
        {labels.map((l) => (
          <span key={l.text} className="tsp-label" style={{ left: l.left }}>{l.text}</span>
        ))}
      </div>

      {/* 格子行 */}
      <div className="tsp-grid">
        {Array.from({ length: TOTAL }, (_, i) => (
          <div
            key={i}
            className={`tsp-cell ${value[i] ? 'selected' : ''}`}
            title={`${slotToTime(i)}-${slotToTime(i + 1)}`}
            onMouseDown={() => handleMouseDown(i)}
            onMouseEnter={() => handleMouseEnter(i)}
          />
        ))}
      </div>

      {/* 选中结果文字 */}
      <Text type="tertiary" size="small" style={{ marginTop: 6, display: 'block' }}>
        已选：{slotsToRangeText(value)}
      </Text>
    </div>
  );
}
