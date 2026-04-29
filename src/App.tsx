import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './components/layout/Header'
import { BottomTabBar } from './components/layout/BottomTabBar'
import { CommandPalette } from './components/command/CommandPalette'
import { QuickStartWizard } from './components/onboarding/QuickStartWizard'
import { PromptOutput } from './components/prompt/PromptOutput'
import { TagSuggestions } from './components/prompt/TagSuggestions'
import { SmartTagBrowser } from './components/tags/SmartTagBrowser'
import { TemplateGallery } from './components/templates/TemplateGallery'

import { EntityPresets } from './components/entities/EntityPresets'
import { RandomizerPanel } from './components/randomizer/RandomizerPanel'
import { ReferenceUploader } from './components/reference/ReferenceUploader'
import { loadTaxonomy } from './utils/taxonomy-loader'
import { usePromptSmithStore } from './store/prompt-store'
import { useBreakpoint } from './hooks/useBreakpoint'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { getModelConfig } from './data/model-configs'
import {
  SquaresFour,
  Tag as TagIcon,
  BookOpen,
  MagnifyingGlass,
  Lightning,
  Shuffle,
} from '@phosphor-icons/react'

type ViewMode = 'templates' | 'tags' | 'randomize' | 'guide'
type MobileTab = 'templates' | 'build' | 'prompt'

