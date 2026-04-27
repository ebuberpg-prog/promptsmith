export type SlotId =
  | 'subject'
  | 'body'
  | 'clothing'
  | 'setting'
  | 'lighting'
  | 'camera'
  | 'style'
  | 'mood'

export interface PromptSlot {
  id: SlotId
  label: string
  required: boolean
  minTags: number
  maxTags: number
  // taxonomy category IDs that belong to this slot
  taxonomyCategoryIds: string[]
}

export interface ConflictRule {
  // prefix or exact match for tag id/label
  tagA: string
  tagB: string
  severity: 'hard' | 'soft'
  reason: string
}

export const PROMPT_SLOTS: PromptSlot[] = [
  {
    id: 'subject',
    label: 'Subject',
    required: true,
    minTags: 1,
    maxTags: 2,
    taxonomyCategoryIds: ['character_anatomy', 'poses_gestures', 'facial_features'],
  },
  {
    id: 'body',
    label: 'Physical',
    required: false,
    minTags: 0,
    maxTags: 3,
    taxonomyCategoryIds: ['character_anatomy', 'hair', 'body_modifications', 'body_hair'],
  },
  {
    id: 'clothing',
    label: 'Clothing',
    required: false,
    minTags: 0,
    maxTags: 2,
    taxonomyCategoryIds: ['clothing'],
  },
  {
    id: 'setting',
    label: 'Setting',
    required: false,
    minTags: 0,
    maxTags: 2,
    taxonomyCategoryIds: ['environments', 'time_period', 'social_setting', 'weather_effects'],
  },
  {
    id: 'lighting',
    label: 'Lighting',
    required: false,
    minTags: 0,
    maxTags: 2,
    taxonomyCategoryIds: ['camera_lighting_style'],
  },
  {
    id: 'camera',
    label: 'Camera',
    required: false,
    minTags: 0,
    maxTags: 1,
    taxonomyCategoryIds: ['camera_lighting_style', 'composition'],
  },
  {
    id: 'style',
    label: 'Style',
    required: false,
    minTags: 0,
    maxTags: 2,
    taxonomyCategoryIds: ['art_medium', 'camera_lighting_style'],
  },
  {
    id: 'mood',
    label: 'Mood',
    required: false,
    minTags: 0,
    maxTags: 2,
    taxonomyCategoryIds: ['mood_emotion', 'color_palette'],
  },
]

// Conflict rules: tag labels/substrings that clash with each other
// tagA and tagB are lowercase label substrings — if both appear in selection, flag conflict
export const CONFLICT_RULES: ConflictRule[] = [
  // Time of day conflicts
  { tagA: 'golden hour', tagB: 'night', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'golden hour', tagB: 'moonlit', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'golden hour', tagB: 'starry', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'sunrise', tagB: 'night scene', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'daytime', tagB: 'moonlit', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'daytime', tagB: 'night', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'noon', tagB: 'night', severity: 'hard', reason: 'Time of day conflict' },
  { tagA: 'afternoon', tagB: 'night scene', severity: 'hard', reason: 'Time of day conflict' },
  // Lighting source conflicts
  { tagA: 'neon lights', tagB: 'studio lighting', severity: 'soft', reason: 'Lighting source conflict' },
  { tagA: 'neon lights', tagB: 'natural light', severity: 'soft', reason: 'Lighting source conflict' },
  { tagA: 'studio lighting', tagB: 'outdoor', severity: 'soft', reason: 'Indoor/outdoor lighting conflict' },
  { tagA: 'candlelit', tagB: 'studio lighting', severity: 'soft', reason: 'Lighting conflict' },
  // Lens/camera conflicts
  { tagA: 'fisheye', tagB: 'telephoto', severity: 'hard', reason: 'Lens type conflict' },
  { tagA: 'wide angle', tagB: 'telephoto', severity: 'hard', reason: 'Lens type conflict' },
  // Style conflicts
  { tagA: 'photorealistic', tagB: 'cartoon', severity: 'hard', reason: 'Style conflict' },
  { tagA: 'photorealistic', tagB: 'anime', severity: 'hard', reason: 'Style conflict' },
  { tagA: 'photorealistic', tagB: 'abstract', severity: 'soft', reason: 'Style tension' },
  { tagA: 'oil painting', tagB: 'photograph', severity: 'hard', reason: 'Medium conflict' },
  { tagA: 'watercolor', tagB: 'photorealistic', severity: 'hard', reason: 'Medium conflict' },
  { tagA: 'sketch', tagB: 'photorealistic', severity: 'hard', reason: 'Medium conflict' },
  { tagA: 'pixel art', tagB: 'photorealistic', severity: 'hard', reason: 'Style conflict' },
  // Environment conflicts
  { tagA: 'underwater', tagB: 'desert', severity: 'hard', reason: 'Environment conflict' },
  { tagA: 'underwater', tagB: 'on fire', severity: 'hard', reason: 'Environment conflict' },
  { tagA: 'space', tagB: 'underwater', severity: 'soft', reason: 'Unusual environment combo' },
  // Weather conflicts
  { tagA: 'sunny', tagB: 'heavy rain', severity: 'hard', reason: 'Weather conflict' },
  { tagA: 'clear sky', tagB: 'storm', severity: 'hard', reason: 'Weather conflict' },
  { tagA: 'blizzard', tagB: 'beach', severity: 'soft', reason: 'Unusual weather+setting' },
  // Color palette conflicts
  { tagA: 'monochrome', tagB: 'vibrant colors', severity: 'hard', reason: 'Color conflict' },
  { tagA: 'black and white', tagB: 'vibrant', severity: 'hard', reason: 'Color conflict' },
  { tagA: 'desaturated', tagB: 'neon', severity: 'soft', reason: 'Color saturation conflict' },
  // Pose/subject conflicts
  { tagA: 'lying down', tagB: 'running', severity: 'hard', reason: 'Pose conflict' },
  { tagA: 'flying', tagB: 'sitting', severity: 'hard', reason: 'Pose conflict' },
  // Clothing state conflicts
  { tagA: 'fully clothed', tagB: 'nude', severity: 'hard', reason: 'Clothing state conflict' },
  { tagA: 'fully dressed', tagB: 'nude', severity: 'hard', reason: 'Clothing state conflict' },
]

export function hasConflict(
  tagLabelA: string,
  tagLabelB: string
): ConflictRule | null {
  const a = tagLabelA.toLowerCase()
  const b = tagLabelB.toLowerCase()

  for (const rule of CONFLICT_RULES) {
    const rA = rule.tagA.toLowerCase()
    const rB = rule.tagB.toLowerCase()

    if (
      (a.includes(rA) && b.includes(rB)) ||
      (a.includes(rB) && b.includes(rA))
    ) {
      return rule
    }
  }
  return null
}

export function wouldConflictWithAny(
  candidate: { label: string },
  selected: { label: string }[]
): ConflictRule | null {
  for (const existing of selected) {
    const conflict = hasConflict(candidate.label, existing.label)
    if (conflict) return conflict
  }
  return null
}
