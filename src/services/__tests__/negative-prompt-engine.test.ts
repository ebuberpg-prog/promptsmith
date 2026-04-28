import { describe, it, expect } from 'vitest'
import { NegativePromptEngine } from '@/services/negative-prompt-engine'
import type { SelectedTag } from '@/types'

function tag(label: string, category?: string): SelectedTag {
  return {
    id: crypto.randomUUID(),
    label,
    aliases: [],
    description: '',
    explicit: false,
    weight: 1.0,
    category,
    selectedAt: Date.now(),
  }
}

describe('NegativePromptEngine', () => {
  const engine = new NegativePromptEngine()

  describe('analyze', () => {
    it('returns empty for Midjourney (no negative prompt support)', () => {
      const result = engine.analyze(
        [tag('portrait', 'subject')],
        '',
        'midjourney'
      )
      expect(result.suggestedNegatives.length).toBe(0)
    })

    it('detects portrait context and suggests face/hand negatives', () => {
      const result = engine.analyze(
        [tag('portrait', 'subject'), tag('close-up', 'composition')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t.includes('face'))).toBe(true)
    })

    it('detects landscape context and suggests no-people negatives', () => {
      const result = engine.analyze(
        [tag('mountain landscape', 'environments')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'people')).toBe(true)
    })

    it('detects photorealistic style and suggests anti-cartoon negatives', () => {
      const result = engine.analyze(
        [tag('photorealistic', 'art_medium')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'cartoon')).toBe(true)
      expect(texts.some(t => t === 'anime')).toBe(true)
    })

    it('detects anime style and suggests anti-photorealistic negatives', () => {
      const result = engine.analyze(
        [tag('anime', 'art_medium')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'photorealistic')).toBe(true)
    })

    it('detects underwater context', () => {
      const result = engine.analyze(
        [tag('underwater', 'environments')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'dry')).toBe(true)
      expect(texts.some(t => t === 'above water')).toBe(true)
    })

    it('detects hands context and adds hand-specific negatives', () => {
      const result = engine.analyze(
        [tag('holding', 'poses'), tag('hands', 'character_anatomy')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t.includes('hand'))).toBe(true)
      expect(texts.some(t => t.includes('finger'))).toBe(true)
    })

    it('detects multiple figures context', () => {
      const result = engine.analyze(
        [tag('group', 'character_anatomy'), tag('multiple people', 'subject')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'duplicate')).toBe(true)
    })

    it('detects minimalist style', () => {
      const result = engine.analyze(
        [tag('minimalist', 'art_medium')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'cluttered')).toBe(true)
      expect(texts.some(t => t === 'busy')).toBe(true)
    })

    it('does not suggest negating tags already in the prompt', () => {
      const result = engine.analyze(
        [tag('anime', 'art_medium')],
        'photorealistic',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      // "photorealistic" is in customText, so should not be suggested as a negative
      expect(texts.filter(t => t === 'photorealistic').length).toBeLessThanOrEqual(1)
    })

    it('includes universal quality negatives', () => {
      const result = engine.analyze(
        [tag('portrait', 'subject')],
        '',
        'stable-diffusion'
      )
      const texts = result.suggestedNegatives.map(n => n.text)
      expect(texts.some(t => t === 'low quality')).toBe(true)
      expect(texts.some(t => t === 'blurry')).toBe(true)
    })

    it('limits to 15 suggestions', () => {
      const result = engine.analyze(
        [
          tag('portrait', 'subject'),
          tag('photorealistic', 'art_medium'),
          tag('hands holding', 'poses'),
          tag('group', 'character_anatomy'),
          tag('urban city', 'environments'),
        ],
        '',
        'stable-diffusion'
      )
      expect(result.suggestedNegatives.length).toBeLessThanOrEqual(15)
    })

    it('returns context analysis with detected info', () => {
      const result = engine.analyze(
        [
          tag('portrait', 'subject'),
          tag('photorealistic', 'art_medium'),
          tag('underwater', 'environments'),
        ],
        '',
        'stable-diffusion'
      )
      expect(result.contextAnalysis.subject).toBe('portrait')
      expect(result.contextAnalysis.environment).toBe('underwater')
      expect(result.contextAnalysis.style).toBe('photorealistic')
    })
  })

  describe('generateNegativePrompt', () => {
    it('returns empty for Midjourney', () => {
      const result = engine.generateNegativePrompt(
        [tag('portrait', 'subject')], '', '', 'midjourney'
      )
      expect(result).toBe('')
    })

    it('returns custom negative prompt if provided', () => {
      const result = engine.generateNegativePrompt(
        [tag('portrait', 'subject')], '', 'my custom negative', 'stable-diffusion'
      )
      expect(result).toBe('my custom negative')
    })

    it('generates context-aware negative prompt', () => {
      const result = engine.generateNegativePrompt(
        [tag('portrait', 'subject'), tag('photorealistic', 'art_medium')],
        '',
        '',
        'stable-diffusion'
      )
      expect(result).toBeTruthy()
      expect(result.split(', ').length).toBeGreaterThan(5)
    })
  })
})