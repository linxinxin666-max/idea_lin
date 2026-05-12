import { useEffect, useState } from 'react'
import type { UpflipState } from '../types'
import { buildHierarchyByIndustry, getCommissionData, getPoiRate, isLeafRateNode } from '../data/commission'
import type { IndustryHierarchy, L3Option } from '../data/commission'
import { getScanExemptionL2OptionsForL1 } from '../data/scanExemption'
import { RadioGroup } from './RadioGroup'

interface UpflipCategorySelectorProps {
  state: UpflipState
  onChange: (updates: Partial<UpflipState>) => void
}

export function UpflipCategorySelector({ state, onChange }: UpflipCategorySelectorProps) {
  const [hierarchy, setHierarchy] = useState<IndustryHierarchy | null>(null)
  const activeIndustry = state.industry || '餐饮'

  useEffect(() => {
    const data = getCommissionData()
    setHierarchy(buildHierarchyByIndustry(data.rows))
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
    if (!state.categoryL1) onChange({ categoryL1: l1Keys[0] })
  }, [hierarchy, activeIndustry, state.industry, state.categoryL1])

  useEffect(() => {
    if (!hierarchy || !state.industry || !state.categoryL1) return
    const root = hierarchy[state.industry]
    if (!root) return

    const l1Node = root[state.categoryL1]
    if (!l1Node) return

    const updates: Partial<UpflipState> = {}
    let l2Node: unknown = null

    if (!isLeafRateNode(l1Node)) {
      const l2Keys = Object.keys(l1Node).sort()
      const nextL2 = l2Keys.includes(state.categoryL2) ? state.categoryL2 : l2Keys[0] || ''
      if (nextL2 && state.categoryL2 !== nextL2) updates.categoryL2 = nextL2
      l2Node = nextL2 ? l1Node[nextL2] : null
    } else {
      const policyL2Options = getScanExemptionL2OptionsForL1(state.categoryL1)
      const l2Candidates = policyL2Options.length > 0 ? policyL2Options : ['所有二级类目']
      const nextL2 = l2Candidates.includes(state.categoryL2) ? state.categoryL2 : l2Candidates[0]
      if (state.categoryL2 !== nextL2) updates.categoryL2 = nextL2
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
    if (nextL3 && state.categoryL3 !== nextL3) updates.categoryL3 = nextL3

    const selectedOpt = l3Options.find((o) => o.name === nextL3)
    if (selectedOpt) {
      updates.commissionRule = selectedOpt.rule || ''
      const recommendedRate = selectedOpt.rule === 'poi' ? 0 : selectedOpt.rate ?? 0
      updates.rateGroup = recommendedRate

      // Keep manual edits. Only sync commissionRate from category when user has not edited it.
      if (!state.commissionRateEdited) {
        updates.commissionRate = recommendedRate
      }
    }

    const changed = Object.entries(updates).some(([key, value]) => state[key as keyof UpflipState] !== value)
    if (changed) onChange(updates)
  }, [hierarchy, state.industry, state.categoryL1, state.categoryL2, state.categoryL3, state.commissionRateEdited])

  if (!hierarchy) return null

  const root = hierarchy[activeIndustry]
  if (!root) return null

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
    const policyL2Options = getScanExemptionL2OptionsForL1(selectedL1)
    l2Keys = policyL2Options.length > 0 ? policyL2Options : ['所有二级类目']
    l2Node = l1Node
  }

  let l3Options: L3Option[] = []
  if (l2Node) {
    if (isLeafRateNode(l2Node)) l3Options = [{ name: '所有三级类目', ...l2Node }]
    else if (Array.isArray(l2Node)) l3Options = l2Node
  }

  const showPoiSelector = state.commissionRule === 'poi'

  return (
    <>
      <RadioGroup
        label="行业"
        name="upflipIndustry"
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
            commissionRateEdited: false,
          })
        }
      />

      <div className="form-row form-row-span">
        <label>类目</label>
        <div className="select-group">
          <div className="select-item">
            <div className="select-label">一级类目</div>
            <select
              value={selectedL1}
              onChange={(e) => onChange({ categoryL1: e.target.value, categoryL2: '', categoryL3: '', commissionRateEdited: false })}
            >
              {l1Keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="select-item">
            <div className="select-label">二级类目</div>
            <select
              value={(l2Keys.includes(state.categoryL2) ? state.categoryL2 : l2Keys[0]) || ''}
              onChange={(e) => onChange({ categoryL2: e.target.value, categoryL3: '', commissionRateEdited: false })}
            >
              {l2Keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="select-item">
            <div className="select-label">三级类目</div>
            <select
              value={(l3Options.some((o) => o.name === state.categoryL3) ? state.categoryL3 : l3Options[0]?.name) || ''}
              onChange={(e) => onChange({ categoryL3: e.target.value, commissionRateEdited: false })}
            >
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

function PoiSelector({ state, onChange }: { state: UpflipState; onChange: (updates: Partial<UpflipState>) => void }) {
  const data = getCommissionData()
  const poi = data.poi
  if (!poi) return null

  const poiL1Keys = Object.keys(poi)
  const poiL2Keys = Object.keys(poi[state.poiL1] || {})
  const poiL3Keys = Object.keys((poi[state.poiL1] || {})[state.poiL2] || {})

  const handlePoiChange = (field: 'poiL1' | 'poiL2' | 'poiL3', value: string) => {
    const updates: Partial<UpflipState> = { [field]: value }
    const nextPoiL1 = field === 'poiL1' ? value : state.poiL1
    const nextPoiL2 = field === 'poiL2' ? value : state.poiL2
    const nextPoiL3 = field === 'poiL3' ? value : state.poiL3
    const rate = getPoiRate(poi, nextPoiL1, nextPoiL2, nextPoiL3)

    if (rate !== null) {
      updates.rateGroup = rate
      updates.commissionRate = rate
      updates.commissionRateEdited = false
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
