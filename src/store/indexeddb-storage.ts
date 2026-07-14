import { openDB, type IDBPDatabase } from 'idb'
import type { StateStorage } from 'zustand/middleware'
import type { MuseStorageEstimate } from '@/types'
import { isTauriRuntime } from '@/services/runtime-environment'
import { resolveWorkspaceStateKey } from '@/services/workspace-service'
import { externalizePersistedReferenceAssets, hydratePersistedReferenceAssets, type PersistedAssetBackend } from './persisted-asset-service'
import { migratePromptState } from './migrate-prompt-state'

const DB_NAME = 'muse-prompt-studio'
const STORE_NAME = 'state'
const ASSET_STORE_NAME = 'assets'
export const PERSISTENCE_KEY = 'promptsmith-storage'
const LEGACY_BACKUP_KEY = 'promptsmith-storage-legacy-backup'

let dbPromise: Promise<IDBPDatabase> | null = null
let lastStorageError: Error | null = null
let pendingWrite: { name: string; value: string } | null = null
let writeTimer: number | null = null
const writeListeners = new Set<(state: 'saving' | 'saved' | 'error') => void>()
let currentWriteState: 'saving' | 'saved' | 'error' = 'saved'

function notifyWrite(state: 'saving' | 'saved' | 'error') {
  currentWriteState = state
  writeListeners.forEach((listener) => listener(state))
}

function canUseIndexedDb() {
  return typeof indexedDB !== 'undefined'
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
        if (!db.objectStoreNames.contains(ASSET_STORE_NAME)) db.createObjectStore(ASSET_STORE_NAME)
      },
    })
  }
  return dbPromise
}

const browserAssetBackend: PersistedAssetBackend = {
  async get(key) {
    const value = await (await getDb()).get(ASSET_STORE_NAME, key)
    return value instanceof Blob ? value : null
  },
  async put(key, value) {
    await (await getDb()).put(ASSET_STORE_NAME, value, key)
  },
  async has(key) {
    return Boolean(await (await getDb()).getKey(ASSET_STORE_NAME, key))
  },
  async delete(key) {
    await (await getDb()).delete(ASSET_STORE_NAME, key)
  },
  async keys(prefix) {
    const keys = await (await getDb()).getAllKeys(ASSET_STORE_NAME)
    return keys.filter((key): key is string => typeof key === 'string' && key.startsWith(prefix))
  },
}

function readLegacy(name: string): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(name)
}

export const indexedDbStorage: StateStorage = {
  async getItem(name) {
    const storageKey = resolveWorkspaceStateKey(name)
    if (isTauriRuntime()) {
      try {
        const { nativeAssetBackend, readNativeState } = await import('./native-storage')
        const existing = await readNativeState(storageKey)
        lastStorageError = null
        return existing ? hydratePersistedReferenceAssets(existing, storageKey, nativeAssetBackend) : null
      } catch (error) {
        lastStorageError = error instanceof Error ? error : new Error('Desktop storage could not be opened')
        return null
      }
    }
    if (!canUseIndexedDb()) return readLegacy(storageKey)
    try {
      const db = await getDb()
      const existing = await db.get(STORE_NAME, storageKey) as string | undefined
      if (existing) {
        const externalized = await externalizePersistedReferenceAssets(existing, storageKey, browserAssetBackend)
        if (externalized !== existing) await db.put(STORE_NAME, externalized, storageKey)
        lastStorageError = null
        return hydratePersistedReferenceAssets(externalized, storageKey, browserAssetBackend)
      }

      const legacy = readLegacy(storageKey)
      if (!legacy) return null
      const parsed = JSON.parse(legacy) as { state?: unknown; version?: number }
      if (!parsed || typeof parsed !== 'object' || !parsed.state) throw new Error('Legacy MUSE state is invalid')
      const migrated = JSON.stringify({ state: migratePromptState(parsed.state, parsed.version ?? 0), version: 7 })
      const externalized = await externalizePersistedReferenceAssets(migrated, storageKey, browserAssetBackend)
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(LEGACY_BACKUP_KEY)) {
        localStorage.setItem(LEGACY_BACKUP_KEY, legacy)
      }
      await db.put(STORE_NAME, externalized, storageKey)
      const verified = await db.get(STORE_NAME, storageKey) as string | undefined
      if (verified !== externalized) throw new Error('IndexedDB migration verification failed')
      lastStorageError = null
      return hydratePersistedReferenceAssets(verified, storageKey, browserAssetBackend)
    } catch (error) {
      lastStorageError = error instanceof Error ? error : new Error('IndexedDB could not be opened')
      const legacy = readLegacy(storageKey)
      if (!legacy) return null
      try {
        JSON.parse(legacy)
        return legacy
      } catch {
        return null
      }
    }
  },
  async setItem(name, value) {
    pendingWrite = { name: resolveWorkspaceStateKey(name), value }
    notifyWrite('saving')
    if (writeTimer !== null) window.clearTimeout(writeTimer)
    writeTimer = window.setTimeout(() => { void flushPendingState() }, 400)
  },
  async removeItem(name) {
    await flushPendingState()
    const storageKey = resolveWorkspaceStateKey(name)
    if (isTauriRuntime()) {
      const { removeNativeState } = await import('./native-storage')
      await removeNativeState(storageKey)
      return
    }
    if (canUseIndexedDb()) {
      const db = await getDb()
      await db.delete(STORE_NAME, storageKey)
      const assetKeys = await browserAssetBackend.keys(`${storageKey}::assets::`)
      await Promise.all(assetKeys.map((key) => browserAssetBackend.delete(key)))
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey)
  },
}

