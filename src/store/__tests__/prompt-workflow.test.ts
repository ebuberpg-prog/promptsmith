import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePromptSmithStore } from '../prompt-store'
import type { ReferenceImage } from '@/types'

describe('prompt document workflow', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', globalThis)
  })

  afterAll(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    usePromptSmithStore.setState({
      customText: '',
      selectedTags: [],
      customNegativePrompt: '',
      modelParameters: {},
      promptVariables: [],
      activePromptId: null,
      draftDirty: false,
      lastEnhancement: null,
      draftSnapshots: [],
      savedPrompts: [],
    })
  })

  it('starts a truly blank draft without deleting the Library', () => {
    const saved = {
      id: 'saved-1', name: 'Saved prompt', selections: [], customText: 'Saved words', model: 'gpt-image' as const,
      createdAt: 1, updatedAt: 1,
    }
    usePromptSmithStore.setState({
      customText: 'Working words',
      customNegativePrompt: 'noise',
      modelParameters: { seed: 12 },
      activePromptId: saved.id,
      savedPrompts: [saved],
      draftDirty: true,
    })

    usePromptSmithStore.getState().startNewPrompt()

    const state = usePromptSmithStore.getState()
    expect(state.customText).toBe('')
    expect(state.selectedTags).toEqual([])
    expect(state.customNegativePrompt).toBe('')
    expect(state.modelParameters).toEqual({})
    expect(state.activePromptId).toBeNull()
    expect(state.savedPrompts).toEqual([saved])
    expect(state.draftSnapshots.at(-1)?.customText).toBe('Working words')
  })

  it('does not manufacture another version when an unchanged prompt is saved', () => {
    usePromptSmithStore.setState({ customText: 'A quiet portrait' })
    const first = usePromptSmithStore.getState().savePromptAsNew('Portrait')
    const versionCount = usePromptSmithStore.getState().promptVersions[first.id]?.length
    const second = usePromptSmithStore.getState().savePrompt('Portrait')
    expect(usePromptSmithStore.getState().promptVersions[first.id]).toHaveLength(versionCount)
    expect(second.version).toBe(first.version)
  })

  it('starts a new Craft draft from an analyzed reference and preserves recovery', () => {
    const reference: ReferenceImage = {
      id: 'reference-1', name: 'Glass study.webp', dataUrl: 'data:image/webp;base64,abc', uploadedAt: 1, extractedTags: [],
      analysis: {
        schemaVersion: 2,
        literalDescription: 'A glass vessel.',
        creativeRead: 'A quiet study.',
        selectedIntent: 'recreate',
        observations: [{ id: 'subject', dimension: 'subject', text: 'a glass vessel', evidence: 'observed', scope: 'scene', included: true }],
        palette: [],
        provenance: { provider: 'ollama', model: 'vision', analyzedAt: 1 },
      },
    }
    usePromptSmithStore.setState({ customText: 'Existing draft', referenceImages: [reference], workspaceView: 'analyze' })
    expect(usePromptSmithStore.getState().applyReferenceAnalysisToCraft(reference.id, 'recreate')).toBe(true)
    const state = usePromptSmithStore.getState()
    expect(state.customText).toBe('A glass vessel.')
    expect(state.workspaceView).toBe('craft')
    expect(state.activePromptId).toBeNull()
    expect(state.draftSnapshots.at(-1)?.customText).toBe('Existing draft')
  })
})
