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
  | 'logo'
  | '3d-render'
  | 'pixel-art'
  | 'watercolor'
  | 'minimalism'
  | 'vehicle'
  | 'sports'
  | 'pattern'

export const PROMPT_TEMPLATES: GalleryTemplate[] = [
  // ── Portraits ────────────────────────────────────────────
  {
    id: 'portrait-studio',
    name: 'Studio Portrait',
    description: 'Professional portrait with studio lighting',
    icon: 'User',
    category: 'portrait',
    tags: ['portrait', 'studio lighting', 'soft light', 'bokeh', 'professional'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Professional studio portrait, soft diffused lighting, shallow depth of field, clean background',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '2:3', guidanceScale: 3.5 },
    },
  },
  {
    id: 'cinematic-portrait',
    name: 'Cinematic Portrait',
    description: 'Dramatic movie-style character portrait',
    icon: 'FilmSlate',
    category: 'portrait',
    tags: ['cinematic', 'dramatic lighting', 'character portrait', 'moody', 'film grain'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Cinematic portrait, dramatic rim lighting, moody atmosphere, film grain, anamorphic lens',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '1000', chaos: 10 },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '2:3', guidanceScale: 4 },
    },
  },
  {
    id: 'editorial-portrait',
    name: 'Editorial Portrait',
    description: 'Magazine-style portrait with bold styling',
    icon: 'User',
    category: 'portrait',
    tags: ['editorial', 'high fashion', 'bold makeup', 'studio backdrop', 'magazine'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Editorial portrait, bold makeup, dramatic styling, seamless backdrop, magazine cover quality',
    modelParams: {
      midjourney: { aspectRatio: '3:4', style: '1000' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '3:4', guidanceScale: 3.5 },
    },
  },
  {
    id: 'fantasy-portrait',
    name: 'Fantasy Portrait',
    description: 'Mystical character portrait with magical elements',
    icon: 'Sparkle',
    category: 'portrait',
    tags: ['fantasy', 'magical', 'ethereal', 'glowing elements', 'mystical'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Fantasy portrait, ethereal glow, magical particles, otherworldly beauty, painterly style',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750', chaos: 15 },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '2:3', guidanceScale: 4 },
    },
  },

  // ── Landscapes ───────────────────────────────────────────
  {
    id: 'landscape-golden',
    name: 'Golden Hour Landscape',
    description: 'Beautiful landscape at golden hour',
    icon: 'Sun',
    category: 'landscape',
    tags: ['landscape', 'golden hour', 'wide angle', 'dramatic sky', 'nature'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Breathtaking landscape at golden hour, warm sunlight, dramatic clouds, wide angle perspective',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3.5 },
    },
  },
  {
    id: 'mountain-vista',
    name: 'Mountain Vista',
    description: 'Majestic mountain range with atmospheric depth',
    icon: 'Mountains',
    category: 'landscape',
    tags: ['mountain', 'snow-capped', 'atmospheric', 'epic scale', 'nature'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Majestic mountain vista, snow-capped peaks, atmospheric haze, epic scale, panoramic view',
    modelParams: {
      midjourney: { aspectRatio: '21:9', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '21:9', guidanceScale: 3.5 },
    },
  },
  {
    id: 'ocean-sunset',
    name: 'Ocean Sunset',
    description: 'Serene seascape at sunset with reflective water',
    icon: 'Sun',
    category: 'landscape',
    tags: ['ocean', 'sunset', 'reflection', 'serene', 'seascape'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Serene ocean sunset, vibrant reflections on water, calm waves, warm color palette, peaceful atmosphere',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3 },
    },
  },
  {
    id: 'cityscape-night',
    name: 'Cityscape Night',
    description: 'Urban skyline illuminated after dark',
    icon: 'Buildings',
    category: 'landscape',
    tags: ['cityscape', 'night', 'neon lights', 'skyline', 'urban'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Cityscape at night, neon lights reflecting on wet streets, towering skyscrapers, cinematic atmosphere',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750', chaos: 10 },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '16:9', guidanceScale: 4 },
    },
  },

  // ── Products ─────────────────────────────────────────────
  {
    id: 'product-photography',
    name: 'Product Photography',
    description: 'Clean product shot with professional lighting',
    icon: 'Package',
    category: 'product',
    tags: ['product photography', 'studio lighting', 'clean background', 'professional', 'commercial'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Professional product photography, clean white background, studio lighting, commercial quality',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3 },
    },
  },
  {
    id: 'tech-gadget',
    name: 'Tech Gadget',
    description: 'Sleek electronics with dramatic lighting',
    icon: 'DeviceMobile',
    category: 'product',
    tags: ['tech', 'gadget', 'sleek', 'dramatic lighting', 'modern'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Sleek tech gadget photography, dramatic side lighting, dark reflective surface, minimalist composition',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3.5 },
    },
  },
  {
    id: 'jewelry-macro',
    name: 'Jewelry Macro',
    description: 'Luxury jewelry with sparkling details',
    icon: 'Diamond',
    category: 'product',
    tags: ['jewelry', 'macro', 'luxury', 'sparkle', 'elegant'],
    tagIds: [],
    difficulty: 'advanced',
    examplePrompt:
      'Luxury jewelry macro photography, sparkling gemstones, soft bokeh, elegant styling, high detail',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '1000' },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '1:1', guidanceScale: 4 },
    },
  },

  // ── Abstract ─────────────────────────────────────────────
  {
    id: 'abstract-fluid',
    name: 'Abstract Fluid Art',
    description: 'Colorful abstract fluid painting style',
    icon: 'Palette',
    category: 'abstract',
    tags: ['abstract', 'fluid art', 'colorful', 'dynamic', 'contemporary'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Abstract fluid art, vibrant colors, dynamic composition, contemporary style, flowing forms',
    modelParams: {
      midjourney: { aspectRatio: '1:1', chaos: 30 },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3.5 },
    },
  },
  {
    id: 'geometric-patterns',
    name: 'Geometric Patterns',
    description: 'Bold geometric shapes and repeating patterns',
    icon: 'SquaresFour',
    category: 'abstract',
    tags: ['geometric', 'patterns', 'bold colors', 'symmetry', 'modern'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Bold geometric patterns, vibrant colors, perfect symmetry, modern design, clean lines',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '1:1', guidanceScale: 3 },
    },
  },
  {
    id: 'generative-waves',
    name: 'Generative Waves',
    description: 'Flowing wave-like generative art',
    icon: 'Waves',
    category: 'abstract',
    tags: ['generative', 'waves', 'flowing', 'gradient', 'digital art'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Generative wave art, smooth gradients, flowing lines, digital aesthetic, hypnotic motion',
    modelParams: {
      midjourney: { aspectRatio: '16:9', chaos: 20 },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3.5 },
    },
  },

  // ── Characters ───────────────────────────────────────────
  {
    id: 'character-design',
    name: 'Character Design',
    description: 'Fantasy character concept design',
    icon: 'Sword',
    category: 'character',
    tags: ['character design', 'fantasy', 'concept art', 'detailed', 'illustration'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Fantasy character design, concept art, detailed illustration, dynamic pose, rich colors',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750' },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '2:3', guidanceScale: 4 },
    },
  },
  {
    id: 'anime-character',
    name: 'Anime Character',
    description: 'Vibrant anime-style character illustration',
    icon: 'Heart',
    category: 'character',
    tags: ['anime', 'manga', 'vibrant', 'expressive', 'illustration'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Anime character illustration, vibrant colors, expressive eyes, clean linework, dynamic pose',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '2:3', guidanceScale: 3.5 },
    },
  },
  {
    id: 'pixel-art-character',
    name: 'Pixel Art Character',
    description: 'Retro pixel art game character',
    icon: 'GameController',
    category: 'character',
    tags: ['pixel art', 'retro', 'game character', '8-bit', 'sprite'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Pixel art character, retro game style, limited color palette, clean pixel edges, RPG sprite',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '250' },
      'stable-diffusion': { steps: 20, cfgScale: 6 },
      flux: { aspectRatio: '1:1', guidanceScale: 2.5 },
    },
  },
  {
    id: 'realistic-character',
    name: 'Realistic Character',
    description: 'Photorealistic human character render',
    icon: 'User',
    category: 'character',
    tags: ['realistic', 'photoreal', 'human', 'detailed skin', 'portrait'],
    tagIds: [],
    difficulty: 'advanced',
    examplePrompt:
      'Photorealistic character, detailed skin texture, natural lighting, subtle imperfections, lifelike eyes',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '1000' },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '2:3', guidanceScale: 4.5 },
    },
  },

  // ── Architecture ─────────────────────────────────────────
  {
    id: 'architecture-modern',
    name: 'Modern Architecture',
    description: 'Contemporary building with clean lines',
    icon: 'Building',
    category: 'architecture',
    tags: ['architecture', 'modern', 'clean lines', 'minimalist', 'contemporary'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Modern architecture, clean geometric lines, minimalist design, contemporary style, natural light',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3 },
    },
  },
  {
    id: 'gothic-architecture',
    name: 'Gothic Architecture',
    description: 'Ornate Gothic cathedral or building',
    icon: 'Church',
    category: 'architecture',
    tags: ['gothic', 'ornate', 'cathedral', 'historical', 'dramatic'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Gothic architecture, ornate stone carvings, soaring arches, dramatic lighting, historical grandeur',
    modelParams: {
      midjourney: { aspectRatio: '3:4', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '3:4', guidanceScale: 4 },
    },
  },
  {
    id: 'interior-design',
    name: 'Interior Design',
    description: 'Stylish interior space with curated decor',
    icon: 'Armchair',
    category: 'architecture',
    tags: ['interior', 'design', 'stylish', 'curated', 'living space'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Stylish interior design, curated furniture, natural light through large windows, warm textures',
    modelParams: {
      midjourney: { aspectRatio: '4:3', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '4:3', guidanceScale: 3 },
    },
  },

  // ── Food ─────────────────────────────────────────────────
  {
    id: 'food-photography',
    name: 'Food Photography',
    description: 'Appetizing food shot with natural light',
    icon: 'Knife',
    category: 'food',
    tags: ['food photography', 'natural light', 'appetizing', 'styling', 'overhead'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Professional food photography, natural window light, overhead composition, appetizing styling',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3 },
    },
  },
  {
    id: 'rustic-food',
    name: 'Rustic Food',
    description: 'Warm rustic food styling with natural props',
    icon: 'Plant',
    category: 'food',
    tags: ['rustic', 'farm-to-table', 'wooden props', 'natural', 'warm tones'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Rustic food photography, wooden table, linen napkins, warm tones, farm-to-table styling',
    modelParams: {
      midjourney: { aspectRatio: '4:5', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '4:5', guidanceScale: 3 },
    },
  },
  {
    id: 'dessert-macro',
    name: 'Dessert Macro',
    description: 'Close-up dessert with luscious detail',
    icon: 'Cookie',
    category: 'food',
    tags: ['dessert', 'macro', 'sweet', 'luscious', 'detail'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Macro dessert photography, intricate details, luscious textures, shallow depth of field, appetizing',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '1:1', guidanceScale: 4 },
    },
  },

  // ── Fashion ──────────────────────────────────────────────
  {
    id: 'fashion-editorial',
    name: 'Fashion Editorial',
    description: 'High-fashion magazine style shot',
    icon: 'Dress',
    category: 'fashion',
    tags: ['fashion', 'editorial', 'high fashion', 'stylish', 'magazine'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Fashion editorial photography, high fashion styling, magazine quality, dramatic pose, elegant lighting',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '1000' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '2:3', guidanceScale: 4 },
    },
  },
  {
    id: 'street-fashion',
    name: 'Street Fashion',
    description: 'Urban street style with authentic vibe',
    icon: 'Sneaker',
    category: 'fashion',
    tags: ['street fashion', 'urban', 'authentic', 'casual', 'trendy'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Street fashion photography, urban backdrop, authentic casual style, natural pose, trendy outfit',
    modelParams: {
      midjourney: { aspectRatio: '3:4', style: '500' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '3:4', guidanceScale: 3 },
    },
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'High-energy runway fashion show capture',
    icon: 'Dress',
    category: 'fashion',
    tags: ['runway', 'fashion show', 'dynamic', 'high energy', 'couture'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Runway fashion show, dynamic walking pose, dramatic lighting, couture garment, high energy',
    modelParams: {
      midjourney: { aspectRatio: '9:16', style: '750' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '9:16', guidanceScale: 3.5 },
    },
  },

  // ── Concept Art ──────────────────────────────────────────
  {
    id: 'concept-art-scifi',
    name: 'Sci-Fi Concept Art',
    description: 'Futuristic sci-fi environment concept',
    icon: 'Rocket',
    category: 'concept-art',
    tags: ['concept art', 'sci-fi', 'futuristic', 'environment', 'detailed'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Sci-fi concept art, futuristic environment, detailed worldbuilding, atmospheric lighting, epic scale',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750', chaos: 15 },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '16:9', guidanceScale: 4 },
    },
  },
  {
    id: 'fantasy-environment',
    name: 'Fantasy Environment',
    description: 'Magical fantasy world landscape',
    icon: 'Tree',
    category: 'concept-art',
    tags: ['fantasy', 'environment', 'magical', 'epic', 'worldbuilding'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Fantasy environment concept, magical landscape, floating islands, ethereal lighting, epic scale',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750', chaos: 20 },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '16:9', guidanceScale: 4 },
    },
  },
  {
    id: 'post-apocalyptic',
    name: 'Post-Apocalyptic',
    description: 'Ruined world with atmospheric decay',
    icon: 'Skull',
    category: 'concept-art',
    tags: ['post-apocalyptic', 'ruins', 'atmospheric', 'decay', 'dystopian'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Post-apocalyptic concept art, ruined cityscape, overgrown decay, dramatic atmosphere, cinematic lighting',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750', chaos: 15 },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '16:9', guidanceScale: 4 },
    },
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Victorian-inspired steampunk world',
    icon: 'Gear',
    category: 'concept-art',
    tags: ['steampunk', 'victorian', 'gears', 'brass', 'retro-futuristic'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Steampunk concept art, Victorian architecture with brass gears, steam clouds, warm lighting, intricate details',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '16:9', guidanceScale: 4 },
    },
  },

  // ── Photography ──────────────────────────────────────────
  {
    id: 'street-photography',
    name: 'Street Photography',
    description: 'Candid urban street scene',
    icon: 'Camera',
    category: 'photography',
    tags: ['street photography', 'urban', 'candid', 'documentary', 'black and white'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Street photography, urban scene, candid moment, documentary style, black and white',
    modelParams: {
      midjourney: { aspectRatio: '3:2', style: '500' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '3:2', guidanceScale: 2.5 },
    },
  },
  {
    id: 'macro-nature',
    name: 'Macro Nature',
    description: 'Close-up nature photography with shallow DOF',
    icon: 'MagnifyingGlass',
    category: 'photography',
    tags: ['macro', 'nature', 'close-up', 'shallow depth of field', 'detailed'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Macro nature photography, extreme close-up, shallow depth of field, intricate details, natural light',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '1:1', guidanceScale: 3.5 },
    },
  },
  {
    id: 'astrophotography',
    name: 'Astrophotography',
    description: 'Stunning night sky with stars and nebulae',
    icon: 'Star',
    category: 'photography',
    tags: ['astrophotography', 'night sky', 'stars', 'milky way', 'long exposure'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Astrophotography, milky way core, long exposure, star trails, dark sky, landscape silhouette',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3.5 },
    },
  },
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Authentic documentary-style moment capture',
    icon: 'VideoCamera',
    category: 'photography',
    tags: ['documentary', 'authentic', 'storytelling', 'candid', 'emotional'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Documentary photography, authentic moment, storytelling composition, natural light, emotional connection',
    modelParams: {
      midjourney: { aspectRatio: '3:2', style: '500' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '3:2', guidanceScale: 2.5 },
    },
  },

  // ── Logo ─────────────────────────────────────────────────
  {
    id: 'minimal-logo',
    name: 'Minimal Logo',
    description: 'Clean minimal logo mark or wordmark',
    icon: 'Circle',
    category: 'logo',
    tags: ['logo', 'minimal', 'clean', 'vector', 'brand identity'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Minimal logo design, clean geometric mark, simple shapes, vector style, brand identity',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '250' },
      'stable-diffusion': { steps: 20, cfgScale: 5 },
      flux: { aspectRatio: '1:1', guidanceScale: 2.5 },
    },
  },
  {
    id: 'vintage-badge',
    name: 'Vintage Badge',
    description: 'Retro badge or emblem design',
    icon: 'Seal',
    category: 'logo',
    tags: ['vintage', 'badge', 'emblem', 'retro', 'ornate'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Vintage badge design, ornate emblem, retro typography, distressed texture, circular composition',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3 },
    },
  },
  {
    id: 'mascot-logo',
    name: 'Mascot Logo',
    description: 'Playful mascot character logo',
    icon: 'Smiley',
    category: 'logo',
    tags: ['mascot', 'character', 'playful', 'friendly', 'logo'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Mascot logo design, friendly character, bold colors, clean illustration, sports team style',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3.5 },
    },
  },

  // ── 3D Render ────────────────────────────────────────────
  {
    id: 'product-render',
    name: 'Product Render',
    description: 'Photorealistic 3D product visualization',
    icon: 'Cube',
    category: '3d-render',
    tags: ['3D render', 'product', 'photorealistic', 'studio lighting', 'CGI'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Photorealistic 3D product render, studio lighting, perfect materials, CGI quality, clean background',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3.5 },
    },
  },
  {
    id: 'character-sculpt',
    name: 'Character Sculpt',
    description: 'Detailed 3D character sculpt render',
    icon: 'Cube',
    category: '3d-render',
    tags: ['3D sculpt', 'character', 'ZBrush style', 'detailed', 'digital sculpture'],
    tagIds: [],
    difficulty: 'advanced',
    examplePrompt:
      '3D character sculpt, detailed anatomy, ZBrush style render, clay material, turntable lighting',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750' },
      'stable-diffusion': { steps: 40, cfgScale: 8 },
      flux: { aspectRatio: '2:3', guidanceScale: 4 },
    },
  },
  {
    id: 'architectural-viz',
    name: 'Architectural Viz',
    description: 'Photorealistic architectural visualization',
    icon: 'Cube',
    category: '3d-render',
    tags: ['archviz', '3D render', 'photorealistic', 'interior', 'exterior'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Architectural visualization, photorealistic 3D render, natural lighting, detailed materials, V-ray quality',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3.5 },
    },
  },

  // ── Pixel Art ────────────────────────────────────────────
  {
    id: 'game-sprite',
    name: 'Game Sprite',
    description: 'Animated-style game character sprite',
    icon: 'GameController',
    category: 'pixel-art',
    tags: ['pixel art', 'game sprite', '8-bit', '16-bit', 'character'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Pixel art game sprite, 16-bit style, character design, limited palette, transparent background feel',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '250' },
      'stable-diffusion': { steps: 20, cfgScale: 6 },
      flux: { aspectRatio: '1:1', guidanceScale: 2.5 },
    },
  },
  {
    id: 'isometric-scene',
    name: 'Isometric Scene',
    description: 'Isometric pixel art environment',
    icon: 'GameController',
    category: 'pixel-art',
    tags: ['pixel art', 'isometric', 'environment', 'game scene', 'retro'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Isometric pixel art scene, retro game environment, detailed small world, 16-bit aesthetic',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '250' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '1:1', guidanceScale: 2.5 },
    },
  },

  // ── Watercolor ───────────────────────────────────────────
  {
    id: 'botanical-illustration',
    name: 'Botanical Illustration',
    description: 'Delicate watercolor botanical study',
    icon: 'Drop',
    category: 'watercolor',
    tags: ['watercolor', 'botanical', 'illustration', 'delicate', 'natural'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Watercolor botanical illustration, delicate petals, soft washes, scientific accuracy, white background',
    modelParams: {
      midjourney: { aspectRatio: '3:4', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '3:4', guidanceScale: 3 },
    },
  },
  {
    id: 'loose-portrait',
    name: 'Loose Portrait',
    description: 'Expressive loose watercolor portrait',
    icon: 'Drop',
    category: 'watercolor',
    tags: ['watercolor', 'portrait', 'loose', 'expressive', 'painterly'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Loose watercolor portrait, expressive brushstrokes, color bleeds, painterly style, emotional',
    modelParams: {
      midjourney: { aspectRatio: '2:3', style: '750' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '2:3', guidanceScale: 3.5 },
    },
  },

  // ── Minimalism ───────────────────────────────────────────
  {
    id: 'line-art',
    name: 'Line Art',
    description: 'Clean continuous line illustration',
    icon: 'PencilLine',
    category: 'minimalism',
    tags: ['line art', 'continuous line', 'minimal', 'illustration', 'elegant'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Line art illustration, continuous single line, minimal design, elegant contours, black on white',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '250' },
      'stable-diffusion': { steps: 20, cfgScale: 5 },
      flux: { aspectRatio: '1:1', guidanceScale: 2.5 },
    },
  },
  {
    id: 'negative-space',
    name: 'Negative Space',
    description: 'Clever use of negative space in composition',
    icon: 'PencilLine',
    category: 'minimalism',
    tags: ['negative space', 'minimal', 'clever composition', 'graphic design', 'simple'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Negative space art, clever visual illusion, minimal composition, dual meaning, graphic design',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '1:1', guidanceScale: 3 },
    },
  },

  // ── Vehicle ──────────────────────────────────────────────
  {
    id: 'automotive-studio',
    name: 'Automotive Studio',
    description: 'Sleek car in professional studio lighting',
    icon: 'Car',
    category: 'vehicle',
    tags: ['automotive', 'studio', 'car', 'sleek', 'professional'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Automotive studio photography, sleek sports car, dramatic lighting, reflective floor, professional',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3.5 },
    },
  },
  {
    id: 'motorsport-action',
    name: 'Motorsport Action',
    description: 'High-speed racing action shot',
    icon: 'Car',
    category: 'vehicle',
    tags: ['motorsport', 'racing', 'action', 'speed', 'dynamic'],
    tagIds: [],
    difficulty: 'advanced',
    examplePrompt:
      'Motorsport action photography, high speed racing car, motion blur, dynamic angle, intense atmosphere',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '750', chaos: 10 },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '16:9', guidanceScale: 4 },
    },
  },

  // ── Sports ───────────────────────────────────────────────
  {
    id: 'action-freeze',
    name: 'Action Freeze',
    description: 'Frozen moment of athletic intensity',
    icon: 'PersonSimpleRun',
    category: 'sports',
    tags: ['sports', 'action', 'freeze frame', 'athletic', 'intense'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Sports action freeze frame, peak athletic moment, dramatic lighting, intense focus, high detail',
    modelParams: {
      midjourney: { aspectRatio: '3:2', style: '750' },
      'stable-diffusion': { steps: 35, cfgScale: 8 },
      flux: { aspectRatio: '3:2', guidanceScale: 4 },
    },
  },
  {
    id: 'stadium-atmosphere',
    name: 'Stadium Atmosphere',
    description: 'Epic stadium scene with crowd energy',
    icon: 'PersonSimpleRun',
    category: 'sports',
    tags: ['stadium', 'atmosphere', 'crowd', 'epic', 'wide angle'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Stadium atmosphere, epic wide angle, crowd energy, dramatic lighting, sporting event',
    modelParams: {
      midjourney: { aspectRatio: '16:9', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '16:9', guidanceScale: 3 },
    },
  },

  // ── Pattern ──────────────────────────────────────────────
  {
    id: 'seamless-texture',
    name: 'Seamless Texture',
    description: 'Tileable seamless pattern or texture',
    icon: 'SquaresFour',
    category: 'pattern',
    tags: ['pattern', 'seamless', 'texture', 'tileable', 'repeat'],
    tagIds: [],
    difficulty: 'beginner',
    examplePrompt:
      'Seamless pattern, tileable texture, repeating design, uniform lighting, no visible seams',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '250' },
      'stable-diffusion': { steps: 25, cfgScale: 6 },
      flux: { aspectRatio: '1:1', guidanceScale: 2.5 },
    },
  },
  {
    id: 'optical-pattern',
    name: 'Optical Pattern',
    description: 'Mind-bending optical illusion pattern',
    icon: 'SquaresFour',
    category: 'pattern',
    tags: ['optical illusion', 'pattern', 'geometric', 'mind-bending', 'abstract'],
    tagIds: [],
    difficulty: 'intermediate',
    examplePrompt:
      'Optical illusion pattern, mind-bending geometry, moire effect, black and white, hypnotic',
    modelParams: {
      midjourney: { aspectRatio: '1:1', style: '500' },
      'stable-diffusion': { steps: 30, cfgScale: 7 },
      flux: { aspectRatio: '1:1', guidanceScale: 3 },
    },
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: 'Sparkle' },
  { id: 'portrait', name: 'Portraits', icon: 'User' },
  { id: 'landscape', name: 'Landscapes', icon: 'Image' },
  { id: 'product', name: 'Products', icon: 'Package' },
  { id: 'character', name: 'Characters', icon: 'Sword' },
  { id: 'architecture', name: 'Architecture', icon: 'Building' },
  { id: 'photography', name: 'Photography', icon: 'Camera' },
  { id: 'abstract', name: 'Abstract', icon: 'Palette' },
  { id: 'fashion', name: 'Fashion', icon: 'Dress' },
  { id: 'concept-art', name: 'Concept Art', icon: 'Rocket' },
  { id: 'food', name: 'Food', icon: 'Knife' },
  { id: 'logo', name: 'Logo', icon: 'Circle' },
  { id: '3d-render', name: '3D Render', icon: 'Cube' },
  { id: 'pixel-art', name: 'Pixel Art', icon: 'GameController' },
  { id: 'watercolor', name: 'Watercolor', icon: 'Drop' },
  { id: 'minimalism', name: 'Minimalism', icon: 'PencilLine' },
  { id: 'vehicle', name: 'Vehicle', icon: 'Car' },
  { id: 'sports', name: 'Sports', icon: 'PersonSimpleRun' },
  { id: 'pattern', name: 'Pattern', icon: 'SquaresFour' },
]

export const DIFFICULTY_LABELS = {
  beginner: 'Quick start',
  intermediate: 'Guided',
  advanced: 'Technical',
}

export const DIFFICULTY_COLORS = {
  beginner: 'text-success bg-success/10',
  intermediate: 'text-warning bg-warning/10',
  advanced: 'text-error bg-error/10',
}
