import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Menu } from '@base-ui/react/menu'
import { ArrowClockwise, ArrowCounterClockwise, CaretDown, Check, CheckCircle, Copy, DotsThree, FilePlus, FloppyDisk, Minus, Plus, Shuffle, Sparkle, Tag, Trash } from '@phosphor-icons/react'
import { BUILT_IN_FORMATTER_PROFILES } from '@/data/formatter-profiles'
import { getModelConfig } from '@/data/model-configs'
import { RelatedTagSuggestions } from './RelatedTagSuggestions'
import { LMPromptEnhancer } from '@/components/ai/LMPromptEnhancer'
import { useHistoryStore } from '@/store/history-store'
import { usePromptSmithStore } from '@/store/prompt-store'
import type { DraftSnapshot, FormatterProfile, PromptTemplate, PromptVersion, SelectedTag } from '@/types'
import { useDraftPersistenceState } from '@/hooks/useDraftPersistenceState'
import { ActionToast } from '@/components/feedback/ActionToast'
import { suggestPromptTitle } from '@/utils/prompt-title'

export function PromptOutput() {
  const store = usePromptSmithStore()
  const persistenceState = useDraftPersistenceState()
  const canUndo = useHistoryStore((state) => state.past.length > 0)
  const canRedo = useHistoryStore((state) => state.future.length > 0)
  const prompt = store.generatePrompt()
  const negativePrompt = store.generateNegativePrompt()
  const hasContent = Boolean(store.customText.trim() || store.selectedTags.length)
  const hasAuthoredText = Boolean(store.customText.trim())
  const hasIngredients = store.selectedTags.length > 0
  const suggestedName = useMemo(() => suggestPromptTitle(store.customText, store.selectedTags.map((tag) => tag.label)), [store.customText, store.selectedTags])
  const modelLabel = getModelConfig(store.selectedModel).name
  const profiles = [...BUILT_IN_FORMATTER_PROFILES, ...store.customFormatterProfiles]
  const versions = store.activePromptId ? store.promptVersions[store.activePromptId] ?? [] : []
  const activePrompt = store.activePromptId ? store.savedPrompts.find((item) => item.id === store.activePromptId) : undefined
  const [saveName, setSaveName] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  const [saveTargetId, setSaveTargetId] = useState('')
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [showAuthoredInput, setShowAuthoredInput] = useState(hasAuthoredText)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!hasContent) return
    const timer = window.setTimeout(() => store.captureDraftSnapshot('idle'), 60_000)
    return () => window.clearTimeout(timer)
  }, [hasContent, store])

  const beginEditing = () => { if (!editing) { store._saveHistory(); store.startHistoryBatch(); setEditing(true) } }
  const finishEditing = () => { if (editing) { store.endHistoryBatch(); setEditing(false) } }

  const copyOutput = async () => {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setStatus('Output copied'); window.setTimeout(() => setCopied(false), 1600) }
    catch { setStatus('Copy failed. Select the output text and copy it manually.') }
  }

  const saveCurrent = async () => {
    await store.flushDraft()
    if (activePrompt) {
      const saved = store.savePrompt(activePrompt.name, 'composer')
      setStatus(`Saved version ${saved.version} to ${saved.name}`)
      return
    }
    openSaveDialog('new')
  }

  useEffect(() => {
    const handleSave = () => { void saveCurrent() }
    window.addEventListener('prompt-save', handleSave)
    return () => window.removeEventListener('prompt-save', handleSave)
  })

  const openSaveDialog = (mode: 'new' | 'existing') => {
    setSaveMode(mode)
    setSaveName(suggestedName)
    setSaveTargetId(store.savedPrompts[0]?.id ?? '')
    setSaveOpen(true)
  }

  const confirmSave = async () => {
    await store.flushDraft()
    const saved = saveMode === 'existing'
      ? store.savePromptToExisting(saveTargetId, 'composer')
      : store.savePromptAsNew(saveName.trim() || suggestedName, 'composer')
    if (!saved) { setStatus('Choose a Library prompt to save this version to.'); return }
    setSaveOpen(false)
    setStatus(saveMode === 'existing' ? `Added version ${saved.version} to ${saved.name}` : `Saved ${saved.name} to your Library`)
  }

  const vary = async () => { await store.flushDraft(); store.randomizePrompt({ intensity: 'light', mode: 'smart' }); setStatus('Created a light variation · Undo is available') }
  const duplicate = () => { if (store.activePromptId) store.duplicatePrompt(store.activePromptId); else store.savePrompt(`${suggestedName} copy`, 'manual'); setStatus('Saved a separate copy to your Library') }

  return <section className="rounded-2xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-elevated)] p-4 sm:p-6 space-y-5">
    <header className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="text-xs text-[var(--ui-muted-text)]"><span className="font-medium text-[var(--ui-text)]">{activePrompt ? `Editing · ${activePrompt.name}` : 'New draft'}</span><span> · </span><PersistenceLabel state={persistenceState} /></p><h2 className="mt-1 font-display text-2xl sm:text-3xl">Your words</h2>{activePrompt && <p className="mt-1 text-xs text-[var(--ui-muted-text)]">{store.draftDirty ? 'Changes are not in the Library yet' : 'Matches the saved prompt'}</p>}</div><button type="button" onClick={store.undo} disabled={!canUndo} className="size-11 rounded-full flex items-center justify-center disabled:opacity-30" aria-label="Undo"><ArrowCounterClockwise className="size-4" /></button><button type="button" onClick={store.redo} disabled={!canRedo} className="size-11 rounded-full flex items-center justify-center disabled:opacity-30" aria-label="Redo"><ArrowClockwise className="size-4" /></button><Menu.Root><Menu.Trigger className="size-11 rounded-full border border-[var(--ui-border)] flex items-center justify-center" aria-label="More prompt actions"><DotsThree className="size-5" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end" sideOffset={8} className="z-40"><Menu.Popup className="w-64 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-1.5 shadow-lg"><ActionMenuItem onClick={() => { store.startNewPrompt(); setShowAuthoredInput(true); setStatus('Started a new blank prompt') }} icon={<FilePlus />}>Start new blank prompt</ActionMenuItem><ActionMenuItem onClick={() => openSaveDialog('new')} disabled={!hasContent} icon={<FloppyDisk />}>Save as new prompt</ActionMenuItem><ActionMenuItem onClick={() => openSaveDialog('existing')} disabled={!hasContent || store.savedPrompts.length === 0} icon={<FloppyDisk />}>Add as version to…</ActionMenuItem><ActionMenuItem onClick={duplicate} disabled={!hasContent} icon={<Sparkle />}>Save a duplicate</ActionMenuItem><ActionMenuItem onClick={() => void vary()} disabled={!hasContent} icon={<Shuffle />}>Create a variation</ActionMenuItem><ActionMenuItem onClick={() => setRecoveryOpen(true)} disabled={!store.draftSnapshots.length} icon={<ArrowCounterClockwise />}>Draft recovery</ActionMenuItem><ActionMenuItem onClick={() => setVersionsOpen(true)} disabled={!versions.length} icon={<ArrowCounterClockwise />}>Version history</ActionMenuItem></Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></header>

    <ActionToast message={status} onDismiss={() => setStatus('')} />

    {!hasAuthoredText && hasIngredients && !showAuthoredInput ? <div className="rounded-xl bg-[var(--ui-surface-soft)] p-4 sm:p-5"><p className="text-xs text-[var(--ui-muted-text)]">Built from {store.selectedTags.length} ingredient{store.selectedTags.length === 1 ? '' : 's'}</p><p className="mt-3 text-base sm:text-lg leading-8">{prompt}</p><button type="button" onClick={() => setShowAuthoredInput(true)} className="mt-4 min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-sm">Add your own words</button></div> : <label className="block"><span className="sr-only">Authored prompt</span><textarea value={store.customText} onFocus={beginEditing} onBlur={finishEditing} onChange={(event) => store.setCustomText(event.target.value)} placeholder="Write the image in your own words…" className="w-full min-h-52 max-h-[520px] resize-y rounded-xl bg-[var(--ui-surface-soft)] p-4 sm:p-5 text-base sm:text-lg leading-8 placeholder:text-[var(--ui-muted-text-faint)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label>}

    {hasAuthoredText && <div className="px-1 text-xs text-[var(--ui-muted-text)]"><span>{store.customText.length.toLocaleString()} authored characters</span></div>}
    <RelatedTagSuggestions text={store.customText || prompt} />
    <LMPromptEnhancer compact />

    {store.promptVariables.length > 0 && <section className="rounded-xl border border-[var(--ui-border)] p-3"><h3 className="text-xs font-medium">Variables</h3><div className="mt-2 grid sm:grid-cols-2 gap-2">{store.promptVariables.map((variable) => <label key={variable.name} className="text-xs text-[var(--ui-muted-text)]">{`{${variable.name}}`}<input value={variable.value ?? ''} onChange={(event) => store.setPromptVariable(variable.name, event.target.value)} placeholder={variable.defaultValue || 'Optional value'} className="mt-1 w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3" /></label>)}</div></section>}

    {hasContent && <section className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3" aria-label="How MUSE shaped this prompt"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium">What MUSE added</p><p className="text-xs text-[var(--ui-muted-text)]">Your authored words always stay editable above.</p></div><p className="mt-2 text-sm leading-6 text-[var(--ui-muted-text)]">{hasIngredients ? `${store.selectedTags.length} structured ingredient${store.selectedTags.length === 1 ? '' : 's'} shape the formatted output: ${store.selectedTags.slice(0, 4).map((tag) => tag.label).join(', ')}${store.selectedTags.length > 4 ? `, and ${store.selectedTags.length - 4} more` : ''}.` : 'Nothing yet—this output preserves your words as written. Add an ingredient only when you want more control.'}</p></section>}

    <section className="rounded-xl border border-[var(--ui-border-strong)] overflow-hidden" aria-labelledby="output-heading"><div className="min-h-16 px-4 py-2 flex flex-wrap items-center gap-2"><div className="min-w-0 flex-1"><h3 id="output-heading" className="font-display text-xl">Ready to use</h3><p className="text-xs text-[var(--ui-muted-text)]">{modelLabel} · formatted output</p></div><FormatterMenu value={store.selectedFormatterProfileId} profiles={profiles} onChange={store.setFormatterProfile} /><div className="hidden md:flex gap-2"><ActionButton label={copied ? 'Copied' : 'Copy'} icon={copied ? <CheckCircle weight="fill" /> : <Copy />} onClick={() => void copyOutput()} primary disabled={!hasContent} /><SaveButton activeName={activePrompt?.name} disabled={!hasContent} onSave={() => void saveCurrent()} onNew={() => openSaveDialog('new')} onExisting={() => openSaveDialog('existing')} hasExisting={store.savedPrompts.length > 0} /></div></div><pre tabIndex={0} aria-label="Formatted prompt output" className="min-h-28 border-t border-[var(--ui-border)] whitespace-pre-wrap break-words p-4 sm:p-5 font-sans text-sm sm:text-base leading-7">{prompt || 'Your formatted output will appear here.'}</pre></section>

    <Dialog.Root open={saveOpen} onOpenChange={setSaveOpen}><SaveDialog mode={saveMode} setMode={setSaveMode} name={saveName} setName={setSaveName} prompts={store.savedPrompts} targetId={saveTargetId} setTargetId={setSaveTargetId} onConfirm={() => void confirmSave()} /></Dialog.Root>

    {store.workspaceDepth === 'studio' && <details className="rounded-xl border border-[var(--ui-border)]"><summary className="min-h-14 px-4 cursor-pointer flex items-center justify-between"><span>{store.selectedTags.length} ingredient{store.selectedTags.length === 1 ? '' : 's'}</span><span className="text-xs text-[var(--ui-muted-text)]">Weights and triggers</span></summary><div className="border-t border-[var(--ui-border)] p-3 space-y-2">{store.selectedTags.length ? store.selectedTags.map((tag) => <IngredientRow key={tag.id} tag={tag} onRemove={() => store.removeTag(tag.id)} onWeight={(weight) => store.setTagWeight(tag.id, weight)} onTriggers={(words) => store.setTagTriggerWords(tag.id, words)} />) : <p className="text-sm text-[var(--ui-muted-text)]">Your authored words are the complete prompt.</p>}</div></details>}
    {store.workspaceDepth === 'studio' && negativePrompt && <details className="rounded-xl border border-[var(--ui-border)]"><summary className="min-h-14 px-4 cursor-pointer flex items-center">Negative output</summary><p className="border-t border-[var(--ui-border)] p-4 font-mono text-xs leading-6 text-[var(--ui-muted-text)]">{negativePrompt}</p></details>}

    <Dialog.Root open={recoveryOpen} onOpenChange={setRecoveryOpen}><RecoveryDialog snapshots={store.draftSnapshots} onRestore={(id) => { store.restoreDraftSnapshot(id); setStatus('Draft restored · Undo is available') }} /></Dialog.Root>
    <Dialog.Root open={versionsOpen} onOpenChange={setVersionsOpen}><VersionDialog versions={versions} promptId={store.activePromptId ?? ''} onRestore={store.restorePromptVersion} onDuplicate={store.duplicatePromptVersion} onDelete={store.deletePromptVersion} /></Dialog.Root>
    <div className="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex gap-2 border-t border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"><ActionButton label="Copy output" icon={<Copy />} onClick={() => void copyOutput()} primary disabled={!hasContent} className="min-w-0 flex-1" /><ActionButton label={activePrompt ? 'Update prompt' : 'Save prompt'} icon={<FloppyDisk />} onClick={() => void saveCurrent()} disabled={!hasContent} className="min-w-0 flex-1" /></div>
  </section>
}

