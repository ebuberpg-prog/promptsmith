import { describe, it, expect } from 'vitest'
import { PromptDiffEngine } from '@/services/prompt-diff-engine'
import type { SelectedTag } from '@/types'

function tag(label: string, category?: string, customWeight?: number, triggerWords?: string[]): SelectedTag {
  return {
    id: `id-${label}-${category ?? 'none'}`,
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

describe('PromptDiffEngine', () => {
  const engine = new PromptDiffEngine()

  describe('compare', () => {
    it('detects added tags', () => {
      const tagsA = [tag('portrait', 'subject')]
      const tagsB = [tag('portrait', 'subject'), tag('cinematic', 'camera_lighting_style')]
      const result = engine.compare(tagsA, '', tagsB, '')

      const added = result.segments.filter(s => s.type === 'added')
      expect(added.length).toBe(1)
      expect(added[0].content).toBe('cinematic')
    })

    it('detects removed tags', () => {
      const tagsA = [tag('portrait', 'subject'), tag('cinematic', 'camera_lighting_style')]
      const tagsB = [tag('portrait', 'subject')]
      const result = engine.compare(tagsA, '', tagsB, '')

      const removed = result.segments.filter(s => s.type === 'removed')
      expect(removed.length).toBe(1)
      expect(removed[0].content).toBe('cinematic')
    })

    it('detects modified tags (weight change)', () => {
      const id = 'id-portrait-subject'
      const tagsA: SelectedTag[] = [{
        id, label: 'portrait', aliases: [], description: '', explicit: false,
        weight: 1.0, category: 'subject', selectedAt: Date.now(), customWeight: 1.0,
      }]
      const tagsB: SelectedTag[] = [{
        id, label: 'portrait', aliases: [], description: '', explicit: false,
        weight: 1.0, category: 'subject', selectedAt: Date.now(), customWeight: 1.5,
      }]
      const result = engine.compare(tagsA, '', tagsB, '')

      const modified = result.segments.filter(s => s.type === 'modified')
      expect(modified.length).toBe(1)
      expect(modified[0].description).toContain('weight')
    })

    it('detects no changes', () => {
      const tags = [tag('portrait', 'subject')]
      const result = engine.compare(tags, '', tags, '')

      expect(result.segments.length).toBe(0)
      expect(result.summary).toContain('No changes')
    })

    it('computes high similarity for identical tags', () => {
      const tags = [tag('portrait', 'subject'), tag('cinematic', 'camera_lighting_style')]
      const result = engine.compare(tags, '', tags, '')

      expect(result.semanticSimilarity).toBeGreaterThan(0.9)
    })

    it('computes low similarity for completely different tags', () => {
      const tagsA = [tag('portrait', 'subject'), tag('studio', 'camera_lighting_style')]
      const tagsB = [tag('landscape', 'environments'), tag('sunset', 'camera_lighting_style')]
      const result = engine.compare(tagsA, '', tagsB, '')

      expect(result.semanticSimilarity).toBeLessThan(0.8)
    })

    it('assigns critical significance to subject changes', () => {
      const tagsA = [tag('a woman', 'subject')]
      const tagsB = [tag('a man', 'subject')]
      const result = engine.compare(tagsA, '', tagsB, '')

      const added = result.segments.find(s => s.type === 'added')
      const removed = result.segments.find(s => s.type === 'removed')
      expect(added?.significance).toBe('critical')
      expect(removed?.significance).toBe('critical')
    })

    it('assigns low significance to quality tag changes', () => {
      const tagsA = [tag('8k', 'quality')]
      const tagsB = [tag('4k', 'quality')]
      const result = engine.compare(tagsA, '', tagsB, '')

      const segments = result.segments.filter(s => s.type !== 'reordered')
      expect(segments.length).toBeGreaterThan(0)
      for (const s of segments) {
        expect(s.significance).toBe('low')
      }
    })

    it('detects custom text changes', () => {
      const result = engine.compare([], 'text A', [], 'text B')
      expect(result.segments.length).toBeGreaterThan(0)
    })
  })

  describe('compareRaw', () => {
    it('diffs raw prompt strings', () => {
      const result = engine.compareRaw(
        'portrait, cinematic, golden hour',
        'portrait, cinematic, sunset'
      )
      expect(result.segments.some(s => s.content === 'golden hour')).toBe(true)
      expect(result.segments.some(s => s.content === 'sunset')).toBe(true)
    })

    it('handles identical raw prompts', () => {
      const result = engine.compareRaw('portrait, cinematic', 'portrait, cinematic')
      expect(result.segments.length).toBe(0)
    })
  })

  describe('overall significance', () => {
    it('is critical when critical changes exist', () => {
      const tagsA = [tag('a woman', 'subject')]
      const tagsB = [tag('a man', 'subject'), tag('cinematic', 'camera_lighting_style')]
      const result = engine.compare(tagsA, '', tagsB, '')
      expect(result.overallSignificance).toBe('critical')
    })

    it('is low when only minor changes exist', () => {
      const tagsA = [tag('8k', 'quality')]
      const tagsB = [tag('4k', 'quality')]
      const result = engine.compare(tagsA, '', tagsB, '')
      expect(result.overallSignificance).toBe('low')
    })
  })
})