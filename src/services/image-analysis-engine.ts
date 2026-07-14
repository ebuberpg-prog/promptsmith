import type {
  AnalysisIntent,
  ImageAnalysis,
  LocalAIProviderId,
  PaletteSwatch,
  VisualDimension,
  VisualObservation,
} from '@/types'

const DIMENSIONS: VisualDimension[] = [
  'subject', 'setting', 'composition', 'camera', 'lighting', 'color', 'medium',
  'material', 'texture', 'mood', 'era', 'typography', 'motion',
]

const DIMENSION_SET = new Set<string>(DIMENSIONS)
const DIMENSION_ORDER = new Map(DIMENSIONS.map((dimension, index) => [dimension, index]))
const ROLE_SET = new Set<PaletteSwatch['role']>(['ground', 'dominant', 'support', 'accent', 'deepest'])

export interface ParsedImageAnalysis {
  analysis: ImageAnalysis
  suggestedTags: string[]
}

export function extractDominantPalette(imageData: ImageData, maximum = 6): PaletteSwatch[] {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>()
  const pixels = imageData.data
  const stride = Math.max(1, Math.floor((imageData.width * imageData.height) / 24_000))

  for (let pixel = 0; pixel < imageData.width * imageData.height; pixel += stride) {
    const index = pixel * 4
    if (pixels[index + 3] < 128) continue
    const r = pixels[index]
    const g = pixels[index + 1]
    const b = pixels[index + 2]
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
    bucket.count += 1
    bucket.r += r
    bucket.g += g
    bucket.b += b
    buckets.set(key, bucket)
  }

  const candidates = [...buckets.values()]
    .map((bucket) => ({
      count: bucket.count,
      r: Math.round(bucket.r / bucket.count),
      g: Math.round(bucket.g / bucket.count),
      b: Math.round(bucket.b / bucket.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 160)

  if (candidates.length === 0) return []

  const selected: typeof candidates = []
  for (const candidate of candidates) {
    const nearest = selected.reduce((distance, item) => Math.min(distance, colorDistance(candidate, item)), Number.POSITIVE_INFINITY)
    if (selected.length === 0 || nearest >= 28) selected.push(candidate)
    if (selected.length >= Math.max(1, Math.min(8, maximum))) break
  }

  const total = selected.reduce((sum, color) => sum + color.count, 0)
  const roles = assignPaletteRoles(selected)
  return selected.map((color, index) => {
    const hex = rgbToHex(color.r, color.g, color.b)
    return {
      hex,
      prominence: Number((color.count / total).toFixed(4)),
      name: describeColor(color.r, color.g, color.b),
      role: roles[index],
      included: true,
    }
  })
}

export async function extractPaletteFromDataUrl(dataUrl: string, maximum = 6): Promise<PaletteSwatch[]> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('This browser could not inspect the image palette.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return extractDominantPalette(context.getImageData(0, 0, canvas.width, canvas.height), maximum)
  } finally {
    bitmap.close()
  }
}

export function parseImageAnalysisResponse(
  value: string,
  palette: PaletteSwatch[],
  provenance: { provider: LocalAIProviderId; model: string; analyzedAt: number },
): ParsedImageAnalysis {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripFences(value))
  } catch {
    throw new Error('The vision model returned an unreadable analysis. Try again with a stronger vision model.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('The vision model returned an invalid analysis object.')
  const record = parsed as Record<string, unknown>
  const literalDescription = cleanText(record.literalDescription, 1_400)
  const creativeRead = cleanText(record.creativeRead, 1_400)
  if (!literalDescription || !creativeRead) throw new Error('The vision model omitted the literal or creative description.')
  if (!Array.isArray(record.observations) || record.observations.length === 0) throw new Error('The vision model did not return a visual anatomy.')

  const observations: VisualObservation[] = record.observations.slice(0, 24).map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('The vision model returned a malformed visual observation.')
    const item = entry as Record<string, unknown>
    const dimension = String(item.dimension ?? '')
    if (!DIMENSION_SET.has(dimension)) throw new Error(`The vision model returned an unsupported visual dimension: ${dimension || 'unknown'}.`)
    const text = cleanText(item.text, 280)
    if (!text) throw new Error('The vision model returned an empty visual observation.')
    const evidence = item.evidence === 'inferred' ? 'inferred' : 'observed'
    const scope = item.scope === 'scene' || item.scope === 'direction' || item.scope === 'both' ? item.scope : 'both'
    return { id: `analysis:${dimension}:${index}`, dimension: dimension as VisualDimension, text, evidence, scope, included: true }
  })

  const paletteLabels = Array.isArray(record.palette) ? record.palette : []
  const allowedHex = new Set(palette.map((swatch) => swatch.hex.toUpperCase()))
  const labels = new Map<string, { name?: string; role?: PaletteSwatch['role'] }>()
  for (const entry of paletteLabels) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const item = entry as Record<string, unknown>
    const hex = String(item.hex ?? '').toUpperCase()
    if (!allowedHex.has(hex)) throw new Error('The vision model changed an extracted palette color. The analysis was not saved.')
    const role = ROLE_SET.has(item.role as PaletteSwatch['role']) ? item.role as PaletteSwatch['role'] : undefined
    labels.set(hex, { name: cleanText(item.name, 48) || undefined, role })
  }

  const suggestedTags = Array.isArray(record.suggestedTags)
    ? unique(record.suggestedTags.map((tag) => cleanText(tag, 72)).filter(Boolean)).slice(0, 20)
    : []

  return {
    analysis: {
      schemaVersion: 2,
      literalDescription,
      creativeRead,
      selectedIntent: 'recreate',
      observations,
      palette: palette.map((swatch) => ({
        ...swatch,
        name: labels.get(swatch.hex.toUpperCase())?.name ?? swatch.name,
        role: labels.get(swatch.hex.toUpperCase())?.role ?? swatch.role,
      })),
      provenance,
    },
    suggestedTags,
  }
}

