import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowCounterClockwise, Palette, Sparkle } from '@phosphor-icons/react'
import { INSPIRATION_ASSETS } from '@/data/inspiration-assets'
import { usePromptSmithStore } from '@/store/prompt-store'
import type { InspirationAsset } from '@/types'

export function VisualSparks() {
  const store = usePromptSmithStore()
  const [selected, setSelected] = useState<InspirationAsset | null>(null)
  const [message, setMessage] = useState('')
  if (!store.showInspiration) return null

  const apply = (kind: 'starting' | 'palette' | 'mood' | 'composition') => {
    if (!selected) return
    store.captureDraftSnapshot('template'); store._saveHistory()
    const addition = kind === 'starting' ? selected.promptSeed : kind === 'palette' ? `Palette: ${selected.palette.join(', ')}` : kind === 'mood' ? `Mood: ${selected.mood}` : `Composition: ${selected.composition}`
    store.setCustomText(kind === 'starting' ? addition : [store.customText.trim(), addition].filter(Boolean).join('\n'))
    setMessage(`${kind === 'starting' ? 'Starting point' : kind[0].toUpperCase() + kind.slice(1)} added · Undo`)
  }

  return <section className="space-y-4" aria-labelledby="inspiration-heading"><h2 id="inspiration-heading" className="font-display text-3xl">Inspiration</h2><div className="grid grid-cols-3 gap-2 sm:gap-3">{INSPIRATION_ASSETS.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); setMessage('') }} className="group flex flex-col items-stretch text-left rounded-xl border border-[var(--ui-border)] overflow-hidden hover:border-[var(--ui-border-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><span className="block aspect-square overflow-hidden"><img src={item.src} srcSet={item.srcSet} sizes="(max-width: 640px) 30vw, 240px" width={item.width} height={item.height} loading="lazy" alt={item.alt} className="size-full scale-[1.08] object-cover" /></span><span className="block px-2.5 py-2 text-xs text-[var(--ui-muted-text)] group-hover:text-[var(--ui-text)] line-clamp-1">{item.territory}</span></button>)}</div>
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 sm:p-6">{selected && <div className="grid md:grid-cols-[minmax(0,1fr)_280px] gap-5"><img src={selected.src} srcSet={selected.srcSet} sizes="(max-width: 768px) 88vw, 420px" alt={selected.alt} className="w-full aspect-square object-cover rounded-xl" /><div><div className="flex justify-between gap-3"><div><Dialog.Title className="font-display text-3xl">{selected.territory}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-[var(--ui-muted-text)]">Choose one deliberate influence. Nothing changes until you do.</Dialog.Description></div><Dialog.Close className="size-11 rounded-full border border-[var(--ui-border)]" aria-label="Close inspiration">×</Dialog.Close></div><p className="mt-5 text-sm leading-6">{selected.promptSeed}</p><div className="mt-5 space-y-2"><SparkAction icon={<Sparkle />} onClick={() => apply('starting')}>Use as starting point</SparkAction><SparkAction icon={<Palette />} onClick={() => apply('palette')}>Add palette</SparkAction><SparkAction icon={<Sparkle />} onClick={() => apply('mood')}>Add mood</SparkAction><SparkAction icon={<Sparkle />} onClick={() => apply('composition')}>Add composition</SparkAction></div>{message && <button type="button" onClick={store.undo} className="mt-4 min-h-11 flex items-center gap-2 text-xs" aria-live="polite"><ArrowCounterClockwise className="size-4" />{message}</button>}</div></div>}</Dialog.Popup></Dialog.Portal></Dialog.Root>
  </section>
}

function SparkAction({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className="w-full min-h-11 px-3 rounded-xl border border-[var(--ui-border)] flex items-center gap-2 text-sm"><span className="size-4">{icon}</span>{children}</button> }
