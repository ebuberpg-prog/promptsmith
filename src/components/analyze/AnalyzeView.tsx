import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CircleNotch,
  Copy,
  Image as ImageIcon,
  SlidersHorizontal,
  Trash,
  UploadSimple,
} from '@phosphor-icons/react'
import { ActionToast } from '@/components/feedback/ActionToast'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService } from '@/services/local-ai-service'
import { analyzeReferenceImage, normalizeVisionError } from '@/services/reference-analysis-service'
import { prepareReference, REFERENCE_ACCEPT } from '@/services/reference-image-service'
import { renderAnalysisPrompt, updateAnalysisObservation } from '@/services/image-analysis-engine'
import type { AnalysisIntent, ImageAnalysis, PaletteSwatch, ReferenceImage } from '@/types'
import { cn } from '@/utils/cn'

export function AnalyzeView({ onOpenSettings, onNotify }: { onOpenSettings: () => void; onNotify: (message: string) => void }) {
  const references = usePromptSmithStore((state) => state.referenceImages)
  const activeReferenceId = usePromptSmithStore((state) => state.activeReferenceId)
  const setActiveReferenceId = usePromptSmithStore((state) => state.setActiveReferenceId)
  const addReferenceImage = usePromptSmithStore((state) => state.addReferenceImage)
  const updateReferenceImage = usePromptSmithStore((state) => state.updateReferenceImage)
  const removeReferenceImage = usePromptSmithStore((state) => state.removeReferenceImage)
  const applyReferenceAnalysisToCraft = usePromptSmithStore((state) => state.applyReferenceAnalysisToCraft)
  const aiSettings = usePromptSmithStore((state) => state.aiSettings)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState('')
  const [pendingAction, setPendingAction] = useState<'reanalyze' | 'remove' | null>(null)
  const [aiState, setAIState] = useState(aiService.getState())
  useEffect(() => aiService.subscribe(setAIState), [])

  const activeReference = references.find((reference) => reference.id === activeReferenceId) ?? null

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setMessage('')
    try {
      const reference = await prepareReference(file)
      addReferenceImage(reference)
      setActiveReferenceId(reference.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That image could not be prepared.')
    }
  }

  const analyze = async (reference: ReferenceImage) => {
    updateReferenceImage(reference.id, { metadata: { ...reference.metadata!, analysisStatus: 'analyzing', analysisError: undefined } })
    setMessage('')
    try {
      const result = await analyzeReferenceImage(reference, aiSettings, contentVisibility)
      updateReferenceImage(reference.id, {
        analysis: result.analysis,
        extractedTags: result.extractedTags,
        metadata: { ...reference.metadata!, analysisStatus: 'analyzed', analyzedBy: result.analyzedBy, analysisError: undefined },
      })
      setToast('Art-direction study saved locally')
    } catch (error) {
      const text = normalizeVisionError(error)
      updateReferenceImage(reference.id, {
        metadata: {
          ...reference.metadata!,
          analysisStatus: /text-only|vision-capable|image input/i.test(text) ? 'unsupported' : 'error',
          analysisError: text,
        },
      })
      setMessage(text)
    }
  }

  const remove = (reference: ReferenceImage) => {
    removeReferenceImage(reference.id)
  }

  const updateAnalysis = (analysis: ImageAnalysis) => {
    if (!activeReference) return
    updateReferenceImage(activeReference.id, { analysis })
  }

  const useInCraft = (intent: AnalysisIntent) => {
    if (!activeReference || !applyReferenceAnalysisToCraft(activeReference.id, intent)) return
    onNotify('Started a new Craft draft · previous draft kept in recovery')
  }

  if (!activeReference) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <section className="space-y-8" aria-labelledby="analyze-heading">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ui-muted-text)]">Visual reference study</p>
            <h1 id="analyze-heading" className="font-display text-4xl sm:text-6xl leading-none text-balance">Read the image. Rebuild the direction.</h1>
            <p className="max-w-2xl text-sm sm:text-base leading-7 text-pretty text-[var(--ui-muted-text)]">Turn one reference into a literal description, an art-direction reading, a measured palette, and two portable prompts.</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => { event.preventDefault(); setDragActive(false); void handleFiles(event.dataTransfer.files) }}
            className={cn('group min-h-[320px] w-full rounded-2xl border border-dashed px-6 py-10 flex flex-col items-center justify-center text-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2', dragActive ? 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-soft)]' : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]')}
          >
            <span className="size-14 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] flex items-center justify-center"><UploadSimple className="size-6 text-[var(--ui-muted-text)]" /></span>
            <strong className="mt-5 font-display text-2xl font-normal">Drop a reference onto the desk.</strong>
            <span className="mt-2 text-sm text-[var(--ui-muted-text)]">Or choose a JPEG, PNG, WebP, or AVIF under 10 MB</span>
            <span className="mt-5 min-h-11 rounded-lg bg-[var(--ui-text)] px-4 flex items-center text-sm text-[var(--ui-bg)]">Choose image</span>
          </button>
          <input ref={inputRef} hidden type="file" accept={REFERENCE_ACCEPT} onChange={(event) => { void handleFiles(event.target.files); event.target.value = '' }} />
          {message && <p role="alert" className="text-sm text-[var(--destructive)]">{message}</p>}
          <div className="grid gap-3 sm:grid-cols-3 text-xs leading-5 text-[var(--ui-muted-text)]">
            <p><strong className="block text-[var(--ui-text)] font-medium">Saved locally</strong>The image joins References as soon as you choose it.</p>
            <p><strong className="block text-[var(--ui-text)] font-medium">Analyzed explicitly</strong>Nothing reaches a model until you press Analyze.</p>
            <p><strong className="block text-[var(--ui-text)] font-medium">Generator-neutral</strong>Craft applies model-specific formatting later.</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ui-muted-text)]">Visual reference study</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl text-balance">{activeReference.name.replace(/\.[^.]+$/, '')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveReferenceId(null)} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-3 text-sm">New image</button>
          <button type="button" onClick={() => setPendingAction('remove')} className="size-11 rounded-lg flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Remove ${activeReference.name}`}><Trash className="size-4" /></button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)] lg:items-start">
        <ReferenceSheet reference={activeReference} />
        <div className="min-w-0">
          <AnalysisContent
            reference={activeReference}
            aiState={aiState}
            hasConfiguredProvider={Boolean(aiSettings.preferredAIProvider)}
            message={message}
            onAnalyze={() => activeReference.analysis ? setPendingAction('reanalyze') : void analyze(activeReference)}
            onOpenSettings={onOpenSettings}
            onUpdate={updateAnalysis}
            onCopy={(value, label) => void copyText(value).then(() => setToast(`${label} copied`))}
            onUseInCraft={useInCraft}
          />
        </div>
      </div>
      <input ref={inputRef} hidden type="file" accept={REFERENCE_ACCEPT} onChange={(event) => { void handleFiles(event.target.files); event.target.value = '' }} />
      <ActionToast message={toast} onDismiss={() => setToast('')} />
      <AlertDialog.Root open={pendingAction !== null} onOpenChange={(open) => { if (!open) setPendingAction(null) }}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-5 sm:p-6">
            <AlertDialog.Title className="font-display text-2xl text-balance">{pendingAction === 'remove' ? 'Remove this visual study?' : 'Replace this analysis?'}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-pretty text-[var(--ui-muted-text)]">{pendingAction === 'remove' ? 'The reference, palette, and analysis will be removed from this device and your complete backups.' : 'A new reading will replace edits made to the current Visual Anatomy Ledger. The reference image remains unchanged.'}</AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Close className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Cancel</AlertDialog.Close>
              <AlertDialog.Close onClick={() => { if (pendingAction === 'remove') remove(activeReference); else void analyze(activeReference); setPendingAction(null) }} className={cn('min-h-11 rounded-lg px-4 text-sm', pendingAction === 'remove' ? 'border border-[var(--destructive)] text-[var(--destructive)]' : 'bg-[var(--ui-text)] text-[var(--ui-bg)]')}>{pendingAction === 'remove' ? 'Remove study' : 'Re-analyze'}</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

