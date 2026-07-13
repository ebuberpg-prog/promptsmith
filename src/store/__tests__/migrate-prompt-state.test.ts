import { describe, expect, it } from 'vitest'
import { migratePromptState } from '../migrate-prompt-state'

describe('migratePromptState', () => {
  it('maps legacy explicit visibility and preserves authored prompt content', () => {
    const customText = 'Unchanged authored text'
    const selections = [{ id: 'mature-tag', label: 'mature tag', explicit: true }]
    const migrated = migratePromptState({
      showExplicit: true,
      customText,
      selectedTags: selections,
      savedPrompts: [{ id: 'saved', name: 'Saved', customText, selections, model: 'gpt-image', createdAt: 10, updatedAt: 20 }],
    }, 3)

    expect(migrated.contentVisibility).toBe('all')
    expect(migrated.customText).toBe(customText)
    expect(migrated.selectedTags).toEqual(selections)
    expect(migrated.savedPrompts).toEqual([expect.objectContaining({ customText, selections, isFavorite: false, lastOpenedAt: 20 })])
    expect(migrated).not.toHaveProperty('showExplicit')
  })

  it('defaults new workspace preferences conservatively', () => {
    const migrated = migratePromptState({}, 3)
    expect(migrated.contentVisibility).toBe('filtered')
    expect(migrated.workspaceDepth).toBe('simple')
    expect(migrated.workspaceView).toBe('home')
  })

  it('adds v5 durability fields without rewriting saved content', () => {
    const state = { selectedModel: 'gpt-image', customText: 'Keep {subject} exact', aiSettings: { openaiApiKey: 'must-not-persist' }, savedPrompts: [{ id: 'p', name: 'P', customText: 'Keep {subject} exact', selections: [], model: 'gpt-image', createdAt: 1, updatedAt: 1 }] }
    const migrated = migratePromptState(state, 4)
    expect(migrated.selectedFormatterProfileId).toBe('format:natural-language')
    expect(migrated.storageDurability).toBe('best-effort')
    expect(migrated.customText).toBe(state.customText)
    expect(migrated.savedPrompts).toEqual([expect.objectContaining({ customText: state.customText, formatterProfileId: 'format:natural-language' })])
    expect(migrated.aiSettings).toEqual(expect.objectContaining({
      preferredAIProvider: null,
      providerModels: {},
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234/v1',
    }))
    expect(JSON.stringify(migrated.aiSettings)).not.toContain('openaiApiKey')
    expect(state.aiSettings.openaiApiKey).toBe('must-not-persist')
  })
})
