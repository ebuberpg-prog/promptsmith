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

  it('preserves a small chromatic accent when tonal background variations fill the image', () => {
    const pixels: number[] = []
    for (const grey of [240, 205, 170, 135, 100, 65]) {
      for (let index = 0; index < 100; index += 1) pixels.push(grey, grey, grey, 255)
    }
    for (let index = 0; index < 20; index += 1) pixels.push(255, 0, 0, 255)

    const result = extractDominantPalette({ width: 31, height: 20, data: new Uint8ClampedArray(pixels) } as ImageData, 6)

    expect(result.some((swatch) => {
      const red = Number.parseInt(swatch.hex.slice(1, 3), 16)
      const green = Number.parseInt(swatch.hex.slice(3, 5), 16)
      const blue = Number.parseInt(swatch.hex.slice(5, 7), 16)
      return red > 220 && green < 60 && blue < 60
    })).toBe(true)
    expect(result.reduce((sum, swatch) => sum + swatch.prominence, 0)).toBeCloseTo(1, 4)
  })

  it('measures prominence against every opaque pixel rather than selected buckets', () => {
    const pixels: number[] = []
    for (const [grey, count] of [[240, 100], [232, 100], [0, 20]] as const) {
      for (let index = 0; index < count; index += 1) pixels.push(grey, grey, grey, 255)
    }

    const result = extractDominantPalette({ width: 22, height: 10, data: new Uint8ClampedArray(pixels) } as ImageData, 6)
    const darkest = result.reduce((best, swatch) => Number.parseInt(swatch.hex.slice(1), 16) < Number.parseInt(best.hex.slice(1), 16) ? swatch : best)

    expect(result).toHaveLength(2)
    expect(darkest.prominence).toBeCloseTo(20 / 220, 4)
  })

  it('retains a saturated detail across a continuous tonal field', () => {
    const width = 128
    const height = 64
    const pixels = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4
        const grey = 40 + Math.round(x / (width - 1) * 190)
        const accent = x >= 60 && x < 68 && y >= 28 && y < 36
        pixels[index] = accent ? 20 : grey
        pixels[index + 1] = accent ? 90 : grey
        pixels[index + 2] = accent ? 245 : grey
        pixels[index + 3] = 255
      }
    }

    const result = extractDominantPalette({ width, height, data: pixels } as ImageData, 6)

    expect(result.some((swatch) => {
      const blue = Number.parseInt(swatch.hex.slice(5, 7), 16)
      const red = Number.parseInt(swatch.hex.slice(1, 3), 16)
      return blue - red > 100
    })).toBe(true)
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
