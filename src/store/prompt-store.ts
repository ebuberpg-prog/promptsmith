import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  TaxonomyTag,
  PromptTemplate,
  SupportedModel,
  ReferenceImage,
  AppState,
  DNARecipe,
  PromptVersion,
  StyleTransferMatrix,
  NegativePromptIntelligence,
  ModelParameters,
  BatchGeneration,
  ABTest,
  PromptVariation,
  PromptDiffResult,
  SavedEntity,
  EntityKind,
} from '@/types'
import { RandomizerEngine, type RandomizerResult } from '@/services/randomizer-engine'
import type { RandomizerMode } from '@/data/randomizer-modes'
import { promptComposer } from '@/services/prompt-composer'
import { negativePromptEngine } from '@/services/negative-prompt-engine'
import { styleCompatEngine } from '@/services/style-compat-engine'
import { mutationEngine, type MutationOptions } from '@/services/mutation-engine'
import { promptDiffEngine } from '@/services/prompt-diff-engine'
import { compressionEngine } from '@/services/compression-engine'
import { useHistoryStore, createSnapshot } from './history-store'

let isHistoryBatching = false

export interface AISettings {
  ollamaUrl: string
  lmStudioUrl: string
  openaiUrl: string
  openaiApiKey: string
  a1111Url: string
  comfyuiUrl: string
  drawthingsUrl: string
  preferredAIProvider: 'ollama' | 'lmstudio' | 'openai' | null
  preferredAIModel: string | null
  preferredImageProvider: 'a1111' | 'comfyui' | 'drawthings' | null
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
  dnaRecipes: DNARecipe[]
  createDNARecipe: (name: string, description: string) => DNARecipe
  loadDNARecipe: (recipe: DNARecipe) => void
  deleteDNARecipe: (id: string) => void
  promptVersions: PromptVersion[]
  currentVersion: number
  createVersion: (notes?: string) => PromptVersion
  loadVersion: (version: number) => void
  styleMatrix: StyleTransferMatrix[]
  analyzeStyleTransfer: (sourceStyles: string[], targetStyles: string[]) => void
  negativeIntelligence: NegativePromptIntelligence | null
  generateNegativeSuggestions: (prompt: string) => void
  customNegativePrompt: string
  setCustomNegativePrompt: (text: string) => void
  batchGenerations: BatchGeneration[]
  createBatchGeneration: (name: string, basePrompt: string, variables: Record<string, string[]>) => BatchGeneration
  abTests: ABTest[]
  createABTest: (name: string, promptA: string, promptB: string) => ABTest
  selectedMutationType: PromptVariation['type']
  setMutationType: (type: PromptVariation['type']) => void
  promptMutations: PromptVariation[]
  generateMutations: (prompt: string) => void
  selectMutation: (variation: PromptVariation) => void
  promptDiffs: PromptDiffResult[]
  comparePrompts: (promptA: string, promptB: string) => void
  compressPrompt: (prompt: string, maxTokens: number) => string
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
      selectedModel: 'midjourney',
      showExplicit: false,
      activeCategory: null,
      searchQuery: '',
      savedPrompts: [],
      referenceImages: [],
      dnaRecipes: [],
      promptVersions: [],
      currentVersion: 0,
      styleMatrix: [],
      negativeIntelligence: null,
      customNegativePrompt: '',
      modelParameters: {},
      batchGenerations: [],
      abTests: [],
      selectedMutationType: 'style_shift',
      promptMutations: [],
      promptDiffs: [],
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
        a1111Url: 'http://localhost:7860',
        comfyuiUrl: 'http://localhost:8188',
        drawthingsUrl: 'http://localhost:3820',
        preferredAIProvider: null,
        preferredAIModel: null,
        preferredImageProvider: null,
        openaiModels: [],
        ollamaModels: [],
        lmstudioModels: [],
        openaiModelInputMode: 'auto',
        openaiManualModel: '',
        corsProxyUrl: 'https://prompt-smith.ebuberpg.workers.dev',
      },
      savedEntities: [],
      theme: 'dark' as 'light' | 'dark',
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
          // Push to recently used (circular buffer of 12)
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
          version: state.currentVersion + 1,
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
          currentVersion: prompt.version || 0,
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

      createDNARecipe: (name, description) => {
        const state = get()
        const recipe: DNARecipe = {
          id: crypto.randomUUID(),
          name,
          description,
          tags: state.selectedTags,
          styleWeights: {},
          model: state.selectedModel,
          createdAt: Date.now(),
          isPublic: false,
          usageCount: 0,
        }
        set((state) => ({ dnaRecipes: [...state.dnaRecipes, recipe] }))
        return recipe
      },

      loadDNARecipe: (recipe) => {
        get()._saveHistory()
        set({
          selectedTags: recipe.tags,
          selectedModel: recipe.model,
        })
      },

      deleteDNARecipe: (id) =>
        set((state) => ({
          dnaRecipes: state.dnaRecipes.filter((r) => r.id !== id),
        })),

      createVersion: (notes) => {
        const state = get()
        const prompt = state.generatePrompt()
        const version: PromptVersion = {
          id: crypto.randomUUID(),
          promptId: '',
          version: state.currentVersion + 1,
          content: prompt,
          negativeContent: state.generateNegativePrompt(),
          model: state.selectedModel,
          parameters: state.modelParameters,
          createdAt: Date.now(),
          notes,
        }
        set((state) => ({
          promptVersions: [...state.promptVersions, version],
          currentVersion: version.version,
        }))
        return version
      },

      loadVersion: (versionNum) => {
        const state = get()
        const version = state.promptVersions.find((v) => v.version === versionNum)
        if (version) {
          set({ currentVersion: versionNum })
        }
      },

      analyzeStyleTransfer: (sourceStyles, targetStyles) => {
        const matrix = styleCompatEngine.analyzeCompatibility(sourceStyles, targetStyles)
        set((state) => ({ styleMatrix: [...state.styleMatrix, matrix] }))
      },

      generateNegativeSuggestions: (prompt) => {
        const state = get()
        const intelligence = negativePromptEngine.analyze(
          state.selectedTags,
          state.customText,
          state.selectedModel
        )
        set({ negativeIntelligence: intelligence })
      },

      setCustomNegativePrompt: (text) => set({ customNegativePrompt: text }),

      createBatchGeneration: (name, basePrompt, variables) => {
        const keys = Object.keys(variables)
        const values = Object.values(variables)
        const generatedPrompts: string[] = []

        const cartesianProduct = (arrs: string[][]): string[][] => {
          return arrs.reduce(
            (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
            [[]] as string[][]
          )
        }

        const combinations = cartesianProduct(values)
        for (const combo of combinations) {
          let prompt = basePrompt
          keys.forEach((key, i) => {
            prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), combo[i])
          })
          generatedPrompts.push(prompt)
        }

        const batch: BatchGeneration = {
          id: crypto.randomUUID(),
          name,
          basePrompt,
          permutations: [{
            id: crypto.randomUUID(),
            variables,
            generatedPrompts,
          }],
          status: 'pending',
          createdAt: Date.now(),
        }

        set((state) => ({ batchGenerations: [...state.batchGenerations, batch] }))
        return batch
      },

      createABTest: (name, promptA, promptB) => {
        const test: ABTest = {
          id: crypto.randomUUID(),
          name,
          variantA: { id: 'a', prompt: promptA, weight: 0.5 },
          variantB: { id: 'b', prompt: promptB, weight: 0.5 },
          metrics: { impressions: 0, clicks: 0, conversions: 0 },
          status: 'running',
          createdAt: Date.now(),
        }
        set((state) => ({ abTests: [...state.abTests, test] }))
        return test
      },

      setMutationType: (type) => set({ selectedMutationType: type }),

      generateMutations: (prompt) => {
        const state = get()
        const variations = mutationEngine.generateMutations(
          state.selectedTags,
          state.customText,
          state.selectedModel,
          { maxVariations: 5, types: [state.selectedMutationType] }
        )
        set({ promptMutations: variations })
      },

      selectMutation: (variation) => {
        get()._saveHistory()
        set({ customText: variation.content })
      },

      comparePrompts: (promptA, promptB) => {
        const rawResult = promptDiffEngine.compareRaw(promptA, promptB)
        const mapped: PromptDiffResult[] = rawResult.segments.map((s, i) => ({
          type: s.type,
          segment: s.content,
          position: i,
          significance: s.significance,
          tagId: s.tagId,
          category: s.category,
          description: s.description,
        }))
        set({ promptDiffs: mapped })
      },

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

      compressPrompt: (prompt, maxTokens) => {
        const state = get()
        const result = compressionEngine.compress(
          state.selectedTags,
          state.customText,
          state.selectedModel,
          'hybrid',
          maxTokens
        )
        return result.compressedPrompt
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version) => {
        const s = persistedState as Record<string, unknown>
        if (version < 1) {
          const aiSettings = s.aiSettings as Record<string, unknown> | undefined
          if (aiSettings && (!aiSettings.corsProxyUrl || aiSettings.corsProxyUrl === '')) {
            aiSettings.corsProxyUrl = 'https://prompt-smith.ebuberpg.workers.dev'
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
        dnaRecipes: state.dnaRecipes,
        promptVersions: state.promptVersions,
        currentVersion: state.currentVersion,
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
