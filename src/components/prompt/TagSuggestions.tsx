import { useEffect, useMemo, useState } from 'react'
import { Spinner, Sparkle, WarningCircle } from '@phosphor-icons/react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { analyzeComposerInput } from '@/services/composer-analysis'
import { aiService, type AIServiceState } from '@/services/local-ai-service'
import { searchTagIndexScored } from '@/utils/tag-index'

export function TagSuggestions() {
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const customText = usePromptSmithStore((state) => state.customText)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const toggleTag = usePromptSmithStore((state) => state.toggleTag)
  const aiSettings = usePromptSmithStore((state) => state.aiSettings)
  const [service, setService] = useState<AIServiceState>(aiService.getState())
  const [aiTags, setAiTags] = useState<ReturnType<typeof searchTagIndexScored>>([])
  const [error, setError] = useState('')

  useEffect(() => aiService.subscribe(setService), [])

  const local = useMemo(() => {
    const selected = new Set(selectedTags.map((tag) => tag.id))
    return (analyzeComposerInput(customText, contentVisibility, 6).scoredSuggestions ?? [])
      .filter((result) => !selected.has(result.tag.id))
      .slice(0, 3)
  }, [contentVisibility, customText, selectedTags])

  const askLocalAI = async () => {
    setError('')
    setAiTags([])
    aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl)
    aiService.setCompatibleUrls(aiSettings.openAICompatibleUrl, aiSettings.anthropicCompatibleUrl, aiSettings.useApiGateway !== false ? (aiSettings.apiGatewayUrl || 'https://prompt-smith.ebuberpg.workers.dev') : '')
    if (service.status !== 'connected') await aiService.discover(aiSettings.preferredAIProvider)
    try {
      const selected = new Set(selectedTags.map((tag) => tag.id))
      const localIds = new Set(local.map((result) => result.tag.id))
      const candidateWords = [...new Set((customText.toLowerCase().match(/[\p{L}\p{N}'-]{4,}/gu) ?? []))]
      const candidateResults = candidateWords.flatMap((word) => searchTagIndexScored(word, contentVisibility, 3))
        .filter((result) => {
          const confidenceLimit = result.matchedField === 'description' ? 0.12 : 0.18
          return result.score <= confidenceLimit && !selected.has(result.tag.id) && !localIds.has(result.tag.id)
        })
      const allowedLabels = [...new Set(candidateResults.map((result) => result.tag.label))].slice(0, 60)
      const labels = await aiService.suggestTags(selectedTags.map((tag) => tag.label), customText, allowedLabels)
      const seen = new Set<string>()
      const strict = labels.flatMap((label) => searchTagIndexScored(label, contentVisibility, 1))
        .filter((result) => {
          const confidenceLimit = result.matchedField === 'description' ? 0.12 : 0.18
          return result.score <= confidenceLimit && !selected.has(result.tag.id) && !localIds.has(result.tag.id) && !seen.has(result.tag.id) && seen.add(result.tag.id)
        })
        .slice(0, 4)
      setAiTags(strict)
      if (strict.length === 0) setError('MUSE received ideas, but none matched the taxonomy confidently enough to suggest.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Local suggestions failed. Nothing was changed.')
    }
  }

  const running = service.status === 'running' || service.status === 'checking'
  return (
    <div className="space-y-3">
      {local.length > 0 && <SuggestionRow label="MUSE · on device" results={local} onChoose={(tag) => toggleTag(tag)} />}
      <button type="button" onClick={() => void askLocalAI()} disabled={running || (!customText.trim() && selectedTags.length === 0)} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] flex items-center gap-2 text-xs disabled:opacity-40" title="Contacts only your configured local model after this click">
        {running ? <Spinner className="size-4 animate-spin" /> : <Sparkle className="size-4" />}
        Ask MUSE for ideas
      </button>
      {aiTags.length > 0 && <SuggestionRow label={`MUSE · ${service.selectedModel ?? 'configured model'}`} results={aiTags} onChoose={(tag) => toggleTag(tag)} />}
      {error && <p className="flex gap-2 text-xs leading-5 text-[var(--destructive)]" role="status"><WarningCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}
    </div>
  )
}

function SuggestionRow({ label, results, onChoose }: { label: string; results: ReturnType<typeof searchTagIndexScored>; onChoose: (tag: ReturnType<typeof searchTagIndexScored>[number]['tag']) => void }) {
  return <div className="space-y-2"><p className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]">{label}</p><div className="flex flex-wrap gap-2">{results.map((result) => <button key={result.tag.id} type="button" onClick={() => onChoose(result.tag)} aria-description={`Matched ${result.matchedPhrase} in ${result.matchedField}`} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs hover:border-[var(--ui-border-hover)]">+ {result.tag.label}</button>)}</div></div>
}
