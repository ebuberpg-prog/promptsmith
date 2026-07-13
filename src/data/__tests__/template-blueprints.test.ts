import { describe, expect, it } from 'vitest'
import { BLUEPRINT_TEMPLATES, FLAGSHIP_TEMPLATES } from '../template-blueprints'

describe('template blueprints', () => {
  it('keeps a focused flagship collection', () => {
    expect(FLAGSHIP_TEMPLATES).toHaveLength(12)
    expect(new Set(FLAGSHIP_TEMPLATES.map((template) => template.imageId)).size).toBe(12)
  })

  it('gives every flagship structured ingredients and editable anatomy', () => {
    for (const template of FLAGSHIP_TEMPLATES) {
      expect(template.tagIds.length).toBeGreaterThanOrEqual(3)
      expect(template.anatomy.length).toBeGreaterThanOrEqual(4)
      expect(template.examplePrompt).toMatch(/\{[a-zA-Z][a-zA-Z0-9_]*\}/)
    }
  })

  it('preserves the complete built-in collection', () => {
    expect(BLUEPRINT_TEMPLATES.length).toBeGreaterThan(FLAGSHIP_TEMPLATES.length)
    expect(BLUEPRINT_TEMPLATES.every((template) => template.imageId && template.anatomy.length > 0)).toBe(true)
  })
})
