import { create } from 'zustand';
import type { Script, ScriptStatus } from '../types/script';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface Filters {
  keyword: string;
  status: ScriptStatus | 'all';
  sortBy: string;
}

interface ScriptState {
  scripts: Script[];
  loading: boolean;
  filters: Filters;
  pagination: Pagination;
  
  fetchScripts: () => Promise<void>;
  setFilters: (filters: Partial<Filters>) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  deleteScript: (id: string) => Promise<void>;
  copyScript: (id: string) => Promise<void>;
  updateScriptStatus: (id: string, status: ScriptStatus) => Promise<void>;
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  scripts: [],
  loading: false,
  filters: {
    keyword: '',
    status: 'all',
    sortBy: 'updatedAt',
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },

  fetchScripts: async () => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { pagination } = get();
      set({ 
        loading: false,
        pagination: { ...pagination, total: 100 },
      });
    } catch {
      set({ loading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  deleteScript: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set((state) => ({
      scripts: state.scripts.filter(s => s.id !== id),
      pagination: { 
        ...state.pagination, 
        total: Math.max(0, state.pagination.total - 1),
      },
    }));
  },

  copyScript: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const script = get().scripts.find(s => s.id === id);
    if (script) {
      const newScript: Script = {
        ...script,
        id: `${Date.now()}`,
        name: `${script.name} (副本)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        scripts: [...state.scripts, newScript],
        pagination: { 
          ...state.pagination, 
          total: state.pagination.total + 1,
        },
      }));
    }
  },

  updateScriptStatus: async (id, status) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set((state) => ({
      scripts: state.scripts.map(s => 
        s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s
      ),
    }));
  },
}));
