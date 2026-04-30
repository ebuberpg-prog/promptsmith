import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { PROMPT_SLOTS } from '@/data/randomizer-slots'
import { VIBES } from '@/data/randomizer-vibes'
import { RANDOMIZER_MODES } from '@/data/randomizer-modes'
import { MODEL_CONFIGS, MODEL_GROUPS } from '@/data/model-configs'
import type { SupportedModel } from '@/types'
import {
  BookOpen,
  Rocket,
  SquaresFour,
  Shuffle,
  Cpu,
  Lightning,
  Copy,
  Check,
  DownloadSimple,
  User,
  PersonSimple,
  TShirt,
  Mountains,
  Sun,
  Camera,
  PaintBrush,
  SmileyWink,
  Sparkle,
  FilmSlate,
  Buildings,
  Moon,
  Lightning as LightningIcon,
  Robot,
  PawPrint,
  Leaf,
  Dress,
  TerminalWindow,
  Warning,
  ArrowRight,
  Lock,
  Image,
  Tray,
  Prohibit,
  Keyboard,
  MagicWand,
} from '@phosphor-icons/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type GuideSectionId = 'quick-start' | 'slots' | 'randomizer' | 'models' | 'power' | 'patterns'

const SECTIONS: { id: GuideSectionId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'quick-start', label: 'Quick Start', icon: Rocket, description: 'Build your first prompt in under a minute' },
  { id: 'slots', label: 'Slot System', icon: SquaresFour, description: 'How the 8 prompt roles work together' },
  { id: 'randomizer', label: 'Randomizer', icon: Shuffle, description: 'Smart, Wild, vibes, seeds, and intensity' },
  { id: 'models', label: 'Models', icon: Cpu, description: 'Syntax, weights, and negative prompt support' },
  { id: 'power', label: 'Power Features', icon: Lightning, description: 'Entities, references, shortcuts, and more' },
  { id: 'patterns', label: 'Prompt Patterns', icon: MagicWand, description: 'Before-and-after examples' },
]

const SLOT_ICONS: Record<string, React.ElementType> = {
  subject: User,
  body: PersonSimple,
  clothing: TShirt,
  setting: Mountains,
  lighting: Sun,
  camera: Camera,
  style: PaintBrush,
  mood: SmileyWink,
}

const VIBE_ICON_MAP: Record<string, React.ElementType> = {
  FilmSlate,
  Sparkle,
  Buildings,
  Moon,
  Lightning: LightningIcon,
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

interface ExamplePrompt {
  id: string
  title: string
  model: SupportedModel
  customText: string
  description: string
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: 'ex-midjourney',
    title: 'Cinematic Portrait',
    model: 'midjourney',
    customText: 'A weathered fisherman on a misty dock at dawn, cinematic lighting, shallow depth of field, film grain --ar 16:9 --style raw',
    description: 'Midjourney works best with evocative, scene-driven language.',
  },
  {
    id: 'ex-sd',
    title: 'Cyberpunk Street',
    model: 'stable-diffusion',
    customText: 'cyberpunk alleyway, neon signs, rain-slicked pavement, volumetric fog, 35mm film grain, dystopian, (neon lighting:1.2), masterpiece, best quality',
    description: 'Stable Diffusion loves precise tags with weight syntax like (tag:1.2).',
  },
  {
    id: 'ex-dalle',
    title: 'Whimsical Illustration',
    model: 'gpt-image',
    customText: 'A cozy treehouse library filled with floating books, warm candlelight, watercolor illustration style, soft pastel colors, storybook aesthetic',
    description: 'DALL-E 3 prefers full sentences that read like a story description.',
  },
]

const SHORTCUTS = [
  { keys: ['Cmd/Ctrl', 'K'], action: 'Open command palette' },
  { keys: ['Cmd/Ctrl', 'Z'], action: 'Undo last change' },
  { keys: ['Cmd/Ctrl', 'Shift', 'Z'], action: 'Redo' },
]

