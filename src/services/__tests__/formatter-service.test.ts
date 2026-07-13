import { describe, expect, it } from 'vitest'
import { composeWithProfile, conceptAppearsInText, detectPromptVariables, resolvePromptVariables } from '../formatter-service'
import { BUILT_IN_FORMATTER_PROFILES } from '@/data/formatter-profiles'

describe('formatter profiles and variables', () => {
  it('detects variables without changing authored text', () => {
    const raw = 'A {subject} in {setting} with {subject}'
    const variables = detectPromptVariables(raw)
    expect(variables.map((item) => item.name)).toEqual(['subject', 'setting'])
    expect(raw).toBe('A {subject} in {setting} with {subject}')
  })

  it('leaves unresolved variables literal', () => {
    const result = resolvePromptVariables('A {subject} in {setting}', [{ name: 'subject', value: 'dancer' }])
    expect(result.text).toBe('A dancer in {setting}')
    expect(result.unresolved).toEqual(['setting'])
  })

  it('renders a profile without mutating the source', () => {
    const raw = 'A {subject}'
    const result = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[0], tags: [], customText: raw, variables: [{ name: 'subject', value: 'painter' }], parameters: {} })
    expect(result.prompt).toContain('A painter')
    expect(raw).toBe('A {subject}')
  })

  it('keeps ingredient metadata without repeating concepts already present in authored prose', () => {
    const tag = { id: 'natural-light', label: 'natural light', aliases: ['daylight'], description: '', explicit: false, weight: 1, selectedAt: 1 }
    const natural = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[0], tags: [tag], customText: 'A portrait in natural light', parameters: {} })
    const tagList = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[1], tags: [tag], customText: 'portrait, natural light', parameters: {} })
    expect(natural.prompt).toBe('A portrait in natural light')
    expect(tagList.prompt).toBe('portrait, natural light')
  })

  it('still adds an explicit ingredient when authored prose does not contain it', () => {
    const tag = { id: 'natural-light', label: 'natural light', aliases: ['daylight'], description: '', explicit: false, weight: 1, selectedAt: 1 }
    const natural = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[0], tags: [tag], customText: 'A quiet portrait', parameters: {} })
    expect(natural.prompt).toBe('A quiet portrait The visual direction includes natural light.')
  })

  it('reconciles an enhanced phrase that inserts a modifier or changes inflection', () => {
    const tag = { id: 'cinematic-lighting', label: 'cinematic lighting', aliases: [], description: '', explicit: false, weight: 1, selectedAt: 1 }
    const enhanced = 'A portrait shaped by cinematic studio light and restrained shadows.'
    const natural = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[0], tags: [tag], customText: enhanced, parameters: {} })
    const tagList = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[1], tags: [tag], customText: enhanced, parameters: {} })

    expect(natural.prompt).toBe(enhanced)
    expect(tagList.prompt).toBe(enhanced)
  })

  it('does not absorb a multi-word ingredient when only part of it is present', () => {
    const tag = { id: 'golden-hour', label: 'golden hour', aliases: [], description: '', explicit: false, weight: 1, selectedAt: 1 }
    expect(conceptAppearsInText('A golden portrait made at noon', tag)).toBe(false)

    const natural = composeWithProfile({ profile: BUILT_IN_FORMATTER_PROFILES[0], tags: [tag], customText: 'A golden portrait made at noon', parameters: {} })
    expect(natural.prompt).toContain('golden hour')
  })

  it('does not combine distant words into an already-represented concept', () => {
    const tag = { id: 'warm-lighting', label: 'warm lighting', aliases: [], description: '', explicit: false, weight: 1, selectedAt: 1 }
    const text = 'A warm ceramic vessel sits in a cool room with hard lighting across the far wall.'
    expect(conceptAppearsInText(text, tag)).toBe(false)
  })
})
