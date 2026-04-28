import type { SelectedTag, SupportedModel } from '@/types'
import { getModelConfig } from '@/data/model-configs'
import { CONFLICT_RULES } from '@/data/randomizer-slots'

// ─── Types ──────────────────────────────────────────────────────────────────

export type DiffType = 'added' | 'removed' | 'modified' | 'reordered'
export type Significance = 'critical' | 'high' | 'medium' | 'low'

export interface DiffSegment {
  type: DiffType
  content: string
  tagId?: string
  category?: string
  significance: Significance
  description: string
}

export interface PromptDiffResult {
  segments: DiffSegment[]
  summary: string
  categoryChanges: Record<string, { added: number; removed: number; modified: number }>
  overallSignificance: Significance
  semanticSimilarity: number
}

export interface ComparisonOptions {
  model: SupportedModel
  respectOrder: boolean
}

// ─── Category significance for image generation ────────────────────────────

const CATEGORY_SIGNIFICANCE: Record<string, Significance> = {
  subject: 'critical',
  character_anatomy: 'critical',
  body_types: 'high',
  hair: 'high',
  facial_features: 'high',
  expressions: 'high',
  poses: 'high',
  clothing: 'medium',
  environments: 'high',
  camera_lighting_style: 'high',
  composition: 'medium',
  art_medium: 'critical',
  mood_emotion: 'medium',
  color_palette: 'medium',
  quality: 'low',
  body_modifications: 'low',
  body_hair: 'low',
  time_period: 'medium',
  social_setting: 'medium',
  weather_effects: 'low',
}

function getSignificance(category: string | undefined): Significance {
  if (!category) return 'medium'
  for (const [key, sig] of Object.entries(CATEGORY_SIGNIFICANCE)) {
    if (category.startsWith(key) || category === key) return sig
  }
  return 'medium'
}

function getTagKey(tag: { id: string; label: string }): string {
  return tag.id
}

// ─── Semantic similarity via category overlap ───────────────────────────────

function computeCategoryOverlap(tagsA: SelectedTag[], tagsB: SelectedTag[]): number {
  const catsA = new Set(tagsA.map(t => t.category).filter(Boolean))
  const catsB = new Set(tagsB.map(t => t.category).filter(Boolean))
  if (catsA.size === 0 && catsB.size === 0) return 1
  const intersection = new Set([...catsA].filter(c => catsB.has(c)))
  const union = new Set([...catsA, ...catsB])
  return union.size === 0 ? 1 : intersection.size / union.size
}

function computeLabelOverlap(tagsA: SelectedTag[], tagsB: SelectedTag[]): number {
  if (tagsA.length === 0 && tagsB.length === 0) return 1
  if (tagsA.length === 0 || tagsB.length === 0) return 0
  const labelsA = new Set(tagsA.map(t => t.label.toLowerCase()))
  const labelsB = new Set(tagsB.map(t => t.label.toLowerCase()))
  let matches = 0
  for (const label of labelsA) {
    if (labelsB.has(label)) matches++
  }
  return (2 * matches) / (labelsA.size + labelsB.size)
}

function computeWeightSimilarity(tagsA: SelectedTag[], tagsB: SelectedTag[]): number {
  const commonIds = new Set(
    tagsA.filter(a => tagsB.some(b => b.id === a.id)).map(t => t.id)
  )
  if (commonIds.size === 0) return 1
  let totalDiff = 0
  for (const id of commonIds) {
    const a = tagsA.find(t => t.id === id)!
    const b = tagsB.find(t => t.id === id)!
    totalDiff += Math.abs((a.customWeight ?? 1.0) - (b.customWeight ?? 1.0))
  }
  const avgDiff = totalDiff / commonIds.size
  return Math.max(0, 1 - avgDiff)
}

// ─── Order significance (matters for SD/MJ, less for prose models) ─────────

