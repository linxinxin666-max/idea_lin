import type { BusinessAction } from './script';

export interface KnowledgeBase {
  id: string;
  name: string;
  businessActions: BusinessAction[];
  description?: string;
  itemCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeTheme {
  create_time: string;
  id: number;
  is_deleted: number;
  theme_creator: string;
  theme_desc: string;
  theme_docs_cnt: number;
  theme_id: string;
  theme_name: string;
  update_time: string;
}

export interface KnowledgeThemeDocDetail {
  response_text: string;
  triggers: string[];
}

export interface KnowledgeThemeDoc {
  create_time: string;
  docs_detail: KnowledgeThemeDocDetail;
  docs_id: string;
  id: number;
  is_deleted: number;
  theme_id: string;
  update_time: string;
}

export interface KBItem {
  id: string;
  knowledgeBaseId: string;
  question: string;
  answer: string;
  hitCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface KBItemEditState {
  id: string;
  question: string;
  answer: string;
  hitCount: number;
  sortOrder: number;
  isDirty: boolean;
  isNew: boolean;
  isDeleted: boolean;
  editingField: 'question' | 'answer' | null;
}

export interface KBItemBatchUpdate {
  upserts: {
    id?: string;
    question: string;
    answer: string;
    sortOrder: number;
  }[];
  deletes: string[];
}