function PersistenceLabel({ state }: { state: 'saving' | 'saved' | 'best-effort' | 'error' }) { return <span>{state === 'saving' ? 'Saving…' : state === 'error' ? 'Save failed' : state === 'best-effort' ? 'Saved locally' : 'Saved on this device'}</span> }
function ActionButton({ label, icon, onClick, primary = false, disabled = false, className = '' }: { label: string; icon: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean; className?: string }) { return <button type="button" onClick={onClick} disabled={disabled} className={`min-h-11 px-4 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-40 ${primary ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'border border-[var(--ui-border)]'} ${className}`}><span className="size-4 shrink-0">{icon}</span><span className="truncate">{label}</span></button> }
function ActionMenuItem({ children, icon, ...props }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <Menu.Item {...props} className="min-h-11 px-3 rounded-lg flex items-center gap-3 text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span className="size-4">{icon}</span>{children}</Menu.Item> }

// Compact branded controls shared by the Output header.
function FormatterMenu({ value, profiles, onChange }: { value: string; profiles: FormatterProfile[]; onChange: (id: string) => void }) {
  const selected = profiles.find((item) => item.id === value) ?? profiles[0]
  return <Menu.Root><Menu.Trigger className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] flex items-center gap-2 text-xs" aria-label={`Output format: ${selected?.name ?? 'Choose format'}`}><span>{selected?.name ?? 'Choose format'}</span><CaretDown className="size-3.5 text-[var(--ui-muted-text)]" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end" sideOffset={6} className="z-40"><Menu.Popup className="w-64 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg">{profiles.map((item) => <Menu.Item key={item.id} onClick={() => onChange(item.id)} className="min-h-11 px-3 rounded-lg flex items-center justify-between gap-3 text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>{item.name}</span>{item.id === value && <Check className="size-4" />}</Menu.Item>)}</Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>
}

function SaveButton({ activeName, disabled, onSave, onNew, onExisting, hasExisting }: { activeName?: string; disabled: boolean; onSave: () => void; onNew: () => void; onExisting: () => void; hasExisting: boolean }) {
  return <div className="inline-flex min-h-11 overflow-hidden rounded-lg border border-[var(--ui-border)]"><button type="button" onClick={onSave} disabled={disabled} className="min-h-11 px-3 flex items-center gap-2 text-sm disabled:opacity-40" title={activeName ? `Update ${activeName} and preserve the previous version` : 'Save a new Library prompt'}><FloppyDisk className="size-4" />{activeName ? 'Update prompt' : 'Save prompt'}</button><Menu.Root><Menu.Trigger className="size-11 border-l border-[var(--ui-border)] flex items-center justify-center" aria-label="More save options"><CaretDown className="size-3.5" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end" sideOffset={6} className="z-40"><Menu.Popup className="w-60 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg"><Menu.Item onClick={onNew} className="min-h-11 px-3 rounded-lg text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">Save as a new prompt</Menu.Item><Menu.Item onClick={onExisting} disabled={!hasExisting} className="min-h-11 px-3 rounded-lg text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)] data-[disabled]:opacity-40">Add as version to another…</Menu.Item></Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div>
}