export function PromptGuide() {
  const [activeSection, setActiveSection] = useState<GuideSectionId>('quick-start')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const setSelectedModel = usePromptSmithStore((s) => s.setSelectedModel)
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const handleLoadExample = (example: ExamplePrompt) => {
    setCustomText(example.customText)
    setSelectedModel(example.model)
    setLoadedId(example.id)
    setTimeout(() => setLoadedId(null), 2000)
  }

  const activeDef = SECTIONS.find((s) => s.id === activeSection)!

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-[2rem] font-normal text-[var(--ui-text)] tracking-tight">Prompting Guide</h2>
        <p className="text-[13px] text-[var(--ui-muted-text)] mt-1">
          Learn how PromptSmith thinks about prompts — then make it your own.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon
          const active = activeSection === sec.id
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--ui-text)] text-[var(--ui-bg)] border-[var(--ui-text)]'
                  : 'border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]'
              )}
            >
              <Icon weight={active ? 'fill' : 'regular'} className="w-4 h-4" />
              <span>{sec.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active section description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeSection}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-xs text-[var(--ui-muted-text)]/60"
        >
          {activeDef.description}
        </motion.p>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="space-y-6"
        >
          {activeSection === 'quick-start' && <QuickStartSection onLoadExample={handleLoadExample} onCopy={handleCopy} copiedId={copiedId} loadedId={loadedId} />}
          {activeSection === 'slots' && <SlotSystemSection />}
          {activeSection === 'randomizer' && <RandomizerSection />}
          {activeSection === 'models' && <ModelsSection />}
          {activeSection === 'power' && <PowerFeaturesSection showExplicit={showExplicit} />}
          {activeSection === 'patterns' && <PatternsSection onCopy={handleCopy} copiedId={copiedId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── QUICK START ─────────────────────────────────────────────────────────────

function QuickStartSection({
  onLoadExample,
  onCopy,
  copiedId,
  loadedId,
}: {
  onLoadExample: (ex: ExamplePrompt) => void
  onCopy: (text: string, id: string) => void
  copiedId: string | null
  loadedId: string | null
}) {
  const steps = [
    {
      number: '1',
      title: 'Start from a template or blank slate',
      body: 'Templates give you a strong base instantly. Or jump into Browse Tags and pick your subject first.',
    },
    {
      number: '2',
      title: 'Fill 2–3 core slots',
      body: 'A good prompt needs a clear Subject, Setting, and one strong Style or Lighting choice. Everything else is optional refinement.',
    },
    {
      number: '3',
      title: 'Use the Randomizer to fill gaps',
      body: 'Pick a vibe (Cinematic, Dreamy, Gritty…) and let MUSE propose a complete, conflict-free direction. Lock tags you love, reroll the rest.',
    },
    {
      number: '4',
      title: 'Copy and generate',
      body: 'PromptSmith formats your tags and custom text for your target model. Copy the result, paste into your generator, and iterate.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="border border-[var(--ui-border)] rounded-2xl p-5 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-[var(--ui-muted-text-faint)] mt-0.5 w-5 flex-shrink-0">{step.number}.</span>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[var(--ui-text)]">{step.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Example prompts */}
      <div className="space-y-3">
        <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">Try an example</h3>
        <div className="grid grid-cols-1 gap-3">
          {EXAMPLE_PROMPTS.map((ex) => (
            <div
              key={ex.id}
              className="border border-[var(--ui-border)] rounded-2xl p-4 space-y-3 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--ui-text)]">{ex.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text-faint)] border border-[var(--ui-border-faint)] rounded-full px-2 py-0.5">
                    {MODEL_CONFIGS[ex.model].name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCopy(ex.customText, ex.id)}
                    className="flex items-center gap-1 text-[10px] text-[var(--ui-muted-text)]/60 hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-full px-2.5 py-1 transition-all duration-150"
                  >
                    {copiedId === ex.id ? <Check weight="bold" className="w-3 h-3" /> : <Copy weight="regular" className="w-3 h-3" />}
                    {copiedId === ex.id ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => onLoadExample(ex)}
                    className="flex items-center gap-1 text-[10px] text-[var(--ui-bg)] bg-[var(--ui-text)] hover:opacity-90 rounded-full px-2.5 py-1 transition-all duration-150"
                  >
                    <DownloadSimple weight="regular" className="w-3 h-3" />
                    {loadedId === ex.id ? 'Loaded' : 'Load'}
                  </button>
                </div>
              </div>
              <p className="text-xs font-mono leading-relaxed text-[var(--ui-muted-text)] border border-[var(--ui-border-faint)] rounded-lg px-3 py-2 bg-[var(--ui-surface-soft)]">
                {ex.customText}
              </p>
              <p className="text-[11px] text-[var(--ui-muted-text)]/60">{ex.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SLOT SYSTEM ─────────────────────────────────────────────────────────────

function SlotSystemSection() {
  return (
    <div className="space-y-6">
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--ui-text)]">The 8-slot philosophy</h3>
        <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
          PromptSmith organizes tags into 8 distinct roles. You do not need to fill every slot — a clear Subject, Setting, and one strong Style or Lighting choice is usually enough to start. The Randomizer uses these same slots to build coherent prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROMPT_SLOTS.map((slot) => {
          const Icon = SLOT_ICONS[slot.id] || SquaresFour
          return (
            <div
              key={slot.id}
              className="border border-[var(--ui-border)] rounded-2xl p-4 space-y-2 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
            >
              <div className="flex items-center gap-2">
                <Icon weight="regular" className="w-4 h-4 text-[var(--ui-muted-text)]/40" />
                <h4 className="text-sm font-medium text-[var(--ui-text)]">{slot.label}</h4>
                {slot.required && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/70 border border-amber-400/20 rounded-full px-1.5 py-0.5">
                    Required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--ui-muted-text)]/60 leading-relaxed">
                {slot.minTags}–{slot.maxTags} tags · {slot.taxonomyCategoryIds.length} categor{slot.taxonomyCategoryIds.length === 1 ? 'y' : 'ies'}
              </p>
              <div className="flex flex-wrap gap-1">
                {slot.taxonomyCategoryIds.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] text-[var(--ui-muted-text-faint)] bg-[var(--ui-surface-soft)] border border-[var(--ui-border-faint)] rounded-full px-2 py-0.5"
                  >
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Conflict awareness */}
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Warning weight="fill" className="w-4 h-4 text-amber-400/60" />
          <h3 className="text-sm font-medium text-[var(--ui-text)]">Conflict awareness</h3>
        </div>
        <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
          The engine knows that &quot;golden hour&quot; and &quot;night scene&quot; clash, or that &quot;photorealistic&quot; and &quot;cartoon&quot; contradict. When browsing tags or using the Randomizer, conflicting tags are flagged — hard conflicts are blocked, soft conflicts trigger a warning.
        </p>
      </div>
    </div>
  )
}

// ─── RANDOMIZER ──────────────────────────────────────────────────────────────

function RandomizerSection() {
  return (
    <div className="space-y-6">
      {/* Modes */}
      <div className="space-y-3">
        <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">Modes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RANDOMIZER_MODES.map((mode) => (
            <div
              key={mode.id}
              className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-2 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
            >
              <div className="flex items-center gap-2">
                {mode.id === 'smart' ? (
                  <Sparkle weight="fill" className="w-4 h-4 text-[var(--ui-text)]" />
                ) : (
                  <Shuffle weight="fill" className="w-4 h-4 text-[var(--ui-text)]" />
                )}
                <h4 className="text-sm font-medium text-[var(--ui-text)]">{mode.label}</h4>
              </div>
              <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">{mode.description}</p>
              <p className="text-[11px] text-[var(--ui-muted-text)]/50">
                {mode.id === 'smart'
                  ? 'Runs a coherence pass after generation to warn about mismatched setting + lighting or mood + environment combinations.'
                  : 'No coherence checks. Great for breaking out of familiar patterns and discovering unexpected combinations.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vibes */}
      <div className="space-y-3">
        <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">Vibes</h3>
        <p className="text-xs text-[var(--ui-muted-text)]/60">
          Vibes bias the Randomizer toward specific keywords in each slot. At Full intensity, accent tags may also be added.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VIBES.map((vibe) => (
            <div
              key={vibe.id}
              className="border border-[var(--ui-border)] rounded-2xl p-4 space-y-2 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
            >
              <div className="flex items-center gap-2">
                {renderVibeIcon(vibe.icon)}
                <h4 className="text-sm font-medium text-[var(--ui-text)]">{vibe.label}</h4>
              </div>
              <p className="text-xs text-[var(--ui-muted-text)]">{vibe.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {vibe.accentKeywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    className="text-[10px] text-[var(--ui-muted-text-faint)] bg-[var(--ui-surface-soft)] border border-[var(--ui-border-faint)] rounded-full px-2 py-0.5"
                  >
                    {kw}
                  </span>
                ))}
                {vibe.accentKeywords.length > 3 && (
                  <span className="text-[10px] text-[var(--ui-muted-text-faint)]">+{vibe.accentKeywords.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seeds & Intensity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-2">
          <h4 className="text-sm font-medium text-[var(--ui-text)]">Seeds &amp; Reproducibility</h4>
          <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
            Every randomization has a seed number. Copy the seed and reproduce the exact same prompt anytime. Use Re-roll to increment the seed and explore nearby variations.
          </p>
        </div>
        <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-2">
          <h4 className="text-sm font-medium text-[var(--ui-text)]">Intensity</h4>
          <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
            <strong className="text-[var(--ui-text)]">Quick</strong> generates 3–5 tags across core slots. <strong className="text-[var(--ui-text)]">Full</strong> generates 8–14 tags across all slots, including accent tags when a vibe is selected.
          </p>
        </div>
      </div>

      {/* Locking */}
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Lock weight="fill" className="w-4 h-4 text-amber-400/60" />
          <h4 className="text-sm font-medium text-[var(--ui-text)]">Locking tags</h4>
        </div>
        <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
          Pin tags you want to keep. When you randomize again, pinned tags stay in place and the Randomizer fills the remaining slots around them. Locked tags are also respected by conflict detection — the engine will never pick a tag that clashes with something you pinned.
        </p>
      </div>
    </div>
  )
}

// ─── MODELS ──────────────────────────────────────────────────────────────────

function ModelsSection() {
  return (
    <div className="space-y-6">
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--ui-text)]">How PromptSmith formats for each model</h3>
        <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
          Different generators expect different prompt syntax. PromptSmith automatically adapts your tag selection, custom text, weights, and parameters to match the target model. Here is what each family expects.
        </p>
      </div>

      {MODEL_GROUPS.map((group) => (
        <div key={group.label} className="space-y-3">
          <h3 className="text-xs text-[var(--ui-muted-text)]/50 uppercase tracking-wider font-medium">{group.label}</h3>
          <div className="grid grid-cols-1 gap-3">
            {group.models.map((modelId) => {
              const cfg = MODEL_CONFIGS[modelId]
              return (
                <div
                  key={modelId}
                  className="border border-[var(--ui-border)] rounded-2xl p-4 space-y-3 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-[var(--ui-text)]">{cfg.name}</h4>
                      <span className="text-[10px] text-[var(--ui-muted-text-faint)]">{cfg.version}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {cfg.supportsNegative && (
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400/70 border border-emerald-400/20 rounded-full px-1.5 py-0.5">
                          Negative
                        </span>
                      )}
                      {cfg.supportsWeighting && (
                        <span className="text-[9px] uppercase tracking-wider text-sky-400/70 border border-sky-400/20 rounded-full px-1.5 py-0.5">
                          Weights
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider">Style</span>
                      <p className="text-xs text-[var(--ui-text)]">{cfg.promptStyle.replace(/-/g, ' ')}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider">Trigger words</span>
                      <p className="text-xs text-[var(--ui-text)]">{cfg.triggerWordStyle}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider">Weight format</span>
                      <p className="text-xs font-mono text-[var(--ui-muted-text)]">
                        {cfg.supportsWeighting ? cfg.weightFormat('tag', 1.2) : '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider">Parameters</span>
                      <p className="text-xs text-[var(--ui-text)]">{cfg.parameters.join(', ') || '—'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Tips */}
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--ui-text)]">Model-specific tips</h3>
        <div className="space-y-2 divide-y divide-[var(--ui-border-faint)]">
          {[
            { model: 'Midjourney V8', tip: 'More literal than V7. Specify lighting, camera, and mood explicitly. Use --s, --ar, --no, and --sref for control. Test stylize at 50, 200, and 500.' },
            { model: 'Stable Diffusion 3.5 / FLUX 2', tip: 'Responds well to precise tags, weight syntax like (tag:1.2), and detailed negative prompts. FLUX 2 also handles natural language well.' },
            { model: 'GPT Image 2', tip: 'Rewards structured prompts: Scene, Subject, Important details, Use case, Constraints. Use visual facts over vague praise. Best-in-class text rendering.' },
            { model: 'Nano Banana 2 / Ideogram 3.0', tip: 'Use full sentences and describe the scene like a story. Weights and negative prompts are ignored. Great for typography and text-in-image.' },
            { model: 'Qwen Image 2512', tip: 'Good for realistic humans and fine textures. Supports tag-based prompting with weighting.' },
            { model: 'Illustrious', tip: 'Danbooru-style tag prompting. Auto-prefixed with masterpiece, best quality, highres. Use detailed negative prompts for best results.' },
          ].map((item) => (
            <div key={item.model} className="flex items-start gap-3 pt-2 first:pt-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-muted-text-faint)] mt-0.5 min-w-[110px]">
                {item.model}
              </span>
              <span className="text-xs leading-relaxed text-[var(--ui-muted-text)]">{item.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── POWER FEATURES ──────────────────────────────────────────────────────────

function PowerFeaturesSection({ showExplicit }: { showExplicit: boolean }) {
  const features = [
    {
      icon: Tray,
      title: 'Saved Building Blocks (Entities)',
      description:
        'Save reusable characters, environments, styles, and moods. Load them into any prompt in Replace or Append mode. Build a personal library of starting points.',
    },
    {
      icon: Image,
      title: 'Reference Images',
      description:
        'Upload images to extract visual tags and style vectors. The app analyzes composition, dominant colors, and mood to suggest matching tags.',
    },
    {
      icon: TerminalWindow,
      title: 'Command Palette',
      description: 'Press Cmd/Ctrl + K to search tags, load templates, and run commands without leaving the keyboard.',
    },
    {
      icon: Prohibit,
      title: 'Negative Prompt Intelligence',
      description:
        'Automatically generates negative prompts based on your selected tags and target model. Override anytime with a custom negative prompt.',
    },
    {
      icon: Lock,
      title: 'Safe / Unfiltered Toggle',
      description:
        'Control whether explicit content tags appear in search, browsing, and randomization. When Safe is on, explicit tags are hidden from the entire interface.',
      badge: showExplicit ? 'Unfiltered' : 'Safe',
      badgeColor: showExplicit ? 'text-amber-400/70 border-amber-400/20' : 'text-emerald-400/70 border-emerald-400/20',
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      description: 'Undo and redo your entire session with Cmd/Ctrl + Z and Cmd/Ctrl + Shift + Z.',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="border border-[var(--ui-border)] rounded-2xl p-4 space-y-2 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
          >
            <div className="flex items-center gap-2">
              <f.icon weight="regular" className="w-4 h-4 text-[var(--ui-muted-text)]/40" />
              <h4 className="text-sm font-medium text-[var(--ui-text)]">{f.title}</h4>
              {'badge' in f && f.badge && (
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wider border rounded-full px-1.5 py-0.5 ml-auto',
                    f.badgeColor
                  )}
                >
                  {f.badge}
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">{f.description}</p>
          </div>
        ))}
      </div>

      {/* Shortcuts table */}
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--ui-text)]">Keyboard shortcuts</h3>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.action} className="flex items-center justify-between">
              <span className="text-xs text-[var(--ui-muted-text)]">{s.action}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    <kbd className="text-[10px] font-mono text-[var(--ui-text)] bg-[var(--ui-surface-soft)] border border-[var(--ui-border-faint)] rounded px-1.5 py-0.5">
                      {k}
                    </kbd>
                    {i < s.keys.length - 1 && <span className="text-[var(--ui-muted-text-faint)]">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PROMPT PATTERNS ─────────────────────────────────────────────────────────

function PatternsSection({ onCopy, copiedId }: { onCopy: (text: string, id: string) => void; copiedId: string | null }) {
  const patterns = [
    {
      id: 'pat-generic',
      title: 'Generic vs. Structured',
      before: 'a beautiful woman in a forest',
      after: 'elderly woman, flowing silver hair, enchanted forest, dappled sunlight filtering through canopy, volumetric lighting, fantasy illustration, mysterious mood',
      note: 'Adding specific physical details, lighting, and mood turns a generic request into a directed scene.',
    },
    {
      id: 'pat-midjourney',
      title: 'Midjourney: Evocative over explicit',
      before: 'photo of a cat, 4k, high detail, realistic',
      after: 'A tabby cat perched on a sunlit windowsill, dust motes drifting through warm afternoon light, cozy domestic scene, soft focus background, film photography aesthetic --ar 4:5 --style raw',
      note: 'Midjourney responds to atmosphere and emotion. Replace checklist tags with sensory language.',
    },
    {
      id: 'pat-sd',
      title: 'Stable Diffusion: Tag precision',
      before: 'a cool cyberpunk character with neon lights',
      after: 'cyberpunk woman, augmented eyes, neon blue hair, leather jacket, rain-slicked alleyway, (neon lighting:1.3), volumetric fog, 35mm film grain, dystopian, masterpiece, best quality',
      note: 'Use weight syntax for emphasis, include quality tags like "masterpiece", and be specific about medium.',
    },
    {
      id: 'pat-negative',
      title: 'Negative prompt strategy',
      before: '(no negative prompt)',
      after: 'blurry, low quality, deformed hands, extra fingers, mutated, watermark, signature, text, cropped, worst quality',
      note: 'Negative prompts are especially powerful on Stable Diffusion and FLUX. PromptSmith auto-generates them, but you can customize.',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[var(--ui-text)]">Before &amp; After</h3>
        <p className="text-xs leading-relaxed text-[var(--ui-muted-text)]">
          Small changes in structure and specificity have an outsized impact on generation quality. Here are common patterns.
        </p>
      </div>

      <div className="space-y-4">
        {patterns.map((pat) => (
          <div
            key={pat.id}
            className="border border-[var(--ui-border)] rounded-2xl p-5 space-y-3 transition-colors duration-200 hover:border-[var(--ui-border-hover)]"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-[var(--ui-text)]">{pat.title}</h4>
              <button
                onClick={() => onCopy(pat.after, pat.id)}
                className="flex items-center gap-1 text-[10px] text-[var(--ui-muted-text)]/60 hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-full px-2.5 py-1 transition-all duration-150"
              >
                {copiedId === pat.id ? <Check weight="bold" className="w-3 h-3" /> : <Copy weight="regular" className="w-3 h-3" />}
                {copiedId === pat.id ? 'Copied' : 'Copy improved'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text-faint)]">Before</span>
                <p className="text-xs font-mono leading-relaxed text-[var(--ui-muted-text)] border border-[var(--ui-border-faint)] rounded-lg px-3 py-2 bg-[var(--ui-surface-soft)] opacity-70">
                  {pat.before}
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text-faint)]">After</span>
                <p className="text-xs font-mono leading-relaxed text-[var(--ui-text)] border border-[var(--ui-border-faint)] rounded-lg px-3 py-2 bg-[var(--ui-surface-soft)]">
                  {pat.after}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ArrowRight weight="regular" className="w-3 h-3 text-[var(--ui-muted-text-faint)] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[var(--ui-muted-text)]/60 leading-relaxed">{pat.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
