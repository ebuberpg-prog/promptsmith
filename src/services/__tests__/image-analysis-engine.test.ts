import { describe, expect, it } from 'vitest'
import { extractDominantPalette, parseImageAnalysisResponse, renderAnalysisPrompt, updateAnalysisObservation } from '../image-analysis-engine'
import type { ImageAnalysis, PaletteSwatch } from '@/types'

const palette: PaletteSwatch[] = [
  { hex: '#F0E6D2', prominence: 0.7, name: 'warm ivory', role: 'dominant', included: true },
  { hex: '#312A25', prominence: 0.3, name: 'charcoal brown', role: 'deepest', included: true },
]

const analysis: ImageAnalysis = {
  schemaVersion: 2,
  literalDescription: 'A glass vessel rests on folded paper.',
  creativeRead: 'A restrained material study built through quiet contrast.',
  selectedIntent: 'recreate',
  observations: [
    { id: 'subject', dimension: 'subject', text: 'a translucent glass vessel', evidence: 'observed', scope: 'scene', included: true },
    { id: 'composition', dimension: 'composition', text: 'centered close crop with negative space', evidence: 'observed', scope: 'both', included: true },
    { id: 'lighting', dimension: 'lighting', text: 'large diffused side light', evidence: 'inferred', scope: 'direction', included: true },
  ],
  palette,
  provenance: { provider: 'ollama', model: 'gemma3:4b', analyzedAt: 1 },
}

describe('image analysis engine', () => {
  it('extracts a deterministic local palette and ignores transparent pixels', () => {
    const pixels = new Uint8ClampedArray([
      240, 230, 210, 255, 240, 230, 210, 255,
      50, 40, 35, 255, 255, 0, 0, 0,
    ])
    const imageData = { width: 2, height: 2, data: pixels } as ImageData
    const first = extractDominantPalette(imageData, 6)
    expect(extractDominantPalette(imageData, 6)).toEqual(first)
    expect(first).toHaveLength(2)
    expect(first.reduce((sum, swatch) => sum + swatch.prominence, 0)).toBeCloseTo(1, 3)
    expect(first[0].hex).toBe('#F0E6D2')
  })

  it('parses a structured study while preserving exact locally extracted colors', () => {
    const result = parseImageAnalysisResponse(JSON.stringify({
      literalDescription: 'A glass vessel on paper.',
      creativeRead: 'A quiet editorial material study.',
      observations: [
        { dimension: 'subject', text: 'translucent glass vessel', evidence: 'observed', scope: 'scene' },
        { dimension: 'lighting', text: 'soft directional window light', evidence: 'inferred', scope: 'direction' },
      ],
      palette: [
        { hex: '#F0E6D2', name: 'paper ivory', role: 'ground' },
        { hex: '#312A25', name: 'smoked umber', role: 'deepest' },
      ],
      suggestedTags: ['glass', 'editorial still life'],
    }), palette, { provider: 'ollama', model: 'gemma3:4b', analyzedAt: 4 })
    expect(result.analysis.palette.map((swatch) => swatch.hex)).toEqual(['#F0E6D2', '#312A25'])
    expect(result.analysis.palette[0].name).toBe('paper ivory')
    expect(result.suggestedTags).toEqual(['glass', 'editorial still life'])
  })

  it('rejects unknown dimensions and model-invented palette colors', () => {
    const base = {
      literalDescription: 'Visible facts.', creativeRead: 'Creative direction.',
      observations: [{ dimension: 'subject', text: 'a vessel', evidence: 'observed', scope: 'scene' }],
      palette: [], suggestedTags: [],
    }
    const provenance = { provider: 'ollama' as const, model: 'vision', analyzedAt: 1 }
    expect(() => parseImageAnalysisResponse(JSON.stringify({ ...base, observations: [{ dimension: 'identity', text: 'unknown person' }] }), palette, provenance)).toThrow(/unsupported visual dimension/i)
    expect(() => parseImageAnalysisResponse(JSON.stringify({ ...base, palette: [{ hex: '#FF00FF', name: 'invented', role: 'accent' }] }), palette, provenance)).toThrow(/changed an extracted palette color/i)
  })

  it('renders stable generator-neutral prompts and removes scene details in art-direction mode', () => {
    const recreate = renderAnalysisPrompt(analysis, 'recreate', 'natural-language')
    const direction = renderAnalysisPrompt(analysis, 'art-direction', 'natural-language')
    const tags = renderAnalysisPrompt(analysis, 'recreate', 'tag-list')
    expect(recreate.indexOf('translucent glass vessel')).toBeLessThan(recreate.indexOf('Composition and camera'))
    expect(direction).not.toContain('glass vessel')
    expect(direction).toContain('diffused side light')
    expect(tags).toBe('a translucent glass vessel, centered close crop with negative space, large diffused side light, warm ivory, charcoal brown')
    expect(tags).not.toMatch(/--|\d+k|masterpiece/i)
  })

  it('updates ledger observations without mutating the source analysis', () => {
    const updated = updateAnalysisObservation(analysis, 'lighting', { text: 'hard noon light', included: false })
    expect(updated.observations.find((item) => item.id === 'lighting')).toMatchObject({ text: 'hard noon light', included: false })
    expect(analysis.observations.find((item) => item.id === 'lighting')).toMatchObject({ text: 'large diffused side light', included: true })
    expect(renderAnalysisPrompt(updated, 'recreate', 'tag-list')).not.toContain('hard noon light')
  })
})
