import type { SelectedTag, SupportedModel } from '@/types'
import { getModelConfig } from '@/data/model-configs'

// ─── Types ──────────────────────────────────────────────────────────────────

export type MutationType = 'style_shift' | 'weight_adjust' | 'synonym' | 'composition' | 'negative_addition'

export interface PromptVariation {
  id: string
  content: string
  type: MutationType
  confidence: number
  description: string
  tags?: SelectedTag[]
}

export interface MutationOptions {
  maxVariations?: number
  model?: SupportedModel
  types?: MutationType[]
}

// ─── Style shift definitions ────────────────────────────────────────────────

interface StyleShift {
  name: string
  description: string
  // Map of category → replacements (original lowercase label substring → replacement)
  replacements: Record<string, Array<{ from: string; to: string }>>
  additions: string[] // tags/concepts to add
  removals: string[]  // tags/concepts to remove
  confidence: number
}

const STYLE_SHIFTS: StyleShift[] = [
  {
    name: 'More Realistic',
    description: 'Shift toward photorealistic rendering',
    replacements: {
      art_medium: [
        { from: 'oil painting', to: 'photorealistic' },
        { from: 'watercolor', to: 'photorealistic' },
        { from: 'illustration', to: 'photorealistic' },
        { from: 'anime', to: 'hyperrealistic' },
        { from: 'cartoon', to: 'photorealistic' },
        { from: 'sketch', to: 'photorealistic' },
        { from: 'pixel art', to: 'high detail photorealistic' },
        { from: 'concept art', to: 'photorealistic' },
      ],
      camera_lighting_style: [
        { from: 'flat', to: 'natural light' },
        { from: 'soft lighting', to: 'natural light' },
      ],
    },
    additions: ['sharp focus', 'high detail', 'realistic texture'],
    removals: ['cartoon', 'anime', 'illustration', 'sketch', 'painterly'],
    confidence: 0.92,
  },
  {
    name: 'More Artistic',
    description: 'Shift toward painterly/illustrative style',
    replacements: {
      art_medium: [
        { from: 'photorealistic', to: 'oil painting' },
        { from: 'hyperrealistic', to: 'oil painting' },
        { from: 'anime', to: 'watercolor' },
        { from: '3d render', to: 'oil painting' },
      ],
      camera_lighting_style: [
        { from: 'studio lighting', to: 'warm lighting' },
        { from: 'hard lighting', to: 'soft lighting' },
      ],
    },
    additions: ['painterly', 'expressive brushstrokes', 'artistic'],
    removals: ['photorealistic', 'hyperrealistic', 'sharp focus', 'realistic texture'],
    confidence: 0.9,
  },
  {
    name: 'More Abstract',
    description: 'Shift toward abstract/non-representational style',
    replacements: {
      art_medium: [
        { from: 'photorealistic', to: 'abstract' },
        { from: 'realistic', to: 'abstract expressionism' },
        { from: 'oil painting', to: 'abstract' },
        { from: 'watercolor', to: 'abstract watercolor' },
      ],
      mood_emotion: [
        { from: 'peaceful', to: 'contemplative' },
        { from: 'cheerful', to: 'enigmatic' },
      ],
    },
    additions: ['abstract composition', 'bold colors', 'geometric shapes'],
    removals: ['photorealistic', 'realistic', 'detailed', 'sharp focus'],
    confidence: 0.85,
  },
  {
    name: 'More Cinematic',
    description: 'Shift toward cinematic/filmic quality',
    replacements: {
      camera_lighting_style: [
        { from: 'flat', to: 'dramatic lighting' },
        { from: 'soft lighting', to: 'cinematic lighting' },
        { from: 'natural light', to: 'golden hour' },
      ],
      composition: [
        { from: 'centered', to: 'rule of thirds' },
        { from: 'snapshot', to: 'cinematic' },
      ],
    },
    additions: ['cinematic', 'film grain', 'anamorphic', 'color grading', 'dramatic composition'],
    removals: [],
    confidence: 0.93,
  },
  {
    name: 'Darker Mood',
    description: 'Shift toward darker, moodier atmosphere',
    replacements: {
      mood_emotion: [
        { from: 'cheerful', to: 'brooding' },
        { from: 'peaceful', to: 'tense' },
        { from: 'vibrant', to: 'moody' },
        { from: 'bright', to: 'dark' },
        { from: 'serene', to: 'mysterious' },
      ],
      camera_lighting_style: [
        { from: 'natural light', to: 'low key' },
        { from: 'soft lighting', to: 'dramatic lighting' },
        { from: 'bright', to: 'low key' },
        { from: 'high key', to: 'low key' },
      ],
    },
    additions: ['dark atmosphere', 'shadows', 'moody'],
    removals: ['bright', 'cheerful', 'vibrant'],
    confidence: 0.88,
  },
  {
    name: 'Lighter Mood',
    description: 'Shift toward brighter, more optimistic feel',
    replacements: {
      mood_emotion: [
        { from: 'dark', to: 'bright' },
        { from: 'moody', to: 'cheerful' },
        { from: 'melancholy', to: 'serene' },
        { from: 'tense', to: 'peaceful' },
        { from: 'mysterious', to: 'dreamy' },
      ],
      camera_lighting_style: [
        { from: 'low key', to: 'high key' },
        { from: 'dramatic lighting', to: 'soft lighting' },
        { from: 'hard lighting', to: 'natural light' },
      ],
    },
    additions: ['bright', 'cheerful', 'vibrant colors'],
    removals: ['dark', 'moody', 'gloomy', 'shadows'],
    confidence: 0.88,
  },
  {
    name: 'More Detailed',
    description: 'Emphasize fine detail and texture',
    replacements: {},
    additions: ['highly detailed', 'intricate details', 'sharp focus', '8k'],
    removals: ['simple', 'minimalist', 'flat'],
    confidence: 0.9,
  },
]

