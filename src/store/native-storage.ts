import type { PersistedAssetBackend } from './persisted-asset-service'

type NativeAssetRow = { asset_key: string; path: string; mime_type: string; byte_size: number }
type NativeStateRow = { value: string }

let databasePromise: Promise<import('@tauri-apps/plugin-sql').default> | null = null

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = import('@tauri-apps/plugin-sql').then(async ({ default: Database }) => {
      const database = await Database.load('sqlite:muse.db')
      await database.execute('CREATE TABLE IF NOT EXISTS workspace_state (storage_key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)')
      await database.execute('CREATE TABLE IF NOT EXISTS workspace_assets (asset_key TEXT PRIMARY KEY, path TEXT NOT NULL, mime_type TEXT NOT NULL, byte_size INTEGER NOT NULL, updated_at INTEGER NOT NULL)')
      return database
    })
  }
  return databasePromise
}

function safeAssetPath(key: string) {
  return `assets/${key.replace(/[^a-zA-Z0-9._-]+/g, '_')}.bin`
}

export const nativeAssetBackend: PersistedAssetBackend = {
  async get(key) {
    const database = await getDatabase()
    const rows = await database.select<NativeAssetRow[]>('SELECT asset_key, path, mime_type, byte_size FROM workspace_assets WHERE asset_key = $1', [key])
    const row = rows[0]
    if (!row) return null
    const { readFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const bytes = await readFile(row.path, { baseDir: BaseDirectory.AppLocalData })
    return new Blob([bytes], { type: row.mime_type })
  },
  async put(key, value) {
    const path = safeAssetPath(key)
    const { mkdir, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    await mkdir('assets', { baseDir: BaseDirectory.AppLocalData, recursive: true })
    await writeFile(path, new Uint8Array(await value.arrayBuffer()), { baseDir: BaseDirectory.AppLocalData })
    const database = await getDatabase()
    await database.execute(
      'INSERT INTO workspace_assets (asset_key, path, mime_type, byte_size, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT(asset_key) DO UPDATE SET path = excluded.path, mime_type = excluded.mime_type, byte_size = excluded.byte_size, updated_at = excluded.updated_at',
      [key, path, value.type || 'application/octet-stream', value.size, Date.now()],
    )
  },
  async has(key) {
    const database = await getDatabase()
    const rows = await database.select<Array<{ count: number }>>('SELECT COUNT(*) AS count FROM workspace_assets WHERE asset_key = $1', [key])
    return Number(rows[0]?.count ?? 0) > 0
  },
  async delete(key) {
    const database = await getDatabase()
    const rows = await database.select<NativeAssetRow[]>('SELECT asset_key, path, mime_type, byte_size FROM workspace_assets WHERE asset_key = $1', [key])
    if (rows[0]) {
      const { exists, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs')
      if (await exists(rows[0].path, { baseDir: BaseDirectory.AppLocalData })) await remove(rows[0].path, { baseDir: BaseDirectory.AppLocalData })
    }
    await database.execute('DELETE FROM workspace_assets WHERE asset_key = $1', [key])
  },
  async keys(prefix) {
    const database = await getDatabase()
    const rows = await database.select<Array<{ asset_key: string }>>('SELECT asset_key FROM workspace_assets WHERE asset_key LIKE $1', [`${prefix}%`])
    return rows.map((row) => row.asset_key)
  },
}

export async function readNativeState(storageKey: string) {
  const database = await getDatabase()
  const rows = await database.select<NativeStateRow[]>('SELECT value FROM workspace_state WHERE storage_key = $1', [storageKey])
  return rows[0]?.value ?? null
}

export async function writeNativeState(storageKey: string, value: string) {
  const database = await getDatabase()
  await database.execute(
    'INSERT INTO workspace_state (storage_key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(storage_key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    [storageKey, value, Date.now()],
  )
}

export async function removeNativeState(storageKey: string) {
  const database = await getDatabase()
  await database.execute('DELETE FROM workspace_state WHERE storage_key = $1', [storageKey])
  const assetKeys = await nativeAssetBackend.keys(`${storageKey}::assets::`)
  await Promise.all(assetKeys.map((key) => nativeAssetBackend.delete(key)))
}

export async function getNativeStorageUsage() {
  const database = await getDatabase()
  const assetRows = await database.select<Array<{ total: number | null }>>('SELECT SUM(byte_size) AS total FROM workspace_assets')
  const stateRows = await database.select<Array<{ total: number | null }>>('SELECT SUM(LENGTH(value)) AS total FROM workspace_state')
  return Number(assetRows[0]?.total ?? 0) + Number(stateRows[0]?.total ?? 0)
}
