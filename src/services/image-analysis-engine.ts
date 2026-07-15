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

interface PerceptualColor {
  count: number
  edgeCount: number
  r: number
  g: number
  b: number
  lab: { l: number; a: number; b: number }
}

export function extractDominantPalette(imageData: ImageData, maximum = 6): PaletteSwatch[] {
  const buckets = new Map<number, { count: number; edgeCount: number; r: number; g: number; b: number }>()
  const pixels = imageData.data
  const edgeX = Math.max(1, Math.round(imageData.width * 0.08))
  const edgeY = Math.max(1, Math.round(imageData.height * 0.08))

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const index = (y * imageData.width + x) * 4
      if (pixels[index + 3] < 128) continue
      const r = pixels[index]
      const g = pixels[index + 1]
      const b = pixels[index + 2]
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
      const bucket = buckets.get(key) ?? { count: 0, edgeCount: 0, r: 0, g: 0, b: 0 }
      bucket.count += 1
      if (x < edgeX || x >= imageData.width - edgeX || y < edgeY || y >= imageData.height - edgeY) bucket.edgeCount += 1
      bucket.r += r
      bucket.g += g
      bucket.b += b
      buckets.set(key, bucket)
    }
  }

  const candidates: PerceptualColor[] = [...buckets.values()]
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count)
      const g = Math.round(bucket.g / bucket.count)
      const b = Math.round(bucket.b / bucket.count)
      return {
        count: bucket.count,
        edgeCount: bucket.edgeCount,
        r,
        g,
        b,
        lab: rgbToOklab(r, g, b),
      }
    })
    .sort((a, b) => b.count - a.count)

  if (candidates.length === 0) return []
  const total = candidates.reduce((sum, color) => sum + color.count, 0)
  const selected = clusterPalette(candidates, Math.max(1, Math.min(8, maximum)), total)
    .filter((color) => color.count > 0)
    .sort((a, b) => b.count - a.count)
  const prominence = normalizedProminence(selected.map((color) => color.count), total)
  const roles = assignPaletteRoles(selected, total)
  return selected.map((color, index) => {
    const hex = rgbToHex(color.r, color.g, color.b)
    return {
      hex,
      prominence: prominence[index],
      name: describeColor(color.r, color.g, color.b),
      role: roles[index],
      included: true,
    }
  })
}

export async function extractPaletteFromDataUrl(dataUrl: string, maximum = 6): Promise<PaletteSwatch[]> {
  return extractDominantPalette(await imageDataFromDataUrl(dataUrl, 384), maximum)
}

export async function addSampledColorToPalette(
  dataUrl: string,
  palette: PaletteSwatch[],
  hex: string,
  maximum = 8,
): Promise<{ palette: PaletteSwatch[]; status: 'added' | 'existing' | 'full' }> {
  const rgb = hexToRgb(hex)
  if (!rgb) return { palette, status: 'existing' }
  const sampledLab = rgbToOklab(rgb.r, rgb.g, rgb.b)
  if (palette.some((swatch) => {
    const color = hexToRgb(swatch.hex)
    return color ? perceptualDistance(sampledLab, rgbToOklab(color.r, color.g, color.b)) < 0.025 : false
  })) return { palette, status: 'existing' }
  if (palette.length >= maximum) return { palette, status: 'full' }

  const next = [...palette, {
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    prominence: 0,
    name: describeColor(rgb.r, rgb.g, rgb.b),
    role: 'accent' as const,
    included: true,
  }]
  const imageData = await imageDataFromDataUrl(dataUrl, 512)
  const counts = measureFixedPalette(imageData, next)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const prominence = normalizedProminence(counts, total)
  return {
    palette: next.map((swatch, index) => ({ ...swatch, prominence: prominence[index] })),
    status: 'added',
  }
}

