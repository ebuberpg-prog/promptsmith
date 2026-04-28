import type { SlotId } from './randomizer-slots'

export interface VibeDefinition {
  id: string
  label: string
  description: string
  icon: string
  // For each slot: label substrings / keywords to bias toward when picking tags
  slotKeywords: Partial<Record<SlotId, string[]>>
  // Extra accent tags to add at 'full' intensity (label substrings)
  accentKeywords: string[]
  requiresExplicit: boolean
}

// Keywords are matched as case-insensitive substrings against actual taxonomy labels.
// Only use keywords that provably exist in the taxonomy YAML files to ensure matches.
export const VIBES: VibeDefinition[] = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Movie-quality scenes with dramatic lighting',
    icon: 'FilmSlate',
    slotKeywords: {
      lighting: ['dramatic lighting', 'rim lighting', 'cinematic', 'neon lighting'],
      style: ['film grain', 'cinematic', 'photorealistic', 'graphic novel'],
      camera: ['shallow depth', 'bokeh', 'wide', 'tracking shot'],
      mood: ['dramatic', 'intense', 'tense'],
      setting: ['city street', 'alleyway', 'rooftop'],
    },
    accentKeywords: ['lens flare', 'vignette', 'motion blur'],
    requiresExplicit: false,
  },
  {
    id: 'dreamy',
    label: 'Dreamy',
    description: 'Soft, ethereal scenes with a magical quality',
    icon: 'Sparkle',
    slotKeywords: {
      lighting: ['soft light', 'backlighting', 'warm lighting', 'volumetric lighting'],
      style: ['watercolor', 'impressionism', 'soft', 'painterly'],
      mood: ['peaceful', 'serene', 'dreamy', 'tender'],
      setting: ['garden', 'meadow', 'foggy', 'forest'],
      camera: ['shallow depth', 'bokeh', 'wide'],
    },
    accentKeywords: ['bokeh', 'lens flare', 'vignette'],
    requiresExplicit: false,
  },
  {
    id: 'gritty',
    label: 'Gritty',
    description: 'Raw, documentary-style urban realism',
    icon: 'Buildings',
    slotKeywords: {
      lighting: ['hard light', 'high key lighting', 'natural light', 'low key lighting'],
      style: ['documentary photography', 'street photography', 'charcoal drawing', 'black'],
      mood: ['melancholy', 'gloomy', 'tense', 'hostile'],
      setting: ['city street', 'alleyway', 'rooftop'],
      camera: ['35mm film', 'grain'],
    },
    accentKeywords: ['film grain', 'vignette', 'desaturated'],
    requiresExplicit: false,
  },
  {
    id: 'ethereal',
    label: 'Ethereal',
    description: 'Luminous, otherworldly atmosphere',
    icon: 'Moon',
    slotKeywords: {
      lighting: ['backlighting', 'volumetric lighting', 'cool lighting', 'neon lighting', 'rim lighting'],
      style: ['fantasy', 'surrealism', 'concept art', 'ethereal'],
      mood: ['mysterious', 'epic', 'eerie', 'ominous'],
      setting: ['forest', 'cave', 'ruins', 'temple'],
      camera: ['wide', 'shallow depth'],
    },
    accentKeywords: ['vignette', 'lens flare', 'volumetric'],
    requiresExplicit: false,
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'High-impact, graphic compositions',
    icon: 'Lightning',
    slotKeywords: {
      lighting: ['studio lighting', 'dramatic lighting', 'high key lighting', 'rim lighting'],
      style: ['graphic novel', 'pop art', 'minimalism', 'bold'],
      mood: ['powerful', 'dramatic', 'intense', 'heroic'],
      setting: ['studio', 'minimal', 'white'],
      camera: ['close-up', 'extreme close-up', 'low angle'],
    },
    accentKeywords: ['bold', 'silhouette', 'dramatic'],
    requiresExplicit: false,
  },
  {
    id: 'vintage',
    label: 'Vintage',
    description: 'Nostalgic film photography aesthetic',
    icon: 'Camera',
    slotKeywords: {
      lighting: ['warm lighting', 'candlelight', 'golden hour', 'soft light'],
      style: ['film grain', 'vintage', 'retro-futurism', 'instant film'],
      mood: ['nostalgic', 'romantic', 'peaceful'],
      setting: ['cafe', 'retro', 'vintage'],
      camera: ['35mm film', '16mm film', 'instant camera'],
    },
    accentKeywords: ['vignette', 'film grain', 'expired film'],
    requiresExplicit: false,
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon-lit dystopian future',
    icon: 'Robot',
    slotKeywords: {
      lighting: ['neon lighting', 'cool lighting', 'red lighting', 'blue lighting', 'bioluminescent'],
      style: ['cyberpunk', 'glitch art', 'vaporwave', 'synthwave', 'retro-futurism'],
      mood: ['dystopian', 'tense', 'dark mood', 'intense'],
      setting: ['cyberpunk apartment', 'city street', 'laboratory', 'space station'],
      camera: ['wide', 'tracking shot'],
    },
    accentKeywords: ['neon', 'glow', 'vignette'],
    requiresExplicit: false,
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    description: 'Epic high-fantasy worlds and characters',
    icon: 'Dragon',
    slotKeywords: {
      lighting: ['dramatic lighting', 'rim lighting', 'warm lighting', 'backlighting'],
      style: ['fantasy', 'concept art', 'hyper detailed', 'ultra detailed'],
      mood: ['epic', 'mysterious', 'adventurous', 'dramatic'],
      setting: ['castle interior', 'forest', 'enchanted forest', 'dungeon', 'ruins'],
      camera: ['epic', 'wide', 'shallow depth'],
    },
    accentKeywords: ['magic', 'particles', 'glow', 'ethereal'],
    requiresExplicit: false,
  },
  {
    id: 'natural',
    label: 'Natural',
    description: 'Authentic nature and wildlife photography',
    icon: 'Leaf',
    slotKeywords: {
      lighting: ['natural light', 'golden hour', 'soft light', 'warm lighting'],
      style: ['photorealistic', 'documentary photography', 'fine art photography'],
      mood: ['peaceful', 'serene', 'zen', 'content'],
      setting: ['forest', 'mountains', 'ocean', 'meadow', 'field'],
      camera: ['telephoto lens', 'wide'],
    },
    accentKeywords: ['environmental', 'organic', 'authentic'],
    requiresExplicit: false,
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'High-fashion magazine quality',
    icon: 'Dress',
    slotKeywords: {
      lighting: ['studio lighting', 'rim lighting', 'soft light', 'high key lighting'],
      style: ['fashion photography', 'editorial', 'portrait photography', 'magazine'],
      mood: ['romantic', 'dramatic', 'powerful', 'elegant'],
      setting: ['studio', 'minimal', 'white'],
      camera: ['full body shot', 'three-quarter view', 'medium shot'],
    },
    accentKeywords: ['fashion', 'studio', 'dramatic'],
    requiresExplicit: false,
  },
]

export function getVibeById(id: string): VibeDefinition | undefined {
  return VIBES.find(v => v.id === id)
}
