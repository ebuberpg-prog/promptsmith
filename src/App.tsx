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
import { PromptDNA } from './components/dna/PromptDNA'
import { EntityPresets } from './components/entities/EntityPresets'
import { RandomizerPanel } from './components/randomizer/RandomizerPanel'
import { VersionHistory } from './components/versions/VersionHistory'
import { PromptDiff } from './components/diff/PromptDiff'
import { ReferenceUploader } from './components/reference/ReferenceUploader'
import { loadTaxonomy } from './utils/taxonomy-loader'
import { usePromptSmithStore } from './store/prompt-store'
import { useBreakpoint } from './hooks/useBreakpoint'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import {
  SquaresFour,
  Tag as TagIcon,
  BookOpen,
  MagnifyingGlass,
  Lightning,
  Shuffle,
  X,
  ChatText,
} from '@phosphor-icons/react'

type ViewMode = 'templates' | 'tags' | 'randomize' | 'guide'
type MobileTab = 'templates' | 'build' | 'prompt'

function App() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('templates')
  const [mobileTab, setMobileTab] = useState<MobileTab>('templates')
  const [heroQuery, setHeroQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [taxonomy, setTaxonomy] = useState<import('./types').TaxonomyCategory[]>([])
  const theme = usePromptSmithStore((s) => s.theme)
  const toggleTheme = usePromptSmithStore((s) => s.toggleTheme)
  const wizardCompleted = usePromptSmithStore((s) => s.wizardCompleted)
  const setWizardCompleted = usePromptSmithStore((s) => s.setWizardCompleted)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)

  const { isMobile, isTabletSmall, isLessThanDesktop } = useBreakpoint()
  const isMobileView = isMobile || isTabletSmall

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
    else if (tab === 'prompt') setSidebarOpen(true)
  }

  const handleSearchOpen = () => {
    window.dispatchEvent(new CustomEvent('command-palette-open'))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ui-bg)' }}>
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
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ui-bg)', color: 'var(--ui-text)' }}>
      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onSearchOpen={handleSearchOpen}
      />

      {/* Mobile: bottom tab bar content */}
      {isMobileView ? (
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 sm:px-6 py-4 pb-20 space-y-6">
            {mobileTab === 'templates' && (
              <>
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
                <PromptOutput />
                <TagSuggestions />
                <PromptDNA />
                <EntityPresets />
                <ReferenceUploader />
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Desktop: two-panel layout */
        <main className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
            <div className="px-6 lg:px-8 py-6 space-y-6 pb-12">
              <div className="hidden lg:block relative">
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
                  className="w-full pl-12 pr-16 py-3 bg-transparent border border-[var(--ui-border)] rounded-full outline-none focus:border-[var(--ui-border-hover)] transition-colors duration-150 text-sm placeholder:text-[var(--ui-muted-text-faint)]"
                  style={{ color: 'var(--ui-text)' }}
                />
                {heroQuery && (
                  <button
                    onClick={() => { setHeroQuery(''); setViewMode('templates') }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-xs"
                    style={{ color: 'var(--ui-muted-text)' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 border border-[var(--ui-border)] rounded-full p-1 w-fit overflow-x-auto scrollbar-hide">
                <ViewTab
                  active={viewMode === 'templates'}
                  onClick={() => setViewMode('templates')}
                  icon={<SquaresFour weight={viewMode === 'templates' ? 'fill' : 'regular'} />}
                  label="Templates"
                />
                <ViewTab
                  active={viewMode === 'tags'}
                  onClick={() => setViewMode('tags')}
                  icon={<TagIcon weight={viewMode === 'tags' ? 'fill' : 'regular'} className="w-4 h-4" />}
                  label="Browse Tags"
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
                  {viewMode === 'templates' && <TemplateGallery />}
                  {viewMode === 'tags' && <SmartTagBrowser externalSearch={heroQuery} taxonomy={taxonomy} />}
                  {viewMode === 'randomize' && <RandomizerPanel />}
                  {viewMode === 'guide' && <PromptGuide />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden lg:block w-px flex-shrink-0" style={{ backgroundColor: 'var(--ui-border-faint)' }} />

          <div className="hidden lg:flex w-[520px] flex-shrink-0 flex-col min-h-0 overflow-y-auto">
            <PromptOutput />
            <div className="px-4 pb-8 space-y-4">
              <TagSuggestions />
              <PromptDNA />
              <EntityPresets />
              <ReferenceUploader />
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

function ViewTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 min-h-[44px] ${
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
