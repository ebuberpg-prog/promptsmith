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

const PROSE_TEMPLATES = [
  (subject: string, setting: string, style: string, lighting: string, mood: string, clothing: string, camera: string): string => {
    const parts: string[] = []
    if (subject) parts.push(subject)
    if (clothing) parts.push(clothing)
    if (setting) parts.push(setting)
    if (lighting) parts.push(lighting)
    if (mood) parts.push(mood)
    if (camera) parts.push(camera)
    if (style) parts.push(style)
    return parts.join(', ') + '.'
  },
  (subject: string, setting: string, style: string, lighting: string, mood: string, clothing: string, camera: string): string => {
    let s = ''
    if (subject) s = subject
    if (clothing) s += s ? ', ' + clothing : clothing
    if (setting) s += s ? ', ' + setting : setting
    if (mood) s += s ? ', ' + mood : mood
    if (lighting) s += s ? ', ' + lighting : lighting
    if (camera) s += s ? ', ' + camera : camera
    if (style) s += s ? ', ' + style : style
    return s ? s + '.' : ''
  },
  (subject: string, setting: string, style: string, lighting: string, mood: string, clothing: string, camera: string): string => {
    const parts: string[] = []
    if (subject) parts.push(subject)
    if (clothing) parts.push(clothing)
    if (setting) parts.push(setting)
    if (lighting) parts.push(lighting)
    if (mood) parts.push(mood)
    if (style) parts.push(style)
    if (camera) parts.push(camera)
    return parts.join(', ') + '.'
  },
]

// ─── Prose connectors for assembling natural language ──────────────────────

const SUBJECT_CONNECTORS = ['A', 'The']
const SETTING_CONNECTORS = {
  prefix: ['set in', 'situated in', 'placed within', 'found in'],
  standalone: ['in', 'within', 'amidst', 'surrounded by'],
}
const STYLE_CONNECTORS = ['Rendered in', 'Created as', 'Depicted in', 'Painted in', 'Captured in']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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

    for (const tag of tags) {
      const formatted = this.formatTagForModel(tag, 'midjourney')
      if (formatted) parts.push(formatted)
    }

    if (options.customText.trim()) {
      parts.push(options.customText.trim())
    }

    // Add quality boosters if room
    const boosters = options.qualityBoosters ?? this.getQualityBoosters(tags, 'midjourney')
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
    prompt += ' --v 6'

    return prompt
  }

  // ─── Prose (DALL-E, Gemini, Ideogram) ──────────────────────────────────

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

    // Assemble into a flowing sentence
    const pieces: string[] = []

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
      // Use a connector like "set in" or "in"
      const connector = pickRandom(SETTING_CONNECTORS.prefix)
      pieces.push(`${connector} ${settingStr}`)
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
      const connector = pickRandom(STYLE_CONNECTORS)
      pieces.push(`${connector} ${styleStr}`)
    }

    // Quality boosters
    const qualityStr = [...qualityPhrases, ...(options.qualityBoosters ?? this.getQualityBoosters(tags, 'prose'))]
      .filter(q => q)
      .join(', ')
    if (qualityStr) {
      pieces.push(qualityStr)
    }

    // Custom text
    if (options.customText.trim()) {
      pieces.push(options.customText.trim())
    }

    return this.assembleProse(pieces)
  }

  // ─── Comma-separated (SDXL, FLUX, Qwen, z-image, Custom) ────────────

  private composeCommaSeparated(tags: SelectedTag[], options: ComposeOptions, config: ReturnType<typeof getModelConfig>): string {
    const parts: string[] = []

    for (const tag of tags) {
      const formatted = this.formatTagForModel(tag, options.model)
      if (formatted) parts.push(formatted)
    }

    if (options.customText.trim()) {
      parts.push(options.customText.trim())
    }

    // Add quality boosters
    const boosters = options.qualityBoosters ?? this.getQualityBoosters(tags, 'tag-based')
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
    // Check partial matches
    for (const [phraseKey, phrase] of Object.entries(TAG_PHRASES)) {
      if (key.includes(phraseKey)) return phrase
    }
    // Default: just use the label
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

  /**
   * Generate model-appropriate quality boosters based on selected tags.
   * Avoids adding boosters that already overlap with existing tags.
   */
  private getQualityBoosters(tags: SelectedTag[], context: 'midjourney' | 'prose' | 'tag-based'): string[] {
    const existingLabels = new Set(tags.map(t => t.label.toLowerCase()))
    const boosters: string[] = []

    // Check for photorealistic-adjacent styles
    const hasRealistStyle = existingLabels.has('photorealistic') || existingLabels.has('realistic')
    const hasPainterlyStyle = existingLabels.has('oil painting') || existingLabels.has('watercolor') || existingLabels.has('illustration')
    const hasAnimeStyle = existingLabels.has('anime') || existingLabels.has('cartoon')

    if (context === 'tag-based') {
      // SD/FLUX quality boosters
      if (!hasPainterlyStyle && !hasAnimeStyle) {
        if (!existingLabels.has('high detail')) boosters.push('high detail')
        if (!existingLabels.has('sharp focus')) boosters.push('sharp focus')
      }
      if (hasRealistStyle) {
        if (!existingLabels.has('masterpiece')) boosters.push('masterpiece')
        if (!existingLabels.has('best quality')) boosters.push('best quality')
      }
    } else if (context === 'midjourney') {
      // Midjourney benefits from shorter prompts; fewer boosters
      if (hasRealistStyle && !existingLabels.has('photorealistic')) {
        boosters.push('photorealistic')
      }
    } else if (context === 'prose') {
      // Prose models get quality as descriptive phrases
      if (hasRealistStyle) boosters.push('highly detailed')
      else if (!hasPainterlyStyle && !hasAnimeStyle) boosters.push('highly detailed')
    }

    return boosters
  }
}

// Singleton
export const promptComposer = new PromptComposer()