function ReferenceSheet({ reference }: { reference: ReferenceImage }) {
  return (
    <aside className="lg:sticky lg:top-6 space-y-3" aria-label="Active reference">
      <div className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-soft)]">
        <img src={reference.dataUrl} alt={reference.metadata?.altText ?? reference.name} className="w-full max-h-[70vh] object-contain" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ui-muted-text)]">
        <span>{reference.metadata?.width} × {reference.metadata?.height}</span>
        <span>Saved locally · {formatBytes(reference.metadata?.originalBytes ?? 0)}</span>
      </div>
      {reference.analysis && <div className="flex h-8 overflow-hidden rounded-lg border border-[var(--ui-border)]" aria-label="Reference palette">{reference.analysis.palette.map((swatch) => <span key={swatch.hex} className="flex-1" style={{ backgroundColor: swatch.hex }} title={`${swatch.name} ${swatch.hex}`} />)}</div>}
    </aside>
  )
}

function AnalysisContent({ reference, aiState, hasConfiguredProvider, message, onAnalyze, onOpenSettings, onUpdate, onCopy, onUseInCraft }: {
  reference: ReferenceImage
  aiState: ReturnType<typeof aiService.getState>
  hasConfiguredProvider: boolean
  message: string
  onAnalyze: () => void
  onOpenSettings: () => void
  onUpdate: (analysis: ImageAnalysis) => void
  onCopy: (value: string, label: string) => void
  onUseInCraft: (intent: AnalysisIntent) => void
}) {
  const status = reference.metadata?.analysisStatus ?? 'not-analyzed'
  const analyzing = status === 'analyzing'
  const activeTextOnly = Boolean(aiState.activeProvider && aiState.selectedModel && !aiService.getSelectedModelCapabilities().vision)
  const needsSetup = !hasConfiguredProvider || activeTextOnly

  if (!reference.analysis && analyzing) return <AnalysisSkeleton />

  if (!reference.analysis) {
    return (
      <section className="min-h-[430px] rounded-2xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-elevated)] p-5 sm:p-8 flex flex-col justify-between" aria-labelledby="ready-heading">
        <div>
          <span className="size-11 rounded-full border border-[var(--ui-border)] flex items-center justify-center"><ImageIcon className="size-5 text-[var(--ui-muted-text)]" /></span>
          <p className="mt-8 text-xs uppercase tracking-[0.12em] text-[var(--ui-muted-text)]">Reference ready</p>
          <h2 id="ready-heading" className="mt-2 font-display text-3xl sm:text-4xl text-balance">Inspect the decisions behind the frame.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-pretty text-[var(--ui-muted-text)]">MUSE will separate visible facts from interpretation, measure the palette locally, and build an editable visual anatomy.</p>
          {message && <p role="alert" className="mt-5 rounded-xl bg-[var(--ui-surface-soft)] p-3 text-sm leading-6 text-[var(--destructive)]">{message}</p>}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          {needsSetup ? <button type="button" onClick={onOpenSettings} className="min-h-12 rounded-lg bg-[var(--ui-text)] px-5 text-sm font-medium text-[var(--ui-bg)]">Choose a vision model</button> : <button type="button" onClick={onAnalyze} className="min-h-12 rounded-lg bg-[var(--ui-text)] px-5 text-sm font-medium text-[var(--ui-bg)] flex items-center justify-center gap-2">Analyze image <ArrowRight className="size-4" /></button>}
          <p className="text-xs leading-5 text-[var(--ui-muted-text)]">Nothing is sent until this action. The resulting study is stored on this device.</p>
        </div>
      </section>
    )
  }

  const analysis = reference.analysis
  const naturalPrompt = renderAnalysisPrompt(analysis, analysis.selectedIntent, 'natural-language')
  const tagPrompt = renderAnalysisPrompt(analysis, analysis.selectedIntent, 'tag-list')
  return (
    <div className="space-y-8">
      {analyzing && <div role="status" className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 flex items-center gap-2 text-sm"><CircleNotch className="size-4 animate-spin" />Re-reading the reference. The current study remains available until the new one is complete.</div>}
      {message && <p role="alert" className="rounded-xl bg-[var(--ui-surface-soft)] p-3 text-sm leading-6 text-[var(--destructive)]">{message}</p>}
      <section className="space-y-5" aria-labelledby="reading-heading">
        <SectionHeading eyebrow="The reading" title="What is visible—and what it is doing." id="reading-heading" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div><h3 className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--ui-muted-text)]">Literal description</h3><p className="mt-2 text-sm leading-7 text-pretty">{analysis.literalDescription}</p></div>
          <div><h3 className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--ui-muted-text)]">Creative read</h3><p className="mt-2 text-sm leading-7 text-pretty">{analysis.creativeRead}</p></div>
        </div>
      </section>

      <PaletteSection analysis={analysis} onUpdate={onUpdate} onCopy={onCopy} />
      <LedgerSection analysis={analysis} onUpdate={onUpdate} />

      <section className="space-y-4" aria-labelledby="outputs-heading">
        <SectionHeading eyebrow="Ready to use" title="Two portable ways to rebuild the direction." id="outputs-heading" />
        <div className="inline-flex rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1" role="group" aria-label="Prompt intent">
          <IntentButton active={analysis.selectedIntent === 'recreate'} onClick={() => onUpdate({ ...analysis, selectedIntent: 'recreate' })}>Recreate closely</IntentButton>
          <IntentButton active={analysis.selectedIntent === 'art-direction'} onClick={() => onUpdate({ ...analysis, selectedIntent: 'art-direction' })}>Extract art direction</IntentButton>
        </div>
        <PromptOutput title="Natural language" value={naturalPrompt} onCopy={() => onCopy(naturalPrompt, 'Natural-language prompt')} onUse={() => onUseInCraft(analysis.selectedIntent)} />
        <PromptOutput title="Tag-based" value={tagPrompt} onCopy={() => onCopy(tagPrompt, 'Tag-based prompt')} onUse={() => onUseInCraft(analysis.selectedIntent)} />
      </section>

      <footer className="pt-2 border-t border-[var(--ui-border-faint)] flex flex-wrap items-center justify-between gap-3 text-[10px] text-[var(--ui-muted-text)]">
        <span>{analysis.provenance.model} · {new Date(analysis.provenance.analyzedAt).toLocaleString()}</span>
        <button type="button" onClick={onAnalyze} disabled={analyzing} className="min-h-11 rounded-lg px-3 text-xs hover:text-[var(--ui-text)] disabled:opacity-45">Re-analyze image</button>
      </footer>
    </div>
  )
}

