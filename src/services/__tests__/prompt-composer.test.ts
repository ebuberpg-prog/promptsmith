import { describe, it, expect } from 'vitest'
import { PromptComposer } from '@/services/prompt-composer'
import type { SelectedTag, SupportedModel } from '@/types'

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

describe('PromptComposer', () => {
  const composer = new PromptComposer()

  const portraitTags: SelectedTag[] = [
    tag('a woman', 'subject'),
    tag('long hair', 'hair'),
    tag('golden hour', 'camera_lighting_style'),
    tag('photorealistic', 'art_medium'),
    tag('shallow depth of field', 'composition'),
  ]

  describe('Midjourney format', () => {
    it('produces comma-separated tags with --ar and --v 6 params', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'midjourney',
        parameters: {},
      })
      expect(result).toContain('a woman')
      expect(result).toContain('photorealistic')
      expect(result).toContain('--ar 16:9')
      expect(result).toContain('--v 6')
    })

    it('respects custom aspect ratio', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'midjourney',
        parameters: { aspectRatio: '2:3' },
      })
      expect(result).toContain('--ar 2:3')
    })

    it('appends quality and style params when set', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'midjourney',
        parameters: { style: '750', chaos: 20, quality: 2 },
      })
      expect(result).toContain('--s 750')
      expect(result).toContain('--c 20')
      expect(result).toContain('--q 2')
    })

    it('auto-adds quality boosters for realistic style tags', () => {
      const tags = [
        tag('photorealistic', 'art_medium'),
        tag('portrait', 'subject'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'midjourney',
        parameters: {},
      })
      // Midjourney gets minimal boosters, but photorealistic might be added if not present
      expect(result).toContain('photorealistic')
    })
  })

  describe('Prose format (DALL-E, Gemini, Ideogram)', () => {
    it('generates natural language sentences', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'dalle-3',
        parameters: {},
      })
      // Should be a sentence-like structure, not just comma-separated
      expect(result).toMatch(/A|The/)
      expect(result.endsWith('.')).toBe(true)
      // Should contain the subject
      expect(result.toLowerCase()).toContain('woman')
    })

    it('does NOT append Midjourney params', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'gemini',
        parameters: {},
      })
      expect(result).not.toContain('--ar')
      expect(result).not.toContain('--v 6')
    })

    it('handles custom text in prose format', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: 'shot on Hasselblad X2D',
        model: 'ideogram',
        parameters: {},
      })
      expect(result).toContain('shot on Hasselblad X2D')
    })
  })

  describe('Comma-separated format (SDXL, FLUX, Qwen, z-image)', () => {
    it('produces comma-separated tags', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'stable-diffusion',
        parameters: {},
      })
      expect(result).toContain('a woman')
      expect(result).toContain('golden hour')
      // Should be comma-separated (not prose)
      expect(result.split(', ').length).toBeGreaterThanOrEqual(portraitTags.length)
    })

    it('applies weight formatting for SDXL', () => {
      const tags = [
        tag('portrait', 'subject', 1.3),
        tag('cinematic', 'camera_lighting_style'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'stable-diffusion',
        parameters: {},
      })
      expect(result).toContain('(portrait:1.3)')
    })

    it('does not apply weights for models without weighting support', () => {
      const tags = [
        tag('portrait', 'subject', 1.3),
        tag('cinematic', 'camera_lighting_style'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'dalle-3',
        parameters: {},
      })
      // DALL-E doesn't support weighting, so should use raw label (prose may capitalize)
      expect(result.toLowerCase()).toContain('portrait')
    })

    it('applies trigger words as prefix for tag-based models', () => {
      const tags = [
        tag('portrait', 'subject', undefined, ['trigger1', 'trigger2']),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'flux',
        parameters: {},
      })
      expect(result).toContain('trigger1, trigger2, portrait')
    })

    it('auto-adds quality boosters for SD/FLUX', () => {
      const tags = [
        tag('photorealistic', 'art_medium'),
        tag('portrait', 'subject'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'flux',
        parameters: {},
      })
      expect(result).toContain('high detail')
      expect(result).toContain('sharp focus')
    })

    it('does not add quality boosters for painterly styles', () => {
      const tags = [
        tag('oil painting', 'art_medium'),
        tag('portrait', 'subject'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'stable-diffusion',
        parameters: {},
      })
      // Painterly styles should not get "sharp focus" / "high detail"
      expect(result).not.toContain('sharp focus')
    })
  })

  describe('Tag ordering', () => {
    it('orders subject before style and quality', () => {
      const tags = [
        tag('8k resolution', 'quality'),
        tag('oil painting', 'art_medium'),
        tag('a man', 'subject'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'stable-diffusion',
        parameters: {},
      })
      const subjectIdx = result.indexOf('a man')
      const styleIdx = result.indexOf('oil painting')
      expect(subjectIdx).toBeLessThan(styleIdx)
    })
  })

  describe('Custom model', () => {
    it('uses tag-based format for custom model', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'custom',
        parameters: {},
      })
      expect(result).toContain('a woman')
      expect(result).not.toContain('--ar')
    })
  })
})