// ─── Synonym pools ──────────────────────────────────────────────────────────

const SYNONYM_POOLS: Record<string, string[]> = {
  // Lighting
  'dramatic': ['theatrical', 'intense', 'powerful', 'striking', 'bold'],
  'soft': ['gentle', 'diffused', 'subtle', 'delicate', 'tender'],
  'warm': ['golden', 'amber', 'sunset-toned', 'honeyed', 'russet'],
  'cool': ['blue-tinted', 'arctic', 'frosty', 'steel-toned', 'icy'],
  'bright': ['luminous', 'radiant', 'vivid', 'brilliant', 'dazzling'],
  'dark': ['shadowed', 'dim', 'somber', 'murky', 'obscured'],
  'natural light': ['daylight', 'ambient light', 'available light', 'sunlit', 'environmental light'],
  // Mood / emotion
  'beautiful': ['gorgeous', 'stunning', 'elegant', 'exquisite', 'ravishing'],
  'mysterious': ['enigmatic', 'cryptic', 'enchanting', 'arcane', 'mystical'],
  'serene': ['tranquil', 'calm', 'peaceful', 'placid', 'undisturbed'],
  'intense': ['fierce', 'powerful', 'overwhelming', 'potent', 'electrifying'],
  'elegant': ['refined', 'graceful', 'sophisticated', 'polished', 'tasteful'],
  'vibrant': ['vivid', 'lively', 'dynamic', 'energetic', 'radiant'],
  'peaceful': ['calm', 'serene', 'tranquil', 'quiet', 'restful'],
  'melancholy': ['wistful', 'pensive', 'somber', 'reflective', 'sorrowful'],
  'powerful': ['commanding', 'imposing', 'strong', 'dominating', 'forceful'],
  'romantic': ['amorous', 'tender', 'passionate', 'dreamy', 'enchanting'],
  // Style / art medium
  'photorealistic': ['hyperrealistic', 'photographic', 'true-to-life', 'lifelike', 'ultra-realistic'],
  'cinematic': ['filmic', 'movie-quality', 'theatrical', 'sweeping', 'epic'],
  'painterly': ['brushwork', 'expressive', 'gestural', 'impasto', 'loose brushwork'],
  'detailed': ['intricate', 'elaborate', 'fine', 'precise', 'ornate'],
  'minimalist': ['spare', 'reduced', 'clean', 'simple', 'uncluttered'],
  // Camera
  'close-up': ['tight framing', 'macro', 'detailed view', 'intimate frame', 'near perspective'],
  'wide angle': ['expansive', 'sweeping', 'broad view', 'panoramic', 'far-reaching'],
  'shallow depth of field': ['bokeh', 'selective focus', 'blurred background', 'narrow focus', 'f2.8'],
  // Subject
  'portrait': ['likeness', 'face study', 'character study', 'visage', 'headshot'],
  'full body': ['head-to-toe', 'full figure', 'entire frame', 'complete figure', 'whole silhouette'],
  // Environment
  'urban': ['cityscape', 'metropolitan', 'downtown', 'city environment', 'built environment'],
  'nature': ['wilderness', 'organic landscape', 'natural world', 'outdoors', 'countryside'],
  'indoor': ['interior', 'inside', 'enclosed space', 'domestic', 'room setting'],
  'outdoor': ['exterior', 'al fresco', 'open air', 'outside', '自然环境'],
  // Quality
  'masterpiece': ['exceptional quality', 'supreme craftsmanship', 'best quality', 'outstanding'],
  'high detail': ['finely detailed', 'micro-detail', 'elaborate', 'richly textured'],
}

