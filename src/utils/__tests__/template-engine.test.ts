import { describe, expect, it } from 'vitest'
import { applyPromptTemplate, exportTemplate, importTemplate } from '../template-engine'
import type { PromptTemplate } from '@/types'

const matureSelection = {
  id: 'mature-selection',
  label: 'mature selection',
  aliases: [],
  description: 'Existing selected taxonomy content',
  explicit: true,
  weight: 1,
  selectedAt: 1,
}

const template: PromptTemplate = {
  id: 'saved',
  name: 'Saved study',
  selections: [matureSelection],
  customText: 'Authored text remains untouched',
  model: 'gpt-image',
  createdAt: 1,
  updatedAt: 2,
}

describe('saved prompt preservation', () => {
  it('does not remove existing mature selections in filtered discovery mode', () => {
    const applied = applyPromptTemplate(template, 'gpt-image', 'filtered')
    expect(applied.tags).toEqual([matureSelection])
    expect(applied.customText).toBe(template.customText)
  })

  it('round-trips authored text and selections through export/import', () => {
    const imported = importTemplate(exportTemplate(template))
    expect(imported?.customText).toBe(template.customText)
    expect(imported?.selections).toEqual(template.selections)
  })
})
