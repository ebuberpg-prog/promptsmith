import type { ContentVisibility, ExtractedTag, LocalAIProviderId, ReferenceImage } from '@/types'
import { aiService } from './local-ai-service'
import { extractPaletteFromDataUrl } from './image-analysis-engine'
import { prepareVisionCopy } from './reference-image-service'
import { searchTagIndexScored } from '@/utils/tag-index'

interface ReferenceAISettings {
  ollamaUrl: string
  lmStudioUrl: string
  openAICompatibleUrl: string
  anthropicCompatibleUrl: string
  apiGatewayUrl: string
  useApiGateway: boolean
  preferredAIProvider: LocalAIProviderId | null
  providerModels: Partial<Record<LocalAIProviderId, string>>
}

export async function analyzeReferenceImage(
  image: ReferenceImage,
  settings: ReferenceAISettings,
  contentVisibility: ContentVisibility,
) {
  aiService.setUrls(settings.ollamaUrl, settings.lmStudioUrl)
  aiService.setCompatibleUrls(
    settings.openAICompatibleUrl,
    settings.anthropicCompatibleUrl,
    settings.useApiGateway !== false ? (settings.apiGatewayUrl || 'https://prompt-smith.ebuberpg.workers.dev') : '',
  )
  const current = aiService.getState()
  if (current.status !== 'connected' || (settings.preferredAIProvider && current.activeProvider !== settings.preferredAIProvider)) {
    await aiService.discover(settings.preferredAIProvider)
  }
  const connected = aiService.getState()
  const savedModel = connected.activeProvider ? settings.providerModels[connected.activeProvider] : undefined
  if (savedModel && connected.availableModels.some((model) => model.id === savedModel)) aiService.setSelectedModel(savedModel)
  if (!aiService.getSelectedModelCapabilities().vision) throw new Error(`${aiService.getState().selectedModel ?? 'The selected model'} is text-only. Choose a vision-capable model in Settings.`)

  const [palette, visionCopy] = await Promise.all([
    extractPaletteFromDataUrl(image.dataUrl),
    prepareVisionCopy(image.dataUrl),
  ])
  const result = await aiService.analyzeImage(visionCopy.base64, visionCopy.mimeType, palette)
  const extractedTags = mapAnalysisTags(result.suggestedTags, contentVisibility)
  const state = aiService.getState()
  return {
    analysis: result.analysis,
    extractedTags,
    analyzedBy: {
      provider: state.activeProvider!,
      model: state.selectedModel!,
      analyzedAt: result.analysis.provenance.analyzedAt,
    },
  }
}

export function normalizeVisionError(error: unknown) {
  const raw = error instanceof Error ? error.message : 'Reference analysis failed.'
  return /no endpoints found that support image input/i.test(raw)
    ? 'This provider route does not offer image input for the selected model. Choose a vision-capable endpoint or local vision model.'
    : raw
}

function mapAnalysisTags(labels: string[], contentVisibility: ContentVisibility): ExtractedTag[] {
  const seen = new Set<string>()
  return labels.flatMap((label) => {
    const result = searchTagIndexScored(label, contentVisibility, 1)[0]
    const confidenceLimit = result?.matchedField === 'description' ? 0.12 : 0.18
    if (result && result.score <= confidenceLimit && !seen.has(result.tag.id)) {
      seen.add(result.tag.id)
      return [{ id: result.tag.id, label: result.tag.label, confidence: Math.max(0, 1 - result.score), source: 'blip' as const }]
    }
    const clean = label.replace(/\s+/g, ' ').trim()
    const key = clean.toLocaleLowerCase()
    if (clean.length < 2 || clean.length > 72 || seen.has(key)) return []
    seen.add(key)
    return [{ id: `vision:${key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, label: clean, confidence: 0.65, source: 'blip' as const }]
  }).slice(0, 20)
}
