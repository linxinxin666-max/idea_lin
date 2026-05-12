import { useState, useEffect } from 'react'
import type { MerchantState } from '../types'
import { getCommissionData, buildHierarchyByIndustry, isLeafRateNode, getPoiRate } from '../data/commission'
import type { IndustryHierarchy, L3Option } from '../data/commission'
import { RadioGroup } from './RadioGroup'

interface MerchantCategorySelectorProps {
  state: MerchantState
  onChange: (updates: Partial<MerchantState>) => void
}

export function MerchantCategorySelector({ state, onChange }: MerchantCategorySelectorProps) {
  const [hierarchy, setHierarchy] = useState<IndustryHierarchy | null>(null)
  const activeIndustry = state.industry || '餐饮'

  useEffect(() => {
    const data = getCommissionData()
    const h = buildHierarchyByIndustry(data.rows)
    setHierarchy(h)
  }, [])

  useEffect(() => {
    if (!hierarchy) return

    if (!state.industry) {
      onChange({ industry: '餐饮' })
      return
    }

    const root = hierarchy[activeIndustry]
    if (!root) return

    const l1Keys = Object.keys(root).sort()
    if (l1Keys.length === 0) return

    const l1 = state.categoryL1 || l1Keys[0]
    if (!state.categoryL1) {
      onChange({ categoryL1: l1 })
    }
  }, [hierarchy, state.industry, activeIndustry, state.categoryL1])

  useEffect(() => {
    if (!hierarchy || !state.industry || !state.categoryL1) return
    const root = hierarchy[state.industry]
    if (!root) return

    const l1Node = root[state.categoryL1]
    if (!l1Node) return

    const updates: Partial<MerchantState> = {}

    let l2Keys: string[] = []
    let l2Node: unknown = null

    if (!isLeafRateNode(l1Node)) {
      l2Keys = Object.keys(l1Node).sort()
      const nextL2 = l2Keys.includes(state.categoryL2) ? state.categoryL2 : l2Keys[0] || ''
      if (nextL2 && state.categoryL2 !== nextL2) {
        updates.categoryL2 = nextL2
      }
      l2Node = nextL2 ? l1Node[nextL2] : null
    } else {
      const nextL2 = '所有二级类目'
      if (state.categoryL2 !== nextL2) {
        updates.categoryL2 = nextL2
      }
      l2Node = l1Node
    }

    let l3Options: L3Option[] = []
    if (l2Node) {
      if (isLeafRateNode(l2Node)) {
        l3Options = [{ name: '所有三级类目', ...l2Node }]
      } else if (Array.isArray(l2Node)) {
        l3Options = l2Node
      }
    }

    const l3Names = l3Options.map((o) => o.name)
    const nextL3 = l3Names.includes(state.categoryL3) ? state.categoryL3 : l3Options[0]?.name || ''
    if (nextL3 && state.categoryL3 !== nextL3) {
      updates.categoryL3 = nextL3
    }

    const selectedOpt = l3Options.find((o) => o.name === nextL3)
    if (selectedOpt) {
      updates.commissionRule = selectedOpt.rule || ''
      if (selectedOpt.rule === 'poi') {
        updates.rateGroup = 0
        updates.categoryCommissionRate = 0
      } else {
        const rateGroup = selectedOpt.rate ?? 0
        updates.rateGroup = rateGroup
        updates.categoryCommissionRate = rateGroup
      }
    }

    const changed = Object.entries(updates).some(([key, value]) => state[key as keyof MerchantState] !== value)
    if (changed) {
      onChange(updates)
    }
  }, [hierarchy, state.industry, state.categoryL1, state.categoryL2, state.categoryL3])

  if (!hierarchy) return null

  const root = hierarchy[activeIndustry]
  if (!root) {
    return (
      <RadioGroup
        label="行业"
        name="merchantIndustry"
        options={[
          { value: '餐饮', label: '餐饮' },
          { value: '综合', label: '综合' },
          { value: '酒旅', label: '酒旅' },
        ]}
        value={activeIndustry}
        segmented
        onChange={(industry) =>
          onChange({
            industry,
            categoryL1: '',
            categoryL2: '',
            categoryL3: '',
            commissionRule: '',
            poiL1: '游玩',
            poiL2: '景点',
            poiL3: '其他三级类目',
          })
        }
      />
    )
  }

  const l1Keys = Object.keys(root).sort()
  const selectedL1 = state.categoryL1 || l1Keys[0] || ''
  const l1Node = root[selectedL1]

  let l2Keys: string[] = []
  let l2Node: unknown = null

  if (l1Node && !isLeafRateNode(l1Node)) {
    l2Keys = Object.keys(l1Node).sort()
    const selectedL2 = l2Keys.includes(state.categoryL2) ? state.categoryL2 : l2Keys[0]
    l2Node = selectedL2 ? l1Node[selectedL2] : null
  } else if (l1Node && isLeafRateNode(l1Node)) {
    l2Keys = ['所有二级类目']
    l2Node = l1Node
  }

  let l3Options: L3Option[] = []
  if (l2Node) {
    if (isLeafRateNode(l2Node)) {
      l3Options = [{ name: '所有三级类目', ...l2Node }]
    } else if (Array.isArray(l2Node)) {
      l3Options = l2Node
    }
  }

  const handleL1Change = (newL1: string) => {
    onChange({
      categoryL1: newL1,
      categoryL2: '',
      categoryL3: '',
    })
  }

  const handleL2Change = (newL2: string) => {
    onChange({
      categoryL2: newL2,
      categoryL3: '',
    })
  }

  const handleL3Change = (newL3: string) => {
    const selectedOpt = l3Options.find((o) => o.name === newL3)
    if (selectedOpt) {
      const updates: Partial<MerchantState> = {
        categoryL3: newL3,
        commissionRule: selectedOpt.rule || '',
      }

      if (selectedOpt.rule === 'poi') {
        updates.rateGroup = 0
        updates.categoryCommissionRate = 0
      } else {
        updates.rateGroup = selectedOpt.rate ?? 0
        updates.categoryCommissionRate = updates.rateGroup ?? 0
      }

      onChange(updates)
    }
  }

  const handleIndustryChange = (industry: string) => {
    onChange({
      industry,
      categoryL1: '',
      categoryL2: '',
      categoryL3: '',
      commissionRule: '',
      poiL1: '游玩',
      poiL2: '景点',
      poiL3: '其他三级类目',
    })
  }

  const showPoiSelector = state.commissionRule === 'poi'

  return (
    <>
      <RadioGroup
        label="行业"
        name="merchantIndustry"
        options={[
          { value: '餐饮', label: '餐饮' },
          { value: '综合', label: '综合' },
          { value: '酒旅', label: '酒旅' },
        ]}
        value={activeIndustry}
        segmented
        onChange={handleIndustryChange}
      />

      <div className="form-row form-row-span">
        <label>类目</label>
        <div className="select-group">
          <div className="select-item">
            <div className="select-label">一级类目</div>
            <select value={selectedL1} onChange={(e) => handleL1Change(e.target.value)}>
              {l1Keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="select-item">
            <div className="select-label">二级类目</div>
            <select value={(l2Keys.includes(state.categoryL2) ? state.categoryL2 : l2Keys[0]) || ''} onChange={(e) => handleL2Change(e.target.value)}>
              {l2Keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="select-item">
            <div className="select-label">三级类目</div>
            <select value={(l3Options.some((o) => o.name === state.categoryL3) ? state.categoryL3 : l3Options[0]?.name) || ''} onChange={(e) => handleL3Change(e.target.value)}>
              {l3Options.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showPoiSelector && <PoiSelector state={state} onChange={onChange} />}
    </>
  )
}

function PoiSelector({ state, onChange }: { state: MerchantState; onChange: (updates: Partial<MerchantState>) => void }) {
  const data = getCommissionData()
  const poi = data.poi

  if (!poi) return null

  const poiL1Keys = Object.keys(poi)
  const poiL2Keys = Object.keys(poi[state.poiL1] || {})
  const poiL3Keys = Object.keys((poi[state.poiL1] || {})[state.poiL2] || {})

  const handlePoiChange = (field: 'poiL1' | 'poiL2' | 'poiL3', value: string) => {
    const updates: Partial<MerchantState> = { [field]: value }

    const newPoiL1 = field === 'poiL1' ? value : state.poiL1
    const newPoiL2 = field === 'poiL2' ? value : state.poiL2
    const newPoiL3 = field === 'poiL3' ? value : state.poiL3

    const rate = getPoiRate(poi, newPoiL1, newPoiL2, newPoiL3)
    if (rate !== null) {
      updates.rateGroup = rate
      updates.categoryCommissionRate = rate
    }

    onChange(updates)
  }

  return (
    <div className="form-row form-row-span">
      <label>POI类目</label>
      <div className="select-group select-group--tight">
        <div className="select-item">
          <select value={state.poiL1} onChange={(e) => handlePoiChange('poiL1', e.target.value)}>
            {poiL1Keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="select-item">
          <select value={state.poiL2} onChange={(e) => handlePoiChange('poiL2', e.target.value)}>
            {poiL2Keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="select-item">
          <select value={state.poiL3} onChange={(e) => handlePoiChange('poiL3', e.target.value)}>
            {poiL3Keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
