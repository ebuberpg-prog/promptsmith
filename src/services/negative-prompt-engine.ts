import type { SelectedTag, SupportedModel, SuggestedNegative, ContextAnalysis, NegativePromptIntelligence } from '@/types'
import { getModelConfig } from '@/data/model-configs'

// ─── Context Detection ─────────────────────────────────────────────────────

interface ContextRule {
  keywords: string[]
  categories: string[]
  negatives: Array<{ text: string; reason: string; priority: number }>
}

// Universal negatives that apply to everything
const UNIVERSAL_NEGATIVES: Array<{ text: string; reason: string; priority: number }> = [
  { text: 'low quality', reason: 'General quality guard', priority: 1 },
  { text: 'worst quality', reason: 'General quality guard', priority: 1 },
  { text: 'blurry', reason: 'Sharpness guard', priority: 2 },
  { text: 'deformed', reason: 'Deformation guard', priority: 2 },
  { text: 'bad anatomy', reason: 'Anatomy guard', priority: 3 },
  { text: 'watermark', reason: 'Artifact removal', priority: 3 },
  { text: 'text', reason: 'Artifact removal', priority: 4 },
  { text: 'signature', reason: 'Artifact removal', priority: 4 },
]

// Context-specific negative suggestions
const CONTEXT_RULES: ContextRule[] = [
  // ─── Portrait ────────────────────────────────────────────────────────
  {
    keywords: ['portrait', 'face', 'headshot', 'close-up', 'head shot', 'bust'],
    categories: ['poses'],
    negatives: [
      { text: 'bad face', reason: 'Portrait context — prevent face artifacts', priority: 1 },
      { text: 'poorly drawn face', reason: 'Portrait context — prevent face artifacts', priority: 1 },
      { text: 'extra fingers', reason: 'Portrait context — hand artifacts', priority: 2 },
      { text: 'mutated hands', reason: 'Portrait context — hand artifacts', priority: 2 },
      { text: 'cross-eyed', reason: 'Portrait context — eye alignment', priority: 2 },
      { text: 'asymmetric eyes', reason: 'Portrait context — eye alignment', priority: 2 },
      { text: 'bad proportions', reason: 'Portrait context — proportion guard', priority: 3 },
      { text: 'long neck', reason: 'Portrait context — common artifact', priority: 3 },
    ],
  },
  // ─── Full body / figure ───────────────────────────────────────────────
  {
    keywords: ['full body', 'full figure', 'standing', 'walking', 'running', 'sitting', 'posing'],
    categories: ['character_anatomy', 'poses'],
    negatives: [
      { text: 'bad anatomy', reason: 'Figure context — anatomy guard', priority: 1 },
      { text: 'extra limbs', reason: 'Figure context — limb duplication', priority: 1 },
      { text: 'missing arms', reason: 'Figure context — limb omission', priority: 2 },
      { text: 'missing legs', reason: 'Figure context — limb omission', priority: 2 },
      { text: 'extra arms', reason: 'Figure context — limb duplication', priority: 2 },
      { text: 'fused fingers', reason: 'Figure context — finger artifacts', priority: 2 },
      { text: 'too many fingers', reason: 'Figure context — finger count', priority: 2 },
      { text: 'gross proportions', reason: 'Figure context — proportion guard', priority: 3 },
      { text: 'malformed limbs', reason: 'Figure context — limb quality', priority: 3 },
    ],
  },
  // ─── Hands ────────────────────────────────────────────────────────────
  {
    keywords: ['hands', 'hand', 'holding', 'grasping', 'gesturing', 'finger', 'fingers'],
    categories: ['gestures'],
    negatives: [
      { text: 'mutated hands', reason: 'Hands context — hand artifacts', priority: 1 },
      { text: 'poorly drawn hands', reason: 'Hands context — hand quality', priority: 1 },
      { text: 'extra fingers', reason: 'Hands context — finger count', priority: 1 },
      { text: 'missing fingers', reason: 'Hands context — finger count', priority: 2 },
      { text: 'fused fingers', reason: 'Hands context — finger separation', priority: 2 },
      { text: 'too many fingers', reason: 'Hands context — finger count', priority: 1 },
    ],
  },
  // ─── Landscape / environment ───────────────────────────────────────────
  {
    keywords: ['landscape', 'mountain', 'ocean', 'forest', 'beach', 'field', 'valley', 'meadow', 'skyline', 'panoramic'],
    categories: ['environments'],
    negatives: [
      { text: 'people', reason: 'Landscape context — avoid unwanted figures', priority: 1 },
      { text: 'figures', reason: 'Landscape context — avoid unwanted figures', priority: 1 },
      { text: 'bad anatomy', reason: 'Landscape context — no figures expected', priority: 2 },
      { text: 'text', reason: 'Landscape context — artifact removal', priority: 2 },
      { text: 'low detail', reason: 'Landscape context — detail guard', priority: 2 },
      { text: 'grainy', reason: 'Landscape context — clarity guard', priority: 3 },
    ],
  },
  // ─── Photorealistic ────────────────────────────────────────────────────
  {
    keywords: ['photorealistic', 'realistic', 'photograph', 'photo', 'lifelike', 'true-to-life'],
    categories: ['art_medium'],
    negatives: [
      { text: 'cartoon', reason: 'Photorealistic context — style conflict', priority: 1 },
      { text: 'anime', reason: 'Photorealistic context — style conflict', priority: 1 },
      { text: 'illustration', reason: 'Photorealistic context — style conflict', priority: 1 },
      { text: 'painting', reason: 'Photorealistic context — style conflict', priority: 2 },
      { text: 'sketch', reason: 'Photorealistic context — style conflict', priority: 2 },
      { text: 'CGI', reason: 'Photorealistic context — style conflict', priority: 2 },
      { text: '3d render', reason: 'Photorealistic context — style conflict', priority: 2 },
      { text: 'oversaturated', reason: 'Photorealistic context — color guard', priority: 3 },
    ],
  },
  // ─── Anime / cartoon ──────────────────────────────────────────────────
  {
    keywords: ['anime', 'cartoon', 'manga', 'cel shading', 'anime style'],
    categories: ['art_medium'],
    negatives: [
      { text: 'photorealistic', reason: 'Anime context — style conflict', priority: 1 },
      { text: '3d render', reason: 'Anime context — style conflict', priority: 1 },
      { text: 'realistic skin texture', reason: 'Anime context — style conflict', priority: 1 },
      { text: 'photograph', reason: 'Anime context — style conflict', priority: 2 },
      { text: 'live action', reason: 'Anime context — style conflict', priority: 2 },
    ],
  },
  // ─── Oil painting / painterly ──────────────────────────────────────────
  {
    keywords: ['oil painting', 'painterly', 'oil on canvas', 'impasto', 'brushstrokes'],
    categories: ['art_medium'],
    negatives: [
      { text: 'photograph', reason: 'Painting context — style conflict', priority: 1 },
      { text: 'screenshot', reason: 'Painting context — style conflict', priority: 1 },
      { text: 'CGI', reason: 'Painting context — style conflict', priority: 2 },
      { text: '3d render', reason: 'Painting context — style conflict', priority: 2 },
      { text: 'pixel art', reason: 'Painting context — style conflict', priority: 2 },
    ],
  },
  // ─── Underwater ────────────────────────────────────────────────────────
  {
    keywords: ['underwater', 'ocean floor', 'submerged', 'deep sea', 'coral'],
    categories: ['environments'],
    negatives: [
      { text: 'dry', reason: 'Underwater context — dry artifacts', priority: 1 },
      { text: 'above water', reason: 'Underwater context — above-water elements', priority: 1 },
      { text: 'land', reason: 'Underwater context — land elements', priority: 2 },
      { text: 'desert', reason: 'Underwater context — contradictory', priority: 2 },
      { text: 'sunny day', reason: 'Underwater context — surface artifacts', priority: 3 },
    ],
  },
  // ─── Urban / city ──────────────────────────────────────────────────────
  {
    keywords: ['urban', 'city', 'city street', 'downtown', 'skyline', 'metropolis'],
    categories: ['environments'],
    negatives: [
      { text: 'nature', reason: 'Urban context — nature conflict', priority: 2 },
      { text: 'forest', reason: 'Urban context — nature conflict', priority: 2 },
      { text: 'rural', reason: 'Urban context — rural conflict', priority: 2 },
      { text: 'wilderness', reason: 'Urban context — wilderness conflict', priority: 3 },
    ],
  },
  // ─── Fantasy ───────────────────────────────────────────────────────────
  {
    keywords: ['fantasy', 'magical', 'enchanted', 'mythical', 'sorcerer', 'dragon'],
    categories: ['art_medium'],
    negatives: [
      { text: 'modern', reason: 'Fantasy context — modern elements conflict', priority: 2 },
      { text: 'contemporary', reason: 'Fantasy context — modern conflict', priority: 2 },
      { text: 'realistic city', reason: 'Fantasy context — modern setting conflict', priority: 2 },
    ],
  },
  // ─── Minimalist ────────────────────────────────────────────────────────
  {
    keywords: ['minimalist', 'minimal', 'simple', 'clean', 'sparse'],
    categories: ['art_medium', 'mood_emotion'],
    negatives: [
      { text: 'cluttered', reason: 'Minimalist context — clutter conflict', priority: 1 },
      { text: 'busy', reason: 'Minimalist context — busy conflict', priority: 1 },
      { text: 'detailed background', reason: 'Minimalist context — detail conflict', priority: 2 },
      { text: 'noisy', reason: 'Minimalist context — noise conflict', priority: 2 },
    ],
  },
  // ─── Cinematic ─────────────────────────────────────────────────────────
  {
    keywords: ['cinematic', 'film', 'movie', 'dramatic', 'anamorphic'],
    categories: ['camera_lighting_style'],
    negatives: [
      { text: 'flat lighting', reason: 'Cinematic context — needs depth', priority: 1 },
      { text: 'amateur', reason: 'Cinematic context — avoid amateur look', priority: 2 },
      { text: 'low quality', reason: 'Cinematic context — quality guard', priority: 2 },
      { text: 'webcam', reason: 'Cinematic context — avoid amateur look', priority: 2 },
    ],
  },
  // ─── NSFW / explicit context ───────────────────────────────────────────
  {
    keywords: ['nude', 'naked', 'nsfw', 'explicit', 'lingerie', 'boudoir'],
    categories: ['clothing', 'body_types'],
    negatives: [
      { text: 'bad anatomy', reason: 'Explicit context — anatomy guard', priority: 1 },
      { text: 'bad proportions', reason: 'Explicit context — proportion guard', priority: 1 },
      { text: 'deformed', reason: 'Explicit context — quality guard', priority: 1 },
      { text: 'mutated', reason: 'Explicit context — mutation guard', priority: 1 },
      { text: 'ugly', reason: 'Explicit context — quality guard', priority: 2 },
    ],
  },
  // ─── Group / multiple people ───────────────────────────────────────────
  {
    keywords: ['multiple', 'group', 'crowd', 'people', 'couple', 'trio'],
    categories: ['character_anatomy'],
    negatives: [
      { text: 'duplicate', reason: 'Group context — prevent cloning', priority: 1 },
      { text: 'fused bodies', reason: 'Group context — prevent fusion', priority: 1 },
      { text: 'extra limbs', reason: 'Group context — limb count', priority: 1 },
      { text: 'conjoined', reason: 'Group context — prevent fusion', priority: 2 },
    ],
  },
]

