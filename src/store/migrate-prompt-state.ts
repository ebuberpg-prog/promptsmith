import type { PromptTemplate } from '@/types'
import { MODEL_PROFILE_MAP } from '@/data/formatter-profiles'

export function migratePromptState(persistedState: unknown, version: number): Record<string, unknown> {
  const state = JSON.parse(JSON.stringify(persistedState ?? {})) as Record<string, unknown>

  if (version < 2) {
    const modelIdMap: Record<string, string> = { 'dalle-3': 'gpt-image', 'z-image': 'flux' }
    const selectedModel = state.selectedModel as string | undefined
    if (selectedModel && modelIdMap[selectedModel]) state.selectedModel = modelIdMap[selectedModel]

    for (const item of [state.savedPrompts, state.savedEntities]) {
      if (!Array.isArray(item)) continue
      for (const record of item as Array<{ model?: string }>) {
        if (record.model && modelIdMap[record.model]) record.model = modelIdMap[record.model]
      }
    }
  }

  if (version < 4) {
    state.contentVisibility = state.showExplicit ? 'all' : 'filtered'
    delete state.showExplicit
    state.workspaceDepth = state.workspaceDepth === 'studio' ? 'studio' : 'simple'
    state.workspaceView = state.workspaceView === 'craft' || state.workspaceView === 'library' ? state.workspaceView : 'home'

    const savedPrompts = state.savedPrompts as PromptTemplate[] | undefined
    if (Array.isArray(savedPrompts)) {
      state.savedPrompts = savedPrompts.map((prompt) => ({
        ...prompt,
        isFavorite: prompt.isFavorite ?? false,
        lastOpenedAt: prompt.lastOpenedAt ?? (prompt.updatedAt || prompt.createdAt),
        source: prompt.source ?? (prompt.isUserTemplate ? 'template' : 'manual'),
      }))
    }
  }

  if (version < 5) {
    const selectedModel = (state.selectedModel as keyof typeof MODEL_PROFILE_MAP | undefined) ?? 'gpt-image'
    state.selectedFormatterProfileId = state.selectedFormatterProfileId ?? MODEL_PROFILE_MAP[selectedModel] ?? 'format:natural-language'
    state.customFormatterProfiles = Array.isArray(state.customFormatterProfiles) ? state.customFormatterProfiles : []
    state.promptVariables = Array.isArray(state.promptVariables) ? state.promptVariables : []
    state.promptVersions = state.promptVersions && typeof state.promptVersions === 'object' ? state.promptVersions : {}
    state.draftSnapshots = Array.isArray(state.draftSnapshots) ? state.draftSnapshots : []
    state.storageDurability = state.storageDurability ?? 'best-effort'
    state.lastBackupAt = typeof state.lastBackupAt === 'number' ? state.lastBackupAt : null
    state.activePromptId = typeof state.activePromptId === 'string' ? state.activePromptId : null

    const savedPrompts = state.savedPrompts as PromptTemplate[] | undefined
    if (Array.isArray(savedPrompts)) {
      state.savedPrompts = savedPrompts.map((prompt) => ({
        ...prompt,
        formatterProfileId: prompt.formatterProfileId ?? MODEL_PROFILE_MAP[prompt.model] ?? 'format:natural-language',
        variables: Array.isArray(prompt.variables) ? prompt.variables : [],
      }))
    }
  }

  if (version < 6) {
    const legacyAI = (state.aiSettings && typeof state.aiSettings === 'object' ? state.aiSettings : {}) as Record<string, unknown>
    const preferred = legacyAI.preferredAIProvider === 'ollama' || legacyAI.preferredAIProvider === 'lmstudio'
      ? legacyAI.preferredAIProvider
      : null
    const legacyModel = typeof legacyAI.preferredAIModel === 'string' ? legacyAI.preferredAIModel : null
    state.aiSettings = {
      ollamaUrl: typeof legacyAI.ollamaUrl === 'string' ? legacyAI.ollamaUrl : 'http://localhost:11434',
      lmStudioUrl: typeof legacyAI.lmStudioUrl === 'string' ? legacyAI.lmStudioUrl : 'http://localhost:1234/v1',
      preferredAIProvider: preferred,
      providerModels: preferred && legacyModel ? { [preferred]: legacyModel } : {},
      ollamaModels: Array.isArray(legacyAI.ollamaModels) ? legacyAI.ollamaModels : [],
      lmstudioModels: Array.isArray(legacyAI.lmstudioModels) ? legacyAI.lmstudioModels : [],
    }
    state.draftDirty = Boolean(state.draftDirty)
    state.lastEnhancement = null
    state.showInspiration = state.showInspiration !== false
  }

  return state
}
