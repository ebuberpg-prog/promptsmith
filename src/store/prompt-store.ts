import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  TaxonomyTag,
  PromptTemplate,
  SupportedModel,
  ReferenceImage,
  AppState,
  NegativePromptIntelligence,
  ModelParameters,
  SavedEntity,
  EntityKind,
} from '@/types'
import { RandomizerEngine, type RandomizerResult } from '@/services/randomizer-engine'
import type { RandomizerMode } from '@/data/randomizer-modes'
import { promptComposer } from '@/services/prompt-composer'
import { negativePromptEngine } from '@/services/negative-prompt-engine'
import { useHistoryStore, createSnapshot } from './history-store'

let isHistoryBatching = false

export interface AISettings {
  ollamaUrl: string
  lmStudioUrl: string
  openaiUrl: string
  openaiApiKey: string
  preferredAIProvider: 'ollama' | 'lmstudio' | 'openai' | null
  preferredAIModel: string | null
  openaiModels: string[]
  ollamaModels: string[]
  lmstudioModels: string[]
  openaiModelInputMode: 'auto' | 'manual'
  openaiManualModel: string
  corsProxyUrl: string
}

interface PromptSmithStore extends AppState {
  addTag: (tag: TaxonomyTag) => void
  removeTag: (tagId: string) => void
  toggleTag: (tag: TaxonomyTag) => void
  clearAllTags: () => void
  setCustomText: (text: string) => void
  setSelectedModel: (model: SupportedModel) => void
  toggleExplicit: () => void
  setActiveCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
  savePrompt: (name: string) => PromptTemplate
  loadPrompt: (prompt: PromptTemplate) => void
  deletePrompt: (id: string) => void
  addReferenceImage: (image: ReferenceImage) => void
  removeReferenceImage: (id: string) => void
  generatePrompt: () => string
  generateNegativePrompt: () => string
  setModelParameters: (params: ModelParameters) => void
  modelParameters: ModelParameters
  negativeIntelligence: NegativePromptIntelligence | null
  generateNegativeSuggestions: (_prompt: string) => void
  customNegativePrompt: string
  setCustomNegativePrompt: (text: string) => void
  // Quick access
  pinnedTags: string[]
  recentlyUsedTags: string[]
  pinTag: (tagId: string) => void
  unpinTag: (tagId: string) => void
  // Randomizer
  lastRandomizerSeed: number | null
  lastRandomizerVibe: string | null
  lastRandomizerIntent: string | null
  lastRandomizerStorySeed: string | null
  lastRandomizerMode: RandomizerMode
  lastRandomizerIntensity: 'light' | 'full'
  randomizePrompt: (options?: { vibe?: string; intent?: string; storySeed?: string; intensity?: 'light' | 'full'; seed?: number; mode?: RandomizerMode }) => RandomizerResult | null
  // AI settings
  aiSettings: AISettings
  updateAISettings: (settings: Partial<AISettings>) => void
  // Saved entities
  savedEntities: SavedEntity[]
  saveEntity: (name: string, kind: EntityKind, description?: string) => SavedEntity
  loadEntity: (entity: SavedEntity, mode?: 'replace' | 'append') => void
  deleteEntity: (id: string) => void
  updateEntity: (id: string, updates: Partial<SavedEntity>) => void
  exportEntities: () => string
  importEntities: (json: string) => number
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void
  // Wizard
  wizardCompleted: boolean
  setWizardCompleted: (completed: boolean) => void
  // Tag trigger words
  setTagTriggerWords: (tagId: string, triggerWords: string[]) => void
  // Undo / Redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  _saveHistory: () => void
  startHistoryBatch: () => void
  endHistoryBatch: () => void
}