// ─── Composition changes ────────────────────────────────────────────────────

interface CompositionChange {
  name: string
  description: string
  // Map of what camera/composition tags to swap
  swaps: Array<{ from: string; to: string }>
  additions: string[]
  confidence: number
}

const COMPOSITION_CHANGES: CompositionChange[] = [
  {
    name: 'Closer Framing',
    description: 'Zoom in for a tighter composition',
    swaps: [
      { from: 'wide angle', to: 'close-up' },
      { from: 'expansive', to: 'tight framing' },
      { from: 'panoramic', to: 'portrait framing' },
      { from: 'bird\'s eye', to: 'eye-level' },
    ],
    additions: ['close-up', 'shallow depth of field'],
    confidence: 0.9,
  },
  {
    name: 'Wider Framing',
    description: 'Zoom out for a more expansive composition',
    swaps: [
      { from: 'close-up', to: 'wide angle' },
      { from: 'macro', to: 'establishing shot' },
      { from: 'tight framing', to: 'expansive' },
    ],
    additions: ['wide angle', 'establishing shot', 'expansive view'],
    confidence: 0.9,
  },
  {
    name: 'Dramatic Angle',
    description: 'Use a low or high angle for dramatic effect',
    swaps: [
      { from: 'eye-level', to: 'low angle' },
      { from: 'flat composition', to: 'dramatic angle' },
    ],
    additions: ['dramatic angle', 'low angle perspective'],
    confidence: 0.85,
  },
  {
    name: 'Symmetrical',
    description: 'Center the subject with balanced composition',
    swaps: [
      { from: 'rule of thirds', to: 'centered' },
      { from: 'off-center', to: 'symmetrical' },
    ],
    additions: ['symmetrical composition', 'centered frame'],
    confidence: 0.85,
  },
]

// ─── Negative additions by context ──────────────────────────────────────────

const NEGATIVE_SUGGESTIONS: Record<string, string[]> = {
  'portrait': ['bad hands', 'poorly drawn face', 'extra fingers', 'deformed eyes', 'cross-eyed', 'asymmetric face'],
  'landscape': ['people', 'figures', 'text', 'watermark', 'blurry', 'low detail'],
  'anime': ['photorealistic', '3d render', 'realistic skin texture', 'photograph'],
  'photorealistic': ['cartoon', 'anime', 'illustration', 'painting', 'sketch', 'CGI', '3d render'],
  'oil_painting': ['photograph', 'screenshot', 'CGI', '3d render', 'pixel art'],
  'cinematic': ['flat lighting', 'amateur', 'low quality', 'webcam', 'phone photo'],
  'underwater': ['dry', 'above water', 'land', 'desert', 'sand', 'beach', 'sunny'],
  'urban': ['pristine', 'clean', 'nature', 'forest', 'rural'],
  'fantasy': ['modern', 'contemporary', 'realistic city', 'car', 'skyscraper'],
  'minimalist': ['cluttered', 'busy', 'detailed background', 'noisy'],
}

// ─── Mutation Engine ────────────────────────────────────────────────────────

