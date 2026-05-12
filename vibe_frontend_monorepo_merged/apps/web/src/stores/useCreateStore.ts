import { create } from 'zustand';
import type { 
  IdentityType, 
  RetentionLevel, 
  DialogStyle, 
  SkillType, 
  TriggerIntent,
  ContentType,
  CoreContentItem
} from '../types/script';

export type ContentMode = 'initial' | 'case' | 'manual';

export interface CaseItem {
  id: string;
  type: ContentType;
  content: string;
  parseItems?: ParseItem[];
  selected: boolean;
}

export interface ParseItem {
  question: string;
  tags: string[];
}

export interface CreateFormState {
  name: string;
  businessAction: string;
  businessBehaviors: string[];
  identity: IdentityType;
  retentionLevel: RetentionLevel;
  dialogStyle: DialogStyle;
  openingRemarks: string;
  openingRemarksMode: 'template' | 'manual';
  closingRemarks: string;
  closingRemarksMode: 'template' | 'manual';
  coreContents: { content: string; type: string; parseItems?: ParseItem[] }[];
  contentMode: ContentMode;
  skillType: SkillType;
  triggerIntents: TriggerIntent[];
  triggerIntentMode: 'all' | 'by_parse_value'; // 触发意向模式
  triggerContentIndex: number | null;    // 选中的核心内容序号
  triggerParseValues: string[];          // 选中的解析值
  triggerContent: string;                // 触发内容文本
  selectedKBIds: string[];               // 关联知识库 ID 列表
}

export interface CreateState {
  currentStep: number;
  visitedSteps: number[];
  form: CreateFormState;
  isSubmitting: boolean;
  direction: string;
  isLoadingCases: boolean;
  caseItems: CaseItem[];
  scriptId: number | null;

  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateForm: <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => void;
  setDirection: (direction: string) => void;
  setIsLoadingCases: (loading: boolean) => void;
  setCaseItems: (items: CaseItem[]) => void;
  toggleCaseSelection: (id: string) => void;
  
  addCoreContent: () => void;
  removeCoreContent: (index: number) => void;
  updateCoreContent: (index: number, content: Partial<{ content: string; type: string; parseItems?: ParseItem[] }>) => void;
  addParseItem: (contentIndex: number) => void;
  removeParseItem: (contentIndex: number, parseIndex: number) => void;
  updateParseItemQuestion: (contentIndex: number, parseIndex: number, question: string) => void;
  addParseItemTag: (contentIndex: number, parseIndex: number, tag: string) => void;
  removeParseItemTag: (contentIndex: number, parseIndex: number, tagIndex: number) => void;
  
  setContentMode: (mode: ContentMode) => void;
  applySelectedCases: () => void;
  
  setIsSubmitting: (submitting: boolean) => void;
  setScriptId: (id: number | null) => void;
  resetForm: () => void;
}

const initialFormState: CreateFormState = {
  name: '',
  businessAction: '',
  businessBehaviors: [],
  identity: '抖音官方客服',
  retentionLevel: '均衡',
  dialogStyle: '自然',
  openingRemarks: '',
  openingRemarksMode: 'template',
  closingRemarks: '',
  closingRemarksMode: 'template',
  coreContents: [],
  contentMode: 'initial',
  skillType: 'none',
  triggerIntents: [],
  triggerIntentMode: 'all',
  triggerContentIndex: null,
  triggerParseValues: [],
  triggerContent: '',
  selectedKBIds: [],
};

