import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { ArrowSquareOut, CaretDown, Check, Copy } from '@phosphor-icons/react'
import { BUILT_IN_FORMATTER_PROFILES } from '@/data/formatter-profiles'
import { composeWithProfile } from '@/services/formatter-service'
import { usePromptSmithStore } from '@/store/prompt-store'
import type { FormatterProfile } from '@/types'

export function FormatComparison() {
  const customFormatterProfiles = usePromptSmithStore((state) => state.customFormatterProfiles)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const customText = usePromptSmithStore((state) => state.customText)
  const promptVariables = usePromptSmithStore((state) => state.promptVariables)
  const modelParameters = usePromptSmithStore((state) => state.modelParameters)
  const customNegativePrompt = usePromptSmithStore((state) => state.customNegativePrompt)
  const setFormatterProfile = usePromptSmithStore((state) => state.setFormatterProfile)
  const profiles = [...BUILT_IN_FORMATTER_PROFILES, ...customFormatterProfiles]
  const [leftId, setLeftId] = useState(profiles[0].id)
  const [rightId, setRightId] = useState(profiles[1].id)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const renderProfile = (id: string) => {
    const profile = profiles.find((item) => item.id === id) ?? profiles[0]
    return { profile, ...composeWithProfile({ profile, tags: selectedTags, customText, variables: promptVariables, parameters: modelParameters, negativePrompt: customNegativePrompt }) }
  }
  const left = renderProfile(leftId)
  const right = renderProfile(rightId)

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1200)
    } catch { setCopiedId(null) }
  }

  return <Dialog.Root><Dialog.Trigger className="w-full min-h-11 px-3 rounded-lg border border-[var(--ui-border)] flex items-center justify-between gap-3 text-sm"><span>Open side-by-side view</span><ArrowSquareOut className="size-4" /></Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,1040px)] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-display text-3xl">Compare formats</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[var(--ui-muted-text)]">Same draft, two output recipes.</Dialog.Description></div><Dialog.Close className="size-11 rounded-full border border-[var(--ui-border)]" aria-label="Close format comparison">×</Dialog.Close></div><div className="mt-6 grid md:grid-cols-2 gap-4"><ComparisonCard id="left" value={leftId} profiles={profiles} onChange={setLeftId} prompt={left.prompt} copied={copiedId === 'left'} onCopy={() => void copy('left', left.prompt)} onUse={() => setFormatterProfile(left.profile.id)} /><ComparisonCard id="right" value={rightId} profiles={profiles} onChange={setRightId} prompt={right.prompt} copied={copiedId === 'right'} onCopy={() => void copy('right', right.prompt)} onUse={() => setFormatterProfile(right.profile.id)} /></div></Dialog.Popup></Dialog.Portal></Dialog.Root>
}

function ComparisonCard({ id, value, profiles, onChange, prompt, copied, onCopy, onUse }: { id: string; value: string; profiles: FormatterProfile[]; onChange: (value: string) => void; prompt: string; copied: boolean; onCopy: () => void; onUse: () => void }) {
  const selected = profiles.find((profile) => profile.id === value) ?? profiles[0]
  return <article className="min-w-0 rounded-xl border border-[var(--ui-border)] overflow-hidden"><div className="p-3"><Menu.Root><Menu.Trigger className="w-full min-h-11 px-3 rounded-lg bg-[var(--ui-surface-soft)] flex items-center justify-between gap-3 text-sm" aria-label={`${id} comparison format: ${selected.name}`}><span className="truncate">{selected.name}</span><CaretDown className="size-4 shrink-0" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="start" sideOffset={6} className="z-50"><Menu.Popup className="w-64 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg">{profiles.map((profile) => <Menu.Item key={profile.id} onClick={() => onChange(profile.id)} className="min-h-11 px-3 rounded-lg flex items-center justify-between gap-3 text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>{profile.name}</span>{profile.id === value && <Check className="size-4" />}</Menu.Item>)}</Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div><pre className="min-h-64 max-h-[45vh] overflow-y-auto whitespace-pre-wrap break-words border-y border-[var(--ui-border)] p-4 text-sm leading-6">{prompt || 'Add words or ingredients to compare formats.'}</pre><div className="p-3 flex flex-wrap gap-2"><button type="button" onClick={onUse} className="min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm">Use this format</button><button type="button" onClick={onCopy} disabled={!prompt} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] flex items-center gap-2 text-sm disabled:opacity-40">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Copied' : 'Copy'}</button></div></article>
}
