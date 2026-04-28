import type { StyleTransferMatrix } from '@/types'

// ─── Style compatibility categories ──────────────────────────────────────────

interface StylePair {
  source: string
  target: string
  compatibility: number // 0.0 - 1.0
  reason: string
}

// ─── Style family definitions ────────────────────────────────────────────────

const STYLE_FAMILIES: Record<string, string[]> = {
  'realistic': ['photorealistic', 'hyperrealistic', 'realistic', 'photographic', 'true-to-life', 'lifelike', 'naturalistic'],
  'painterly': ['oil painting', 'painterly', 'impasto', 'expressive brushstrokes', 'classical'],
  'watermedia': ['watercolor', 'aquarelle', 'gouache', 'ink wash', 'sumi-e'],
  'illustration': ['illustration', 'concept art', 'digital art', 'vector', 'flat design'],
  'anime': ['anime', 'manga', 'cel shading', 'anime style', 'cartoon'],
  'sketch': ['sketch', 'pencil drawing', 'charcoal', 'ink drawing', 'line art'],
  '3d': ['3d render', 'CGI', 'ray tracing', 'octane render', 'unreal engine'],
  'abstract': ['abstract', 'abstract expressionism', 'non-representational', 'geometric abstraction'],
  'vintage': ['vintage', 'retro', 'film grain', 'aged', 'nostalgic', 'sepia', 'light leak'],
  'noir': ['noir', 'film noir', 'high contrast', 'black and white', 'dark shadows'],
}

function getStyleFamily(style: string): string | null {
  const lower = style.toLowerCase()
  for (const [family, members] of Object.entries(STYLE_FAMILIES)) {
    if (members.some(m => lower.includes(m))) return family
    if (lower.includes(family)) return family
  }
  return null
}

// ─── Known good/bad pairings ────────────────────────────────────────────────

