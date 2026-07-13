import { beforeEach, describe, expect, it } from 'vitest'
import type { TaxonomyTag } from '@/types'
import { addTagsToIndex, getAllIndexedTags, resetTagIndex } from '@/utils/tag-index'

function tag(overrides: Partial<TaxonomyTag>): TaxonomyTag {
  return {
    id: 'shared-id',
    label: 'shared label',
    aliases: [],
    description: 'A preserved taxonomy entry',
    explicit: false,
    weight: 1,
    category: 'first-file',
    subcategory: 'first-group',
    ...overrides,
  }
}

describe('taxonomy ID collisions', () => {
  beforeEach(resetTagIndex)

  it('preserves every distinct source entry with a deterministic internal ID', () => {
    addTagsToIndex([
      tag({ category: 'first-file', subcategory: 'first-group' }),
      tag({ category: 'second-file', subcategory: 'second-group' }),
    ])

    const indexed = getAllIndexedTags()
    expect(indexed).toHaveLength(2)
    expect(indexed[0].id).toBe('shared-id')
    expect(indexed[1]).toMatchObject({
      id: 'shared-id::second-file::second-group',
      sourceId: 'shared-id',
      label: 'shared label',
    })
  })
})
