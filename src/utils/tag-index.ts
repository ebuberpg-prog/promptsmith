import Fuse, { type IFuseOptions } from 'fuse.js'
import type { TaxonomyTag } from '@/types'

interface TagIndex {
  allTags: TaxonomyTag[]
  tagById: Map<string, TaxonomyTag>
  tagsByCategory: Map<string, TaxonomyTag[]>
  searchIndex: Fuse<TaxonomyTag>
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
}

export function addTagsToIndex(tags: TaxonomyTag[]): void {
  const newTags: TaxonomyTag[] = []

  for (const tag of tags) {
    if (index.tagById.has(tag.id)) continue
    index.tagById.set(tag.id, tag)
    index.allTags.push(tag)
    newTags.push(tag)

    if (tag.category) {
      const catTags = index.tagsByCategory.get(tag.category) ?? []
      catTags.push(tag)
      index.tagsByCategory.set(tag.category, catTags)
    }
  }

  if (newTags.length > 0) {
    // Rebuild Fuse index when new tags are added
    index.searchIndex = new Fuse(index.allTags, FUSE_OPTIONS)
  }
}

export function searchTagIndex(query: string, showExplicit: boolean, limit = 80): TaxonomyTag[] {
  if (!query.trim()) return []
  const results = index.searchIndex.search(query, { limit: limit * 2 })
  return results
    .map(r => r.item)
    .filter(tag => showExplicit || !tag.explicit)
    .slice(0, limit)
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
  }
}