export class MutationEngine {
  /**
   * Generate variations of a prompt based on selected tags.
   */
  generateMutations(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    options?: MutationOptions
  ): PromptVariation[] {
    const maxVariations = options?.maxVariations ?? 5
    const enabledTypes = options?.types ?? ['style_shift', 'weight_adjust', 'synonym', 'composition', 'negative_addition']
    const variations: PromptVariation[] = []

    // 1. Style shifts
    if (enabledTypes.includes('style_shift')) {
      for (const shift of STYLE_SHIFTS) {
        const result = this.applyStyleShift(tags, customText, model, shift)
        if (result) {
          variations.push(result)
          if (variations.length >= maxVariations) break
        }
      }
    }

    // 2. Weight adjustments
    if (enabledTypes.includes('weight_adjust') && variations.length < maxVariations) {
      const weightVariations = this.generateWeightVariations(tags, customText, model)
      for (const v of weightVariations) {
        variations.push(v)
        if (variations.length >= maxVariations) break
      }
    }

    // 3. Synonym swaps
    if (enabledTypes.includes('synonym') && variations.length < maxVariations) {
      const synonymVariations = this.generateSynonymVariations(tags, customText, model)
      for (const v of synonymVariations) {
        variations.push(v)
        if (variations.length >= maxVariations) break
      }
    }

    // 4. Composition changes
    if (enabledTypes.includes('composition') && variations.length < maxVariations) {
      for (const change of COMPOSITION_CHANGES) {
        const result = this.applyCompositionChange(tags, customText, model, change)
        if (result) {
          variations.push(result)
          if (variations.length >= maxVariations) break
        }
      }
    }

    // 5. Negative additions
    if (enabledTypes.includes('negative_addition') && variations.length < maxVariations) {
      const negativeVar = this.generateNegativeVariation(tags, customText, model)
      if (negativeVar) variations.push(negativeVar)
    }

    return variations.slice(0, maxVariations)
  }

  // ─── Style Shift ───────────────────────────────────────────────────────

  private applyStyleShift(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    shift: StyleShift
  ): PromptVariation | null {
    let changed = false
    const newTags = tags.map(tag => {
      let newLabel = tag.label
      const category = tag.category ?? ''

      // Check replacements for this category
      const categoryReplacements = shift.replacements[category] ?? shift.replacements[Object.keys(shift.replacements).find(k => category.startsWith(k)) ?? ''] ?? []
      for (const { from, to } of categoryReplacements) {
        if (newLabel.toLowerCase().includes(from)) {
          newLabel = newLabel.replace(new RegExp(from, 'gi'), to)
          changed = true
        }
      }

      return { ...tag, label: newLabel }
    })

    // Check if any replacement labels match existing tags (remove dupes)
    const removals = shift.removals.filter(r =>
      tags.some(t => t.label.toLowerCase().includes(r)) ||
      customText.toLowerCase().includes(r)
    )
    const filteredTags = newTags.filter(t =>
      !shift.removals.some(r => t.label.toLowerCase().includes(r))
    )

    // Add new tags as custom text additions
    const additions = shift.additions.filter(a =>
      !tags.some(t => t.label.toLowerCase().includes(a.toLowerCase())) &&
      !customText.toLowerCase().includes(a.toLowerCase())
    )

    if (!changed && additions.length === 0 && removals.length === 0) return null

    const config = getModelConfig(model)
    let prompt: string
    if (config.promptStyle === 'prose') {
      // For prose models, add as descriptive text
      const parts = filteredTags.map(t => t.label)
      if (additions.length > 0) parts.push(additions.join(', '))
      if (customText.trim()) parts.push(customText.trim())
      prompt = parts.join(', ')
    } else {
      const parts = filteredTags.map(t => t.label)
      if (additions.length > 0) parts.push(...additions)
      if (customText.trim()) parts.push(customText.trim())
      prompt = parts.join(', ')
    }

    return {
      id: crypto.randomUUID(),
      content: prompt,
      type: 'style_shift',
      confidence: shift.confidence,
      description: shift.description,
      tags: filteredTags,
    }
  }

  // ─── Weight Variations ──────────────────────────────────────────────────

