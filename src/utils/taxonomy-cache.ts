import { openDB, type IDBPDatabase } from 'idb'
import type { TaxonomyTag } from '@/types'

const DB_NAME = 'muse-taxonomy'
const DB_VERSION = 1
const STORE_NAME = 'taxonomy'
const CACHE_KEY = 'all-tags'
const VERSION_KEY = 'version'

interface TaxonomyCacheStore {
  key: string
  value: TaxonomyTag[] | string
}

let db: IDBPDatabase<{ taxonomy: TaxonomyCacheStore }> | null = null

async function getDB() {
  if (!db) {
    db = await openDB<{ taxonomy: TaxonomyCacheStore }>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return db
}

export async function getCachedTags(version: string): Promise<TaxonomyTag[] | null> {
  try {
    const database = await getDB()
    const cachedVersion = await database.get(STORE_NAME, VERSION_KEY) as string | undefined
    if (cachedVersion !== version) return null
    const tags = await database.get(STORE_NAME, CACHE_KEY) as TaxonomyTag[] | undefined
    return tags ?? null
  } catch {
    return null
  }
}

export async function setCachedTags(version: string, tags: TaxonomyTag[]): Promise<void> {
  try {
    const database = await getDB()
    const tx = database.transaction(STORE_NAME, 'readwrite')
    await tx.store.put(version, VERSION_KEY)
    await tx.store.put(tags, CACHE_KEY)
    await tx.done
  } catch {
    // Cache write failure is non-fatal
  }
}

export function computeVersion(fileList: string[]): string {
  // Simple version: sorted file list joined — changes when files are added/removed
  return fileList.slice().sort().join('|')
}
