import { describe, expect, it } from 'vitest'
import type { TaxonomyTag } from '@/types'
import { normalizeTaxonomyTag } from '../taxonomy-tag'

describe('normalizeTaxonomyTag', () => {
  it('repairs legacy tags that do not contain an aliases array', () => {
    const legacy = {
      id: 'legacy-tag',
      label: 'legacy tag',
      description: '',
      explicit: false,
      weight: 1,
    } as TaxonomyTag

    expect(normalizeTaxonomyTag(legacy).aliases).toEqual([])
  })

  it('preserves valid aliases and ignores malformed values', () => {
    const malformed = {
      id: 'mixed-tag',
      label: 'mixed tag',
      aliases: ['valid alias', null, 4],
      description: '',
      explicit: false,
      weight: 1,
    } as unknown as TaxonomyTag

    expect(normalizeTaxonomyTag(malformed).aliases).toEqual(['valid alias'])
  })
})
