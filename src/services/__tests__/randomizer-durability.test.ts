import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BUILT_IN_FORMATTER_PROFILES } from '@/data/formatter-profiles'
import { RandomizerEngine } from '@/services/randomizer-engine'
import { composeWithProfile } from '@/services/formatter-service'
import { addTagsToIndex, resetTagIndex } from '@/utils/tag-index'
import type { TaxonomyTag } from '@/types'

const tags: TaxonomyTag[] = [
  { id: 'portrait', label: 'portrait', aliases: [], description: '', category: 'character_anatomy', subcategory: 'subject' },
  { id: 'figure', label: 'full figure', aliases: [], description: '', category: 'character_anatomy', subcategory: 'subject' },
  { id: 'mature-subject', label: 'mature subject', aliases: [], description: '', category: 'character_anatomy', subcategory: 'subject', explicit: true },
  { id: 'rain', label: 'rainy window', aliases: [], description: '', category: 'weather_effects', subcategory: 'weather' },
  { id: 'light', label: 'soft window light', aliases: [], description: '', category: 'camera_lighting_style', subcategory: 'lighting' },
  { id: 'oil', label: 'oil painting', aliases: [], description: '', category: 'art_medium', subcategory: 'style' },
]

describe('durable randomization', () => {
  beforeEach(() => { resetTagIndex(); addTagsToIndex(tags) })
  afterEach(resetTagIndex)

  it('produces identical selections for the same seed and honors filtered visibility', () => {
    const engine = new RandomizerEngine()
    const options = { seed: 74291, intensity: 'light' as const, contentVisibility: 'filtered' as const, mode: 'smart' as const }
    const first = engine.randomize(options)
    const second = engine.randomize(options)
    expect(first.tags.map((tag) => tag.id)).toEqual(second.tags.map((tag) => tag.id))
    expect(first.tags.some((tag) => tag.explicit)).toBe(false)
  })

  it('keeps authored content in every format family without outline placeholders', () => {
    const result = new RandomizerEngine().randomize({ seed: 74291, intensity: 'light', contentVisibility: 'all', mode: 'smart' })
    for (const profile of BUILT_IN_FORMATTER_PROFILES) {
      const raw = 'A rain-lit artist portrait'
      const prompt = composeWithProfile({ profile, tags: result.tags, customText: raw, parameters: {} }).prompt
      expect(prompt).toContain(raw)
      expect(prompt).not.toMatch(/^(Subject|Important details):/m)
      expect(raw).toBe('A rain-lit artist portrait')
    }
  })

  it('uses the Smart guide text to bias matching slots', () => {
    const result = new RandomizerEngine().randomize({ seed: 17, storySeed: 'portrait', intensity: 'light', contentVisibility: 'filtered', mode: 'smart' })
    expect(result.slots.subject?.map((tag) => tag.id)).toContain('portrait')
  })
})
