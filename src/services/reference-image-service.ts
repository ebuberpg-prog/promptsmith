import type { ReferenceImage } from '@/types'

export const MAX_REFERENCE_BYTES = 10 * 1024 * 1024
export const REFERENCE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif'
const ALLOWED_TYPES = new Set(REFERENCE_ACCEPT.split(','))

export async function prepareReference(file: File): Promise<ReferenceImage> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Use a JPEG, PNG, WebP, or AVIF image.')
  if (file.size > MAX_REFERENCE_BYTES) throw new Error(`${file.name} is larger than 10 MB.`)
  const bitmap = await createImageBitmap(file)
  try {
    if (!bitmap.width || !bitmap.height) throw new Error(`${file.name} could not be decoded.`)
    return {
      id: crypto.randomUUID(),
      name: file.name,
      uploadedAt: Date.now(),
      dataUrl: resizeBitmap(bitmap, 1600, 0.86),
      extractedTags: [],
      metadata: {
        mimeType: 'image/webp',
        width: bitmap.width,
        height: bitmap.height,
        originalBytes: file.size,
        thumbnailDataUrl: resizeBitmap(bitmap, 320, 0.78),
        altText: filenameAlt(file.name),
        analysisStatus: 'not-analyzed',
      },
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(`${file.name} could not be decoded.`)
  } finally {
    bitmap.close()
  }
}

export async function prepareVisionCopy(dataUrl: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser could not prepare the reference for analysis.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const jpeg = canvas.toDataURL('image/jpeg', 0.9)
    return { base64: jpeg.split(',')[1] ?? '', mimeType: 'image/jpeg' }
  } finally {
    bitmap.close()
  }
}

function resizeBitmap(bitmap: ImageBitmap, maxDimension: number, quality: number) {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser could not prepare the image.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/webp', quality)
}

function filenameAlt(filename: string) {
  return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Local reference image'
}
