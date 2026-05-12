import { AgentCall } from '../types/agentCall';

export const mockAgentCalls: AgentCall[] = [
  {
    id: '1',
    name: 'Fornax Analytics',
    description: '数据分析与可视化代理',
    creator: 'wangjunjie',
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Code Agent',
    description: '代码生成与审查代理',
    creator: 'admin',
    createdAt: '2026-02-28T15:30:00Z'
  },
  {
    id: '3',
    name: 'Customer Support',
    description: '客户支持自动化代理',
    creator: 'support',
    createdAt: '2026-03-02T09:15:00Z'
  },
  {
    id: '4',
    name: 'Project Manager',
    description: '项目管理与协调代理',
    creator: 'pm',
    createdAt: '2026-02-25T14:45:00Z'
  }
];

export const configUrls = {
  fornaxConfigUrl: 'https://config.fornax.example.com',
  agentConfigUrl: 'https://config.agent.example.com',
  scriptConfigUrl: 'https://config.script.example.com',
  productivityPlatformConfigUrl: 'https://config.productivity.example.com'
};
