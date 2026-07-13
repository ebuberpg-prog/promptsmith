import Fuse, { type IFuseOptions } from 'fuse.js'
import type { ContentVisibility, TagSearchResult, TaxonomyTag } from '@/types'
import { normalizeTaxonomyTag } from './taxonomy-tag'

interface TagIndex {
  allTags: TaxonomyTag[]
  tagById: Map<string, TaxonomyTag>
  tagsByCategory: Map<string, TaxonomyTag[]>
  searchIndex: Fuse<TaxonomyTag>
  exactByPhrase: Map<string, TaxonomyTag[]>
}

const FUSE_OPTIONS: IFuseOptions<TaxonomyTag> = {
  keys: [
    { name: 'label', weight: 0.7 },
    { name: 'aliases', weight: 0.2 },
    { name: 'description', weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: true,
}

let index: TagIndex = {
  allTags: [],
  tagById: new Map(),
  tagsByCategory: new Map(),
  searchIndex: new Fuse([], FUSE_OPTIONS),
  exactByPhrase: new Map(),
}
const searchCache = new Map<string, TagSearchResult[]>()

export function addTagsToIndex(tags: TaxonomyTag[]): void {
  const newTags: TaxonomyTag[] = []

  for (const sourceTag of tags) {
    let tag = normalizeTaxonomyTag(sourceTag)
    const existing = index.tagById.get(tag.id)
    if (existing) {
      const isSameSource = existing.label === tag.label
        && existing.category === tag.category
        && existing.subcategory === tag.subcategory
      if (isSameSource) continue

      const sourceId = tag.sourceId ?? tag.id
      const baseId = `${sourceId}::${tag.category ?? 'uncategorized'}::${tag.subcategory ?? 'general'}`
      let uniqueId = baseId
      let suffix = 2
      while (index.tagById.has(uniqueId)) {
        uniqueId = `${baseId}::${suffix}`
        suffix += 1
      }
      tag = { ...tag, id: uniqueId, sourceId }
    }

    index.tagById.set(tag.id, tag)
    index.allTags.push(tag)
    newTags.push(tag)
    for (const phrase of [tag.label, ...tag.aliases].map((value) => value.trim().toLowerCase()).filter(Boolean)) {
      index.exactByPhrase.set(phrase, [...(index.exactByPhrase.get(phrase) ?? []), tag])
    }

    if (tag.category) {
      const catTags = index.tagsByCategory.get(tag.category) ?? []
      catTags.push(tag)
      index.tagsByCategory.set(tag.category, catTags)
    }
  }

  if (newTags.length > 0) {
    // Rebuild Fuse index when new tags are added
    index.searchIndex = new Fuse(index.allTags, FUSE_OPTIONS)
    searchCache.clear()
  }
}

const SEARCH_STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])
const NON_LITERAL_COMPOUNDS: Record<string, string[]> = {
  lamp: ['lamp black'],
  rose: ['rose gold'],
}

function normalizedTokens(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}'-]+/gu, ' ').split(/\s+/).filter((token) => token.length >= 3 && !SEARCH_STOP_WORDS.has(token))
}

