export interface ScriptMetrics {
  totalCalls: number;
  connectRate: number;
  avgDuration: number;
  scriptScore: number;
  trends: {
    totalCalls: number;
    connectRate: number;
    avgDuration: number;
    scriptScore: number;
  };
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface IntentDistribution {
  highIntent: number;
  mediumIntent: number;
  lowIntent: number;
}

export interface CallRecord {
  id: string;
  scriptId: string;
  callTime: string;
  duration: number;
  intent: '高意向' | '中意向' | '低意向';
  score: number;
  hasAudio: boolean;
}

export interface DialogueItem {
  role: 'agent' | 'user';
  content: string;
  timestamp: number;
}

export interface EvaluationDimension {
  name: string;
  status: 'pass' | 'partial' | 'fail';
  detail?: string;
}

export interface CallEvaluation {
  totalScore: number;
  dimensions: EvaluationDimension[];
}

export interface IntentAnalysis {
  finalIntent: '高意向' | '中意向' | '低意向';
  keySignal: string;
  intentChanges: ('低意向' | '中意向' | '高意向')[];
  conversionPoint?: number;
}

export interface CallDetail extends CallRecord {
  audioUrl?: string;
  dialogues: DialogueItem[];
  evaluation: CallEvaluation;
  intentAnalysis: IntentAnalysis;
}

export interface CallListParams {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
}

export interface CallListResponse {
  list: CallRecord[];
  total: number;
}
