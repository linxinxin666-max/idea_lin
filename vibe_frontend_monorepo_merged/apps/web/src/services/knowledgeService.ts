import request from './request';
import type { KnowledgeBase, KBItem, KBItemBatchUpdate, KnowledgeTheme, KnowledgeThemeDoc } from '../types/knowledge';
import type { BusinessAction } from '../types/script';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getKBList(params: {
  page: number;
  pageSize: number;
  keyword?: string;
  businessAction?: BusinessAction;
}) {
  return request.get<{ list: KnowledgeBase[]; total: number }>('/knowledge-bases', { params });
}

export function getAllKnowledgeTheme() {
  return request.post<{ data: KnowledgeTheme[]; msg: string; status_code: number }>(
    `${API_BASE_URL}/get_all_knowledge_theme`,
    {},
  );
}

export interface DocDetail {
  triggers: string[];
  response_text: string;
}

export function createDocsBatch(data: {
  theme_name: string;
  operator: string;
  docs_detail_list: DocDetail[];
}) {
  return request.post<{ msg: string; status_code: number }>(`${API_BASE_URL}/create_docs_batch`, data);
}

export function getAllDocsByTheme(theme_id: string) {
  return request.post<{ data: KnowledgeThemeDoc[]; msg: string; status_code: number }>(
    `${API_BASE_URL}/get_all_docs_by_theme`,
    { theme_id },
  );
}

export function deleteDoc(params: { docs_id: string; theme_id: string }) {
  return request.post<{ msg?: string; status_code?: number }>(`${API_BASE_URL}/delete_docs`, params);
}

export function updateDoc(params: { docs_id: string; docs_detail: { response_text: string; triggers: string[] } }) {
  return request.post<{ msg?: string; status_code?: number }>(`${API_BASE_URL}/update_docs`, params);
}

export function deleteKnowledgeTheme(theme_id: string) {
  return request.post<string>(`${API_BASE_URL}/delete_knowledge_theme`, { theme_id });
}

export function createKB(data: {
  name: string;
  businessActions: BusinessAction[];
}) {
  return request.post<{ id: string; success: boolean }>('/knowledge-bases', data);
}

export function getKBDetail(id: string) {
  return request.get<{ knowledgeBase: KnowledgeBase; items: KBItem[] }>(`/knowledge-bases/${id}`);
}

export function updateKBInfo(id: string, data: {
  name?: string;
  businessActions?: BusinessAction[];
}) {
  return request.put<{ success: boolean }>(`/knowledge-bases/${id}`, data);
}

export function batchUpdateItems(id: string, data: KBItemBatchUpdate) {
  return request.post<{ success: boolean; upsertedCount: number; deletedCount: number }>(
    `/knowledge-bases/${id}/items/batch`,
    data,
  );
}

export function deleteKB(id: string) {
  return request.delete<{ success: boolean }>(`/knowledge-bases/${id}`);
}