function computeOrderDifference(tagsA: SelectedTag[], tagsB: SelectedTag[]): DiffSegment[] {
  const diffs: DiffSegment[] = []
  const commonA = tagsA.filter(a => tagsB.some(b => b.id === a.id))
  const commonB = tagsB.filter(b => tagsA.some(a => a.id === b.id))

  if (commonA.length !== commonB.length || commonA.length < 2) return diffs

  // Check if position of any common tag shifted significantly
  for (const tag of commonA) {
    const posA = commonA.findIndex(t => t.id === tag.id)
    const posB = commonB.findIndex(t => t.id === tag.id)
    const shift = Math.abs(posA - posB)
    if (shift >= Math.max(2, Math.floor(commonA.length * 0.2))) {
      diffs.push({
        type: 'reordered',
        content: tag.label,
        tagId: tag.id,
        category: tag.category,
        significance: 'low',
        description: `"${tag.label}" moved from position ${posA + 1} to ${posB + 1}`,
      })
    }
  }

  return diffs
}

// ─── Core Diff Engine ───────────────────────────────────────────────────────

export class PromptDiffEngine {
  /**
   * Compare two tag sets (or full prompt texts) and return a structured diff.
   */
  compare(
    tagsA: SelectedTag[],
    customTextA: string,
    tagsB: SelectedTag[],
    customTextB: string,
    options?: Partial<ComparisonOptions>
  ): PromptDiffResult {
    const segments: DiffSegment[] = []
    const categoryChanges: Record<string, { added: number; removed: number; modified: number }> = {}

    const mapA = new Map(tagsA.map(t => [getTagKey(t), t]))
    const mapB = new Map(tagsB.map(t => [getTagKey(t), t]))

    // Find added tags (in B but not A)
    for (const [id, tag] of mapB) {
      if (!mapA.has(id)) {
        const sig = getSignificance(tag.category)
        segments.push({
          type: 'added',
          content: tag.label,
          tagId: tag.id,
          category: tag.category,
          significance: sig,
          description: `Added "${tag.label}"`,
        })
        const cat = tag.category ?? 'uncategorized'
        if (!categoryChanges[cat]) categoryChanges[cat] = { added: 0, removed: 0, modified: 0 }
        categoryChanges[cat].added++
      }
    }

    // Find removed tags (in A but not B)
    for (const [id, tag] of mapA) {
      if (!mapB.has(id)) {
        const sig = getSignificance(tag.category)
        segments.push({
          type: 'removed',
          content: tag.label,
          tagId: tag.id,
          category: tag.category,
          significance: sig,
          description: `Removed "${tag.label}"`,
        })
        const cat = tag.category ?? 'uncategorized'
        if (!categoryChanges[cat]) categoryChanges[cat] = { added: 0, removed: 0, modified: 0 }
        categoryChanges[cat].removed++
      }
    }

    // Find modified tags (same id, different weight or trigger words)
    for (const [id, tagA] of mapA) {
      const tagB = mapB.get(id)
      if (!tagB) continue

      const weightA = tagA.customWeight ?? 1.0
      const weightB = tagB.customWeight ?? 1.0
      const triggersA = (tagA.triggerWords ?? []).sort().join(',')
      const triggersB = (tagB.triggerWords ?? []).sort().join(',')

      if (weightA !== weightB || triggersA !== triggersB) {
        const changes: string[] = []
        if (weightA !== weightB) changes.push(`weight: ${weightA.toFixed(1)} → ${weightB.toFixed(1)}`)
        if (triggersA !== triggersB) changes.push('trigger words changed')

        const sig = weightA !== weightB ? getSignificance(tagA.category) : 'low' as Significance
        segments.push({
          type: 'modified',
          content: tagA.label,
          tagId: tagA.id,
          category: tagA.category,
          significance: sig,
          description: `Modified "${tagA.label}" — ${changes.join(', ')}`,
        })
        const cat = tagA.category ?? 'uncategorized'
        if (!categoryChanges[cat]) categoryChanges[cat] = { added: 0, removed: 0, modified: 0 }
        categoryChanges[cat].modified++
      }
    }

    // Custom text diff
    const textA = customTextA.trim()
    const textB = customTextB.trim()
    if (textA !== textB) {
      if (textA && !textB) {
        segments.push({
          type: 'removed',
          content: textA,
          significance: 'medium',
          description: 'Removed custom text',
        })
      } else if (!textA && textB) {
        segments.push({
          type: 'added',
          content: textB,
          significance: 'medium',
          description: 'Added custom text',
        })
      } else {
        segments.push({
          type: 'modified',
          content: `${textA} → ${textB}`,
          significance: 'medium',
          description: 'Modified custom text',
        })
      }
    }

    // Order changes (relevant for tag-based models)
    const orderDiffs = computeOrderDifference(tagsA, tagsB)
    segments.push(...orderDiffs)

    // Compute overall significance
    const significanceOrder: Significance[] = ['critical', 'high', 'medium', 'low']
    const maxSignificance = segments.length > 0
      ? segments.reduce((max, s) => {
          const sIdx = significanceOrder.indexOf(s.significance)
          const mIdx = significanceOrder.indexOf(max)
          return sIdx < mIdx ? s.significance : max
        }, 'low' as Significance)
      : 'low'

    // Compute semantic similarity
    const categorySim = computeCategoryOverlap(tagsA, tagsB)
    const labelSim = computeLabelOverlap(tagsA, tagsB)
    const weightSim = computeWeightSimilarity(tagsA, tagsB)
    const semanticSimilarity = categorySim * 0.3 + labelSim * 0.5 + weightSim * 0.2

    // Generate summary
    const addedCount = segments.filter(s => s.type === 'added').length
    const removedCount = segments.filter(s => s.type === 'removed').length
    const modifiedCount = segments.filter(s => s.type === 'modified').length
    const reorderedCount = segments.filter(s => s.type === 'reordered').length

    const parts: string[] = []
    if (addedCount > 0) parts.push(`${addedCount} added`)
    if (removedCount > 0) parts.push(`${removedCount} removed`)
    if (modifiedCount > 0) parts.push(`${modifiedCount} modified`)
    if (reorderedCount > 0) parts.push(`${reorderedCount} reordered`)

    const summary = parts.length > 0
      ? `Prompt changed: ${parts.join(', ')}. Similarity: ${(semanticSimilarity * 100).toFixed(0)}%`
      : 'No changes detected between prompts.'

    return {
      segments,
      summary,
      categoryChanges,
      overallSignificance: maxSignificance,
      semanticSimilarity,
    }
  }

