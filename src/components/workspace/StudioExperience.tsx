import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import {
  Aperture,
  ArrowRight,
  Copy,
  CaretDown,
  DotsThree,
  Eye,
  EyeSlash,
  Gear,
  Heart,
  House,
  Lightning,
  MagnifyingGlass,
  Moon,
  Sparkle,
  SquaresFour,
  Sun,
  Trash,
  UploadSimple,
} from '@phosphor-icons/react'
import { CommandPalette } from '@/components/command/CommandPalette'
import { Menu } from '@base-ui/react/menu'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { QuickStartWizard } from '@/components/onboarding/QuickStartWizard'
import { AISettingsPanel } from '@/components/settings/AISettingsPanel'
import { NegativePromptIntelligence } from '@/components/negative/NegativePromptIntelligence'
import { PromptOutput } from '@/components/prompt/PromptOutput'
import { RelatedTagSuggestions } from '@/components/prompt/RelatedTagSuggestions'
import { FormatComparison } from '@/components/prompt/FormatComparison'
import { VisualSparks } from '@/components/inspiration/VisualSparks'
import { ActionToast } from '@/components/feedback/ActionToast'
import { TagSuggestions } from '@/components/prompt/TagSuggestions'
import { RandomizerPanel } from '@/components/randomizer/RandomizerPanel'
import { ReferenceUploader } from '@/components/reference/ReferenceUploader'
import { SmartTagBrowser } from '@/components/tags/SmartTagBrowser'
import { TemplateGallery } from '@/components/templates/TemplateGallery'
import { getModelConfig, MODEL_GROUPS } from '@/data/model-configs'
import { BUILT_IN_FORMATTER_PROFILES, getFormatterProfile } from '@/data/formatter-profiles'
import { INSPIRATION_ASSETS } from '@/data/inspiration-assets'
import { usePromptSmithStore } from '@/store/prompt-store'
import { exportTemplate, importTemplate } from '@/utils/template-engine'
import { analyzeComposerInput } from '@/services/composer-analysis'
import { useDraftPersistenceState } from '@/hooks/useDraftPersistenceState'
import type { PromptTemplate, PromptVersion, TaxonomyCategory, WorkspaceView } from '@/types'

const EXAMPLES = [
  'A quiet portrait lit by a rainy shop window',
  'Editorial product study on folded handmade paper',
  'A mythic coastal city at the end of summer',
]

const STARTERS = [
  { label: 'Portrait study', prompt: 'A thoughtful portrait study with deliberate lighting and expressive detail' },
  { label: 'Product scene', prompt: 'A refined product scene with tactile materials and controlled studio light' },
  { label: 'World building', prompt: 'An atmospheric environment that suggests a larger story beyond the frame' },
  { label: 'Surprise me', prompt: 'An unexpected visual idea combining an ordinary ritual with an impossible place' },
]

const AnalyzeView = lazy(() => import('@/components/analyze/AnalyzeView').then((module) => ({ default: module.AnalyzeView })))

export function StudioExperience({ taxonomy }: { taxonomy: TaxonomyCategory[] }) {
  const workspaceView = usePromptSmithStore((state) => state.workspaceView)
  const setWorkspaceView = usePromptSmithStore((state) => state.setWorkspaceView)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [notice, setNotice] = useState('')

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <StudioHeader
        activeView={workspaceView}
        onViewChange={setWorkspaceView}
        onSettings={() => setSettingsOpen(true)}
      />

      <main key={workspaceView} className={`flex-1 min-h-0 overflow-y-auto md:pb-0 ${workspaceView === 'craft' ? 'pb-36' : 'pb-20'}`}>
        {workspaceView === 'home' && <HomeView onGuidedStart={() => setWizardOpen(true)} />}
        {workspaceView === 'craft' && <CraftView taxonomy={taxonomy} />}
        {workspaceView === 'analyze' && <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-12 text-sm text-[var(--ui-muted-text)]" role="status">Opening the visual study desk…</div>}><AnalyzeView onOpenSettings={() => setSettingsOpen(true)} onNotify={setNotice} /></Suspense>}
        {workspaceView === 'library' && <LibraryView taxonomy={taxonomy} />}
      </main>

      <MobileNavigation activeView={workspaceView} onViewChange={setWorkspaceView} />
      <CommandPalette />
      <AISettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <QuickStartWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} onSkip={() => setWizardOpen(false)} />
      <ActionToast message={notice} onDismiss={() => setNotice('')} />
    </div>
  )
}