async function imageDataFromDataUrl(dataUrl: string, maximumDimension: number) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, maximumDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('This browser could not inspect the image palette.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return context.getImageData(0, 0, canvas.width, canvas.height)
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

function clusterPalette(candidates: PerceptualColor[], maximum: number, total: number) {
  const globalLab = weightedLab(candidates)
  const seeds: PerceptualColor[] = [{ ...candidates[0], lab: { ...candidates[0].lab } }]
  if (maximum > 1) {
    const minimumAccentCount = Math.max(2, Math.round(total * 0.0015))
    const accent = candidates
      .filter((candidate) => candidate.count >= minimumAccentCount && perceptualDistance(candidate.lab, seeds[0].lab) >= 0.04)
      .reduce<PerceptualColor | null>((best, candidate) => accentSeedScore(candidate, globalLab, total) > (best ? accentSeedScore(best, globalLab, total) : -1) ? candidate : best, null)
    if (accent) seeds.push({ ...accent, lab: { ...accent.lab } })
  }

  while (seeds.length < maximum) {
    const candidate = candidates.reduce<{ color: PerceptualColor | null; score: number }>((best, color) => {
      const nearest = seeds.reduce((distance, seed) => Math.min(distance, perceptualDistance(color.lab, seed.lab)), Number.POSITIVE_INFINITY)
      if (nearest < 0.035) return best
      const chroma = Math.min(1, Math.hypot(color.lab.a, color.lab.b) / 0.24)
      const contrast = Math.min(1, perceptualDistance(color.lab, globalLab) / 0.38)
      const score = Math.pow(color.count / total, 0.42) * Math.pow(nearest, 1.25) * (1 + chroma * 0.45 + contrast * 0.15)
      return score > best.score ? { color, score } : best
    }, { color: null, score: -1 }).color
    if (!candidate) break
    seeds.push({ ...candidate, lab: { ...candidate.lab } })
  }

  let clusters = seeds
  for (let iteration = 0; iteration < 6; iteration += 1) {
    const sums = clusters.map(() => ({ count: 0, edgeCount: 0, r: 0, g: 0, b: 0 }))
    const clusterLabs = clusters.map((cluster) => cluster.lab)
    for (const candidate of candidates) {
      const index = nearestColorIndex(candidate.lab, clusterLabs)
      const sum = sums[index]
      sum.count += candidate.count
      sum.edgeCount += candidate.edgeCount
      sum.r += candidate.r * candidate.count
      sum.g += candidate.g * candidate.count
      sum.b += candidate.b * candidate.count
    }
    clusters = sums.flatMap((sum) => {
      if (sum.count === 0) return []
      const r = Math.round(sum.r / sum.count)
      const g = Math.round(sum.g / sum.count)
      const b = Math.round(sum.b / sum.count)
      return [{ count: sum.count, edgeCount: sum.edgeCount, r, g, b, lab: rgbToOklab(r, g, b) }]
    })
    if (clusters.length === 0) return seeds
  }
  return clusters
}

function accentSeedScore(color: PerceptualColor, globalLab: PerceptualColor['lab'], total: number) {
  const chroma = Math.min(1, Math.hypot(color.lab.a, color.lab.b) / 0.24)
  const contrast = Math.min(1, perceptualDistance(color.lab, globalLab) / 0.38)
  return Math.pow(color.count / total, 0.35) * (0.18 + chroma) * (0.3 + contrast)
}

function weightedLab(colors: PerceptualColor[]) {
  const total = colors.reduce((sum, color) => sum + color.count, 0)
  return colors.reduce((sum, color) => ({
    l: sum.l + color.lab.l * color.count / total,
    a: sum.a + color.lab.a * color.count / total,
    b: sum.b + color.lab.b * color.count / total,
  }), { l: 0, a: 0, b: 0 })
}

function assignPaletteRoles(colors: PerceptualColor[], total: number): PaletteSwatch['role'][] {
  const roles = colors.map(() => 'support' as PaletteSwatch['role'])
  if (colors.length === 0) return roles
  roles[0] = 'dominant'
  if (colors.length > 1) {
    const ground = colors.reduce((best, color, index) => index > 0 && color.edgeCount > colors[best].edgeCount ? index : best, 1)
    roles[ground] = 'ground'
  }
  const available = () => roles.map((role, index) => role === 'support' ? index : -1).filter((index) => index >= 0)
  const globalLab = weightedLab(colors)
  const accent = available().reduce((best, index) => {
    const color = colors[index]
    const chroma = Math.hypot(color.lab.a, color.lab.b)
    const rarity = 1 - Math.min(1, color.count / total)
    const score = chroma * 0.7 + perceptualDistance(color.lab, globalLab) * 0.2 + rarity * 0.1
    return score > best.score ? { index, score } : best
  }, { index: -1, score: -1 }).index
  if (accent >= 0) roles[accent] = 'accent'
  const darkest = available().reduce((best, index) => best < 0 || luminance(colors[index]) < luminance(colors[best]) ? index : best, -1)
  if (darkest >= 0) roles[darkest] = 'deepest'
  return roles
}

function measureFixedPalette(imageData: ImageData, palette: PaletteSwatch[]) {
  const labs = palette.map((swatch) => {
    const color = hexToRgb(swatch.hex) ?? { r: 0, g: 0, b: 0 }
    return rgbToOklab(color.r, color.g, color.b)
  })
  const counts = palette.map(() => 0)
  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] < 128) continue
    const lab = rgbToOklab(imageData.data[index], imageData.data[index + 1], imageData.data[index + 2])
    counts[nearestColorIndex(lab, labs)] += 1
  }
  return counts
}

function nearestColorIndex(color: PerceptualColor['lab'], palette: PerceptualColor['lab'][]) {
  return palette.reduce((best, candidate, index) => perceptualDistance(color, candidate) < perceptualDistance(color, palette[best]) ? index : best, 0)
}

function perceptualDistance(a: PerceptualColor['lab'], b: PerceptualColor['lab']) {
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b)
}

function normalizedProminence(counts: number[], total: number) {
  if (total <= 0 || counts.length === 0) return counts.map(() => 0)
  const values = counts.map((count) => Number((count / total).toFixed(4)))
  const difference = Number((1 - values.reduce((sum, value) => sum + value, 0)).toFixed(4))
  const largest = counts.reduce((best, count, index) => count > counts[best] ? index : best, 0)
  values[largest] = Number((values[largest] + difference).toFixed(4))
  return values
}

function rgbToOklab(r: number, g: number, b: number) {
  const linear = [r, g, b].map((value) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const l = 0.4122214708 * linear[0] + 0.5363325363 * linear[1] + 0.0514459929 * linear[2]
  const m = 0.2119034982 * linear[0] + 0.6806995451 * linear[1] + 0.1073969566 * linear[2]
  const s = 0.0883024619 * linear[0] + 0.2817188376 * linear[1] + 0.6299787005 * linear[2]
  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)
  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  }
}

function luminance(color: { r: number; g: number; b: number }) {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function hexToRgb(hex: string) {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim())
  return match ? { r: Number.parseInt(match[1], 16), g: Number.parseInt(match[2], 16), b: Number.parseInt(match[3], 16) } : null
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