function PaletteSection({ analysis, onUpdate, onCopy }: { analysis: ImageAnalysis; onUpdate: (analysis: ImageAnalysis) => void; onCopy: (value: string, label: string) => void }) {
  const updateSwatch = (hex: string, updates: Partial<PaletteSwatch>) => onUpdate({ ...analysis, palette: analysis.palette.map((swatch) => swatch.hex === hex ? { ...swatch, ...updates } : swatch) })
  const paletteCopy = analysis.palette.map((swatch) => `${swatch.name} ${swatch.hex} ${Math.round(swatch.prominence * 100)}%`).join('\n')
  return (
    <section className="space-y-4" aria-labelledby="palette-heading">
      <div className="flex items-end justify-between gap-4"><SectionHeading eyebrow="Measured locally" title="Palette evidence" id="palette-heading" /><button type="button" onClick={() => onCopy(paletteCopy, 'Palette')} className="min-h-11 shrink-0 rounded-lg px-3 text-xs flex items-center gap-2 text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]"><Copy className="size-4" />Copy palette</button></div>
      <div className="grid gap-2 sm:grid-cols-2">{analysis.palette.map((swatch) => <article key={swatch.hex} className={cn('min-h-20 rounded-xl border p-2 flex items-center gap-3', swatch.included ? 'border-[var(--ui-border)]' : 'border-[var(--ui-border-faint)] opacity-55')}><button type="button" onClick={() => updateSwatch(swatch.hex, { included: !swatch.included })} aria-pressed={swatch.included} aria-label={`${swatch.included ? 'Exclude' : 'Include'} ${swatch.name}`} className="size-14 shrink-0 rounded-lg border border-black/10 flex items-end justify-end p-1" style={{ backgroundColor: swatch.hex }}>{swatch.included && <span className="size-5 rounded-full bg-black/70 text-white flex items-center justify-center"><Check className="size-3" /></span>}</button><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium capitalize">{swatch.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--ui-muted-text)]">{swatch.role} · {Math.round(swatch.prominence * 100)}%</p></div><button type="button" onClick={() => onCopy(swatch.hex, swatch.hex)} className="min-h-11 rounded-lg px-2 font-mono text-xs text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]">{swatch.hex}</button></article>)}</div>
    </section>
  )
}

