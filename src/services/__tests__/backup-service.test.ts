import { describe, expect, it } from 'vitest'
import { createMuseBackup, mergeById, mergePromptBackups, parseMuseBackup } from '../backup-service'
import type { DraftSnapshot, PromptTemplate, PromptVersion } from '@/types'

const draft: DraftSnapshot = { id: 'draft', createdAt: 1, source: 'manual', customText: 'Unchanged mature authored text', selectedTags: [], selectedModel: 'gpt-image', formatterProfileId: 'format:natural-language', parameters: {} }

describe('complete backup service', () => {
  it('round-trips private content without credentials', () => {
    const backup = createMuseBackup({ draft, savedPrompts: [], savedEntities: [], referenceImages: [], promptVersions: {}, draftSnapshots: [draft], formatterProfiles: [], preferences: { contentVisibility: 'all', workspaceDepth: 'studio', theme: 'dark', pinnedTags: [], recentlyUsedTags: [] } })
    const json = JSON.stringify(backup)
    expect(parseMuseBackup(json).state.draft.customText).toBe(draft.customText)
    expect(json).not.toContain('openaiApiKey')
  })

  it('rejects malformed backups before mutation', () => {
    expect(() => parseMuseBackup('{"_schema":"muse-backup-v1","state":{}}')).toThrow()
  })

  it('skips identical records and clones conflicting ids', () => {
    const current = [{ id: 'same', name: 'Prompt', value: 1 }]
    expect(mergeById(current, [{ ...current[0] }])).toHaveLength(1)
    const merged = mergeById(current, [{ id: 'same', name: 'Prompt', value: 2 }])
    expect(merged).toHaveLength(2)
    expect(merged[1].id).not.toBe('same')
    expect(merged[1].name).toContain('(imported)')
  })

  it('remaps version history when a conflicting prompt is cloned', () => {
    const base = { id: 'same', name: 'Prompt', selections: [], customText: 'current', model: 'gpt-image', createdAt: 1, updatedAt: 1 } as PromptTemplate
    const imported = { ...base, customText: 'imported' }
    const version = { id: 'v1', promptId: 'same', version: 1, content: 'imported', model: 'gpt-image', parameters: {}, createdAt: 1, selectedTags: [], customText: 'imported' } as PromptVersion
    const merged = mergePromptBackups([base], [imported], {}, { same: [version] })
    const clone = merged.prompts[1]
    expect(clone.name).toBe('Prompt (imported)')
    expect(merged.versions[clone.id][0].promptId).toBe(clone.id)
    expect(merged.versions[clone.id][0].id).not.toBe('v1')
  })
})
