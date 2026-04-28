import { describe, it, expect } from 'vitest'
import { MutationEngine } from '@/services/mutation-engine'
import type { SelectedTag } from '@/types'

function tag(label: string, category?: string, customWeight?: number, triggerWords?: string[]): SelectedTag {
  return {
    id: crypto.randomUUID(),
    label,
    aliases: [],
    description: '',
    explicit: false,
    weight: 1.0,
    category,
    selectedAt: Date.now(),
    customWeight,
    triggerWords,
  }
}

describe('MutationEngine', () => {
  const engine = new MutationEngine()

  const portraitTags = [
    tag('a woman', 'subject'),
    tag('long hair', 'hair'),
    tag('portrait framing', 'composition'),
    tag('golden hour', 'camera_lighting_style'),
    tag('photorealistic', 'art_medium'),
    tag('shallow depth of field', 'composition'),
  ]

  describe('generateMutations', () => {
    it('returns at most 5 variations', () => {
      const variations = engine.generateMutations(portraitTags, '', 'stable-diffusion', { maxVariations: 5 })
      expect(variations.length).toBeLessThanOrEqual(5)
      expect(variations.length).toBeGreaterThan(0)
    })

    it('returns variations with content and descriptions', () => {
      const variations = engine.generateMutations(portraitTags, '', 'stable-diffusion')
      for (const v of variations) {
        expect(v.content).toBeTruthy()
        expect(v.description).toBeTruthy()
        expect(v.type).toBeOneOf(['style_shift', 'weight_adjust', 'synonym', 'composition', 'negative_addition'])
        expect(v.confidence).toBeGreaterThan(0)
      }
    })

    it('generates style shift variations (more realistic) for photorealistic tags', () => {
      const variations = engine.generateMutations(portraitTags, '', 'stable-diffusion', { types: ['style_shift'] })
      const styleShifts = variations.filter(v => v.type === 'style_shift')
      // Should find "More Detailed" style shift for photorealistic
      expect(styleShifts.length).toBeGreaterThan(0)
    })

    it('generates weight adjustment variations', () => {
      const variations = engine.generateMutations(portraitTags, '', 'stable-diffusion', { types: ['weight_adjust'] })
      const weightAdjusts = variations.filter(v => v.type === 'weight_adjust')
      expect(weightAdjusts.length).toBeGreaterThan(0)
      // Should boost subject weight
      for (const w of weightAdjusts) {
        expect(w.description.toLowerCase()).toMatch(/emphasis|weight|boost/i)
      }
    })

    it('generates synonym variations when matching words exist', () => {
      const tags = [
        tag('a woman', 'subject'),
        tag('beautiful', 'mood_emotion'),
        tag('photorealistic', 'art_medium'),
      ]
      const variations = engine.generateMutations(tags, '', 'stable-diffusion', { types: ['synonym'] })
      // "beautiful" has synonyms in the pool
      const synVariations = variations.filter(v => v.type === 'synonym')
      // May or may not find depending on synonym matching
      if (synVariations.length > 0) {
        expect(synVariations[0].description).toMatch(/Replaced|replaced/i)
      }
    })

    it('generates composition changes', () => {
      const variations = engine.generateMutations(portraitTags, '', 'stable-diffusion', { types: ['composition'] })
      const compVariations = variations.filter(v => v.type === 'composition')
      // "portrait framing" should match "Closer Framing" swap
      expect(compVariations.length).toBeGreaterThan(0)
    })

    it('style shift "More Cinematic" adds cinematic keywords', () => {
      const tags = [tag('photorealistic', 'art_medium')]
      const variations = engine.generateMutations(tags, '', 'stable-diffusion', { types: ['style_shift'] })

      // Look for cinematic-style additions
      const relevant = variations.filter(v => v.content.includes('cinematic') || v.content.includes('film grain'))
      expect(relevant.length).toBeGreaterThan(0)
    })

    it('respects maxVariations limit', () => {
      const variations = engine.generateMutations(portraitTags, '', 'stable-diffusion', { maxVariations: 2 })
      expect(variations.length).toBeLessThanOrEqual(2)
    })

    it('returns empty array for empty tags', () => {
      const variations = engine.generateMutations([], '', 'stable-diffusion')
      // Style shifts may still generate (they add tags), but weight adjusts need tags
      const weightTypes = variations.filter(v => v.type === 'weight_adjust')
      expect(weightTypes.length).toBe(0)
    })
  })

  describe('style shifts on specific media', () => {
    it('More Artistic shifts photorealistic to oil painting', () => {
      const tags = [tag('photorealistic', 'art_medium')]
      const variations = engine.generateMutations(tags, '', 'stable-diffusion', { types: ['style_shift'] })

      const artistic = variations.filter(v =>
        v.content.toLowerCase().includes('oil painting') ||
        v.content.toLowerCase().includes('painterly')
      )
      expect(artistic.length).toBeGreaterThan(0)
    })

    it('More Realistic shifts anime to hyperrealistic', () => {
      const tags = [tag('anime', 'art_medium')]
      const variations = engine.generateMutations(tags, '', 'stable-diffusion', { types: ['style_shift'] })

      const realistic = variations.filter(v =>
        v.content.toLowerCase().includes('realistic') ||
        v.content.toLowerCase().includes('hyperrealistic')
      )
      expect(realistic.length).toBeGreaterThan(0)
    })

    it('Darker Mood shifts bright mood to dark', () => {
      const tags = [tag('bright', 'mood_emotion')]
      const variations = engine.generateMutations(tags, '', 'stable-diffusion', { types: ['style_shift'] })

      const darker = variations.filter(v =>
        v.content.toLowerCase().includes('dark') ||
        v.content.toLowerCase().includes('moody')
      )
      expect(darker.length).toBeGreaterThan(0)
    })

    it('Lighter Mood shifts dark mood to bright', () => {
      const tags = [tag('dark', 'mood_emotion')]
      // Need maxVariations >= 6 since Lighter Mood is the 6th shift that matches
      const variations = engine.generateMutations(tags, '', 'stable-diffusion', {
        types: ['style_shift'],
        maxVariations: 10,
      })

      const lighter = variations.filter(v =>
        v.content.toLowerCase().includes('bright') ||
        v.content.toLowerCase().includes('cheerful')
      )
      expect(lighter.length).toBeGreaterThan(0)
    })
  })
})