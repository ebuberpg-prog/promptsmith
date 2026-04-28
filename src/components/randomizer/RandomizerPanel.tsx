import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { VIBES } from '@/data/randomizer-vibes'
import { RANDOMIZER_MODES, INTENTS, type RandomizerMode } from '@/data/randomizer-modes'
import type { SlotId } from '@/data/randomizer-slots'
import { PROMPT_SLOTS } from '@/data/randomizer-slots'
import type { TaxonomyTag } from '@/types'
import type { RandomizerResult } from '@/services/randomizer-engine'
import {
  Shuffle,
  Copy,
  Check,
  Lock,
  ArrowsClockwise,
  User,
  PersonSimple,
  TShirt,
  Mountains,
  Sun,
  Camera,
  PaintBrush,
  SmileyWink,
  Warning,
  X,
  Trash,
  Sparkle,
  FilmSlate,
  Buildings,
  Moon,
  Lightning,
  Robot,
  PawPrint,
  Leaf,
  Dress,
} from '@phosphor-icons/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const VIBE_ICON_MAP: Record<string, React.ElementType> = {
  FilmSlate,
  Sparkle,
  Buildings,
  Moon,
  Lightning,
  Camera,
  Robot,
  PawPrint,
  Leaf,
  Dress,
}

function renderVibeIcon(name: string) {
  const Icon = VIBE_ICON_MAP[name] || Sparkle
  return <Icon weight="regular" className="w-4 h-4" />
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SLOT_ICONS: Record<SlotId, React.ElementType> = {
  subject: User,
  body: PersonSimple,
  clothing: TShirt,
  setting: Mountains,
  lighting: Sun,
  camera: Camera,
  style: PaintBrush,
  mood: SmileyWink,
}

interface LastResult {
  seed: number
  tagCount: number
  mode: RandomizerMode
  slots: Partial<Record<SlotId, TaxonomyTag[]>>
  warnings: string[]
  vibe: string | null
  intent: string | null
}

export function RandomizerPanel() {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [storySeed, setStorySeed] = useState('')
  const [mode, setMode] = useState<RandomizerMode>('smart')
  const [intensity, setIntensity] = useState<'light' | 'full'>('light')
  const [isRandomizing, setIsRandomizing] = useState(false)
  const [lastResult, setLastResult] = useState<LastResult | null>(null)
  const [seedCopied, setSeedCopied] = useState(false)
  const [warningsExpanded, setWarningsExpanded] = useState(false)

  const randomizePrompt = usePromptSmithStore((s) => s.randomizePrompt)
  const removeTag = usePromptSmithStore((s) => s.removeTag)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const lastSeed = usePromptSmithStore((s) => s.lastRandomizerSeed)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const pinnedTags = usePromptSmithStore((s) => s.pinnedTags)

  const currentModeDef = RANDOMIZER_MODES.find(m => m.id === mode)

  const applyResult = (result: RandomizerResult) => {
    setLastResult({
      seed: result.seed,
      tagCount: result.tags.length,
      mode: result.mode,
      slots: result.slots,
      warnings: result.warnings.filter(w =>
        // Show coherence notes but not verbose story-match debug messages
        !w.startsWith('Story-matched') && !w.startsWith('Soft conflict')
      ),
      vibe: result.vibe,
      intent: result.intent,
    })
  }

  const handleRandomize = async () => {
    setIsRandomizing(true)
    setWarningsExpanded(false)
    try {
      const result = randomizePrompt({
        vibe: selectedVibe ?? undefined,
        intent: undefined,
        storySeed: storySeed || undefined,
        intensity,
        mode,
      })
      if (result) applyResult(result)
    } finally {
      setTimeout(() => setIsRandomizing(false), 300)
    }
  }

  const handleReroll = () => {
    setWarningsExpanded(false)
    const result = randomizePrompt({
      vibe: selectedVibe ?? undefined,
      intent: undefined,
      storySeed: storySeed || undefined,
      intensity,
      mode,
      seed: lastSeed !== null ? lastSeed + 1 : undefined,
    })
    if (result) applyResult(result)
  }

  const handleReproduceSeed = (seed: number) => {
    const result = randomizePrompt({
      vibe: selectedVibe ?? undefined,
      intent: undefined,
      storySeed: storySeed || undefined,
      intensity,
      mode,
      seed,
    })
    if (result) applyResult(result)
  }

  const handleClear = () => {
    clearAllTags()
    setLastResult(null)
  }

  const copySeed = (seed: number) => {
    navigator.clipboard.writeText(String(seed)).then(() => {
      setSeedCopied(true)
      setTimeout(() => setSeedCopied(false), 1500)
    })
  }

  // Ordered slots for result display — only those that have tags
  const resultSlots = PROMPT_SLOTS.filter(
    slot => lastResult?.slots[slot.id] && (lastResult.slots[slot.id]?.length ?? 0) > 0
  )

  const userFacingWarnings = lastResult?.warnings ?? []

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="font-display text-2xl font-normal text-[var(--ui-text)] tracking-tight">Randomizer</h2>
        <p className="text-sm text-[var(--ui-muted-text)] mt-1">
          Pick a vibe and let MUSE build a cohesive prompt for you.
        </p>
      </div>

      {/* Mode selector */}
      <div className="space-y-3">
        <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">Mode</h3>
        <div className="flex flex-wrap gap-2">
          {RANDOMIZER_MODES.map(mod => (
            <button
              key={mod.id}
              onClick={() => setMode(mod.id)}
              title={mod.description}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all duration-150",
                mode === mod.id
                  ? "bg-[var(--ui-surface)] border-[var(--ui-text)]/30 text-[var(--ui-text)]"
                  : "border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]"
              )}
            >
              {mod.id === 'smart' ? <Sparkle weight="regular" className="w-4 h-4" /> : <Shuffle weight="regular" className="w-4 h-4" />}
              <span>{mod.label}</span>
            </button>
          ))}
        </div>
        {currentModeDef && (
          <AnimatePresence>
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[var(--ui-muted-text)]/60"
            >
              {currentModeDef.description}
            </motion.p>
          </AnimatePresence>
        )}
      </div>

      {/* Smart mode: seed text input */}
      <AnimatePresence>
        {mode === 'smart' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">Seed (optional)</h3>
            <textarea
              value={storySeed}
              onChange={e => setStorySeed(e.target.value)}
              placeholder='e.g., "a weary traveler at a rain-soaked train station at dusk"'
              rows={2}
              className="w-full px-4 py-3 bg-transparent border border-[var(--ui-border)] rounded-2xl text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/30 outline-none focus:border-[var(--ui-border-hover)] transition-colors resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vibe selector */}
      <div className="space-y-3">
        <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">
          {mode === 'wild' ? 'Vibe (optional)' : 'Vibe'}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedVibe(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150",
              selectedVibe === null
? "bg-[var(--ui-text)] text-[var(--ui-bg)] border-[var(--ui-text)]"
                  : "border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]"
              )}
            >
              <Shuffle weight="regular" className="w-4 h-4" />
              <span>Surprise me</span>
            </button>
            {VIBES.map(vibe => (
              <button
                key={vibe.id}
                onClick={() => setSelectedVibe(vibe.id === selectedVibe ? null : vibe.id)}
                title={vibe.description}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150",
                  selectedVibe === vibe.id
                    ? "bg-[var(--ui-text)] text-[var(--ui-bg)] border-[var(--ui-text)]"
                    : "border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]"
              )}
            >
              {renderVibeIcon(vibe.icon)}
              <span>{vibe.label}</span>
            </button>
          ))}
        </div>
        {selectedVibe && (
          <p className="text-xs text-[var(--ui-muted-text)]/60">
            {VIBES.find(v => v.id === selectedVibe)?.description}
          </p>
        )}
      </div>

      {/* Intensity + action row */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium mb-2">Intensity</p>
          <div className="flex items-center gap-1 border border-[var(--ui-border)] rounded-full p-1 w-fit">
            <button
              onClick={() => setIntensity('light')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                intensity === 'light'
                  ? "bg-[var(--ui-text)] text-[var(--ui-bg)]"
                  : "text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]"
              )}
            >
              Quick
            </button>
            <button
              onClick={() => setIntensity('full')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                intensity === 'full'
                  ? "bg-[var(--ui-text)] text-[var(--ui-bg)]"
                  : "text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]"
              )}
            >
              Full
            </button>
          </div>
          <p className="text-[10px] text-[var(--ui-muted-text)]/40 mt-1.5">
            {intensity === 'light' ? '3–5 carefully chosen tags' : '8–14 tags across all categories'}
          </p>
        </div>

        <div className="flex items-end gap-2 pb-0.5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRandomize}
            disabled={isRandomizing}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[var(--ui-text)] text-sm font-medium text-[var(--ui-text)] hover:bg-[var(--ui-text)] hover:text-[var(--ui-bg)] transition-all duration-150 disabled:opacity-40"
          >
            <Shuffle
              weight="regular"
              className={cn("w-4 h-4", isRandomizing && "animate-spin")}
            />
            {isRandomizing ? 'Randomizing…' : 'Randomize'}
          </motion.button>

          {lastSeed !== null && (
            <button
              onClick={handleReroll}
              title="Re-roll (next seed)"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] transition-all duration-150"
            >
              <ArrowsClockwise weight="regular" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Result card — slot breakdown */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="border border-[var(--ui-border-faint)] rounded-2xl bg-[var(--ui-surface-soft)] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-[var(--ui-border-faint)]">
              <p className="text-sm text-[var(--ui-text)]">
                {lastResult.tagCount} tag{lastResult.tagCount !== 1 ? 's' : ''} generated
                {lastResult.vibe && (
                  <span className="text-[var(--ui-muted-text)]">
                    {' · '}
                    {(() => {
                      const v = VIBES.find(v => v.id === lastResult.vibe)
                      return v ? <span className="inline-flex items-center gap-1">{renderVibeIcon(v.icon)} {v.label}</span> : null
                    })()}
                  </span>
                )}
                {lastResult.intent && (
                  <span className="text-[var(--ui-muted-text)]">
                    {' · '}{INTENTS.find(i => i.id === lastResult.intent)?.label}
                  </span>
                )}
                <span className="text-[var(--ui-muted-text)]/40 ml-2">
                  · {RANDOMIZER_MODES.find(m => m.id === lastResult.mode)?.label}
                </span>
              </p>
            </div>

            {/* Slot breakdown */}
            {resultSlots.length > 0 && (
              <div className="px-5 py-4 space-y-3">
                {resultSlots.map(slot => {
                  const slotTags = lastResult.slots[slot.id] ?? []
                  const SlotIcon = SLOT_ICONS[slot.id]
                  return (
                    <div key={slot.id} className="flex items-start gap-3">
                      <div className="flex items-center gap-1.5 w-24 flex-shrink-0 pt-1">
                        <SlotIcon weight="regular" className="w-3 h-3 text-[var(--ui-muted-text)]/30 flex-shrink-0" />
                        <span className="text-[10px] text-[var(--ui-muted-text)]/40 uppercase tracking-wider font-medium truncate">
                          {slot.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                        {slotTags.map(tag => {
                          const isPinned = pinnedTags.includes(tag.id)
                          return (
                            <span
                              key={tag.id}
                              className={cn(
                                "group flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-150",
                                isPinned
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                  : "border-[var(--ui-text)]/15 text-[var(--ui-text)]/70 hover:border-[var(--ui-text)]/30"
                              )}
                            >
                              {isPinned && <Lock weight="fill" className="w-2.5 h-2.5 flex-shrink-0" />}
                              <span>{tag.label}</span>
                              {!isPinned && (
                                <button
                                  onClick={() => removeTag(tag.id)}
                                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-[var(--ui-muted-text)]/50 hover:text-[var(--ui-text)] transition-all duration-100"
                                  title={`Remove "${tag.label}"`}
                                >
                                  <X weight="bold" className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Coherence warnings */}
            {userFacingWarnings.length > 0 && (
              <div className="px-5 pb-3">
                <button
                  onClick={() => setWarningsExpanded(v => !v)}
                  className="flex items-center gap-1.5 text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  <Warning weight="fill" className="w-3 h-3" />
                  {userFacingWarnings.length} coherence note{userFacingWarnings.length !== 1 ? 's' : ''}
                  <span className="text-[var(--ui-muted-text)]/30 ml-0.5">{warningsExpanded ? '↑' : '↓'}</span>
                </button>
                <AnimatePresence>
                  {warningsExpanded && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1 overflow-hidden"
                    >
                      {userFacingWarnings.map((w, i) => (
                        <li key={i} className="text-[10px] text-amber-400/60 pl-4 leading-relaxed">· {w}</li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Footer: seed + actions */}
            <div className="px-5 py-3 border-t border-[var(--ui-border-faint)] flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] text-[var(--ui-muted-text)]/40 font-mono truncate">
                  seed {lastResult.seed}
                </span>
                <button
                  onClick={() => copySeed(lastResult.seed)}
                  className="text-[var(--ui-muted-text)]/40 hover:text-[var(--ui-muted-text)] transition-colors flex-shrink-0"
                  title="Copy seed"
                >
                  {seedCopied
                    ? <Check weight="bold" className="w-2.5 h-2.5" />
                    : <Copy weight="regular" className="w-2.5 h-2.5" />
                  }
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  title="Clear all tags"
                  className="flex items-center gap-1.5 text-[10px] text-[var(--ui-muted-text)]/40 hover:text-[var(--ui-muted-text)] border border-[var(--ui-border)] rounded-full px-2.5 py-1.5 transition-all duration-150 hover:border-[var(--ui-border-hover)]"
                >
                  <Trash weight="regular" className="w-3 h-3" />
                  Clear
                </button>
                <button
                  onClick={() => handleReproduceSeed(lastResult.seed)}
                  className="text-[10px] text-[var(--ui-muted-text)]/50 hover:text-[var(--ui-muted-text)] transition-colors border border-[var(--ui-border)] rounded-full px-3 py-1.5 hover:border-[var(--ui-border-hover)]"
                >
                  Reproduce
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current selection preview — shown when tags exist but no result card yet */}
      {selectedTags.length > 0 && !lastResult && (
        <div className="space-y-3">
          <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">
            Current selection ({selectedTags.length} tags)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.slice(0, 20).map(tag => {
              const isPinned = pinnedTags.includes(tag.id)
              return (
                <span
                  key={tag.id}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all duration-150",
                    isPinned
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-[var(--ui-text)]/20 text-[var(--ui-text)]/70"
                  )}
                >
                  {isPinned && <Lock weight="fill" className="w-2.5 h-2.5 flex-shrink-0" />}
                  <span className="truncate">{tag.label}</span>
                </span>
              )
            })}
            {selectedTags.length > 20 && (
              <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--ui-border)] text-[var(--ui-muted-text)]/50">
                +{selectedTags.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="border border-[var(--ui-border-faint)] rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-base font-normal text-[var(--ui-text)]">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Slot-based', desc: 'Tags are picked from 8 distinct prompt roles: Subject, Setting, Lighting, Style, Mood, and more.' },
            { step: '2', title: 'Conflict-aware', desc: 'The engine knows that "golden hour" and "night scene" clash — it never picks tags that contradict each other.' },
            { step: '3', title: 'Reproducible', desc: 'Every result has a seed. Copy the seed number to get the exact same prompt again, anytime.' },
          ].map(item => (
            <div key={item.step} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--ui-muted-text)]/40 w-4">{item.step}.</span>
                <span className="text-sm font-medium text-[var(--ui-text)]">{item.title}</span>
              </div>
              <p className="text-xs text-[var(--ui-muted-text)]/60 leading-relaxed pl-6">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