function LedgerSection({ analysis, onUpdate }: { analysis: ImageAnalysis; onUpdate: (analysis: ImageAnalysis) => void }) {
  return (
    <section className="space-y-4" aria-labelledby="ledger-heading">
      <SectionHeading eyebrow="Visual Anatomy Ledger" title="Keep only the decisions that matter." id="ledger-heading" />
      <p className="text-xs leading-5 text-[var(--ui-muted-text)]">Every row feeds both prompts. Inferred notes are interpretations; observed notes describe visible evidence.</p>
      <div className="divide-y divide-[var(--ui-border-faint)] border-y border-[var(--ui-border)]">{analysis.observations.map((observation) => <div key={observation.id} className={cn('grid grid-cols-[44px_minmax(0,1fr)] gap-3 py-3', !observation.included && 'opacity-50')}><button type="button" aria-pressed={observation.included} onClick={() => onUpdate(updateAnalysisObservation(analysis, observation.id, { included: !observation.included }))} className={cn('size-11 rounded-lg border flex items-center justify-center', observation.included ? 'border-[var(--ui-text)] bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'border-[var(--ui-border)]')} aria-label={`${observation.included ? 'Exclude' : 'Include'} ${observation.dimension} from prompts`}>{observation.included && <Check className="size-4" />}</button><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-[10px] font-medium uppercase tracking-[0.1em]">{observation.dimension}</span><span className="text-[10px] text-[var(--ui-muted-text)]">{observation.evidence}</span>{observation.scope === 'scene' && <span className="text-[10px] text-[var(--ui-muted-text)]">image-specific</span>}</div><textarea value={observation.text} onChange={(event) => onUpdate(updateAnalysisObservation(analysis, observation.id, { text: event.target.value }))} aria-label={`${observation.dimension} observation`} className="w-full min-h-11 resize-y rounded-lg bg-[var(--ui-surface-soft)] px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></div></div>)}</div>
    </section>
  )
}

function PromptOutput({ title, value, onCopy, onUse }: { title: string; value: string; onCopy: () => void; onUse: () => void }) {
  return <article className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] overflow-hidden"><div className="min-h-12 px-4 border-b border-[var(--ui-border-faint)] flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{title}</h3><div className="flex gap-1"><button type="button" onClick={onCopy} disabled={!value} className="min-h-11 rounded-lg px-3 text-xs flex items-center gap-2 disabled:opacity-45"><Copy className="size-4" />Copy</button><button type="button" onClick={onUse} disabled={!value} className="min-h-11 rounded-lg bg-[var(--ui-text)] px-3 text-xs text-[var(--ui-bg)] flex items-center gap-2 disabled:opacity-45">Use in Craft <ArrowRight className="size-3.5" /></button></div></div><p className="min-h-28 whitespace-pre-wrap px-4 py-4 text-sm leading-7 text-pretty">{value || 'Include at least one ledger observation to build this prompt.'}</p></article>
}

function AnalysisSkeleton() {
  return <section className="space-y-8" aria-live="polite" aria-busy="true"><div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 flex items-center gap-2 text-sm"><CircleNotch className="size-4 animate-spin" />Reading composition, light, material, and color…</div>{[2, 4, 3].map((rows, section) => <div key={section} className="space-y-3"><div className="h-3 w-28 rounded bg-[var(--ui-surface-soft)]" /><div className="h-8 w-2/3 rounded bg-[var(--ui-surface-soft)]" />{Array.from({ length: rows }, (_, index) => <div key={index} className="h-14 rounded-xl border border-[var(--ui-border-faint)] bg-[var(--ui-surface-elevated)]" />)}</div>)}</section>
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) { return <div><p className="text-xs uppercase tracking-[0.12em] text-[var(--ui-muted-text)]">{eyebrow}</p><h2 id={id} className="mt-1 font-display text-2xl sm:text-3xl text-balance">{title}</h2></div> }
function IntentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={cn('min-h-11 rounded-lg px-3 text-xs flex items-center gap-2', active ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]')}><SlidersHorizontal className="size-3.5" />{children}</button> }
async function copyText(value: string) { await navigator.clipboard.writeText(value) }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` }
