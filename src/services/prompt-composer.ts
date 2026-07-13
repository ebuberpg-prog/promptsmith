import type { SelectedTag, SupportedModel, ModelParameters } from '@/types'
import { getModelConfig } from '@/data/model-configs'

// ─── Category ordering for visual coherence ────────────────────────────────

const CATEGORY_ORDER: string[] = [
  'character_anatomy', 'subject', 'body_types', 'breast', 'buttocks', 'male_chest',
  'skin', 'age', 'ethnicity', 'anthropomorphic', 'fantasy_races',
  'hair', 'facial_features', 'body_modifications',
  'poses', 'gestures', 'expressions',
  'clothing', 'body_hair',
  'environments', 'time_period', 'social_setting', 'weather_effects',
  'camera_lighting_style', 'composition',
  'art_medium', 'mood_emotion', 'color_palette',
  'quality',
]

function getCategoryRank(category: string | undefined): number {
  if (!category) return 99
  const idx = CATEGORY_ORDER.findIndex(c => category.startsWith(c))
  return idx === -1 ? 99 : idx
}

// ─── Tag phrasing maps for natural-language prompt generation ───────────────

const TAG_PHRASES: Record<string, string> = {
  // Subject
  'woman': 'a woman',
  'man': 'a man',
  'girl': 'a girl',
  'boy': 'a boy',
  'person': 'a person',
  'child': 'a child',
  'elderly person': 'an elderly person',
  'couple': 'a couple',
  'group': 'a group of people',
  // Body
  'athletic': 'with an athletic build',
  'slim': 'with a slender figure',
  'curvy': 'with curvy proportions',
  'muscular': 'with a muscular physique',
  'petite': 'with a petite frame',
  'tall': 'tall',
  // Hair
  'long hair': 'with long flowing hair',
  'short hair': 'with short hair',
  'curly hair': 'with curly hair',
  'blonde': 'with blonde hair',
  'brunette': 'with dark brown hair',
  'red hair': 'with red hair',
  'black hair': 'with black hair',
  'white hair': 'with white hair',
  'silver hair': 'with silver hair',
  'braids': 'with braided hair',
  'ponytail': 'with hair in a ponytail',
  'bun': 'with hair in a bun',
  // Expressions
  'smiling': 'smiling gently',
  'laughing': 'laughing',
  'serious': 'with a serious expression',
  'pensive': 'looking pensive',
  'confident': 'with a confident gaze',
  'enigmatic': 'with an enigmatic gaze',
  // Clothing
  'dress': 'wearing a dress',
  'suit': 'wearing a tailored suit',
  'casual': 'in casual clothing',
  'armor': 'wearing ornate armor',
  'robe': 'draped in flowing robes',
  'gown': 'wearing an elegant gown',
  'hoodie': 'wearing a hoodie',
  'leather jacket': 'wearing a leather jacket',
  'tuxedo': 'in a tuxedo',
  'kimono': 'wearing a kimono',
  // Poses
  'standing': 'standing',
  'sitting': 'seated',
  'walking': 'walking',
  'running': 'running',
  'lying down': 'lying down',
  'looking away': 'gazing into the distance',
  'looking at viewer': 'looking directly at the viewer',
  // Settings / environments
  'forest': 'in a forest',
  'beach': 'on a beach',
  'city street': 'on a city street',
  'mountain': 'on a mountainside',
  'garden': 'in a garden',
  'ocean': 'by the ocean',
  'desert': 'in a vast desert',
  'snow': 'in snow-covered terrain',
  'rain': 'in the rain',
  'night': 'at night',
  'sunset': 'at sunset',
  'sunrise': 'at sunrise',
  'studio': 'in a studio',
  'cave': 'inside a cave',
  'ruins': 'among ancient ruins',
  'temple': 'at a temple',
  'alleyway': 'in a narrow alleyway',
  'rooftop': 'on a rooftop',
  'cafe': 'in a café',
  'underwater': 'underwater',
  'space': 'in outer space',
  'cyberpunk': 'in a cyberpunk cityscape',
  // Lighting
  'golden hour': 'bathed in golden hour light',
  'natural light': 'under natural light',
  'studio lighting': 'under studio lighting',
  'neon lighting': 'illuminated by neon lights',
  'dramatic lighting': 'in dramatic lighting',
  'soft lighting': 'in soft diffused lighting',
  'rim lighting': 'with rim lighting',
  'backlighting': 'backlit',
  'volumetric lighting': 'with volumetric light rays',
  'candlelit': 'by candlelight',
  'moonlit': 'under moonlight',
  'low key': 'in low-key lighting',
  'high key': 'in high-key lighting',
  'hard lighting': 'under harsh direct light',
  // Camera
  'close-up': 'seen in a close-up',
  'wide angle': 'captured with a wide-angle lens',
  'bokeh': 'with a shallow depth of field and bokeh',
  'shallow depth of field': 'with shallow depth of field',
  'telephoto': 'shot with a telephoto lens',
  'bird\'s eye': 'from a bird\'s-eye view',
  'low angle': 'from a low angle',
  'high angle': 'from a high angle',
  'macro': 'in macro detail',
  '35mm film': 'as if shot on 35mm film',
  'anamorphic': 'with an anamorphic look',
  // Style
  'photorealistic': 'in a photorealistic style',
  'oil painting': 'in the style of an oil painting',
  'watercolor': 'painted in watercolors',
  'pencil sketch': 'as a pencil sketch',
  'anime': 'in anime style',
  'digital art': 'as digital art',
  'concept art': 'as concept art',
  'cinematic': 'with a cinematic look',
  'fantasy': 'in a fantasy art style',
  'surrealism': 'in a surrealist style',
  'impressionism': 'in an impressionist style',
  'pixel art': 'in pixel art style',
  'cartoon': 'in a cartoon style',
  '3d render': 'as a 3D render',
  'film grain': 'with film grain',
  'black and white': 'in black and white',
  'noir': 'in noir style',
  'comic book': 'in comic book style',
  'ink drawing': 'as an ink drawing',
  'charcoal': 'as a charcoal drawing',
  'pastel': 'in pastel',
  'stained glass': 'as stained glass',
  'vintage': 'with a vintage aesthetic',
  'hyperrealistic': 'in a hyperrealistic style',
  'minimalist': 'in a minimalist style',
  'baroque': 'in the baroque style',
  'art nouveau': 'in art nouveau style',
  'art deco': 'in art deco style',
  'ukiyo-e': 'in ukiyo-e style',
  'pop art': 'in pop art style',
  // Mood
  'serene': 'exuding serenity',
  'melancholy': 'with a melancholic mood',
  'dramatic': 'with dramatic intensity',
  'mysterious': 'with an air of mystery',
  'peaceful': 'in a peaceful mood',
  'intense': 'with intense energy',
  'romantic': 'with romantic warmth',
  'vibrant': 'with vibrant energy',
  'dark': 'with a dark atmosphere',
  'cheerful': 'with cheerful warmth',
  'epic': 'with epic grandeur',
  'dreamy': 'with dreamy softness',
  'ominous': 'with an ominous tone',
  'tense': 'with palpable tension',
  'whimsical': 'with whimsical charm',
  'nostalgic': 'with nostalgic longing',
  'powerful': 'radiating power',
  'gentle': 'with gentle softness',
  // Quality boosters (handled separately in prose)
  '8k': '',
  '4k': '',
  'high detail': '',
  'detailed': '',
  'sharp focus': '',
  'masterpiece': '',
  'best quality': '',
  'high resolution': '',
  'ultra detailed': '',
}

