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
  ContentVisibility,
  WorkspaceDepth,
  WorkspaceView,
  DraftSnapshot,
  FormatterProfile,
  PromptVersion,
  StorageDurability,
  DraftPersistenceState,
  AIEnhancementResult,
  LocalAIProviderId,
} from '@/types'
import { RandomizerEngine, type RandomizerResult } from '@/services/randomizer-engine'
import type { RandomizerMode } from '@/data/randomizer-modes'
import { negativePromptEngine } from '@/services/negative-prompt-engine'
import { useHistoryStore, createSnapshot } from './history-store'
import { migratePromptState } from './migrate-prompt-state'
import { flushPendingState, indexedDbStorage, requestDurableStorage } from './indexeddb-storage'
import { DEFAULT_FORMATTER_PROFILE_ID, getFormatterProfile, MODEL_PROFILE_MAP, validateFormatterTemplate } from '@/data/formatter-profiles'
import { composeWithProfile, detectPromptVariables } from '@/services/formatter-service'
import { createMuseBackup, mergeById, mergePromptBackups, parseMuseBackup } from '@/services/backup-service'
import { normalizeTaxonomyTag, normalizeTaxonomyTags } from '@/utils/taxonomy-tag'

let isHistoryBatching = false

export interface AISettings {
  ollamaUrl: string
  lmStudioUrl: string
  openAICompatibleUrl: string
  anthropicCompatibleUrl: string
  apiGatewayUrl: string
  useApiGateway: boolean
  preferredAIProvider: LocalAIProviderId | null
  providerModels: Partial<Record<LocalAIProviderId, string>>
  ollamaModels: string[]
  lmstudioModels: string[]
}