const KNOWN_PAIRINGS: StylePair[] = [
  // ─── Excellent pairings (0.8-1.0) ──────────────────────────────────────
  { source: 'photorealistic', target: 'cinematic', compatibility: 0.92, reason: 'Photorealistic rendering excels with cinematic lighting' },
  { source: 'photorealistic', target: 'golden hour', compatibility: 0.90, reason: 'Natural light enhances photorealism' },
  { source: 'photorealistic', target: 'dramatic lighting', compatibility: 0.88, reason: 'Dramatic lighting creates striking realistic images' },
  { source: 'photorealistic', target: 'studio lighting', compatibility: 0.85, reason: 'Controlled lighting pairs well with realism' },
  { source: 'oil painting', target: 'warm lighting', compatibility: 0.90, reason: 'Warm light enhances painterly quality' },
  { source: 'oil painting', target: 'chiaroscuro', compatibility: 0.92, reason: 'Classic chiaroscuro is a natural pairing for oil painting' },
  { source: 'oil painting', target: 'romantic', compatibility: 0.85, reason: 'Oil painting excels at romantic mood' },
  { source: 'oil painting', target: 'dramatic', compatibility: 0.88, reason: 'Oil painting handles dramatic tone well' },
  { source: 'watercolor', target: 'soft lighting', compatibility: 0.93, reason: 'Soft light is ideal for watercolor style' },
  { source: 'watercolor', target: 'dreamy', compatibility: 0.90, reason: 'Dreamy mood pairs naturally with watercolor' },
  { source: 'watercolor', target: 'peaceful', compatibility: 0.88, reason: 'Watercolor conveys peace beautifully' },
  { source: 'anime', target: 'vibrant', compatibility: 0.88, reason: 'Anime style handles vibrant colors well' },
  { source: 'anime', target: 'neon lighting', compatibility: 0.85, reason: 'Neon light is a classic anime aesthetic' },
  { source: 'anime', target: 'dynamic pose', compatibility: 0.90, reason: 'Anime style excels with dynamic poses' },
  { source: 'cinematic', target: 'dramatic lighting', compatibility: 0.95, reason: 'Cinematic style demands dramatic lighting' },
  { source: 'cinematic', target: 'film grain', compatibility: 0.90, reason: 'Film grain authenticates the cinematic look' },
  { source: 'cinematic', target: 'rim lighting', compatibility: 0.88, reason: 'Rim lighting is a cinematic staple' },
  { source: 'noir', target: 'low key', compatibility: 0.95, reason: 'Low key lighting is essential for noir' },
  { source: 'noir', target: 'high contrast', compatibility: 0.92, reason: 'High contrast defines noir aesthetic' },
  { source: 'noir', target: 'shadows', compatibility: 0.90, reason: 'Shadows are central to noir' },
  { source: 'minimalist', target: 'high key', compatibility: 0.85, reason: 'High key lighting complements minimalism' },
  { source: 'minimalist', target: 'clean background', compatibility: 0.92, reason: 'Clean backgrounds are minimalist essential' },
  { source: 'fantasy', target: 'volumetric lighting', compatibility: 0.90, reason: 'Volumetric light creates magical atmosphere' },
  { source: 'fantasy', target: 'ethereal', compatibility: 0.92, reason: 'Ethereal mood pairs naturally with fantasy' },
  { source: 'cyberpunk', target: 'neon lighting', compatibility: 0.95, reason: 'Neon lighting defines cyberpunk aesthetic' },
  { source: 'cyberpunk', target: 'rain', compatibility: 0.85, reason: 'Rain creates reflective surfaces iconic in cyberpunk' },
  { source: 'vintage', target: 'film grain', compatibility: 0.92, reason: 'Film grain authenticates vintage aesthetic' },
  { source: 'vintage', target: 'warm lighting', compatibility: 0.88, reason: 'Warm light enhances vintage nostalgia' },
  { source: 'concept art', target: 'dramatic lighting', compatibility: 0.85, reason: 'Dramatic lighting suits concept art presentation' },
  { source: 'concept art', target: 'epic', compatibility: 0.88, reason: 'Concept art often aims for epic grandeur' },

  // ─── Poor pairings (0.1-0.3) ────────────────────────────────────────────
  { source: 'photorealistic', target: 'cartoon', compatibility: 0.10, reason: 'Cartoon directly conflicts with photorealism' },
  { source: 'photorealistic', target: 'anime', compatibility: 0.12, reason: 'Anime is inherently non-realistic' },
  { source: 'photorealistic', target: 'abstract', compatibility: 0.15, reason: 'Abstract contradicts realistic rendering' },
  { source: 'photorealistic', target: 'pixel art', compatibility: 0.08, reason: 'Pixel art is the opposite of photorealism' },
  { source: 'oil painting', target: 'photorealistic', compatibility: 0.25, reason: 'Oil painting is inherently painterly, not realistic' },
  { source: 'watercolor', target: 'sharp focus', compatibility: 0.20, reason: 'Watercolor relies on soft edges and blurring' },
  { source: 'anime', target: 'photorealistic', compatibility: 0.12, reason: 'Anime style opposes photorealistic rendering' },
  { source: 'anime', target: 'oil painting', compatibility: 0.25, reason: 'Anime and oil painting are stylistically opposed' },
  { source: 'minimalist', target: 'high detail', compatibility: 0.15, reason: 'Minimalism opposes detailed rendering' },
  { source: 'minimalist', target: 'intricate', compatibility: 0.12, reason: 'Intricate detail contradicts minimalism' },
  { source: 'noir', target: 'bright', compatibility: 0.15, reason: 'Bright lighting contradicts noir darkness' },
  { source: 'noir', target: 'cheerful', compatibility: 0.10, reason: 'Cheerful mood contradicts noir tone' },
  { source: 'cyberpunk', target: 'pastoral', compatibility: 0.10, reason: 'Pastoral setting conflicts with cyberpunk aesthetic' },
  { source: '3d render', target: 'watercolor', compatibility: 0.18, reason: '3D rendering opposes watercolor softness' },
  { source: 'sketch', target: 'photorealistic', compatibility: 0.15, reason: 'Sketch and photorealism are opposed' },
  { source: 'abstract', target: 'realistic', compatibility: 0.10, reason: 'Abstract and realistic are fundamentally opposed' },

  // ─── Moderate pairings (0.4-0.6) ────────────────────────────────────────
  { source: 'oil painting', target: 'neon lighting', compatibility: 0.45, reason: 'Neon lighting is possible but unusual in oil painting' },
  { source: 'watercolor', target: 'dramatic lighting', compatibility: 0.40, reason: 'Dramatic lighting is possible but unusual in watercolor' },
  { source: 'anime', target: 'natural light', compatibility: 0.55, reason: 'Natural light works but isn\'t the anime default' },
  { source: 'concept art', target: 'peaceful', compatibility: 0.50, reason: 'Concept art can be peaceful but is often dramatic' },
  { source: 'cinematic', target: 'soft lighting', compatibility: 0.45, reason: 'Soft lighting is possible but less dramatic for cinema' },
]

