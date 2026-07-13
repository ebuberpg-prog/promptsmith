import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@base-ui/react/dialog'
import {
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Sparkle,
  User,
  Mountains,
  PaintBrush,
  Cpu,
  Eye,
  Shuffle,
  Tag,
  Copy,
  Check as CheckIcon,
} from '@phosphor-icons/react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { searchTagIndex } from '@/utils/tag-index'
import { MODEL_CONFIGS, MODEL_GROUPS } from '@/data/model-configs'
import type { ContentVisibility, SupportedModel, TaxonomyTag } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface QuickStartWizardProps {
  isOpen: boolean
  onClose: () => void
  onSkip: () => void
}

type WizardStep = 'welcome' | 'subject' | 'setting' | 'style' | 'model' | 'preview'

/* ─── Quick-pick concepts that resolve to taxonomy tags via search ───────── */

interface ConceptOption {
  id: string
  label: string
  description: string
  icon: React.ElementType
  searchQueries: string[]
  maxTags: number
}

const SUBJECT_CONCEPTS: ConceptOption[] = [
  { id: 'portrait', label: 'Portrait', description: 'A person or character', icon: User, searchQueries: ['portrait', 'close-up', 'face'], maxTags: 2 },
  { id: 'character', label: 'Character', description: 'Full body or action pose', icon: User, searchQueries: ['full body', 'character', 'dynamic pose'], maxTags: 2 },
  { id: 'landscape', label: 'Landscape', description: 'Nature or cityscape', icon: Mountains, searchQueries: ['landscape', 'scenery', 'panoramic'], maxTags: 2 },
  { id: 'object', label: 'Object / Product', description: 'Item or product shot', icon: Tag, searchQueries: ['product', 'object', 'still life'], maxTags: 2 },
  { id: 'creature', label: 'Creature / Animal', description: 'Animal or fantasy beast', icon: User, searchQueries: ['creature', 'animal', 'beast'], maxTags: 2 },
  { id: 'abstract', label: 'Abstract', description: 'Non-representational', icon: PaintBrush, searchQueries: ['abstract', 'geometric', 'pattern'], maxTags: 2 },
]

const SETTING_CONCEPTS: ConceptOption[] = [
  { id: 'nature', label: 'Nature', description: 'Forest, ocean, mountains', icon: Mountains, searchQueries: ['forest', 'mountain', 'ocean', 'meadow'], maxTags: 2 },
  { id: 'urban', label: 'Urban', description: 'City street, rooftop, alley', icon: Mountains, searchQueries: ['city', 'street', 'urban', 'alleyway'], maxTags: 2 },
  { id: 'interior', label: 'Interior', description: 'Room, studio, cafe', icon: Mountains, searchQueries: ['interior', 'room', 'studio', 'cafe'], maxTags: 2 },
  { id: 'fantasy', label: 'Fantasy World', description: 'Castle, ruins, enchanted', icon: Mountains, searchQueries: ['castle', 'ruins', 'enchanted', 'fantasy'], maxTags: 2 },
  { id: 'space', label: 'Space / Sci-Fi', description: 'Space station, nebula', icon: Mountains, searchQueries: ['space', 'nebula', 'sci-fi', 'futuristic'], maxTags: 2 },
  { id: 'minimal', label: 'Minimal', description: 'Plain background, studio', icon: Mountains, searchQueries: ['minimal', 'plain background', 'white background'], maxTags: 1 },
]

const STYLE_CONCEPTS: ConceptOption[] = [
  { id: 'photorealistic', label: 'Photorealistic', description: 'Like a real photograph', icon: Eye, searchQueries: ['photorealistic', 'realistic', 'photo'], maxTags: 2 },
  { id: 'cinematic', label: 'Cinematic', description: 'Movie-quality look', icon: Sparkle, searchQueries: ['cinematic', 'film grain', 'color grading'], maxTags: 2 },
  { id: 'anime', label: 'Anime / Manga', description: 'Japanese illustration', icon: PaintBrush, searchQueries: ['anime', 'manga', 'cel shading'], maxTags: 2 },
  { id: 'oil', label: 'Oil Painting', description: 'Classic painted look', icon: PaintBrush, searchQueries: ['oil painting', 'painterly', 'impasto'], maxTags: 2 },
  { id: '3d', label: '3D Render', description: 'CGI, octane, ray tracing', icon: Cpu, searchQueries: ['3d render', 'octane', 'cgi'], maxTags: 2 },
  { id: 'watercolor', label: 'Watercolor', description: 'Soft, flowing paint', icon: PaintBrush, searchQueries: ['watercolor', 'soft edges', 'painterly'], maxTags: 2 },
  { id: 'minimalist', label: 'Minimalist', description: 'Clean and simple', icon: PaintBrush, searchQueries: ['minimalist', 'clean', 'simple'], maxTags: 2 },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon, dystopian future', icon: Sparkle, searchQueries: ['cyberpunk', 'neon', 'dystopian'], maxTags: 2 },
]