function SaveDialog({ mode, setMode, name, setName, prompts, targetId, setTargetId, onConfirm }: { mode: 'new' | 'existing'; setMode: (mode: 'new' | 'existing') => void; name: string; setName: (name: string) => void; prompts: PromptTemplate[]; targetId: string; setTargetId: (id: string) => void; onConfirm: () => void }) {
  return <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-display text-3xl">Save prompt</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[var(--ui-muted-text)]">Give it a short name you will recognise when the Library grows.</Dialog.Description></div><Dialog.Close className="size-11 rounded-full border border-[var(--ui-border)]" aria-label="Close save prompt">×</Dialog.Close></div><div className="mt-5 grid grid-cols-2 rounded-lg border border-[var(--ui-border)] p-1"><button type="button" onClick={() => setMode('new')} aria-pressed={mode === 'new'} className={`min-h-11 rounded-md text-sm ${mode === 'new' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : ''}`}>New prompt</button><button type="button" onClick={() => setMode('existing')} aria-pressed={mode === 'existing'} disabled={prompts.length === 0} className={`min-h-11 rounded-md text-sm disabled:opacity-40 ${mode === 'existing' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : ''}`}>Add version</button></div>{mode === 'new' ? <label className="mt-5 block"><span className="text-sm font-medium">Prompt name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-2 w-full min-h-12 rounded-lg bg-[var(--ui-surface-soft)] px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /><span className="mt-2 block text-xs text-[var(--ui-muted-text)]">A suggested title is ready—edit it to match how you remember the idea.</span></label> : <div className="mt-5 space-y-2" role="radiogroup" aria-label="Saved prompt destination">{prompts.map((prompt) => <button key={prompt.id} type="button" role="radio" aria-checked={targetId === prompt.id} onClick={() => setTargetId(prompt.id)} className={`w-full min-h-14 px-3 rounded-lg border flex items-center justify-between gap-3 text-left ${targetId === prompt.id ? 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-soft)]' : 'border-[var(--ui-border)]'}`}><span className="min-w-0 truncate text-sm">{prompt.name}</span>{targetId === prompt.id && <Check className="size-4 shrink-0" />}</button>)}</div>}<div className="mt-6 flex justify-end gap-2"><Dialog.Close className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Cancel</Dialog.Close><button type="button" onClick={onConfirm} disabled={mode === 'existing' ? !targetId : !name.trim()} className="min-h-11 px-4 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] disabled:opacity-40">{mode === 'existing' ? 'Add version' : 'Save new prompt'}</button></div></Dialog.Popup></Dialog.Portal>
}

