import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './components/layout/Header'
import { PromptOutput } from './components/prompt/PromptOutput'
import { SmartTagBrowser } from './components/tags/SmartTagBrowser'
import { TemplateGallery } from './components/templates/TemplateGallery'
import { PromptDNA } from './components/dna/PromptDNA'
import { RandomizerPanel } from './components/randomizer/RandomizerPanel'
import { loadTaxonomy } from './utils/taxonomy-loader'
import {
  SquaresFour,
  Tag as TagIcon,
  BookOpen,
  MagnifyingGlass,
  Lightning,
  Shuffle,
} from '@phosphor-icons/react'

type ViewMode = 'templates' | 'tags' | 'randomize' | 'guide'

function App() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('templates')
  const [heroQuery, setHeroQuery] = useState('')

  useEffect(() => {
    loadTaxonomy().then(() => setLoading(false))
  }, [])

  const handleHeroSearch = (value: string) => {
    setHeroQuery(value)
    if (value.trim()) {
      setViewMode('tags')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center"
        >
          <div className="w-12 h-12 mx-auto mb-8 rounded-full border border-[#333] flex items-center justify-center">
            <Lightning weight="fill" className="w-5 h-5 text-[#f5f5f5]" />
          </div>
          <h1 className="font-display text-3xl font-normal text-[#f5f5f5] mb-2 tracking-tight">
            MUSE
          </h1>
          <p className="text-sm text-[#c2c2c2]">Loading your prompt studio...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black text-[#f5f5f5] overflow-hidden font-sans">

      {/* Header */}
      <Header />

      {/* Two-panel layout */}
      <main className="flex flex-1 overflow-hidden min-h-0">

        {/* Left — browsing content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-8 space-y-8 pb-12">

            {/* Hero Search */}
            <div className="relative">
              <MagnifyingGlass
                weight="regular"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c2c2]"
              />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => handleHeroSearch(e.target.value)}
                placeholder="Describe what you want to create..."
                className="w-full pl-12 pr-16 py-3 bg-transparent border border-[#333] rounded-full outline-none focus:border-[#555] transition-colors duration-150 text-sm text-[#f5f5f5] placeholder:text-[#c2c2c2]/40"
              />
              {heroQuery && (
                <button
                  onClick={() => { setHeroQuery(''); setViewMode('templates') }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c2c2c2] hover:text-[#f5f5f5] transition-colors text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border border-[#333] rounded-full p-1 w-fit">
              <ViewTab
                active={viewMode === 'templates'}
                onClick={() => setViewMode('templates')}
                icon={<SquaresFour weight={viewMode === 'templates' ? "fill" : "regular"} />}
                label="Templates"
              />
              <ViewTab
                active={viewMode === 'tags'}
                onClick={() => setViewMode('tags')}
                icon={<TagIcon weight={viewMode === 'tags' ? "fill" : "regular"} className="w-4 h-4" />}
                label="Browse Tags"
              />
              <ViewTab
                active={viewMode === 'randomize'}
                onClick={() => setViewMode('randomize')}
                icon={<Shuffle weight={viewMode === 'randomize' ? "fill" : "regular"} />}
                label="Randomize"
              />
              <ViewTab
                active={viewMode === 'guide'}
                onClick={() => setViewMode('guide')}
                icon={<BookOpen weight={viewMode === 'guide' ? "fill" : "regular"} />}
                label="Guide"
              />
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {viewMode === 'templates' && <TemplateGallery />}
                {viewMode === 'tags' && <SmartTagBrowser externalSearch={heroQuery} />}
                {viewMode === 'randomize' && <RandomizerPanel />}
                {viewMode === 'guide' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1"><PromptDNA /></div>
                    <div className="lg:col-span-2"><PromptGuide /></div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-[#1a1a1a] flex-shrink-0" />

        {/* Right — prompt panel */}
        <div className="w-[420px] flex-shrink-0 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
          <PromptOutput />
        </div>

      </main>
    </div>
  )
}

function ViewTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[#f5f5f5] text-black'
          : 'text-[#c2c2c2] hover:text-[#f5f5f5]'
      }`}
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
        <h2 className="font-display text-2xl font-normal text-[#f5f5f5] mb-2 tracking-tight">Prompting Guide</h2>
        <p className="text-sm text-[#c2c2c2]">Patterns that make great image generation prompts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideSection
          title="Start with the subject"
          description="The most important part is who or what is in the image. Be specific."
          steps={[
            'Name the subject clearly (a woman, a robot, a mountain lake)',
            'Add physical details that matter (elderly, towering, mist-covered)',
            'Place them in context (sitting in a café, floating in space)',
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
        <div className="border border-[#333] rounded-2xl p-6 flex flex-col justify-center items-center text-center hover:border-[#555] transition-colors duration-300">
          <p className="font-display text-lg text-[#f5f5f5] mb-3">Just start</p>
          <p className="text-sm text-[#c2c2c2] leading-relaxed">The best prompts come from experimenting. Pick a few tags, copy the prompt, and see what happens.</p>
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
    <div className="border border-[#333] rounded-2xl p-6 hover:border-[#555] transition-colors duration-300">
      <h3 className="font-display text-base font-normal text-[#f5f5f5] mb-1.5">{title}</h3>
      <p className="text-sm text-[#c2c2c2] mb-5 leading-relaxed">{description}</p>
      {steps && (
        <ul className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-xs text-[#c2c2c2]/50 font-mono mt-0.5 w-4 flex-shrink-0">{index + 1}.</span>
              <span className="text-sm text-[#f5f5f5]/80 leading-snug">{step}</span>
            </li>
          ))}
        </ul>
      )}
      {tips && (
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 py-2 border-t border-[#333] first:border-t-0">
              <span className="text-[10px] font-bold text-[#c2c2c2] uppercase tracking-wider mt-0.5 min-w-[90px]">
                {tip.model}
              </span>
              <span className="text-sm text-[#f5f5f5]/70 leading-snug">{tip.tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