// ─── Lighting-environment compatibility ───────────────────────────────────────

const LIGHTING_ENV_PAIRINGS: StylePair[] = [
  { source: 'golden hour', target: 'outdoor', compatibility: 0.95, reason: 'Golden hour is an outdoor phenomenon' },
  { source: 'golden hour', target: 'studio', compatibility: 0.20, reason: 'Golden hour light rarely found in studio' },
  { source: 'studio lighting', target: 'studio', compatibility: 0.92, reason: 'Studio lighting is designed for studio environments' },
  { source: 'neon lighting', target: 'city street', compatibility: 0.93, reason: 'Neon lighting defines urban night scenes' },
  { source: 'neon lighting', target: 'forest', compatibility: 0.15, reason: 'Neon lighting is very unusual in natural settings' },
  { source: 'natural light', target: 'forest', compatibility: 0.90, reason: 'Natural light is ideal for forest scenes' },
  { source: 'natural light', target: 'beach', compatibility: 0.92, reason: 'Natural light is ideal for beach scenes' },
  { source: 'volumetric lighting', target: 'forest', compatibility: 0.88, reason: 'Volumetric light through trees is iconic' },
  { source: 'volumetric lighting', target: 'cathedral', compatibility: 0.85, reason: 'Volumetric light in cathedrals is classic' },
  { source: 'candlelight', target: 'interior', compatibility: 0.88, reason: 'Candlelight belongs in interior scenes' },
  { source: 'candlelight', target: 'beach', compatibility: 0.15, reason: 'Candlelight on a beach is very unusual' },
]

// ─── Core Engine ─────────────────────────────────────────────────────────────

export class StyleCompatEngine {
  /**
   * Analyze style transfer compatibility between source and target style lists.
   */
  analyzeCompatibility(
    sourceStyles: string[],
    targetStyles: string[]
  ): StyleTransferMatrix {
    const scores: number[][] = []

    for (const source of sourceStyles) {
      const row: number[] = []
      for (const target of targetStyles) {
        row.push(this.getCompatibilityScore(source, target))
      }
      scores.push(row)
    }

    return {
      id: crypto.randomUUID(),
      name: 'Style Transfer',
      sourceStyles,
      targetStyles,
      compatibilityScores: scores,
    }
  }