  /**
   * Compare two raw prompt strings (for A/B testing when tags aren't available).
   */
  compareRaw(promptA: string, promptB: string): PromptDiffResult {
    const wordsA = new Set(promptA.split(',').map(w => w.trim().toLowerCase()).filter(Boolean))
    const wordsB = new Set(promptB.split(',').map(w => w.trim().toLowerCase()).filter(Boolean))

    const segments: DiffSegment[] = []

    for (const word of wordsB) {
      if (!wordsA.has(word)) {
        segments.push({
          type: 'added',
          content: word,
          significance: 'medium',
          description: `Added "${word}"`,
        })
      }
    }

    for (const word of wordsA) {
      if (!wordsB.has(word)) {
        segments.push({
          type: 'removed',
          content: word,
          significance: 'medium',
          description: `Removed "${word}"`,
        })
      }
    }

    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
    const union = new Set([...wordsA, ...wordsB])
    const semanticSimilarity = union.size === 0 ? 1 : (2 * intersection.size) / union.size

    return {
      segments,
      summary: `${segments.filter(s => s.type === 'added').length} added, ${segments.filter(s => s.type === 'removed').length} removed. Similarity: ${(semanticSimilarity * 100).toFixed(0)}%`,
      categoryChanges: {},
      overallSignificance: segments.length > 0 ? 'medium' : 'low',
      semanticSimilarity,
    }
  }
}

export const promptDiffEngine = new PromptDiffEngine()