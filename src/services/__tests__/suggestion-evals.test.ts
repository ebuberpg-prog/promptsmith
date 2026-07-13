import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { beforeAll, describe, expect, it } from 'vitest'
import { analyzeComposerInput } from '../composer-analysis'
import { addTagsToIndex, resetTagIndex } from '@/utils/tag-index'
import type { TaxonomyTag } from '@/types'
import { SUGGESTION_EVALS } from './fixtures/suggestion-evals'

function collect(value: unknown, category: string): TaxonomyTag[] {
  if (Array.isArray(value)) return value.flatMap((item) => item && typeof item === 'object' && 'id' in item ? [{ ...(item as TaxonomyTag), category }] : collect(item, category))
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => collect(item, category))
  return []
}

describe('live suggestion release evaluation', () => {
  beforeAll(() => {
    resetTagIndex()
    const directory = path.resolve(process.cwd(), 'public/taxonomy')
    for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.yaml') && name !== 'negative_prompts.yaml')) {
      const parsed = yaml.load(fs.readFileSync(path.join(directory, file), 'utf8'))
      addTagsToIndex(collect(parsed, file.replace('.yaml', '')))
    }
  })

  it('ranks all 50 curated exact concepts first', () => {
    for (const concept of SUGGESTION_EVALS) {
      const result = analyzeComposerInput(`A visual study featuring ${concept}`, 'all', 3)
      expect(result.suggestions[0]?.label.toLowerCase(), concept).toBe(concept.toLowerCase())
    }
  }, 20_000)

  it('suppresses unrelated fuzzy matches in at least 95% of fixtures', () => {
    const prompts = [...SUGGESTION_EVALS.map((concept) => `A visual study featuring ${concept}`), 'A quiet portrait lit by a rainy shop window']
    const clean = prompts.filter((prompt) => !analyzeComposerInput(prompt, 'filtered', 3).suggestions.some((tag) => tag.label === 'wearing shoes')).length
    expect(clean / prompts.length).toBeGreaterThanOrEqual(0.95)
  }, 20_000)
})