const MODEL_OPTIONS: { id: SupportedModel; name: string; desc: string; group: string }[] = [
  { id: 'midjourney', name: 'Midjourney V8', desc: 'Literal, photorealistic default. Specify lighting and camera explicitly.', group: 'Midjourney' },
  { id: 'stable-diffusion', name: 'Stable Diffusion 3.5', desc: 'Precise tags, weights, negative prompts. Highly customizable.', group: 'Tag-Based' },
  { id: 'flux', name: 'FLUX 2', desc: 'Exceptional photorealism and text rendering. Strong LoRA ecosystem.', group: 'Tag-Based' },
  { id: 'gpt-image', name: 'GPT Image 2', desc: 'Best-in-class text rendering and layout reasoning. Structured prompting.', group: 'Natural Language' },
  { id: 'ideogram', name: 'Ideogram 3.0', desc: 'Unmatched typography accuracy. Great for logos with text.', group: 'Natural Language' },
  { id: 'gemini', name: 'Nano Banana 2', desc: 'Fast 4K generation with editing and character consistency.', group: 'Natural Language' },
  { id: 'illustrious', name: 'Illustrious', desc: 'Danbooru-style anime tagging. Great for illustrations and anime art.', group: 'Tag-Based' },
]

const STEP_ORDER: WizardStep[] = ['welcome', 'subject', 'setting', 'style', 'model', 'preview']

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */

function resolveConceptTags(concept: ConceptOption | null, contentVisibility: ContentVisibility): TaxonomyTag[] {
  if (!concept) return []
  const found: TaxonomyTag[] = []
  const seen = new Set<string>()
  for (const query of concept.searchQueries) {
    const hits = searchTagIndex(query, contentVisibility, 5)
    for (const hit of hits) {
      if (seen.has(hit.id)) continue
      seen.add(hit.id)
      found.push(hit)
      if (found.length >= concept.maxTags) break
    }
    if (found.length >= concept.maxTags) break
  }
  return found
}

/* ─── COMPONENT ───────────────────────────────────────────────────────────── */