function StudioHeader({ activeView, onViewChange, onSettings }: {
  activeView: WorkspaceView
  onViewChange: (view: WorkspaceView) => void
  onSettings: () => void
}) {
  const theme = usePromptSmithStore((state) => state.theme)
  const toggleTheme = usePromptSmithStore((state) => state.toggleTheme)
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const toggleContentVisibility = usePromptSmithStore((state) => state.toggleContentVisibility)

  const openSearch = () => window.dispatchEvent(new CustomEvent('command-palette-open'))

  return (
    <header className="min-h-14 flex items-center gap-3 px-3 sm:px-5 border-b border-[var(--ui-border)] safe-top bg-[var(--ui-bg)]">
      <button type="button" onClick={() => onViewChange('home')} className="min-h-11 min-w-11 flex items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="MUSE Prompt Studio home">
        <span className="size-8 rounded-full border border-[var(--ui-border)] flex items-center justify-center"><Lightning weight="fill" className="size-4" /></span>
        <span className="hidden sm:block font-display text-lg">MUSE <span className="font-sans text-[11px] text-[var(--ui-muted-text)]">Prompt Studio</span></span>
      </button>

      <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Workspace">
        <HeaderTab label="Home" active={activeView === 'home'} onClick={() => onViewChange('home')} />
        <HeaderTab label="Craft" active={activeView === 'craft'} onClick={() => onViewChange('craft')} />
        <HeaderTab label="Analyze" active={activeView === 'analyze'} onClick={() => onViewChange('analyze')} />
        <HeaderTab label="Library" active={activeView === 'library'} onClick={() => onViewChange('library')} />
      </nav>

      <div className="flex-1" />
      <div className="hidden sm:block"><FormatterProfilePicker /></div>
      <button type="button" onClick={openSearch} className="size-11 rounded-full flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Search prompts, templates, tags, and commands"><MagnifyingGlass className="size-5" /></button>
      <button type="button" onClick={onSettings} className="hidden sm:flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Open settings"><Gear className="size-4" /><span className="hidden lg:inline">Settings</span></button>
      <Menu.Root><Menu.Trigger className="size-11 rounded-full flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="More workspace controls"><DotsThree weight="bold" className="size-5" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end" sideOffset={8} className="z-40"><Menu.Popup className="w-64 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg">
          <Menu.Item onClick={toggleContentVisibility} className="w-full min-h-11 px-3 rounded-lg flex items-center gap-3 text-left text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]" aria-label={contentVisibility === 'all' ? 'Showing all taxonomy tags. Switch to filtered tags' : 'Showing filtered taxonomy tags. Switch to all tags'}>
            {contentVisibility === 'all' ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
            <span className="flex-1">{contentVisibility === 'all' ? 'All tags' : 'Filtered tags'}</span>
            <span className="text-[10px] text-[var(--ui-muted-text)]">Suggestions only</span>
          </Menu.Item>
          <Menu.Item onClick={toggleTheme} className="w-full min-h-11 px-3 rounded-lg flex items-center gap-3 text-left text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Light appearance' : 'Dark appearance'}
          </Menu.Item>
          <Menu.Item onClick={onSettings} className="w-full min-h-11 px-3 rounded-lg flex items-center gap-3 text-left text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><Gear className="size-4" />Local connections and settings</Menu.Item>
        </Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>
    </header>
  )
}

function HeaderTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`min-h-11 px-4 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]'}`}>{label}</button>
}

function FirstPromptPath({ stage }: { stage: 'describe' | 'refine' | 'save' }) {
  const stages = [
    { id: 'describe', label: 'Describe', detail: 'Start with your own words' },
    { id: 'refine', label: 'Refine', detail: 'Add only useful direction' },
    { id: 'save', label: 'Save', detail: 'Keep the idea in your Library' },
  ] as const
  const activeIndex = stages.findIndex((item) => item.id === stage)
  return <section className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4" aria-label="Your first prompt"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ui-muted-text)]">Your first prompt</p><p className="mt-1 text-sm text-pretty text-[var(--ui-muted-text)]">Three small steps. Your original words remain yours throughout.</p></div><span className="hidden sm:block text-xs tabular-nums text-[var(--ui-muted-text)]">{activeIndex + 1} of 3</span></div><ol className="mt-4 grid gap-2 sm:grid-cols-3">{stages.map((item, index) => { const complete = index < activeIndex; const active = index === activeIndex; return <li key={item.id} aria-current={active ? 'step' : undefined} className={`rounded-xl border px-3 py-3 ${active ? 'border-[var(--ui-border-strong)] bg-[var(--ui-surface-soft)]' : 'border-[var(--ui-border-faint)]'}`}><div className="flex items-center gap-2"><span className={`flex size-6 items-center justify-center rounded-full border text-xs tabular-nums ${complete || active ? 'border-[var(--ui-text)] bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'border-[var(--ui-border)] text-[var(--ui-muted-text)]'}`}>{complete ? '✓' : index + 1}</span><strong className="text-sm font-medium">{item.label}</strong></div><p className="mt-2 text-xs leading-5 text-pretty text-[var(--ui-muted-text)]">{item.detail}</p></li> })}</ol></section>
}

