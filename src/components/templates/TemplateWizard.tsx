import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { searchTagIndex } from '@/utils/tag-index'
import { X, ArrowRight, ArrowLeft, Check } from '@phosphor-icons/react'
import type { SelectedTag } from '@/types'

interface WizardStep {
  id: string
  title: string
  description: string
}

const STEPS: WizardStep[] = [
  { id: 'genre', title: 'Genre', description: 'What kind of image are you making?' },
  { id: 'mood', title: 'Mood', description: 'What feeling should it have?' },
  { id: 'style', title: 'Style', description: 'How should it look visually?' },
  { id: 'review', title: 'Review', description: 'Preview your template before applying' },
]

const GENRES = [
  { id: 'portrait', label: 'Portrait', emoji: '👤', promptHint: 'close-up portrait, person' },
  { id: 'landscape', label: 'Landscape', emoji: '🌄', promptHint: 'wide landscape, scenic environment' },
  { id: 'character', label: 'Character', emoji: '⚔️', promptHint: 'full body character design' },
  { id: 'scene', label: 'Scene', emoji: '🎭', promptHint: 'environmental scene, setting' },
  { id: 'abstract', label: 'Abstract', emoji: '🎨', promptHint: 'abstract art, non-representational' },
  { id: 'product', label: 'Product', emoji: '📦', promptHint: 'product shot, clean background' },
]

const MOODS = [
  { id: 'dramatic', label: 'Dramatic', emoji: '⚡', keywords: ['dramatic', 'intense', 'moody'] },
  { id: 'peaceful', label: 'Peaceful', emoji: '🕊️', keywords: ['peaceful', 'serene', 'calm'] },
  { id: 'playful', label: 'Playful', emoji: '🎪', keywords: ['playful', 'whimsical', 'fun'] },
  { id: 'dark', label: 'Dark', emoji: '🌑', keywords: ['dark', 'shadow', 'mysterious'] },
  { id: 'bright', label: 'Bright', emoji: '☀️', keywords: ['bright', 'vibrant', 'energetic'] },
  { id: 'mysterious', label: 'Mysterious', emoji: '🌙', keywords: ['mysterious', 'ethereal', 'mystical'] },
  { id: 'romantic', label: 'Romantic', emoji: '🌹', keywords: ['romantic', 'soft', 'warm'] },
  { id: 'epic', label: 'Epic', emoji: '🏔️', keywords: ['epic', 'grand', 'majestic'] },
]

const STYLES = [
  { id: 'photo', label: 'Photography', emoji: '📷', keywords: ['photorealistic', 'photograph', 'realistic'] },
  { id: 'illustration', label: 'Illustration', emoji: '✏️', keywords: ['illustration', 'digital art', 'artwork'] },
  { id: 'painting', label: 'Painting', emoji: '🖌️', keywords: ['oil painting', 'painterly', 'brushstroke'] },
  { id: 'concept-art', label: 'Concept Art', emoji: '🎮', keywords: ['concept art', 'professional', 'detailed'] },
  { id: 'anime', label: 'Anime', emoji: '🌸', keywords: ['anime', 'manga', 'japanese animation'] },
  { id: '3d', label: '3D Render', emoji: '🧊', keywords: ['3d render', 'cgi', 'octane render'] },
]

interface TemplateWizardProps {
  isOpen: boolean
  onClose: () => void
}

