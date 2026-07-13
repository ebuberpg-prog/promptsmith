import { useEffect, useRef, useState } from 'react'
import { ArrowLineDown, CircleNotch, Image as ImageIcon, Plus, Trash, Upload } from '@phosphor-icons/react'
import { Tooltip } from '@base-ui/react/tooltip'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService } from '@/services/local-ai-service'
import { getTagById, searchTagIndexScored } from '@/utils/tag-index'
import type { ExtractedTag, ReferenceImage } from '@/types'

const MAX_REFERENCES = 12
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export function ReferenceUploader({ layout = 'compact' }: { layout?: 'compact' | 'library' }) {
  const referenceImages = usePromptSmithStore((state) => state.referenceImages)
  const addReferenceImage = usePromptSmithStore((state) => state.addReferenceImage)
  const updateReferenceImage = usePromptSmithStore((state) => state.updateReferenceImage)
  const removeReferenceImage = usePromptSmithStore((state) => state.removeReferenceImage)
  const aiSettings = usePromptSmithStore((state) => state.aiSettings)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const addTag = usePromptSmithStore((state) => state.addTag)
  const customText = usePromptSmithStore((state) => state.customText)
  const setCustomText = usePromptSmithStore((state) => state.setCustomText)
  const captureDraftSnapshot = usePromptSmithStore((state) => state.captureDraftSnapshot)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [message, setMessage] = useState('')
  const [aiState, setAIState] = useState(aiService.getState())
  useEffect(() => aiService.subscribe(setAIState), [])
  const visionUnavailable = Boolean(aiState.activeProvider && aiState.selectedModel && !aiService.getSelectedModelCapabilities().vision)
  const libraryLayout = layout === 'library'

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setMessage('')
    const available = MAX_REFERENCES - referenceImages.length
    if (available <= 0) { setMessage('Remove a reference before adding another.'); return }
    for (const file of Array.from(files).slice(0, available)) {
      try {
        const prepared = await prepareReference(file)
        addReferenceImage(prepared)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'That reference could not be stored.')
      }
    }
  }

  const analyze = async (image: ReferenceImage) => {
    updateReferenceImage(image.id, { metadata: { ...image.metadata!, analysisStatus: 'analyzing', analysisError: undefined } })
    try {
      aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl)
      aiService.setCompatibleUrls(aiSettings.openAICompatibleUrl, aiSettings.anthropicCompatibleUrl, aiSettings.useApiGateway !== false ? (aiSettings.apiGatewayUrl || 'https://prompt-smith.ebuberpg.workers.dev') : '')
      if (aiService.getState().status !== 'connected') await aiService.discover(aiSettings.preferredAIProvider)
      if (!aiService.getSelectedModelCapabilities().vision) throw new Error(`${aiService.getState().selectedModel ?? 'The selected model'} is text-only. Choose a vision-capable model in Settings.`)
      const visionCopy = await prepareVisionCopy(image.dataUrl)
      const labels = splitCombinedVisionLabels(await aiService.imageToTags(visionCopy.base64, visionCopy.mimeType))
      const seen = new Set<string>()
      const extractedTags: ExtractedTag[] = labels.flatMap((label) => {
        const result = searchTagIndexScored(label, contentVisibility, 1)[0]
        const confidenceLimit = result?.matchedField === 'description' ? 0.12 : 0.18
        if (result && result.score <= confidenceLimit && !seen.has(result.tag.id)) {
          seen.add(result.tag.id)
          return [{ id: result.tag.id, label: result.tag.label, confidence: Math.max(0, 1 - result.score), source: 'blip' as const }]
        }
        const clean = label.replace(/\s+/g, ' ').trim()
        const key = clean.toLocaleLowerCase()
        if (clean.length < 2 || clean.length > 60 || seen.has(key)) return []
        seen.add(key)
        return [{ id: `vision:${key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, label: clean, confidence: 0.65, source: 'blip' as const }]
      }).slice(0, 16)
      const state = aiService.getState()
      updateReferenceImage(image.id, {
        extractedTags,
        metadata: { ...image.metadata!, analysisStatus: 'analyzed', analyzedBy: { provider: state.activeProvider!, model: state.selectedModel!, analyzedAt: Date.now() } },
      })
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Reference analysis failed.'
      const text = /no endpoints found that support image input/i.test(raw)
        ? 'This provider route does not offer image input for the selected model. Use a vision-enabled endpoint, such as Xiaomi’s direct multimodal API or a local vision model.'
        : raw
      updateReferenceImage(image.id, { metadata: { ...image.metadata!, analysisStatus: text.includes('text-only') || text.includes('vision') ? 'unsupported' : 'error', analysisError: text } })
    }
  }

  const injectNotes = (image: ReferenceImage, ids?: string[]) => {
    const notes = image.extractedTags.filter((tag) => !ids || ids.includes(tag.id))
    if (!notes.length) return
    captureDraftSnapshot('manual')
    const authored: string[] = []
    notes.forEach((note) => {
      const taxonomyTag = getTagById(note.id)
      if (taxonomyTag && (contentVisibility === 'all' || !taxonomyTag.explicit)) addTag(taxonomyTag)
      else authored.push(note.label)
    })
    if (authored.length) {
      const existing = new Set(customText.toLowerCase().split(/\s*,\s*/))
      const additions = authored.filter((label) => !existing.has(label.toLowerCase()))
      if (additions.length) setCustomText([customText.trim(), additions.join(', ')].filter(Boolean).join(', '))
    }
    setMessage(`${notes.length === 1 ? notes[0].label : `${notes.length} visual notes`} added · Undo available`)
  }

  return (
    <section className="space-y-3" aria-labelledby="reference-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 id="reference-heading" className="text-sm font-medium">References</h3><p className="mt-1 text-xs leading-5 text-[var(--ui-muted-text)]">Stored privately. Analyze only when you choose.</p></div><div className="flex items-center gap-3"><span className="text-xs tabular-nums text-[var(--ui-muted-text)]">{referenceImages.length} of {MAX_REFERENCES}</span>{libraryLayout && <button type="button" onClick={() => inputRef.current?.click()} disabled={referenceImages.length >= MAX_REFERENCES} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] flex items-center gap-2 text-xs disabled:opacity-55"><Upload className="size-4" />{referenceImages.length >= MAX_REFERENCES ? 'Library full' : 'Add reference'}</button>}</div></div>
      {!libraryLayout && <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); if (referenceImages.length < MAX_REFERENCES) setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); void handleFiles(event.dataTransfer.files) }} className={`w-full min-h-20 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-55 ${dragActive ? 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-soft)]' : 'border-[var(--ui-border)] text-[var(--ui-muted-text)]'}`} disabled={referenceImages.length >= MAX_REFERENCES} aria-describedby={referenceImages.length >= MAX_REFERENCES ? 'reference-capacity-message' : undefined}><Upload className="size-5" />{referenceImages.length >= MAX_REFERENCES ? 'Reference library full' : 'Add a local reference'}</button>}
      {referenceImages.length >= MAX_REFERENCES && <p id="reference-capacity-message" className="text-xs text-[var(--ui-muted-text)]">Remove a reference before adding another. Export a complete backup first if you want to keep it elsewhere.</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(event) => { void handleFiles(event.target.files); event.target.value = '' }} />
      {message && <p role="status" className="text-xs text-[var(--destructive)]">{message}</p>}
      {visionUnavailable && <p className="rounded-lg bg-[var(--ui-surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--ui-muted-text)]">{aiState.selectedModel} is text-only. References remain stored locally; choose a vision-capable model to analyze them.</p>}
      <div className={libraryLayout ? 'grid gap-3 lg:grid-cols-2' : 'space-y-2'}>{referenceImages.map((image) => <ReferenceRow key={image.id} image={image} visionUnavailable={visionUnavailable} onAnalyze={() => void analyze(image)} onInject={(ids) => injectNotes(image, ids)} onRemove={() => { if (window.confirm(`Remove ${image.name} from this device?`)) removeReferenceImage(image.id) }} />)}</div>
      {referenceImages.length === 0 && <div className="min-h-20 rounded-xl border border-[var(--ui-border)] flex items-center gap-3 px-4 text-[var(--ui-muted-text)]"><ImageIcon className="size-5" /><span className="text-xs">No references stored.</span></div>}
    </section>
  )
}

function ReferenceRow({ image, visionUnavailable, onAnalyze, onInject, onRemove }: { image: ReferenceImage; visionUnavailable: boolean; onAnalyze: () => void; onInject: (ids?: string[]) => void; onRemove: () => void }) {
  const status = image.metadata?.analysisStatus ?? 'not-analyzed'
  const analyzing = status === 'analyzing'
  const retry = status === 'error' || status === 'unsupported'
  const statusText = status === 'analyzed' ? `${image.extractedTags.length} notes · ${image.metadata?.analyzedBy?.model}` : status === 'not-analyzed' ? 'Not analyzed' : status === 'analyzing' ? 'Analyzing…' : image.metadata?.analysisError ?? 'Analysis unavailable'
  return <article className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-3"><div className="flex items-start gap-3"><img src={image.metadata?.thumbnailDataUrl ?? image.dataUrl} alt={image.metadata?.altText ?? image.name} className="size-16 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1 pt-0.5"><p className="truncate text-xs font-medium">{image.name}</p><p className={`mt-1 text-[10px] leading-4 ${status === 'error' || status === 'unsupported' ? 'text-[var(--destructive)]' : 'text-[var(--ui-muted-text)] line-clamp-2'}`}>{statusText}</p></div><Tooltip.Root><Tooltip.Trigger onClick={onRemove} className="size-11 -mr-2 -mt-2 rounded-lg flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Remove ${image.name}`}><Trash className="size-4" /></Tooltip.Trigger><Tooltip.Portal><Tooltip.Positioner sideOffset={6} className="z-50"><Tooltip.Popup className="rounded-md bg-[var(--ui-text)] px-2 py-1 text-xs text-[var(--ui-bg)]">Remove reference</Tooltip.Popup></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root></div>{status === 'analyzed' && image.extractedTags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{image.extractedTags.slice(0, 12).map((tag) => <button type="button" key={tag.id} onClick={() => onInject([tag.id])} className="min-h-9 px-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] text-[10px] flex items-center gap-1.5" aria-label={`Add ${tag.label} to prompt`}><Plus className="size-3" />{tag.label}</button>)}{image.extractedTags.length > 12 && <span className="min-h-9 px-2.5 flex items-center text-[10px] text-[var(--ui-muted-text)]">+{image.extractedTags.length - 12} more in Add all</span>}</div>}<div className="mt-3 flex flex-wrap gap-2">{status === 'analyzed' && image.extractedTags.length > 0 && <button type="button" onClick={() => onInject()} className="min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs flex items-center gap-2"><ArrowLineDown className="size-4" />Add all {image.extractedTags.length}</button>}<button type="button" onClick={onAnalyze} disabled={analyzing || visionUnavailable} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs flex items-center gap-2 disabled:opacity-45" aria-label={visionUnavailable ? `Choose a vision-capable model to analyze ${image.name}` : `${retry ? 'Retry analysis for' : 'Analyze'} ${image.name}`}>{analyzing && <CircleNotch className="size-4 animate-spin" />}{analyzing ? 'Analyzing…' : visionUnavailable ? 'Vision model required' : retry ? 'Retry analysis' : 'Analyze image'}</button></div></article>
}

function splitCombinedVisionLabels(labels: string[]) {
  const atomic = labels.flatMap((label) => label.split(/[,;|]|\s+\/\s+/g)).map((label) => label.replace(/\s+/g, ' ').trim()).filter((label) => label.length >= 2 && label.length <= 60)
  const seen = new Set<string>()
  return atomic.filter((label) => { const key = label.toLocaleLowerCase(); if (seen.has(key)) return false; seen.add(key); return true }).slice(0, 24)
}

async function prepareReference(file: File): Promise<ReferenceImage> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Use a JPEG, PNG, WebP, or AVIF image.')
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 10 MB.`)
  const objectUrl = URL.createObjectURL(file)
  try {
    const bitmap = await createImageBitmap(file)
    if (!bitmap.width || !bitmap.height) throw new Error(`${file.name} could not be decoded.`)
    const width = bitmap.width
    const height = bitmap.height
    const dataUrl = resizeBitmap(bitmap, 1600, 0.86)
    const thumbnailDataUrl = resizeBitmap(bitmap, 320, 0.78)
    bitmap.close()
    return {
      id: crypto.randomUUID(), name: file.name, uploadedAt: Date.now(), dataUrl, extractedTags: [],
      metadata: { mimeType: 'image/webp', width, height, originalBytes: file.size, thumbnailDataUrl, altText: filenameAlt(file.name), analysisStatus: 'not-analyzed' },
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(`${file.name} could not be decoded.`)
  } finally { URL.revokeObjectURL(objectUrl) }
}

function resizeBitmap(bitmap: ImageBitmap, maxDimension: number, quality: number) {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser could not prepare the image.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/webp', quality)
}

async function prepareVisionCopy(dataUrl: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser could not prepare the reference for local analysis.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const jpeg = canvas.toDataURL('image/jpeg', 0.9)
    return { base64: jpeg.split(',')[1] ?? '', mimeType: 'image/jpeg' }
  } finally { bitmap.close() }
}

function filenameAlt(filename: string) { return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Local reference image' }