// Style-based sentence templates for prose generation

// ─── Prose connectors for assembling natural language ──────────────────────

const PREPOSITIONAL_SETTING = /^(?:in|on|at|by|under|inside|outside|among|amid|amidst|within|near|beside|around|through|across)\b/i

function settingClause(phrases: string[]): string {
  const phrase = phrases.join(' and ')
  return PREPOSITIONAL_SETTING.test(phrase) ? `Set ${phrase}` : `Set in ${phrase}`
}

// ─── Slot classification ────────────────────────────────────────────────────

type PromptSlot = 'subject' | 'body' | 'clothing' | 'setting' | 'lighting' | 'camera' | 'style' | 'mood' | 'quality'

const SLOT_CATEGORY_MAP: Record<PromptSlot, string[]> = {
  subject: ['character_anatomy', 'poses', 'gestures', 'expressions', 'facial_features', 'subject'],
  body: ['body_types', 'breast', 'buttocks', 'male_chest', 'skin', 'age', 'ethnicity', 'hair', 'body_modifications', 'body_hair', 'anthropomorphic', 'fantasy_races'],
  clothing: ['clothing'],
  setting: ['environments', 'time_period', 'social_setting', 'weather_effects'],
  lighting: ['camera_lighting_style'],
  camera: ['composition', 'camera_lighting_style'],
  style: ['art_medium'],
  mood: ['mood_emotion', 'color_palette'],
  quality: ['quality'],
}

