import { useEffect, useRef, useState } from 'react'
import { ArrowLineDown, CircleNotch, Image as ImageIcon, Plus, Trash, Upload } from '@phosphor-icons/react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService } from '@/services/local-ai-service'
import { analyzeReferenceImage, normalizeVisionError } from '@/services/reference-analysis-service'
import { prepareReference, REFERENCE_ACCEPT } from '@/services/reference-image-service'
import { getTagById } from '@/utils/tag-index'
import type { ReferenceImage } from '@/types'
import { cn } from '@/utils/cn'

const MAX_REFERENCES = 12

export function ReferenceUploader({ layout = 'compact' }: { layout?: 'compact' | 'library' }) {
  const referenceImages = usePromptSmithStore((state) => state.referenceImages)
  const addReferenceImage = usePromptSmithStore((state) => state.addReferenceImage)
  const updateReferenceImage = usePromptSmithStore((state) => state.updateReferenceImage)
  const removeReferenceImage = usePromptSmithStore((state) => state.removeReferenceImage)
  const openReferenceInAnalyze = usePromptSmithStore((state) => state.openReferenceInAnalyze)
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
      const result = await analyzeReferenceImage(image, aiSettings, contentVisibility)
      updateReferenceImage(image.id, {
        analysis: result.analysis,
        extractedTags: result.extractedTags,
        metadata: { ...image.metadata!, analysisStatus: 'analyzed', analyzedBy: result.analyzedBy },
      })
    } catch (error) {
      const text = normalizeVisionError(error)
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
      {!libraryLayout && <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); if (referenceImages.length < MAX_REFERENCES) setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); void handleFiles(event.dataTransfer.files) }} className={cn('w-full min-h-20 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-55', dragActive ? 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-soft)]' : 'border-[var(--ui-border)] text-[var(--ui-muted-text)]')} disabled={referenceImages.length >= MAX_REFERENCES} aria-describedby={referenceImages.length >= MAX_REFERENCES ? 'reference-capacity-message' : undefined}><Upload className="size-5" />{referenceImages.length >= MAX_REFERENCES ? 'Reference library full' : 'Add a local reference'}</button>}
      {referenceImages.length >= MAX_REFERENCES && <p id="reference-capacity-message" className="text-xs text-[var(--ui-muted-text)]">Remove a reference before adding another. Export a complete backup first if you want to keep it elsewhere.</p>}
      <input ref={inputRef} type="file" accept={REFERENCE_ACCEPT} multiple hidden onChange={(event) => { void handleFiles(event.target.files); event.target.value = '' }} />
      {message && <p role="status" className="text-xs text-[var(--destructive)]">{message}</p>}
      {visionUnavailable && <p className="rounded-lg bg-[var(--ui-surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--ui-muted-text)]">{aiState.selectedModel} is text-only. References remain stored locally; choose a vision-capable model to analyze them.</p>}
      <div className={cn(libraryLayout ? 'grid gap-3 lg:grid-cols-2' : 'space-y-2')}>{referenceImages.map((image) => <ReferenceRow key={image.id} image={image} libraryLayout={libraryLayout} visionUnavailable={visionUnavailable} onAnalyze={() => void analyze(image)} onOpen={() => openReferenceInAnalyze(image.id)} onInject={(ids) => injectNotes(image, ids)} onRemove={() => removeReferenceImage(image.id)} />)}</div>
      {referenceImages.length === 0 && <div className="min-h-20 rounded-xl border border-[var(--ui-border)] flex items-center gap-3 px-4 text-[var(--ui-muted-text)]"><ImageIcon className="size-5" /><span className="text-xs">No references stored.</span></div>}
    </section>
  )
}

