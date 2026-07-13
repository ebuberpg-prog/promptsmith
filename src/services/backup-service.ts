import type { DraftSnapshot, FormatterProfile, MuseBackupV1, PromptTemplate, PromptVersion, ReferenceImage, SavedEntity } from '@/types'

export interface BackupSource {
  draft: DraftSnapshot
  savedPrompts: PromptTemplate[]
  savedEntities: SavedEntity[]
  referenceImages: ReferenceImage[]
  promptVersions: Record<string, PromptVersion[]>
  draftSnapshots: DraftSnapshot[]
  formatterProfiles: FormatterProfile[]
  preferences: MuseBackupV1['state']['preferences']
}

export function createMuseBackup(source: BackupSource): MuseBackupV1 {
  return {
    _schema: 'muse-backup-v1',
    exportedAt: Date.now(),
    appVersion: '1.0.0',
    state: JSON.parse(JSON.stringify(source)) as MuseBackupV1['state'],
  }
}

export function parseMuseBackup(json: string): MuseBackupV1 {
  const parsed = JSON.parse(json) as Partial<MuseBackupV1>
  if (parsed._schema !== 'muse-backup-v1' || !parsed.state) throw new Error('This is not a MUSE complete backup.')
  if (!Array.isArray(parsed.state.savedPrompts) || !Array.isArray(parsed.state.savedEntities) || !Array.isArray(parsed.state.referenceImages)) {
    throw new Error('The backup is incomplete or damaged.')
  }
  if (!parsed.state.draft || typeof parsed.state.draft.customText !== 'string' || !Array.isArray(parsed.state.draft.selectedTags)) {
    throw new Error('The backup draft is invalid.')
  }
  const hasId = (item: unknown): item is { id: string } => Boolean(item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string')
  if (!parsed.state.savedPrompts.every((item) => hasId(item) && typeof item.name === 'string' && typeof item.customText === 'string' && Array.isArray(item.selections))) {
    throw new Error('One or more saved prompts are invalid.')
  }
  if (!parsed.state.savedEntities.every(hasId) || !parsed.state.referenceImages.every(hasId)) {
    throw new Error('One or more Library records are invalid.')
  }
  if (!Array.isArray(parsed.state.draftSnapshots) || !parsed.state.draftSnapshots.every((item) => hasId(item) && typeof item.customText === 'string' && Array.isArray(item.selectedTags))) {
    throw new Error('The draft recovery history is invalid.')
  }
  if (!Array.isArray(parsed.state.formatterProfiles) || !parsed.state.formatterProfiles.every((item) => hasId(item) && typeof item.name === 'string' && typeof item.family === 'string')) {
    throw new Error('The formatter profiles are invalid.')
  }
  if (!parsed.state.promptVersions || typeof parsed.state.promptVersions !== 'object' || Array.isArray(parsed.state.promptVersions)) {
    throw new Error('The prompt version history is invalid.')
  }
  if (!Object.values(parsed.state.promptVersions).every((versions) => Array.isArray(versions) && versions.every((version) => hasId(version) && typeof version.content === 'string' && typeof version.customText === 'string' && Array.isArray(version.selectedTags)))) {
    throw new Error('One or more prompt versions are invalid.')
  }
  if (!parsed.state.preferences || !['filtered', 'all'].includes(parsed.state.preferences.contentVisibility) || !['simple', 'studio'].includes(parsed.state.preferences.workspaceDepth)) {
    throw new Error('The backup preferences are invalid.')
  }
  return parsed as MuseBackupV1
}

export function mergeById<T extends { id: string; name?: string }>(current: T[], imported: T[]): T[] {
  const result = [...current]
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of imported) {
    const existing = byId.get(item.id)
    if (!existing) {
      result.push(item)
      byId.set(item.id, item)
      continue
    }
    if (JSON.stringify(existing) === JSON.stringify(item)) continue
    result.push({ ...item, id: crypto.randomUUID(), ...(item.name ? { name: `${item.name} (imported)` } : {}) })
  }
  return result
}

export function mergeVersionMaps(current: Record<string, PromptVersion[]>, imported: Record<string, PromptVersion[]>) {
  const merged = { ...current }
  for (const [promptId, versions] of Object.entries(imported)) {
    merged[promptId] = mergeById(merged[promptId] ?? [], versions).slice(-25)
  }
  return merged
}

export function mergePromptBackups(currentPrompts: PromptTemplate[], importedPrompts: PromptTemplate[], currentVersions: Record<string, PromptVersion[]>, importedVersions: Record<string, PromptVersion[]>) {
  const prompts = [...currentPrompts]
  const versions = { ...currentVersions }
  const byId = new Map(currentPrompts.map((prompt) => [prompt.id, prompt]))

  for (const prompt of importedPrompts) {
    const existing = byId.get(prompt.id)
    if (!existing) {
      prompts.push(prompt)
      byId.set(prompt.id, prompt)
      if (importedVersions[prompt.id]) versions[prompt.id] = importedVersions[prompt.id].slice(-25)
      continue
    }
    if (JSON.stringify(existing) === JSON.stringify(prompt)) continue

    const clonedId = crypto.randomUUID()
    const clone = { ...prompt, id: clonedId, name: `${prompt.name} (imported)` }
    prompts.push(clone)
    byId.set(clonedId, clone)
    versions[clonedId] = (importedVersions[prompt.id] ?? []).map((version) => ({ ...version, id: crypto.randomUUID(), promptId: clonedId })).slice(-25)
  }

  return { prompts, versions }
}