function classifyTag(tag: SelectedTag): PromptSlot {
  const cat = tag.category ?? ''
  for (const [slot, categories] of Object.entries(SLOT_CATEGORY_MAP)) {
    if (categories.some(c => cat.startsWith(c) || cat === c)) {
      return slot as PromptSlot
    }
  }
  // Fallback: use raw category
  return 'quality'
}

// ─── Core Composer ─────────────────────────────────────────────────────────

export interface ComposeOptions {
  tags: SelectedTag[]
  customText: string
  model: SupportedModel
  parameters: ModelParameters
  qualityBoosters?: string[]
}

export class PromptComposer {
  /**
   * Compose a prompt string tailored to the target model's format.
   */
  compose(options: ComposeOptions): string {
    const config = getModelConfig(options.model)

    // Sort tags by visual coherence order
    const sorted = [...options.tags].sort(
      (a, b) => getCategoryRank(a.category) - getCategoryRank(b.category)
    )

    switch (config.promptStyle) {
      case 'midjourney-params':
        return this.composeMidjourney(sorted, options)
      case 'structured-prose':
        return this.composeStructuredProse(sorted, options)
      case 'prose':
        return this.composeProse(sorted, options)
      case 'comma-separated':
      default:
        return this.composeCommaSeparated(sorted, options, config)
    }
  }

  // ─── Midjourney ─────────────────────────────────────────────────────────

  private composeMidjourney(tags: SelectedTag[], options: ComposeOptions): string {
    const parts: string[] = []

    if (options.customText.trim()) parts.push(options.customText.trim())

    for (const tag of tags) {
      const formatted = this.formatTagForModel(tag, 'midjourney')
      if (formatted) parts.push(formatted)
    }

    const boosters = options.qualityBoosters ?? []
    for (const b of boosters) {
      if (!parts.some(p => p.toLowerCase().includes(b.toLowerCase()))) {
        parts.push(b)
      }
    }

    let prompt = parts.join(', ')

    // Append Midjourney parameters
    const params = options.parameters
    if (params.aspectRatio) prompt += ` --ar ${params.aspectRatio}`
    else prompt += ' --ar 16:9'
    if (params.style) prompt += ` --s ${params.style}`
    if (params.chaos) prompt += ` --c ${params.chaos}`
    if (params.quality) prompt += ` --q ${params.quality}`
    if (params.no) prompt += ` --no ${params.no}`
    prompt += ' --v 8'

    return prompt
  }

  // ─── Natural prose (GPT Image 2) ────────────────────────────────────────

