import { useEffect, useMemo, useState } from 'react'
import { Menu } from '@base-ui/react/menu'
import { ArrowCounterClockwise, CaretDown, Check, Spinner, Sparkle, X } from '@phosphor-icons/react'
import { aiService, type AIServiceState } from '@/services/local-ai-service'
import { usePromptSmithStore } from '@/store/prompt-store'
import { getFormatterProfile } from '@/data/formatter-profiles'
import type { EnhancementGoal } from '@/types'
import { findTagsInText } from '@/utils/tag-index'

const GOALS: Array<{ id: EnhancementGoal; label: string }> = [
  { id: 'preserve-intent', label: 'Preserve intent' },
  { id: 'more-visual', label: 'More visual' },
  { id: 'lighting', label: 'Stronger lighting' },
  { id: 'composition', label: 'Stronger composition' },
  { id: 'concise', label: 'More concise' },
]

export function LMPromptEnhancer({ compact = false }: { compact?: boolean }) {
  const customText = usePromptSmithStore((state) => state.customText)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const selectedFormatterProfileId = usePromptSmithStore((state) => state.selectedFormatterProfileId)
  const customFormatterProfiles = usePromptSmithStore((state) => state.customFormatterProfiles)
  const aiSettings = usePromptSmithStore((state) => state.aiSettings)
  const updateAISettings = usePromptSmithStore((state) => state.updateAISettings)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const captureDraftSnapshot = usePromptSmithStore((state) => state.captureDraftSnapshot)
  const flushDraft = usePromptSmithStore((state) => state.flushDraft)
  const applyAIEnhancement = usePromptSmithStore((state) => state.applyAIEnhancement)
  const undo = usePromptSmithStore((state) => state.undo)
  const saveHistory = usePromptSmithStore((state) => state._saveHistory)
  const [service, setService] = useState<AIServiceState>(aiService.getState())
  const [goal, setGoal] = useState<EnhancementGoal>('preserve-intent')
  const [message, setMessage] = useState('')
  const formatterProfile = getFormatterProfile(selectedFormatterProfileId, customFormatterProfiles)

  useEffect(() => aiService.subscribe(setService), [])
  useEffect(() => {
    aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl)
    aiService.setCompatibleUrls(aiSettings.openAICompatibleUrl, aiSettings.anthropicCompatibleUrl, aiSettings.useApiGateway !== false ? (aiSettings.apiGatewayUrl || 'https://prompt-smith.ebuberpg.workers.dev') : '')
    const provider = aiSettings.preferredAIProvider
    const model = provider ? aiSettings.providerModels?.[provider] : undefined
    if (provider) aiService.setActiveProvider(provider)
    if (model) aiService.setSelectedModel(model)
  }, [aiSettings])

  const destination = useMemo(() => {
    if (!service.activeProvider) return 'Choose an AI provider in Settings'
    const providerName = service.activeProvider === 'ollama' ? 'Ollama' : service.activeProvider === 'lmstudio' ? 'LM Studio' : service.activeProvider === 'openai-compatible' ? 'OpenAI compatible' : 'Anthropic compatible'
    const configuredUrl = service.activeProvider === 'ollama' ? aiSettings.ollamaUrl : service.activeProvider === 'lmstudio' ? aiSettings.lmStudioUrl : service.activeProvider === 'openai-compatible' ? aiSettings.openAICompatibleUrl : aiSettings.anthropicCompatibleUrl
    const location = safeHostname(configuredUrl)
    return `${providerName} · ${service.selectedModel ?? 'choose a model'} · ${location === 'localhost' || location === '127.0.0.1' ? 'this device' : location}`
  }, [aiSettings, service.activeProvider, service.selectedModel])

  const ensureConnection = async () => {
    if (service.status === 'connected') return true
    await aiService.discover(aiSettings.preferredAIProvider)
    const next = aiService.getState()
    if (!next.activeProvider || !next.selectedModel) {
      setMessage('The selected provider is not ready. Check its endpoint, key, and model in Settings, then retry.')
      return false
    }
    updateAISettings({
      preferredAIProvider: next.activeProvider,
      providerModels: { ...(aiSettings.providerModels ?? {}), [next.activeProvider]: next.selectedModel },
    })
    return true
  }

  const enhance = async () => {
    const authoredSource = customText.trim() || selectedTags.map((tag) => tag.label).join(', ')
    if (!authoredSource) { setMessage('Add a few words or ingredients first.'); return }
    setMessage('')
    if (!await ensureConnection()) return
    await flushDraft()
    captureDraftSnapshot('enhance')
    saveHistory()
    try {
      const result = await aiService.enhancePrompt({
        authoredText: authoredSource,
        ingredients: selectedTags.map((tag) => ({ label: tag.label, dimension: tag.category, weight: tag.customWeight ?? tag.weight })),
        goal,
        formatFamily: formatterProfile.family,
        formatGuidance: formatterProfile.enhancementGuidance,
      })
      const recognized = findTagsInText(result.text, contentVisibility, 16).map((match) => match.tag)
      const addedCount = applyAIEnhancement(result, recognized)
      setMessage(`Enhanced for ${formatterProfile.name} with ${result.model}${addedCount ? ` · recognized ${addedCount} new ingredient${addedCount === 1 ? '' : 's'}` : ''} · Undo is available`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Local enhancement failed. Your draft was not changed.')
    }
  }

  const running = service.status === 'running' || service.status === 'checking'

  return (
    <div className={compact ? 'space-y-2' : 'rounded-xl border border-[var(--ui-border)] p-3 space-y-3'}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex min-h-11 overflow-hidden rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-text)] text-[var(--ui-bg)]">
          <button type="button" onClick={() => void enhance()} disabled={running || (!customText.trim() && selectedTags.length === 0)} className="min-h-11 px-3 flex items-center gap-2 text-sm disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]" aria-label={`Enhance prompt: ${GOALS.find((item) => item.id === goal)?.label}`}>
            {running ? <Spinner className="size-4 animate-spin" /> : <Sparkle className="size-4" />}
            {running ? 'Working…' : `Enhance · ${GOALS.find((item) => item.id === goal)?.label}`}
          </button>
          <Menu.Root><Menu.Trigger className="size-11 border-l border-[var(--ui-bg)]/20 flex items-center justify-center" aria-label="Choose enhancement goal"><CaretDown className="size-4" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="start" sideOffset={6} className="z-40"><Menu.Popup className="w-56 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg">{GOALS.map((item) => <Menu.Item key={item.id} onClick={() => setGoal(item.id)} className="min-h-11 px-3 rounded-lg flex items-center justify-between text-sm text-[var(--ui-text)] outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>{item.label}</span>{goal === item.id && <Check className="size-4" />}</Menu.Item>)}</Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>
        </div>
        {running && <button type="button" onClick={() => aiService.cancelActiveRequest()} className="size-11 rounded-full border border-[var(--ui-border)] flex items-center justify-center" aria-label="Cancel local AI enhancement"><X className="size-4" /></button>}
        {message.includes('Undo') && <button type="button" onClick={undo} className="min-h-11 px-3 rounded-lg text-xs flex items-center gap-1"><ArrowCounterClockwise className="size-4" />Undo</button>}
      </div>
      <p className="text-xs leading-5 text-[var(--ui-muted-text)]" title="Only authored words and selected ingredient labels are sent after you press Enhance.">{formatterProfile.name} wording · {destination} · private</p>
      <p aria-live="polite" className={`text-xs leading-5 ${message && !message.includes('Undo') && !message.startsWith('No changes') ? 'text-[var(--destructive)]' : 'text-[var(--ui-muted-text)]'}`}>{message}</p>
    </div>
  )
}

function safeHostname(value: string) {
  try { return new URL(value).hostname }
  catch { return 'invalid private address' }
}
