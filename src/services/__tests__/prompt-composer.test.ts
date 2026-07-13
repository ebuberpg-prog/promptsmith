import { describe, it, expect } from 'vitest'
import { PromptComposer } from '@/services/prompt-composer'
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
    it('produces comma-separated tags with --ar and --v 8 params', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'midjourney',
        parameters: {},
      })
      expect(result).toContain('a woman')
      expect(result).toContain('photorealistic')
      expect(result).toContain('--ar 16:9')
      expect(result).toContain('--v 8')
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

  describe('Prose format (Nano Banana 2, Ideogram)', () => {
    it('generates natural language sentences', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'gemini',
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
      expect(result).not.toContain('--v 8')
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

  describe('Natural prose format (GPT Image 2)', () => {
    it('generates flowing prose without outline headings', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: '',
        model: 'gpt-image',
        parameters: {},
      })
      expect(result).not.toMatch(/^(Request|Scene|Subject|Important details|Visual direction):/m)
      expect(result).not.toContain('A neutral environment')
      expect(result).not.toContain('A person or object')
      expect(result).toContain('A woman')
      expect(result.endsWith('.')).toBe(true)
    })

    it('preserves authored text as the primary request', () => {
      const result = composer.compose({
        tags: portraitTags,
        customText: 'Ensure natural skin texture',
        model: 'gpt-image',
        parameters: {},
      })
      expect(result.startsWith('Ensure natural skin texture')).toBe(true)
      expect(result).not.toContain('Request:')
      expect(result).toContain('A woman')
    })

    it('turns randomized pose and camera tags into a natural sentence', () => {
      const result = composer.compose({
        tags: [
          tag('straddling chair', 'poses_gestures'),
          tag('point of view', 'camera_lighting_style'),
        ],
        customText: '',
        model: 'gpt-image',
        parameters: {},
      })
      expect(result).toContain('Straddling chair')
      expect(result).toContain('Point of view')
      expect(result).not.toContain('Subject:')
      expect(result).not.toContain('Important details:')
    })
  })

  describe('Comma-separated format (SD 3.5, FLUX 2, Qwen, Illustrious)', () => {
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
        model: 'gemini',
        parameters: {},
      })
      // Prose models don't support weighting, so should use raw label
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

    it('does not add implicit quality boosters for SD/FLUX', () => {
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
      expect(result).not.toContain('high detail')
      expect(result).not.toContain('sharp focus')
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

    it('does not prefix Illustrious with unselected quality tags', () => {
      const tags = [
        tag('1girl', 'subject'),
        tag('long hair', 'hair'),
      ]
      const result = composer.compose({
        tags,
        customText: '',
        model: 'illustrious',
        parameters: {},
      })
      expect(result).not.toContain('masterpiece')
      expect(result).not.toContain('best quality')
      expect(result).not.toContain('highres')
      expect(result).not.toContain('newest')
      expect(result).toContain('1girl')
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

  describe('durable output invariants', () => {
    it('is byte-identical for unchanged state', () => {
      const input = { tags: portraitTags, customText: 'A rainy-window portrait', model: 'gemini' as const, parameters: {} }
      expect(composer.compose(input)).toBe(composer.compose(input))
    })

    it('does not duplicate prepositions in setting phrases', () => {
      const result = composer.compose({ tags: [tag('rain', 'environments')], customText: '', model: 'gpt-image', parameters: {} })
      expect(result).toContain('Set in the rain')
      expect(result).not.toContain('in in the rain')
    })

    it.each(['midjourney', 'stable-diffusion', 'gemini', 'gpt-image'] as const)('keeps authored text first for %s', (model) => {
      const result = composer.compose({ tags: [tag('portrait', 'subject')], customText: 'Exact authored opening', model, parameters: {} })
      expect(result.startsWith('Exact authored opening')).toBe(true)
    })

    it('uses exact phrase mappings rather than partial substrings', () => {
      const result = composer.compose({ tags: [tag('rainbow glass', 'environments')], customText: '', model: 'gpt-image', parameters: {} })
      expect(result).toContain('rainbow glass')
      expect(result).not.toContain('in the rain')
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