  private composeStructuredProse(tags: SelectedTag[], options: ComposeOptions): string {
    const slots = this.classifyIntoSlots(tags)

    // Build natural language phrases from tags
    const subjectPhrases = slots.subject.map(t => this.tagToPhrase(t))
    const bodyPhrases = slots.body.map(t => this.tagToPhrase(t))
    const clothingPhrases = slots.clothing.map(t => this.tagToPhrase(t))
    const settingPhrases = slots.setting.map(t => this.tagToPhrase(t))
    const lightingPhrases = slots.lighting.map(t => this.tagToPhrase(t))
    const cameraPhrases = slots.camera.map(t => this.tagToPhrase(t))
    const stylePhrases = slots.style.map(t => this.tagToPhrase(t))
    const moodPhrases = slots.mood.map(t => this.tagToPhrase(t))
    const qualityPhrases = slots.quality.map(t => this.tagToPhrase(t)).filter(Boolean)

    const pieces: string[] = []

    // The artist's words stay first and remain verbatim within the composed prompt.
    if (options.customText.trim()) {
      pieces.push(options.customText.trim())
    }

    const subjectParts: string[] = []
    if (subjectPhrases.length > 0) subjectParts.push(this.joinPhrases(subjectPhrases))
    if (bodyPhrases.length > 0) subjectParts.push(this.joinPhrases(bodyPhrases))
    if (clothingPhrases.length > 0) subjectParts.push(this.joinPhrases(clothingPhrases))
    if (subjectParts.length > 0) {
      pieces.push(this.capitalizeFirst(subjectParts.join(', ')))
    }

    if (settingPhrases.length > 0) pieces.push(settingClause(settingPhrases))

    if (lightingPhrases.length > 0) pieces.push(this.capitalizeFirst(this.joinPhrases(lightingPhrases)))
    if (moodPhrases.length > 0) pieces.push(this.capitalizeFirst(this.joinPhrases(moodPhrases)))
    if (cameraPhrases.length > 0) pieces.push(this.capitalizeFirst(this.joinPhrases(cameraPhrases)))

    if (stylePhrases.length > 0) {
      pieces.push(`Rendered in ${this.joinPhrases(stylePhrases)}`)
    }

    const qualityBoosters = options.qualityBoosters ?? []
    const quality = [...qualityPhrases, ...qualityBoosters].filter(Boolean)
    if (quality.length > 0) pieces.push(this.capitalizeFirst(this.joinPhrases(quality)))

    return this.assembleProse(pieces)
  }

  // ─── Prose (Nano Banana 2, Ideogram) ─────────────────────────────────────

  private composeProse(tags: SelectedTag[], options: ComposeOptions): string {
    // Classify tags into slots for natural assembly
    const slots = this.classifyIntoSlots(tags)

    // Build natural language phrases from tags
    const subjectPhrases = slots.subject.map(t => this.tagToPhrase(t))
    const bodyPhrases = slots.body.map(t => this.tagToPhrase(t))
    const clothingPhrases = slots.clothing.map(t => this.tagToPhrase(t))
    const settingPhrases = slots.setting.map(t => this.tagToPhrase(t))
    const lightingPhrases = slots.lighting.map(t => this.tagToPhrase(t))
    const cameraPhrases = slots.camera.map(t => this.tagToPhrase(t))
    const stylePhrases = slots.style.map(t => this.tagToPhrase(t))
    const moodPhrases = slots.mood.map(t => this.tagToPhrase(t))
    const qualityPhrases = slots.quality.map(t => this.tagToPhrase(t))

    // The artist's exact words always lead the effective prompt.
    const pieces: string[] = options.customText.trim() ? [options.customText.trim()] : []

    // Subject + body + clothing
    const subjectStr = this.joinPhrases(subjectPhrases)
    const bodyStr = this.joinPhrases(bodyPhrases)
    const clothingStr = this.joinPhrases(clothingPhrases)

    if (subjectStr) {
      let subjectSentence = subjectStr
      if (bodyStr) subjectSentence += ', ' + bodyStr
      if (clothingStr) subjectSentence += ', ' + clothingStr
      pieces.push(this.capitalizeFirst(subjectSentence))
    }

    // Setting
    if (settingPhrases.length > 0) {
      const settingStr = this.joinPhrases(settingPhrases)
      pieces.push(settingClause([settingStr]))
    }

    // Lighting
    if (lightingPhrases.length > 0) {
      const lightingStr = this.joinPhrases(lightingPhrases)
      pieces.push(lightingStr)
    }

    // Mood
    if (moodPhrases.length > 0) {
      const moodStr = this.joinPhrases(moodPhrases)
      pieces.push(moodStr)
    }

    // Camera
    if (cameraPhrases.length > 0) {
      const cameraStr = this.joinPhrases(cameraPhrases)
      pieces.push(cameraStr)
    }

    // Style — use a connector
    if (stylePhrases.length > 0) {
      const styleStr = this.joinPhrases(stylePhrases)
      pieces.push(`Rendered in ${styleStr}`)
    }

    // Quality boosters
    const qualityStr = [...qualityPhrases, ...(options.qualityBoosters ?? [])]
      .filter(q => q)
      .join(', ')
    if (qualityStr) {
      pieces.push(qualityStr)
    }

    return this.assembleProse(pieces)
  }

