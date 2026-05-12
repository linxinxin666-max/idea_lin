import type { CommissionData, CommissionRow, PoiRates, CommissionPolicy } from '../types'

export const LOCAL_COMMISSION_POLICY: CommissionPolicy = {
  name: '生活服务-2026年商家佣金政策-V1.0',
  effective_date: '2026-01-01',
  version: 'V1.0',
  published_date: '2025-12-18',
  material_id: 'LS-MP-2601-001',
}

export const LOCAL_COMMISSION_ROWS: CommissionRow[] = [
  { l1: '美食', l2: '所有二级类目', l3: '所有三级类目', rate: 0.025 },
  { l1: '休闲娱乐', l2: '洗浴按摩', l3: '足疗按摩', rate: 0.06, rate_card: 0.04 },
  { l1: '休闲娱乐', l2: '洗浴按摩', l3: '其他三级类目', rate: 0.07, rate_card: 0.05 },
  { l1: '休闲娱乐', l2: '酒吧', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '休闲娱乐', l2: '新奇体验', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '休闲娱乐', l2: '户外玩乐', l3: '采摘/农家乐', rate: 0.05, rate_card: 0.05 },
  { l1: '休闲娱乐', l2: '户外玩乐', l3: '其他三级类目', rate: 0.07, rate_card: 0.07 },
  { l1: '休闲娱乐', l2: '传统娱乐', l3: '游戏厅', rate: 0.05, rate_card: 0.05 },
  { l1: '休闲娱乐', l2: '传统娱乐', l3: '其他三级类目', rate: 0.07, rate_card: 0.07 },
  { l1: '休闲娱乐', l2: '推理/桌游', l3: '轰趴馆', rate: 0.05, rate_card: 0.05 },
  { l1: '休闲娱乐', l2: '推理/桌游', l3: '其他三级类目', rate: 0.07, rate_card: 0.07 },
  { l1: '休闲娱乐', l2: '电影', l3: '所有三级类目', rate: 0.035, rate_card: 0.035 },
  { l1: '休闲娱乐', l2: '演出', l3: '所有三级类目', rate: 0.035, rate_card: 0.035 },
  { l1: '休闲娱乐', l2: '其他', l3: '所有三级类目', rate: 0.07, rate_card: 0.07 },
  { l1: '丽人', l2: '医疗美容', l3: '所有三级类目', rate: 0.1, rate_card: 0.1 },
  { l1: '丽人', l2: '纹眉纹绣', l3: '所有三级类目', rate: 0.07, rate_card: 0.05 },
  { l1: '丽人', l2: '美容美体', l3: '身材塑形', rate: 0.1, rate_card: 0.05 },
  { l1: '丽人', l2: '美容美体', l3: '其他三级类目', rate: 0.07, rate_card: 0.05 },
  { l1: '丽人', l2: '美发养发', l3: '所有三级类目', rate: 0.06, rate_card: 0.04 },
  { l1: '丽人', l2: '美甲美睫', l3: '所有三级类目', rate: 0.07, rate_card: 0.07 },
  { l1: '丽人', l2: '其他', l3: '所有三级类目', rate: 0.07, rate_card: 0.07 },
  { l1: '购物', l2: '眼镜', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '购物', l2: '鲜花绿植', l3: '鲜花绿植', rate: 0.15, rate_card: 0.15 },
  { l1: '购物', l2: '鲜花绿植', l3: '其他三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '购物', l2: '服饰鞋帽', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '购物', l2: '运动户外', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '购物', l2: '酒水饮料', l3: '所有三级类目', rate: 0.025, rate_card: 0.025 },
  { l1: '购物', l2: '休闲食品', l3: '所有三级类目', rate: 0.025, rate_card: 0.025 },
  { l1: '购物', l2: '果蔬生鲜', l3: '所有三级类目', rate: 0.025, rate_card: 0.025 },
  { l1: '购物', l2: '母婴用品', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '购物', l2: '美妆个护', l3: '所有三级类目', rate: 0.04, rate_card: 0.04 },
  { l1: '购物', l2: '免税店', l3: '所有三级类目', rate: 0.01, rate_card: 0.01 },
  { l1: '购物', l2: '综合商场', l3: '所有三级类目', rate: 0.06, rate_card: 0.06 },
  { l1: '购物', l2: '日用商超', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '购物', l2: '日用百货', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '购物', l2: '农林畜牧渔', l3: '动物饲料添加剂', rate: 0.05, rate_card: 0.05 },
  { l1: '购物', l2: '农林畜牧渔', l3: '其他三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '购物', l2: '珠宝首饰', l3: '珠宝定制', rate: 0.05, rate_card: 0.05 },
  { l1: '购物', l2: '珠宝首饰', l3: '其他三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '购物', l2: '数码3C', l3: '所有三级类目', rate: 0.02, rate_card: 0.02 },
  { l1: '购物', l2: '其他', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '运动健身', l2: '所有二级类目', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '教育培训', l2: '所有二级类目', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '宠物', l2: '所有二级类目', l3: '所有三级类目', rate: 0.06, rate_card: 0.06 },
  { l1: '亲子', l2: '所有二级类目', l3: '所有三级类目', rate: 0.05, rate_card: 0.03 },
  { l1: '结婚', l2: '婚纱摄影', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '结婚', l2: '结婚旅拍', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '结婚', l2: '婚宴', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '结婚', l2: '婚纱礼服', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '结婚', l2: '婚庆策划', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '结婚', l2: '其他', l3: '所有三级类目', rate: 0.06, rate_card: 0.06 },
  { l1: '医疗健康', l2: '健康服务', l3: '体检服务', rate: 0.07, rate_card: 0.07 },
  { l1: '医疗健康', l2: '健康服务', l3: '其他三级类目', rate: 0.1, rate_card: 0.1 },
  { l1: '医疗健康', l2: '疫苗服务', l3: '所有三级类目', rate: 0.04, rate_card: 0.04 },
  { l1: '医疗健康', l2: '日化用品', l3: '所有三级类目', rate: 0.04, rate_card: 0.04 },
  { l1: '医疗健康', l2: '营养食品', l3: '保健食品', rate: 0.05, rate_card: 0.05 },
  { l1: '医疗健康', l2: '营养食品', l3: '其他三级类目', rate: 0.04, rate_card: 0.04 },
  { l1: '医疗健康', l2: '其他', l3: '所有三级类目', rate: 0.1, rate_card: 0.1 },
  { l1: '生活服务', l2: '汽车服务', l3: '加油站', rate: 0.01, rate_card: 0.01 },
  { l1: '生活服务', l2: '汽车服务', l3: '加气站', rate: 0.01, rate_card: 0.01 },
  { l1: '生活服务', l2: '汽车服务', l3: '汽车养护-到店', rate: 0.08, rate_card: 0.06 },
  { l1: '生活服务', l2: '汽车服务', l3: '汽车养护-到家', rate: 0.08, rate_card: 0.06 },
  { l1: '生活服务', l2: '汽车服务', l3: '洗车', rate: 0.08, rate_card: 0.06 },
  { l1: '生活服务', l2: '汽车服务', l3: '其他三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '生活服务', l2: '搬家运输', l3: '快递服务', rate: 0.03, rate_card: 0.03 },
  { l1: '生活服务', l2: '搬家运输', l3: '其他三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '生活服务', l2: '其他', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '二手商品', l2: '二手奢侈品', l3: '二手钟表', rate: 0.02, rate_card: 0.02 },
  { l1: '二手商品', l2: '二手奢侈品', l3: '二手珠宝', rate: 0.03, rate_card: 0.03 },
  { l1: '二手商品', l2: '二手奢侈品', l3: '二手服饰配件', rate: 0.03, rate_card: 0.03 },
  { l1: '二手商品', l2: '二手奢侈品', l3: '其他三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '家居家装', l2: '装修设计', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '家居家装', l2: '家用电器', l3: '所有三级类目', rate: 0.02, rate_card: 0.02 },
  { l1: '家居家装', l2: '其他', l3: '所有三级类目', rate: 0.03, rate_card: 0.03 },
  { l1: '其他', l2: '所有二级类目', l3: '所有三级类目', rate: 0.05, rate_card: 0.05 },
  { l1: '住宿', l2: '所有二级类目', l3: '所有三级类目', rate: 0.08 },
  { l1: '游玩', l2: '境外票务', l3: '所有三级类目', rate: 0.03 },
  { l1: '游玩', l2: '港澳票务', l3: '所有三级类目', rate: 0.03 },
  { l1: '游玩', l2: '境内游玩商品', l3: '所有三级类目', rule: 'poi' },
  { l1: '度假旅游服务', l2: '境内目的地玩乐', l3: '所有三级类目', rate: 0.06 },
  { l1: '度假旅游服务', l2: '境内行程游', l3: '所有三级类目', rate: 0.05 },
  { l1: '度假旅游服务', l2: '出境目的地玩乐', l3: '所有三级类目', rate: 0.04 },
  { l1: '度假旅游服务', l2: '出境行程游', l3: '所有三级类目', rate: 0.04 },
  { l1: '度假旅游服务', l2: '签证', l3: '所有三级类目', rate: 0.03 },
  { l1: '度假旅游服务', l2: '邮轮', l3: '所有三级类目', rate: 0.05 },
  { l1: '交通出行', l2: '机票', l3: '国内机票', rate: 0.015 },
  { l1: '交通出行', l2: '机票', l3: '国内机票套票', rate: 0.015 },
  { l1: '交通出行', l2: '机票', l3: '国际及港澳台机票', rate: 0.02 },
  { l1: '交通出行', l2: '机票', l3: '国际及港澳台机票套票', rate: 0.02 },
  { l1: '交通出行', l2: '增值服务', l3: '所有三级类目', rate: 0.02 },
  { l1: '交通出行', l2: '机票打包商品', l3: '所有三级类目', rate: 0.02 },
  { l1: '交通出行', l2: '地上交通', l3: '所有三级类目', rate: 0.015 },
  { l1: '交通出行', l2: '地铁票务', l3: '所有三级类目', rate: 0.015 },
]

export const LOCAL_POI_RATES: PoiRates = {
  游玩: {
    景点: {
      人文古迹: 0.04,
      自然景观: 0.04,
      '古镇/古村': 0.04,
      '其他三级类目': 0.05,
    },
    泛主题乐园: {
      '所有三级类目': 0.06,
    },
    其他: {
      '其他三级类目': 0.05,
    },
  },
  其他: {
    所有二级类目: {
      '所有三级类目': 0.05,
    },
  },
}

export const getCommissionData = (): CommissionData => ({
  policy: LOCAL_COMMISSION_POLICY,
  rows: LOCAL_COMMISSION_ROWS,
  poi: LOCAL_POI_RATES,
})

export const getIndustryForL1 = (l1: string): string | null => {
  if (['美食'].includes(l1)) return '餐饮'
  if (['休闲娱乐', '丽人', '购物', '运动健身', '教育培训', '宠物', '亲子', '结婚', '医疗健康', '生活服务', '二手商品', '家居家装', '其他'].includes(l1)) return '综合'
  if (['住宿', '游玩', '度假旅游服务', '交通出行'].includes(l1)) return '酒旅'
  return null
}

export interface L3Option {
  name: string
  rate?: number
  rate_card?: number
  rule?: string
}

export interface HierarchyNode {
  [l2: string]: L3Option[] | { rate?: number; rate_card?: number; rule?: string }
}

export interface IndustryHierarchy {
  [industry: string]: {
    [l1: string]: HierarchyNode | { rate?: number; rate_card?: number; rule?: string }
  }
}

export const buildHierarchyByIndustry = (rows: CommissionRow[]): IndustryHierarchy => {
  const hierarchy: IndustryHierarchy = { 餐饮: {}, 综合: {}, 酒旅: {} }
  
  rows.forEach((row) => {
    const industry = getIndustryForL1(row.l1)
    if (!industry) return
    
    const l1 = row.l1
    const l2 = row.l2
    const l3 = row.l3
    
    if (l2 === '所有二级类目') {
      hierarchy[industry][l1] = { rate: row.rate, rate_card: row.rate_card, rule: row.rule }
      return
    }
    
    if (!hierarchy[industry][l1] || 'rate' in hierarchy[industry][l1]) {
      if (!hierarchy[industry][l1]) {
        hierarchy[industry][l1] = {}
      }
    }
    
    const l1Node = hierarchy[industry][l1]
    if ('rate' in l1Node) return
    
    if (l3 === '所有三级类目') {
      l1Node[l2] = { rate: row.rate, rate_card: row.rate_card, rule: row.rule }
      return
    }
    
    if (!Array.isArray(l1Node[l2])) {
      l1Node[l2] = []
    }
    ;(l1Node[l2] as L3Option[]).push({
      name: l3,
      rate: row.rate,
      rate_card: row.rate_card,
      rule: row.rule,
    })
  })
  
  return hierarchy
}

export const isLeafRateNode = (node: unknown): node is { rate?: number; rate_card?: number; rule?: string } => {
  return !!node && typeof node === 'object' && !Array.isArray(node) && ('rate' in node || 'rule' in node)
}

export const getPoiRate = (poi: PoiRates, poiL1: string, poiL2: string, poiL3: string): number | null => {
  const l1Node = poi?.[poiL1]
  const l2Node = l1Node?.[poiL2]
  const rate = l2Node?.[poiL3]
  return typeof rate === 'number' ? rate : null
}