export function QuickStartWizard({ isOpen, onClose, onSkip }: QuickStartWizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [subjectInput, setSubjectInput] = useState('')
  const [subjectConcept, setSubjectConcept] = useState<ConceptOption | null>(null)
  const [settingConcept, setSettingConcept] = useState<ConceptOption | null>(null)
  const [styleConcept, setStyleConcept] = useState<ConceptOption | null>(null)
  const [selectedModel, setSelectedModel] = useState<SupportedModel>('midjourney')
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [copied, setCopied] = useState(false)

  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const setModel = usePromptSmithStore((s) => s.setSelectedModel)
  const contentVisibility = usePromptSmithStore((s) => s.contentVisibility)
  const randomizePrompt = usePromptSmithStore((s) => s.randomizePrompt)

  const stepIndex = STEP_ORDER.indexOf(step)
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100

  /* Reset state when reopened */
  useEffect(() => {
    if (isOpen) {
      setStep('welcome')
      setSubjectInput('')
      setSubjectConcept(null)
      setSettingConcept(null)
      setStyleConcept(null)
      setSelectedModel('midjourney')
      setDontShowAgain(false)
      setCopied(false)
    }
  }, [isOpen])

  const resolvedTags = useMemo(() => {
    const tags: TaxonomyTag[] = []
    const seen = new Set<string>()
    for (const tag of resolveConceptTags(subjectConcept, contentVisibility)) {
      if (!seen.has(tag.id)) { seen.add(tag.id); tags.push(tag) }
    }
    for (const tag of resolveConceptTags(settingConcept, contentVisibility)) {
      if (!seen.has(tag.id)) { seen.add(tag.id); tags.push(tag) }
    }
    for (const tag of resolveConceptTags(styleConcept, contentVisibility)) {
      if (!seen.has(tag.id)) { seen.add(tag.id); tags.push(tag) }
    }
    return tags
  }, [subjectConcept, settingConcept, styleConcept, contentVisibility])

  const handleClose = useCallback(() => {
    if (dontShowAgain) onSkip()
    onClose()
  }, [dontShowAgain, onSkip, onClose])

  const handleNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1])
    }
  }, [step])

  const handleBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) {
      setStep(STEP_ORDER[idx - 1])
    }
  }, [step])

  /* Keyboard navigation */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && e.metaKey) {
        e.preventDefault()
        handleNext()
      }
      if (e.key === 'ArrowLeft' && e.metaKey) {
        e.preventDefault()
        handleBack()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleBack, handleNext, isOpen])

  const handleApply = useCallback(() => {
    const store = usePromptSmithStore.getState()
    store._saveHistory()
    store.startHistoryBatch()
    clearAllTags()

    if (subjectInput.trim()) {
      setCustomText(subjectInput.trim())
    }

    for (const tag of resolvedTags) {
      toggleTag(tag)
    }

    setModel(selectedModel)
    store.endHistoryBatch()

    if (dontShowAgain) onSkip()
    onClose()
  }, [resolvedTags, subjectInput, selectedModel, clearAllTags, setCustomText, toggleTag, setModel, dontShowAgain, onSkip, onClose])

  const handleApplyAndRandomize = useCallback(() => {
    handleApply()
    // Small delay so the tags are applied before randomizing
    setTimeout(() => {
      randomizePrompt({ intensity: 'light', mode: 'smart' })
    }, 50)
  }, [handleApply, randomizePrompt])

  const handleCopyPreview = useCallback(() => {
    const modelCfg = MODEL_CONFIGS[selectedModel]
    const parts = [
      subjectInput.trim(),
      ...resolvedTags.map(t => t.label),
    ].filter(Boolean)

    let text = parts.join(modelCfg.promptStyle === 'prose' ? ', ' : ', ')
    if (modelCfg.promptStyle === 'midjourney-params') {
      text += ' --ar 16:9'
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [subjectInput, resolvedTags, selectedModel])

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'welcome': return true
      case 'subject': return subjectInput.trim().length > 0 || subjectConcept !== null
      case 'setting': return true // optional
      case 'style': return true // optional
      case 'model': return true
      case 'preview': return true
    }
  }, [step, subjectInput, subjectConcept])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-[var(--ui-overlay)] z-40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl shadow-lg flex flex-col overflow-hidden" aria-label="Quick start wizard">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ui-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-[var(--ui-border)] flex items-center justify-center">
                    <Sparkle weight="fill" className="w-4 h-4 text-[var(--ui-text)]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-[var(--ui-text)]">Quick Start</h2>
                    <p className="text-xs text-[var(--ui-muted-text-faint)]">
                      Step {stepIndex + 1} of {STEP_ORDER.length}
                    </p>
                  </div>
                </div>
                <Dialog.Close
                  className="size-11 rounded-full text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors flex items-center justify-center"
                  aria-label="Close wizard"
                >
                  <X weight="bold" className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {/* Progress bar */}
              <div className="h-0.5 bg-[var(--ui-surface)]">
                <motion.div
                  className="h-full bg-[var(--ui-text)]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step labels */}
              <div className="px-6 pt-3 pb-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {STEP_ORDER.map((s, i) => {
                  const isActive = i === stepIndex
                  const isPast = i < stepIndex
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        // Only allow jumping to completed steps or the current step
                        if (i <= stepIndex) setStep(s)
                      }}
                      className={cn(
                        'min-h-11 text-[10px] uppercase tracking-wider font-medium px-3 rounded-lg transition-colors whitespace-nowrap',
                        isActive
                          ? 'text-[var(--ui-bg)] bg-[var(--ui-text)]'
                          : isPast
                            ? 'text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]'
                            : 'text-[var(--ui-muted-text-faint)]'
                      )}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait">
                  {/* ─── WELCOME ─────────────────────────────────────────── */}
                  {step === 'welcome' && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div className="text-center space-y-2 py-4">
                        <div className="w-14 h-14 mx-auto rounded-2xl border border-[var(--ui-border)] flex items-center justify-center mb-4">
                          <Sparkle weight="fill" className="w-7 h-7 text-[var(--ui-text)]" />
                        </div>
                        <h3 className="text-xl font-display text-[var(--ui-text)]">Welcome to MUSE Prompt Studio</h3>
                        <p className="text-sm text-[var(--ui-muted-text)] max-w-sm mx-auto">
                          Build your first prompt in under a minute. Pick a subject, setting, and style — then let the app handle the details.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: User, label: 'Subject', desc: 'Who or what' },
                          { icon: Mountains, label: 'Setting', desc: 'Where it happens' },
                          { icon: PaintBrush, label: 'Style', desc: 'How it looks' },
                          { icon: Cpu, label: 'Model', desc: 'Your generator' },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="border border-[var(--ui-border)] rounded-xl p-3 flex items-center gap-3"
                          >
                            <item.icon weight="regular" className="w-4 h-4 text-[var(--ui-muted-text)]/40" />
                            <div>
                              <p className="text-xs font-medium text-[var(--ui-text)]">{item.label}</p>
                              <p className="text-[10px] text-[var(--ui-muted-text)]/60">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-[var(--ui-muted-text)]/60 text-center">
                        You can always skip this and explore on your own.
                      </p>
                    </motion.div>
                  )}

                  {/* ─── SUBJECT ─────────────────────────────────────────── */}
                  {step === 'subject' && (
                    <motion.div
                      key="subject"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">What do you want to create?</h3>
                        <p className="text-sm text-[var(--ui-muted-text)]">Describe your subject, then pick a category to find matching tags.</p>
                      </div>

                      <input
                        type="text"
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && subjectInput.trim() && handleNext()}
                        placeholder="e.g. A cyberpunk warrior, a serene mountain lake..."
                        className="w-full px-4 py-3 bg-transparent border border-[var(--ui-border)] rounded-xl outline-none focus:border-[var(--ui-border-hover)] transition-colors text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text-faint)]"
                        autoFocus
                      />

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Or pick a category</p>
                        <div className="grid grid-cols-2 gap-2">
                          {SUBJECT_CONCEPTS.map((concept) => {
                            const Icon = concept.icon
                            const active = subjectConcept?.id === concept.id
                            return (
                              <button
                                key={concept.id}
                                onClick={() => setSubjectConcept(active ? null : concept)}
                                className={cn(
                                  'p-3 rounded-xl border text-left transition-all space-y-1',
                                  active
                                    ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                                    : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon weight="regular" className="w-3.5 h-3.5 text-[var(--ui-muted-text)]/50" />
                                  <span className="text-sm font-medium text-[var(--ui-text)]">{concept.label}</span>
                                </div>
                                <p className="text-[10px] text-[var(--ui-muted-text)]/60 pl-5.5">{concept.description}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Preview of found tags */}
                      {subjectConcept && (
                        <div className="border border-[var(--ui-border-faint)] rounded-xl p-3 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Tags we will add</p>
                          <div className="flex flex-wrap gap-1.5">
                            {resolveConceptTags(subjectConcept, contentVisibility).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-[10px] px-2 py-0.5 rounded-lg border border-[var(--ui-text)]/10 text-[var(--ui-text)]/70"
                              >
                                {tag.label}
                              </span>
                            ))}
                            {resolveConceptTags(subjectConcept, contentVisibility).length === 0 && (
                              <span className="text-[10px] text-[var(--ui-muted-text)]/40">No matching tags found in taxonomy</span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── SETTING ─────────────────────────────────────────── */}
                  {step === 'setting' && (
                    <motion.div
                      key="setting"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">Where does it take place?</h3>
                        <p className="text-sm text-[var(--ui-muted-text)]">Pick a setting. This is optional — skip it if you want the subject on a plain background.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {SETTING_CONCEPTS.map((concept) => {
                          const Icon = concept.icon
                          const active = settingConcept?.id === concept.id
                          return (
                            <button
                              key={concept.id}
                              onClick={() => setSettingConcept(active ? null : concept)}
                              className={cn(
                                'p-3 rounded-xl border text-left transition-all space-y-1',
                                active
                                  ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                                  : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon weight="regular" className="w-3.5 h-3.5 text-[var(--ui-muted-text)]/50" />
                                <span className="text-sm font-medium text-[var(--ui-text)]">{concept.label}</span>
                              </div>
                              <p className="text-[10px] text-[var(--ui-muted-text)]/60 pl-5.5">{concept.description}</p>
                            </button>
                          )
                        })}
                      </div>

                      {settingConcept && (
                        <div className="border border-[var(--ui-border-faint)] rounded-xl p-3 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Tags we will add</p>
                          <div className="flex flex-wrap gap-1.5">
                            {resolveConceptTags(settingConcept, contentVisibility).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-[10px] px-2 py-0.5 rounded-lg border border-[var(--ui-text)]/10 text-[var(--ui-text)]/70"
                              >
                                {tag.label}
                              </span>
                            ))}
                            {resolveConceptTags(settingConcept, contentVisibility).length === 0 && (
                              <span className="text-[10px] text-[var(--ui-muted-text)]/40">No matching tags found in taxonomy</span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── STYLE ───────────────────────────────────────────── */}
                  {step === 'style' && (
                    <motion.div
                      key="style"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">What style do you want?</h3>
                        <p className="text-sm text-[var(--ui-muted-text)]">This shapes the visual feel more than almost anything else.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {STYLE_CONCEPTS.map((concept) => {
                          const Icon = concept.icon
                          const active = styleConcept?.id === concept.id
                          return (
                            <button
                              key={concept.id}
                              onClick={() => setStyleConcept(active ? null : concept)}
                              className={cn(
                                'p-3 rounded-xl border text-left transition-all space-y-1',
                                active
                                  ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                                  : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon weight="regular" className="w-3.5 h-3.5 text-[var(--ui-muted-text)]/50" />
                                <span className="text-sm font-medium text-[var(--ui-text)]">{concept.label}</span>
                              </div>
                              <p className="text-[10px] text-[var(--ui-muted-text)]/60 pl-5.5">{concept.description}</p>
                            </button>
                          )
                        })}
                      </div>

                      {styleConcept && (
                        <div className="border border-[var(--ui-border-faint)] rounded-xl p-3 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Tags we will add</p>
                          <div className="flex flex-wrap gap-1.5">
                            {resolveConceptTags(styleConcept, contentVisibility).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-[10px] px-2 py-0.5 rounded-lg border border-[var(--ui-text)]/10 text-[var(--ui-text)]/70"
                              >
                                {tag.label}
                              </span>
                            ))}
                            {resolveConceptTags(styleConcept, contentVisibility).length === 0 && (
                              <span className="text-[10px] text-[var(--ui-muted-text)]/40">No matching tags found in taxonomy</span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── MODEL ───────────────────────────────────────────── */}
                  {step === 'model' && (
                    <motion.div
                      key="model"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">Which model are you using?</h3>
                        <p className="text-sm text-[var(--ui-muted-text)]">MUSE formats your prompt to match the target generator.</p>
                      </div>

                      <div className="space-y-3">
                        {MODEL_GROUPS.map((group) => (
                          <div key={group.label} className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">{group.label}</p>
                            <div className="space-y-2">
                              {MODEL_OPTIONS.filter((m) => group.models.includes(m.id)).map((model) => {
                                const cfg = MODEL_CONFIGS[model.id]
                                const active = selectedModel === model.id
                                return (
                                  <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={cn(
                                      'w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3',
                                      active
                                        ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                                        : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                                    )}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-[var(--ui-text)]">{model.name}</span>
                                        <span className="text-[10px] text-[var(--ui-muted-text-faint)]">{cfg.version}</span>
                                      </div>
                                      <p className="text-xs text-[var(--ui-muted-text)]/70">{model.desc}</p>
                                      <div className="flex items-center gap-1.5 pt-0.5">
                                        {cfg.supportsNegative && (
                                          <span className="text-[9px] uppercase tracking-wider text-emerald-400/70 border border-emerald-400/20 rounded-lg px-1.5 py-0.5">
                                            Negative
                                          </span>
                                        )}
                                        {cfg.supportsWeighting && (
                                          <span className="text-[9px] uppercase tracking-wider text-sky-400/70 border border-sky-400/20 rounded-lg px-1.5 py-0.5">
                                            Weights
                                          </span>
                                        )}
                                        <span className="text-[9px] uppercase tracking-wider text-[var(--ui-muted-text-faint)] border border-[var(--ui-border-faint)] rounded-lg px-1.5 py-0.5">
                                          {cfg.promptStyle.replace(/-/g, ' ')}
                                        </span>
                                      </div>
                                    </div>
                                    {active && <Check weight="fill" className="w-4 h-4 text-[var(--ui-text)] flex-shrink-0" />}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ─── PREVIEW ─────────────────────────────────────────── */}
                  {step === 'preview' && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">Preview your prompt</h3>
                        <p className="text-sm text-[var(--ui-muted-text)]">Here is what will be applied. You can still edit everything afterward.</p>
                      </div>

                      {/* Model pill */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Model</span>
                        <span className="text-xs px-2.5 py-1 rounded-lg border border-[var(--ui-border)] text-[var(--ui-text)]">
                          {MODEL_CONFIGS[selectedModel].name} {MODEL_CONFIGS[selectedModel].version}
                        </span>
                      </div>

                      {/* Subject text */}
                      {subjectInput.trim() && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Subject</span>
                          <p className="text-xs font-mono leading-relaxed text-[var(--ui-text)] border border-[var(--ui-border-faint)] rounded-lg px-3 py-2 bg-[var(--ui-surface-soft)]">
                            {subjectInput.trim()}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {resolvedTags.length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text)]/50 font-medium">Tags ({resolvedTags.length})</span>
                          <div className="flex flex-wrap gap-1.5">
                            {resolvedTags.map((tag) => (
                              <span
                                key={tag.id}
                                className="text-xs px-2.5 py-1 rounded-lg border border-[var(--ui-text)]/15 text-[var(--ui-text)]/80"
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-[var(--ui-border-faint)] rounded-xl p-4 text-center space-y-2">
                          <p className="text-xs text-[var(--ui-muted-text)]">No tags selected yet.</p>
                          <p className="text-[11px] text-[var(--ui-muted-text)]/50">You can browse and add tags after closing the wizard.</p>
                        </div>
                      )}

                      {/* Quick actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleCopyPreview}
                          className="min-h-11 flex items-center justify-center gap-2 px-4 rounded-xl border border-[var(--ui-border)] text-sm text-[var(--ui-text)] hover:border-[var(--ui-border-hover)] transition-colors"
                        >
                          {copied ? <CheckIcon weight="bold" className="w-3.5 h-3.5" /> : <Copy weight="regular" className="w-3.5 h-3.5" />}
                          {copied ? 'Copied' : 'Copy prompt'}
                        </button>
                        <button
                          onClick={handleApplyAndRandomize}
                          className="min-h-11 flex items-center justify-center gap-2 px-4 rounded-xl border border-[var(--ui-border)] text-sm text-[var(--ui-text)] hover:border-[var(--ui-border-hover)] transition-colors"
                        >
                          <Shuffle weight="regular" className="w-3.5 h-3.5" />
                          Apply + randomize
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--ui-border)]">
                <label className="flex items-center gap-2 text-xs text-[var(--ui-muted-text)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="rounded border-[var(--ui-border)]"
                  />
                  Don't show again
                </label>

                <div className="flex items-center gap-2">
                  {step !== 'welcome' && (
                    <button
                      onClick={handleBack}
                      className="min-h-11 flex items-center gap-1.5 px-3 text-sm text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors"
                    >
                      <ArrowLeft weight="regular" className="w-3.5 h-3.5" />
                      Back
                    </button>
                  )}

                  {step === 'preview' ? (
                    <button
                      onClick={handleApply}
                      className="min-h-11 flex items-center gap-2 px-5 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Check weight="bold" className="w-3.5 h-3.5" />
                      Apply & start
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!canAdvance}
                      className="min-h-11 flex items-center gap-2 px-5 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ArrowRight weight="regular" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
