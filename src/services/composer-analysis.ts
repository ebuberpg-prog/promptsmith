import type {
  ComposerAnalysis,
  ContentVisibility,
  PromptDimension,
  TaxonomyTag,
} from '@/types'
import { findExactTagMatches, searchTagIndexScored } from '@/utils/tag-index'

const DIMENSIONS: PromptDimension[] = ['subject', 'setting', 'lighting', 'composition', 'style']

const CATEGORY_DIMENSIONS: Array<[PromptDimension, string[]]> = [
  ['subject', ['character', 'anatomy', 'animal', 'gender', 'clothing', 'pose', 'food', 'object']],
  ['setting', ['environment', 'architecture', 'weather', 'time_period', 'social_setting', 'festival']],
  ['lighting', ['lighting', 'camera_lighting']],
  ['composition', ['composition', 'camera', 'hand_details', 'foot_details']],
  ['style', ['art_medium', 'style', 'mood', 'color_palette', 'texture', 'typography', 'subculture']],
]

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with',
  'make', 'create', 'image', 'picture', 'prompt', 'please',
])
const NON_LITERAL_COMPOUNDS: Record<string, string[]> = { lamp: ['lamp black'], rose: ['rose gold'] }

function dimensionForTag(tag: TaxonomyTag): PromptDimension | null {
  const path = `${tag.category ?? ''} ${tag.subcategory ?? ''}`.toLowerCase()
  return CATEGORY_DIMENSIONS.find(([, hints]) => hints.some((hint) => path.includes(hint)))?.[0] ?? null
}

function candidatePhrases(rawInput: string): string[] {
  const words = rawInput
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1)

  const phrases: string[] = []
  // Walk backward from the caret and try multiple phrase lengths at each
  // position. This reaches an exact recent word before scanning old prose.
  for (let end = words.length; end > 0; end -= 1) {
    for (let size = Math.min(4, end); size >= 1; size -= 1) {
      const index = end - size
      const phraseWords = words.slice(index, index + size)
      if (phraseWords.every((word) => STOP_WORDS.has(word))) continue
      phrases.push(phraseWords.join(' '))
      if (phrases.length >= 12) return phrases
    }
  }
  return phrases
}

export function analyzeComposerInput(
  rawInput: string,
  contentVisibility: ContentVisibility,
  limit = 8,
): ComposerAnalysis {
  const scoredById = new Map<string, NonNullable<ComposerAnalysis['scoredSuggestions']>[number]>()

  const phrases = candidatePhrases(rawInput)
  phrases.forEach((phrase, phraseIndex) => {
    for (const result of findExactTagMatches(phrase, contentVisibility).filter((match) => {
      const singleAliasInsideProse = match.matchedField === 'alias'
        && phrase.split(/\s+/).length === 1
        && rawInput.trim().toLowerCase() !== phrase.toLowerCase()
      const nonLiteralCompound = (NON_LITERAL_COMPOUNDS[phrase.toLowerCase()] ?? []).some((compound) => rawInput.toLowerCase().includes(compound))
      return !singleAliasInsideProse && !nonLiteralCompound
    })) {
      const ranked = { ...result, score: result.score + phraseIndex * 0.002 }
      const existing = scoredById.get(result.tag.id)
      if (!existing || ranked.score < existing.score) scoredById.set(result.tag.id, ranked)
    }
  })

  // One bounded fuzzy search supplies discovery beyond exact phrases without
  // running a full taxonomy search for every n-gram on every keystroke.
  const fuzzyPhrase = phrases.find((phrase) => phrase.split(' ').some((word) => !STOP_WORDS.has(word)))
  if (fuzzyPhrase) {
    for (const result of searchTagIndexScored(fuzzyPhrase, contentVisibility, limit)) {
      const existing = scoredById.get(result.tag.id)
      if (!existing || result.score < existing.score) scoredById.set(result.tag.id, result)
    }
  }

  const ranked = [...scoredById.values()].sort((a, b) => a.score - b.score)
  const diverse: typeof ranked = []
  const dimensions = new Set<string>()
  for (const result of ranked) {
    const dimension = dimensionForTag(result.tag) ?? result.tag.category ?? result.tag.id
    if (diverse.length < 3 && dimensions.has(dimension) && ranked.some((candidate) => !dimensions.has(dimensionForTag(candidate.tag) ?? candidate.tag.category ?? candidate.tag.id))) continue
    diverse.push(result)
    dimensions.add(dimension)
    if (diverse.length >= limit) break
  }
  const suggestions = diverse.map((result) => result.tag)

  const normalized = rawInput.toLowerCase()
  const contentWords = normalized.replace(/[^\p{L}\p{N}'-]+/gu, ' ').split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  const directSignals: Record<PromptDimension, boolean> = {
    subject: contentWords.length >= 2,
    setting: /\b(?:in|inside|outside|at|beside|within|against|across|near)\b.{0,42}\b(?:studio|room|street|forest|garden|city|beach|coast|interior|exterior|window|station|landscape|environment|background|court|home|field|mountain|ocean|desert)\b/i.test(rawInput),
    lighting: /\b(?:light|lighting|lit|shadow|sunlight|moonlight|glow|backlit|rim|contrast|exposure|golden hour)\b/i.test(rawInput),
    composition: /\b(?:composition|view|shot|angle|close-up|wide|portrait|landscape|asymmetr\w*|symmetr\w*|centered|framing|foreground|background|aerial|overhead|profile)\b/i.test(rawInput),
    style: /\b(?:style|photo|photograph|painting|painted|illustration|drawing|sketch|watercolor|ink|charcoal|cinematic|editorial|surreal|abstract|realism|minimal|graphic|film)\b/i.test(rawInput),
  }
  const presentDimensions = DIMENSIONS.filter((dimension) =>
    directSignals[dimension] || suggestions.some((tag) => dimensionForTag(tag) === dimension),
  )

  return {
    rawInput,
    suggestions,
    scoredSuggestions: diverse,
    presentDimensions,
    missingDimensions: DIMENSIONS.filter((dimension) => !presentDimensions.includes(dimension)),
  }
}
