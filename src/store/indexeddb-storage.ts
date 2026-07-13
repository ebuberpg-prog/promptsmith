import { openDB, type IDBPDatabase } from 'idb'
import type { StateStorage } from 'zustand/middleware'
import { migratePromptState } from './migrate-prompt-state'

const DB_NAME = 'muse-prompt-studio'
const STORE_NAME = 'state'
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
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
      },
    })
  }
  return dbPromise
}

function readLegacy(name: string): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(name)
}

export const indexedDbStorage: StateStorage = {
  async getItem(name) {
    if (!canUseIndexedDb()) return readLegacy(name)
    try {
      const db = await getDb()
      const existing = await db.get(STORE_NAME, name) as string | undefined
      if (existing) {
        JSON.parse(existing)
        lastStorageError = null
        return existing
      }

      const legacy = readLegacy(name)
      if (!legacy) return null
      const parsed = JSON.parse(legacy) as { state?: unknown; version?: number }
      if (!parsed || typeof parsed !== 'object' || !parsed.state) throw new Error('Legacy MUSE state is invalid')
      const migrated = JSON.stringify({ state: migratePromptState(parsed.state, parsed.version ?? 0), version: 6 })
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(LEGACY_BACKUP_KEY)) {
        localStorage.setItem(LEGACY_BACKUP_KEY, legacy)
      }
      await db.put(STORE_NAME, migrated, name)
      const verified = await db.get(STORE_NAME, name) as string | undefined
      if (verified !== migrated) throw new Error('IndexedDB migration verification failed')
      lastStorageError = null
      return verified
    } catch (error) {
      lastStorageError = error instanceof Error ? error : new Error('IndexedDB could not be opened')
      const legacy = readLegacy(name)
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
    pendingWrite = { name, value }
    notifyWrite('saving')
    if (writeTimer !== null) window.clearTimeout(writeTimer)
    writeTimer = window.setTimeout(() => { void flushPendingState() }, 400)
  },
  async removeItem(name) {
    await flushPendingState()
    if (canUseIndexedDb()) {
      const db = await getDb()
      await db.delete(STORE_NAME, name)
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name)
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
    if (!canUseIndexedDb()) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value)
      notifyWrite('saved')
      return
    }
    try {
      const db = await getDb()
      await db.put(STORE_NAME, value, name)
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
  if (typeof navigator === 'undefined' || !navigator.storage) return 'unavailable'
  if (await navigator.storage.persisted?.()) return 'persistent'
  if (!navigator.storage.persist) return 'best-effort'
  return await navigator.storage.persist() ? 'persistent' : 'denied'
}

export async function getStorageDurability(): Promise<'persistent' | 'best-effort' | 'unavailable'> {
  if (typeof navigator === 'undefined' || !navigator.storage) return 'unavailable'
  return await navigator.storage.persisted?.() ? 'persistent' : 'best-effort'
}