  /**
   * Get compatibility score between two styles.
   */
  getCompatibilityScore(source: string, target: string): number {
    const sourceLower = source.toLowerCase()
    const targetLower = target.toLowerCase()

    // Self-compatibility is 1.0
    if (sourceLower === targetLower) return 1.0

    // Same style family — high compatibility
    const sourceFamily = getStyleFamily(sourceLower)
    const targetFamily = getStyleFamily(targetLower)
    if (sourceFamily && targetFamily) {
      if (sourceFamily === targetFamily) return 0.85
    }

    // Check known pairings
    for (const pair of KNOWN_PAIRINGS) {
      if (
        (sourceLower.includes(pair.source) && targetLower.includes(pair.target)) ||
        (targetLower.includes(pair.source) && sourceLower.includes(pair.target))
      ) {
        return pair.compatibility
      }
    }

    // Check lighting-environment pairings
    for (const pair of LIGHTING_ENV_PAIRINGS) {
      if (
        (sourceLower.includes(pair.source) && targetLower.includes(pair.target)) ||
        (targetLower.includes(pair.source) && sourceLower.includes(pair.target))
      ) {
        return pair.compatibility
      }
    }

    // Default: moderate compatibility for unknown pairs
    // Style families that tend to be compatible
    const COMPATIBLE_FAMILIES: Array<[string, string, number]> = [
      ['realistic', 'cinematic', 0.75],
      ['realistic', 'noir', 0.65],
      ['painterly', 'vintage', 0.70],
      ['painterly', 'romantic', 0.72],
      ['anime', 'illustration', 0.70],
      ['illustration', 'concept art', 0.80],
      ['3d', 'cinematic', 0.72],
      ['sketch', 'illustration', 0.65],
    ]

    if (sourceFamily && targetFamily) {
      for (const [famA, famB, score] of COMPATIBLE_FAMILIES) {
        if (
          (sourceFamily === famA && targetFamily === famB) ||
          (sourceFamily === famB && targetFamily === famA)
        ) {
          return score
        }
      }
      // Families that strongly oppose each other
      const OPPOSED_FAMILIES: Array<[string, string]> = [
        ['realistic', 'anime'],
        ['realistic', 'abstract'],
        ['realistic', 'sketch'],
        ['painterly', '3d'],
        ['anime', 'painterly'],
        ['minimalist', '3d'],
      ]
      for (const [famA, famB] of OPPOSED_FAMILIES) {
        if (
          (sourceFamily === famA && targetFamily === famB) ||
          (sourceFamily === famB && targetFamily === famA)
        ) {
          return 0.20
        }
      }
    }

    // Fallback: neutral compatibility
    return 0.50
  }

  /**
   * Get the reason/description for a compatibility score.
   */
  getCompatibilityReason(source: string, target: string): string {
    const sourceLower = source.toLowerCase()
    const targetLower = target.toLowerCase()

    if (sourceLower === targetLower) return 'Same style — perfect compatibility'

    for (const pair of KNOWN_PAIRINGS) {
      if (
        (sourceLower.includes(pair.source) && targetLower.includes(pair.target)) ||
        (targetLower.includes(pair.source) && sourceLower.includes(pair.target))
      ) {
        return pair.reason
      }
    }

    for (const pair of LIGHTING_ENV_PAIRINGS) {
      if (
        (sourceLower.includes(pair.source) && targetLower.includes(pair.target)) ||
        (targetLower.includes(pair.source) && sourceLower.includes(pair.target))
      ) {
        return pair.reason
      }
    }

    const score = this.getCompatibilityScore(source, target)
    if (score >= 0.8) return 'Strong natural pairing'
    if (score >= 0.6) return 'Good compatibility with some creative tension'
    if (score >= 0.4) return 'Moderate compatibility — may need adjustment'
    if (score >= 0.2) return 'Weak compatibility — styles may clash'
    return 'Very low compatibility — styles strongly conflict'
  }

  /**
   * Suggest compatible styles for a given source style.
   */
  suggestCompatible(source: string, limit = 5): Array<{ style: string; score: number; reason: string }> {
    const candidates = [
      'photorealistic', 'cinematic', 'oil painting', 'watercolor', 'anime', 'manga',
      'concept art', 'digital art', '3d render', 'sketch', 'pencil drawing',
      'minimalist', 'abstract', 'noir', 'vintage', 'fantasy', 'cyberpunk',
      'dramatic lighting', 'soft lighting', 'golden hour', 'neon lighting',
      'studio lighting', 'natural light', 'volumetric lighting', 'rim lighting',
      'candlelight', 'high key', 'low key', 'backlighting',
    ]

    const results = candidates
      .filter(c => c.toLowerCase() !== source.toLowerCase())
      .map(style => ({
        style,
        score: this.getCompatibilityScore(source, style),
        reason: this.getCompatibilityReason(source, style),
      }))
      .sort((a, b) => b.score - a.score)

    return results.slice(0, limit)
  }
}

export const styleCompatEngine = new StyleCompatEngine()