export const usePromptSmithStore = create<PromptSmithStore>()(
  persist(
    (set, get) => ({
      selectedTags: [],
      customText: '',
      selectedModel: 'gpt-image',
      showExplicit: false,
      activeCategory: null,
      searchQuery: '',
      savedPrompts: [],
      referenceImages: [],
      negativeIntelligence: null,
      customNegativePrompt: '',
      modelParameters: {},
      pinnedTags: [],
      recentlyUsedTags: [],
      lastRandomizerSeed: null,
      lastRandomizerVibe: null,
      lastRandomizerIntent: null,
      lastRandomizerStorySeed: null,
      lastRandomizerMode: 'smart' as RandomizerMode,
      lastRandomizerIntensity: 'light' as const,
      aiSettings: {
        ollamaUrl: 'http://localhost:11434',
        lmStudioUrl: 'http://localhost:1234/v1',
        openaiUrl: '',
        openaiApiKey: '',
        preferredAIProvider: null,
        preferredAIModel: null,
        openaiModels: [],
        ollamaModels: [],
        lmstudioModels: [],
        openaiModelInputMode: 'auto',
        openaiManualModel: '',
        corsProxyUrl: 'https://prompt-smith.ebuberpg.workers.dev',
      },
      savedEntities: [],
      theme: 'light' as 'light' | 'dark',
      wizardCompleted: false,

      addTag: (tag) => {
        get()._saveHistory()
        set((state) => {
          const exists = state.selectedTags.find((t) => t.id === tag.id)
          if (exists) return state
          return {
            selectedTags: [
              ...state.selectedTags,
              { ...tag, selectedAt: Date.now() },
            ],
          }
        })
      },

      removeTag: (tagId) => {
        get()._saveHistory()
        set((state) => ({
          selectedTags: state.selectedTags.filter((t) => t.id !== tagId),
        }))
      },

      toggleTag: (tag) => {
        get()._saveHistory()
        set((state) => {
          const exists = state.selectedTags.find((t) => t.id === tag.id)
          if (exists) {
            return {
              selectedTags: state.selectedTags.filter((t) => t.id !== tag.id),
            }
          }
          const recent = [tag.id, ...state.recentlyUsedTags.filter(id => id !== tag.id)].slice(0, 12)
          return {
            selectedTags: [
              ...state.selectedTags,
              { ...tag, selectedAt: Date.now() },
            ],
            recentlyUsedTags: recent,
          }
        })
      },

      clearAllTags: () => {
        get()._saveHistory()
        set((state) => ({
          selectedTags: state.selectedTags.filter(t => state.pinnedTags.includes(t.id)),
        }))
      },

      setCustomText: (text) => {
        get()._saveHistory()
        set({ customText: text })
      },

      setSelectedModel: (model) => {
        get()._saveHistory()
        set({ selectedModel: model })
      },

      toggleExplicit: () =>
        set((state) => ({ showExplicit: !state.showExplicit })),

      setActiveCategory: (category) => set({ activeCategory: category }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      savePrompt: (name) => {
        const state = get()
        const prompt: PromptTemplate = {
          id: crypto.randomUUID(),
          name,
          selections: state.selectedTags,
          customText: state.customText,
          model: state.selectedModel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        }
        set((state) => ({ savedPrompts: [...state.savedPrompts, prompt] }))
        return prompt
      },

      loadPrompt: (prompt) => {
        get()._saveHistory()
        set({
          selectedTags: prompt.selections,
          customText: prompt.customText,
          selectedModel: prompt.model,
        })
      },

      deletePrompt: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
        })),

      addReferenceImage: (image) =>
        set((state) => ({
          referenceImages: [...state.referenceImages, image],
        })),

      removeReferenceImage: (id) =>
        set((state) => ({
          referenceImages: state.referenceImages.filter((i) => i.id !== id),
        })),

      setModelParameters: (params) => set({ modelParameters: params }),

      generatePrompt: () => {
        const state = get()
        return promptComposer.compose({
          tags: state.selectedTags,
          customText: state.customText,
          model: state.selectedModel,
          parameters: state.modelParameters,
        })
      },

      generateNegativePrompt: () => {
        const state = get()
        return negativePromptEngine.generateNegativePrompt(
          state.selectedTags,
          state.customText,
          state.customNegativePrompt,
          state.selectedModel
        )
      },

      generateNegativeSuggestions: () => {
        const state = get()
        const intelligence = negativePromptEngine.analyze(
          state.selectedTags,
          state.customText,
          state.selectedModel
        )
        set({ negativeIntelligence: intelligence })
      },

      setCustomNegativePrompt: (text) => set({ customNegativePrompt: text }),

      pinTag: (tagId) =>
        set((state) => ({
          pinnedTags: state.pinnedTags.includes(tagId)
            ? state.pinnedTags
            : [...state.pinnedTags, tagId],
        })),

      unpinTag: (tagId) =>
        set((state) => ({
          pinnedTags: state.pinnedTags.filter((id) => id !== tagId),
        })),

      randomizePrompt: (options = {}) => {
        try {
          const state = get()
          get()._saveHistory()
          const engine = new RandomizerEngine()
          const seed = options.seed ?? Math.floor(Math.random() * 2 ** 32)
          const lockedTagIds = state.pinnedTags
          const lockedTags = state.selectedTags.filter((t: TaxonomyTag) => lockedTagIds.includes(t.id))

          const result = engine.randomize({
            vibe: options.vibe,
            intent: options.intent,
            storySeed: options.storySeed,
            intensity: options.intensity ?? state.lastRandomizerIntensity,
            showExplicit: state.showExplicit,
            seed,
            mode: options.mode ?? state.lastRandomizerMode ?? 'coherence-aware',
            lockedTagIds,
            lockedTags,
          })
          const newTags = result.tags.filter((t: TaxonomyTag) => !lockedTagIds.includes(t.id))
          const combined = [
            ...lockedTags.map((t: TaxonomyTag) => ({ ...t, selectedAt: Date.now() })),
            ...newTags.map((t: TaxonomyTag) => ({ ...t, selectedAt: Date.now() })),
          ]

          set({
            selectedTags: combined,
            customText: '',
            lastRandomizerSeed: result.seed,
            lastRandomizerVibe: result.vibe,
            lastRandomizerIntent: result.intent,
            lastRandomizerStorySeed: options.storySeed ?? state.lastRandomizerStorySeed ?? null,
            lastRandomizerMode: result.mode,
            lastRandomizerIntensity: options.intensity ?? state.lastRandomizerIntensity,
          })
          return result
        } catch {
          return null
        }
      },

      updateAISettings: (settings) =>
        set((state) => ({
          aiSettings: { ...state.aiSettings, ...settings },
        })),

      saveEntity: (name, kind, description) => {
        const state = get()
        const entity: SavedEntity = {
          id: crypto.randomUUID(),
          name,
          kind,
          description,
          tags: [...state.selectedTags],
          customText: state.customText,
          model: state.selectedModel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isFavorite: false,
        }
        set((state) => ({ savedEntities: [...state.savedEntities, entity] }))
        return entity
      },

      loadEntity: (entity, mode = 'replace') => {
        get()._saveHistory()
        set((state) => {
          if (mode === 'replace') {
            return {
              selectedTags: entity.tags.map((t) => ({ ...t, selectedAt: Date.now() })),
              customText: entity.customText,
              selectedModel: entity.model,
            }
          }
          const existingIds = new Set(state.selectedTags.map((t) => t.id))
          const newTags = entity.tags.filter((t) => !existingIds.has(t.id))
          return {
            selectedTags: [
              ...state.selectedTags,
              ...newTags.map((t) => ({ ...t, selectedAt: Date.now() })),
            ],
          }
        })
      },

      deleteEntity: (id) =>
        set((state) => ({
          savedEntities: state.savedEntities.filter((e) => e.id !== id),
        })),

      updateEntity: (id, updates) =>
        set((state) => ({
          savedEntities: state.savedEntities.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          ),
        })),

      exportEntities: () => {
        const state = get()
        return JSON.stringify(state.savedEntities, null, 2)
      },

      importEntities: (json) => {
        try {
          const entities: SavedEntity[] = JSON.parse(json)
          if (!Array.isArray(entities)) return 0
          set((state) => ({
            savedEntities: [...state.savedEntities, ...entities],
          }))
          return entities.length
        } catch {
          return 0
        }
      },

      setTagTriggerWords: (tagId, triggerWords) => {
        set((state) => ({
          selectedTags: state.selectedTags.map((t) =>
            t.id === tagId ? { ...t, triggerWords } : t
          ),
        }))
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }))
      },

      setWizardCompleted: (completed) => {
        set({ wizardCompleted: completed })
      },

      _saveHistory: () => {
        if (isHistoryBatching) return
        const state = get()
        useHistoryStore.getState().saveSnapshot(
          createSnapshot(state.selectedTags, state.customText, state.selectedModel)
        )
      },

      startHistoryBatch: () => {
        isHistoryBatching = true
      },

      endHistoryBatch: () => {
        isHistoryBatching = false
      },

      undo: () => {
        const state = get()
        const currentSnapshot = createSnapshot(
          state.selectedTags,
          state.customText,
          state.selectedModel
        )
        const previous = useHistoryStore.getState().undo(currentSnapshot)
        if (previous) {
          set({
            selectedTags: previous.selectedTags,
            customText: previous.customText,
            selectedModel: previous.selectedModel,
          })
        }
      },

      redo: () => {
        const state = get()
        const currentSnapshot = createSnapshot(
          state.selectedTags,
          state.customText,
          state.selectedModel
        )
        const next = useHistoryStore.getState().redo(currentSnapshot)
        if (next) {
          set({
            selectedTags: next.selectedTags,
            customText: next.customText,
            selectedModel: next.selectedModel,
          })
        }
      },

      canUndo: () => useHistoryStore.getState().canUndo(),
      canRedo: () => useHistoryStore.getState().canRedo(),
    }),
    {
      name: 'promptsmith-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version) => {
        const s = persistedState as Record<string, unknown>
        if (version < 1) {
          const aiSettings = s.aiSettings as Record<string, unknown> | undefined
          if (aiSettings && (!aiSettings.corsProxyUrl || aiSettings.corsProxyUrl === '')) {
            aiSettings.corsProxyUrl = 'https://prompt-smith.ebuberpg.workers.dev'
          }
        }
        if (version < 2) {
          // Migrate old model IDs to April 2026 lineup
          const MODEL_ID_MAP: Record<string, string> = {
            'dalle-3': 'gpt-image',
            'z-image': 'flux',
          }
          const currentModel = s.selectedModel as string | undefined
          if (currentModel && MODEL_ID_MAP[currentModel]) {
            s.selectedModel = MODEL_ID_MAP[currentModel]
          }
          // Migrate saved prompts
          const savedPrompts = s.savedPrompts as Array<{ model?: string }> | undefined
          if (savedPrompts && Array.isArray(savedPrompts)) {
            for (const prompt of savedPrompts) {
              if (prompt.model && MODEL_ID_MAP[prompt.model]) {
                prompt.model = MODEL_ID_MAP[prompt.model]
              }
            }
          }
          // Migrate saved entities
          const savedEntities = s.savedEntities as Array<{ model?: string }> | undefined
          if (savedEntities && Array.isArray(savedEntities)) {
            for (const entity of savedEntities) {
              if (entity.model && MODEL_ID_MAP[entity.model]) {
                entity.model = MODEL_ID_MAP[entity.model]
              }
            }
          }
        }
        return s as unknown as PromptSmithStore
      },
      partialize: (state) => ({
        selectedTags: state.selectedTags,
        customText: state.customText,
        selectedModel: state.selectedModel,
        showExplicit: state.showExplicit,
        savedPrompts: state.savedPrompts,
        modelParameters: state.modelParameters,
        pinnedTags: state.pinnedTags,
        recentlyUsedTags: state.recentlyUsedTags,
        lastRandomizerSeed: state.lastRandomizerSeed,
        lastRandomizerVibe: state.lastRandomizerVibe,
        lastRandomizerIntent: state.lastRandomizerIntent,
        lastRandomizerStorySeed: state.lastRandomizerStorySeed,
        lastRandomizerMode: state.lastRandomizerMode,
        lastRandomizerIntensity: state.lastRandomizerIntensity,
        aiSettings: state.aiSettings,
        savedEntities: state.savedEntities,
        theme: state.theme,
        wizardCompleted: state.wizardCompleted,
      }),
    }
  )
)