// ─── Negative Suggestion Priority Levels ─────────────────────────────────────



function deduplicateNegatives(negatives: SuggestedNegative[]): SuggestedNegative[] {
  const seen = new Set<string>()
  return negatives.filter(n => {
    const key = n.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sortByPriority(negatives: SuggestedNegative[]): SuggestedNegative[] {
  return [...negatives].sort((a, b) => a.priority - b.priority)
}

// ─── Core Engine ─────────────────────────────────────────────────────────────

export class NegativePromptEngine {
  /**
   * Analyze selected tags and custom text to generate context-aware negative prompt suggestions.
   */
  analyze(
    tags: SelectedTag[],
    customText: string,
    model: SupportedModel
  ): NegativePromptIntelligence {
    const config = getModelConfig(model)

    // Midjourney doesn't use negative prompts
    if (!config.supportsNegative) {
      return {
        contextAnalysis: {
          subject: 'N/A',
          environment: 'N/A',
          style: 'N/A',
          detectedIssues: ['This model does not support negative prompts'],
        },
        suggestedNegatives: [],
        learnedPatterns: [],
      }
    }

    const allText = [
      ...tags.map(t => t.label),
      customText,
    ].join(' ').toLowerCase()

    const categories = new Set(tags.map(t => t.category).filter(Boolean))

    // Illustrious / Civitai anime models use a standard Danbooru negative set
    if (model === 'illustrious') {
      const analysis = this.detectContext(tags, allText, categories)
      const illustriousNegatives: SuggestedNegative[] = [
        { text: 'lowres', reason: 'Illustrious standard — resolution guard', priority: 1 },
        { text: 'worst quality', reason: 'Illustrious standard — quality guard', priority: 1 },
        { text: 'bad anatomy', reason: 'Illustrious standard — anatomy guard', priority: 1 },
        { text: 'bad hands', reason: 'Illustrious standard — hand guard', priority: 1 },
        { text: 'text', reason: 'Illustrious standard — artifact removal', priority: 2 },
        { text: 'error', reason: 'Illustrious standard — artifact removal', priority: 2 },
        { text: 'missing fingers', reason: 'Illustrious standard — finger guard', priority: 2 },
        { text: 'extra digit', reason: 'Illustrious standard — digit guard', priority: 2 },
        { text: 'fewer digits', reason: 'Illustrious standard — digit guard', priority: 2 },
        { text: 'cropped', reason: 'Illustrious standard — framing guard', priority: 3 },
        { text: 'jpeg artifacts', reason: 'Illustrious standard — artifact removal', priority: 3 },
        { text: 'signature', reason: 'Illustrious standard — artifact removal', priority: 3 },
        { text: 'watermark', reason: 'Illustrious standard — artifact removal', priority: 3 },
        { text: 'username', reason: 'Illustrious standard — artifact removal', priority: 3 },
        { text: 'blurry', reason: 'Illustrious standard — sharpness guard', priority: 3 },
        { text: 'bad feet', reason: 'Illustrious standard — foot guard', priority: 3 },
        { text: 'mutation', reason: 'Illustrious standard — mutation guard', priority: 3 },
        { text: 'deformed', reason: 'Illustrious standard — deformation guard', priority: 3 },
        { text: 'extra limbs', reason: 'Illustrious standard — limb guard', priority: 3 },
        { text: 'extra arms', reason: 'Illustrious standard — limb guard', priority: 3 },
        { text: 'extra legs', reason: 'Illustrious standard — limb guard', priority: 3 },
        { text: 'malformed limbs', reason: 'Illustrious standard — limb guard', priority: 3 },
        { text: 'fused fingers', reason: 'Illustrious standard — finger guard', priority: 3 },
        { text: 'too many fingers', reason: 'Illustrious standard — finger guard', priority: 3 },
        { text: 'long neck', reason: 'Illustrious standard — proportion guard', priority: 3 },
        { text: 'cross-eyed', reason: 'Illustrious standard — eye guard', priority: 3 },
        { text: 'mutated hands', reason: 'Illustrious standard — hand guard', priority: 3 },
      ]
      return {
        contextAnalysis: analysis,
        suggestedNegatives: illustriousNegatives,
        learnedPatterns: [],
      }
    }

    // Detect context
    const contextAnalysis = this.detectContext(tags, allText, categories)

    // Generate suggestions based on context
    const suggestions: SuggestedNegative[] = []

    // 1. Add context-specific negatives
    for (const rule of CONTEXT_RULES) {
      const matchesKeyword = rule.keywords.some(kw => allText.includes(kw))
      const matchesCategory = rule.categories.some(cat =>
        tags.some(t => t.category?.startsWith(cat) ?? false)
      )

      if (matchesKeyword || matchesCategory) {
        for (const neg of rule.negatives) {
          // Don't suggest negating something already requested
          if (allText.includes(neg.text.toLowerCase())) continue
          suggestions.push({
            text: neg.text,
            reason: neg.reason,
            priority: neg.priority,
            category: 'context',
          })
        }
      }
    }

    // 2. Add universal negatives (but only if not already in prompt)
    for (const neg of UNIVERSAL_NEGATIVES) {
      if (allText.includes(neg.text.toLowerCase())) continue
      // Don't add universal "bad anatomy" if we already have context-specific ones
      const alreadyCovered = suggestions.some(s => s.text === neg.text)
      if (!alreadyCovered) {
        suggestions.push({
          text: neg.text,
          reason: neg.reason,
          priority: neg.priority,
          category: 'universal',
        })
      }
    }

    // 3. Add style-conflict negatives
    const styleNegatives = this.getStyleConflicts(tags, allText)
    for (const neg of styleNegatives) {
      if (!suggestions.some(s => s.text === neg.text)) {
        suggestions.push(neg)
      }
    }

    // Sort and limit
    const sortedNegatives = sortByPriority(deduplicateNegatives(suggestions)).slice(0, 15)

    return {
      contextAnalysis,
      suggestedNegatives: sortedNegatives,
      learnedPatterns: [],
    }
  }

  /**
   * Generate a complete negative prompt string from the analysis.
   */
  generateNegativePrompt(
    tags: SelectedTag[],
    customText: string,
    customNegative: string,
    model: SupportedModel
  ): string {
    // If user has custom negative prompt, use it
    if (customNegative.trim()) return customNegative.trim()

    // Midjourney doesn't use negatives
    if (model === 'midjourney') return ''

    const analysis = this.analyze(tags, customText, model)
    if (analysis.suggestedNegatives.length === 0) {
      return UNIVERSAL_NEGATIVES.map(n => n.text).join(', ')
    }

    return analysis.suggestedNegatives
      .slice(0, 12)
      .map(n => n.text)
      .join(', ')
  }

  // ─── Context Detection ──────────────────────────────────────────────────

  private detectContext(
    tags: SelectedTag[],
    allText: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _categories: Set<string | undefined>
  ): ContextAnalysis {
    // Detect subject type
    let subjectType = 'unknown'
    if (/portrait|face|headshot|close-up|bust/i.test(allText)) subjectType = 'portrait'
    else if (/full.body|standing|walking|posing/i.test(allText)) subjectType = 'figure'
    else if (/landscape|mountain|ocean|forest|beach/i.test(allText)) subjectType = 'landscape'
    else if (/still.life|product|object/i.test(allText)) subjectType = 'still_life'
    else if (tags.some(t => t.category?.startsWith('character_anatomy') ?? false)) subjectType = 'character'

    // Detect environment
    let environment = 'unspecified'
    if (/underwater|ocean|sea|coral/i.test(allText)) environment = 'underwater'
    else if (/forest|woodland|tree/i.test(allText)) environment = 'nature'
    else if (/city|urban|street|skyline/i.test(allText)) environment = 'urban'
    else if (/studio|minimal|white.background/i.test(allText)) environment = 'studio'
    else if (/desert|sand|arid/i.test(allText)) environment = 'desert'
    else if (/space|galaxy|cosmic/i.test(allText)) environment = 'space'

    // Detect style
    let style = 'unspecified'
    if (/photorealistic|realistic|photograph/i.test(allText)) style = 'photorealistic'
    else if (/anime|manga|cel.shading/i.test(allText)) style = 'anime'
    else if (/oil.painting|painterly|impasto/i.test(allText)) style = 'painterly'
    else if (/watercolor|aquarelle/i.test(allText)) style = 'watercolor'
    else if (/cinematic|film/i.test(allText)) style = 'cinematic'
    else if (/3d.render|CGI/i.test(allText)) style = '3d_render'
    else if (/sketch|drawing|pencil/i.test(allText)) style = 'sketch'
    else if (/pixel.art|8.bit/i.test(allText)) style = 'pixel_art'

    // Detect issues
    const detectedIssues: string[] = []
    if (/hand|finger/i.test(allText)) detectedIssues.push('Hands/fingers detected — recommend hand-specific negatives')
    if (/face|portrait|close.up/i.test(allText)) detectedIssues.push('Face detected — recommend face-specific negatives')
    if (/multiple|group|crowd/i.test(allText)) detectedIssues.push('Multiple figures detected — recommend duplication negatives')
    if (/nude|nsfw|explicit/i.test(allText)) detectedIssues.push('Explicit content — recommend anatomy-quality negatives')

    return {
      subject: subjectType,
      environment,
      style,
      detectedIssues,
    }
  }

  // ─── Style Conflict Detection ───────────────────────────────────────────

  private getStyleConflicts(
    tags: SelectedTag[],
    allText: string
  ): SuggestedNegative[] {
    const conflicts: SuggestedNegative[] = []

    // Style anti-patterns: when you have X style, negate Y
    const ANTI_PATTERNS: Array<{ ifHas: string[]; thenNegate: Array<{ text: string; reason: string; priority: number }> }> = [
      {
        ifHas: ['photorealistic', 'realistic', 'photograph'],
        thenNegate: [
          { text: 'cartoon', reason: 'Photorealistic — style conflict', priority: 1 },
          { text: 'anime', reason: 'Photorealistic — style conflict', priority: 1 },
          { text: 'illustration', reason: 'Photorealistic — style conflict', priority: 1 },
          { text: 'painting', reason: 'Photorealistic — style conflict', priority: 2 },
          { text: 'sketch', reason: 'Photorealistic — style conflict', priority: 2 },
          { text: 'CGI', reason: 'Photorealistic — style conflict', priority: 2 },
        ],
      },
      {
        ifHas: ['anime', 'manga', 'cel shading'],
        thenNegate: [
          { text: 'photorealistic', reason: 'Anime — style conflict', priority: 1 },
          { text: '3d render', reason: 'Anime — style conflict', priority: 1 },
          { text: 'realistic skin texture', reason: 'Anime — style conflict', priority: 1 },
        ],
      },
      {
        ifHas: ['oil painting', 'painterly', 'impasto'],
        thenNegate: [
          { text: 'photograph', reason: 'Oil painting — style conflict', priority: 1 },
          { text: 'screenshot', reason: 'Oil painting — style conflict', priority: 1 },
          { text: '3d render', reason: 'Oil painting — style conflict', priority: 2 },
        ],
      },
      {
        ifHas: ['watercolor', 'aquarelle'],
        thenNegate: [
          { text: 'photorealistic', reason: 'Watercolor — style conflict', priority: 1 },
          { text: 'sharp edges', reason: 'Watercolor — edge conflict', priority: 2 },
        ],
      },
      {
        ifHas: ['minimalist', 'minimal', 'clean'],
        thenNegate: [
          { text: 'cluttered', reason: 'Minimalist — clutter conflict', priority: 1 },
          { text: 'busy', reason: 'Minimalist — busy conflict', priority: 1 },
          { text: 'detailed background', reason: 'Minimalist — detail conflict', priority: 2 },
        ],
      },
    ]

    for (const pattern of ANTI_PATTERNS) {
      const hasMatch = pattern.ifHas.some(kw => allText.includes(kw))
      if (hasMatch) {
        for (const neg of pattern.thenNegate) {
          if (!allText.includes(neg.text.toLowerCase())) {
            conflicts.push({
              text: neg.text,
              reason: neg.reason,
              priority: neg.priority,
              category: 'style_conflict',
            })
          }
        }
      }
    }

    return conflicts
  }
}

export const negativePromptEngine = new NegativePromptEngine()