  // ─── Comma-separated (SD 3.5, FLUX 2, Qwen, Illustrious, Custom) ──────

  private composeCommaSeparated(
    tags: SelectedTag[],
    options: ComposeOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _config: ReturnType<typeof getModelConfig>
  ): string {
    const parts: string[] = []

    if (options.customText.trim()) parts.push(options.customText.trim())

    for (const tag of tags) {
      const formatted = this.formatTagForModel(tag, options.model)
      if (formatted) parts.push(formatted)
    }

    const boosters = options.qualityBoosters ?? []
    for (const b of boosters) {
      if (!parts.some(p => p.toLowerCase().includes(b.toLowerCase()))) {
        parts.push(b)
      }
    }

    return parts.join(', ')
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private formatTagForModel(tag: SelectedTag, model: SupportedModel): string {
    const config = getModelConfig(model)
    let label = tag.label

    // Apply trigger words
    if (tag.triggerWords && tag.triggerWords.length > 0) {
      if (config.triggerWordStyle === 'prefix') {
        label = tag.triggerWords.join(', ') + ', ' + label
      } else if (config.triggerWordStyle === 'inline') {
        label = tag.triggerWords.join(' ') + ' ' + label
      }
    }

    // Apply weighting
    if (tag.customWeight && tag.customWeight !== 1.0 && config.supportsWeighting) {
      label = config.weightFormat(tag.label, tag.customWeight)
    }

    return label
  }

  private tagToPhrase(tag: SelectedTag): string {
    const key = tag.label.toLowerCase()
    // Check exact match first
    if (TAG_PHRASES[key]) return TAG_PHRASES[key]
    // Unknown taxonomy labels remain exact authored ingredient language.
    return tag.label
  }

  private classifyIntoSlots(tags: SelectedTag[]): Record<PromptSlot, SelectedTag[]> {
    const slots: Record<PromptSlot, SelectedTag[]> = {
      subject: [], body: [], clothing: [], setting: [],
      lighting: [], camera: [], style: [], mood: [], quality: [],
    }
    for (const tag of tags) {
      const slot = classifyTag(tag)
      slots[slot].push(tag)
    }
    return slots
  }

  private joinPhrases(phrases: string[]): string {
    if (phrases.length === 0) return ''
    if (phrases.length === 1) return phrases[0]
    if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`
    return phrases.slice(0, -1).join(', ') + ', and ' + phrases[phrases.length - 1]
  }

  private capitalizeFirst(s: string): string {
    if (!s) return s
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  private assembleProse(pieces: string[]): string {
    if (pieces.length === 0) return ''
    if (pieces.length === 1) return pieces[0].endsWith('.') ? pieces[0] : pieces[0] + '.'
    // Combine pieces with appropriate separators
    const joined = pieces.filter(Boolean).join('. ')
    return joined.endsWith('.') ? joined : joined + '.'
  }

}

// Singleton
export const promptComposer = new PromptComposer()
