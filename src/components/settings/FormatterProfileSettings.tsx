import { useRef, useState } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { BUILT_IN_FORMATTER_PROFILES, getFormatterProfile, validateFormatterTemplate } from '@/data/formatter-profiles'
import { downloadJson } from '@/services/diagnostics-service'
import { composeWithProfile } from '@/services/formatter-service'
import { usePromptSmithStore } from '@/store/prompt-store'
import type { FormatFamily, FormatterProfile, SupportedModel } from '@/types'

const FAMILY_MODEL: Record<FormatFamily, SupportedModel> = {
  'natural-language': 'gpt-image',
  'tag-list': 'stable-diffusion',
  'midjourney-params': 'midjourney',
  'structured-instruction': 'gpt-image',
  custom: 'custom',
}

export function FormatterProfileSettings() {
  const selectedId = usePromptSmithStore((state) => state.selectedFormatterProfileId)
  const customProfiles = usePromptSmithStore((state) => state.customFormatterProfiles)
  const setFormatterProfile = usePromptSmithStore((state) => state.setFormatterProfile)
  const saveFormatterProfile = usePromptSmithStore((state) => state.saveFormatterProfile)
  const deleteFormatterProfile = usePromptSmithStore((state) => state.deleteFormatterProfile)
  const current = getFormatterProfile(selectedId, customProfiles)
  const [draft, setDraft] = useState<FormatterProfile | null>(null)
  const [message, setMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const preview = draft ? composeWithProfile({ profile: { ...draft, model: FAMILY_MODEL[draft.family] }, tags: [], customText: 'A quiet portrait beside a rain-lit window', variables: [], parameters: draft.parameterDefaults, negativePrompt: 'visual artifacts' }).prompt : ''
  const templateError = draft?.template ? validateFormatterTemplate(draft.template) : null

  const save = () => {
    if (!draft) return
    const profile = { ...draft, model: FAMILY_MODEL[draft.family] }
    const result = saveFormatterProfile(profile)
    setMessage(result.ok ? 'Formatter profile saved locally.' : result.error ?? 'Profile could not be saved.')
    if (result.ok) {
      setFormatterProfile(profile.id)
      setDraft(null)
    }
  }

  const importProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '')) as { _schema?: string; profile?: FormatterProfile }
        if (parsed._schema !== 'muse-formatter-profile-v1' || !parsed.profile) throw new Error('Not a MUSE formatter profile.')
        const profile = { ...parsed.profile, id: crypto.randomUUID(), isBuiltIn: false }
        const result = saveFormatterProfile(profile)
        if (!result.ok) throw new Error(result.error)
        setFormatterProfile(profile.id)
        setMessage('Formatter profile imported.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Profile import failed.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section className="space-y-3">
      <div><h3 className="text-sm font-medium">Formatter profiles</h3><p className="mt-1 text-xs text-pretty text-[var(--ui-muted-text)]">Stable format families stay useful even when model names change.</p></div>
      <div className="rounded-2xl border border-[var(--ui-border)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3"><div><strong className="text-sm">{current.name}</strong><p className="text-xs capitalize text-[var(--ui-muted-text)]">{current.family.split('-').join(' ')}</p></div><button type="button" onClick={() => setDraft({ ...current, id: crypto.randomUUID(), name: `${current.name} custom`, isBuiltIn: false })} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Duplicate and edit</button></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadJson(`${current.name.toLowerCase().replace(/\s+/g, '-')}.muse-formatter.json`, { _schema: 'muse-formatter-profile-v1', profile: current })} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Export profile</button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importProfile} />
          <button type="button" onClick={() => importRef.current?.click()} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Import profile</button>
          {!current.isBuiltIn && <DeleteProfileButton name={current.name} onDelete={() => deleteFormatterProfile(current.id)} />}
        </div>
      </div>
      {draft && <div className="rounded-2xl border border-[var(--ui-border)] p-4 space-y-3">
        <label className="block text-xs text-[var(--ui-muted-text)]">Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-[var(--ui-text)]" /></label>
        <label className="block text-xs text-[var(--ui-muted-text)]">Family<select value={draft.family} onChange={(event) => setDraft({ ...draft, family: event.target.value as FormatFamily })} className="mt-1 w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-[var(--ui-text)]">{BUILT_IN_FORMATTER_PROFILES.map((profile) => <option key={profile.family} value={profile.family}>{profile.name}</option>)}</select></label>
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="min-h-11 flex items-center gap-3 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-xs"><input type="checkbox" checked={draft.supportsWeighting} onChange={(event) => setDraft({ ...draft, supportsWeighting: event.target.checked })} />Use ingredient weights</label>
          <label className="min-h-11 flex items-center gap-3 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-xs"><input type="checkbox" checked={draft.supportsNegative} onChange={(event) => setDraft({ ...draft, supportsNegative: event.target.checked })} />Include negative prompt</label>
        </div>
        <label className="block text-xs text-[var(--ui-muted-text)]">Trigger words<select value={draft.triggerWordStyle} onChange={(event) => setDraft({ ...draft, triggerWordStyle: event.target.value as FormatterProfile['triggerWordStyle'] })} className="mt-1 w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-[var(--ui-text)]"><option value="inline">Inline</option><option value="prefix">Before the prompt</option><option value="none">Do not include</option></select></label>
        <label className="block text-xs text-[var(--ui-muted-text)]">Default aspect ratio<input value={String(draft.parameterDefaults.aspectRatio ?? '')} onChange={(event) => setDraft({ ...draft, parameterDefaults: { ...draft.parameterDefaults, aspectRatio: event.target.value || undefined } })} placeholder="Optional, for example 3:2" className="mt-1 w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3 text-[var(--ui-text)]" /></label>
        <label className="block text-xs text-[var(--ui-muted-text)]">Enhancement guidance <span className="text-[var(--ui-muted-text-faint)]">· optional</span><textarea value={draft.enhancementGuidance ?? ''} onChange={(event) => setDraft({ ...draft, enhancementGuidance: event.target.value })} maxLength={300} placeholder="Guide AI wording without adding formatter syntax…" className="mt-1 w-full min-h-20 resize-y rounded-lg bg-[var(--ui-surface-soft)] p-3 text-xs text-[var(--ui-text)]" /><span className="mt-1 block text-[10px]">Diction and density only. Final syntax remains deterministic.</span></label>
        {draft.family === 'custom' && <label className="block text-xs text-[var(--ui-muted-text)]">Template<textarea value={draft.template ?? '{prompt}'} onChange={(event) => setDraft({ ...draft, template: event.target.value })} className="mt-1 w-full min-h-28 rounded-lg bg-[var(--ui-surface-soft)] p-3 font-mono text-xs text-[var(--ui-text)]" /><span className="mt-1 block text-[10px]">Allowed: {'{prompt} {negative} {aspectRatio} {parameters}'}</span></label>}
        {templateError && <p className="text-xs text-[var(--destructive)]" role="alert">{templateError}</p>}
        <div className="rounded-xl bg-[var(--ui-surface-soft)] p-3"><p className="text-[10px] text-[var(--ui-muted-text)]">Preview</p><pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-5">{preview}</pre></div>
        <div className="flex gap-2"><button type="button" onClick={save} disabled={Boolean(templateError)} className="min-h-11 px-4 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs disabled:opacity-40">Save profile</button><button type="button" onClick={() => setDraft(null)} className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)] text-xs">Cancel</button></div>
      </div>}
      {message && <p className="text-xs text-pretty text-[var(--ui-muted-text)]" aria-live="polite">{message}</p>}
    </section>
  )
}

function DeleteProfileButton({ name, onDelete }: { name: string; onDelete: () => void }) {
  return <AlertDialog.Root><AlertDialog.Trigger className="min-h-11 px-3 rounded-lg text-xs text-[var(--destructive)]">Delete profile</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6"><AlertDialog.Title className="font-display text-2xl text-balance">Delete {name}?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">Saved prompts keep their authored text and legacy model field.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Cancel</AlertDialog.Close><AlertDialog.Close onClick={onDelete} className="min-h-11 px-4 rounded-lg border border-[var(--destructive)]">Delete</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>
}
