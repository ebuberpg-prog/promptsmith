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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <GitDiff weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Diff</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <GitDiff weight="regular" className="w-5 h-5" style={{ color: 'hsl(217, 91%, 60%)' }} />
                <h2 className="text-lg font-semibold text-foreground">Prompt Diff</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Prompt A</label>
                    <button
                      onClick={() => setPromptA(generatePrompt())}
                      className="text-xs text-blue-500 hover:text-blue-400"
                    >
                      Use Current
                    </button>
                  </div>
                  <textarea
                    value={promptA}
                    onChange={(e) => setPromptA(e.target.value)}
                    placeholder="Enter first prompt..."
                    className="w-full px-2 py-1.5 bg-surface-elevated border border-border rounded text-sm resize-none h-32"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Prompt B</label>
                    <button
                      onClick={() => setPromptB(generatePrompt())}
                      className="text-xs text-blue-500 hover:text-blue-400"
                    >
                      Use Current
                    </button>
                  </div>
                  <textarea
                    value={promptB}
                    onChange={(e) => setPromptB(e.target.value)}
                    placeholder="Enter second prompt..."
                    className="w-full px-2 py-1.5 bg-surface-elevated border border-border rounded text-sm resize-none h-32"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={swapPrompts}
                  className="p-2 rounded-lg hover:bg-surface-elevated text-muted-foreground"
                  title="Swap prompts"
                >
                  <ArrowsClockwise weight="regular" className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCompare}
                  disabled={!promptA.trim() || !promptB.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
                >
                  <GitDiff weight="regular" className="w-4 h-4" />
                  Compare
                </button>
              </div>

              {promptDiffs.length > 0 && (
                <>
                  <div className="bg-surface-elevated border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground">Comparison Result</h3>
                      <span className="text-sm font-medium text-blue-500">
                        {Math.round(similarity)}% similar
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Plus weight="regular" className="w-3 h-3" style={{ color: 'hsl(142, 71%, 45%)' }} />
                        <span className="text-green-500">
                          {promptDiffs.filter(d => d.type === 'added').length} added
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Minus weight="regular" className="w-3 h-3" style={{ color: 'hsl(0, 84%, 60%)' }} />
                        <span className="text-red-500">
                          {promptDiffs.filter(d => d.type === 'removed').length} removed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {promptDiffs.map((diff, idx) => (
                      <div
                        key={idx}
                        className={`p-2 border rounded-lg flex items-center gap-2 ${
                          diff.type === 'added' 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-red-500/30 bg-red-500/5'
                        }`}
                      >
                        {diff.type === 'added' ? (
                          <Plus weight="regular" className="w-4 h-4" style={{ color: 'hsl(142, 71%, 45%)' }} />
                        ) : (
                          <Minus weight="regular" className="w-4 h-4" style={{ color: 'hsl(0, 84%, 60%)' }} />
                        )}
                        <span className="text-sm text-foreground">{diff.segment}</span>
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                          diff.significance === 'high' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
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
