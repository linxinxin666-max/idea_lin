import { create } from 'zustand';
import * as kbService from '../services/knowledgeService';
import type { KnowledgeBase, KBItemEditState, KnowledgeTheme, KnowledgeThemeDoc } from '../types/knowledge';
import type { BusinessAction } from '../types/script';
import { useAuthStore } from './useAuthStore';

function convertKnowledgeThemeToKB(theme: KnowledgeTheme): KnowledgeBase {
  return {
    id: theme.theme_id,
    name: theme.theme_name,
    businessActions: [] as BusinessAction[],
    description: theme.theme_desc,
    itemCount: theme.theme_docs_cnt,
    createdBy: theme.theme_creator,
    createdAt: theme.create_time,
    updatedAt: theme.update_time,
  };
}

function convertKnowledgeDocToItem(doc: KnowledgeThemeDoc, index: number): KBItemEditState {
  return {
    id: doc.docs_id,
    question: doc.docs_detail.triggers.join('\n'),
    answer: doc.docs_detail.response_text,
    hitCount: 0,
    sortOrder: index + 1,
    isDirty: false,
    isNew: false,
    isDeleted: false,
    editingField: null,
  };
}

function toDocsDetail(item: KBItemEditState) {
  return {
    response_text: item.answer,
    triggers: item.question
      .split('\n')
      .map((trigger) => trigger.trim())
      .filter(Boolean),
  };
}

interface KBState {
  // ========== 列表页状态 ==========
  knowledgeBases: KnowledgeBase[];
  listLoading: boolean;
  filters: {
    keyword: string;
    businessAction: BusinessAction | 'all';
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };

  fetchKBList: () => Promise<void>;
  setFilters: (filters: Partial<KBState['filters']>) => void;
  setPagination: (pagination: Partial<KBState['pagination']>) => void;
  deleteKB: (id: string) => Promise<void>;

  // ========== 编辑页状态 ==========
  currentKB: KnowledgeBase | null;
  items: KBItemEditState[];
  editLoading: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  autoSaveEnabled: boolean;

  loadKB: (id: string) => Promise<void>;
  updateItem: (index: number, field: 'question' | 'answer', value: string) => void;
  setEditingField: (index: number, field: 'question' | 'answer' | null) => void;
  addItem: () => void;
  addItemsBatch: (count: number) => void;
  markItemDeleted: (index: number) => void;
  undoDelete: (index: number) => void;
  saveDirtyItems: () => Promise<void>;
  toggleAutoSave: () => void;
  resetEditState: () => void;
}

