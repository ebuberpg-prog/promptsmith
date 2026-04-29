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
      // character_anatomy.yaml
      'body_types', 'breast', 'buttocks', 'male_chest', 'skin', 'age', 'ethnicity',
      'anthropomorphic', 'fantasy_races', 'hands_details', 'feet_details',
      'body_proportions', 'musculature', 'neck_details', 'creatures_expanded',
      // poses_gestures.yaml
      'standing_poses', 'sitting_poses', 'lying_poses', 'reclining_poses', 'action_poses',
      'intimate_poses', 'intimate_gestures', 'hand_gestures', 'facial_expressions',
      'yoga_poses', 'martial_arts', 'everyday_poses', 'fashion_poses', 'couple_poses',
      'animal_poses', 'bound_restraint', 'worship_religion',
      // facial_features.yaml
      'eyes', 'nose', 'lips', 'jawline', 'cheeks', 'forehead', 'ears', 'face_shape',
      'skin_details', 'throat_details', 'makeup_styles', 'eye_conditions',
      'pupil_details', 'eyelashes', 'skin_conditions',
      // hand_details.yaml
      'finger_positions', 'nail_styles', 'hand_states', 'hand_details',
      // foot_details.yaml
      'foot_positions', 'footwear_states', 'toe_styles', 'foot_details',
      // body_hair.yaml
      'body_hair_locations', 'facial_hair_body', 'body_hair_styles', 'body_hair_colors', 'special',
      // medical_anatomy.yaml
      'skeletal', 'muscular', 'internal', 'body_systems', 'body_parts',
      // fantasy_elements.yaml
      'magic_types', 'magical_creatures', 'fairies', 'magical_items', 'spell_effects', 'supernatural',
      // intimate_content.yaml (poses/gestures already covered above)
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
      // clothing.yaml
      'tops', 'bottoms', 'full_body', 'lingerie', 'footwear', 'clothing_states', 'accessories',
      // hair.yaml
      'hair_length', 'hair_style_women', 'hair_style_men', 'hair_color', 'hair_texture',
      'facial_hair', 'braiding_styles', 'updos_expanded', 'hair_accessories',
      'hair_treatments', 'hair_color_expanded', 'facial_hair_expanded', 'mens_styles_expanded',
      // body_modifications.yaml
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
      // environments.yaml
      'interior_locations', 'exterior_locations', 'atmosphere', 'religious_places',
      'industrial', 'agricultural', 'entertainment', 'transport', 'medical', 'educational',
      'nature_expanded', 'celestial',
      // props_objects.yaml
      'weapons', 'tools', 'gadgets', 'vehicles', 'vehicles_fantasy', 'furniture', 'containers',
      'food_drink', 'nature_objects', 'religious_mystical', 'protection', 'kitchen',
      'household', 'musical_instruments', 'sports', 'office',
      'religious_mystical_expanded', 'fantasy_vehicles_expanded',
      // weather_effects.yaml
      'precipitation', 'wind', 'clouds', 'atmospheric', 'particles', 'celestial', 'extreme',
      // time_period.yaml
      'ancient', 'historical', 'modern', 'cultural', 'seasonal',
      // food_cuisine.yaml
      'cuisines', 'drinks', 'desserts', 'settings',
      // social_setting.yaml
      'intimate', 'social_gatherings', 'work_professional', 'casual', 'outdoor',
      'events', 'family', 'solitary', 'romantic_specific',
      // festival_event.yaml
      'religious', 'cultural', 'music', 'celebrations', 'sports', 'seasonal', 'nightlife',
    ],
    accentHsl: 'var(--group-setting)',
  },
  {
    id: 'style',
    label: 'Style',
    icon: 'Palette',
    description: 'Art style, camera, lighting, composition, color',
    categoryIds: [
      // camera_lighting_style.yaml
      'camera', 'lighting', 'art_styles',
      'camera_types', 'camera_movements', 'film_stocks_expanded',
      'lighting_modifiers', 'lighting_setups_expanded', 'animation_styles',
      // art_medium.yaml
      'photography', 'three_dimensional', 'animation', 'video', 'mixed_media',
      // color_palette.yaml
      'monochromatic', 'complementary', 'analogous', 'triadic', 'split_complementary',
      'thematic', 'mood_based',
      // composition.yaml
      'rule_of_thirds', 'framing', 'perspective', 'leading_lines', 'balance',
      'depth', 'cropping', 'dynamic',
    ],
    accentHsl: 'var(--group-style)',
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: 'Smiley',
    description: 'Emotions, atmosphere, vibes, subcultures',
    categoryIds: [
      // mood_emotion.yaml
      'positive', 'negative', 'fearful', 'neutral', 'complex',
      // subculture.yaml
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
      // camera_lighting_style.yaml - quality category
      'quality',
      // negative_prompts.yaml
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
