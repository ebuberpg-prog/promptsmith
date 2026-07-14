const POINTER_PREFIX = 'muse-asset://'

export interface PersistedAssetBackend {
  get: (key: string) => Promise<Blob | null>
  put: (key: string, value: Blob) => Promise<void>
  has: (key: string) => Promise<boolean>
  delete: (key: string) => Promise<void>
  keys: (prefix: string) => Promise<string[]>
}

type PersistedEnvelope = {
  state?: {
    referenceImages?: Array<{
      id?: string
      dataUrl?: string
      metadata?: { thumbnailDataUrl?: string }
    }>
  }
}

function referenceAssetKey(storageKey: string, referenceId: string, kind: 'full' | 'thumbnail') {
  return `${storageKey}::assets::reference::${referenceId}::${kind}`
}

function referencePointer(referenceId: string, kind: 'full' | 'thumbnail') {
  return `${POINTER_PREFIX}reference/${encodeURIComponent(referenceId)}/${kind}`
}

function pointerParts(value: string) {
  if (!value.startsWith(POINTER_PREFIX)) return null
  const match = value.slice(POINTER_PREFIX.length).match(/^reference\/([^/]+)\/(full|thumbnail)$/)
  return match ? { referenceId: decodeURIComponent(match[1]), kind: match[2] as 'full' | 'thumbnail' } : null
}

export function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]*)(;base64)?,(.*)$/s)
  if (!match) throw new Error('Reference image data is invalid.')
  const mimeType = match[1] || 'application/octet-stream'
  const binary = match[2] ? atob(match[3]) : decodeURIComponent(match[3])
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

export async function blobToDataUrl(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`
}

export async function externalizePersistedReferenceAssets(value: string, storageKey: string, backend: PersistedAssetBackend) {
  const envelope = JSON.parse(value) as PersistedEnvelope
  const references = Array.isArray(envelope.state?.referenceImages) ? envelope.state.referenceImages : []
  const activeKeys = new Set<string>()

  for (const reference of references) {
    if (!reference || typeof reference.id !== 'string' || !reference.id) continue
    const fullKey = referenceAssetKey(storageKey, reference.id, 'full')
    if (typeof reference.dataUrl === 'string' && reference.dataUrl.startsWith('data:')) {
      if (!await backend.has(fullKey)) await backend.put(fullKey, dataUrlToBlob(reference.dataUrl))
      reference.dataUrl = referencePointer(reference.id, 'full')
      activeKeys.add(fullKey)
    } else if (typeof reference.dataUrl === 'string' && pointerParts(reference.dataUrl)) {
      activeKeys.add(fullKey)
    }

    const thumbnail = reference.metadata?.thumbnailDataUrl
    const thumbnailKey = referenceAssetKey(storageKey, reference.id, 'thumbnail')
    if (typeof thumbnail === 'string' && thumbnail.startsWith('data:')) {
      if (!await backend.has(thumbnailKey)) await backend.put(thumbnailKey, dataUrlToBlob(thumbnail))
      reference.metadata!.thumbnailDataUrl = referencePointer(reference.id, 'thumbnail')
      activeKeys.add(thumbnailKey)
    } else if (typeof thumbnail === 'string' && pointerParts(thumbnail)) {
      activeKeys.add(thumbnailKey)
    }
  }

  const prefix = `${storageKey}::assets::reference::`
  const existingKeys = await backend.keys(prefix)
  await Promise.all(existingKeys.filter((key) => !activeKeys.has(key)).map((key) => backend.delete(key)))
  return JSON.stringify(envelope)
}

export async function hydratePersistedReferenceAssets(value: string, storageKey: string, backend: PersistedAssetBackend) {
  const envelope = JSON.parse(value) as PersistedEnvelope
  const references = Array.isArray(envelope.state?.referenceImages) ? envelope.state.referenceImages : []

  for (const reference of references) {
    if (!reference || typeof reference.id !== 'string' || !reference.id) continue
    const fullPointer = typeof reference.dataUrl === 'string' ? pointerParts(reference.dataUrl) : null
    if (fullPointer) {
      const blob = await backend.get(referenceAssetKey(storageKey, fullPointer.referenceId, fullPointer.kind))
      if (!blob) throw new Error(`The stored image for ${reference.id} is missing.`)
      reference.dataUrl = await blobToDataUrl(blob)
    }
    const thumbnail = reference.metadata?.thumbnailDataUrl
    const thumbnailPointer = typeof thumbnail === 'string' ? pointerParts(thumbnail) : null
    if (thumbnailPointer) {
      const blob = await backend.get(referenceAssetKey(storageKey, thumbnailPointer.referenceId, thumbnailPointer.kind))
      if (!blob) throw new Error(`The stored thumbnail for ${reference.id} is missing.`)
      reference.metadata!.thumbnailDataUrl = await blobToDataUrl(blob)
    }
  }

  return JSON.stringify(envelope)
}
