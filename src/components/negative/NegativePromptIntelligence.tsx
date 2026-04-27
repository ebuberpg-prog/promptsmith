import { useState, useEffect, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService, type AIServiceState } from '@/services/local-ai-service'
import { Brain, AlertTriangle, Info, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react'

const CATEGORY_ICONS: Record<string, string> = {
  quality: '✨',
  anatomy: '🦴',
  hands: '🖐',
  artifacts: '🔴',
  face: '👤',
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
      aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl, aiSettings.openaiUrl, aiSettings.openaiApiKey)
      aiService.discover(aiSettings.preferredAIProvider)
    }
  }, [isOpen, aiState.status, aiSettings])

  // Reset state when opened fresh
  useEffect(() => {
    if (isOpen) {
      setAnalysis(null)
      setSelectedNegatives(new Set())
      setError(null)
      setApplied(false)
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] text-xs font-medium text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-colors duration-150"
      >
        <Brain className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Negatives</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-[#f5f5f5]">Negative Prompt Intelligence</span>
                {isConnected && (
                  <span className="text-[9px] border border-green-500/30 text-green-500/70 rounded-full px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
                {!isConnected && !isChecking && (
                  <span className="text-[9px] border border-[#333] text-[#c2c2c2]/40 rounded-full px-2 py-0.5 uppercase tracking-wider">Heuristic</span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-[#c2c2c2]/50 hover:text-[#f5f5f5] transition-colors text-base leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {isChecking && (
                <div className="flex items-center gap-3 py-4 justify-center">
                  <div className="w-4 h-4 rounded-full border border-[#333] border-t-[#f5f5f5] animate-spin" />
                  <span className="text-sm text-[#c2c2c2]/60">Detecting local AI…</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 border border-red-900/40 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error} — falling back to heuristic analysis
                </div>
              )}

              {/* Analyze prompt */}
              {!analysis && !isAnalyzing && (
                <div className="p-4 border border-[#1a1a1a] rounded-xl space-y-3">
                  <p className="text-xs text-[#c2c2c2]/60 leading-relaxed">
                    {isConnected
                      ? 'Your local AI will analyze the prompt and generate targeted negative prompts.'
                      : 'Heuristic analysis — connect Ollama or LM Studio for AI-powered results.'}
                  </p>
                  {fullPrompt.trim() && (
                    <div className="p-2.5 border border-[#222] rounded-lg">
                      <p className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider mb-1">Prompt to analyze</p>
                      <p className="text-xs text-[#f5f5f5]/70 leading-relaxed line-clamp-3">{fullPrompt}</p>
                    </div>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={!fullPrompt.trim()}
                    className="w-full py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-500 disabled:opacity-40 transition-all"
                  >
                    Analyze Prompt
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span className="text-sm text-[#c2c2c2]/60">
                    {isConnected ? 'Analyzing with AI…' : 'Running heuristic analysis…'}
                  </span>
                </div>
              )}

              {analysis && (
                <>
                  {/* Detected issues */}
                  {analysis.detectedIssues.length > 0 && (
                    <div className="p-3 border border-orange-500/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-medium text-[#f5f5f5]">Detected Issues</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.detectedIssues.map((issue) => (
                          <span key={issue} className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-xs rounded-full border border-orange-500/20">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium text-[#c2c2c2] uppercase tracking-wider">
                        Suggested Negatives ({analysis.negatives.length})
                      </h3>
                      <button
                        onClick={selectAll}
                        className="text-[10px] text-[#c2c2c2]/50 hover:text-[#c2c2c2] transition-colors"
                      >
                        Select all
                      </button>
                    </div>
                    {analysis.negatives.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleNegative(item.text)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all duration-150 ${
                          selectedNegatives.has(item.text)
                            ? 'border-orange-500/50 bg-orange-500/8'
                            : 'border-[#1a1a1a] hover:border-[#333]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{CATEGORY_ICONS[item.category] || '📝'}</span>
                            <span className="text-sm text-[#f5f5f5] font-medium">{item.text}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#c2c2c2]/40 uppercase tracking-wider">{item.category}</span>
                            {selectedNegatives.has(item.text) && (
                              <Check className="w-3.5 h-3.5 text-orange-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#c2c2c2]/40">
                          <Info className="w-3 h-3 flex-shrink-0" />
                          {item.reason}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Re-analyze button */}
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-2 rounded-xl border border-[#333] text-xs text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all"
                  >
                    Re-analyze
                  </button>
                </>
              )}
            </div>

            {/* Footer — apply */}
            {analysis && (
              <div className="px-5 py-4 border-t border-[#1a1a1a]">
                <button
                  onClick={applySelected}
                  disabled={selectedNegatives.size === 0 || applied}
                  className="w-full py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {applied
                    ? <><Check className="w-3.5 h-3.5" /> Applied!</>
                    : <><Check className="w-3.5 h-3.5" /> Apply {selectedNegatives.size > 0 ? `${selectedNegatives.size} selected` : 'selected'}</>
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