interface PromptSmithStore extends AppState {
  addTag: (tag: TaxonomyTag) => void
  removeTag: (tagId: string) => void
  toggleTag: (tag: TaxonomyTag) => void
  clearAllTags: () => void
  setCustomText: (text: string) => void
  setDraftPersistenceState: (state: DraftPersistenceState) => void
  flushDraft: () => Promise<void>
  markEnhancement: (result: AIEnhancementResult) => void
  applyAIEnhancement: (result: AIEnhancementResult, recognizedTags: TaxonomyTag[]) => number
  startNewPrompt: () => void
  setShowInspiration: (show: boolean) => void
  setSelectedModel: (model: SupportedModel) => void
  setFormatterProfile: (profileId: string) => void
  saveFormatterProfile: (profile: FormatterProfile) => { ok: boolean; error?: string }
  deleteFormatterProfile: (profileId: string) => void
  setPromptVariable: (name: string, value: string) => void
  setContentVisibility: (visibility: ContentVisibility) => void
  toggleContentVisibility: () => void
  setWorkspaceDepth: (depth: WorkspaceDepth) => void
  setWorkspaceView: (view: WorkspaceView) => void
  setActiveCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
  savePrompt: (name: string, source?: PromptTemplate['source']) => PromptTemplate
  savePromptAsNew: (name: string, source?: PromptTemplate['source']) => PromptTemplate
  savePromptToExisting: (promptId: string, source?: PromptTemplate['source']) => PromptTemplate | null
  loadPrompt: (prompt: PromptTemplate) => void
  deletePrompt: (id: string) => void
  renamePrompt: (id: string, name: string) => void
  duplicatePrompt: (id: string) => PromptTemplate | null
  toggleFavoritePrompt: (id: string) => void
  updatePromptCover: (id: string, coverImageDataUrl?: string) => void
  importPrompt: (prompt: PromptTemplate) => PromptTemplate
  captureDraftSnapshot: (source?: DraftSnapshot['source']) => DraftSnapshot | null
  restoreDraftSnapshot: (snapshotId: string) => boolean
  restorePromptVersion: (promptId: string, versionId: string) => boolean
  duplicatePromptVersion: (promptId: string, versionId: string) => PromptTemplate | null
  deletePromptVersion: (promptId: string, versionId: string) => void
  exportCompleteBackup: () => string
  restoreCompleteBackup: (json: string, mode?: 'merge' | 'replace') => { ok: boolean; error?: string }
  setStorageDurability: (durability: StorageDurability) => void
  requestPersistentStorage: () => Promise<StorageDurability>
  addReferenceImage: (image: ReferenceImage) => void
  updateReferenceImage: (id: string, updates: Partial<ReferenceImage>) => void
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
  randomizePrompt: (options?: { vibe?: string; intent?: string; storySeed?: string; intensity?: 'light' | 'full'; seed?: number; mode?: RandomizerMode; protectCurrent?: boolean }) => RandomizerResult | null
  applyRandomizerResult: (result: RandomizerResult, protectCurrent?: boolean) => void
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
  setTagWeight: (tagId: string, weight: number) => void
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
      selectedFormatterProfileId: DEFAULT_FORMATTER_PROFILE_ID,
      customFormatterProfiles: [],
      promptVariables: [],
      promptVersions: {},
      draftSnapshots: [],
      storageDurability: 'best-effort' as StorageDurability,
      lastBackupAt: null,
      activePromptId: null,
      draftDirty: false,
      draftPersistenceState: 'saved' as DraftPersistenceState,
      lastEnhancement: null,
      showInspiration: true,
      contentVisibility: 'filtered' as ContentVisibility,
      workspaceDepth: 'simple' as WorkspaceDepth,
      workspaceView: 'home' as WorkspaceView,
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
        openAICompatibleUrl: 'https://api.openai.com/v1',
        anthropicCompatibleUrl: 'https://api.anthropic.com/v1',
        apiGatewayUrl: 'https://prompt-smith.ebuberpg.workers.dev',
        useApiGateway: true,
        preferredAIProvider: null,
        providerModels: {},
        ollamaModels: [],
        lmstudioModels: [],
      },
      savedEntities: [],
      theme: 'light' as 'light' | 'dark',
      wizardCompleted: false,

      addTag: (tag) => {
        const normalizedTag = normalizeTaxonomyTag(tag)
        get()._saveHistory()
        set((state) => {
          const exists = state.selectedTags.find((t) => t.id === normalizedTag.id)
          if (exists) return state
          return {
            selectedTags: [
              ...state.selectedTags,
              { ...normalizedTag, selectedAt: Date.now() },
            ],
            draftDirty: true,
          }
        })
      },

      removeTag: (tagId) => {
        get()._saveHistory()
        set((state) => ({
          selectedTags: state.selectedTags.filter((t) => t.id !== tagId),
          draftDirty: true,
        }))
      },

      toggleTag: (tag) => {
        const normalizedTag = normalizeTaxonomyTag(tag)
        get()._saveHistory()
        set((state) => {
          const exists = state.selectedTags.find((t) => t.id === normalizedTag.id)
          if (exists) {
            return {
              selectedTags: state.selectedTags.filter((t) => t.id !== normalizedTag.id),
              draftDirty: true,
            }
          }
          const recent = [normalizedTag.id, ...state.recentlyUsedTags.filter(id => id !== normalizedTag.id)].slice(0, 12)
          return {
            selectedTags: [
              ...state.selectedTags,
              { ...normalizedTag, selectedAt: Date.now() },
            ],
            recentlyUsedTags: recent,
            draftDirty: true,
          }
        })
      },

      clearAllTags: () => {
        get()._saveHistory()
        set((state) => ({
          selectedTags: state.selectedTags.filter(t => state.pinnedTags.includes(t.id)),
          draftDirty: true,
        }))
      },

      setCustomText: (text) => {
        set((state) => ({ customText: text, promptVariables: detectPromptVariables(text, state.promptVariables), draftDirty: true }))
      },

      setDraftPersistenceState: (draftPersistenceState) => set({ draftPersistenceState }),
      flushDraft: async () => { await flushPendingState() },
      markEnhancement: (lastEnhancement) => set({ lastEnhancement, draftDirty: true }),
      applyAIEnhancement: (lastEnhancement, recognizedTags) => {
        const state = get()
        const selectedIds = new Set(state.selectedTags.map((tag) => tag.id))
        const additions = recognizedTags.filter((tag) => !selectedIds.has(tag.id)).map(normalizeTaxonomyTag)
        set({
          customText: lastEnhancement.text,
          promptVariables: detectPromptVariables(lastEnhancement.text, state.promptVariables),
          selectedTags: [...state.selectedTags, ...additions.map((tag) => ({ ...tag, selectedAt: Date.now() }))],
          lastEnhancement,
          draftDirty: true,
        })
        return additions.length
      },
      startNewPrompt: () => {
        const state = get()
        if (state.customText || state.selectedTags.length) get().captureDraftSnapshot('manual')
        get()._saveHistory()
        set({
          customText: '',
          selectedTags: [],
          customNegativePrompt: '',
          modelParameters: {},
          promptVariables: [],
          activePromptId: null,
          draftDirty: false,
          lastEnhancement: null,
          negativeIntelligence: null,
        })
      },
      setShowInspiration: (showInspiration) => set({ showInspiration }),

      setSelectedModel: (model) => {
        get()._saveHistory()
        get().captureDraftSnapshot('manual')
        set({ selectedModel: model, selectedFormatterProfileId: MODEL_PROFILE_MAP[model], draftDirty: true })
      },

      setFormatterProfile: (profileId) => {
        const state = get()
        const profile = getFormatterProfile(profileId, state.customFormatterProfiles)
        get().captureDraftSnapshot('manual')
        set({ selectedFormatterProfileId: profile.id, ...(profile.model ? { selectedModel: profile.model } : {}), draftDirty: true })
      },

      saveFormatterProfile: (profile) => {
        if (profile.isBuiltIn) return { ok: false, error: 'Built-in profiles must be duplicated before editing.' }
        if (profile.template) {
          const error = validateFormatterTemplate(profile.template)
          if (error) return { ok: false, error }
        }
        set((state) => ({ customFormatterProfiles: [...state.customFormatterProfiles.filter((item) => item.id !== profile.id), profile] }))
        return { ok: true }
      },

      deleteFormatterProfile: (profileId) => set((state) => ({
        customFormatterProfiles: state.customFormatterProfiles.filter((profile) => profile.id !== profileId),
        selectedFormatterProfileId: state.selectedFormatterProfileId === profileId ? DEFAULT_FORMATTER_PROFILE_ID : state.selectedFormatterProfileId,
      })),

      setPromptVariable: (name, value) => set((state) => ({
        promptVariables: state.promptVariables.map((variable) => variable.name === name ? { ...variable, value } : variable),
      })),

      setContentVisibility: (contentVisibility) => set({ contentVisibility }),

      toggleContentVisibility: () =>
        set((state) => ({ contentVisibility: state.contentVisibility === 'all' ? 'filtered' : 'all' })),

      setWorkspaceDepth: (workspaceDepth) => set({ workspaceDepth }),

      setWorkspaceView: (workspaceView) => { set({ workspaceView }); void flushPendingState() },

      setActiveCategory: (category) => set({ activeCategory: category }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      savePrompt: (name, source = 'manual') => {
        const state = get()
        const now = Date.now()
        const existing = state.activePromptId ? state.savedPrompts.find((item) => item.id === state.activePromptId) : undefined
        const promptId = existing?.id ?? crypto.randomUUID()
        const previousVersions = state.promptVersions[promptId] ?? []
        const nextVersion = Math.max(0, ...previousVersions.map((item) => item.version)) + 1
        const prompt: PromptTemplate = {
          ...existing,
          id: promptId,
          name,
          selections: state.selectedTags,
          customText: state.customText,
          model: state.selectedModel,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          lastOpenedAt: now,
          isFavorite: existing?.isFavorite ?? false,
          source,
          version: nextVersion,
          formatterProfileId: state.selectedFormatterProfileId,
          variables: state.promptVariables,
        }
        const version: PromptVersion = {
          id: crypto.randomUUID(), promptId: prompt.id, version: nextVersion, content: state.generatePrompt(), negativeContent: state.generateNegativePrompt(),
          model: state.selectedModel, formatterProfileId: state.selectedFormatterProfileId, parameters: state.modelParameters, createdAt: now, notes: source,
          selectedTags: JSON.parse(JSON.stringify(state.selectedTags)), customText: state.customText,
        }
        const previous = previousVersions[previousVersions.length - 1]
        const hasChanged = !previous || JSON.stringify([previous.content, previous.customText, previous.selectedTags, previous.model, previous.parameters]) !== JSON.stringify([version.content, version.customText, version.selectedTags, version.model, version.parameters])
        const savedPrompt = hasChanged ? prompt : { ...prompt, version: existing?.version ?? previous?.version ?? 1 }
        set((current) => ({
          activePromptId: savedPrompt.id,
          savedPrompts: existing ? current.savedPrompts.map((item) => item.id === savedPrompt.id ? savedPrompt : item) : [...current.savedPrompts, savedPrompt],
          promptVersions: hasChanged ? { ...current.promptVersions, [prompt.id]: [...previousVersions, version].slice(-25) } : current.promptVersions,
          draftDirty: false,
        }))
        void get().requestPersistentStorage()
        return savedPrompt
      },

      savePromptAsNew: (name, source = 'manual') => {
        set({ activePromptId: null })
        return get().savePrompt(name, source)
      },

      savePromptToExisting: (promptId, source = 'composer') => {
        const target = get().savedPrompts.find((prompt) => prompt.id === promptId)
        if (!target) return null
        set({ activePromptId: target.id })
        return get().savePrompt(target.name, source)
      },

      loadPrompt: (prompt) => {
        get().captureDraftSnapshot(prompt.isBuiltIn || prompt.isUserTemplate ? 'template' : 'manual')
        get()._saveHistory()
        const now = Date.now()
        set((state) => ({
          selectedTags: prompt.selections,
          customText: prompt.customText,
          selectedModel: prompt.model,
          selectedFormatterProfileId: prompt.formatterProfileId ?? MODEL_PROFILE_MAP[prompt.model],
          activePromptId: prompt.id,
          draftDirty: false,
          promptVariables: prompt.variables ?? detectPromptVariables(prompt.customText),
          workspaceView: 'craft',
          savedPrompts: state.savedPrompts.map((saved) => saved.id === prompt.id
            ? { ...saved, lastOpenedAt: now }
            : saved),
        }))
      },

      deletePrompt: (id) =>
        set((state) => {
          const promptVersions = { ...state.promptVersions }
          delete promptVersions[id]
          return { savedPrompts: state.savedPrompts.filter((p) => p.id !== id), promptVersions, activePromptId: state.activePromptId === id ? null : state.activePromptId }
        }),

      renamePrompt: (id, name) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.map((prompt) => prompt.id === id
            ? { ...prompt, name: name.trim() || prompt.name, updatedAt: Date.now() }
            : prompt),
        })),

      duplicatePrompt: (id) => {
        const source = get().savedPrompts.find((prompt) => prompt.id === id)
        if (!source) return null
        const now = Date.now()
        const duplicate: PromptTemplate = {
          ...source,
          id: crypto.randomUUID(),
          name: `${source.name} copy`,
          createdAt: now,
          updatedAt: now,
          lastOpenedAt: now,
          isFavorite: false,
        }
        set((state) => ({ savedPrompts: [...state.savedPrompts, duplicate] }))
        return duplicate
      },

      toggleFavoritePrompt: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.map((prompt) => prompt.id === id
            ? { ...prompt, isFavorite: !prompt.isFavorite, updatedAt: Date.now() }
            : prompt),
        })),

      updatePromptCover: (id, coverImageDataUrl) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.map((prompt) => prompt.id === id
            ? { ...prompt, coverImageDataUrl, updatedAt: Date.now() }
            : prompt),
        })),

      importPrompt: (prompt) => {
        get().captureDraftSnapshot('import')
        const now = Date.now()
        const existingIds = new Set(get().savedPrompts.map((saved) => saved.id))
        const imported: PromptTemplate = {
          ...prompt,
          id: existingIds.has(prompt.id) ? crypto.randomUUID() : prompt.id,
          updatedAt: now,
          lastOpenedAt: now,
          source: 'import',
          isFavorite: prompt.isFavorite ?? false,
          formatterProfileId: prompt.formatterProfileId ?? MODEL_PROFILE_MAP[prompt.model],
          variables: prompt.variables ?? detectPromptVariables(prompt.customText),
        }
        const parameters = prompt.modelParams?.[prompt.model] ?? {}
        const profile = getFormatterProfile(imported.formatterProfileId ?? MODEL_PROFILE_MAP[imported.model], get().customFormatterProfiles)
        const version: PromptVersion = {
          id: crypto.randomUUID(), promptId: imported.id, version: 1,
          content: composeWithProfile({ profile, tags: imported.selections, customText: imported.customText, variables: imported.variables ?? [], parameters }).prompt,
          model: imported.model, formatterProfileId: profile.id, parameters, createdAt: now, notes: 'import',
          selectedTags: JSON.parse(JSON.stringify(imported.selections)), customText: imported.customText,
        }
        set((state) => ({ savedPrompts: [...state.savedPrompts, imported], promptVersions: { ...state.promptVersions, [imported.id]: [version] } }))
        return imported
      },

      captureDraftSnapshot: (source = 'manual') => {
        const state = get()
        if (!state.customText && state.selectedTags.length === 0) return null
        const snapshot: DraftSnapshot = {
          id: crypto.randomUUID(), createdAt: Date.now(), source, customText: state.customText,
          selectedTags: JSON.parse(JSON.stringify(state.selectedTags)), selectedModel: state.selectedModel,
          formatterProfileId: state.selectedFormatterProfileId, parameters: { ...state.modelParameters }, variables: JSON.parse(JSON.stringify(state.promptVariables)),
        }
        const fingerprint = JSON.stringify([snapshot.customText, snapshot.selectedTags, snapshot.selectedModel, snapshot.formatterProfileId, snapshot.parameters, snapshot.variables])
        const previous = state.draftSnapshots[state.draftSnapshots.length - 1]
        if (previous && JSON.stringify([previous.customText, previous.selectedTags, previous.selectedModel, previous.formatterProfileId, previous.parameters, previous.variables]) === fingerprint) return previous
        set({ draftSnapshots: [...state.draftSnapshots, snapshot].slice(-20) })
        return snapshot
      },

      restoreDraftSnapshot: (snapshotId) => {
        const state = get()
        const snapshot = state.draftSnapshots.find((item) => item.id === snapshotId)
        if (!snapshot) return false
        get().captureDraftSnapshot('restore')
        set({ customText: snapshot.customText, selectedTags: snapshot.selectedTags, selectedModel: snapshot.selectedModel, selectedFormatterProfileId: snapshot.formatterProfileId, modelParameters: snapshot.parameters, promptVariables: snapshot.variables ?? detectPromptVariables(snapshot.customText), workspaceView: 'craft', draftDirty: true })
        return true
      },

      restorePromptVersion: (promptId, versionId) => {
        const state = get()
        const version = state.promptVersions[promptId]?.find((item) => item.id === versionId)
        if (!version) return false
        get().captureDraftSnapshot('restore')
        set({ customText: version.customText, selectedTags: version.selectedTags, selectedModel: version.model, selectedFormatterProfileId: version.formatterProfileId ?? MODEL_PROFILE_MAP[version.model], modelParameters: version.parameters, promptVariables: detectPromptVariables(version.customText), activePromptId: promptId, workspaceView: 'craft', draftDirty: true })
        return true
      },

      duplicatePromptVersion: (promptId, versionId) => {
        const state = get()
        const source = state.savedPrompts.find((item) => item.id === promptId)
        const version = state.promptVersions[promptId]?.find((item) => item.id === versionId)
        if (!source || !version) return null
        const now = Date.now()
        const duplicate: PromptTemplate = { ...source, id: crypto.randomUUID(), name: `${source.name} version ${version.version}`, customText: version.customText, selections: version.selectedTags, model: version.model, formatterProfileId: version.formatterProfileId ?? MODEL_PROFILE_MAP[version.model], variables: detectPromptVariables(version.customText), createdAt: now, updatedAt: now, lastOpenedAt: now, isFavorite: false }
        set((current) => ({ savedPrompts: [...current.savedPrompts, duplicate] }))
        return duplicate
      },

      deletePromptVersion: (promptId, versionId) =>
        set((state) => ({
          promptVersions: {
            ...state.promptVersions,
            [promptId]: (state.promptVersions[promptId] ?? []).filter((version) => version.id !== versionId),
          },
        })),

      exportCompleteBackup: () => {
        const state = get()
        const backup = createMuseBackup({
          draft: { id: crypto.randomUUID(), createdAt: Date.now(), source: 'manual', customText: state.customText, selectedTags: state.selectedTags, selectedModel: state.selectedModel, formatterProfileId: state.selectedFormatterProfileId, parameters: state.modelParameters, variables: state.promptVariables },
          savedPrompts: state.savedPrompts, savedEntities: state.savedEntities, referenceImages: state.referenceImages,
          promptVersions: state.promptVersions, draftSnapshots: state.draftSnapshots, formatterProfiles: state.customFormatterProfiles,
          preferences: { contentVisibility: state.contentVisibility, workspaceDepth: state.workspaceDepth, theme: state.theme, pinnedTags: state.pinnedTags, recentlyUsedTags: state.recentlyUsedTags },
        })
        set({ lastBackupAt: backup.exportedAt })
        return JSON.stringify(backup, null, 2)
      },

      restoreCompleteBackup: (json, mode = 'merge') => {
        try {
          const backup = parseMuseBackup(json)
          const recoverySnapshot = get().captureDraftSnapshot('restore')
          if (mode === 'replace') {
            set({
              customText: backup.state.draft.customText, selectedTags: backup.state.draft.selectedTags, selectedModel: backup.state.draft.selectedModel,
              selectedFormatterProfileId: backup.state.draft.formatterProfileId, modelParameters: backup.state.draft.parameters,
              savedPrompts: backup.state.savedPrompts, savedEntities: backup.state.savedEntities, referenceImages: backup.state.referenceImages,
              promptVersions: backup.state.promptVersions,
              draftSnapshots: [...backup.state.draftSnapshots, ...(recoverySnapshot ? [recoverySnapshot] : [])].slice(-20),
              customFormatterProfiles: backup.state.formatterProfiles,
              promptVariables: backup.state.draft.variables ?? detectPromptVariables(backup.state.draft.customText), ...backup.state.preferences,
            })
          } else {
            set((state) => {
              const promptMerge = mergePromptBackups(state.savedPrompts, backup.state.savedPrompts, state.promptVersions, backup.state.promptVersions)
              return {
                savedPrompts: promptMerge.prompts, savedEntities: mergeById(state.savedEntities, backup.state.savedEntities),
                referenceImages: mergeById(state.referenceImages, backup.state.referenceImages), promptVersions: promptMerge.versions,
                draftSnapshots: mergeById(state.draftSnapshots, [...backup.state.draftSnapshots, backup.state.draft]).slice(-20), customFormatterProfiles: mergeById(state.customFormatterProfiles, backup.state.formatterProfiles),
              }
            })
          }
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'Backup restore failed.' }
        }
      },

      setStorageDurability: (storageDurability) => set({ storageDurability }),
      requestPersistentStorage: async () => {
        const durability = await requestDurableStorage()
        set({ storageDurability: durability })
        return durability
      },

      addReferenceImage: (image) =>
        set((state) => ({
          referenceImages: [...state.referenceImages, image],
        })),

      updateReferenceImage: (id, updates) => set((state) => ({
        referenceImages: state.referenceImages.map((image) => image.id === id ? { ...image, ...updates } : image),
      })),

      removeReferenceImage: (id) =>
        set((state) => ({
          referenceImages: state.referenceImages.filter((i) => i.id !== id),
        })),

      setModelParameters: (params) => set({ modelParameters: params, draftDirty: true }),

      generatePrompt: () => {
        const state = get()
        const profile = getFormatterProfile(state.selectedFormatterProfileId, state.customFormatterProfiles)
        return composeWithProfile({ profile: { ...profile, model: state.selectedModel }, tags: state.selectedTags, customText: state.customText, variables: state.promptVariables, parameters: state.modelParameters, negativePrompt: state.customNegativePrompt }).prompt
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

      setCustomNegativePrompt: (text) => set({ customNegativePrompt: text, draftDirty: true }),

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
          const lockedTagIds = options.protectCurrent
            ? [...new Set([...state.pinnedTags, ...state.selectedTags.map((tag) => tag.id)])]
            : state.pinnedTags
          const lockedTags = state.selectedTags.filter((t: TaxonomyTag) => lockedTagIds.includes(t.id))

          const result = engine.randomize({
            vibe: options.vibe,
            intent: options.intent,
            storySeed: options.storySeed,
            intensity: options.intensity ?? state.lastRandomizerIntensity,
            contentVisibility: state.contentVisibility,
            seed,
            mode: options.mode ?? state.lastRandomizerMode ?? 'coherence-aware',
            lockedTagIds,
            lockedTags,
          })
          get().applyRandomizerResult(result, options.protectCurrent)
          return result
        } catch {
          return null
        }
      },

      applyRandomizerResult: (result, protectCurrent = false) => {
        const state = get()
        get().captureDraftSnapshot('randomize')
        get()._saveHistory()
        const protectedIds = protectCurrent
          ? new Set([...state.pinnedTags, ...state.selectedTags.map((tag) => tag.id)])
          : new Set(state.pinnedTags)
        const protectedTags = state.selectedTags.filter((tag) => protectedIds.has(tag.id))
        const newTags = result.tags.filter((tag) => !protectedIds.has(tag.id))
        set({
          selectedTags: [...protectedTags, ...newTags].map((tag) => ({ ...tag, selectedAt: Date.now() })),
          lastRandomizerSeed: result.seed,
          lastRandomizerVibe: result.vibe,
          lastRandomizerIntent: result.intent,
          lastRandomizerMode: result.mode,
          draftDirty: true,
        })
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
          draftDirty: true,
        }))
      },

      setTagWeight: (tagId, weight) => {
        get()._saveHistory()
        set((state) => ({
          selectedTags: state.selectedTags.map((tag) => tag.id === tagId
            ? { ...tag, customWeight: Math.max(0.1, Math.min(2, Number(weight.toFixed(1)))) }
            : tag),
          draftDirty: true,
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
            draftDirty: true,
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
            draftDirty: true,
          })
        }
      },

      canUndo: () => useHistoryStore.getState().canUndo(),
      canRedo: () => useHistoryStore.getState().canRedo(),
    }),
    {
      name: 'promptsmith-storage',
      version: 6,
      storage: createJSONStorage(() => indexedDbStorage),
      migrate: (persistedState, version) => migratePromptState(persistedState, version) as unknown as PromptSmithStore,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<PromptSmithStore>
        const legacyAI = (persisted.aiSettings ?? {}) as Partial<AISettings> & { preferredAIModel?: string }
        const supportedProviders: LocalAIProviderId[] = ['ollama', 'lmstudio', 'openai-compatible', 'anthropic-compatible']
        const preferred = legacyAI.preferredAIProvider && supportedProviders.includes(legacyAI.preferredAIProvider)
          ? legacyAI.preferredAIProvider
          : null
        const providerModels = legacyAI.providerModels ?? (preferred && legacyAI.preferredAIModel ? { [preferred]: legacyAI.preferredAIModel } : {})
        const savedPrompts = Array.isArray(persisted.savedPrompts)
          ? persisted.savedPrompts.map((prompt) => ({ ...prompt, selections: normalizeTaxonomyTags(prompt.selections) }))
          : currentState.savedPrompts
        const savedEntities = Array.isArray(persisted.savedEntities)
          ? persisted.savedEntities.map((entity) => ({ ...entity, tags: normalizeTaxonomyTags(entity.tags) }))
          : currentState.savedEntities
        const draftSnapshots = Array.isArray(persisted.draftSnapshots)
          ? persisted.draftSnapshots.map((snapshot) => ({ ...snapshot, selectedTags: normalizeTaxonomyTags(snapshot.selectedTags) }))
          : currentState.draftSnapshots
        const promptVersions = persisted.promptVersions && typeof persisted.promptVersions === 'object'
          ? Object.fromEntries(Object.entries(persisted.promptVersions).map(([promptId, versions]) => [
              promptId,
              Array.isArray(versions) ? versions.map((version) => ({ ...version, selectedTags: normalizeTaxonomyTags(version.selectedTags) })) : [],
            ]))
          : currentState.promptVersions
        return {
          ...currentState,
          ...persisted,
          selectedTags: normalizeTaxonomyTags(persisted.selectedTags),
          savedPrompts,
          savedEntities,
          draftSnapshots,
          promptVersions,
          aiSettings: {
            ...currentState.aiSettings,
            ...legacyAI,
            ollamaUrl: legacyAI.ollamaUrl ?? currentState.aiSettings.ollamaUrl,
            lmStudioUrl: legacyAI.lmStudioUrl ?? currentState.aiSettings.lmStudioUrl,
            preferredAIProvider: preferred,
            providerModels,
            ollamaModels: legacyAI.ollamaModels ?? [],
            lmstudioModels: legacyAI.lmstudioModels ?? [],
          },
        }
      },
      partialize: (state) => ({
        selectedTags: state.selectedTags,
        customText: state.customText,
        selectedModel: state.selectedModel,
        selectedFormatterProfileId: state.selectedFormatterProfileId,
        activePromptId: state.activePromptId,
        draftDirty: state.draftDirty,
        lastEnhancement: state.lastEnhancement,
        showInspiration: state.showInspiration,
        customFormatterProfiles: state.customFormatterProfiles,
        promptVariables: state.promptVariables,
        promptVersions: state.promptVersions,
        draftSnapshots: state.draftSnapshots,
        storageDurability: state.storageDurability,
        lastBackupAt: state.lastBackupAt,
        contentVisibility: state.contentVisibility,
        workspaceDepth: state.workspaceDepth,
        workspaceView: state.workspaceView,
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
        referenceImages: state.referenceImages,
      }),
    }
  )
)
