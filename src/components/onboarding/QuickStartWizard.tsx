import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, Check, Sparkle } from '@phosphor-icons/react'
import { WIZARD_STYLES, WIZARD_MOODS, getWizardStyleTags, getWizardMoodTags } from '@/data/wizard-mappings'
import { usePromptSmithStore } from '@/store/prompt-store'
import { getTagById } from '@/utils/tag-index'

interface QuickStartWizardProps {
  isOpen: boolean
  onClose: () => void
  onSkip: () => void
}

type WizardStep = 'subject' | 'style' | 'mood' | 'model' | 'done'

export function QuickStartWizard({ isOpen, onClose, onSkip }: QuickStartWizardProps) {
  const [step, setStep] = useState<WizardStep>('subject')
  const [subjectInput, setSubjectInput] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<'midjourney' | 'stable-diffusion' | 'dalle-3' | 'flux'>('midjourney')
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const setModel = usePromptSmithStore((s) => s.setSelectedModel)

  const handleFinish = () => {
    const store = usePromptSmithStore.getState()
    store._saveHistory()
    store.startHistoryBatch()
    clearAllTags()

    if (subjectInput.trim()) {
      setCustomText(subjectInput.trim())
    }

    if (selectedStyle) {
      const tagIds = getWizardStyleTags(selectedStyle)
      for (const id of tagIds) {
        const tag = getTagById(id)
        if (tag) toggleTag(tag)
      }
    }

    if (selectedMood) {
      const tagIds = getWizardMoodTags(selectedMood)
      for (const id of tagIds) {
        const tag = getTagById(id)
        if (tag) toggleTag(tag)
      }
    }

    setModel(selectedModel)
    store.endHistoryBatch()
    setStep('done')

    if (dontShowAgain) {
      onSkip()
    }
  }

  const handleSkip = () => {
    if (dontShowAgain) onSkip()
    onClose()
  }

  const stepIndex = { subject: 0, style: 1, mood: 2, model: 3, done: 4 }[step]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--ui-overlay)] z-50"
            onClick={handleSkip}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-lg max-h-[90vh] bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl shadow-lg flex flex-col overflow-hidden pointer-events-auto"
            role="dialog"
            aria-label="Quick start wizard"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ui-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-[var(--ui-border)] flex items-center justify-center">
                  <Sparkle weight="fill" className="w-4 h-4 text-[var(--ui-text)]" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-[var(--ui-text)]">Quick Start</h2>
                  <p className="text-xs text-[var(--ui-muted-text-faint)]">Build a prompt in seconds</p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 rounded-lg text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors"
                aria-label="Close wizard"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-[var(--ui-surface)]">
              <motion.div
                className="h-full bg-[var(--ui-text)]"
                initial={{ width: '0%' }}
                animate={{ width: `${((stepIndex + 1) / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                {step === 'subject' && (
                  <motion.div
                    key="subject"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">What do you want to create?</h3>
                      <p className="text-sm text-[var(--ui-muted-text)]">Describe your subject in a few words.</p>
                    </div>
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setStep('style')}
                      placeholder="e.g. A cyberpunk warrior, A serene mountain lake, Product photography..."
                      className="w-full px-4 py-3 bg-transparent border border-[var(--ui-border)] rounded-xl outline-none focus:border-[var(--ui-border-hover)] transition-colors text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text-faint)]"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      {['A portrait', 'A landscape', 'A character design', 'Product shot', 'Abstract art'].map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSubjectInput(s); setStep('style') }}
                          className="px-3 py-1.5 rounded-full border border-[var(--ui-border)] text-xs text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'style' && (
                  <motion.div
                    key="style"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">What style?</h3>
                      <p className="text-sm text-[var(--ui-muted-text)]">Pick the visual style for your image.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {WIZARD_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedStyle === style.id
                              ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                              : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                          }`}
                        >
                          <span className="text-sm font-medium text-[var(--ui-text)] block">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'mood' && (
                  <motion.div
                    key="mood"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">What is the mood?</h3>
                      <p className="text-sm text-[var(--ui-muted-text)]">Set the atmosphere and feeling.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {WIZARD_MOODS.map((mood) => (
                        <button
                          key={mood.id}
                          onClick={() => setSelectedMood(mood.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedMood === mood.id
                              ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                              : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                          }`}
                        >
                          <span className="text-sm font-medium text-[var(--ui-text)] block">{mood.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'model' && (
                  <motion.div
                    key="model"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-display text-[var(--ui-text)] mb-1">Which model?</h3>
                      <p className="text-sm text-[var(--ui-muted-text)]">This affects the prompt format.</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: 'midjourney' as const, name: 'Midjourney', desc: 'Evocative, poetic language' },
                        { id: 'stable-diffusion' as const, name: 'Stable Diffusion', desc: 'Precise tags and weights' },
                        { id: 'dalle-3' as const, name: 'DALL-E 3', desc: 'Natural language descriptions' },
                        { id: 'flux' as const, name: 'Flux', desc: 'Detailed, structured prompts' },
                      ].map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                            selectedModel === model.id
                              ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                              : 'border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]'
                          }`}
                        >
                          <div>
                            <span className="text-sm font-medium text-[var(--ui-text)] block">{model.name}</span>
                            <span className="text-xs text-[var(--ui-muted-text-faint)]">{model.desc}</span>
                          </div>
                          {selectedModel === model.id && (
                            <Check weight="fill" className="w-4 h-4 text-[var(--ui-text)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full border border-[var(--ui-text)] flex items-center justify-center">
                      <Check weight="bold" className="w-6 h-6 text-[var(--ui-text)]" />
                    </div>
                    <h3 className="text-lg font-display text-[var(--ui-text)]">Your prompt is ready</h3>
                    <p className="text-sm text-[var(--ui-muted-text)]">Tags have been applied. Check the prompt panel to see your result.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--ui-border)]">
              {step !== 'done' ? (
                <>
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
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2 text-sm text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => {
                        if (step === 'subject') setStep('style')
                        else if (step === 'style') setStep('mood')
                        else if (step === 'mood') setStep('model')
                        else if (step === 'model') handleFinish()
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <span>Next</span>
                      <ArrowRight weight="regular" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-full bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Start building
                </button>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