export function searchTagIndexScored(query: string, contentVisibility: ContentVisibility, limit = 80): TagSearchResult[] {
  if (!query.trim()) return []
  const normalizedQuery = query.trim().toLowerCase()
  const cacheKey = `${contentVisibility}:${limit}:${normalizedQuery}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached
  const queryTokens = normalizedTokens(query)
  const exact = (index.exactByPhrase.get(normalizedQuery) ?? [])
    .filter((tag) => contentVisibility === 'all' || !tag.explicit)
    .map((tag): TagSearchResult => ({ tag, score: tag.label.toLowerCase() === normalizedQuery ? 0 : 0.001, matchedPhrase: query.trim(), matchedField: tag.label.toLowerCase() === normalizedQuery ? 'label' : 'alias' }))
    .sort((a, b) => a.score - b.score)
  if (exact.length > 0) {
    const limited = exact.slice(0, limit)
    searchCache.set(cacheKey, limited)
    return limited
  }
  const fuzzy = index.searchIndex.search(query, { limit: limit * 4 })
    .filter((result) => contentVisibility === 'all' || !result.item.explicit)
    .map((result): TagSearchResult | null => {
      const label = result.item.label.toLowerCase()
      const aliases = result.item.aliases.map((alias) => alias.toLowerCase())
      const description = result.item.description.toLowerCase()
      const exactLabel = label === normalizedQuery
      const exactAlias = aliases.includes(normalizedQuery)
      const matchedField: TagSearchResult['matchedField'] = exactLabel ? 'label' : exactAlias ? 'alias'
        : [label, ...aliases].some((value) => normalizedTokens(value).some((token) => queryTokens.includes(token))) ? (normalizedTokens(label).some((token) => queryTokens.includes(token)) ? 'label' : 'alias')
          : 'description'
      const score = exactLabel || exactAlias ? 0 : result.score ?? 1
      const hasSharedToken = [label, ...aliases].some((value) => normalizedTokens(value).some((token) => queryTokens.includes(token)))
      const allowed = score === 0
        || (matchedField !== 'description' && hasSharedToken && score <= 0.18)
        || (matchedField === 'description' && normalizedQuery.length >= 4 && description.includes(normalizedQuery) && score <= 0.12)
      return allowed ? { tag: result.item, score, matchedPhrase: query.trim(), matchedField } : null
    })
    .filter((result): result is TagSearchResult => Boolean(result))
  const seen = new Set(exact.map((result) => result.tag.id))
  const combined = [...exact, ...fuzzy.filter((result) => !seen.has(result.tag.id))].slice(0, limit)
  searchCache.set(cacheKey, combined)
  return combined
}

export function findExactTagMatches(query: string, contentVisibility: ContentVisibility): TagSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  return (index.exactByPhrase.get(normalizedQuery) ?? [])
    .filter((tag) => contentVisibility === 'all' || !tag.explicit)
    .map((tag): TagSearchResult => ({ tag, score: tag.label.toLowerCase() === normalizedQuery ? 0 : 0.001, matchedPhrase: query.trim(), matchedField: tag.label.toLowerCase() === normalizedQuery ? 'label' : 'alias' }))
    .sort((a, b) => a.score - b.score)
}

/**
 * Finds taxonomy labels and aliases that are already present in authored prose.
 * Longer phrases win over nested single-word matches so "warm lighting" does
 * not also manufacture a second "lighting" ingredient.
 */
export function findTagsInText(text: string, contentVisibility: ContentVisibility, limit = 16): TagSearchResult[] {
  const normalizedText = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}'-]+/gu, ' ').trim()} `
  if (normalizedText.trim().length < 3) return []

  const candidates = index.allTags
    .filter((tag) => contentVisibility === 'all' || !tag.explicit)
    .flatMap((tag) => [tag.label, ...tag.aliases].map((phrase, phraseIndex) => {
      const normalizedPhrase = phrase.toLowerCase().replace(/[^\p{L}\p{N}'-]+/gu, ' ').trim()
      if (normalizedPhrase.length < 3) return null
      if ((NON_LITERAL_COMPOUNDS[normalizedPhrase] ?? []).some((compound) => normalizedText.includes(` ${compound} `))) return null
      const aliasInsideProse = phraseIndex > 0 && !normalizedPhrase.includes(' ') && normalizedText.trim() !== normalizedPhrase
      if (aliasInsideProse) return null
      const start = normalizedText.indexOf(` ${normalizedPhrase} `)
      return start < 0 ? null : { tag, phrase, normalizedPhrase, start }
    }).filter((item): item is { tag: TaxonomyTag; phrase: string; normalizedPhrase: string; start: number } => Boolean(item)))
    .sort((a, b) => a.start - b.start || b.normalizedPhrase.length - a.normalizedPhrase.length || a.tag.label.localeCompare(b.tag.label))

  const occupied: Array<[number, number]> = []
  const seen = new Set<string>()
  const results: TagSearchResult[] = []
  for (const candidate of candidates) {
    if (seen.has(candidate.tag.id)) continue
    const range: [number, number] = [candidate.start, candidate.start + candidate.normalizedPhrase.length]
    if (occupied.some(([start, end]) => range[0] >= start && range[1] <= end)) continue
    seen.add(candidate.tag.id)
    occupied.push(range)
    results.push({
      tag: candidate.tag,
      score: candidate.tag.label.toLowerCase() === candidate.normalizedPhrase ? 0 : 0.001,
      matchedPhrase: candidate.phrase,
      matchedField: candidate.tag.label.toLowerCase() === candidate.normalizedPhrase ? 'label' : 'alias',
    })
    if (results.length >= limit) break
  }
  return results
}

export function searchTagIndex(query: string, contentVisibility: ContentVisibility, limit = 80): TaxonomyTag[] {
  return searchTagIndexScored(query, contentVisibility, limit).map((result) => result.tag)
}

export function getTagById(id: string): TaxonomyTag | undefined {
  return index.tagById.get(id)
}

export function getTagsByCategory(category: string): TaxonomyTag[] {
  return index.tagsByCategory.get(category) ?? []
}

export function getAllIndexedTags(): TaxonomyTag[] {
  return index.allTags
}

export function getIndexedTagCount(): number {
  return index.allTags.length
}

export function resetTagIndex(): void {
  index = {
    allTags: [],
    tagById: new Map(),
    tagsByCategory: new Map(),
    searchIndex: new Fuse([], FUSE_OPTIONS),
    exactByPhrase: new Map(),
  }
  searchCache.clear()
}
