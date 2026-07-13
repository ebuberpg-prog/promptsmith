import type { SelectedTag, TaxonomyTag } from '@/types'

/**
 * Taxonomy data can come from YAML, an older browser cache, or an imported
 * prompt. Older records did not always include `aliases`, so normalize that
 * boundary instead of allowing one legacy tag to crash search or formatting.
 */
export function normalizeTaxonomyTag<T extends TaxonomyTag | SelectedTag>(tag: T): T {
  return {
    ...tag,
    aliases: Array.isArray(tag.aliases)
      ? tag.aliases.filter((alias): alias is string => typeof alias === 'string')
      : [],
  }
}

export function normalizeTaxonomyTags<T extends TaxonomyTag | SelectedTag>(tags: T[] | undefined): T[] {
  return Array.isArray(tags) ? tags.map(normalizeTaxonomyTag) : []
}