function HomeView({ onGuidedStart }: { onGuidedStart: () => void }) {
  const customText = usePromptSmithStore((state) => state.customText)
  const setCustomText = usePromptSmithStore((state) => state.setCustomText)
  const setWorkspaceView = usePromptSmithStore((state) => state.setWorkspaceView)
  const savedPrompts = usePromptSmithStore((state) => state.savedPrompts)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const activePromptId = usePromptSmithStore((state) => state.activePromptId)
  const startNewPrompt = usePromptSmithStore((state) => state.startNewPrompt)
  const draftPersistenceState = useDraftPersistenceState()
  const captureDraftSnapshot = usePromptSmithStore((state) => state.captureDraftSnapshot)
  const flushDraft = usePromptSmithStore((state) => state.flushDraft)

  const favorites = savedPrompts.filter((prompt) => prompt.isFavorite).slice(0, 3)
  const recents = [...savedPrompts].sort((a, b) => (b.lastOpenedAt ?? b.updatedAt) - (a.lastOpenedAt ?? a.updatedAt)).slice(0, 3)
  const isFirstPrompt = savedPrompts.length === 0 && !activePromptId

  const craft = async (text = customText) => {
    if (!text.trim()) return
    if (text !== customText) { captureDraftSnapshot('template'); setCustomText(text) }
    setWorkspaceView('craft')
    await flushDraft()
  }

  const applyExample = (text: string) => { captureDraftSnapshot('template'); setCustomText(text) }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <section className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase text-[var(--ui-muted-text)]">Private, local-first prompt craft</p>
          <h1 className="font-display text-4xl sm:text-6xl leading-none text-balance">Begin with the image in your head.</h1>
        </div>

        {isFirstPrompt && <FirstPromptPath stage={customText.trim() ? 'refine' : 'describe'} />}

        <div className="rounded-2xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-elevated)] p-3 sm:p-4 space-y-3">
          {activePromptId && <div className="flex items-center justify-between gap-3 px-1"><p className="min-w-0 truncate text-xs text-[var(--ui-muted-text)]">Continuing a saved prompt</p><button type="button" onClick={startNewPrompt} className="min-h-11 shrink-0 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Start new</button></div>}
          <textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Describe what you want to create or paste a prompt…" className="w-full min-h-36 resize-y rounded-xl bg-[var(--ui-surface-soft)] px-4 py-4 text-base sm:text-lg leading-7 text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text-faint)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="shrink-0"><FormatterProfilePicker align="start" /></div>
            <div className="min-w-0 flex-1"><RelatedTagSuggestions text={customText} /></div>
            <button type="button" onClick={() => void craft()} disabled={!customText.trim()} className="min-h-12 w-full shrink-0 px-6 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] font-medium flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-auto sm:w-auto">Craft prompt <ArrowRight className="size-4" /></button>
          </div>
          {!customText.trim() && <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => <button key={example} type="button" onClick={() => applyExample(example)} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 line-clamp-1">{example}</button>)}
          </div>}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ui-muted-text)]">
          <button type="button" onClick={onGuidedStart} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Guided start</button>
          {(customText.trim() || selectedTags.length > 0) && <button type="button" onClick={() => setWorkspaceView('craft')} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Continue current draft</button>}
          <span className="ml-auto text-right" aria-live="polite">{draftPersistenceState === 'saving' ? 'Saving…' : draftPersistenceState === 'error' ? 'Save failed · export a backup' : 'Saved locally · works offline'}</span>
        </div>
      </section>

      <VisualSparks />

      {(favorites.length > 0 || recents.length > 0) && <section className={`grid gap-8 ${favorites.length > 0 && recents.length > 0 ? 'md:grid-cols-2' : ''}`}>{favorites.length > 0 && <PromptShelf title="Favorites" prompts={favorites} empty="" />}{recents.length > 0 && <PromptShelf title="Recent" prompts={recents} empty="" />}</section>}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4"><h2 className="font-display text-3xl text-balance">Starting points</h2><button type="button" onClick={() => setWorkspaceView('library')} className="min-h-11 px-3 text-sm text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]">View library</button></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STARTERS.map((starter) => <button key={starter.label} type="button" onClick={() => void craft(starter.prompt)} className="min-h-32 text-left rounded-2xl border border-[var(--ui-border)] p-4 hover:border-[var(--ui-border-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><Sparkle className="size-5 mb-5 text-[var(--ui-muted-text)]" /><strong className="block font-display text-xl font-normal">{starter.label}</strong><span className="mt-1 block text-xs leading-5 text-[var(--ui-muted-text)] line-clamp-2">{starter.prompt}</span></button>)}
        </div>
      </section>

    </div>
  )
}