function ReferenceRow({ image, libraryLayout, visionUnavailable, onAnalyze, onOpen, onInject, onRemove }: { image: ReferenceImage; libraryLayout: boolean; visionUnavailable: boolean; onAnalyze: () => void; onOpen: () => void; onInject: (ids?: string[]) => void; onRemove: () => void }) {
  const status = image.metadata?.analysisStatus ?? 'not-analyzed'
  const analyzing = status === 'analyzing'
  const retry = status === 'error' || status === 'unsupported'
  const statusText = status === 'analyzed' ? `${image.extractedTags.length} notes · ${image.metadata?.analyzedBy?.model}` : status === 'not-analyzed' ? 'Not analyzed' : status === 'analyzing' ? 'Analyzing…' : image.metadata?.analysisError ?? 'Analysis unavailable'
  return (
    <article className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-3">
      <div className="flex items-start gap-3">
        <img src={image.metadata?.thumbnailDataUrl ?? image.dataUrl} alt={image.metadata?.altText ?? image.name} className="size-16 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-xs font-medium">{image.name}</p>
          <p className={cn('mt-1 text-[10px] leading-4', status === 'error' || status === 'unsupported' ? 'text-[var(--destructive)]' : 'text-[var(--ui-muted-text)] line-clamp-2')}>{image.analysis?.literalDescription ?? statusText}</p>
        </div>
        <AlertDialog.Root>
          <AlertDialog.Trigger className="size-11 -mr-2 -mt-2 rounded-lg flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Remove ${image.name}`}><Trash className="size-4" /></AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" />
            <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-5 sm:p-6">
              <AlertDialog.Title className="font-display text-2xl text-balance">Remove this reference?</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm leading-6 text-pretty text-[var(--ui-muted-text)]">{image.analysis ? 'The image and its complete art-direction study will be removed from this device.' : 'The locally stored image will be removed from References.'}</AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Cancel</AlertDialog.Close><AlertDialog.Close onClick={onRemove} className="min-h-11 rounded-lg border border-[var(--destructive)] px-4 text-sm text-[var(--destructive)]">Remove</AlertDialog.Close></div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
      {libraryLayout && image.analysis && <div className="mt-3 flex min-h-10 overflow-hidden rounded-lg border border-[var(--ui-border)]" aria-label="Extracted color palette">{image.analysis.palette.map((swatch) => <span key={swatch.hex} className="flex-1" style={{ backgroundColor: swatch.hex }} title={`${swatch.name} ${swatch.hex}`} />)}</div>}
      {status === 'analyzed' && image.extractedTags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{image.extractedTags.slice(0, 12).map((tag) => <button type="button" key={tag.id} onClick={() => onInject([tag.id])} className="min-h-9 px-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] text-[10px] flex items-center gap-1.5" aria-label={`Add ${tag.label} to prompt`}><Plus className="size-3" />{tag.label}</button>)}{image.extractedTags.length > 12 && <span className="min-h-9 px-2.5 flex items-center text-[10px] text-[var(--ui-muted-text)]">+{image.extractedTags.length - 12} more in Add all</span>}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        {status === 'analyzed' && image.extractedTags.length > 0 && <button type="button" onClick={() => onInject()} className="min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs flex items-center gap-2"><ArrowLineDown className="size-4" />Add all {image.extractedTags.length}</button>}
        {(libraryLayout || image.analysis) && <button type="button" onClick={onOpen} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">{image.analysis ? 'Open in Analyze' : 'Analyze in workspace'}</button>}
        <AnalysisAction image={image} analyzing={analyzing} retry={retry} visionUnavailable={visionUnavailable} onAnalyze={onAnalyze} />
      </div>
    </article>
  )
}

function AnalysisAction({ image, analyzing, retry, visionUnavailable, onAnalyze }: { image: ReferenceImage; analyzing: boolean; retry: boolean; visionUnavailable: boolean; onAnalyze: () => void }) {
  const label = analyzing ? 'Analyzing…' : visionUnavailable ? 'Vision model required' : retry ? 'Retry analysis' : image.analysis ? 'Re-analyze' : 'Analyze image'
  const button = <button type="button" onClick={image.analysis ? undefined : onAnalyze} disabled={analyzing || visionUnavailable} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs flex items-center gap-2 disabled:opacity-45" aria-label={visionUnavailable ? `Choose a vision-capable model to analyze ${image.name}` : `${retry ? 'Retry analysis for' : 'Analyze'} ${image.name}`}>{analyzing && <CircleNotch className="size-4 animate-spin" />}{label}</button>
  if (!image.analysis || analyzing || visionUnavailable) return button
  return <AlertDialog.Root><AlertDialog.Trigger render={button} /><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-5 sm:p-6"><AlertDialog.Title className="font-display text-2xl text-balance">Replace this analysis?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm leading-6 text-pretty text-[var(--ui-muted-text)]">A new reading will replace edits made to the current Visual Anatomy Ledger. The reference image remains unchanged.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Cancel</AlertDialog.Close><AlertDialog.Close onClick={onAnalyze} className="min-h-11 rounded-lg bg-[var(--ui-text)] px-4 text-sm text-[var(--ui-bg)]">Re-analyze</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>
}
