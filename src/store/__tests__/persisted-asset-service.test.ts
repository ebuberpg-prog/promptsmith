import { describe, expect, it } from 'vitest'
import {
  externalizePersistedReferenceAssets,
  hydratePersistedReferenceAssets,
  type PersistedAssetBackend,
} from '../persisted-asset-service'

function memoryBackend() {
  const assets = new Map<string, Blob>()
  let puts = 0
  const backend: PersistedAssetBackend = {
    async get(key) { return assets.get(key) ?? null },
    async put(key, value) { puts += 1; assets.set(key, value) },
    async has(key) { return assets.has(key) },
    async delete(key) { assets.delete(key) },
    async keys(prefix) { return [...assets.keys()].filter((key) => key.startsWith(prefix)) },
  }
  return { assets, backend, get puts() { return puts } }
}

describe('persisted reference assets', () => {
  it('moves image bytes out of workspace JSON and restores them on read', async () => {
    const memory = memoryBackend()
    const full = 'data:image/webp;base64,AQIDBA=='
    const thumbnail = 'data:image/webp;base64,BQY='
    const value = JSON.stringify({ state: { referenceImages: [{ id: 'reference-1', dataUrl: full, metadata: { thumbnailDataUrl: thumbnail } }] }, version: 7 })

    const externalized = await externalizePersistedReferenceAssets(value, 'promptsmith-storage', memory.backend)
    expect(externalized).not.toContain('AQIDBA')
    expect(externalized).toContain('muse-asset://reference/reference-1/full')
    expect(memory.assets.size).toBe(2)

    const hydrated = await hydratePersistedReferenceAssets(externalized, 'promptsmith-storage', memory.backend)
    const reference = JSON.parse(hydrated).state.referenceImages[0]
    expect(reference.dataUrl).toBe(full)
    expect(reference.metadata.thumbnailDataUrl).toBe(thumbnail)
  })

  it('does not rewrite unchanged blobs and removes orphaned reference files', async () => {
    const memory = memoryBackend()
    const value = JSON.stringify({ state: { referenceImages: [{ id: 'reference-1', dataUrl: 'data:image/png;base64,AQID' }] } })
    await externalizePersistedReferenceAssets(value, 'workspace-key', memory.backend)
    expect(memory.puts).toBe(1)

    await externalizePersistedReferenceAssets(value, 'workspace-key', memory.backend)
    expect(memory.puts).toBe(1)

    await externalizePersistedReferenceAssets(JSON.stringify({ state: { referenceImages: [] } }), 'workspace-key', memory.backend)
    expect(memory.assets.size).toBe(0)
  })
})
