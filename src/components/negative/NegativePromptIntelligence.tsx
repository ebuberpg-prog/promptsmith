import { useState, useEffect, useCallback, useRef } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService, type AIServiceState } from '@/services/local-ai-service'
import { Brain, Warning, Info, Check, CircleNotch, WarningCircle, Sparkle } from '@phosphor-icons/react'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  quality: Sparkle,
  anatomy: Brain,
  hands: Warning,
  artifacts: WarningCircle,
  face: Info,
}

interface NegativeSuggestion {
  text: string
  reason: string
  priority: number
  category: string
}

interface AnalysisResult {
  detectedIssues: string[]
  negatives: NegativeSuggestion[]
}

export function NegativePromptIntelligence() {
  const [isOpen, setIsOpen] = useState(false)
  const [aiState, setAIState] = useState<AIServiceState>(aiService.getState())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectedNegatives, setSelectedNegatives] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState(false)

  const customText = usePromptSmithStore((s) => s.customText)
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)
  const aiSettings = usePromptSmithStore((s) => s.aiSettings)
  const generateNegativeSuggestions = usePromptSmithStore((s) => s.generateNegativeSuggestions)
  const setCustomNegativePrompt = usePromptSmithStore((s) => s.setCustomNegativePrompt)

  const fullPrompt = generatePrompt() || customText

  useEffect(() => {
    const unsub = aiService.subscribe(setAIState)
    return () => { unsub() }
  }, [])

  // Auto-discover when panel opens
  useEffect(() => {
    if (isOpen && aiState.status === 'disconnected') {
      aiService.setUrls(
        aiSettings.ollamaUrl,
        aiSettings.lmStudioUrl,
        aiSettings.openaiUrl,
        aiSettings.openaiApiKey,
        aiSettings.corsProxyUrl
      )
      aiService.discover(aiSettings.preferredAIProvider)
    }
  }, [isOpen, aiState.status, aiSettings])

  const hasAutoTriggered = useRef(false)

  // Reset state when opened fresh
  useEffect(() => {
    if (isOpen) {
      setAnalysis(null)
      setSelectedNegatives(new Set())
      setError(null)
      setApplied(false)
      hasAutoTriggered.current = false
    }
  }, [isOpen])

  const isConnected = aiState.status === 'connected'
  const isChecking = aiState.status === 'checking'

  const handleAnalyze = useCallback(async () => {
    if (!fullPrompt.trim()) return
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setSelectedNegatives(new Set())

    if (isConnected) {
      try {
        const result = await aiService.analyzeNegatives(fullPrompt)
        setAnalysis(result)
      } catch (err) {
        setError(String(err))
        // Fall back to heuristic analysis
        generateNegativeSuggestions(fullPrompt)
        const ni = usePromptSmithStore.getState().negativeIntelligence
        if (ni) {
          setAnalysis({
            detectedIssues: ni.contextAnalysis.detectedIssues,
            negatives: ni.suggestedNegatives,
          })
        }
      }
    } else {
      // Heuristic fallback — synchronous
      generateNegativeSuggestions(fullPrompt)
      const ni = usePromptSmithStore.getState().negativeIntelligence
      if (ni) {
        setAnalysis({
          detectedIssues: ni.contextAnalysis.detectedIssues,
          negatives: ni.suggestedNegatives,
        })
      }
    }

    setIsAnalyzing(false)
  }, [fullPrompt, isConnected, generateNegativeSuggestions])

  // Auto-trigger analysis when modal opens
  useEffect(() => {
    if (isOpen && fullPrompt.trim() && !analysis && !isAnalyzing && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true
      handleAnalyze()
    }
  }, [isOpen, fullPrompt, analysis, isAnalyzing, handleAnalyze])

  const toggleNegative = (text: string) => {
    setSelectedNegatives(prev => {
      const next = new Set(prev)
      if (next.has(text)) next.delete(text)
      else next.add(text)
      return next
    })
  }

  const selectAll = () => {
    if (!analysis) return
    setSelectedNegatives(new Set(analysis.negatives.map(n => n.text)))
  }

  const applySelected = () => {
    if (!analysis || selectedNegatives.size === 0) return
    const negativePrompt = analysis.negatives
      .filter(n => selectedNegatives.has(n.text))
      .sort((a, b) => a.priority - b.priority)
      .map(n => n.text)
      .join(', ')
    setCustomNegativePrompt(negativePrompt)
    setApplied(true)
    setTimeout(() => setIsOpen(false), 600)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-colors duration-150"
        style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
          e.currentTarget.style.color = 'var(--ui-text)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--ui-border)'
          e.currentTarget.style.color = 'var(--ui-muted-text)'
        }}
      >
        <Brain weight="regular" className="w-3.5 h-3.5" />
        <span>Negatives</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div 
            className="rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            style={{ 
              backgroundColor: 'var(--ui-surface)', 
              border: '1px solid var(--ui-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >

            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--ui-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <Brain weight="regular" className="w-4 h-4" style={{ color: 'hsl(var(--warning))' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Negative Prompt Intelligence</span>
                {isConnected && (
                  <span 
                    className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider flex items-center gap-1"
                    style={{ borderColor: 'hsl(var(--success) / 0.3)', color: 'hsl(var(--success) / 0.7)' }}
                  >
                    <Sparkle weight="fill" className="w-2.5 h-2.5" /> AI
                  </span>
                )}
                {!isConnected && !isChecking && (
                  <span 
                    className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider"
                    style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}
                  >
                    Heuristic
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors text-base leading-none"
                style={{ color: 'var(--ui-muted-text)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--destructive))' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)' }}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {isChecking && (
                <div className="flex items-center gap-3 py-4 justify-center">
                  <div 
                    className="w-4 h-4 rounded-full border animate-spin"
                    style={{ borderColor: 'var(--ui-border)', borderTopColor: 'var(--ui-text)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>Detecting local AI…</span>
                </div>
              )}

              {error && (
                <div 
                  className="flex items-center gap-2 p-3 border rounded-xl text-xs"
                  style={{ borderColor: 'hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}
                >
                  <WarningCircle weight="regular" className="w-3.5 h-3.5 flex-shrink-0" />
                  {error} — falling back to heuristic analysis
                </div>
              )}

              {/* Analyze prompt */}
              {!analysis && !isAnalyzing && (
                <div className="p-4 border rounded-xl space-y-3" style={{ borderColor: 'var(--ui-border)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ui-muted-text)' }}>
                    {isConnected
                      ? 'Your local AI will analyze the prompt and generate targeted negative prompts.'
                      : 'Heuristic analysis — connect Ollama or LM Studio for AI-powered results.'}
                  </p>
                  {fullPrompt.trim() && (
                    <div className="p-2.5 border rounded-lg" style={{ borderColor: 'var(--ui-border-faint)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--ui-muted-text-faint)' }}>Prompt to analyze</p>
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--ui-muted-text)' }}>{fullPrompt}</p>
                    </div>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={!fullPrompt.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-all border"
                    style={{ 
                      borderColor: 'var(--ui-border)', 
                      color: 'var(--ui-text)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => { 
                      if (fullPrompt.trim()) {
                        e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
                        e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)'
                      }
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.borderColor = 'var(--ui-border)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    Analyze Prompt
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <CircleNotch weight="regular" className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--warning))' }} />
                  <span className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>
                    {isConnected ? 'Analyzing with AI…' : 'Running heuristic analysis…'}
                  </span>
                </div>
              )}

              {analysis && (
                <>
                  {/* Detected issues */}
                  {analysis.detectedIssues.length > 0 && (
                    <div 
                      className="p-3 border rounded-xl space-y-2"
                      style={{ borderColor: 'hsl(var(--warning) / 0.2)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Warning weight="regular" className="w-3.5 h-3.5" style={{ color: 'hsl(var(--warning))' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--ui-text)' }}>Detected Issues</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.detectedIssues.map((issue) => (
                          <span 
                            key={issue} 
                            className="px-2 py-0.5 text-xs rounded-full border"
                            style={{ 
                              backgroundColor: 'hsl(var(--warning) / 0.1)', 
                              color: 'hsl(var(--warning))',
                              borderColor: 'hsl(var(--warning) / 0.2)'
                            }}
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ui-muted-text)' }}>
                        Suggested Negatives ({analysis.negatives.length})
                      </h3>
                      <button
                        onClick={selectAll}
                        className="text-[10px] transition-colors"
                        style={{ color: 'var(--ui-muted-text-faint)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text-faint)' }}
                      >
                        Select all
                      </button>
                    </div>
                    {analysis.negatives.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleNegative(item.text)}
                        className="p-3 border rounded-xl cursor-pointer transition-all duration-150"
                        style={{
                          borderColor: selectedNegatives.has(item.text) 
                            ? 'hsl(var(--warning) / 0.5)' 
                            : 'var(--ui-border)',
                          backgroundColor: selectedNegatives.has(item.text) 
                            ? 'hsl(var(--warning) / 0.05)' 
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => { 
                          if (!selectedNegatives.has(item.text)) {
                            e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
                          }
                        }}
                        onMouseLeave={(e) => { 
                          if (!selectedNegatives.has(item.text)) {
                            e.currentTarget.style.borderColor = 'var(--ui-border)'
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = CATEGORY_ICONS[item.category] || Info
                              return <Icon weight="regular" className="w-4 h-4" style={{ color: 'var(--ui-muted-text-faint)' }} />
                            })()}
                            <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>{item.text}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--ui-muted-text-faint)' }}>{item.category}</span>
                            {selectedNegatives.has(item.text) && (
                              <Check weight="regular" className="w-3.5 h-3.5" style={{ color: 'hsl(var(--warning))' }} />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px]" style={{ color: 'var(--ui-muted-text-faint)' }}>
                          <Info weight="regular" className="w-3 h-3 flex-shrink-0" />
                          {item.reason}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Re-analyze button */}
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-2 rounded-xl border text-xs transition-all"
                    style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)' }}
                  >
                    Re-analyze
                  </button>
                </>
              )}
            </div>

            {/* Footer — apply */}
            {analysis && (
              <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--ui-border)' }}>
                <button
                  onClick={applySelected}
                  disabled={selectedNegatives.size === 0 || applied}
                  className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-all flex items-center justify-center gap-2 border"
                  style={{ 
                    borderColor: 'var(--ui-border)', 
                    color: 'var(--ui-text)',
                    backgroundColor: applied ? 'hsl(var(--success) / 0.1)' : 'transparent'
                  }}
                  onMouseEnter={(e) => { 
                    if (selectedNegatives.size > 0 && !applied) {
                      e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
                      e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)'
                    }
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.borderColor = 'var(--ui-border)'
                    e.currentTarget.style.backgroundColor = applied ? 'hsl(var(--success) / 0.1)' : 'transparent'
                  }}
                >
                  {applied
                    ? <><Check weight="regular" className="w-3.5 h-3.5" /> Applied!</>
                    : <><Check weight="regular" className="w-3.5 h-3.5" /> Apply {selectedNegatives.size > 0 ? `${selectedNegatives.size} selected` : 'selected'}</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