export function renderAnalysisPrompt(analysis: ImageAnalysis, intent: AnalysisIntent, format: 'natural-language' | 'tag-list') {
  const observations = analysis.observations
    .filter((item) => item.included && (intent === 'recreate' || item.scope !== 'scene'))
    .sort((a, b) => (DIMENSION_ORDER.get(a.dimension) ?? 99) - (DIMENSION_ORDER.get(b.dimension) ?? 99))
  const palette = analysis.palette.filter((swatch) => swatch.included)

  if (format === 'tag-list') {
    const tags = observations.map((item) => item.text)
    if (palette.length) tags.push(...palette.map((swatch) => swatch.name))
    return unique(tags.map(trimTerminalPunctuation).filter(Boolean)).join(', ')
  }

  const grouped = new Map<VisualDimension, string[]>()
  observations.forEach((item) => grouped.set(item.dimension, [...(grouped.get(item.dimension) ?? []), trimTerminalPunctuation(item.text)]))
  const sentences: string[] = []
  const subject = grouped.get('subject') ?? []
  const setting = grouped.get('setting') ?? []
  if (intent === 'recreate' && (subject.length || setting.length)) sentences.push(sentence([...subject, ...setting].join(', ')))
  const add = (label: string, dimensions: VisualDimension[]) => {
    const values = dimensions.flatMap((dimension) => grouped.get(dimension) ?? [])
    if (values.length) sentences.push(sentence(`${label}: ${values.join(', ')}`))
  }
  add('Composition and camera', ['composition', 'camera'])
  add('Lighting', ['lighting'])
  const colorValues = grouped.get('color') ?? []
  if (palette.length) colorValues.push(...palette.map((swatch) => `${swatch.name} (${swatch.hex})`))
  if (colorValues.length) sentences.push(sentence(`Color palette: ${unique(colorValues).join(', ')}`))
  add('Medium, material, and texture', ['medium', 'material', 'texture'])
  add('Mood and finish', ['mood', 'era', 'typography', 'motion'])
  const body = sentences.join(' ')
  return intent === 'art-direction' && body ? `Create an image using this transferable art direction. ${body}` : body
}

export function updateAnalysisObservation(analysis: ImageAnalysis, id: string, updates: Partial<Pick<VisualObservation, 'text' | 'included'>>) {
  return { ...analysis, observations: analysis.observations.map((item) => item.id === id ? { ...item, ...updates } : item) }
}

function assignPaletteRoles(colors: Array<{ r: number; g: number; b: number; count: number }>): PaletteSwatch['role'][] {
  const roles = colors.map(() => 'support' as PaletteSwatch['role'])
  if (colors.length === 0) return roles
  roles[0] = 'dominant'
  if (colors.length > 1) roles[1] = 'ground'
  if (colors.length > 2) roles[colors.length - 1] = 'accent'
  const darkest = colors.reduce((best, color, index) => luminance(color) < luminance(colors[best]) ? index : best, 0)
  if (darkest !== 0) roles[darkest] = 'deepest'
  return roles
}

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function luminance(color: { r: number; g: number; b: number }) {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function describeColor(r: number, g: number, b: number) {
  const maximum = Math.max(r, g, b)
  const minimum = Math.min(r, g, b)
  const lightness = (maximum + minimum) / 510
  const delta = maximum - minimum
  if (delta < 18) return lightness > 0.82 ? 'soft white' : lightness > 0.58 ? 'warm grey' : lightness > 0.28 ? 'graphite grey' : 'charcoal'
  const hue = maximum === r ? ((g - b) / delta + (g < b ? 6 : 0)) * 60 : maximum === g ? ((b - r) / delta + 2) * 60 : ((r - g) / delta + 4) * 60
  const family = hue < 18 || hue >= 345 ? 'red' : hue < 45 ? 'amber' : hue < 70 ? 'yellow' : hue < 165 ? 'green' : hue < 200 ? 'cyan' : hue < 255 ? 'blue' : hue < 290 ? 'violet' : hue < 345 ? 'magenta' : 'red'
  const tone = lightness > 0.76 ? 'pale' : lightness < 0.28 ? 'deep' : lightness < 0.45 ? 'dark' : 'muted'
  return `${tone} ${family}`
}

function stripFences(value: string) { return value.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim() }
function cleanText(value: unknown, maximum: number) { return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maximum) : '' }
function trimTerminalPunctuation(value: string) { return value.trim().replace(/[.,;:]+$/, '') }
function sentence(value: string) { const trimmed = value.trim(); return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).replace(/[.]+$/, '')}.` : '' }
function unique(values: string[]) { const seen = new Set<string>(); return values.filter((value) => { const key = value.toLocaleLowerCase(); if (!value || seen.has(key)) return false; seen.add(key); return true }) }