  private generateWeightVariations(
    tags: SelectedTag[],
    customText: string,
    _model: SupportedModel
  ): PromptVariation[] {
    const variations: PromptVariation[] = []
    const config = getModelConfig(_model)

    if (!config.supportsWeighting) return variations

    // Find tags that could benefit from emphasis changes
    const importantCategories = ['subject', 'character_anatomy', 'expressions', 'poses', 'art_medium']
    const importantTags = tags.filter(t => {
      const cat = t.category ?? ''
      return importantCategories.some(ic => cat.startsWith(ic) || cat === ic)
    })

    if (importantTags.length === 0) return variations

    // Boost the most important tag
    const topTag = importantTags[0]
    const boostedTags = tags.map(t =>
      t.id === topTag.id ? { ...t, customWeight: 1.3 } : t
    )
    const boostedPrompt = this.buildPromptFromTags(boostedTags, customText, _model)
    variations.push({
      id: crypto.randomUUID(),
      content: boostedPrompt,
      type: 'weight_adjust',
      confidence: 0.88,
      description: `Increased emphasis on "${topTag.label}" (weight: 1.3)`,
      tags: boostedTags,
    })

    // Boost multiple subject-related tags
    if (importantTags.length >= 2) {
      const multiBoosted = tags.map(t => {
        if (importantTags.some(it => it.id === t.id)) {
          return { ...t, customWeight: 1.2 }
        }
        return t
      })
      const multiPrompt = this.buildPromptFromTags(multiBoosted, customText, _model)
      variations.push({
        id: crypto.randomUUID(),
        content: multiPrompt,
        type: 'weight_adjust',
        confidence: 0.85,
        description: `Boosted emphasis on subject tags`,
        tags: multiBoosted,
      })
    }

    return variations
  }

  // ─── Synonym Variations ─────────────────────────────────────────────────

  private generateSynonymVariations(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel
  ): PromptVariation[] {
    const variations: PromptVariation[] = []

    for (const tag of tags) {
      const synonyms = SYNONYM_POOLS[tag.label.toLowerCase()]
      if (!synonyms || synonyms.length === 0) continue

      // Generate one variation per matching tag with its first synonym
      const synonym = synonyms[0]
      const newTags = tags.map(t =>
        t.id === tag.id ? { ...t, label: synonym } : t
      )
      const prompt = this.buildPromptFromTags(newTags, customText, model)

      variations.push({
        id: crypto.randomUUID(),
        content: prompt,
        type: 'synonym',
        confidence: 0.82,
        description: `Replaced "${tag.label}" with "${synonym}"`,
        tags: newTags,
      })

      if (variations.length >= 3) break // limit synonym variations
    }

    return variations
  }

  // ─── Composition Changes ────────────────────────────────────────────────

  private applyCompositionChange(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel,
    change: CompositionChange
  ): PromptVariation | null {
    let changed = false
    const newTags = tags.map(tag => {
      let newLabel = tag.label
      for (const { from, to } of change.swaps) {
        if (newLabel.toLowerCase().includes(from.toLowerCase())) {
          newLabel = newLabel.replace(new RegExp(from, 'gi'), to)
          changed = true
        }
      }
      return { ...tag, label: newLabel }
    })

    // Add composition additions
    const additions = change.additions.filter(a =>
      !tags.some(t => t.label.toLowerCase().includes(a.toLowerCase()))
    )

    if (!changed && additions.length === 0) return null

    const prompt = this.buildPromptFromTags(newTags, customText + (additions.length > 0 ? ', ' + additions.join(', ') : ''), model)

    return {
      id: crypto.randomUUID(),
      content: prompt,
      type: 'composition',
      confidence: change.confidence,
      description: change.description,
      tags: newTags,
    }
  }

  // ─── Negative Prompt Suggestion ──────────────────────────────────────────

  private generateNegativeVariation(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel
  ): PromptVariation | null {
    const labels = tags.map(t => t.label.toLowerCase())
    const allText = labels.join(' ') + ' ' + customText.toLowerCase()

    // Find most relevant negative suggestions
    const relevantNegatives: string[] = []
    const universalNegatives = ['low quality', 'blurry', 'deformed', 'bad anatomy', 'watermark']

    for (const [context, suggestions] of Object.entries(NEGATIVE_SUGGESTIONS)) {
      if (allText.includes(context) || labels.some(l => l.includes(context))) {
        relevantNegatives.push(...suggestions)
      }
    }

    // Add universals that aren't already covered
    for (const neg of universalNegatives) {
      if (!relevantNegatives.includes(neg)) relevantNegatives.push(neg)
    }

    if (relevantNegatives.length === 0) return null

    const config = getModelConfig(model)
    if (!config.supportsNegative) return null

    const negativePrompt = relevantNegatives.slice(0, 10).join(', ')
    const basePrompt = this.buildPromptFromTags(tags, customText, model)

    return {
      id: crypto.randomUUID(),
      content: basePrompt,
      type: 'negative_addition',
      confidence: 0.87,
      description: `Suggested negative prompt: ${negativePrompt}`,
      tags,
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private buildPromptFromTags(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel
  ): string {
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
}

export const mutationEngine = new MutationEngine()