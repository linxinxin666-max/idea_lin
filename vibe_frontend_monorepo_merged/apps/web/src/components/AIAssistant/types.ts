export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageContentType =
  | 'text'
  | 'extraction'
  | 'suggestion'
  | 'completeness'
  | 'modification'
  | 'fill'
  | 'error'
  | 'reasoning'
  | 'kb_preview';

export interface ExtractionField {
  fieldKey: string;
  fieldLabel: string;
  value: unknown;
  confidence: number;
}

export interface ExtractionMetadata {
  type: 'extraction';
  extractedFields: ExtractionField[];
  canAutoFill: boolean;
}

export interface SuggestionItem {
  fieldKey: string;
  fieldLabel: string;
  currentValue?: unknown;
  suggestedValue: unknown;
  reason: string;
}

export interface SuggestionMetadata {
  type: 'suggestion';
  suggestions: SuggestionItem[];
}

export interface CompletenessSection {
  name: string;
  status: 'complete' | 'incomplete' | 'warning';
  missingFields?: string[];
  message?: string;
}

export interface CompletenessMetadata {
  type: 'completeness';
  sections: CompletenessSection[];
  overallProgress: number;
}

export interface ModificationAction {
  fieldKey: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
  actionType: 'update' | 'add' | 'remove';
}

export interface ModificationMetadata {
  type: 'modification';
  actions: ModificationAction[];
}

export interface FillMetadata {
  type: 'fill';
  actions: ModificationAction[];
  summary?: string;
}

export interface KBProposalItem {
  trigger: string;
  reply: string;
  reason: string;
}

export interface KBPreviewMetadata {
  type: 'kb_preview';
  items: KBProposalItem[];
  scriptName: string;
  selectedKBIds: string[];
}

export type MessageMetadata = ExtractionMetadata | SuggestionMetadata | CompletenessMetadata | ModificationMetadata | FillMetadata | KBPreviewMetadata;

export interface ChatMessage {
  id: string;
  role: MessageRole;
  contentType: MessageContentType;
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export type AIAssistantMode = 'create' | 'edit';

export type AIAssistantState = 'idle' | 'analyzing' | 'show_extraction' | 'show_suggestion' | 'filled';