function App() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('templates')
  const [mobileTab, setMobileTab] = useState<MobileTab>('templates')
  const [heroQuery, setHeroQuery] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [taxonomy, setTaxonomy] = useState<import('./types').TaxonomyCategory[]>([])
  const theme = usePromptSmithStore((s) => s.theme)
  const toggleTheme = usePromptSmithStore((s) => s.toggleTheme)
  const wizardCompleted = usePromptSmithStore((s) => s.wizardCompleted)
  const setWizardCompleted = usePromptSmithStore((s) => s.setWizardCompleted)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const customText = usePromptSmithStore((s) => s.customText)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const savedEntities = usePromptSmithStore((s) => s.savedEntities)
  const referenceImages = usePromptSmithStore((s) => s.referenceImages)
  const generateNegativePrompt = usePromptSmithStore((s) => s.generateNegativePrompt)
  const customNegativePrompt = usePromptSmithStore((s) => s.customNegativePrompt)

  const { isMobile, isTabletSmall, isTablet } = useBreakpoint()
  const isMobileView = isMobile || isTabletSmall || isTablet
  const currentModel = getModelConfig(selectedModel)
  const negativePrompt = generateNegativePrompt()
  const hasNegativePrompt = negativePrompt.length > 0

  useKeyboardShortcuts()

  useEffect(() => {
    loadTaxonomy().then((data) => {
      setTaxonomy(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('promptsmith-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!loading && !wizardCompleted && selectedTags.length === 0) {
      setShowWizard(true)
    }
  }, [loading, wizardCompleted, selectedTags.length])

  const handleWizardSkip = useCallback(() => {
    setWizardCompleted(true)
    setShowWizard(false)
  }, [setWizardCompleted])

  const handleWizardClose = useCallback(() => {
    setShowWizard(false)
  }, [])

  const handleHeroSearch = (value: string) => {
    setHeroQuery(value)
    if (value.trim()) {
      setViewMode('tags')
    }
  }

  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileTab(tab)
    if (tab === 'templates') setViewMode('templates')
    else if (tab === 'build') setViewMode('tags')
  }

  const handleSearchOpen = () => {
    window.dispatchEvent(new CustomEvent('command-palette-open'))
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: 'var(--ui-bg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="w-12 h-12 mx-auto mb-8 rounded-full border border-[var(--ui-border)] flex items-center justify-center">
            <Lightning weight="fill" className="w-5 h-5" style={{ color: 'var(--ui-text)' }} />
          </div>
          <h1 className="font-display text-3xl font-normal mb-2 tracking-tight" style={{ color: 'var(--ui-text)' }}>
            MUSE
          </h1>
          <p className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>Loading your prompt studio...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ui-bg)', color: 'var(--ui-text)' }}>
      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onSearchOpen={handleSearchOpen}
      />

      {/* Mobile: bottom tab bar content */}
      {isMobileView ? (
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 sm:px-5 py-4 pb-20 space-y-5">
            {mobileTab === 'templates' && (
              <>
                <CompactStudioSummary
                  title={VIEW_CONTENT.templates.title}
                  description={VIEW_CONTENT.templates.description}
                  modelLabel={currentModel.name}
                  selectedTagCount={selectedTags.length}
                  hasPromptDraft={selectedTags.length > 0 || customText.trim().length > 0}
                />

                <div className="relative">
                  <MagnifyingGlass
                    weight="regular"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--ui-muted-text)' }}
                  />
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => handleHeroSearch(e.target.value)}
                    placeholder="Describe what you want to create..."
                    className="w-full pl-11 pr-12 py-3 bg-transparent border border-[var(--ui-border)] rounded-full outline-none focus:border-[var(--ui-border-hover)] transition-colors duration-150 text-sm placeholder:text-[var(--ui-muted-text-faint)]"
                    style={{ color: 'var(--ui-text)' }}
                  />
                  {heroQuery && (
                    <button
                      onClick={() => { setHeroQuery(''); setViewMode('templates') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-xs"
                      style={{ color: 'var(--ui-muted-text)' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <TemplateGallery />
              </>
            )}

            {mobileTab === 'build' && (
              <>
                <CompactStudioSummary
                  title={VIEW_CONTENT[viewMode].title}
                  description={VIEW_CONTENT[viewMode].description}
                  modelLabel={currentModel.name}
                  selectedTagCount={selectedTags.length}
                  hasPromptDraft={selectedTags.length > 0 || customText.trim().length > 0}
                />

                <div className="relative">
                  <MagnifyingGlass
                    weight="regular"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--ui-muted-text)' }}
                  />
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => handleHeroSearch(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full pl-11 pr-12 py-3 bg-transparent border border-[var(--ui-border)] rounded-full outline-none focus:border-[var(--ui-border-hover)] transition-colors duration-150 text-sm placeholder:text-[var(--ui-muted-text-faint)]"
                    style={{ color: 'var(--ui-text)' }}
                  />
                  {heroQuery && (
                    <button
                      onClick={() => { setHeroQuery(''); setViewMode('tags') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-xs"
                      style={{ color: 'var(--ui-muted-text)' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 border border-[var(--ui-border)] rounded-full p-1 w-fit overflow-x-auto scrollbar-hide">
                  <ViewTab
                    active={viewMode === 'tags'}
                    onClick={() => setViewMode('tags')}
                    icon={<TagIcon weight={viewMode === 'tags' ? 'fill' : 'regular'} className="w-4 h-4" />}
                    label="Tags"
                  />
                  <ViewTab
                    active={viewMode === 'randomize'}
                    onClick={() => setViewMode('randomize')}
                    icon={<Shuffle weight={viewMode === 'randomize' ? 'fill' : 'regular'} />}
                    label="Randomize"
                  />
                  <ViewTab
                    active={viewMode === 'guide'}
                    onClick={() => setViewMode('guide')}
                    icon={<BookOpen weight={viewMode === 'guide' ? 'fill' : 'regular'} />}
                    label="Guide"
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {viewMode === 'tags' && <SmartTagBrowser externalSearch={heroQuery} taxonomy={taxonomy} />}
                    {viewMode === 'randomize' && <RandomizerPanel />}
                    {viewMode === 'guide' && <PromptGuide />}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {mobileTab === 'prompt' && (
              <div className="space-y-4">
                <InspectorOverview
                  selectedTagCount={selectedTags.length}
                  hasPromptDraft={selectedTags.length > 0 || customText.trim().length > 0}
                  modelLabel={currentModel.name}
                />
                <PromptOutput />
                {hasNegativePrompt && (
                  <CollapsiblePanel
                    title="Negative prompt"
                    subtitle={customNegativePrompt ? 'Custom negative prompt' : 'Auto-generated for your model'}
                    defaultOpen={false}
                  >
                    <div className="space-y-2">
                      <p className="text-xs font-mono leading-relaxed border rounded-lg px-3 py-2" style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border-faint)' }}>
                        {negativePrompt}
                      </p>
                      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ui-muted-text-faint)' }}>
                        {customNegativePrompt
                          ? 'You set a custom negative prompt.'
                          : 'This negative prompt is generated based on your selected tags and target model.'}
                      </p>
                    </div>
                  </CollapsiblePanel>
                )}
                {selectedTags.length > 0 && (
                  <CollapsiblePanel
                    title="Tag suggestions"
                    subtitle="Related tags and AI-powered additions"
                    defaultOpen={false}
                  >
                    <TagSuggestions />
                  </CollapsiblePanel>
                )}
                {selectedTags.length === 0 && <EmptyInspectorState />}
                <CollapsiblePanel
                  title="Saved building blocks"
                  subtitle={savedEntities.length > 0 ? `${savedEntities.length} reusable entities` : 'Reusable styles, scenes, and characters'}
                  defaultOpen={false}
                >
                  <EntityPresets />
                </CollapsiblePanel>
                <CollapsiblePanel
                  title="Reference images"
                  subtitle={referenceImages.length > 0 ? `${referenceImages.length} attached` : 'Optional visual context'}
                  defaultOpen={false}
                >
                  <ReferenceUploader />
                </CollapsiblePanel>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Desktop: two-panel layout */
        <main className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
            <div className="px-5 lg:px-6 py-5 space-y-5 pb-10">
              <WorkspaceHero
                heroQuery={heroQuery}
                onHeroSearch={handleHeroSearch}
                onHeroClear={() => { setHeroQuery(''); setViewMode('templates') }}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedTagCount={selectedTags.length}
                hasPromptDraft={selectedTags.length > 0 || customText.trim().length > 0}
                modelLabel={`${currentModel.name} ${currentModel.version}`}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {viewMode === 'templates' && <TemplateGallery />}
                  {viewMode === 'tags' && <SmartTagBrowser externalSearch={heroQuery} taxonomy={taxonomy} />}
                  {viewMode === 'randomize' && <RandomizerPanel />}
                  {viewMode === 'guide' && <PromptGuide />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden lg:block w-px flex-shrink-0" style={{ backgroundColor: 'var(--ui-border-faint)' }} />

          <div className="hidden lg:flex w-[390px] xl:w-[420px] flex-shrink-0 flex-col min-h-0 overflow-y-auto">
            <div className="px-3.5 py-5 pb-6 space-y-3.5">
              <InspectorOverview
                selectedTagCount={selectedTags.length}
                hasPromptDraft={selectedTags.length > 0 || customText.trim().length > 0}
                modelLabel={currentModel.name}
              />
              <PromptOutput />
              {hasNegativePrompt && (
                <CollapsiblePanel
                  title="Negative prompt"
                  subtitle={customNegativePrompt ? 'Custom negative prompt' : 'Auto-generated for your model'}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <p className="text-xs font-mono leading-relaxed border rounded-lg px-3 py-2" style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border-faint)' }}>
                      {negativePrompt}
                    </p>
                    <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ui-muted-text-faint)' }}>
                      {customNegativePrompt
                        ? 'You set a custom negative prompt.'
                        : 'This negative prompt is generated based on your selected tags and target model.'}
                    </p>
                  </div>
                </CollapsiblePanel>
              )}
              {selectedTags.length > 0 && (
                <CollapsiblePanel
                  title="Tag suggestions"
                  subtitle="Related tags and AI-powered additions"
                  defaultOpen={false}
                >
                  <TagSuggestions />
                </CollapsiblePanel>
              )}
              {selectedTags.length === 0 && <EmptyInspectorState />}
              <CollapsiblePanel
                title="Saved building blocks"
                subtitle={savedEntities.length > 0 ? `${savedEntities.length} reusable entities` : 'Reusable styles, scenes, and characters'}
                defaultOpen={false}
              >
                <EntityPresets />
              </CollapsiblePanel>
              <CollapsiblePanel
                title="Reference images"
                subtitle={referenceImages.length > 0 ? `${referenceImages.length} attached` : 'Optional visual context'}
                defaultOpen={false}
              >
                <ReferenceUploader />
              </CollapsiblePanel>
            </div>
          </div>
        </main>
      )}

      {/* Bottom tab bar (mobile) */}
      <BottomTabBar
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        tagCount={selectedTags.length}
        onSearch={handleSearchOpen}
      />

      {/* Command palette */}
      <CommandPalette />

      {/* Quick start wizard */}
      <QuickStartWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
        onSkip={handleWizardSkip}
      />
    </div>
  )
}

function CompactStudioSummary({
  title,
  description,
  modelLabel,
  selectedTagCount,
  hasPromptDraft,
}: {
  title: string
  description: string
  modelLabel: string
  selectedTagCount: number
  hasPromptDraft: boolean
}) {
  return (
    <section className="border rounded-[20px] p-4 space-y-3" style={{ borderColor: 'var(--ui-border)' }}>
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--ui-muted-text-faint)' }}>
          Prompt Studio
        </p>
        <h1 className="font-display text-[2rem] font-normal tracking-tight text-balance leading-[0.96]" style={{ color: 'var(--ui-text)' }}>
          {title}
        </h1>
        <p className="text-[13px] leading-6 text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill label="Model" value={modelLabel} />
        <StatusPill label="Selected" value={`${selectedTagCount} tag${selectedTagCount === 1 ? '' : 's'}`} />
        <StatusPill label="Session" value={hasPromptDraft ? 'Prompt in progress' : 'Fresh workspace'} />
      </div>
    </section>
  )
}

const VIEW_CONTENT: Record<ViewMode, { title: string; description: string; hint: string }> = {
  templates: {
    title: 'Start from a strong base',
    description: 'Use blueprints and saved setups to get moving without exposing every prompt control up front.',
    hint: 'Browse a template when you want direction, or search when you already know the visual language you want.',
  },
  tags: {
    title: 'Add only what the scene still needs',
    description: 'Explore the taxonomy in small steps so the prompt grows deliberately instead of all at once.',
    hint: 'A good prompt usually starts with subject, setting, light, and one strong style decision.',
  },
  randomize: {
    title: 'Let MUSE propose a cohesive direction',
    description: 'Use the randomizer when you want a complete starting point without manually assembling every detail.',
    hint: 'Smart mode keeps the result coherent. Wild mode is better for breaking out of familiar patterns.',
  },
  guide: {
    title: 'Learn the structure, then improvise',
    description: 'Treat the guide as scaffolding for better prompts, not another dashboard to manage.',
    hint: 'Once you know the core building blocks, jump back into tags or templates and keep the interface lightweight.',
  },
}

function WorkspaceHero({
  heroQuery,
  onHeroSearch,
  onHeroClear,
  viewMode,
  onViewModeChange,
  selectedTagCount,
  hasPromptDraft,
  modelLabel,
}: {
  heroQuery: string
  onHeroSearch: (value: string) => void
  onHeroClear: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectedTagCount: number
  hasPromptDraft: boolean
  modelLabel: string
}) {
  const content = VIEW_CONTENT[viewMode]

  return (
    <section
      className="border rounded-[24px] p-5 lg:p-6 space-y-5"
      style={{
        borderColor: 'var(--ui-border)',
        backgroundColor: 'color-mix(in oklab, var(--ui-surface) 55%, var(--ui-bg))',
      }}
    >
      <div className="flex flex-col xl:flex-row xl:items-end gap-5 xl:gap-6">
        <div className="flex-1 space-y-4">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--ui-muted-text-faint)' }}>
              Prompt Studio
            </p>
            <div className="space-y-2">
              <h1 className="font-display text-[2.45rem] lg:text-[3.05rem] font-normal tracking-tight text-balance leading-[0.94]" style={{ color: 'var(--ui-text)' }}>
                {content.title}
              </h1>
              <p className="text-[13px] lg:text-sm leading-6 max-w-xl text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
                {content.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill label="Model" value={modelLabel} />
            <StatusPill label="Selected" value={`${selectedTagCount} tag${selectedTagCount === 1 ? '' : 's'}`} />
            <StatusPill label="Session" value={hasPromptDraft ? 'Prompt in progress' : 'Fresh workspace'} />
          </div>

          <div className="flex items-center gap-1 border border-[var(--ui-border)] rounded-full p-1 w-fit overflow-x-auto scrollbar-hide">
            <ViewTab
              active={viewMode === 'templates'}
              onClick={() => onViewModeChange('templates')}
              icon={<SquaresFour weight={viewMode === 'templates' ? 'fill' : 'regular'} />}
              label="Templates"
            />
            <ViewTab
              active={viewMode === 'tags'}
              onClick={() => onViewModeChange('tags')}
              icon={<TagIcon weight={viewMode === 'tags' ? 'fill' : 'regular'} className="w-4 h-4" />}
              label="Browse Tags"
            />
            <ViewTab
              active={viewMode === 'randomize'}
              onClick={() => onViewModeChange('randomize')}
              icon={<Shuffle weight={viewMode === 'randomize' ? 'fill' : 'regular'} />}
              label="Randomize"
            />
            <ViewTab
              active={viewMode === 'guide'}
              onClick={() => onViewModeChange('guide')}
              icon={<BookOpen weight={viewMode === 'guide' ? 'fill' : 'regular'} />}
              label="Guide"
            />
          </div>
        </div>

        <div className="xl:w-[320px] space-y-2.5">
          <div className="relative">
            <MagnifyingGlass
              weight="regular"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--ui-muted-text)' }}
            />
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => onHeroSearch(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full pl-11 pr-14 py-2.5 bg-transparent border border-[var(--ui-border)] rounded-full outline-none focus:border-[var(--ui-border-hover)] transition-colors duration-150 text-sm placeholder:text-[var(--ui-muted-text-faint)]"
              style={{ color: 'var(--ui-text)' }}
            />
            {heroQuery && (
              <button
                onClick={onHeroClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-xs"
                style={{ color: 'var(--ui-muted-text)' }}
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[12px] leading-6 text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
            {content.hint}
          </p>
        </div>
      </div>
    </section>
  )
}

function InspectorOverview({
  selectedTagCount,
  hasPromptDraft,
  modelLabel,
}: {
  selectedTagCount: number
  hasPromptDraft: boolean
  modelLabel: string
}) {
  return (
    <section className="border rounded-[20px] px-4 py-3.5 space-y-3" style={{ borderColor: 'var(--ui-border)' }}>
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--ui-muted-text-faint)' }}>
          Inspector
        </p>
        <h2 className="font-display text-[1.45rem] font-normal tracking-tight text-balance leading-tight" style={{ color: 'var(--ui-text)' }}>
          Build calmly, review clearly
        </h2>
        <p className="text-[12px] leading-5 text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
          Keep the live prompt in focus, then open supporting analysis only when you need it.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill label="Model" value={modelLabel} />
        <StatusPill label="Selected" value={`${selectedTagCount} tag${selectedTagCount === 1 ? '' : 's'}`} />
        <StatusPill label="State" value={hasPromptDraft ? 'Active draft' : 'Waiting for input'} />
      </div>
    </section>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
      style={{
        color: 'var(--ui-muted-text)',
        backgroundColor: 'color-mix(in oklab, var(--ui-text) 4%, transparent)',
        border: '1px solid var(--ui-border-faint)',
      }}
    >
      <span style={{ color: 'var(--ui-muted-text-faint)' }}>{label}</span>
      <span style={{ color: 'var(--ui-text)' }}>{value}</span>
    </span>
  )
}

function CollapsiblePanel({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="space-y-3">
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="w-full flex items-center justify-between border rounded-2xl px-4 py-3 text-left transition-colors duration-150"
        
        style={{ borderColor: 'var(--ui-border)' }}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>
            {title}
          </h3>
          <p className="text-xs leading-6 text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
            {subtitle}
          </p>
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--ui-muted-text)' }}>
          {isOpen ? 'Hide' : 'Open'}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function EmptyInspectorState() {
  return (
    <section className="border rounded-[20px] px-4 py-3.5 space-y-3" style={{ borderColor: 'var(--ui-border)' }}>
      <div className="space-y-1">
        <h3 className="text-[13px] font-medium text-balance" style={{ color: 'var(--ui-text)' }}>
          Start with four decisions
        </h3>
        <p className="text-[12px] leading-5 text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
          You do not need to fill every slot at once. A clear subject, setting, light, and style is usually enough to begin.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['Subject', 'Setting', 'Lighting', 'Style'].map((item) => (
          <div
            key={item}
            className="rounded-2xl px-3 py-3 text-xs"
            style={{
              border: '1px solid var(--ui-border-faint)',
              backgroundColor: 'color-mix(in oklab, var(--ui-text) 3%, transparent)',
              color: 'var(--ui-muted-text)',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

function ViewTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 min-h-[40px] ${
        active
          ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]'
          : 'hover:text-[var(--ui-text)]'
      }`}
      style={{ color: active ? undefined : 'var(--ui-muted-text)' }}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function PromptGuide() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-normal mb-2 tracking-tight" style={{ color: 'var(--ui-text)' }}>Prompting Guide</h2>
        <p className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>Patterns that make great image generation prompts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideSection
          title="Start with the subject"
          description="The most important part is who or what is in the image. Be specific."
          steps={[
            'Name the subject clearly (a woman, a robot, a mountain lake)',
            'Add physical details that matter (elderly, towering, mist-covered)',
            'Place them in context (sitting in a cafe, floating in space)',
          ]}
        />
        <GuideSection
          title="Layer style and mood"
          description="Style tags shape the feel of the image more than almost anything else."
          steps={[
            'Pick a lighting style (golden hour, neon, overcast)',
            'Choose an art style (photorealistic, oil painting, anime)',
            'Add a mood word (melancholic, vibrant, serene)',
          ]}
        />
        <GuideSection
          title="Model tips"
          description="Each model responds a little differently to prompts."
          tips={[
            { model: 'Midjourney', tip: 'Loves evocative, poetic language. Less is often more.' },
            { model: 'Stable Diffusion', tip: 'Responds well to precise tags and negative prompts.' },
            { model: 'DALL-E 3', tip: 'Use full sentences and describe the scene like a story.' },
          ]}
        />
        <div
          className="border border-[var(--ui-border)] rounded-2xl p-6 flex flex-col justify-center items-center text-center transition-colors duration-300"
          style={{ borderColor: 'var(--ui-border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
        >
          <p className="font-display text-lg mb-3" style={{ color: 'var(--ui-text)' }}>Just start</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ui-muted-text)' }}>The best prompts come from experimenting. Pick a few tags, copy the prompt, and see what happens.</p>
        </div>
      </div>
    </div>
  )
}

function GuideSection({
  title,
  description,
  steps,
  tips,
}: {
  title: string
  description: string
  steps?: string[]
  tips?: { model: string; tip: string }[]
}) {
  return (
    <div
      className="border border-[var(--ui-border)] rounded-2xl p-6 transition-colors duration-300"
      style={{ borderColor: 'var(--ui-border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
    >
      <h3 className="font-display text-base font-normal mb-1.5" style={{ color: 'var(--ui-text)' }}>{title}</h3>
      <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--ui-muted-text)' }}>{description}</p>
      {steps && (
        <ul className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-xs font-mono mt-0.5 w-4 flex-shrink-0" style={{ color: 'var(--ui-muted-text-faint)' }}>{index + 1}.</span>
              <span className="text-sm leading-snug" style={{ color: 'var(--ui-text)', opacity: 0.8 }}>{step}</span>
            </li>
          ))}
        </ul>
      )}
      {tips && (
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 py-2 border-t border-[var(--ui-border-faint)] first:border-t-0">
              <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 min-w-[90px]" style={{ color: 'var(--ui-muted-text-faint)' }}>
                {tip.model}
              </span>
              <span className="text-sm leading-snug" style={{ color: 'var(--ui-text)', opacity: 0.7 }}>{tip.tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
