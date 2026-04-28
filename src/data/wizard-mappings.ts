export interface WizardStyleOption {
  id: string
  label: string
  tagIds: string[]
}

export interface WizardMoodOption {
  id: string
  label: string
  tagIds: string[]
}

export const WIZARD_STYLES: WizardStyleOption[] = [
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    tagIds: ['photorealistic', 'high_detail', 'natural_lighting', 'sharp_focus'],
  },
  {
    id: 'anime',
    label: 'Anime / Manga',
    tagIds: ['anime', 'cel_shading', 'vibrant_colors', 'dynamic_pose'],
  },
  {
    id: 'oil_painting',
    label: 'Oil Painting',
    tagIds: ['oil_painting', 'impasto', 'rich_colors', 'classical_composition'],
  },
  {
    id: '3d_render',
    label: '3D Render',
    tagIds: ['3d_render', 'octane_render', 'ray_tracing', 'volumetric_light'],
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    tagIds: ['watercolor', 'soft_edges', 'bleeding_colors', 'paper_texture'],
  },
  {
    id: 'pixel_art',
    label: 'Pixel Art',
    tagIds: ['pixel_art', '8bit', 'retro', 'limited_palette'],
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    tagIds: ['cinematic', 'dramatic_lighting', 'wide_angle', 'color_grading'],
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    tagIds: ['minimalist', 'clean_background', 'negative_space', 'simple_composition'],
  },
]

export const WIZARD_MOODS: WizardMoodOption[] = [
  {
    id: 'cheerful',
    label: 'Cheerful',
    tagIds: ['bright', 'vibrant', 'warm_tones', 'sunlit'],
  },
  {
    id: 'mysterious',
    label: 'Mysterious',
    tagIds: ['moody', 'shadows', 'low_key', 'atmospheric'],
  },
  {
    id: 'dynamic',
    label: 'Dynamic',
    tagIds: ['dramatic_lighting', 'high_contrast', 'action', 'bold_colors'],
  },
  {
    id: 'intimate',
    label: 'Intimate',
    tagIds: ['soft_lighting', 'warm_tones', 'close_up', 'gentle_shadows'],
  },
  {
    id: 'cinematic_mood',
    label: 'Cinematic',
    tagIds: ['cinematic', 'dramatic_lighting', 'color_grading', 'film_grain'],
  },
  {
    id: 'ethereal',
    label: 'Ethereal',
    tagIds: ['ethereal', 'soft_lighting', 'pastel', 'dreamy'],
  },
  {
    id: 'dark',
    label: 'Dark',
    tagIds: ['dark', 'shadows', 'gothic', 'dramatic_shadows'],
  },
  {
    id: 'serene',
    label: 'Serene',
    tagIds: ['peaceful', 'soft_lighting', 'natural_light', 'calm'],
  },
]

export function getWizardStyleTags(styleId: string): string[] {
  const style = WIZARD_STYLES.find(s => s.id === styleId)
  return style ? style.tagIds : []
}

export function getWizardMoodTags(moodId: string): string[] {
  const mood = WIZARD_MOODS.find(m => m.id === moodId)
  return mood ? mood.tagIds : []
}
