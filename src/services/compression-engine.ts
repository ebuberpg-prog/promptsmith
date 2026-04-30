import type { SelectedTag, SupportedModel } from '@/types'
import { getModelConfig } from '@/data/model-configs'

// ─── Token estimation ────────────────────────────────────────────────────────
// Approximate token counts for different models. Image gen tokens ≠ LLM tokens.
// These are rough heuristics for prompt length limits per model.

const MODEL_TOKEN_LIMITS: Record<string, number> = {
  midjourney: 77,
  'stable-diffusion': 75,
  'gpt-image': 500,
  flux: 77,
  ideogram: 500,
  'qwen-image': 150,
  gemini: 500,
  illustrious: 75,
  custom: 150,
}

// Approximate: 1 token ≈ 0.75 words for CLIP-based models,
// 1 token ≈ 1 word for prose-based models
function estimateTokenCount(text: string, model: SupportedModel): number {
  const config = getModelConfig(model)
  const words = text.split(/\s+/).filter(Boolean).length
  return config.promptStyle === 'prose' || config.promptStyle === 'structured-prose' ? words : Math.ceil(words / 0.75)
}

// ─── Category priority for compression ──────────────────────────────────────

const COMPRESSION_PRIORITY: Record<string, number> = {
  // Never remove subject — highest priority
  subject: 100,
  character_anatomy: 95,
  body_types: 90,
  facial_features: 85,
  expressions: 85,
  poses: 80,
  gestures: 80,
  // Style is core to the image
  art_medium: 88,
  // Environment and lighting shape the image strongly
  environments: 70,
  camera_lighting_style: 68,
  // Clothing and mood are secondary
  clothing: 55,
  mood_emotion: 50,
  color_palette: 45,
  composition: 40,
  // Lower priority
  hair: 50,
  body_modifications: 35,
  body_hair: 25,
  skin: 30,
  age: 30,
  ethnicity: 30,
  anthropomorphic: 35,
  fantasy_races: 35,
  time_period: 38,
  social_setting: 35,
  weather_effects: 30,
  // Quality boosters are lowest priority
  quality: 10,
}

function getCompressionPriority(tag: SelectedTag): number {
  if (tag.category) {
    for (const [cat, pri] of Object.entries(COMPRESSION_PRIORITY)) {
      if (tag.category.startsWith(cat) || tag.category === cat) return pri
    }
  }
  return 30 // default
}

// ─── Semantic overlap: detect tags that carry similar meaning ──────────────

const SEMANTIC_GROUPS: string[][] = [
  // Lighting overlap
  ['natural light', 'soft lighting', 'diffused'],
  ['dramatic lighting', 'high contrast', 'chiaroscuro'],
  ['golden hour', 'warm lighting', 'sunset'],
  ['neon lighting', 'neon lights', 'neon'],
  ['studio lighting', 'softbox', 'ring light'],
  // Style overlap
  ['photorealistic', 'realistic', 'naturalistic'],
  ['cinematic', 'film grain', 'movie quality'],
  ['anime', 'manga style', 'cel shading'],
  ['oil painting', 'painterly', 'impasto'],
  ['watercolor', 'soft edges', 'light wash'],
  // Quality overlap
  ['8k', '4k', 'high resolution', 'ultra detailed', 'high detail', 'detailed', 'sharp focus', 'masterpiece', 'best quality'],
  // Subject overlap
  ['close-up', 'close up', 'macro'],
  ['wide angle', 'wide', 'expansive'],
  ['bokeh', 'shallow depth of field', 'shallow depth'],
  // Mood overlap
  ['dark', 'moody', 'low key'],
  ['bright', 'cheerful', 'vibrant'],
  ['peaceful', 'serene', 'calm'],
  ['dramatic', 'intense', 'powerful'],
  // Setting overlap
  ['city street', 'urban', 'city'],
  ['forest', 'woodland', 'trees'],
  ['ocean', 'sea', 'water'],
]

function findSemanticGroup(label: string): number | null {
  const lower = label.toLowerCase()
  for (let i = 0; i < SEMANTIC_GROUPS.length; i++) {
    if (SEMANTIC_GROUPS[i].some(s => lower.includes(s))) return i
  }
  return null
}