export function TemplateWizard({ isOpen, onClose }: TemplateWizardProps) {
  const [step, setStep] = useState(0)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [previewTags, setPreviewTags] = useState<SelectedTag[]>([])
  const [isBuilding, setIsBuilding] = useState(false)

  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const savePrompt = usePromptSmithStore((s) => s.savePrompt)
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)

  const buildPreviewTags = async () => {
    setIsBuilding(true)
    const allKeywords: string[] = []

    const genre = GENRES.find(g => g.id === selectedGenre)
    const mood = MOODS.find(m => m.id === selectedMood)
    const style = STYLES.find(s => s.id === selectedStyle)

    if (genre) allKeywords.push(...genre.promptHint.split(', '))
    if (mood) allKeywords.push(...mood.keywords)
    if (style) allKeywords.push(...style.keywords)

    const resolved: SelectedTag[] = []
    const seenIds = new Set<string>()

    for (const kw of allKeywords) {
      const matches = searchTagIndex(kw, showExplicit, 2)
      for (const tag of matches) {
        if (!seenIds.has(tag.id)) {
          seenIds.add(tag.id)
          resolved.push({ ...tag, selectedAt: Date.now() })
        }
      }
    }

    setPreviewTags(resolved.slice(0, 12))
    setIsBuilding(false)
  }

  const handleNext = async () => {
    if (step === 2) {
      await buildPreviewTags()
      const genre = GENRES.find(g => g.id === selectedGenre)
      const mood = MOODS.find(m => m.id === selectedMood)
      const style = STYLES.find(s => s.id === selectedStyle)
      setTemplateName(`${genre?.label ?? ''} · ${mood?.label ?? ''} · ${style?.label ?? ''}`)
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  const handleUseNow = () => {
    clearAllTags()
    for (const tag of previewTags) toggleTag(tag)
    const genre = GENRES.find(g => g.id === selectedGenre)
    const mood = MOODS.find(m => m.id === selectedMood)
    setCustomText(`${genre?.promptHint ?? ''}, ${mood?.keywords[0] ?? ''}`)
    onClose()
    reset()
  }

  const handleSaveAsTemplate = () => {
    clearAllTags()
    for (const tag of previewTags) toggleTag(tag)
    const name = templateName.trim() || 'Custom Template'
    savePrompt(name)
    handleUseNow()
  }

  const reset = () => {
    setStep(0)
    setSelectedGenre(null)
    setSelectedMood(null)
    setSelectedStyle(null)
    setPreviewTags([])
    setTemplateName('')
  }

  const canGoNext =
    (step === 0 && selectedGenre !== null) ||
    (step === 1 && selectedMood !== null) ||
    (step === 2 && selectedStyle !== null) ||
    step === 3

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { onClose(); reset() }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
                <div>
                  <h2 className="font-display text-lg font-normal text-[#f5f5f5] tracking-tight">
                    Template Wizard
                  </h2>
                  <p className="text-xs text-[#c2c2c2]/50 mt-0.5">{STEPS[step].description}</p>
                </div>
                <button onClick={() => { onClose(); reset() }} className="text-[#c2c2c2]/40 hover:text-[#f5f5f5] transition-colors">
                  <X weight="regular" className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1.5 px-6 py-3 border-b border-[#1a1a1a]">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      i < step ? 'bg-[#f5f5f5]' : i === step ? 'bg-[#f5f5f5] ring-2 ring-[#f5f5f5]/20' : 'bg-[#333]'
                    }`} />
                    {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-[#f5f5f5]/30' : 'bg-[#222]'}`} />}
                  </div>
                ))}
                <span className="ml-2 text-[10px] text-[#c2c2c2]/40">{STEPS[step].title}</span>
              </div>

              {/* Step content */}
              <div className="p-6 min-h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                  >
                    {step === 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {GENRES.map(g => (
                          <OptionCard
                            key={g.id}
                            label={g.label}
                            emoji={g.emoji}
                            selected={selectedGenre === g.id}
                            onClick={() => setSelectedGenre(g.id)}
                          />
                        ))}
                      </div>
                    )}

                    {step === 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {MOODS.map(m => (
                          <OptionCard
                            key={m.id}
                            label={m.label}
                            emoji={m.emoji}
                            selected={selectedMood === m.id}
                            onClick={() => setSelectedMood(m.id)}
                            compact
                          />
                        ))}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid grid-cols-3 gap-2">
                        {STYLES.map(s => (
                          <OptionCard
                            key={s.id}
                            label={s.label}
                            emoji={s.emoji}
                            selected={selectedStyle === s.id}
                            onClick={() => setSelectedStyle(s.id)}
                          />
                        ))}
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-[#c2c2c2]/50 uppercase tracking-wider">Template Name</label>
                          <input
                            type="text"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            className="mt-1.5 w-full px-3 py-2 bg-transparent border border-[#222] rounded-full text-sm text-[#f5f5f5] outline-none focus:border-[#444] transition-colors"
                          />
                        </div>

                        {isBuilding ? (
                          <div className="flex items-center gap-2 py-4">
                            <div className="w-4 h-4 rounded-full border border-[#333] border-t-[#f5f5f5] animate-spin" />
                            <span className="text-xs text-[#c2c2c2]/50">Building tag set…</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-xs text-[#c2c2c2]/50">{previewTags.length} tags selected</span>
                            <div className="flex flex-wrap gap-1.5">
                              {previewTags.map(tag => (
                                <span key={tag.id} className="text-xs px-2.5 py-1 rounded-full border border-[#f5f5f5]/20 text-[#f5f5f5]/70">
                                  {tag.label}
                                </span>
                              ))}
                              {previewTags.length === 0 && (
                                <span className="text-xs text-[#c2c2c2]/30 italic">No matching tags found in taxonomy — you can still use the prompt text</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a]">
                <button
                  onClick={step === 0 ? () => { onClose(); reset() } : handleBack}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-sm text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all"
                >
                  <ArrowLeft weight="regular" className="w-3.5 h-3.5" />
                  {step === 0 ? 'Cancel' : 'Back'}
                </button>

                <div className="flex items-center gap-2">
                  {step === 3 ? (
                    <>
                      <button
                        onClick={handleSaveAsTemplate}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-sm text-[#c2c2c2] hover:border-[#555] transition-all"
                      >
                        Save Template
                      </button>
                      <button
                        onClick={handleUseNow}
                        className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#f5f5f5] text-black text-sm font-medium hover:bg-white transition-colors"
                      >
                        <Check weight="bold" className="w-3.5 h-3.5" />
                        Use Now
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#f5f5f5] text-black text-sm font-medium disabled:opacity-30 hover:bg-white transition-all"
                    >
                      Next
                      <ArrowRight weight="regular" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function OptionCard({
  label, emoji, selected, onClick, compact,
}: {
  label: string
  emoji: string
  selected: boolean
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 ${compact ? 'p-2' : 'p-3'} rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-[#f5f5f5]/60 bg-white/5 text-[#f5f5f5]'
          : 'border-[#222] text-[#c2c2c2] hover:border-[#444] hover:text-[#f5f5f5]'
      }`}
    >
      <span className={compact ? 'text-lg' : 'text-2xl'}>{emoji}</span>
      <span className={`font-medium leading-snug text-center ${compact ? 'text-[9px]' : 'text-xs'}`}>{label}</span>
    </button>
  )
}
