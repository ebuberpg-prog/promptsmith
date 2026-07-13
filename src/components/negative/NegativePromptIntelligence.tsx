import { useState } from 'react'
import { Check, CircleNotch, Sparkle } from '@phosphor-icons/react'
import { aiService } from '@/services/local-ai-service'
import { usePromptSmithStore } from '@/store/prompt-store'
import { ActionToast } from '@/components/feedback/ActionToast'

interface NegativeSuggestion {
  text: string
  reason: string
  priority: number
  category: string
}

export function NegativePromptIntelligence() {
  const customText = usePromptSmithStore((state) => state.customText)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const customNegativePrompt = usePromptSmithStore((state) => state.customNegativePrompt)
  const setCustomNegativePrompt = usePromptSmithStore((state) => state.setCustomNegativePrompt)
  const generateNegativeSuggestions = usePromptSmithStore((state) => state.generateNegativeSuggestions)
  const aiSettings = usePromptSmithStore((state) => state.aiSettings)
  const [suggestions, setSuggestions] = useState<NegativeSuggestion[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const promptContext = [customText, selectedTags.map((tag) => tag.label).join(', ')].filter(Boolean).join('\nIngredients: ')

  const suggest = async () => {
    if (!promptContext.trim()) return
    setWorking(true); setError(''); setSuggestions([]); setSelected(new Set())
    try {
      aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl)
      if (aiService.getState().status !== 'connected') await aiService.discover(aiSettings.preferredAIProvider)
      if (aiService.getState().status !== 'connected') throw new Error('Local AI is unavailable.')
      const result = await aiService.analyzeNegatives(promptContext)
      setSuggestions(result.negatives)
      setSelected(new Set(result.negatives.map((item) => item.text)))
      if (result.negatives.length === 0) setError('No useful negative suggestions were returned.')
    } catch {
      generateNegativeSuggestions(promptContext)
      const fallback = usePromptSmithStore.getState().negativeIntelligence?.suggestedNegatives ?? []
      setSuggestions(fallback)
      setSelected(new Set(fallback.map((item) => item.text)))
      if (fallback.length === 0) setError('No negative suggestions are available for this draft.')
    } finally { setWorking(false) }
  }

  const apply = () => {
    const value = suggestions.filter((item) => selected.has(item.text)).sort((a, b) => a.priority - b.priority).map((item) => item.text).join(', ')
    setCustomNegativePrompt(value)
    setToast(value ? 'Negative prompt updated' : 'Negative prompt cleared')
  }

  return <div className="space-y-3">
    <ActionToast message={toast} onDismiss={() => setToast('')} />
    <label className="block"><span className="sr-only">Negative prompt</span><textarea value={customNegativePrompt} onChange={(event) => setCustomNegativePrompt(event.target.value)} rows={3} placeholder="low quality, distorted hands…" className="w-full resize-none rounded-lg bg-[var(--ui-surface-soft)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label>
    <button type="button" onClick={() => void suggest()} disabled={working || !promptContext.trim()} className="w-full min-h-11 rounded-lg border border-[var(--ui-border)] flex items-center justify-center gap-2 text-sm disabled:opacity-40">{working ? <CircleNotch className="size-4 animate-spin" /> : <Sparkle className="size-4" />}{working ? 'Checking locally…' : 'Suggest negatives'}</button>
    {error && <p role="status" className="text-xs text-[var(--destructive)]">{error}</p>}
    {suggestions.length > 0 && <div className="space-y-2">{suggestions.slice(0, 8).map((item) => <label key={item.text} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-3 py-2 flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={selected.has(item.text)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(item.text)) next.delete(item.text); else next.add(item.text); return next })} className="mt-1 size-4 accent-current" /><span className="min-w-0"><span className="block text-xs">{item.text}</span>{item.reason && <span className="mt-0.5 block text-[10px] text-[var(--ui-muted-text)] line-clamp-1">{item.reason}</span>}</span></label>)}<button type="button" onClick={apply} className="w-full min-h-11 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] flex items-center justify-center gap-2 text-sm"><Check className="size-4" />Apply {selected.size || ''}</button></div>}
  </div>
}