// ─── Compression Strategies ─────────────────────────────────────────────────

export type CompressionStrategy = 'truncation' | 'merging' | 'priority' | 'hybrid'

export interface CompressionResult {
  originalPrompt: string
  compressedPrompt: string
  originalTokens: number
  compressedTokens: number
  strategy: CompressionStrategy
  removedElements: string[]
  preservedElements: string[]
  compressionRatio: number
}

export class CompressionEngine {
  /**
   * Compress a prompt (from tags + custom text) to fit within model token limits.
   */
  compress(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    strategy: CompressionStrategy = 'hybrid',
    maxTokens?: number
  ): CompressionResult {
    // Build the tag labels in order
    const tagLabels = tags.map(t => {
      let label = t.label
      if (t.triggerWords && t.triggerWords.length > 0) {
        const config = getModelConfig(model)
        if (config.triggerWordStyle === 'prefix') {
          label = t.triggerWords.join(', ') + ', ' + label
        } else if (config.triggerWordStyle === 'inline') {
          label = t.triggerWords.join(' ') + ' ' + label
        }
      }
      if (t.customWeight && t.customWeight !== 1.0 && getModelConfig(model).supportsWeighting) {
        label = getModelConfig(model).weightFormat(t.label, t.customWeight)
      }
      return label
    })

    const allParts = [...tagLabels]
    if (customText.trim()) allParts.push(customText.trim())

    const originalPrompt = allParts.join(', ')
    const originalTokens = estimateTokenCount(originalPrompt, model)
    const limit = maxTokens ?? MODEL_TOKEN_LIMITS[model] ?? 150

    // Already fits
    if (originalTokens <= limit) {
      return {
        originalPrompt,
        compressedPrompt: originalPrompt,
        originalTokens,
        compressedTokens: originalTokens,
        strategy: 'truncation',
        removedElements: [],
        preservedElements: tagLabels,
        compressionRatio: 1,
      }
    }

    switch (strategy) {
      case 'truncation':
        return this.truncateStrategy(tags, customText, model, limit)
      case 'merging':
        return this.mergeStrategy(tags, customText, model, limit)
      case 'priority':
        return this.priorityStrategy(tags, customText, model, limit)
      case 'hybrid':
      default:
        return this.hybridStrategy(tags, customText, model, limit)
    }
  }

  /**
   * Truncation: Remove lowest-priority tags until we fit.
   */
  private truncateStrategy(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    limit: number
  ): CompressionResult {
    // Sort tags by priority descending (keep highest priority)
    const sorted = [...tags].sort((a, b) => getCompressionPriority(b) - getCompressionPriority(a))
    const kept: SelectedTag[] = []
    const removed: string[] = []

    for (const tag of sorted) {
      const candidate = [...kept, tag]
      const text = this.buildPromptText(candidate, customText, model)
      if (estimateTokenCount(text, model) <= limit) {
        kept.push(tag)
      } else {
        removed.push(tag.label)
      }
    }

    const compressedPrompt = this.buildPromptText(kept, customText, model)
    const compressedTokens = estimateTokenCount(compressedPrompt, model)
    const originalPrompt = this.buildPromptText(tags, customText, model)

    return {
      originalPrompt,
      compressedPrompt,
      originalTokens: estimateTokenCount(originalPrompt, model),
      compressedTokens,
      strategy: 'truncation',
      removedElements: removed,
      preservedElements: kept.map(t => t.label),
      compressionRatio: compressedTokens / estimateTokenCount(originalPrompt, model),
    }
  }

