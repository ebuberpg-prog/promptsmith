import { useMemo, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { usePromptSmithStore } from '@/store/prompt-store'
import { getTagById } from '@/utils/tag-index'
import {
  ArrowLeft,
  ArrowRight,
  Bird,
  Camera,
  Check,
  CloudRain,
  Confetti,
  Cube,
  Flower,
  GameController,
  Image,
  Lightning,
  Moon,
  Mountains,
  Package,
  PaintBrush,
  Palette,
  PencilSimple,
  Presentation,
  Sun,
  Sword,
  User,
  X,
} from '@phosphor-icons/react'
import type { ContentVisibility, SelectedTag } from '@/types'

interface WizardStep {
  id: string
  title: string
  description: string
}

interface WizardChoice {
  id: string
  label: string
  icon: React.ElementType
  prompt: string
  tagIds: string[]
}

const STEPS: WizardStep[] = [
  { id: 'genre', title: 'Subject', description: 'What kind of image are you building?' },
  { id: 'mood', title: 'Mood', description: 'What emotional register should guide it?' },
  { id: 'style', title: 'Medium', description: 'What visual language should shape it?' },
  { id: 'review', title: 'Review', description: 'Inspect the exact prompt and ingredients before applying.' },
]

const GENRES: WizardChoice[] = [
  { id: 'portrait', label: 'Portrait', icon: User, prompt: 'a waist-up portrait of {subject}, photographed at eye level', tagIds: ['style_portrait_photography', 'cam_dist_medium', 'cam_angle_eye_level'] },
  { id: 'landscape', label: 'Landscape', icon: Image, prompt: 'a panoramic landscape of {location} with layered foreground, middle ground, and distance', tagIds: ['cam_dist_extreme_wide', 'cam_lens_wide', 'comp_rule_thirds'] },
  { id: 'character', label: 'Character', icon: Sword, prompt: 'a full-body design for {character} with a clear silhouette and functional details', tagIds: ['style_concept_art', 'cam_dist_full', 'comp_centered'] },
  { id: 'scene', label: 'Scene', icon: Presentation, prompt: 'an environmental scene of {scene} with one clear focal event and a navigable foreground', tagIds: ['cam_dist_wide', 'comp_rule_thirds', 'comp_leading_lines'] },
  { id: 'abstract', label: 'Abstract', icon: Palette, prompt: 'an abstract composition based on {concept}, organized around one dominant visual rhythm', tagIds: ['style_abstract', 'comp_off_center', 'abs_rhythm'] },
  { id: 'product', label: 'Product', icon: Package, prompt: 'a considered studio study of {product} with accurate materials and deliberate negative space', tagIds: ['comp_centered', 'light_source_studio', 'light_soft'] },
]

const MOODS: WizardChoice[] = [
  { id: 'dramatic', label: 'Dramatic', icon: Lightning, prompt: 'dramatic but controlled, with strong tonal separation', tagIds: ['mood_dramatic', 'light_low_key'] },
  { id: 'peaceful', label: 'Peaceful', icon: Bird, prompt: 'quiet and restorative, with gentle pacing and open space', tagIds: ['mood_peaceful', 'light_soft'] },
  { id: 'playful', label: 'Playful', icon: Confetti, prompt: 'playful and energetic, with one unexpected visual relationship', tagIds: ['mood_playful', 'light_high_key'] },
  { id: 'dark', label: 'Dark', icon: Moon, prompt: 'shadow-led and restrained, while keeping the focal subject readable', tagIds: ['light_low_key', 'mood_mysterious'] },
  { id: 'bright', label: 'Bright', icon: Sun, prompt: 'bright and optimistic, with clean highlights and controlled color', tagIds: ['light_high_key', 'mood_playful'] },
  { id: 'mysterious', label: 'Mysterious', icon: CloudRain, prompt: 'mysterious and suggestive, revealing less than it implies', tagIds: ['mood_mysterious', 'light_rim'] },
  { id: 'romantic', label: 'Romantic', icon: Flower, prompt: 'warm and intimate, with soft transitions rather than sentimental decoration', tagIds: ['mood_romantic', 'light_soft'] },
  { id: 'epic', label: 'Epic', icon: Mountains, prompt: 'monumental in scale, with a small human or familiar cue for contrast', tagIds: ['mood_epic', 'cam_dist_extreme_wide'] },
]

const STYLES: WizardChoice[] = [
  { id: 'photo', label: 'Photography', icon: Camera, prompt: 'naturalistic photography with believable optics, texture, and exposure', tagIds: ['style_fine_art_photo'] },
  { id: 'illustration', label: 'Illustration', icon: PencilSimple, prompt: 'a deliberate digital illustration with clear shape language and selective detail', tagIds: ['style_digital_painting'] },
  { id: 'painting', label: 'Painting', icon: PaintBrush, prompt: 'an oil painting with visible brush decisions and a coherent edge hierarchy', tagIds: ['style_oil_painting'] },
  { id: 'concept-art', label: 'Concept Art', icon: GameController, prompt: 'production concept art that communicates function, scale, and material logic', tagIds: ['style_concept_art'] },
  { id: 'anime', label: 'Anime', icon: Flower, prompt: 'anime illustration with clean silhouettes, purposeful line weight, and restrained effects', tagIds: ['style_anime'] },
  { id: '3d', label: '3D Render', icon: Cube, prompt: 'a physically plausible 3D render with controlled materials and studio-grade lighting', tagIds: ['med_3d_octane'] },
]

interface TemplateWizardProps {
  isOpen: boolean
  onClose: () => void
}

function resolveExactTags(tagIds: string[], contentVisibility: ContentVisibility): SelectedTag[] {
  const seen = new Set<string>()
  return tagIds.flatMap((id) => {
    const tag = getTagById(id)
    if (!tag || seen.has(tag.id) || (contentVisibility === 'filtered' && tag.explicit)) return []
    seen.add(tag.id)
    return [{ ...tag, selectedAt: Date.now() }]
  })
}

export function TemplateWizard({ isOpen, onClose }: TemplateWizardProps) {
  const [step, setStep] = useState(0)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')

  const toggleTag = usePromptSmithStore((state) => state.toggleTag)
  const clearAllTags = usePromptSmithStore((state) => state.clearAllTags)
  const setCustomText = usePromptSmithStore((state) => state.setCustomText)
  const savePrompt = usePromptSmithStore((state) => state.savePrompt)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const captureDraftSnapshot = usePromptSmithStore((state) => state.captureDraftSnapshot)
  const setWorkspaceView = usePromptSmithStore((state) => state.setWorkspaceView)

  const genre = GENRES.find((choice) => choice.id === selectedGenre)
  const mood = MOODS.find((choice) => choice.id === selectedMood)
  const style = STYLES.find((choice) => choice.id === selectedStyle)

  const previewPrompt = useMemo(() => {
    if (!genre || !mood || !style) return ''
    return `Create ${genre.prompt}. Make the emotional register ${mood.prompt}. Render it as ${style.prompt}. Keep the focal idea legible, avoid conflicting styles, and preserve believable spatial relationships.`
  }, [genre, mood, style])

  const previewTags = useMemo(() => {
    if (!genre || !mood || !style) return []
    return resolveExactTags([...genre.tagIds, ...mood.tagIds, ...style.tagIds], contentVisibility)
  }, [contentVisibility, genre, mood, style])

  const reset = () => {
    setStep(0)
    setSelectedGenre(null)
    setSelectedMood(null)
    setSelectedStyle(null)
    setTemplateName('')
  }

  const closeAndReset = () => {
    onClose()
    reset()
  }

  const handleNext = () => {
    if (step === 2 && genre && mood && style) setTemplateName(`${genre.label} · ${mood.label} · ${style.label}`)
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const applyDraft = () => {
    captureDraftSnapshot('template')
    clearAllTags()
    previewTags.forEach((tag) => toggleTag(tag))
    setCustomText(previewPrompt)
  }

  const handleUseNow = () => {
    applyDraft()
    setWorkspaceView('craft')
    closeAndReset()
  }

  const handleSaveAsTemplate = () => {
    applyDraft()
    savePrompt(templateName.trim() || 'Custom Blueprint')
    setWorkspaceView('craft')
    closeAndReset()
  }

  const canGoNext = (step === 0 && Boolean(genre)) || (step === 1 && Boolean(mood)) || (step === 2 && Boolean(style)) || step === 3

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) closeAndReset() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(620px,calc(100vw_-_2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)] shadow-lg">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="font-display text-2xl text-balance">Build a blueprint</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-pretty text-[var(--ui-muted-text)]">{STEPS[step].description}</Dialog.Description>
            </div>
            <Dialog.Close className="size-11 shrink-0 rounded-lg border border-[var(--ui-border)] text-[var(--ui-muted-text)]" aria-label="Close template wizard"><X className="mx-auto size-4" /></Dialog.Close>
          </div>

          <ol className="grid grid-cols-4 border-b border-[var(--ui-border)] px-5 py-3 sm:px-6" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`}>
            {STEPS.map((wizardStep, index) => (
              <li key={wizardStep.id} aria-current={index === step ? 'step' : undefined} className={`border-t-2 pt-2 text-[10px] font-medium ${index <= step ? 'border-[var(--ui-text)] text-[var(--ui-text)]' : 'border-[var(--ui-border)] text-[var(--ui-muted-text-faint)]'}`}>
                {index + 1}. {wizardStep.title}
              </li>
            ))}
          </ol>

          <div className="min-h-80 overflow-y-auto p-5 pb-8 sm:p-6 sm:pb-8">
            {step === 0 && <ChoiceGrid choices={GENRES} selectedId={selectedGenre} onSelect={setSelectedGenre} columns="grid-cols-2 sm:grid-cols-3" />}
            {step === 1 && <ChoiceGrid choices={MOODS} selectedId={selectedMood} onSelect={setSelectedMood} columns="grid-cols-2 sm:grid-cols-4" compact />}
            {step === 2 && <ChoiceGrid choices={STYLES} selectedId={selectedStyle} onSelect={setSelectedStyle} columns="grid-cols-2 sm:grid-cols-3" />}
            {step === 3 && genre && mood && style && (
              <div className="space-y-5">
                <label className="block text-xs font-medium uppercase text-[var(--ui-muted-text)]">
                  Blueprint name
                  <input type="text" value={templateName} onChange={(event) => setTemplateName(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 text-sm text-[var(--ui-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" />
                </label>

                <section aria-labelledby="wizard-anatomy-title">
                  <h3 id="wizard-anatomy-title" className="text-xs font-medium uppercase text-[var(--ui-muted-text)]">Prompt anatomy</h3>
                  <dl className="mt-2 grid gap-px overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-border)] sm:grid-cols-3">
                    {[['Subject', genre.label], ['Mood', mood.label], ['Medium', style.label]].map(([label, value]) => (
                      <div key={label} className="bg-[var(--ui-bg)] p-3"><dt className="text-[10px] uppercase text-[var(--ui-muted-text-faint)]">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>
                    ))}
                  </dl>
                </section>

                <section aria-labelledby="wizard-prompt-title">
                  <h3 id="wizard-prompt-title" className="text-xs font-medium uppercase text-[var(--ui-muted-text)]">Editable starter prompt</h3>
                  <p className="mt-2 rounded-xl bg-[var(--ui-surface-soft)] p-4 text-sm leading-6 text-pretty">{previewPrompt}</p>
                </section>

                <section aria-labelledby="wizard-ingredients-title">
                  <h3 id="wizard-ingredients-title" className="text-xs font-medium uppercase text-[var(--ui-muted-text)]">{previewTags.length} exact ingredients</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewTags.map((tag) => <span key={tag.id} className="rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5 text-xs text-[var(--ui-muted-text)]">{tag.label}</span>)}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] px-5 py-4 sm:px-6">
            <button type="button" onClick={step === 0 ? closeAndReset : () => setStep((current) => Math.max(current - 1, 0))} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm text-[var(--ui-muted-text)]"><span className="flex items-center gap-2"><ArrowLeft className="size-4" />{step === 0 ? 'Cancel' : 'Back'}</span></button>
            {step === 3 ? (
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveAsTemplate} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Save blueprint</button>
                <button type="button" onClick={handleUseNow} className="min-h-11 rounded-lg bg-[var(--ui-text)] px-4 text-sm font-medium text-[var(--ui-bg)]"><span className="flex items-center gap-2"><Check className="size-4" />Use in Craft</span></button>
              </div>
            ) : (
              <button type="button" onClick={handleNext} disabled={!canGoNext} className="min-h-11 rounded-lg bg-[var(--ui-text)] px-4 text-sm font-medium text-[var(--ui-bg)] disabled:opacity-30"><span className="flex items-center gap-2">Next<ArrowRight className="size-4" /></span></button>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ChoiceGrid({ choices, selectedId, onSelect, columns, compact = false }: {
  choices: WizardChoice[]
  selectedId: string | null
  onSelect: (id: string) => void
  columns: string
  compact?: boolean
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {choices.map((choice) => {
        const Icon = choice.icon
        const selected = selectedId === choice.id
        return (
          <button key={choice.id} type="button" aria-pressed={selected} onClick={() => onSelect(choice.id)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border px-3 text-center ${compact ? 'min-h-20' : ''} ${selected ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)] text-[var(--ui-text)]' : 'border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]'}`}>
            <Icon weight={selected ? 'fill' : 'regular'} className="size-5" />
            <span className="text-xs font-medium">{choice.label}</span>
          </button>
        )
      })}
    </div>
  )
}