export async function flushPendingState() {
  if (writeTimer !== null) {
    window.clearTimeout(writeTimer)
    writeTimer = null
  }
  const next = pendingWrite
  pendingWrite = null
  if (!next) return
  const { name, value } = next
    if (isTauriRuntime()) {
      try {
        const { nativeAssetBackend, writeNativeState } = await import('./native-storage')
        const externalized = await externalizePersistedReferenceAssets(value, name, nativeAssetBackend)
        await writeNativeState(name, externalized)
        lastStorageError = null
        notifyWrite('saved')
      } catch (error) {
        lastStorageError = error instanceof Error ? error : new Error('Desktop storage write failed')
        notifyWrite('error')
      }
      return
    }
    if (!canUseIndexedDb()) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value)
      notifyWrite('saved')
      return
    }
    try {
      const db = await getDb()
      const externalized = await externalizePersistedReferenceAssets(value, name, browserAssetBackend)
      await db.put(STORE_NAME, externalized, name)
      lastStorageError = null
      notifyWrite('saved')
    } catch (error) {
      lastStorageError = error instanceof Error ? error : new Error('IndexedDB write failed')
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value)
      notifyWrite('error')
    }
}

export function subscribeStorageWrites(listener: (state: 'saving' | 'saved' | 'error') => void) {
  writeListeners.add(listener)
  return () => { writeListeners.delete(listener) }
}

export function getStorageWriteState() {
  return currentWriteState
}

export function getStorageError() {
  return lastStorageError
}

export function clearStorageError() {
  lastStorageError = null
  dbPromise = null
}

export async function requestDurableStorage(): Promise<'persistent' | 'best-effort' | 'unavailable' | 'denied'> {
  if (isTauriRuntime()) return 'persistent'
  if (typeof navigator === 'undefined' || !navigator.storage) return 'unavailable'
  if (await navigator.storage.persisted?.()) return 'persistent'
  if (!navigator.storage.persist) return 'best-effort'
  return await navigator.storage.persist() ? 'persistent' : 'denied'
}

export async function getStorageDurability(): Promise<'persistent' | 'best-effort' | 'unavailable'> {
  if (isTauriRuntime()) return 'persistent'
  if (typeof navigator === 'undefined' || !navigator.storage) return 'unavailable'
  return await navigator.storage.persisted?.() ? 'persistent' : 'best-effort'
}

export async function getStorageEstimate(): Promise<MuseStorageEstimate> {
  if (isTauriRuntime()) {
    const { getNativeStorageUsage } = await import('./native-storage')
    return { runtime: 'desktop', usage: await getNativeStorageUsage(), quota: null, persisted: true }
  }
  if (typeof navigator === 'undefined' || !navigator.storage) return { runtime: 'browser', usage: 0, quota: null, persisted: null }
  const estimate = await navigator.storage.estimate?.()
  return {
    runtime: 'browser',
    usage: estimate?.usage ?? 0,
    quota: estimate?.quota ?? null,
    persisted: await navigator.storage.persisted?.() ?? null,
  }
}

export async function removeWorkspaceState(workspaceId: string) {
  await flushPendingState()
  const storageKey = resolveWorkspaceStateKey(PERSISTENCE_KEY, workspaceId)
  if (isTauriRuntime()) {
    const { removeNativeState } = await import('./native-storage')
    await removeNativeState(storageKey)
    return
  }
  if (canUseIndexedDb()) {
    const db = await getDb()
    await db.delete(STORE_NAME, storageKey)
    const assetKeys = await browserAssetBackend.keys(`${storageKey}::assets::`)
    await Promise.all(assetKeys.map((key) => browserAssetBackend.delete(key)))
  }
  if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey)
}
