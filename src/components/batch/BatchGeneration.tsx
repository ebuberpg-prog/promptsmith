import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { Play, Plus, Trash2, X, Copy, Download, FlaskConical } from 'lucide-react'

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
        <span className="hidden sm:inline">Batch</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">Batch Generation</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-surface-elevated border border-border rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Batch Name</label>
                    <input
                      type="text"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="My batch"
                      className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setBasePrompt(generatePrompt())}
                      className="w-full py-1.5 bg-background border border-border rounded text-sm hover:bg-surface-elevated"
                    >
                      Use Current Prompt
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Base Prompt</label>
                  <textarea
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder="A beautiful {subject} with {feature}"
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm resize-none h-20"
                  />
                </div>
              </div>

              <div className="bg-surface-elevated border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Variables</h3>
                  <button
                    onClick={addVariable}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Add Variable
                  </button>
                </div>
                
                {variables.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Add variables to create prompt permutations.<br />
                    Use {"{variable_name}"} in your base prompt.
                  </p>
                )}

                {variables.map((variable, varIdx) => (
                  <div key={varIdx} className="mb-3 p-2 bg-background rounded border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(varIdx, 'name', e.target.value)}
                        placeholder="variable_name"
                        className="flex-1 px-2 py-1 bg-surface-elevated border border-border rounded text-sm font-mono"
                      />
                      <button
                        onClick={() => removeVariable(varIdx)}
                        className="p-1 rounded hover:bg-error/10 text-muted-foreground hover:text-error"
                      >
                        <Trash2 className="w-3 h-3" />
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
                            className="flex-1 px-2 py-1 bg-surface-elevated border border-border rounded text-xs"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => addValue(varIdx)}
                        className="text-xs text-green-500 hover:text-green-400"
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
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Generate Prompts
              </button>

              {generatedPrompts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">
                      Generated ({generatedPrompts.length})
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={copyAll}
                        className="p-1.5 rounded hover:bg-surface-elevated text-muted-foreground"
                        title="Copy all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={exportAll}
                        className="p-1.5 rounded hover:bg-surface-elevated text-muted-foreground"
                        title="Export"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {generatedPrompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-surface-elevated border border-border rounded text-xs"
                      >
                        <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                        {prompt}
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
