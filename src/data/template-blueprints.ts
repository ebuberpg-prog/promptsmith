import { INSPIRATION_ASSETS } from '@/data/inspiration-assets'
import type { GalleryTemplate } from '@/types/templates'
import { PROMPT_TEMPLATES } from '@/types/templates'

export type BlueprintDimension = 'Subject' | 'Setting' | 'Composition' | 'Lighting' | 'Medium' | 'Constraint'

export interface BlueprintPart {
  dimension: BlueprintDimension
  value: string
}

export interface BlueprintGalleryTemplate extends GalleryTemplate {
  anatomy: BlueprintPart[]
  imageId: string
  isFlagship: boolean
}

type BlueprintOverride = Pick<BlueprintGalleryTemplate, 'anatomy' | 'imageId'> & {
  examplePrompt: string
  tagIds: string[]
}

const BLUEPRINT_OVERRIDES: Record<string, BlueprintOverride> = {
  'portrait-studio': {
    imageId: 'gesture-portrait',
    tagIds: ['style_portrait_photography', 'cam_dist_medium', 'cam_lens_telephoto', 'light_source_studio', 'light_soft'],
    anatomy: [
      { dimension: 'Subject', value: '{subject}, waist-up and naturally posed' },
      { dimension: 'Composition', value: 'Eye level with an 85mm portrait lens' },
      { dimension: 'Lighting', value: 'Soft studio key light with gentle falloff' },
      { dimension: 'Constraint', value: 'Natural skin texture and restrained retouching' },
    ],
    examplePrompt: 'A waist-up studio portrait of {subject}, photographed at eye level with an 85mm lens. Use a soft diffused key light with gentle falloff against a clean warm-gray backdrop. Preserve natural skin texture and keep the retouching restrained.',
  },
  'cinematic-portrait': {
    imageId: 'rain-window',
    tagIds: ['style_portrait_photography', 'q_cinematic', 'light_rim', 'light_low_key', 'cam_effect_grain'],
    anatomy: [
      { dimension: 'Subject', value: '{subject} in a quiet narrative moment' },
      { dimension: 'Setting', value: 'Rain-streaked window at blue hour' },
      { dimension: 'Lighting', value: 'Cool ambient light with one warm practical' },
      { dimension: 'Medium', value: 'Cinematic portrait with restrained film grain' },
    ],
    examplePrompt: 'A cinematic portrait of {subject} beside a rain-streaked window at blue hour. Cool ambient light wraps the face while one warm practical creates a narrow rim. Frame the moment like a quiet film still with restrained grain and deep, readable shadows.',
  },
  'mountain-vista': {
    imageId: 'ink-mountains',
    tagIds: ['cam_dist_extreme_wide', 'cam_lens_wide', 'comp_rule_thirds', 'mood_peaceful'],
    anatomy: [
      { dimension: 'Subject', value: '{location} as the distant focal landscape' },
      { dimension: 'Composition', value: 'Layered panoramic thirds with open sky' },
      { dimension: 'Lighting', value: 'Soft atmospheric separation between ridges' },
      { dimension: 'Constraint', value: 'Preserve scale without oversaturating the scene' },
    ],
    examplePrompt: 'A panoramic view of {location}, built from layered mountain ridges that recede through soft atmospheric haze. Use a wide lens, a low horizon, and generous open sky to emphasize scale. Keep the palette restrained and the distant forms legible.',
  },
  'product-photography': {
    imageId: 'glass-still-life',
    tagIds: ['cam_lens_standard', 'comp_centered', 'light_source_studio', 'light_soft'],
    anatomy: [
      { dimension: 'Subject', value: '{product} as the unmistakable hero' },
      { dimension: 'Setting', value: 'Tactile studio surface with one supporting prop' },
      { dimension: 'Lighting', value: 'Large soft key with controlled reflections' },
      { dimension: 'Constraint', value: 'Accurate materials, proportions, and branding' },
    ],
    examplePrompt: 'A refined commercial still life of {product} on a tactile studio surface with one carefully chosen supporting prop. Use a large soft key light and controlled edge reflections to describe the material. Keep proportions and branding accurate, with clean negative space for a campaign layout.',
  },
  'abstract-fluid': {
    imageId: 'salt-flat-aerial',
    tagIds: ['style_abstract', 'abs_flow', 'comp_aerial_view', 'comp_off_center'],
    anatomy: [
      { dimension: 'Subject', value: '{material_or_landform} translated into flowing forms' },
      { dimension: 'Composition', value: 'Aerial, off-center fields with one visual current' },
      { dimension: 'Medium', value: 'Natural abstraction with crisp material detail' },
      { dimension: 'Constraint', value: 'Limit the palette to three related colors' },
    ],
    examplePrompt: 'An aerial abstract composition inspired by {material_or_landform}, organized as broad color fields cut by one flowing visual current. Use an off-center composition, crisp material detail, and a limited three-color palette. Avoid decorative noise and keep the large shapes readable.',
  },
  'character-design': {
    imageId: 'charcoal-hands',
    tagIds: ['style_concept_art', 'cam_dist_full', 'comp_diagonal_lines', 'mood_dramatic'],
    anatomy: [
      { dimension: 'Subject', value: '{character} shown full-body with a clear silhouette' },
      { dimension: 'Composition', value: 'Neutral turntable stance with one expressive gesture' },
      { dimension: 'Medium', value: 'Production concept art with material callouts' },
      { dimension: 'Constraint', value: 'Functional costume logic and readable proportions' },
    ],
    examplePrompt: 'A production-ready full-body concept for {character}, posed in a neutral turntable stance with one expressive gesture. Establish a clear silhouette, functional costume logic, and distinct material zones. Render the main design cleanly and include restrained callout details without cluttering the sheet.',
  },
  'architecture-modern': {
    imageId: 'brutalist-court',
    tagIds: ['arch_modernist', 'cam_lens_wide', 'comp_leading_lines', 'light_source_natural'],
    anatomy: [
      { dimension: 'Subject', value: '{building} and its defining structural rhythm' },
      { dimension: 'Composition', value: 'Wide two-point perspective with a human scale cue' },
      { dimension: 'Lighting', value: 'Overcast daylight revealing material texture' },
      { dimension: 'Constraint', value: 'Plausible structure and undistorted verticals' },
    ],
    examplePrompt: 'A wide architectural study of {building}, framed from a two-point perspective with one small human figure for scale. Overcast daylight reveals the material texture and structural rhythm. Keep verticals controlled, circulation plausible, and the surrounding space deliberately sparse.',
  },
  'food-photography': {
    imageId: 'quiet-still-life',
    tagIds: ['cam_lens_standard', 'comp_off_center', 'light_source_natural', 'light_soft'],
    anatomy: [
      { dimension: 'Subject', value: '{dish} styled to look freshly served' },
      { dimension: 'Setting', value: 'Simple table with two ingredient cues' },
      { dimension: 'Lighting', value: 'Soft side light with believable highlights' },
      { dimension: 'Constraint', value: 'Natural texture, accurate color, no excess garnish' },
    ],
    examplePrompt: 'A natural-light food photograph of {dish}, styled as freshly served on a simple table with no more than two ingredient cues. Use soft side light, an off-center composition, and believable highlights on sauces and surfaces. Preserve accurate color and texture without excessive garnish.',
  },
  'fashion-editorial': {
    imageId: 'pleated-silhouette',
    tagIds: ['style_fashion_photography', 'sub_high_fashion', 'cam_dist_full', 'light_source_studio'],
    anatomy: [
      { dimension: 'Subject', value: '{garment_or_look} carried by pose and silhouette' },
      { dimension: 'Composition', value: 'Full-length profile with fabric crossing the frame' },
      { dimension: 'Lighting', value: 'Directional studio light with crisp separation' },
      { dimension: 'Constraint', value: 'Keep garment construction and body proportions credible' },
    ],
    examplePrompt: 'A full-length fashion editorial featuring {garment_or_look}, photographed in profile as the fabric creates a strong line across the frame. Use directional studio light and a quiet architectural backdrop. Keep garment construction, drape, and body proportions credible while preserving a bold silhouette.',
  },
  'fantasy-environment': {
    imageId: 'forest-terrarium',
    tagIds: ['style_concept_art', 'mood_mysterious', 'cam_dist_wide', 'q_cinematic'],
    anatomy: [
      { dimension: 'Subject', value: '{place} with one memorable world-building rule' },
      { dimension: 'Setting', value: 'Foreground, middle ground, and distant story cue' },
      { dimension: 'Lighting', value: 'Atmospheric light that guides the route through the scene' },
      { dimension: 'Constraint', value: 'One focal landmark and a coherent material language' },
    ],
    examplePrompt: 'A cinematic environment concept for {place}, built around one memorable world-building rule and a single focal landmark. Establish foreground texture, a navigable middle ground, and one distant story cue. Use atmospheric light to guide the eye while keeping the material language coherent.',
  },
  'botanical-illustration': {
    imageId: 'watercolor-botanical',
    tagIds: ['style_watercolor', 'comp_negative_space', 'light_soft'],
    anatomy: [
      { dimension: 'Subject', value: '{plant} with recognizable structure' },
      { dimension: 'Composition', value: 'Open cluster with generous paper space' },
      { dimension: 'Medium', value: 'Transparent watercolor with selective ink detail' },
      { dimension: 'Constraint', value: 'Keep edges lively and avoid filling every area' },
    ],
    examplePrompt: 'A loose botanical study of {plant} in transparent watercolor, arranged as an open cluster with generous fibrous paper visible around it. Use selective ink detail to clarify the structure, varied wet edges, and a restrained natural palette. Avoid filling every area with equal detail.',
  },
  'negative-space': {
    imageId: 'floating-stone',
    tagIds: ['comp_negative_space', 'comp_off_center', 'style_fine_art_photo', 'light_soft'],
    anatomy: [
      { dimension: 'Subject', value: '{subject} reduced to one unmistakable form' },
      { dimension: 'Composition', value: 'Off-center placement with dominant empty space' },
      { dimension: 'Lighting', value: 'Soft tonal separation and a restrained shadow' },
      { dimension: 'Constraint', value: 'One focal idea, no decorative filler' },
    ],
    examplePrompt: 'A minimal fine-art image of {subject}, reduced to one unmistakable form and placed off-center within dominant negative space. Use soft tonal separation and one restrained shadow to establish depth. Keep the palette quiet and remove every element that does not support the focal idea.',
  },
}

