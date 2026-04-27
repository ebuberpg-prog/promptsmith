import type { SupportedModel, ModelParameters } from './index'

// Renamed from PromptTemplate to GalleryTemplate to avoid collision with the store type
export interface GalleryTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: TemplateCategory
  // Display tags (labels) for the gallery UI
  tags: string[]
  // Actual taxonomy tag IDs — resolved to real TaxonomyTag objects when applied
  tagIds: string[]
  model: SupportedModel
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  examplePrompt: string
  // Per-model parameter defaults applied when this template is used
  modelParams?: Partial<Record<SupportedModel, Partial<ModelParameters>>>
}

export type TemplateCategory =
  | 'portrait'
  | 'landscape'
  | 'product'
  | 'abstract'
  | 'character'
  | 'architecture'
  | 'food'
  | 'fashion'
  | 'concept-art'
  | 'photography'

export const PROMPT_TEMPLATES: GalleryTemplate[] = [
  {
    id: 'portrait-studio',
    name: 'Studio Portrait',
    description: 'Professional portrait with studio lighting',
    icon: '👤',
    category: 'portrait',
    tags: ['portrait', 'studio lighting', 'soft light', 'bokeh', 'professional'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Professional studio portrait, soft diffused lighting, shallow depth of field, clean background',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
    },
  },
  {
    id: 'cinematic-portrait',
    name: 'Cinematic Portrait',
    description: 'Dramatic movie-style character portrait',
    icon: '🎬',
    category: 'portrait',
    tags: ['cinematic', 'dramatic lighting', 'character portrait', 'moody', 'film grain'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'intermediate',
    examplePrompt: 'Cinematic portrait, dramatic rim lighting, moody atmosphere, film grain, anamorphic lens',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '1000', chaos: 10 },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
    },
  },
  {
    id: 'landscape-golden',
    name: 'Golden Hour Landscape',
    description: 'Beautiful landscape at golden hour',
    icon: '🌅',
    category: 'landscape',
    tags: ['landscape', 'golden hour', 'wide angle', 'dramatic sky', 'nature'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Breathtaking landscape at golden hour, warm sunlight, dramatic clouds, wide angle perspective',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
    },
  },
  {
    id: 'product-photography',
    name: 'Product Photography',
    description: 'Clean product shot with professional lighting',
    icon: '📦',
    category: 'product',
    tags: ['product photography', 'studio lighting', 'clean background', 'professional', 'commercial'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Professional product photography, clean white background, studio lighting, commercial quality',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
    },
  },
  {
    id: 'abstract-fluid',
    name: 'Abstract Fluid Art',
    description: 'Colorful abstract fluid painting style',
    icon: '🎨',
    category: 'abstract',
    tags: ['abstract', 'fluid art', 'colorful', 'dynamic', 'contemporary'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Abstract fluid art, vibrant colors, dynamic composition, contemporary style, flowing forms',
    modelParams: {
      midjourney: { aspectRatio: '1:1', chaos: 30 },
    },
  },
  {
    id: 'character-design',
    name: 'Character Design',
    description: 'Fantasy character concept design',
    icon: '⚔️',
    category: 'character',
    tags: ['character design', 'fantasy', 'concept art', 'detailed', 'illustration'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'intermediate',
    examplePrompt: 'Fantasy character design, concept art, detailed illustration, dynamic pose, rich colors',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750' },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
    },
  },
  {
    id: 'architecture-modern',
    name: 'Modern Architecture',
    description: 'Contemporary building with clean lines',
    icon: '🏛️',
    category: 'architecture',
    tags: ['architecture', 'modern', 'clean lines', 'minimalist', 'contemporary'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Modern architecture, clean geometric lines, minimalist design, contemporary style, natural light',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '500' },
    },
  },
  {
    id: 'food-photography',
    name: 'Food Photography',
    description: 'Appetizing food shot with natural light',
    icon: '🍽️',
    category: 'food',
    tags: ['food photography', 'natural light', 'appetizing', 'styling', 'overhead'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Professional food photography, natural window light, overhead composition, appetizing styling',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
    },
  },
  {
    id: 'fashion-editorial',
    name: 'Fashion Editorial',
    description: 'High-fashion magazine style shot',
    icon: '👗',
    category: 'fashion',
    tags: ['fashion', 'editorial', 'high fashion', 'stylish', 'magazine'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'intermediate',
    examplePrompt: 'Fashion editorial photography, high fashion styling, magazine quality, dramatic pose, elegant lighting',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '1000' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
    },
  },
  {
    id: 'concept-art-scifi',
    name: 'Sci-Fi Concept Art',
    description: 'Futuristic sci-fi environment concept',
    icon: '🚀',
    category: 'concept-art',
    tags: ['concept art', 'sci-fi', 'futuristic', 'environment', 'detailed'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'intermediate',
    examplePrompt: 'Sci-fi concept art, futuristic environment, detailed worldbuilding, atmospheric lighting, epic scale',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750', chaos: 15 },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
    },
  },
  {
    id: 'street-photography',
    name: 'Street Photography',
    description: 'Candid urban street scene',
    icon: '📷',
    category: 'photography',
    tags: ['street photography', 'urban', 'candid', 'documentary', 'black and white'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'beginner',
    examplePrompt: 'Street photography, urban scene, candid moment, documentary style, black and white',
    modelParams: {
      midjourney: { aspectRatio: '3:2', style: '500' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
    },
  },
  {
    id: 'macro-nature',
    name: 'Macro Nature',
    description: 'Close-up nature photography with shallow DOF',
    icon: '🔍',
    category: 'photography',
    tags: ['macro', 'nature', 'close-up', 'shallow depth of field', 'detailed'],
    tagIds: [],
    model: 'midjourney',
    difficulty: 'intermediate',
    examplePrompt: 'Macro nature photography, extreme close-up, shallow depth of field, intricate details, natural light',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
    },
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '✨' },
  { id: 'portrait', name: 'Portraits', icon: '👤' },
  { id: 'landscape', name: 'Landscapes', icon: '🌄' },
  { id: 'product', name: 'Products', icon: '📦' },
  { id: 'character', name: 'Characters', icon: '⚔️' },
  { id: 'architecture', name: 'Architecture', icon: '🏛️' },
  { id: 'photography', name: 'Photography', icon: '📷' },
  { id: 'abstract', name: 'Abstract', icon: '🎨' },
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'concept-art', name: 'Concept Art', icon: '🚀' },
  { id: 'food', name: 'Food', icon: '🍽️' },
]

export const DIFFICULTY_LABELS = {
  beginner: 'Easy',
  intermediate: 'Medium',
  advanced: 'Advanced',
}

export const DIFFICULTY_COLORS = {
  beginner: 'text-success bg-success/10',
  intermediate: 'text-warning bg-warning/10',
  advanced: 'text-error bg-error/10',
}
