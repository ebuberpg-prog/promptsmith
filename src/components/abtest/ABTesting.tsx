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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated border hover:text-[var(--ui-text)] transition-colors"
        style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border)' }}
      >
        <ChartBar weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">A/B Test</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--ui-overlay)' }}>
          <div className="border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2">
                <ChartBar weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>A/B Testing</h2>
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
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ui-text)' }}>Create New Test</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs" style={{ color: 'var(--ui-muted-text)' }}>Test Name</label>
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Test name (e.g., 'Lighting comparison')"
                      className="w-full mt-1 px-2 py-1.5 border rounded text-sm outline-none"
                      style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--ui-muted-text)' }}>Variant A</label>
                      <div className="relative">
                        <textarea
                          value={promptA}
                          onChange={(e) => setPromptA(e.target.value)}
                          placeholder="Prompt A"
                          className="w-full px-2 py-1.5 border rounded text-sm resize-none h-24 outline-none"
                          style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                        />
                        <button
                          onClick={() => setPromptA(generatePrompt())}
                          className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded transition-colors"
                          style={{ backgroundColor: 'var(--ui-surface-elevated)', color: 'var(--ui-muted-text)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-border)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                        >
                          Use Current
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--ui-muted-text)' }}>Variant B</label>
                      <div className="relative">
                        <textarea
                          value={promptB}
                          onChange={(e) => setPromptB(e.target.value)}
                          placeholder="Prompt B"
                          className="w-full px-2 py-1.5 border rounded text-sm resize-none h-24 outline-none"
                          style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                        />
                        <button
                          onClick={() => setPromptB(generatePrompt())}
                          className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded transition-colors"
                          style={{ backgroundColor: 'var(--ui-surface-elevated)', color: 'var(--ui-muted-text)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-border)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                        >
                          Use Current
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!testName.trim() || !promptA.trim() || !promptB.trim()}
                    className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                    style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
                  >
                    <Flask weight="regular" className="w-4 h-4" />
                    Create Test
                  </button>
                </div>
              </div>

              {abTests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Active Tests</h3>
                  {abTests.map((test) => (
                    <div
                      key={test.id}
                      className="border rounded-lg p-3"
                      style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>{test.name}</span>
                        <span
                          className="px-2 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: test.status === 'running' ? 'hsl(var(--success) / 0.2)' : 'var(--ui-surface-elevated)',
                            color: test.status === 'running' ? 'hsl(var(--success))' : 'var(--ui-muted-text)',
                          }}
                        >
                          {test.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded p-2" style={{ backgroundColor: 'var(--ui-bg)' }}>
                          <div style={{ color: 'var(--ui-muted-text)' }} className="mb-1">Variant A</div>
                          <div className="truncate" style={{ color: 'var(--ui-text)' }}>{test.variantA.prompt.substring(0, 40)}...</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span style={{ color: 'var(--ui-muted-text)' }}>Impressions: {test.metrics.impressions}</span>
                          </div>
                        </div>
                        <div className="rounded p-2" style={{ backgroundColor: 'var(--ui-bg)' }}>
                          <div style={{ color: 'var(--ui-muted-text)' }} className="mb-1">Variant B</div>
                          <div className="truncate" style={{ color: 'var(--ui-text)' }}>{test.variantB.prompt.substring(0, 40)}...</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span style={{ color: 'var(--ui-muted-text)' }}>Impressions: {test.metrics.impressions}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}>
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
                  <p className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>No A/B tests yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ui-muted-text)' }}>
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
