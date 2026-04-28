import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { GitDiff, X, Plus, Minus, ArrowsClockwise } from '@phosphor-icons/react'

export function PromptDiff() {
  const [isOpen, setIsOpen] = useState(false)
  const [promptA, setPromptA] = useState('')
  const [promptB, setPromptB] = useState('')
  
  const comparePrompts = usePromptSmithStore((s) => s.comparePrompts)
  const promptDiffs = usePromptSmithStore((s) => s.promptDiffs)
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)
  const [similarity, setSimilarity] = useState(0)

  const handleCompare = () => {
    if (promptA.trim() && promptB.trim()) {
      comparePrompts(promptA, promptB)
      const wordsA = new Set(promptA.split(', '))
      const wordsB = new Set(promptB.split(', '))
      const intersection = [...wordsA].filter(w => wordsB.has(w))
      const common = wordsA.size && wordsB.size ? (intersection.length / Math.max(wordsA.size, wordsB.size)) * 100 : 0
      setSimilarity(common)
    }
  }

  const swapPrompts = () => {
    const temp = promptA
    setPromptA(promptB)
    setPromptB(temp)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated border hover:text-[var(--ui-text)] transition-colors"
        style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border)' }}
      >
        <GitDiff weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Diff</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--ui-overlay)' }}>
          <div className="border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2">
                <GitDiff weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>Prompt Diff</h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs" style={{ color: 'var(--ui-muted-text)' }}>Prompt A</label>
                    <button
                      onClick={() => setPromptA(generatePrompt())}
                      className="text-xs transition-colors"
                      style={{ color: 'var(--ui-muted-text)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-text)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
                    >
                      Use Current
                    </button>
                  </div>
                  <textarea
                    value={promptA}
                    onChange={(e) => setPromptA(e.target.value)}
                    placeholder="Enter first prompt..."
                    className="w-full px-2 py-1.5 border rounded text-sm resize-none h-32 outline-none"
                    style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs" style={{ color: 'var(--ui-muted-text)' }}>Prompt B</label>
                    <button
                      onClick={() => setPromptB(generatePrompt())}
                      className="text-xs transition-colors"
                      style={{ color: 'var(--ui-muted-text)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-text)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
                    >
                      Use Current
                    </button>
                  </div>
                  <textarea
                    value={promptB}
                    onChange={(e) => setPromptB(e.target.value)}
                    placeholder="Enter second prompt..."
                    className="w-full px-2 py-1.5 border rounded text-sm resize-none h-32 outline-none"
                    style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={swapPrompts}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--ui-muted-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title="Swap prompts"
                >
                  <ArrowsClockwise weight="regular" className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCompare}
                  disabled={!promptA.trim() || !promptB.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-opacity"
                  style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
                >
                  <GitDiff weight="regular" className="w-4 h-4" />
                  Compare
                </button>
              </div>

              {promptDiffs.length > 0 && (
                <>
                  <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Comparison Result</h3>
                      <span className="text-sm font-medium" style={{ color: 'var(--ui-muted-text)' }}>
                        {Math.round(similarity)}% similar
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Plus weight="regular" className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
                        <span style={{ color: 'hsl(var(--success))' }}>
                          {promptDiffs.filter(d => d.type === 'added').length} added
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Minus weight="regular" className="w-3 h-3" style={{ color: 'hsl(var(--destructive))' }} />
                        <span style={{ color: 'hsl(var(--destructive))' }}>
                          {promptDiffs.filter(d => d.type === 'removed').length} removed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {promptDiffs.map((diff, idx) => (
                      <div
                        key={idx}
                        className="p-2 border rounded-lg flex items-center gap-2"
                        style={{
                          borderColor: diff.type === 'added' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--destructive) / 0.3)',
                          backgroundColor: diff.type === 'added' ? 'hsl(var(--success) / 0.05)' : 'hsl(var(--destructive) / 0.05)',
                        }}
                      >
                        {diff.type === 'added' ? (
                          <Plus weight="regular" className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
                        ) : (
                          <Minus weight="regular" className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                        )}
                        <span className="text-sm" style={{ color: 'var(--ui-text)' }}>{diff.segment}</span>
                        <span
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: diff.significance === 'high' ? 'color-mix(in oklab, var(--ui-text) 20%, transparent)' : 'var(--ui-surface-elevated)',
                            color: diff.significance === 'high' ? 'var(--ui-text)' : 'var(--ui-muted-text)',
                          }}
                        >
                          {diff.significance}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
