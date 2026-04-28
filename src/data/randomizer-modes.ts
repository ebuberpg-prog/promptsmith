import type { SlotId } from './randomizer-slots'

export type RandomizerMode =
  | 'smart'
  | 'wild'

export interface RandomizerModeDef {
  id: RandomizerMode
  label: string
  description: string
  icon: string
}

export const RANDOMIZER_MODES: RandomizerModeDef[] = [
  {
    id: 'smart',
    label: 'Smart',
    description: 'Coherence-driven. Pick a vibe, get a conflict-free prompt.',
    icon: 'Sparkle',
  },
  {
    id: 'wild',
    label: 'Wild',
    description: 'Chaos-driven. Random combinations, no rules, pure surprise.',
    icon: 'Shuffle',
  },
]

// Intent-based concepts for Intent-First mode
export interface IntentDefinition {
  id: string
  label: string
  description: string
  // Which slots to fill and with what keywords
  slotIntent: Partial<Record<SlotId, { keywords: string[]; count: number }>>
  // Primary theme keywords that should appear across multiple slots
  themeKeywords: string[]
}

export const INTENTS: IntentDefinition[] = [
  {
    id: 'noir-portrait',
    label: 'Moody Noir Portrait',
    description: 'Dramatic low-key portrait with shadows and mystery',
    slotIntent: {
      subject: { keywords: ['close-up', 'intense', 'dramatic'], count: 2 },
      lighting: { keywords: ['low key', 'dramatic', 'rim', 'shadow'], count: 2 },
      camera: { keywords: ['close-up', 'shallow', 'low angle'], count: 1 },
      mood: { keywords: ['mysterious', 'intense', 'dramatic'], count: 2 },
      setting: { keywords: ['alley', 'city', 'night'], count: 1 },
      style: { keywords: ['noir', 'film grain', 'black'], count: 1 },
    },
    themeKeywords: ['noir', 'shadow', 'dramatic', 'mystery'],
  },
  {
    id: 'ethereal-fantasy',
    label: 'Ethereal Fantasy',
    description: 'Magical scene with luminous lighting and otherworldly atmosphere',
    slotIntent: {
      subject: { keywords: ['fantasy', 'magical', 'flowing'], count: 2 },
      lighting: { keywords: ['backlight', 'volumetric', 'glow', 'rim'], count: 2 },
      camera: { keywords: ['wide', 'epic'], count: 1 },
      mood: { keywords: ['mysterious', 'ethereal', 'magical'], count: 2 },
      setting: { keywords: ['forest', 'enchanted', 'ruins'], count: 1 },
      style: { keywords: ['fantasy', 'ethereal', 'concept art'], count: 1 },
    },
    themeKeywords: ['ethereal', 'magic', 'glow', 'fantasy'],
  },
  {
    id: 'fashion-editorial',
    label: 'High-Fashion Editorial',
    description: 'Clean studio look with sophisticated styling',
    slotIntent: {
      subject: { keywords: ['full body', 'fashion', 'confident'], count: 2 },
      lighting: { keywords: ['studio', 'soft', 'rim', 'high key'], count: 2 },
      camera: { keywords: ['full body', 'fashion'], count: 1 },
      mood: { keywords: ['confident', 'powerful', 'dramatic'], count: 1 },
      setting: { keywords: ['studio', 'minimal'], count: 1 },
      style: { keywords: ['fashion', 'editorial', 'high fashion'], count: 1 },
    },
    themeKeywords: ['fashion', 'studio', 'editorial', 'sophisticated'],
  },
  {
    id: 'gritty-documentary',
    label: 'Gritty Documentary',
    description: 'Raw urban realism with harsh lighting and honest emotion',
    slotIntent: {
      subject: { keywords: ['candid', 'natural', 'authentic'], count: 2 },
      lighting: { keywords: ['hard', 'natural', 'harsh'], count: 2 },
      camera: { keywords: ['35mm', 'street', 'documentary'], count: 1 },
      mood: { keywords: ['raw', 'authentic', 'melancholy'], count: 2 },
      setting: { keywords: ['street', 'urban', 'city'], count: 1 },
      style: { keywords: ['documentary', 'grain', 'street'], count: 1 },
    },
    themeKeywords: ['gritty', 'urban', 'raw', 'authentic'],
  },
  {
    id: 'romantic-natural',
    label: 'Romantic Nature',
    description: 'Soft natural light in an outdoor setting with warm mood',
    slotIntent: {
      subject: { keywords: ['soft', 'natural', 'flowing'], count: 2 },
      lighting: { keywords: ['golden hour', 'natural', 'soft', 'warm'], count: 2 },
      camera: { keywords: ['shallow', 'wide'], count: 1 },
      mood: { keywords: ['romantic', 'peaceful', 'serene'], count: 2 },
      setting: { keywords: ['meadow', 'forest', 'garden'], count: 1 },
      style: { keywords: ['natural', 'soft', 'romantic'], count: 1 },
    },
    themeKeywords: ['romantic', 'natural', 'soft', 'warm'],
  },
  {
    id: 'cyberpunk-dystopian',
    label: 'Cyberpunk Dystopian',
    description: 'Neon-lit futuristic scene with high-tech aesthetic',
    slotIntent: {
      subject: { keywords: ['cyberpunk', 'futuristic', 'tech'], count: 2 },
      lighting: { keywords: ['neon', 'cool', 'cyberpunk', 'rim'], count: 2 },
      camera: { keywords: ['wide', 'tracking'], count: 1 },
      mood: { keywords: ['dystopian', 'futuristic', 'intense'], count: 2 },
      setting: { keywords: ['cyberpunk', 'city', 'neon'], count: 1 },
      style: { keywords: ['cyberpunk', 'neon', 'sci-fi'], count: 1 },
    },
    themeKeywords: ['cyberpunk', 'neon', 'futuristic', 'dystopian'],
  },
  {
    id: 'vintage-nostalgia',
    label: 'Vintage Nostalgia',
    description: 'Warm nostalgic tones with film grain aesthetic',
    slotIntent: {
      subject: { keywords: ['nostalgic', 'warm', 'retro'], count: 2 },
      lighting: { keywords: ['warm', 'candle', 'soft', 'golden'], count: 2 },
      camera: { keywords: ['35mm', 'vintage'], count: 1 },
      mood: { keywords: ['nostalgic', 'romantic', 'warm'], count: 2 },
      setting: { keywords: ['vintage', 'cafe', 'retro'], count: 1 },
      style: { keywords: ['film grain', 'vintage', 'retro'], count: 1 },
    },
    themeKeywords: ['vintage', 'nostalgic', 'warm', 'film'],
  },
  {
    id: 'bold-graphic',
    label: 'Bold & Graphic',
    description: 'High-contrast composition with strong visual impact',
    slotIntent: {
      subject: { keywords: ['bold', 'graphic', 'dynamic'], count: 2 },
      lighting: { keywords: ['studio', 'dramatic', 'rim', 'high key'], count: 2 },
      camera: { keywords: ['close-up', 'low angle'], count: 1 },
      mood: { keywords: ['powerful', 'dramatic', 'intense'], count: 2 },
      setting: { keywords: ['minimal', 'studio'], count: 1 },
      style: { keywords: ['high contrast', 'graphic', 'bold'], count: 1 },
    },
    themeKeywords: ['bold', 'graphic', 'dramatic', 'contrast'],
  },
]

export function getIntentById(id: string): IntentDefinition | undefined {
  return INTENTS.find(i => i.id === id)
}