function FormatterProfilePicker({ label, align = 'end' }: { label?: string; align?: 'start' | 'end' }) {
  const setSelectedModel = usePromptSmithStore((state) => state.setSelectedModel)
  const selectedFormatterProfileId = usePromptSmithStore((state) => state.selectedFormatterProfileId)
  const customFormatterProfiles = usePromptSmithStore((state) => state.customFormatterProfiles)
  const setFormatterProfile = usePromptSmithStore((state) => state.setFormatterProfile)
  const profile = getFormatterProfile(selectedFormatterProfileId, customFormatterProfiles)
  return <div className="flex items-center gap-3">{label && <span className="text-xs text-[var(--ui-muted-text)]">{label}</span>}<Menu.Root><Menu.Trigger className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-sm text-[var(--ui-text)] flex items-center gap-2"><span>{profile.name}</span><CaretDown className="size-3.5 text-[var(--ui-muted-text)]" /></Menu.Trigger><Menu.Portal><Menu.Positioner align={align} sideOffset={8} className="z-40"><Menu.Popup className="w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-2 shadow-lg"><p className="px-3 py-2 text-xs text-[var(--ui-muted-text)]">Formats</p>{[...BUILT_IN_FORMATTER_PROFILES, ...customFormatterProfiles].map((item) => <Menu.Item key={item.id} onClick={() => setFormatterProfile(item.id)} className="min-h-11 px-3 rounded-lg flex items-center justify-between text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>{item.name}</span>{selectedFormatterProfileId === item.id && <span aria-hidden="true">✓</span>}</Menu.Item>)}<Menu.Separator className="my-2 h-px bg-[var(--ui-border)]" /><p className="px-3 py-2 text-xs text-[var(--ui-muted-text)]">Model presets</p>{MODEL_GROUPS.flatMap((group) => group.models).map((model) => { const config = getModelConfig(model); return <Menu.Item key={model} onClick={() => setSelectedModel(model)} className="min-h-11 px-3 rounded-lg flex items-center justify-between text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><span>{config.name}</span><span className="text-[10px] text-[var(--ui-muted-text)]">{config.version}</span></Menu.Item> })}</Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div>
}

function PromptShelf({ title, prompts, empty }: { title: string; prompts: PromptTemplate[]; empty: string }) {
  const loadPrompt = usePromptSmithStore((state) => state.loadPrompt)
  return <div className="min-w-0 max-w-full space-y-3"><h2 className="font-display text-2xl">{title}</h2>{prompts.length === 0 ? <p className="text-sm text-[var(--ui-muted-text)]">{empty}</p> : <div className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2">{prompts.map((prompt) => { const cover = prompt.coverImageDataUrl || defaultCoverForPrompt(prompt).src; return <button key={prompt.id} type="button" onClick={() => loadPrompt(prompt)} aria-label={`Open ${prompt.name} in Craft`} className="group grid min-h-24 min-w-0 grid-cols-[5rem_minmax(0,1fr)] gap-3 overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-2 text-left hover:border-[var(--ui-border-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><span className="block size-20 overflow-hidden rounded-lg bg-[var(--ui-surface-soft)]"><img src={cover} alt="" className="size-full scale-[1.04] object-cover transition-transform duration-200 group-hover:scale-[1.08] motion-reduce:transition-none" /></span><span className="flex min-w-0 flex-col py-1 pr-1"><strong className="truncate text-sm font-medium">{prompt.name}</strong><span className="mt-1 truncate text-xs text-[var(--ui-muted-text)]">{getModelConfig(prompt.model).name}</span><span className="mt-auto flex items-center gap-1.5 text-xs font-medium">Open in Craft <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" /></span></span></button> })}</div>}</div>
}

function CraftView({ taxonomy }: { taxonomy: TaxonomyCategory[] }) {
  const workspaceDepth = usePromptSmithStore((state) => state.workspaceDepth)
  const setWorkspaceDepth = usePromptSmithStore((state) => state.setWorkspaceDepth)
  const savedPromptCount = usePromptSmithStore((state) => state.savedPrompts.length)
  const activePromptId = usePromptSmithStore((state) => state.activePromptId)
  const [browseAll, setBrowseAll] = useState(false)
  const [openStudioSection, setOpenStudioSection] = useState('')
  const isFirstPrompt = savedPromptCount === 0 && !activePromptId

  return (
    <div className={`${workspaceDepth === 'studio' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div><h1 className="font-display text-3xl sm:text-4xl text-balance">Craft</h1><p className="mt-1 text-sm text-pretty text-[var(--ui-muted-text)]">Shape the prompt, then copy it or keep it in your Library.</p></div>
        <div className="sm:text-right"><div className="inline-flex items-center gap-1 p-1 rounded-lg border border-[var(--ui-border)]" role="group" aria-label="Workspace depth"><DepthButton label="Simple" active={workspaceDepth === 'simple'} onClick={() => setWorkspaceDepth('simple')} /><DepthButton label="Studio tools" active={workspaceDepth === 'studio'} onClick={() => setWorkspaceDepth('studio')} /></div><p className="mt-1.5 text-xs text-[var(--ui-muted-text)]">{workspaceDepth === 'simple' ? 'Focused writing and output' : 'Suggestions, variations, negatives, and references'}</p></div>
      </div>

      {isFirstPrompt && <FirstPromptPath stage="refine" />}

      <div className={`${workspaceDepth === 'studio' ? 'grid xl:grid-cols-[minmax(0,1fr)_320px]' : ''} gap-5 items-start`}>
        <div className="space-y-4 min-w-0">
          <PromptOutput />
          <button type="button" onClick={() => setBrowseAll(true)} className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)] text-sm text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]">Find ingredients</button>
        </div>

        {workspaceDepth === 'studio' && <aside className="space-y-2 xl:sticky xl:top-5" aria-label="Studio refinement controls">
          <div className="px-1 pb-2"><h2 className="font-display text-2xl text-balance">Refine</h2><p className="mt-1 text-xs leading-5 text-pretty text-[var(--ui-muted-text)]">Open one tool when the prompt needs a specific kind of help.</p></div>
          <StudioSection id="prompt-check" title="Prompt check" active={openStudioSection === 'prompt-check'} onToggle={setOpenStudioSection}><PromptCheck onBrowse={() => setBrowseAll(true)} /></StudioSection>
          <StudioSection id="suggestions" title="Suggestions" active={openStudioSection === 'suggestions'} onToggle={setOpenStudioSection}><TagSuggestions /></StudioSection>
          <StudioSection id="variations" title="Variations" active={openStudioSection === 'variations'} onToggle={setOpenStudioSection}><RandomizerPanel /></StudioSection>
          <StudioSection id="negatives" title="Negatives" active={openStudioSection === 'negatives'} onToggle={setOpenStudioSection}><NegativePromptIntelligence /></StudioSection>
          <StudioSection id="references" title="References" active={openStudioSection === 'references'} onToggle={setOpenStudioSection}><ReferenceUploader /></StudioSection>
          <StudioSection id="compare" title="Compare formats" active={openStudioSection === 'compare'} onToggle={setOpenStudioSection}><FormatComparison /></StudioSection>
        </aside>}
      </div>
      <Dialog.Root open={browseAll} onOpenChange={setBrowseAll}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><Dialog.Popup className="fixed right-0 inset-y-0 z-50 w-[min(100%,620px)] overflow-y-auto border-l border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 sm:p-6 safe-bottom"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-display text-3xl">Add ingredients</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[var(--ui-muted-text)]">Search the complete local taxonomy. Selected ingredients never replace your words.</Dialog.Description></div><Dialog.Close className="size-11 rounded-full border border-[var(--ui-border)]" aria-label="Close ingredient browser">×</Dialog.Close></div><div className="mt-6"><SmartTagBrowser taxonomy={taxonomy} /></div></Dialog.Popup></Dialog.Portal></Dialog.Root>
    </div>
  )
}

function DepthButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`min-h-11 px-4 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]'}`}>{label}</button>
}

function StudioSection({ id, title, children, active, onToggle }: { id: string; title: string; children: React.ReactNode; active: boolean; onToggle: (id: string) => void }) {
  const panelId = `studio-panel-${id}`
  return <section className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)]"><button type="button" aria-expanded={active} aria-controls={panelId} onClick={() => onToggle(active ? '' : id)} className="min-h-12 w-full px-4 flex items-center justify-between gap-3 text-left text-sm font-medium"><span>{title}</span><CaretDown className={`size-4 text-[var(--ui-muted-text)] ${active ? 'rotate-180' : ''}`} aria-hidden="true" /></button>{active && <div id={panelId} className="border-t border-[var(--ui-border)] p-4 max-h-[560px] overflow-y-auto">{children}</div>}</section>
}

function PromptCheck({ onBrowse }: { onBrowse: () => void }) {
  const text = usePromptSmithStore((state) => state.customText)
  const visibility = usePromptSmithStore((state) => state.contentVisibility)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const analysis = analyzeComposerInput(text, visibility, 8)
  const dimensions = new Set(analysis.presentDimensions)
  selectedTags.forEach((tag) => {
    const path = `${tag.category ?? ''} ${tag.subcategory ?? ''}`.toLowerCase()
    if (/character|subject|pose|anatomy|clothing/.test(path)) dimensions.add('subject')
    if (/environment|architecture|weather|time_period|setting/.test(path)) dimensions.add('setting')
    if (/lighting/.test(path)) dimensions.add('lighting')
    if (/composition|camera/.test(path)) dimensions.add('composition')
    if (/art_medium|style|mood|color|texture/.test(path)) dimensions.add('style')
  })
  const all = ['subject', 'setting', 'lighting', 'composition', 'style'] as const
  const missing = all.filter((item) => !dimensions.has(item)).slice(0, 3)
  return <div className="space-y-3"><p className="text-xs leading-5 text-[var(--ui-muted-text)]">A useful image prompt often covers a subject, setting, light, composition, and visual style. This is guidance, not a requirement.</p><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium">Prompt dimensions</span><span className="text-xs tabular-nums" aria-label={`${dimensions.size} of ${all.length} prompt dimensions covered`}>{dimensions.size} of {all.length}</span></div><div className="h-1.5 rounded-lg bg-[var(--ui-surface-soft)] overflow-hidden" aria-hidden="true"><span className="block h-full bg-[var(--ui-text)]" style={{ width: `${(dimensions.size / all.length) * 100}%` }} /></div>{missing.length > 0 ? <div><p className="mb-2 text-xs text-[var(--ui-muted-text)]">Optional next direction</p><div className="flex flex-wrap gap-2">{missing.map((item) => <button key={item} type="button" onClick={onBrowse} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs capitalize">Explore {item}</button>)}</div></div> : <p className="text-xs text-[var(--ui-muted-text)]">The five core dimensions are represented.</p>}</div>
}

function LibraryView({ taxonomy }: { taxonomy: TaxonomyCategory[] }) {
  const [tab, setTab] = useState<'prompts' | 'templates' | 'tags' | 'references'>('prompts')
  const [query, setQuery] = useState('')
  const [promptScope, setPromptScope] = useState<'all' | 'favorites'>('all')
  const [promptSort, setPromptSort] = useState<'recent' | 'name'>('recent')
  const savedPrompts = usePromptSmithStore((state) => state.savedPrompts)
  const importPrompt = usePromptSmithStore((state) => state.importPrompt)
  const setWorkspaceView = usePromptSmithStore((state) => state.setWorkspaceView)
  const importRef = useRef<HTMLInputElement>(null)

  const prompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return savedPrompts
      .filter((prompt) => promptScope === 'all' || prompt.isFavorite)
      .filter((prompt) => !normalizedQuery || `${prompt.name} ${prompt.customText} ${prompt.selections.map((tag) => tag.label).join(' ')}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => promptSort === 'name' ? a.name.localeCompare(b.name) : (b.lastOpenedAt ?? b.updatedAt) - (a.lastOpenedAt ?? a.updatedAt))
  }, [promptScope, promptSort, query, savedPrompts])

  const exportPrompt = (prompt: PromptTemplate) => {
    const blob = new Blob([exportTemplate(prompt)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${prompt.name.replace(/\s+/g, '-').toLowerCase()}.muse.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const imported = importTemplate(String(reader.result ?? ''))
      if (imported) importPrompt(imported)
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="max-w-2xl"><p className="text-xs text-[var(--ui-muted-text)]">Private library</p><h1 className="font-display text-4xl sm:text-5xl text-balance">The ideas worth returning to.</h1><p className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">Prompts, templates, tags, and references stay on this device unless you export them.</p></div>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1 p-1 rounded-lg border border-[var(--ui-border)] overflow-x-auto" role="tablist" aria-label="Library sections">
          {(['prompts', 'templates', 'tags', 'references'] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} aria-controls={`library-panel-${item}`} id={`library-tab-${item}`} onClick={() => setTab(item)} className={`min-h-11 px-4 rounded-lg text-sm capitalize ${tab === item ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]'}`}>{item}</button>)}
        </div>
        {tab === 'prompts' && <><label className="relative flex-1 max-w-md"><MagnifyingGlass className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-muted-text)]" /><span className="sr-only">Search saved prompts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved prompts…" className="w-full min-h-12 pl-11 pr-4 rounded-lg bg-[var(--ui-surface-soft)] border border-[var(--ui-border)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label><input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} /><button type="button" onClick={() => importRef.current?.click()} className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)] text-sm">Import prompt</button></>}
      </div>

      {tab === 'prompts' && <section id="library-panel-prompts" role="tabpanel" aria-labelledby="library-tab-prompts" className="space-y-4"><div className="flex flex-col gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-1" role="group" aria-label="Prompt filter"><button type="button" aria-pressed={promptScope === 'all'} onClick={() => setPromptScope('all')} className={`min-h-11 rounded-lg px-3 text-sm ${promptScope === 'all' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]'}`}>All prompts <span className="ml-1 text-xs opacity-70">{savedPrompts.length}</span></button><button type="button" aria-pressed={promptScope === 'favorites'} onClick={() => setPromptScope('favorites')} className={`min-h-11 rounded-lg px-3 text-sm ${promptScope === 'favorites' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]'}`}>Favorites <span className="ml-1 text-xs opacity-70">{savedPrompts.filter((prompt) => prompt.isFavorite).length}</span></button></div><div className="flex items-center justify-between gap-3 sm:justify-end"><p className="text-xs text-[var(--ui-muted-text)]" aria-live="polite">{prompts.length} shown</p><Menu.Root><Menu.Trigger className="min-h-11 rounded-lg border border-[var(--ui-border)] px-3 text-sm flex items-center gap-2" aria-label={`Sort prompts: ${promptSort === 'recent' ? 'Recently used' : 'Name'}`}>Sort: {promptSort === 'recent' ? 'Recent' : 'Name'}<CaretDown className="size-3.5 text-[var(--ui-muted-text)]" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end" sideOffset={6} className="z-40"><Menu.Popup className="w-48 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg"><Menu.Item onClick={() => setPromptSort('recent')} className="min-h-11 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">Recently used</Menu.Item><Menu.Item onClick={() => setPromptSort('name')} className="min-h-11 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">Name</Menu.Item></Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div></div>{prompts.length === 0 ? <section className="min-h-44 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-dashed border-[var(--ui-border)] px-6 py-7"><div className="flex items-center gap-4"><span className="size-11 rounded-full border border-[var(--ui-border)] flex items-center justify-center"><Heart className="size-5 text-[var(--ui-muted-text)]" /></span><div><h2 className="font-display text-2xl text-balance">{savedPrompts.length === 0 ? 'Keep the first idea worth returning to.' : 'No prompts match this view.'}</h2><p className="mt-1 text-sm text-pretty text-[var(--ui-muted-text)]">{savedPrompts.length === 0 ? 'Draft freely, then save it on this device.' : 'Clear the search or show all prompts to see the rest of your Library.'}</p></div></div>{savedPrompts.length === 0 ? <button type="button" onClick={() => setWorkspaceView('home')} className="min-h-11 shrink-0 px-4 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm">Start a prompt</button> : <button type="button" onClick={() => { setQuery(''); setPromptScope('all') }} className="min-h-11 shrink-0 px-4 rounded-lg border border-[var(--ui-border)] text-sm">Clear filters</button>}</section> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{prompts.map((prompt) => <LibraryPromptCard key={prompt.id} prompt={prompt} onExport={exportPrompt} />)}</div>}</section>}
      {tab === 'templates' && <section id="library-panel-templates" role="tabpanel" aria-labelledby="library-tab-templates"><TemplateGallery /></section>}
      {tab === 'tags' && <section id="library-panel-tags" role="tabpanel" aria-labelledby="library-tab-tags" className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4 sm:p-6"><div className="mb-5 max-w-2xl"><p className="text-xs text-[var(--ui-muted-text)]">Tag Library</p><h2 className="font-display text-3xl text-balance">Find one useful direction at a time.</h2><p className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">Start with an intent such as subject, setting, style, or mood. Search and the complete taxonomy remain available whenever you need precision.</p></div><SmartTagBrowser taxonomy={taxonomy} /></section>}
      {tab === 'references' && <section id="library-panel-references" role="tabpanel" aria-labelledby="library-tab-references"><ReferenceUploader layout="library" /></section>}
    </div>
  )
}

