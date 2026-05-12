import type { Script } from '../types/script';

export const mockScripts: Script[] = [
  {
    id: '1',
    name: '新客户首次触达话术',
    businessAction: '新开',
    identity: '抖音官方客服',
    retentionLevel: '轻度',
    dialogStyle: '热情',
    opening: {
      mode: 'template',
      templateId: '1',
      content: '您好，我是抖音来客的官方客服！'
    },
    coreContent: {
      mode: 'manual',
      items: [
        { id: '1', contentType: 'info_notify', content: '介绍平台优势' },
        { id: '2', contentType: 'intent_inspire', content: '引导完成入驻' }
      ]
    },
    closing: {
      mode: 'template',
      templateId: '1',
      content: '感谢您的耐心聆听，祝您生意兴隆！'
    },
    skillType: 'sms',
    triggerIntent: '高意向',
    status: 'online',
    createdBy: '张三',
    createdAt: '2026-03-15T14:30:00Z',
    updatedAt: '2026-03-20T09:15:00Z'
  },
  {
    id: '2',
    name: '老客户挽回计划 v2',
    businessAction: '促三品',
    identity: '生活服务运营',
    retentionLevel: '重度',
    dialogStyle: '温和',
    opening: {
      mode: 'manual',
      content: '老板好，我是生活服务运营专员！'
    },
    coreContent: {
      mode: 'manual',
      items: [
        { id: '1', contentType: 'info_notify', content: '分析店铺现状' },
        { id: '2', contentType: 'info_verify', content: '提供优化建议', question: '您对这些建议感兴趣吗？' }
      ]
    },
    closing: {
      mode: 'manual',
      content: '期待您的店铺越来越好！'
    },
    skillType: 'wecom',
    triggerIntent: '中意向',
    status: 'online',
    createdBy: '李四',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-18T16:45:00Z'
  },
  {
    id: '3',
    name: '春节活动推广话术',
    businessAction: '活动报名',
    identity: '抖音官方客服',
    retentionLevel: '均衡',
    dialogStyle: '热情',
    opening: {
      mode: 'manual',
      content: '老板好！春节活动来啦！'
    },
    coreContent: {
      mode: 'manual',
      items: [
        { id: '1', contentType: 'info_notify', content: '介绍春节活动' }
      ]
    },
    closing: {
      mode: 'manual',
      content: '祝您春节快乐！'
    },
    skillType: 'none',
    status: 'offline',
    createdBy: '王五',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-05T11:20:00Z'
  },
  {
    id: '4',
    name: '店铺装修建议话术',
    businessAction: '店铺装修',
    identity: '生活服务运营',
    retentionLevel: '均衡',
    dialogStyle: '自然',
    opening: {
      mode: 'manual',
      content: '您好，我注意到您的店铺还有优化空间！'
    },
    coreContent: {
      mode: 'initial',
      direction: '引导商家优化店铺',
      items: []
    },
    closing: {
      mode: 'manual',
      content: '希望这些建议对您有帮助！'
    },
    skillType: 'none',
    status: 'draft',
    createdBy: '赵六',
    createdAt: '2026-03-22T15:30:00Z',
    updatedAt: '2026-03-22T15:30:00Z'
  },
  {
    id: '5',
    name: '会员权益升级通知',
    businessAction: '权益开通',
    identity: '抖音官方客服',
    retentionLevel: '重度',
    dialogStyle: '热情',
    opening: {
      mode: 'manual',
      content: '恭喜您！您的会员等级已升级！'
    },
    coreContent: {
      mode: 'manual',
      items: [
        { id: '1', contentType: 'info_notify', content: '通知会员升级' },
        { id: '2', contentType: 'intent_inspire', content: '介绍新权益' }
      ]
    },
    closing: {
      mode: 'manual',
      content: '感谢您的支持！'
    },
    skillType: 'sms',
    triggerIntent: '高意向',
    status: 'online',
    createdBy: '张三',
    createdAt: '2026-03-19T11:20:00Z',
    updatedAt: '2026-03-21T14:00:00Z'
  }
];
