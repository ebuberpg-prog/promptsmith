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
import { getModelConfig } from '@/data/model-configs'

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
  // Tag trigger words
  setTagTriggerWords: (tagId: string, triggerWords: string[]) => void
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
        corsProxyUrl: '',
      },
      savedEntities: [],

      addTag: (tag) =>
        set((state) => {
          const exists = state.selectedTags.find((t) => t.id === tag.id)
          if (exists) return state
          return {
            selectedTags: [
              ...state.selectedTags,
              { ...tag, selectedAt: Date.now() },
            ],
          }
        }),

      removeTag: (tagId) =>
        set((state) => ({
          selectedTags: state.selectedTags.filter((t) => t.id !== tagId),
        })),

      toggleTag: (tag) =>
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
        }),

      clearAllTags: () => set((state) => ({
        selectedTags: state.selectedTags.filter(t => state.pinnedTags.includes(t.id)),
      })),

      setCustomText: (text) => set({ customText: text }),

      setSelectedModel: (model) => set({ selectedModel: model }),

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

      loadPrompt: (prompt) =>
        set({
          selectedTags: prompt.selections,
          customText: prompt.customText,
          selectedModel: prompt.model,
          currentVersion: prompt.version || 0,
        }),

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
        const modelConfig = getModelConfig(state.selectedModel)
        const parts: string[] = []

        const orderedTags = [...state.selectedTags].sort((a, b) => {
          const categoryOrder = [
            'subject',
            'body_types',
            'breast',
            'buttocks',
            'male_chest',
            'skin',
            'age',
            'ethnicity',
            'anthropomorphic',
            'fantasy_races',
            'clothing',
            'poses',
            'gestures',
            'expressions',
            'environment',
            'lighting',
            'camera',
            'style',
            'quality',
          ]

          const aOrder = categoryOrder.findIndex((c) => a.id.startsWith(c))
          const bOrder = categoryOrder.findIndex((c) => b.id.startsWith(c))

          return (aOrder === -1 ? 99 : aOrder) - (bOrder === -1 ? 99 : bOrder)
        })

        const formatTag = (tag: typeof state.selectedTags[0]) => {
          const triggerPrefix = tag.triggerWords && tag.triggerWords.length > 0
            ? (modelConfig.triggerWordStyle === 'prefix'
              ? tag.triggerWords.join(', ') + ', '
              : modelConfig.triggerWordStyle === 'inline'
              ? tag.triggerWords.join(' ') + ' '
              : '')
            : ''

          let label = tag.label
          if (tag.customWeight && tag.customWeight !== 1.0 && modelConfig.supportsWeighting) {
            label = modelConfig.weightFormat(tag.label, tag.customWeight)
          }
          return triggerPrefix + label
        }

        const labels = orderedTags.map(formatTag)

        if (labels.length > 0) {
          if (modelConfig.promptStyle === 'prose') {
            parts.push(labels.join(', '))
          } else {
            parts.push(labels.join(', '))
          }
        }

        if (state.customText.trim()) {
          parts.push(state.customText.trim())
        }

        let prompt = parts.join(', ')

        if (modelConfig.promptStyle === 'midjourney-params') {
          const params = state.modelParameters
          if (params.aspectRatio) prompt += ` --ar ${params.aspectRatio}`
          if (params.style) prompt += ` --s ${params.style}`
          if (params.chaos) prompt += ` --c ${params.chaos}`
          if (params.quality) prompt += ` --q ${params.quality}`
          if (!params.aspectRatio && !params.style) prompt += ' --ar 16:9'
        }

        return prompt
      },

      generateNegativePrompt: () => {
        const state = get()
        const suggestions = state.negativeIntelligence?.suggestedNegatives || []

        if (state.selectedModel === 'midjourney') {
          return ''
        }

        if (state.customNegativePrompt.trim()) {
          return state.customNegativePrompt.trim()
        }

        if (suggestions.length > 0) {
          return suggestions
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 10)
            .map((s) => s.text)
            .join(', ')
        }

        const universalNegatives = [
          'low quality',
          'worst quality',
          'normal quality',
          'jpeg artifacts',
          'blurry',
          'deformed',
          'ugly',
          'duplicate',
          'mutated hands',
          'poorly drawn face',
          'bad anatomy',
          'bad proportions',
          'extra limbs',
          'disfigured',
          'gross proportions',
          'malformed limbs',
          'missing arms',
          'missing legs',
          'extra arms',
          'extra legs',
          'fused fingers',
          'too many fingers',
          'long neck',
          'username',
          'watermark',
          'text',
          'signature',
        ]

        return universalNegatives.join(', ')
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
        const scores: number[][] = []
        for (const _source of sourceStyles) {
          const row: number[] = []
          for (const _target of targetStyles) {
            void _target
            row.push(Math.random() * 0.5 + 0.5)
          }
          void _source
          scores.push(row)
        }
        const matrix: StyleTransferMatrix = {
          id: crypto.randomUUID(),
          name: 'Style Transfer',
          sourceStyles,
          targetStyles,
          compatibilityScores: scores,
        }
        set((state) => ({ styleMatrix: [...state.styleMatrix, matrix] }))
      },

      generateNegativeSuggestions: (prompt) => {
        const detectedIssues: string[] = []
        const promptLower = prompt.toLowerCase()

        if (promptLower.includes('hand') || promptLower.includes('finger')) {
          detectedIssues.push('hands', 'fingers')
        }
        if (promptLower.includes('face') || promptLower.includes('portrait')) {
          detectedIssues.push('face', 'anatomy')
        }
        if (promptLower.includes('multiple') || promptLower.includes('group')) {
          detectedIssues.push('duplicates')
        }

        const suggestedNegatives = [
          { text: 'lowres', reason: 'Quality fix', priority: 1, category: 'quality' },
          { text: 'bad anatomy', reason: 'Anatomy fix', priority: 1, category: 'anatomy' },
          { text: 'bad hands', reason: 'Hand fix', priority: 1, category: 'hands' },
          { text: 'extra fingers', reason: 'Finger fix', priority: 2, category: 'hands' },
          { text: 'ugly', reason: 'Quality fix', priority: 1, category: 'quality' },
          { text: 'duplicate', reason: 'Duplicate fix', priority: 1, category: 'artifacts' },
          { text: 'mutated', reason: 'Mutation fix', priority: 1, category: 'artifacts' },
        ]

        const intelligence: NegativePromptIntelligence = {
          contextAnalysis: {
            subject: 'detected',
            environment: 'detected',
            style: 'detected',
            detectedIssues,
          },
          suggestedNegatives,
          learnedPatterns: [],
        }

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
        const variations: PromptVariation[] = []
        const words = prompt.split(', ')

        const styleShifts = ['more realistic', 'more artistic', 'more abstract', 'more cinematic']
        for (const style of styleShifts) {
          variations.push({
            id: crypto.randomUUID(),
            content: `${prompt}, ${style}`,
            type: 'style_shift',
            confidence: 0.9,
            description: `Added ${style} style`,
          })
        }

        for (let i = 0; i < Math.min(3, words.length); i++) {
          variations.push({
            id: crypto.randomUUID(),
            content: prompt.replace(words[i], `(${words[i]}:1.3)`),
            type: 'weight_adjust',
            confidence: 0.85,
            description: `Increased weight on '${words[i]}'`,
          })
        }

        const synonyms: Record<string, string[]> = {
          beautiful: ['gorgeous', 'stunning', 'elegant'],
          dark: ['shadowy', 'dim', 'mysterious'],
          bright: ['vibrant', 'luminous', 'radiant'],
        }

        for (const [word, syns] of Object.entries(synonyms)) {
          if (prompt.toLowerCase().includes(word)) {
            for (const syn of syns) {
              variations.push({
                id: crypto.randomUUID(),
                content: prompt.replace(new RegExp(word, 'gi'), syn),
                type: 'synonym',
                confidence: 0.8,
                description: `Replaced '${word}' with '${syn}'`,
              })
            }
          }
        }

        set({ promptMutations: variations.slice(0, 5) })
      },

      selectMutation: (variation) => {
        set({ customText: variation.content })
      },

      comparePrompts: (promptA, promptB) => {
        const wordsA = new Set(promptA.split(', '))
        const wordsB = new Set(promptB.split(', '))

        const differences: PromptDiffResult[] = []

        for (const word of wordsB) {
          if (!wordsA.has(word)) {
            differences.push({
              type: 'added',
              segment: word,
              position: promptB.indexOf(word),
              significance: 'high',
            })
          }
        }

        for (const word of wordsA) {
          if (!wordsB.has(word)) {
            differences.push({
              type: 'removed',
              segment: word,
              position: promptA.indexOf(word),
              significance: 'high',
            })
          }
        }

        set({ promptDiffs: differences })
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

      compressPrompt: (prompt, maxTokens) => {
        const words = prompt.split(', ')
        if (words.length <= maxTokens) return prompt

        const priorityKeywords = ['subject', 'style', 'lighting', 'composition', 'quality']
        const preserved: string[] = []
        const removed: string[] = []

        for (const word of words) {
          const wordLower = word.toLowerCase()
          const isPriority = priorityKeywords.some((pk) => wordLower.includes(pk))
          
          if (isPriority || preserved.length < maxTokens) {
            preserved.push(word)
          } else {
            removed.push(word)
          }
        }

        return preserved.join(', ')
      },
    }),
    {
      name: 'promptsmith-storage',
      storage: createJSONStorage(() => localStorage),
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
      }),
    }
  )
)