function LibraryPromptCard({ prompt, onExport }: { prompt: PromptTemplate; onExport: (prompt: PromptTemplate) => void }) {
  const loadPrompt = usePromptSmithStore((state) => state.loadPrompt)
  const deletePrompt = usePromptSmithStore((state) => state.deletePrompt)
  const duplicatePrompt = usePromptSmithStore((state) => state.duplicatePrompt)
  const toggleFavoritePrompt = usePromptSmithStore((state) => state.toggleFavoritePrompt)
  const renamePrompt = usePromptSmithStore((state) => state.renamePrompt)
  const updatePromptCover = usePromptSmithStore((state) => state.updatePromptCover)
  const versions = usePromptSmithStore((state) => state.promptVersions[prompt.id] ?? [])
  const restorePromptVersion = usePromptSmithStore((state) => state.restorePromptVersion)
  const deletePromptVersion = usePromptSmithStore((state) => state.deletePromptVersion)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(prompt.name)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [coverError, setCoverError] = useState('')
  const coverInput = useRef<HTMLInputElement>(null)
  const fallback = defaultCoverForPrompt(prompt)
  const coverSrc = prompt.coverImageDataUrl || fallback.src

  const copyVersion = async (version: PromptVersion) => {
    try { await navigator.clipboard.writeText(version.content); setStatus(`Version ${version.version} copied`) }
    catch { setStatus('Copy failed. Open the version and copy it manually.') }
  }

  const chooseCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setCoverError('')
    try {
      const image = await createPromptCover(file)
      updatePromptCover(prompt.id, image)
      setStatus('Cover updated')
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : 'The cover could not be created.')
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)]">
      <button type="button" onClick={() => setDetailsOpen(true)} className="block w-full aspect-[16/9] overflow-hidden text-left" aria-label={`View ${prompt.name} and its versions`}><img src={coverSrc} alt="" className="size-full scale-[1.04] object-cover" /></button>
      <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => toggleFavoritePrompt(prompt.id)} className="size-11 rounded-full flex items-center justify-center border border-[var(--ui-border)]" aria-label={prompt.isFavorite ? `Remove ${prompt.name} from favorites` : `Add ${prompt.name} to favorites`}><Heart weight={prompt.isFavorite ? 'fill' : 'regular'} className="size-4" /></button>
        <div className="min-w-0 flex-1">
          {renaming ? <form onSubmit={(event) => { event.preventDefault(); renamePrompt(prompt.id, renameValue); setRenaming(false) }} className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Prompt name</span><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} className="w-full min-h-11 rounded-lg bg-[var(--ui-surface-soft)] px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label><button type="submit" className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs">Save</button></form> : <><h2 className="font-display text-xl line-clamp-2 text-balance">{prompt.name}</h2><p className="mt-1 text-xs text-[var(--ui-muted-text)]">{getModelConfig(prompt.model).name} · {versions.length} version{versions.length === 1 ? '' : 's'} · {prompt.selections.length} ingredient{prompt.selections.length === 1 ? '' : 's'}</p></>}
        </div>
      </div>
      <p className="min-h-12 text-sm leading-6 text-pretty text-[var(--ui-muted-text)] line-clamp-2">{prompt.customText || prompt.selections.map((tag) => tag.label).join(', ')}</p>
      <div className="flex items-center gap-2"><button type="button" onClick={() => loadPrompt(prompt)} className="min-h-11 px-4 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm">Open in Craft</button><button type="button" onClick={() => setDetailsOpen(true)} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-sm">Versions</button><div className="flex-1" /><Menu.Root><Menu.Trigger className="size-11 rounded-full border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-muted-text)]" aria-label={`More actions for ${prompt.name}`}><DotsThree weight="bold" className="size-5" /></Menu.Trigger><Menu.Portal><Menu.Positioner align="end" side="top" sideOffset={8} className="z-40"><Menu.Popup className="w-44 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-1.5 shadow-lg"><Menu.Item onClick={() => duplicatePrompt(prompt.id)} className="min-h-11 px-3 rounded-lg text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">Duplicate</Menu.Item><Menu.Item onClick={() => setRenaming(true)} className="min-h-11 px-3 rounded-lg text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">Rename</Menu.Item><Menu.Item onClick={() => onExport(prompt)} className="min-h-11 px-3 rounded-lg text-sm outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]">Export</Menu.Item><Menu.Item onClick={() => setDeleteOpen(true)} className="min-h-11 px-3 rounded-lg flex items-center gap-2 text-sm text-[var(--destructive)] outline-none data-[highlighted]:bg-[var(--ui-surface-soft)]"><Trash className="size-4" />Delete</Menu.Item></Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div>
      </div>
      <ActionToast message={status} onDismiss={() => setStatus('')} />
      <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><Dialog.Popup className="fixed right-0 inset-y-0 z-50 w-[min(100%,620px)] overflow-y-auto border-l border-[var(--ui-border)] bg-[var(--ui-bg)] safe-bottom"><div className="aspect-[16/8] overflow-hidden"><img src={coverSrc} alt="" className="size-full scale-[1.04] object-cover" /></div><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><Dialog.Title className="font-display text-3xl text-balance">{prompt.name}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-pretty text-[var(--ui-muted-text)]">{versions.length} saved version{versions.length === 1 ? '' : 's'} · {getModelConfig(prompt.model).name}</Dialog.Description></div><Dialog.Close className="size-11 shrink-0 rounded-lg border border-[var(--ui-border)]" aria-label={`Close ${prompt.name}`}>×</Dialog.Close></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => loadPrompt(prompt)} className="min-h-11 px-4 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm">Use latest in Craft</button><input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(event) => void chooseCover(event)} /><button type="button" onClick={() => coverInput.current?.click()} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-sm flex items-center gap-2"><UploadSimple className="size-4" />{prompt.coverImageDataUrl ? 'Change cover' : 'Add cover'}</button>{prompt.coverImageDataUrl && <button type="button" onClick={() => updatePromptCover(prompt.id)} className="min-h-11 px-3 rounded-lg text-xs text-[var(--ui-muted-text)]">Use MUSE cover</button>}</div>{coverError && <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">{coverError}</p>}<div className="mt-7 space-y-3"><h3 className="font-display text-2xl">Versions</h3>{[...versions].reverse().map((version) => <LibraryVersionCard key={version.id} version={version} onCopy={() => void copyVersion(version)} onEdit={() => restorePromptVersion(prompt.id, version.id)} onDelete={() => deletePromptVersion(prompt.id, version.id)} />)}</div></div></Dialog.Popup></Dialog.Portal></Dialog.Root>
      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6"><AlertDialog.Title className="font-display text-2xl text-balance">Delete {prompt.name}?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">This removes the prompt and its local version history from this device.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Cancel</AlertDialog.Close><AlertDialog.Close onClick={() => deletePrompt(prompt.id)} className="min-h-11 px-4 rounded-lg border border-[var(--destructive)]">Delete</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>
    </article>
  )
}

