export interface TagRelationship {
  tagId: string
  suggests: string[]
}

export const TAG_RELATIONSHIPS: TagRelationship[] = [
  {
    tagId: 'portrait',
    suggests: ['bokeh', '85mm_lens', 'soft_lighting', 'shallow_depth_of_field', 'studio_lighting'],
  },
  {
    tagId: 'bokeh',
    suggests: ['portrait', '85mm_lens', 'shallow_depth_of_field', 'golden_hour', 'natural_light'],
  },
  {
    tagId: 'golden_hour',
    suggests: ['warm_tones', 'backlight', 'lens_flare', 'outdoor', 'natural_light'],
  },
  {
    tagId: 'cyberpunk',
    suggests: ['neon_lighting', 'rain', 'dark_alley', 'holographic', 'futuristic_city'],
  },
  {
    tagId: 'neon_lighting',
    suggests: ['cyberpunk', 'night', 'urban', 'reflective_surfaces', 'dark_background'],
  },
  {
    tagId: 'cinematic',
    suggests: ['dramatic_lighting', 'wide_angle', 'color_grading', 'film_grain', 'anamorphic'],
  },
  {
    tagId: 'dramatic_lighting',
    suggests: ['cinematic', 'chiaroscuro', 'rim_light', 'volumetric_light', 'high_contrast'],
  },
  {
    tagId: 'anime',
    suggests: ['cel_shading', 'vibrant_colors', 'large_eyes', 'dynamic_pose', 'manga_style'],
  },
  {
    tagId: 'oil_painting',
    suggests: ['impasto', 'rich_colors', 'classical_composition', 'canvas_texture', 'baroque'],
  },
  {
    tagId: 'watercolor',
    suggests: ['soft_edges', 'bleeding_colors', 'paper_texture', 'light_wash', 'delicate'],
  },
  {
    tagId: 'photorealistic',
    suggests: ['high_detail', 'natural_lighting', 'realistic_texture', 'sharp_focus', '8k'],
  },
  {
    tagId: 'fantasy',
    suggests: ['magical_glow', 'ethereal', 'mystical', 'enchanted', 'otherworldly'],
  },
  {
    tagId: 'sci_fi',
    suggests: ['futuristic', 'holographic', 'metallic', 'technological', 'space'],
  },
  {
    tagId: 'noir',
    suggests: ['high_contrast', 'shadows', 'black_and_white', 'venetian_blinds', 'rain'],
  },
  {
    tagId: 'minimalist',
    suggests: ['clean_background', 'negative_space', 'simple_composition', 'monochromatic', 'geometric'],
  },
  {
    tagId: 'vintage',
    suggests: ['film_grain', 'sepia', 'aged_texture', 'retro_colors', 'light_leak'],
  },
  {
    tagId: 'steampunk',
    suggests: ['brass', 'gears', 'victorian', 'mechanical', 'copper'],
  },
  {
    tagId: 'gothic',
    suggests: ['dark', 'cathedral', 'ornate', 'dramatic_shadows', 'candlelight'],
  },
  {
    tagId: 'surreal',
    suggests: ['dreamlike', 'impossible_geometry', 'floating', 'melting', 'abstract'],
  },
  {
    tagId: 'nature',
    suggests: ['lush', 'sunlight_through_trees', 'wildflowers', 'misty', 'golden_hour'],
  },
  {
    tagId: 'ocean',
    suggests: ['waves', 'sunset', 'coastal', 'aerial_view', 'turquoise_water'],
  },
  {
    tagId: 'mountain',
    suggests: ['misty', 'dramatic_sky', 'snow_capped', 'aerial_view', 'golden_hour'],
  },
  {
    tagId: 'city',
    suggests: ['skyline', 'night', 'neon', 'aerial_view', 'rain'],
  },
  {
    tagId: 'close_up',
    suggests: ['macro', 'shallow_depth_of_field', 'detailed_texture', 'soft_lighting', 'bokeh'],
  },
  {
    tagId: 'wide_angle',
    suggests: ['expansive', 'dramatic_perspective', 'foreground_interest', 'leading_lines', 'horizon'],
  },
  {
    tagId: 'backlight',
    suggests: ['silhouette', 'rim_light', 'golden_hour', 'lens_flare', 'translucent'],
  },
  {
    tagId: 'rim_light',
    suggests: ['backlight', 'dramatic_lighting', 'dark_background', 'edge_highlight', 'silhouette'],
  },
  {
    tagId: 'volumetric_light',
    suggests: ['god_rays', 'fog', 'dramatic_lighting', 'dust_particles', 'atmospheric'],
  },
  {
    tagId: 'soft_lighting',
    suggests: ['diffused', 'overcast', 'window_light', 'gentle_shadows', 'flattering'],
  },
  {
    tagId: 'hard_lighting',
    suggests: ['direct_sunlight', 'harsh_shadows', 'high_contrast', 'dramatic', 'spotlight'],
  },
  {
    tagId: 'studio_lighting',
    suggests: ['softbox', 'beauty_dish', 'ring_light', 'backdrop', 'controlled_lighting'],
  },
  {
    tagId: 'natural_light',
    suggests: ['window_light', 'golden_hour', 'overcast', 'outdoor', 'soft_lighting'],
  },
  {
    tagId: 'film_grain',
    suggests: ['vintage', '35mm', 'analog', 'retro', 'textured'],
  },
  {
    tagId: 'high_contrast',
    suggests: ['noir', 'dramatic_lighting', 'shadows', 'bold_colors', 'chiaroscuro'],
  },
  {
    tagId: 'moody',
    suggests: ['dark', 'shadows', 'atmospheric', 'low_key', 'mysterious'],
  },
  {
    tagId: 'bright',
    suggests: ['vibrant', 'high_key', 'cheerful', 'sunlit', 'clean'],
  },
  {
    tagId: 'dark',
    suggests: ['shadows', 'moody', 'low_key', 'mysterious', 'dramatic_lighting'],
  },
  {
    tagId: 'ethereal',
    suggests: ['soft_lighting', 'pastel', 'dreamy', 'translucent', 'floating'],
  },
  {
    tagId: 'detailed',
    suggests: ['intricate', 'high_resolution', 'sharp_focus', 'fine_details', '8k'],
  },
  {
    tagId: 'dynamic_pose',
    suggests: ['action', 'motion_blur', 'dramatic_angle', 'energy', 'frozen_moment'],
  },
  {
    tagId: 'symmetrical',
    suggests: ['centered', 'balanced', 'formal', 'architectural', 'mirror'],
  },
  {
    tagId: 'rule_of_thirds',
    suggests: ['off_center', 'balanced_composition', 'leading_lines', 'negative_space', 'focal_point'],
  },
]

export function getSuggestionsForTag(tagId: string): string[] {
  const rel = TAG_RELATIONSHIPS.find(r => r.tagId === tagId)
  return rel ? rel.suggests : []
}

export function getSuggestionsForTags(tagIds: string[], excludeIds: Set<string>): string[] {
  const suggestionMap = new Map<string, number>()

  for (const tagId of tagIds) {
    const suggestions = getSuggestionsForTag(tagId)
    for (const s of suggestions) {
      if (!excludeIds.has(s) && !tagIds.includes(s)) {
        suggestionMap.set(s, (suggestionMap.get(s) || 0) + 1)
      }
    }
  }

  return Array.from(suggestionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id)
}
