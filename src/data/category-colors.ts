export interface SemanticGroup {
  id: string
  label: string
  icon: string
  description: string
  categoryIds: string[]
  accentHsl: string
}

export const SEMANTIC_GROUPS: SemanticGroup[] = [
  {
    id: 'subject',
    label: 'Subject',
    icon: 'User',
    description: 'Characters, anatomy, poses, creatures',
    categoryIds: [
      // ── gender.yaml: who are they? ──
      'gender_identity', 'age_specific', 'sex', 'presentation',

      // ── character_anatomy.yaml: core build ──
      'age', 'ethnicity', 'body_types', 'height', 'proportions', 'body_proportions', 'skin',

      // ── facial_features.yaml: face, top to bottom ──
      'face_shape', 'eyes', 'nose', 'lips', 'jawline', 'cheeks', 'forehead', 'ears',
      'skin_details', 'neck_details', 'throat_details', 'makeup_styles',
      'eye_conditions', 'pupil_details', 'eyelashes', 'skin_conditions',

      // ── hair.yaml: hair & facial hair ──
      'hair_length', 'hair_color', 'hair_texture',
      'hair_style_women', 'hair_style_men',
      'braiding_styles', 'updos_expanded', 'hair_accessories', 'hair_treatments',
      'hair_color_expanded', 'facial_hair', 'facial_hair_expanded', 'mens_styles_expanded',

      // ── character_anatomy.yaml: body detail ──
      'musculature', 'male_chest', 'breast', 'buttocks',

      // ── body_hair.yaml ──
      'body_hair_locations', 'body_hair_styles', 'body_hair_colors', 'special',

      // ── poses_gestures.yaml: action & expression ──
      'standing_poses', 'sitting_poses', 'lying_poses', 'reclining_poses', 'action_poses',
      'everyday_poses', 'fashion_poses', 'couple_poses', 'animal_poses',
      'yoga_poses', 'martial_arts', 'worship_religion', 'bound_restraint',
      'intimate_poses', 'intimate_gestures', 'hand_gestures', 'facial_expressions',

      // ── hand_details.yaml ──
      'finger_positions', 'nail_styles', 'hand_states', 'hand_details',

      // ── foot_details.yaml ──
      'foot_positions', 'footwear_states', 'toe_styles', 'foot_details',

      // ── fantasy & creatures ──
      'fantasy_races', 'anthropomorphic', 'creatures_expanded',

      // ── animals.yaml ──
      'domestic_animals', 'wildlife',

      // ── medical_anatomy.yaml ──
      'skeletal', 'muscular', 'internal', 'body_systems', 'body_parts',

      // ── fantasy_elements.yaml ──
      'magic_types', 'magical_creatures', 'fairies', 'magical_items', 'spell_effects', 'supernatural',

      // ── intimate_content.yaml ──
      'clothing_fetish', 'body_states', 'adult_settings', 'fetish_specific', 'aftermath', 'sensation',
    ],
    accentHsl: 'var(--group-subject)',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'TShirt',
    description: 'Clothing, hair, accessories, body mods',
    categoryIds: [
      // ── hair.yaml ──
      'hair_length', 'hair_color', 'hair_texture',
      'hair_style_women', 'hair_style_men',
      'braiding_styles', 'updos_expanded', 'hair_accessories', 'hair_treatments',
      'hair_color_expanded', 'facial_hair', 'facial_hair_expanded', 'mens_styles_expanded',

      // ── clothing.yaml ──
      'tops', 'bottoms', 'full_body', 'lingerie', 'footwear', 'clothing_states', 'accessories',
      'techwear', 'athleisure', 'sustainable_fashion',

      // ── body_modifications.yaml ──
      'tattoos', 'piercings', 'scars', 'other_modifications', 'tattoo_subjects',
      'piercings_expanded', 'uv_body_art', 'cosmetic_procedures', 'brand_scars', 'gauge_expansion',
    ],
    accentHsl: 'var(--group-appearance)',
  },
  {
    id: 'setting',
    label: 'Setting',
    icon: 'Tree',
    description: 'Environments, props, weather, time, architecture',
    categoryIds: [
      // ── environments.yaml: place ──
      'exterior_locations', 'interior_locations', 'atmosphere',
      'nature_expanded', 'celestial', 'abandoned_places', 'underwater_cities', 'cyberpunk_streets', 'spaceship_interiors',
      'religious_places', 'industrial', 'agricultural', 'entertainment', 'transport', 'medical', 'educational',

      // ── weather_effects.yaml ──
      'precipitation', 'wind', 'clouds', 'atmospheric', 'particles', 'celestial', 'extreme',

      // ── time_period.yaml ──
      'ancient', 'historical', 'modern', 'cultural', 'seasonal',

      // ── social_setting.yaml ──
      'intimate', 'social_gatherings', 'work_professional', 'casual', 'outdoor', 'events', 'family', 'solitary', 'romantic_specific',

      // ── festival_event.yaml ──
      'religious', 'cultural', 'music', 'celebrations', 'sports', 'seasonal', 'nightlife',

      // ── architecture.yaml ──
      'building_styles', 'building_types', 'structural_elements',

      // ── props_objects.yaml ──
      'weapons', 'tools', 'gadgets', 'vehicles', 'vehicles_fantasy', 'fantasy_vehicles_expanded',
      'furniture', 'containers', 'kitchen', 'household', 'office',
      'food_drink', 'nature_objects', 'religious_mystical', 'religious_mystical_expanded', 'protection',
      'musical_instruments', 'sports',

      // ── technology.yaml ──
      'communication', 'camera_tech', 'gaming_tech', 'robotics', 'vehicles_tech', 'tech_misc',

      // ── audio.yaml ──
      'audio_devices', 'instruments', 'music_genres', 'sound_effects',

      // ── food_cuisine.yaml ──
      'cuisines', 'drinks', 'desserts', 'settings',
    ],
    accentHsl: 'var(--group-setting)',
  },
  {
    id: 'style',
    label: 'Style',
    icon: 'Palette',
    description: 'Art style, camera, lighting, composition, color',
    categoryIds: [
      // ── art_medium.yaml ──
      'photography', 'three_dimensional', 'animation', 'video', 'mixed_media', 'ai_generated',

      // ── camera_lighting_style.yaml ──
      'camera', 'lighting', 'art_styles', 'camera_types', 'camera_movements', 'film_stocks_expanded',
      'lighting_modifiers', 'lighting_setups_expanded', 'animation_styles',

      // ── composition.yaml ──
      'rule_of_thirds', 'framing', 'perspective', 'leading_lines', 'balance',
      'depth', 'cropping', 'dynamic', 'dutch_angle', 'forced_perspective', 'silhouette', 'negative_space',

      // ── color_palette.yaml ──
      'monochromatic', 'complementary', 'analogous', 'triadic', 'split_complementary',
      'thematic', 'mood_based', 'duotone', 'tritone', 'tetradic',

      // ── typography.yaml ──
      'font_styles', 'text_effects', 'text_layout',

      // ── abstract.yaml ──
      'abstract_concepts', 'abstract_states', 'abstract_forces', 'abstract_visuals',

      // ── textures.yaml ──
      'natural_textures', 'synthetic_textures',

      // ── shapes_patterns.yaml ──
      'geometric_shapes', 'patterns', 'fractals', 'abstract_patterns',
    ],
    accentHsl: 'var(--group-style)',
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: 'Smiley',
    description: 'Emotions, atmosphere, vibes, subcultures',
    categoryIds: [
      // ── mood_emotion.yaml ──
      'positive', 'negative', 'fearful', 'neutral', 'complex',

      // ── subculture.yaml ──
      'goth', 'punk', 'hipster', 'biker', 'military_tactical', 'streetwear',
      'fashion', 'anime_manga', 'gaming', 'esoteric', 'adult',
    ],
    accentHsl: 'var(--group-mood)',
  },
  {
    id: 'quality',
    label: 'Quality',
    icon: 'Gear',
    description: 'Quality tags, model params, negatives',
    categoryIds: [
      // ── camera_lighting_style.yaml ──
      'quality',

      // ── negative_prompts.yaml ──
      'universal', 'character_specific', 'style_specific', 'model_specific',
    ],
    accentHsl: 'var(--group-quality)',
  },
]

const _categoryToGroup = new Map<string, string>()
for (const group of SEMANTIC_GROUPS) {
  for (const catId of group.categoryIds) {
    _categoryToGroup.set(catId, group.id)
  }
}

export function getGroupForCategory(categoryId: string): string {
  return _categoryToGroup.get(categoryId) ?? 'quality'
}
