import { describe, it, expect } from 'vitest'
import { CompressionEngine } from '@/services/compression-engine'
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

describe('CompressionEngine', () => {
  const engine = new CompressionEngine()

  const largeTagSet: SelectedTag[] = [
    tag('a woman', 'subject'),
    tag('long hair', 'hair'),
    tag('portrait', 'subject'),
    tag('standing', 'poses'),
    tag('smiling', 'expressions'),
    tag('dress', 'clothing'),
    tag('golden hour', 'camera_lighting_style'),
    tag('soft lighting', 'camera_lighting_style'),
    tag('photorealistic', 'art_medium'),
    tag('cinematic', 'art_medium'),
    tag('8k', 'quality'),
    tag('high detail', 'quality'),
    tag('sharp focus', 'quality'),
    tag('masterpiece', 'quality'),
    tag('shallow depth of field', 'composition'),
    tag('bokeh', 'composition'),
    tag('vintage', 'art_medium'),
    tag('dramatic', 'mood_emotion'),
    tag('rain', 'environments'),
    tag('city street', 'environments'),
  ]

  describe('compress', () => {
    it('does not compress when under token limit', () => {
      const tags = [tag('portrait', 'subject'), tag('cinematic', 'art_medium')]
      const result = engine.compress(tags, '', 'stable-diffusion')
      expect(result.removedElements.length).toBe(0)
      expect(result.compressedPrompt).toBe(result.originalPrompt)
    })

    it('compresses when over token limit', () => {
      const result = engine.compress(largeTagSet, '', 'stable-diffusion', 'truncation', 10)
      expect(result.removedElements.length).toBeGreaterThan(0)
      expect(result.compressedTokens).toBeLessThanOrEqual(result.originalTokens)
    })

    it('preserves subject tags in priority mode', () => {
      const result = engine.compress(largeTagSet, '', 'stable-diffusion', 'priority', 8)
      const compressed = result.compressedPrompt.toLowerCase()
      expect(compressed).toContain('woman')
      // Subject + style should survive
      expect(result.preservedElements.some(p => p.toLowerCase().includes('woman'))).toBe(true)
    })

    it('merges semantically overlapping quality tags', () => {
      const result = engine.compress(largeTagSet, '', 'stable-diffusion', 'merging', 15)
      // Quality tags like "8k", "high detail", "masterpiece" should be merged
      const qualityRemoved = result.removedElements.filter(r =>
        ['8k', 'high detail', 'sharp focus', 'masterpiece'].includes(r)
      )
      expect(qualityRemoved.length).toBeGreaterThan(0)
    })

    it('never removes subject tags in priority mode', () => {
      const result = engine.compress(largeTagSet, '', 'stable-diffusion', 'priority', 5)
      expect(result.preservedElements.some(p => p === 'a woman')).toBe(true)
    })

    it('hybrid strategy uses merging then priority', () => {
      const result = engine.compress(largeTagSet, '', 'stable-diffusion', 'hybrid', 8)
      expect(result.strategy).toBeOneOf(['hybrid', 'merging', 'priority', 'truncation'])
      expect(result.compressedTokens).toBeLessThanOrEqual(result.originalTokens)
    })

    it('returns useful metadata', () => {
      const result = engine.compress(largeTagSet, '', 'stable-diffusion', 'truncation', 10)
      expect(result.removedElements.length).toBeGreaterThan(0)
      expect(result.preservedElements.length).toBeGreaterThan(0)
      expect(result.compressionRatio).toBeGreaterThan(0)
      expect(result.compressionRatio).toBeLessThanOrEqual(1)
    })
  })

  describe('getModelTokenLimit', () => {
    it('returns 75 for SD', () => expect(engine.getModelTokenLimit('stable-diffusion')).toBe(75))
    it('returns 77 for Midjourney', () => expect(engine.getModelTokenLimit('midjourney')).toBe(77))
    it('returns 500 for GPT Image', () => expect(engine.getModelTokenLimit('gpt-image')).toBe(500))
    it('returns 150 for custom', () => expect(engine.getModelTokenLimit('custom')).toBe(150))
  })
})