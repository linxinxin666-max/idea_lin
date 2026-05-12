export interface AgentCallConfig {
  closingRemarks: string;
  conversationStyle: 'gentle' | 'enthusiastic' | 'natural';
  coreContents: string[];
  identity: 'douyin_offical_customer_service' | 'life_service_operation' | 'normal_user';
  openingRemarks: string;
  retentionLevel: 'mild' | 'balanced' | 'severe';
  skillType: string;
  triggerIntents: string[];
}

export interface AgentCallExtra {
  agent_id?: string;
  agent_script_id?: string;
  flow_code: string;
  fornax_key: string;
  prompt_id?: string;
  script_id: string;
}

export interface AgentCall {
  add_time: string;
  agent_call_config: AgentCallConfig;
  creator: string;
  extra: AgentCallExtra;
  id: number;
  name: string;
  pe_text: string;
}