function IngredientRow({ tag, onRemove, onWeight, onTriggers }: { tag: SelectedTag; onRemove: () => void; onWeight: (weight: number) => void; onTriggers: (words: string[]) => void }) {
  const [triggers, setTriggers] = useState(tag.triggerWords?.join(', ') ?? '')
  const [editingTriggers, setEditingTriggers] = useState(false)
  const weight = tag.customWeight ?? 1
  return <div className="rounded-xl border border-[var(--ui-border)] p-2 flex flex-wrap items-center gap-2"><div className="min-w-0 flex-1 px-1"><span className="text-sm font-medium">{tag.label}</span>{tag.explicit && <span className="ml-2 text-[10px] text-[var(--ui-muted-text)]">mature</span>}</div><button type="button" onClick={() => onWeight(weight - 0.1)} className="size-11 rounded-full border border-[var(--ui-border)]" aria-label={`Decrease ${tag.label} weight`}><Minus className="size-3 mx-auto" /></button><span className="w-8 text-center text-xs">{weight.toFixed(1)}</span><button type="button" onClick={() => onWeight(weight + 0.1)} className="size-11 rounded-full border border-[var(--ui-border)]" aria-label={`Increase ${tag.label} weight`}><Plus className="size-3 mx-auto" /></button><button type="button" onClick={() => setEditingTriggers((value) => !value)} className="size-11 rounded-full" aria-label={`Edit trigger words for ${tag.label}`}><Tag className="size-4 mx-auto" /></button><button type="button" onClick={onRemove} className="size-11 rounded-full text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Remove ${tag.label}`}><Trash className="size-4 mx-auto" /></button>{editingTriggers && <label className="basis-full"><span className="sr-only">Trigger words for {tag.label}</span><input value={triggers} onChange={(event) => setTriggers(event.target.value)} onBlur={() => onTriggers(triggers.split(',').map((word) => word.trim()).filter(Boolean))} placeholder="Optional trigger words" className="w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-sm" /></label>}</div>
}

function DrawerFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><Dialog.Popup className="fixed right-0 inset-y-0 z-50 w-[min(100%,480px)] overflow-y-auto border-l border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 sm:p-6 safe-bottom"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-display text-3xl">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[var(--ui-muted-text)]">{description}</Dialog.Description></div><Dialog.Close className="size-11 rounded-full border border-[var(--ui-border)]" aria-label={`Close ${title.toLowerCase()}`}>×</Dialog.Close></div><div className="mt-6 space-y-3">{children}</div></Dialog.Popup></Dialog.Portal> }
function RecoveryDialog({ snapshots, onRestore }: { snapshots: DraftSnapshot[]; onRestore: (id: string) => void }) { return <DrawerFrame title="Draft recovery" description="Restore an autosaved state. The current draft is captured first.">{[...snapshots].reverse().map((snapshot) => <article key={snapshot.id} className="rounded-xl border border-[var(--ui-border)] p-4"><div className="flex justify-between gap-3"><strong className="text-sm capitalize">{snapshot.source.replace('-', ' ')}</strong><span className="text-xs text-[var(--ui-muted-text)]">{new Date(snapshot.createdAt).toLocaleString()}</span></div><p className="mt-2 text-xs leading-5 text-[var(--ui-muted-text)] line-clamp-3">{snapshot.customText || snapshot.selectedTags.map((tag) => tag.label).join(', ')}</p><Dialog.Close onClick={() => onRestore(snapshot.id)} className="mt-3 min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs">Restore this draft</Dialog.Close></article>)}</DrawerFrame> }
function VersionDialog({ versions, promptId, onRestore, onDuplicate, onDelete }: { versions: PromptVersion[]; promptId: string; onRestore: (promptId: string, id: string) => boolean; onDuplicate: (promptId: string, id: string) => unknown; onDelete: (promptId: string, id: string) => void }) { return <DrawerFrame title="Version history" description="Versions are created only by explicit Library actions.">{[...versions].reverse().map((version) => <article key={version.id} className="rounded-xl border border-[var(--ui-border)] p-4"><div className="flex justify-between gap-3"><strong className="text-sm">Version {version.version}</strong><span className="text-xs text-[var(--ui-muted-text)]">{new Date(version.createdAt).toLocaleString()}</span></div><p className="mt-2 text-xs leading-5 text-[var(--ui-muted-text)] line-clamp-3">{version.content}</p><div className="mt-3 flex flex-wrap gap-2"><Dialog.Close onClick={() => onRestore(promptId, version.id)} className="min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs">Restore as draft</Dialog.Close><button type="button" onClick={() => onDuplicate(promptId, version.id)} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Duplicate</button><AlertDialog.Root><AlertDialog.Trigger className="size-11 rounded-full flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Delete version ${version.version}`}><Trash className="size-4" /></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[70] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6"><AlertDialog.Title className="font-display text-2xl text-balance">Delete version {version.version}?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">This removes only this historical version. The saved prompt and current draft are unchanged.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Cancel</AlertDialog.Close><AlertDialog.Close onClick={() => onDelete(promptId, version.id)} className="min-h-11 px-4 rounded-lg border border-[var(--destructive)] text-[var(--destructive)]">Delete version</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root></div></article>)}</DrawerFrame> }
