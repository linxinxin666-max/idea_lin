import type { KnowledgeBase, KBItem } from '../types/knowledge';

export const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: 'kb-001',
    name: '上品',
    businessActions: ['上品'],
    description: '覆盖商品上架、价格设置、引流商品等常见问题',
    itemCount: 11,
    createdBy: '张三',
    createdAt: '2026-03-15T14:30:00+08:00',
    updatedAt: '2026-03-26T14:30:00+08:00',
  },
  {
    id: 'kb-002',
    name: '团购配置',
    businessActions: ['团购配置'],
    description: '团购活动创建、审核流程及常见问题解答',
    itemCount: 2,
    createdBy: '李四',
    createdAt: '2026-03-20T10:00:00+08:00',
    updatedAt: '2026-03-25T16:00:00+08:00',
  },
  {
    id: 'kb-003',
    name: '售后处理',
    businessActions: ['售后处理'],
    description: '顾客投诉、差评回复及退款处理话术',
    itemCount: 2,
    createdBy: '王五',
    createdAt: '2026-03-22T09:00:00+08:00',
    updatedAt: '2026-03-26T11:00:00+08:00',
  },
];

export const mockKBItems: Record<string, KBItem[]> = {
  'kb-001': [
    { id: 'item-001', knowledgeBaseId: 'kb-001', question: '怎么上架团购', answer: '老板，您可以打开抖音来客，在商品管理页面点击创建商品。按提示填写商品信息、价格、库存等内容，提交审核即可。', hitCount: 10, sortOrder: 1, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-002', knowledgeBaseId: 'kb-001', question: '怎么增加在售商品数', answer: '老板，您可以打开抖音来客，在商品管理页面点击创建商品。按提示填写商品信息、价格、库存等内容，提交审核即可。', hitCount: 6, sortOrder: 2, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-003', knowledgeBaseId: 'kb-001', question: '一分钱引流商品怎么上', answer: '老板，您可以打开抖音来客，在商品管理页面点击创建商品。按提示填写商品信息、价格、库存等内容，提交审核即可。', hitCount: 5, sortOrder: 3, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-004', knowledgeBaseId: 'kb-001', question: '上架团购商品是否收费，及扣点问题', answer: '老板，上架团购商品是不收费的。平台只在核销订单后，按技术服务费比例收佣金。不同行业的服务费不一样，具体标准可以在抖音来客查看。', hitCount: 2, sortOrder: 4, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-005', knowledgeBaseId: 'kb-001', question: '一分钱引流商品有什么要求', answer: '老板，主要有这几个要求。商品属于平台允许的低价引流品，库存合理不超卖，核销有效期明确且支持到店核销，商品描述清晰。', hitCount: 2, sortOrder: 5, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-006', knowledgeBaseId: 'kb-001', question: '如何修改商品价格', answer: '老板，您可以打开抖音来客，在商品管理页面找到对应商品，点击改价即可。', hitCount: 0, sortOrder: 6, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-007', knowledgeBaseId: 'kb-001', question: '应该上架什么类型商品', answer: '老板，您不用上架太多，重点放三类就够了。一是低价引流品，用来拉新客。二是招牌套餐，突出店铺特色，主打口碑。', hitCount: 3, sortOrder: 7, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-008', knowledgeBaseId: 'kb-001', question: '哪里看商品下架原因', answer: '老板，您可以打开抖音来客，在商品管理页面找到已下架的商品，点击商品详情就能看到下架原因。常见的比如资质不全。', hitCount: 1, sortOrder: 8, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-009', knowledgeBaseId: 'kb-001', question: '商品下架原因怎么查看', answer: '老板，您可以打开抖音来客，在商品管理页面找到已下架的商品，点击商品详情就能看到下架原因。常见的比如资质不全。', hitCount: 0, sortOrder: 9, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-010', knowledgeBaseId: 'kb-001', question: '怎么开通团购功能', answer: '老板，如果您已入驻成功但无法上架团购，那么是因为平台对部分类目有入驻和上架的规范限制，这类情况我们无法为您处理。', hitCount: 4, sortOrder: 10, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
    { id: 'item-011', knowledgeBaseId: 'kb-001', question: '只能上代金券该怎么办', answer: '老板，目前会对部分类目有入驻和上架的规范限制，因此会导致只能上架代金券，这类情况我们无法为您特殊申请团购上架。', hitCount: 7, sortOrder: 11, createdAt: '2026-03-15T14:30:00+08:00', updatedAt: '2026-03-26T14:30:00+08:00' },
  ],
  'kb-002': [
    { id: 'item-101', knowledgeBaseId: 'kb-002', question: '如何创建团购活动', answer: '老板，您可以在抖音来客后台的营销活动页面，点击新建活动，选择团购类型，填写活动名称、时间、优惠力度等信息后提交审核。', hitCount: 8, sortOrder: 1, createdAt: '2026-03-20T10:00:00+08:00', updatedAt: '2026-03-25T16:00:00+08:00' },
    { id: 'item-102', knowledgeBaseId: 'kb-002', question: '团购活动审核需要多久', answer: '老板，一般情况下团购活动审核需要1-3个工作日，节假日可能会延长。审核结果会通过站内信通知您。', hitCount: 5, sortOrder: 2, createdAt: '2026-03-20T10:00:00+08:00', updatedAt: '2026-03-25T16:00:00+08:00' },
  ],
  'kb-003': [
    { id: 'item-201', knowledgeBaseId: 'kb-003', question: '顾客投诉如何处理', answer: '老板，收到投诉后请第一时间联系顾客了解情况，诚恳道歉并提出解决方案。如涉及退款，请在平台规定时间内处理，避免影响店铺评分。', hitCount: 12, sortOrder: 1, createdAt: '2026-03-22T09:00:00+08:00', updatedAt: '2026-03-26T11:00:00+08:00' },
    { id: 'item-202', knowledgeBaseId: 'kb-003', question: '如何回复差评', answer: '老板，回复差评时保持冷静和专业，感谢顾客反馈，说明改进措施。避免与顾客争论，展示您对服务质量的重视。', hitCount: 9, sortOrder: 2, createdAt: '2026-03-22T09:00:00+08:00', updatedAt: '2026-03-26T11:00:00+08:00' },
  ],
};
