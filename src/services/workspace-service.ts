import type { MuseWorkspace, MuseWorkspaceRegistry } from '@/types'
import { isTauriRuntime } from './runtime-environment'

export const DEFAULT_WORKSPACE_ID = 'default'
const REGISTRY_KEY = 'muse-workspace-registry-v1'
const WORKSPACE_EVENT = 'muse-workspaces-changed'
let pendingRegistryWrite: Promise<void> = Promise.resolve()

function defaultWorkspace(now = Date.now()): MuseWorkspace {
  return {
    id: DEFAULT_WORKSPACE_ID,
    name: 'My studio',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  }
}

function defaultRegistry(): MuseWorkspaceRegistry {
  const workspace = defaultWorkspace()
  return { schemaVersion: 1, activeWorkspaceId: workspace.id, workspaces: [workspace] }
}

function normalizeName(name: string) {
  return name.replace(/\s+/g, ' ').trim().slice(0, 60)
}

function normalizeRegistry(value: unknown): MuseWorkspaceRegistry {
  if (!value || typeof value !== 'object') return defaultRegistry()
  const candidate = value as Partial<MuseWorkspaceRegistry>
  const workspaces = Array.isArray(candidate.workspaces)
    ? candidate.workspaces.flatMap((workspace): MuseWorkspace[] => {
        if (!workspace || typeof workspace !== 'object') return []
        const item = workspace as Partial<MuseWorkspace>
        const name = normalizeName(typeof item.name === 'string' ? item.name : '')
        if (typeof item.id !== 'string' || !item.id || !name) return []
        const now = Date.now()
        return [{
          id: item.id,
          name,
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : now,
          updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : now,
          lastOpenedAt: typeof item.lastOpenedAt === 'number' ? item.lastOpenedAt : now,
        }]
      })
    : []
  const unique = [...new Map(workspaces.map((workspace) => [workspace.id, workspace])).values()]
  const safeWorkspaces = unique.length ? unique : [defaultWorkspace()]
  const activeWorkspaceId = typeof candidate.activeWorkspaceId === 'string' && safeWorkspaces.some((workspace) => workspace.id === candidate.activeWorkspaceId)
    ? candidate.activeWorkspaceId
    : safeWorkspaces[0].id
  return { schemaVersion: 1, activeWorkspaceId, workspaces: safeWorkspaces }
}

function saveRegistry(registry: MuseWorkspaceRegistry) {
  const serialized = JSON.stringify(registry)
  if (typeof localStorage !== 'undefined') localStorage.setItem(REGISTRY_KEY, serialized)
  if (isTauriRuntime()) {
    pendingRegistryWrite = import('@/store/native-storage')
      .then(({ writeNativeState }) => writeNativeState(REGISTRY_KEY, serialized))
      .catch(() => undefined)
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(WORKSPACE_EVENT))
  return registry
}

export async function flushWorkspaceRegistry() {
  await pendingRegistryWrite
}

export async function initializeWorkspaceRegistry() {
  if (!isTauriRuntime() || typeof localStorage === 'undefined') return getWorkspaceRegistry()
  try {
    const cached = localStorage.getItem(REGISTRY_KEY)
    const { readNativeState, writeNativeState } = await import('@/store/native-storage')
    const native = await readNativeState(REGISTRY_KEY)
    if (native) {
      try {
        const registry = normalizeRegistry(JSON.parse(native))
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
        return registry
      } catch {
        // Replace an invalid native registry with a validated browser cache or a default below.
      }
    }
    let registry = defaultRegistry()
    if (cached) {
      try { registry = normalizeRegistry(JSON.parse(cached)) } catch { registry = defaultRegistry() }
    }
    const serialized = JSON.stringify(registry)
    localStorage.setItem(REGISTRY_KEY, serialized)
    await writeNativeState(REGISTRY_KEY, serialized)
    return registry
  } catch {
    return getWorkspaceRegistry()
  }
}

export function getWorkspaceRegistry(): MuseWorkspaceRegistry {
  if (typeof localStorage === 'undefined') return defaultRegistry()
  const raw = localStorage.getItem(REGISTRY_KEY)
  if (!raw) return saveRegistry(defaultRegistry())
  try {
    const normalized = normalizeRegistry(JSON.parse(raw))
    if (JSON.stringify(normalized) !== raw) saveRegistry(normalized)
    return normalized
  } catch {
    return saveRegistry(defaultRegistry())
  }
}

export function getActiveWorkspaceId() {
  return getWorkspaceRegistry().activeWorkspaceId
}

export function getActiveWorkspace() {
  const registry = getWorkspaceRegistry()
  return registry.workspaces.find((workspace) => workspace.id === registry.activeWorkspaceId) ?? registry.workspaces[0]
}

export function createWorkspace(name: string) {
  const cleanName = normalizeName(name)
  if (!cleanName) throw new Error('Give the workspace a name.')
  const registry = getWorkspaceRegistry()
  const now = Date.now()
  const workspace: MuseWorkspace = { id: crypto.randomUUID(), name: cleanName, createdAt: now, updatedAt: now, lastOpenedAt: now }
  saveRegistry({ ...registry, activeWorkspaceId: workspace.id, workspaces: [...registry.workspaces, workspace] })
  return workspace
}

export function renameWorkspace(id: string, name: string) {
  const cleanName = normalizeName(name)
  if (!cleanName) throw new Error('Give the workspace a name.')
  const registry = getWorkspaceRegistry()
  const now = Date.now()
  saveRegistry({
    ...registry,
    workspaces: registry.workspaces.map((workspace) => workspace.id === id ? { ...workspace, name: cleanName, updatedAt: now } : workspace),
  })
}

export function activateWorkspace(id: string) {
  const registry = getWorkspaceRegistry()
  if (!registry.workspaces.some((workspace) => workspace.id === id)) throw new Error('That workspace is no longer available.')
  const now = Date.now()
  saveRegistry({
    ...registry,
    activeWorkspaceId: id,
    workspaces: registry.workspaces.map((workspace) => workspace.id === id ? { ...workspace, lastOpenedAt: now } : workspace),
  })
}

export function deleteWorkspaceFromRegistry(id: string) {
  const registry = getWorkspaceRegistry()
  if (registry.workspaces.length === 1) throw new Error('MUSE needs at least one workspace.')
  if (registry.activeWorkspaceId === id) throw new Error('Switch workspaces before deleting the current one.')
  saveRegistry({ ...registry, workspaces: registry.workspaces.filter((workspace) => workspace.id !== id) })
}

export function touchActiveWorkspace() {
  const registry = getWorkspaceRegistry()
  const now = Date.now()
  saveRegistry({
    ...registry,
    workspaces: registry.workspaces.map((workspace) => workspace.id === registry.activeWorkspaceId ? { ...workspace, updatedAt: now } : workspace),
  })
}

export function resolveWorkspaceStateKey(baseKey: string, workspaceId = getActiveWorkspaceId()) {
  return workspaceId === DEFAULT_WORKSPACE_ID ? baseKey : `${baseKey}::${workspaceId}`
}

export function subscribeWorkspaces(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(WORKSPACE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(WORKSPACE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
