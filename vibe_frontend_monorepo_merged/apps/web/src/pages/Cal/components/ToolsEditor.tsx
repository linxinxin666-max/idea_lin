import { useEffect, useState } from 'react'
import type { Tool } from '../types'
import { formatInputNumber } from '../utils/numbers'
import { Button } from './Button'

interface ToolsEditorProps {
  tools: Tool[]
  onChange: (tools: Tool[]) => void
}

export function ToolsEditor({ tools, onChange }: ToolsEditorProps) {
  const addTool = () => {
    onChange([...tools, { name: '', price: 0 }])
  }

  const updateTool = (index: number, field: 'name' | 'price', value: string | number) => {
    const newTools = [...tools]
    newTools[index] = { ...newTools[index], [field]: value }
    onChange(newTools)
  }

  const removeTool = (index: number) => {
    const newTools = tools.filter((_, i) => i !== index)
    onChange(newTools)
  }

  return (
    <div className="card">
      <div className="card-title-row">
        <span>营销工具（叠加营销，取最低价）</span>
        <Button onClick={addTool}>+ 添加营销工具</Button>
      </div>
      <div className="tools-head">
        <div>工具名称</div>
        <div>促后价</div>
        <div></div>
      </div>
      <div className="tools-hint">未填写促后价将不参与最低价比较</div>
      <div className="tools-list">
        {tools.map((tool, index) => (
          <div key={index} className="tools-row">
            <input
              type="text"
              placeholder="工具名称"
              value={tool.name}
              onChange={(e) => updateTool(index, 'name', e.target.value)}
            />
            <ToolPriceInput
              value={tool.price}
              onChange={(price) => updateTool(index, 'price', price)}
            />
            <button className="del-tool-btn" onClick={() => removeTool(index)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToolPriceInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string>(value > 0 ? formatInputNumber(value) : '')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDraft(value > 0 ? formatInputNumber(value) : '')
    }
  }, [value, isFocused])

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder="促后价"
      value={draft}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false)
        const raw = draft.trim()
        if (raw === '') {
          onChange(0)
          setDraft('')
          return
        }
        if (raw === '-' || raw === '.' || raw === '-.') {
          setDraft(value > 0 ? formatInputNumber(value) : '')
          return
        }
        const num = Number(raw)
        if (Number.isFinite(num)) {
          onChange(num)
          setDraft(num > 0 ? formatInputNumber(num) : '')
        } else {
          setDraft(value > 0 ? formatInputNumber(value) : '')
        }
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        if (raw.trim() === '' || raw === '-' || raw === '.' || raw === '-.') {
          onChange(0)
          return
        }
        const num = Number(raw)
        if (Number.isFinite(num)) {
          onChange(num)
        }
      }}
    />
  )
}
