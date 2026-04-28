import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { Play, Plus, Trash, X, Copy, DownloadSimple, Flask } from '@phosphor-icons/react'

interface VariableConfig {
  name: string
  values: string[]
}

export function BatchGeneration() {
  const [isOpen, setIsOpen] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [basePrompt, setBasePrompt] = useState('')
  const [variables, setVariables] = useState<VariableConfig[]>([])
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([])
  
  const createBatchGeneration = usePromptSmithStore((s) => s.createBatchGeneration)
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)

  const addVariable = () => {
    setVariables([...variables, { name: '', values: [''] }])
  }

  const updateVariable = (index: number, field: keyof VariableConfig, value: string | string[]) => {
    setVariables(prev => prev.map((v, i) => 
      i === index ? { ...v, [field]: value } : v
    ))
  }

  const removeVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index))
  }

  const addValue = (varIndex: number) => {
    const newVars = [...variables]
    newVars[varIndex].values.push('')
    setVariables(newVars)
  }

  const updateValue = (varIndex: number, valueIndex: number, value: string) => {
    const newVars = [...variables]
    newVars[varIndex].values[valueIndex] = value
    setVariables(newVars)
  }

  const handleGenerate = () => {
    if (!basePrompt.trim() || variables.length === 0) return

    const varMap: Record<string, string[]> = {}
    variables.forEach(v => {
      if (v.name.trim() && v.values.filter(val => val.trim()).length > 0) {
        varMap[v.name.trim()] = v.values.filter(val => val.trim())
      }
    })

    if (Object.keys(varMap).length === 0) return

    const batch = createBatchGeneration(batchName || 'Untitled', basePrompt, varMap)
    setGeneratedPrompts(batch.permutations[0]?.generatedPrompts || [])
  }

  const copyAll = () => {
    navigator.clipboard.writeText(generatedPrompts.join('\n\n'))
  }

  const exportAll = () => {
    const blob = new Blob([generatedPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n')], { 
      type: 'text/plain' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${batchName || 'batch-prompts'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated border hover:text-[var(--ui-text)] transition-colors"
        style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border)' }}
      >
        <Flask weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Batch</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--ui-overlay)' }}>
          <div className="border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2">
                <Flask weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>Batch Generation</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--ui-muted-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs" style={{ color: 'var(--ui-muted-text)' }}>Batch Name</label>
                    <input
                      type="text"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="My batch"
                      className="w-full mt-1 px-2 py-1.5 border rounded text-sm outline-none"
                      style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setBasePrompt(generatePrompt())}
                      className="w-full py-1.5 border rounded text-sm transition-colors"
                      style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-bg)')}
                    >
                      Use Current Prompt
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs" style={{ color: 'var(--ui-muted-text)' }}>Base Prompt</label>
                  <textarea
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder="A beautiful {subject} with {feature}"
                    className="w-full mt-1 px-2 py-1.5 border rounded text-sm resize-none h-20 outline-none"
                    style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Variables</h3>
                  <button
                    onClick={addVariable}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-opacity"
                    style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
                  >
                    <Plus weight="regular" className="w-3 h-3" />
                    Add Variable
                  </button>
                </div>
                
                {variables.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--ui-muted-text)' }}>
                    Add variables to create prompt permutations.<br />
                    Use {"{variable_name}"} in your base prompt.
                  </p>
                )}

                {variables.map((variable, varIdx) => (
                  <div key={varIdx} className="mb-3 p-2 rounded border" style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(varIdx, 'name', e.target.value)}
                        placeholder="variable_name"
                        className="flex-1 px-2 py-1 border rounded text-sm font-mono outline-none"
                        style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                      />
                      <button
                        onClick={() => removeVariable(varIdx)}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--ui-muted-text)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)', e.currentTarget.style.color = 'hsl(var(--destructive))')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = 'var(--ui-muted-text)')}
                      >
                        <Trash weight="regular" className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {variable.values.map((value, valIdx) => (
                        <div key={valIdx} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateValue(varIdx, valIdx, e.target.value)}
                            placeholder={`value ${valIdx + 1}`}
                            className="flex-1 px-2 py-1 border rounded text-xs outline-none"
                            style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => addValue(varIdx)}
                        className="text-xs transition-colors"
                        style={{ color: 'var(--ui-muted-text)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-text)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
                      >
                        + Add value
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!basePrompt.trim() || variables.length === 0}
                className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
              >
                <Play weight="regular" className="w-4 h-4" />
                Generate Prompts
              </button>

              {generatedPrompts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>
                      Generated ({generatedPrompts.length})
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={copyAll}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: 'var(--ui-muted-text)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Copy all"
                      >
                        <Copy weight="regular" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={exportAll}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: 'var(--ui-muted-text)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Export"
                      >
                        <DownloadSimple weight="regular" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {generatedPrompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="p-2 border rounded text-xs"
                        style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}
                      >
                        <span className="mr-2" style={{ color: 'var(--ui-muted-text)' }}>{idx + 1}.</span>
                        <span style={{ color: 'var(--ui-text)' }}>{prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
