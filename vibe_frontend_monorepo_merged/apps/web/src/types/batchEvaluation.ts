export interface AccountInfo {
  account_name: string;
  category: string;
}

export interface ChatScoreDetailItem {
  applicable_behaviors: string[];
  behavior_check: string;
  evidence: string;
  reason: string;
  score: number;
  suggestion: string;
}

export interface ChatScoreDetail {
  [dimensionName: string]: ChatScoreDetailItem;
}

export interface ChatScoreFinal {
  不适用维度: number;
  严重度: string;
  严重度原因: string;
  总分: number;
  有效维度数: number;
  零分维度: number;
}

export interface MockChatResult {
  account_info: AccountInfo;
  chat_score_detail: ChatScoreDetail;
  chat_score_final: ChatScoreFinal;
  chat_text: string;
  merchant_identity: string;
  chat_type: string;
}

export interface GetMockChatResultResponse {
  status_code: number;
  msg: string;
  data: MockChatResult[];
}