function LibraryVersionCard({ version, onCopy, onEdit, onDelete }: { version: PromptVersion; onCopy: () => void; onEdit: () => void; onDelete: () => void }) {
  return <article className="rounded-xl border border-[var(--ui-border)] p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">Version {version.version}</strong><span className="text-xs tabular-nums text-[var(--ui-muted-text)]">{new Date(version.createdAt).toLocaleString()}</span></div><p className="mt-3 text-sm leading-6 text-pretty line-clamp-4">{version.content}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onEdit} className="min-h-11 px-3 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs">Edit in Craft</button><button type="button" onClick={onCopy} className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] text-xs flex items-center gap-2"><Copy className="size-4" />Copy</button><AlertDialog.Root><AlertDialog.Trigger className="size-11 rounded-full flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Delete version ${version.version}`}><Trash className="size-4" /></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[70] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6"><AlertDialog.Title className="font-display text-2xl text-balance">Delete version {version.version}?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">The prompt and its other versions remain in your Library.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Cancel</AlertDialog.Close><AlertDialog.Close onClick={onDelete} className="min-h-11 px-4 rounded-lg border border-[var(--destructive)] text-[var(--destructive)]">Delete version</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root></div></article>
}

function hashString(value: string) {
  return [...value].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 0)
}

function defaultCoverForPrompt(prompt: PromptTemplate) {
  const text = `${prompt.name} ${prompt.customText} ${prompt.selections.map((tag) => tag.label).join(' ')}`.toLowerCase()
  const preferredId = /portrait|person|woman|man|figure|face|gesture/.test(text) ? 'gesture-portrait'
    : /architecture|building|interior|city|courtyard|room/.test(text) ? 'brutalist-court'
      : /product|still life|bottle|vase|object/.test(text) ? 'quiet-still-life'
        : /waterfall|coast|ocean|cliff|storm|rain/.test(text) ? 'coastal-monochrome'
          : /watercolor|botanical|flower|ink/.test(text) ? 'watercolor-botanical'
            : /surreal|impossible|floating|dream/.test(text) ? 'floating-stone'
              : undefined
  return INSPIRATION_ASSETS.find((asset) => asset.id === preferredId)
    ?? INSPIRATION_ASSETS[hashString(prompt.id) % INSPIRATION_ASSETS.length]
}

async function createPromptCover(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a PNG, JPEG, WebP, or AVIF image.')
  if (file.size > 8 * 1024 * 1024) throw new Error('Cover images must be smaller than 8 MB.')
  const source = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file) })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const element = new Image(); element.onload = () => resolve(element); element.onerror = () => reject(new Error('The image could not be decoded.')); element.src = source })
  const canvas = document.createElement('canvas')
  canvas.width = 960
  canvas.height = 540
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image processing is unavailable in this browser.')
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
  return canvas.toDataURL('image/webp', 0.82)
}

function MobileNavigation({ activeView, onViewChange }: { activeView: WorkspaceView; onViewChange: (view: WorkspaceView) => void }) {
  return <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 min-h-16 border-t border-[var(--ui-border)] bg-[var(--ui-bg)] safe-bottom" aria-label="Main navigation"><MobileNavButton label="Home" icon={<House className="size-5" />} active={activeView === 'home'} onClick={() => onViewChange('home')} /><MobileNavButton label="Craft" icon={<Sparkle className="size-5" />} active={activeView === 'craft'} onClick={() => onViewChange('craft')} /><MobileNavButton label="Analyze" icon={<Aperture className="size-5" />} active={activeView === 'analyze'} onClick={() => onViewChange('analyze')} /><MobileNavButton label="Library" icon={<SquaresFour className="size-5" />} active={activeView === 'library'} onClick={() => onViewChange('library')} /></nav>
}

function MobileNavButton({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`min-h-16 flex flex-col items-center justify-center gap-1 text-[10px] ${active ? 'text-[var(--ui-text)]' : 'text-[var(--ui-muted-text)]'}`}>{icon}<span>{label}</span></button>
}
