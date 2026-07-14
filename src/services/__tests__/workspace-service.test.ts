import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activateWorkspace,
  createWorkspace,
  DEFAULT_WORKSPACE_ID,
  deleteWorkspaceFromRegistry,
  getWorkspaceRegistry,
  renameWorkspace,
  resolveWorkspaceStateKey,
} from '../workspace-service'

function localStorageStub(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear() { values.clear() },
    getItem(key) { return values.get(key) ?? null },
    key(index) { return [...values.keys()][index] ?? null },
    removeItem(key) { values.delete(key) },
    setItem(key, value) { values.set(key, value) },
  }
}

describe('workspace registry', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageStub())
  })

  it('preserves the legacy workspace key for the default folio', () => {
    const registry = getWorkspaceRegistry()
    expect(registry.activeWorkspaceId).toBe(DEFAULT_WORKSPACE_ID)
    expect(registry.workspaces[0].name).toBe('My studio')
    expect(resolveWorkspaceStateKey('promptsmith-storage')).toBe('promptsmith-storage')
  })

  it('creates isolated keys and supports switch, rename, and safe deletion', () => {
    const workspace = createWorkspace('  Client   campaign  ')
    expect(getWorkspaceRegistry().activeWorkspaceId).toBe(workspace.id)
    expect(resolveWorkspaceStateKey('promptsmith-storage')).toBe(`promptsmith-storage::${workspace.id}`)
    renameWorkspace(workspace.id, 'Campaign archive')
    expect(getWorkspaceRegistry().workspaces.find((item) => item.id === workspace.id)?.name).toBe('Campaign archive')
    expect(() => deleteWorkspaceFromRegistry(workspace.id)).toThrow('Switch workspaces')
    activateWorkspace(DEFAULT_WORKSPACE_ID)
    deleteWorkspaceFromRegistry(workspace.id)
    expect(getWorkspaceRegistry().workspaces).toHaveLength(1)
  })
})
