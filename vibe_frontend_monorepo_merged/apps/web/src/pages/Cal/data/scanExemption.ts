export interface ScanExemptionRule {
  eligible: boolean
  reductionRate: number
}

// 来源：2026扫码免佣政策.xlsx（2026年是否参与【扫码免佣】）
const SCAN_EXEMPTION_INCLUDED: Record<string, Record<string, number>> = {
  丽人: {
    美容美体: 0.006,
    美发养发: 0.006,
    美甲美睫: 0.006,
    纹眉纹绣: 0.006,
    其他丽人: 0.006,
    纹身: 0.006,
  },
  亲子: {
    儿童乐园: 0.006,
    儿童才艺: 0.006,
    孕婴童摄影: 0.006,
    婴幼服务: 0.006,
    儿童运动: 0.006,
    早教: 0.006,
    STEAM: 0.006,
    亲子活动: 0.006,
  },
  住宿: {
    客栈民宿: 0.006,
  },
  教育培训: {
    兴趣技能培训机构: 0.006,
    职业资格培训: 0.006,
    职业技能培训: 0.006,
    家庭教育: 0.006,
    升学辅导: 0.006,
    留学移民: 0.006,
    教育院校: 0.006,
    其他教育培训: 0.006,
    '语言及留学': 0.006,
  },
  生活服务: {
    印刷摄影: 0.006,
    孕产服务: 0.006,
  },
  结婚: {
    婚纱礼服: 0.006,
    婚纱摄影: 0.006,
    彩妆造型: 0.006,
    结婚旅拍: 0.006,
    婚庆策划: 0.006,
    婚礼跟拍: 0.006,
    婚礼喜品: 0.006,
    婚车租赁: 0.006,
    司仪主持: 0.006,
    其他婚礼服务: 0.006,
  },
  运动健身: {
    球类运动: 0.006,
    健身房: 0.006,
    瑜伽: 0.006,
    游泳馆: 0.006,
    舞蹈: 0.006,
    武术搏击: 0.006,
    综合体育馆: 0.006,
    其他运动健身: 0.006,
  },
}

// 当前上翻类目选择器里有些二级类目是聚合口径，这里做映射。
const SCAN_EXEMPTION_L2_ALIAS: Record<string, Record<string, string>> = {
  丽人: {
    其他: '其他丽人',
  },
  结婚: {
    其他: '其他婚礼服务',
  },
}

// 佣金政策里是“所有二级类目”，但扫码免佣政策中该一级类目全部参与。
const SCAN_EXEMPTION_ALL_L2_INCLUDED: Record<string, number> = {
  亲子: 0.006,
  教育培训: 0.006,
  运动健身: 0.006,
}

// 佣金政策中是“所有二级类目”，但扫码免佣政策是分二级类目配置，需要展开给用户选择。
const SCAN_EXEMPTION_MIXED_L2_OPTIONS: Record<string, string[]> = {
  住宿: ['酒店宾馆', '境内酒景套餐', '客栈民宿', '境外酒景套餐', '境外酒店', '其他住宿'],
}

export function getScanExemptionL2OptionsForL1(l1: string): string[] {
  const level1 = String(l1 || '').trim()
  return SCAN_EXEMPTION_MIXED_L2_OPTIONS[level1] || []
}

export function getScanExemptionRule(l1: string, l2: string): ScanExemptionRule {
  const level1 = String(l1 || '').trim()
  const level2 = String(l2 || '').trim()
  if (!level1 || !level2) {
    return { eligible: false, reductionRate: 0 }
  }

  if (level2 === '所有二级类目') {
    const rate = SCAN_EXEMPTION_ALL_L2_INCLUDED[level1] ?? 0
    return rate > 0 ? { eligible: true, reductionRate: rate } : { eligible: false, reductionRate: 0 }
  }

  const mappedL2 = SCAN_EXEMPTION_L2_ALIAS[level1]?.[level2] || level2
  const rate = SCAN_EXEMPTION_INCLUDED[level1]?.[mappedL2] ?? 0
  return rate > 0 ? { eligible: true, reductionRate: rate } : { eligible: false, reductionRate: 0 }
}