  /**
   * Merging: Detect semantic overlaps and merge redundant tags.
   */
  private mergeStrategy(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    limit: number
  ): CompressionResult {
    const seen = new Map<number, SelectedTag>() // semantic group → representative tag
    const kept: SelectedTag[] = []
    const removed: string[] = []

    for (const tag of tags) {
      const group = findSemanticGroup(tag.label)
      if (group !== null && seen.has(group)) {
        // Keep the higher-priority or higher-weight tag from this group
        const existing = seen.get(group)!
        const existingWeight = existing.customWeight ?? 1.0
        const tagWeight = tag.customWeight ?? 1.0
        if (tagWeight > existingWeight || getCompressionPriority(tag) > getCompressionPriority(existing)) {
          // Replace
          removed.push(existing.label)
          kept.splice(kept.indexOf(existing), 1)
          kept.push(tag)
          seen.set(group, tag)
        } else {
          removed.push(tag.label)
        }
      } else {
        kept.push(tag)
        if (group !== null) seen.set(group, tag)
      }
    }

    const compressedPrompt = this.buildPromptText(kept, customText, model)
    const originalPrompt = this.buildPromptText(tags, customText, model)

    // If still over limit after merging, fall back to truncation
    if (estimateTokenCount(compressedPrompt, model) > limit) {
      return this.truncateStrategy(kept, customText, model, limit)
    }

    return {
      originalPrompt,
      compressedPrompt,
      originalTokens: estimateTokenCount(originalPrompt, model),
      compressedTokens: estimateTokenCount(compressedPrompt, model),
      strategy: 'merging',
      removedElements: removed,
      preservedElements: kept.map(t => t.label),
      compressionRatio: estimateTokenCount(compressedPrompt, model) / estimateTokenCount(originalPrompt, model),
    }
  }

  /**
   * Priority: Keep tags by priority ranking, always preserving subject + style.
   */
  private priorityStrategy(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    limit: number
  ): CompressionResult {
    const sorted = [...tags].sort((a, b) => getCompressionPriority(b) - getCompressionPriority(a))

    // Always keep subject + style categories
    const guaranteed = sorted.filter(t => {
      const pri = getCompressionPriority(t)
      return pri >= 80
    })

    const optional = sorted.filter(t => !guaranteed.includes(t))
    const kept: SelectedTag[] = [...guaranteed]
    const removed: string[] = []

    for (const tag of optional) {
      const candidate = [...kept, tag]
      const text = this.buildPromptText(candidate, customText, model)
      if (estimateTokenCount(text, model) <= limit) {
        kept.push(tag)
      } else {
        removed.push(tag.label)
      }
    }

    const compressedPrompt = this.buildPromptText(kept, customText, model)
    const originalPrompt = this.buildPromptText(tags, customText, model)

    return {
      originalPrompt,
      compressedPrompt,
      originalTokens: estimateTokenCount(originalPrompt, model),
      compressedTokens: estimateTokenCount(compressedPrompt, model),
      strategy: 'priority',
      removedElements: removed,
      preservedElements: kept.map(t => t.label),
      compressionRatio: estimateTokenCount(compressedPrompt, model) / estimateTokenCount(originalPrompt, model),
    }
  }

  /**
   * Hybrid: Merge first, then prioritize, then truncate.
   */
  private hybridStrategy(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    limit: number
  ): CompressionResult {
    // Step 1: Merge semantic overlaps
    const merged = this.mergeStrategy(tags, customText, model, limit)
    // If the merged result fits, we're done
    if (merged.compressedTokens <= limit) return merged

    // Step 2: Apply priority-based selection on the merged result
    const mergedTags = tags.filter(t => merged.preservedElements.includes(t.label))
    if (merged.compressedTokens > limit) {
      return this.priorityStrategy(mergedTags, customText, model, limit)
    }

    return merged
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildPromptText(tags: SelectedTag[], customText: string, model: SupportedModel): string {
    const parts: string[] = []
    const config = getModelConfig(model)

    for (const tag of tags) {
      let label = tag.label
      if (tag.triggerWords && tag.triggerWords.length > 0) {
        if (config.triggerWordStyle === 'prefix') {
          label = tag.triggerWords.join(', ') + ', ' + label
        } else if (config.triggerWordStyle === 'inline') {
          label = tag.triggerWords.join(' ') + ' ' + label
        }
      }
      if (tag.customWeight && tag.customWeight !== 1.0 && config.supportsWeighting) {
        label = config.weightFormat(tag.label, tag.customWeight)
      }
      parts.push(label)
    }

    if (customText.trim()) {
      parts.push(customText.trim())
    }

    return parts.join(', ')
  }

  getModelTokenLimit(model: SupportedModel): number {
    return MODEL_TOKEN_LIMITS[model] ?? 150
  }
}

export const compressionEngine = new CompressionEngine()