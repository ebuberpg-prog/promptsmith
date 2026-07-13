import { useState } from 'react'
import { Menu } from '@base-ui/react/menu'
import { ArrowsClockwise, CaretDown, Check, Copy, Lock, Shuffle, Sparkle, Trash } from '@phosphor-icons/react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { VIBES } from '@/data/randomizer-vibes'
import type { RandomizerMode } from '@/data/randomizer-modes'
import type { RandomizerResult } from '@/services/randomizer-engine'
import { RandomizerEngine } from '@/services/randomizer-engine'

export function RandomizerPanel() {
  const applyRandomizerResult = usePromptSmithStore((state) => state.applyRandomizerResult)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const pinnedTags = usePromptSmithStore((state) => state.pinnedTags)
  const lastSeed = usePromptSmithStore((state) => state.lastRandomizerSeed)
  const [mode, setMode] = useState<RandomizerMode>('smart')
  const [vibe, setVibe] = useState<string | null>(null)
  const [intensity, setIntensity] = useState<'light' | 'full'>('light')
  const [storySeed, setStorySeed] = useState('')
  const [protectCurrent, setProtectCurrent] = useState(selectedTags.length > 0)
  const [result, setResult] = useState<RandomizerResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)

  const run = (seed?: number) => {
    const protectedIds = protectCurrent ? [...new Set([...pinnedTags, ...selectedTags.map((tag) => tag.id)])] : pinnedTags
    const next = new RandomizerEngine().randomize({
      mode,
      vibe: vibe ?? undefined,
      storySeed: mode === 'smart' ? storySeed.trim() || undefined : undefined,
      intensity,
      contentVisibility,
      seed: seed ?? Math.floor(Math.random() * 2 ** 32),
      lockedTagIds: protectedIds,
      lockedTags: selectedTags.filter((tag) => protectedIds.includes(tag.id)),
    })
    setResult(next)
    setApplied(false)
  }

  const apply = () => {
    if (!result) return
    applyRandomizerResult(result, protectCurrent)
    setApplied(true)
  }

  const copySeed = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(String(result.seed)); setCopied(true); window.setTimeout(() => setCopied(false), 1200) } catch { setCopied(false) }
  }

  const selectedVibe = VIBES.find((item) => item.id === vibe)
  return <div className="space-y-4">
    <div className="grid grid-cols-2 rounded-lg border border-[var(--ui-border)] p-1" role="group" aria-label="Variation behavior"><button type="button" onClick={() => setMode('smart')} aria-pressed={mode === 'smart'} className={`min-h-11 rounded-md flex items-center justify-center gap-2 text-sm ${mode === 'smart' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : ''}`}><Sparkle className="size-4" />Balanced</button><button type="button" onClick={() => setMode('wild')} aria-pressed={mode === 'wild'} className={`min-h-11 rounded-md flex items-center justify-center gap-2 text-sm ${mode === 'wild' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : ''}`}><Shuffle className="size-4" />Wild</button></div>

    {mode === 'smart' && <label className="block"><span className="text-xs text-[var(--ui-muted-text)]">Guide the variation <span className="text-[var(--ui-muted-text-faint)]">· optional</span></span><textarea value={storySeed} onChange={(event) => setStorySeed(event.target.value)} rows={2} placeholder="rainy station, quiet tension…" className="mt-2 w-full resize-none rounded-lg bg-[var(--ui-surface-soft)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label>}

    <div className="grid grid-cols-2 gap-2"><VibeMenu value={vibe} label={selectedVibe?.label ?? 'Any mood'} onChange={setVibe} /><div className="grid grid-cols-2 rounded-lg border border-[var(--ui-border)] p-1"><button type="button" onClick={() => setIntensity('light')} aria-pressed={intensity === 'light'} className={`min-h-11 rounded-md text-xs ${intensity === 'light' ? 'bg-[var(--ui-surface-soft)]' : ''}`}>Light</button><button type="button" onClick={() => setIntensity('full')} aria-pressed={intensity === 'full'} className={`min-h-11 rounded-md text-xs ${intensity === 'full' ? 'bg-[var(--ui-surface-soft)]' : ''}`}>Full</button></div></div>

    {selectedTags.length > 0 && <label className="min-h-11 flex items-center gap-3 text-xs"><input type="checkbox" checked={protectCurrent} onChange={(event) => setProtectCurrent(event.target.checked)} className="size-4 accent-current" /><span className="flex-1">Keep current ingredients</span><span className="text-[var(--ui-muted-text)]">{selectedTags.length}</span></label>}

    <div className="flex gap-2"><button type="button" onClick={() => run()} className="min-h-11 flex-1 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] flex items-center justify-center gap-2 text-sm"><Shuffle className="size-4" />Randomize</button>{lastSeed !== null && <button type="button" onClick={() => run(lastSeed + 1)} className="size-11 rounded-full border border-[var(--ui-border)] flex items-center justify-center" aria-label="New randomizer seed"><ArrowsClockwise className="size-4" /></button>}</div>

    {result && <section className="rounded-lg border border-[var(--ui-border)] overflow-hidden"><div className="px-3 py-2 flex items-center gap-2 border-b border-[var(--ui-border)]"><strong className="text-xs font-medium flex-1">Preview · {result.tags.length} ingredient{result.tags.length === 1 ? '' : 's'}</strong><span className="text-[10px] font-mono text-[var(--ui-muted-text)]">{result.seed}</span><button type="button" onClick={() => void copySeed()} className="size-11 flex items-center justify-center" aria-label={`Copy randomizer seed ${result.seed}`}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</button></div><div className="p-3 flex flex-wrap gap-1.5">{result.tags.slice(0, 14).map((tag) => <span key={tag.id} className="min-h-8 px-2.5 rounded-md border border-[var(--ui-border)] flex items-center gap-1 text-xs">{pinnedTags.includes(tag.id) && <Lock className="size-3" />}{tag.label}</span>)}</div><div className="px-3 py-2 border-t border-[var(--ui-border)] grid grid-cols-[1fr_auto_auto] gap-2"><button type="button" onClick={apply} disabled={applied} className="min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs disabled:opacity-50">{applied ? 'Applied' : 'Apply variation'}</button><button type="button" onClick={() => run(result.seed)} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Repeat</button><button type="button" onClick={() => setResult(null)} className="size-11 rounded-full flex items-center justify-center text-[var(--ui-muted-text)]" aria-label="Discard variation preview"><Trash className="size-4" /></button></div></section>}
  </div>
}

function VibeMenu({ value, label, onChange }: { value: string | null; label: string; onChange: (value: string | null) => void }) {
  return <Menu.Root><Menu.Trigger className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] flex items-center justify-between gap-2 text-xs"><span className="truncate">{label}</span><CaretDown className="size-3.5 shrink-0" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="start" sideOffset={6} className="z-40"><Menu.Popup className="w-56 max-h-80 overflow-y-auto rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg"><Menu.Item onClick={() => onChange(null)} className="min-h-11 px-3 rounded-lg flex items-center justify-between text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>Any mood</span>{value === null && <Check className="size-4" />}</Menu.Item>{VIBES.map((item) => <Menu.Item key={item.id} onClick={() => onChange(item.id)} className="min-h-11 px-3 rounded-lg flex items-center justify-between text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>{item.label}</span>{value === item.id && <Check className="size-4" />}</Menu.Item>)}</Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>
}
