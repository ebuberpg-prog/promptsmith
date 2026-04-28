import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { Flask, X, ChartBar } from '@phosphor-icons/react'

export function ABTesting() {
  const [isOpen, setIsOpen] = useState(false)
  const [testName, setTestName] = useState('')
  const [promptA, setPromptA] = useState('')
  const [promptB, setPromptB] = useState('')
  
  const abTests = usePromptSmithStore((s) => s.abTests)
  const createABTest = usePromptSmithStore((s) => s.createABTest)
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)

  const handleCreate = () => {
    if (testName.trim() && promptA.trim() && promptB.trim()) {
      createABTest(testName.trim(), promptA, promptB)
      setTestName('')
      setPromptA('')
      setPromptB('')
    }
  }

  const _getWinner = (test: typeof abTests[0]) => {
    const { metrics } = test
    if (metrics.conversions === 0) return null
    if (metrics.conversions > 0) return metrics.clicks / metrics.impressions > 0.5 ? 'A' : 'B'
    return null
  }
  void _getWinner

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <ChartBar weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">A/B Test</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ChartBar weight="regular" className="w-5 h-5" style={{ color: 'hsl(346, 77%, 50%)' }} />
                <h2 className="text-lg font-semibold text-foreground">A/B Testing</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-surface-elevated border border-border rounded-lg p-3">
                <h3 className="text-sm font-medium text-foreground mb-3">Create New Test</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Test Name</label>
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Test name (e.g., 'Lighting comparison')"
                      className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Variant A</label>
                      <div className="relative">
                        <textarea
                          value={promptA}
                          onChange={(e) => setPromptA(e.target.value)}
                          placeholder="Prompt A"
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm resize-none h-24"
                        />
                        <button
                          onClick={() => setPromptA(generatePrompt())}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-surface-elevated text-xs rounded hover:bg-border"
                        >
                          Use Current
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Variant B</label>
                      <div className="relative">
                        <textarea
                          value={promptB}
                          onChange={(e) => setPromptB(e.target.value)}
                          placeholder="Prompt B"
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm resize-none h-24"
                        />
                        <button
                          onClick={() => setPromptB(generatePrompt())}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-surface-elevated text-xs rounded hover:bg-border"
                        >
                          Use Current
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!testName.trim() || !promptA.trim() || !promptB.trim()}
                    className="w-full py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-500 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Flask weight="regular" className="w-4 h-4" />
                    Create Test
                  </button>
                </div>
              </div>

              {abTests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Active Tests</h3>
                  {abTests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-surface-elevated border border-border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{test.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          test.status === 'running' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-background rounded p-2">
                          <div className="text-muted-foreground mb-1">Variant A</div>
                          <div className="text-foreground truncate">{test.variantA.prompt.substring(0, 40)}...</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground">Impressions: {test.metrics.impressions}</span>
                          </div>
                        </div>
                        <div className="bg-background rounded p-2">
                          <div className="text-muted-foreground mb-1">Variant B</div>
                          <div className="text-foreground truncate">{test.variantB.prompt.substring(0, 40)}...</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground">Impressions: {test.metrics.impressions}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                        <ChartBar weight="regular" className="w-3 h-3" />
                        Clicks: {test.metrics.clicks} | Conversions: {test.metrics.conversions}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {abTests.length === 0 && (
                <div className="text-center py-8">
                  <Flask weight="regular" className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--ui-muted-text-faint)', opacity: 0.3 }} />
                  <p className="text-sm text-muted-foreground">No A/B tests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a test to compare different prompt variations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