export const useKBStore = create<KBState>((set, get) => ({
  knowledgeBases: [],
  listLoading: false,
  filters: { keyword: '', businessAction: 'all' },
  pagination: { page: 1, pageSize: 10, total: 0 },

  fetchKBList: async () => {
    set({ listLoading: true });
    try {
      const { filters, pagination } = get();
      const res = await kbService.getAllKnowledgeTheme();
      if (res.data.status_code === 0) {
        let list = res.data.data.map(convertKnowledgeThemeToKB);
        if (filters.keyword) {
          list = list.filter((kb) => kb.name.includes(filters.keyword));
        }
        const total = list.length;
        const start = (pagination.page - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        set({
          knowledgeBases: list.slice(start, end),
          pagination: { ...pagination, total },
        });
      }
    } finally {
      set({ listLoading: false });
    }
  },

  setFilters: (newFilters) => {
    set((s) => ({ filters: { ...s.filters, ...newFilters }, pagination: { ...s.pagination, page: 1 } }));
    get().fetchKBList();
  },

  setPagination: (newPagination) => {
    set((s) => ({ pagination: { ...s.pagination, ...newPagination } }));
    get().fetchKBList();
  },

  deleteKB: async (id) => {
    await kbService.deleteKB(id);
    get().fetchKBList();
  },

  currentKB: null,
  items: [],
  editLoading: false,
  saving: false,
  lastSavedAt: null,
  autoSaveEnabled: true,

  loadKB: async (id) => {
    set({ editLoading: true });
    try {
      const [themesRes, docsRes] = await Promise.all([
        kbService.getAllKnowledgeTheme(),
        kbService.getAllDocsByTheme(id),
      ]);
      const currentKB = themesRes.data.status_code === 0
        ? themesRes.data.data
            .map(convertKnowledgeThemeToKB)
            .find((kb) => kb.id === id) ?? null
        : null;
      const items = docsRes.data.status_code === 0
        ? docsRes.data.data.map(convertKnowledgeDocToItem)
        : [];
      set({ currentKB, items });
    } finally {
      set({ editLoading: false });
    }
  },

  updateItem: (index, field, value) => {
    set((s) => {
      const newItems = [...s.items];
      newItems[index] = { ...newItems[index], [field]: value, isDirty: true };
      return { items: newItems };
    });
  },

  setEditingField: (index, field) => {
    set((s) => {
      const newItems = [...s.items];
      newItems[index] = { ...newItems[index], editingField: field };
      return { items: newItems };
    });
  },

  addItem: () => {
    set((s) => ({
      items: [
        ...s.items,
        {
          id: crypto.randomUUID(),
          question: '',
          answer: '',
          hitCount: 0,
          sortOrder: s.items.length + 1,
          isDirty: true,
          isNew: true,
          isDeleted: false,
          editingField: 'question' as const,
        },
      ],
    }));
  },

  addItemsBatch: (count) => {
    set((s) => {
      const newItems = Array.from({ length: count }, (_, i) => ({
        id: crypto.randomUUID(),
        question: '',
        answer: '',
        hitCount: 0,
        sortOrder: s.items.length + i + 1,
        isDirty: true,
        isNew: true,
        isDeleted: false,
        editingField: null as 'question' | 'answer' | null,
      }));
      if (newItems.length > 0) newItems[0].editingField = 'question';
      return { items: [...s.items, ...newItems] };
    });
  },

  markItemDeleted: (index) => {
    set((s) => {
      const newItems = [...s.items];
      newItems[index] = { ...newItems[index], isDeleted: true, isDirty: true };
      return { items: newItems };
    });
  },

  undoDelete: (index) => {
    set((s) => {
      const newItems = [...s.items];
      newItems[index] = { ...newItems[index], isDeleted: false };
      return { items: newItems };
    });
  },

  saveDirtyItems: async () => {
    const { items, currentKB, saving } = get();
    if (!currentKB || saving) return;

    const dirtyItems = items.filter((i) => i.isDirty);
    if (dirtyItems.length === 0) return;

    set({ saving: true });
    try {
      const updateItems = dirtyItems.filter((i) => !i.isNew && !i.isDeleted);
      const deleteItems = dirtyItems.filter((i) => i.isDeleted && !i.isNew);
      const createItems = dirtyItems.filter((i) => i.isNew && !i.isDeleted);
      const operator = useAuthStore.getState().user?.name || 'unknown';

      await Promise.all([
        ...updateItems.map((item) =>
          kbService.updateDoc({
            docs_id: item.id,
            docs_detail: toDocsDetail(item),
          })),
        ...deleteItems.map((item) =>
          kbService.deleteDoc({
            docs_id: item.id,
            theme_id: currentKB.id,
          })),
      ]);

      if (createItems.length > 0) {
        await kbService.createDocsBatch({
          theme_name: currentKB.name,
          operator,
          docs_detail_list: createItems.map(toDocsDetail),
        });
      }

      await get().loadKB(currentKB.id);
      set({ lastSavedAt: new Date() });
    } finally {
      set({ saving: false });
    }
  },

  toggleAutoSave: () => set((s) => ({ autoSaveEnabled: !s.autoSaveEnabled })),

  resetEditState: () => set({
    currentKB: null,
    items: [],
    editLoading: false,
    saving: false,
    lastSavedAt: null,
  }),
}));