const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  portrait: 'gesture-portrait',
  landscape: 'coastal-monochrome',
  product: 'glass-still-life',
  abstract: 'paper-geometry',
  character: 'charcoal-hands',
  architecture: 'cobalt-courtyard',
  food: 'quiet-still-life',
  fashion: 'pleated-silhouette',
  'concept-art': 'floating-stone',
  photography: 'rain-window',
  logo: 'paper-geometry',
  '3d-render': 'forest-terrarium',
  'pixel-art': 'paper-geometry',
  watercolor: 'watercolor-botanical',
  minimalism: 'floating-stone',
  vehicle: 'brutalist-court',
  sports: 'charcoal-hands',
  pattern: 'salt-flat-aerial',
}

export const BLUEPRINT_TEMPLATES: BlueprintGalleryTemplate[] = PROMPT_TEMPLATES.map((template) => {
  const override = BLUEPRINT_OVERRIDES[template.id]
  return {
    ...template,
    ...(override ?? {}),
    anatomy: override?.anatomy ?? [
      { dimension: 'Subject', value: template.description },
      { dimension: 'Medium', value: template.tags.slice(0, 3).join(', ') },
    ],
    imageId: override?.imageId ?? FALLBACK_IMAGE_BY_CATEGORY[template.category] ?? 'gesture-portrait',
    isFlagship: Boolean(override),
    tagIds: override?.tagIds ?? template.tagIds,
  }
})

export const FLAGSHIP_TEMPLATES = BLUEPRINT_TEMPLATES.filter((template) => template.isFlagship)

export function getTemplateImage(template: BlueprintGalleryTemplate) {
  return INSPIRATION_ASSETS.find((asset) => asset.id === template.imageId) ?? INSPIRATION_ASSETS[0]
}
