import { beforeEach, describe, expect, it } from 'vitest'
import { analyzeComposerInput } from '../composer-analysis'
import { addTagsToIndex, findTagsInText, resetTagIndex } from '@/utils/tag-index'

describe('analyzeComposerInput', () => {
  beforeEach(() => {
    resetTagIndex()
    addTagsToIndex([
      { id: 'portrait', label: 'portrait', aliases: ['person'], description: 'A portrait subject', explicit: false, weight: 1, category: 'character' },
      { id: 'golden-hour', label: 'golden hour', aliases: ['sunset light'], description: 'Warm low sunlight', explicit: false, weight: 1, category: 'camera_lighting_style', subcategory: 'lighting' },
      { id: 'mature-study', label: 'mature figure study', aliases: ['figure study'], description: 'Mature anatomy reference', explicit: true, weight: 1, category: 'character_anatomy' },
      { id: 'african', label: 'african', aliases: ['black'], description: 'African ethnicity', explicit: false, weight: 1, category: 'character' },
      { id: 'lamp', label: 'lamp', aliases: [], description: 'Lamp', explicit: false, weight: 1, category: 'object' },
    ])
  })

  it('preserves raw input and suggests local matches without selecting them', () => {
    const rawInput = 'A portrait at golden hour'
    const result = analyzeComposerInput(rawInput, 'filtered')
    expect(result.rawInput).toBe(rawInput)
    expect(result.suggestions.map((tag) => tag.id)).toContain('portrait')
    expect(result.suggestions.map((tag) => tag.id)).toContain('golden-hour')
  })

  it('respects discovery visibility without changing the authored text', () => {
    const rawInput = 'mature figure study'
    expect(analyzeComposerInput(rawInput, 'filtered').suggestions).toHaveLength(0)
    expect(analyzeComposerInput(rawInput, 'all').suggestions.map((tag) => tag.id)).toContain('mature-study')
    expect(analyzeComposerInput(rawInput, 'filtered').rawInput).toBe(rawInput)
  })

  it('prioritizes the latest meaningful phrase for live suggestions', () => {
    const result = analyzeComposerInput('A portrait with a calm expression beside a window at golden hour', 'filtered')
    expect(result.suggestions[0]?.id).toBe('golden-hour')
  })

  it('recognizes plainly authored dimensions even without an exact taxonomy label', () => {
    const result = analyzeComposerInput('Asymmetrical still life in an art studio under controlled cinematic light', 'filtered')
    expect(result.presentDimensions).toEqual(expect.arrayContaining(['subject', 'setting', 'lighting', 'composition', 'style']))
    expect(result.missingDimensions).toHaveLength(0)
  })

  it('recognizes exact concepts throughout enhanced prose and prefers the longer phrase', () => {
    addTagsToIndex([{ id: 'light', label: 'light', aliases: [], description: '', explicit: false, weight: 1, category: 'lighting' }])
    const result = findTagsInText('A portrait at golden hour with a quiet expression', 'filtered')
    expect(result.map((item) => item.tag.id)).toContain('golden-hour')
    expect(result.map((item) => item.tag.id)).not.toContain('light')
  })

  it('does not turn an ambiguous single-word alias inside prose into an unrelated ingredient', () => {
    const prose = 'A still life with a lamp black palette'
    expect(analyzeComposerInput(prose, 'filtered').suggestions.map((tag) => tag.id)).not.toEqual(expect.arrayContaining(['african', 'lamp']))
    expect(findTagsInText(prose, 'filtered').map((item) => item.tag.id)).not.toEqual(expect.arrayContaining(['african', 'lamp']))
    expect(analyzeComposerInput('black', 'filtered').suggestions.map((tag) => tag.id)).toContain('african')
  })
})
