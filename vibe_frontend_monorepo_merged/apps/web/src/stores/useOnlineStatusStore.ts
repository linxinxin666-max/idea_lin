import { create } from 'zustand';
import type { OnlineStatus, OnlineConfig } from '../types/script';

export interface FlowOnlineState {
  status: OnlineStatus;
  config?: OnlineConfig;
  schedulingNow?: boolean; // 是否正在调度中
}

interface OnlineStatusStore {
  statusMap: Record<number, FlowOnlineState>;
  setOnline: (id: number, config: OnlineConfig) => void;
  setSuspended: (id: number) => void;
  resume: (id: number) => void;
  getState: (id: number) => FlowOnlineState;
}

// 通用的半小时格子工具
const makeSlots = (ranges: [number, number][]): boolean[] => {
  const slots = new Array(48).fill(false);
  ranges.forEach(([start, end]) => {
    for (let i = start; i < end; i++) slots[i] = true;
  });
  return slots;
};

// Mock 初始数据（对应真实 FlowItem.id）
const MOCK_INITIAL: Record<number, FlowOnlineState> = {
  // id 对应后端 flow 列表中的实际 id，这里用通配处理
  // 前端在首次渲染时若 statusMap 中无该 id 则默认 offline
};

export const MOCK_BUSINESS_LINES = [
  '抖音来客',
  '生活服务',
  '本地生活',
  '抖音外卖',
  '团购业务',
  '电商运营',
];

export const useOnlineStatusStore = create<OnlineStatusStore>((set, get) => ({
  statusMap: MOCK_INITIAL,

  setOnline: (id, config) =>
    set((s) => ({
      statusMap: {
        ...s.statusMap,
        [id]: { status: 'online', config, schedulingNow: false },
      },
    })),

  setSuspended: (id) =>
    set((s) => ({
      statusMap: {
        ...s.statusMap,
        [id]: { ...(s.statusMap[id] ?? { status: 'offline' }), status: 'suspended' },
      },
    })),

  resume: (id) =>
    set((s) => ({
      statusMap: {
        ...s.statusMap,
        [id]: { ...(s.statusMap[id] ?? { status: 'offline' }), status: 'online' },
      },
    })),

  getState: (id) => get().statusMap[id] ?? { status: 'offline' },
}));