export const useCreateStore = create<CreateState>((set, get) => ({
  currentStep: 0,
  visitedSteps: [],
  form: initialFormState,
  isSubmitting: false,
  direction: '',
  isLoadingCases: false,
  caseItems: [],
  scriptId: null,

  setCurrentStep: (step) => set((state) => ({
    currentStep: step,
    visitedSteps: state.visitedSteps.includes(state.currentStep)
      ? state.visitedSteps
      : [...state.visitedSteps, state.currentStep],
  })),
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, 5),
    visitedSteps: state.visitedSteps.includes(state.currentStep)
      ? state.visitedSteps
      : [...state.visitedSteps, state.currentStep],
  })),
  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0),
    visitedSteps: state.visitedSteps.includes(state.currentStep)
      ? state.visitedSteps
      : [...state.visitedSteps, state.currentStep],
  })),
  
  updateForm: (key, value) => set((state) => ({
    form: { ...state.form, [key]: value }
  })),
  
  setDirection: (direction) => set({ direction }),
  setIsLoadingCases: (loading) => set({ isLoadingCases: loading }),
  
  setCaseItems: (items) => set({ caseItems: items }),
  
  toggleCaseSelection: (id) => set((state) => ({
    caseItems: state.caseItems.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : { ...item, selected: false }
    )
  })),
  
  addCoreContent: () => set((state) => ({
    form: {
      ...state.form,
      coreContents: [
        ...state.form.coreContents,
        { content: '', type: '意向激发类', parseItems: [] }
      ]
    }
  })),
  
  removeCoreContent: (index) => set((state) => ({
    form: {
      ...state.form,
      coreContents: state.form.coreContents.filter((_, i) => i !== index)
    }
  })),
  
  updateCoreContent: (index, content) => set((state) => ({
    form: {
      ...state.form,
      coreContents: state.form.coreContents.map((item, i) =>
        i === index ? { ...item, ...content } : item
      )
    }
  })),
  
  addParseItem: (contentIndex) => set((state) => {
    const newCoreContents = [...state.form.coreContents];
    const content = newCoreContents[contentIndex];
    if (content) {
      newCoreContents[contentIndex] = {
        ...content,
        parseItems: [...(content.parseItems || []), { question: '', tags: ['商家原声'] }]
      };
    }
    return {
      form: {
        ...state.form,
        coreContents: newCoreContents
      }
    };
  }),
  
  removeParseItem: (contentIndex, parseIndex) => set((state) => {
    const newCoreContents = [...state.form.coreContents];
    const content = newCoreContents[contentIndex];
    if (content && content.parseItems) {
      newCoreContents[contentIndex] = {
        ...content,
        parseItems: content.parseItems.filter((_, i) => i !== parseIndex)
      };
    }
    return {
      form: {
        ...state.form,
        coreContents: newCoreContents
      }
    };
  }),
  
  updateParseItemQuestion: (contentIndex, parseIndex, question) => set((state) => {
    const newCoreContents = [...state.form.coreContents];
    const content = newCoreContents[contentIndex];
    if (content && content.parseItems && content.parseItems[parseIndex]) {
      newCoreContents[contentIndex] = {
        ...content,
        parseItems: content.parseItems.map((item, i) =>
          i === parseIndex ? { ...item, question } : item
        )
      };
    }
    return {
      form: {
        ...state.form,
        coreContents: newCoreContents
      }
    };
  }),
  
  addParseItemTag: (contentIndex, parseIndex, tag) => set((state) => {
    const newCoreContents = [...state.form.coreContents];
    const content = newCoreContents[contentIndex];
    if (content && content.parseItems && content.parseItems[parseIndex]) {
      const parseItem = content.parseItems[parseIndex];
      if (!parseItem.tags.includes(tag)) {
        newCoreContents[contentIndex] = {
          ...content,
          parseItems: content.parseItems.map((item, i) =>
            i === parseIndex ? { ...item, tags: [...item.tags, tag] } : item
          )
        };
      }
    }
    return {
      form: {
        ...state.form,
        coreContents: newCoreContents
      }
    };
  }),
  
  removeParseItemTag: (contentIndex, parseIndex, tagIndex) => set((state) => {
    const newCoreContents = [...state.form.coreContents];
    const content = newCoreContents[contentIndex];
    if (content && content.parseItems && content.parseItems[parseIndex]) {
      newCoreContents[contentIndex] = {
        ...content,
        parseItems: content.parseItems.map((item, i) =>
          i === parseIndex ? { ...item, tags: item.tags.filter((_, ti) => ti !== tagIndex) } : item
        )
      };
    }
    return {
      form: {
        ...state.form,
        coreContents: newCoreContents
      }
    };
  }),
  
  setContentMode: (mode) => set((state) => ({
    form: { ...state.form, contentMode: mode }
  })),
  
  applySelectedCases: () => {
    const state = get();
    const selectedCases = state.caseItems.filter(item => item.selected);
    const newCoreContents = selectedCases.map(item => ({
      content: item.content,
      type: item.type === 'info_notify' ? '信息通知类' : 
            item.type === 'info_verify' ? '信息核实类' : 
            item.type === 'intent_inspire' ? '意向激发类' : item.type,
      parseItems: item.parseItems || []
    }));
    set({
      form: {
        ...state.form,
        coreContents: [...state.form.coreContents, ...newCoreContents],
        contentMode: 'manual'
      }
    });
  },
  
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  
  setScriptId: (id) => set({ scriptId: id }),
  
  resetForm: () => set({
    currentStep: 0,
    visitedSteps: [],
    form: { ...initialFormState, triggerIntentMode: 'all', triggerContentIndex: null, triggerParseValues: [], triggerContent: '' },
    direction: '',
    caseItems: [],
    scriptId: null
  }),
}));
