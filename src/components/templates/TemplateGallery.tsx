import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, DIFFICULTY_LABELS, type GalleryTemplate } from '@/types/templates'
import { applyGalleryTemplate, exportTemplate, importTemplate } from '@/utils/template-engine'
import { TemplateWizard } from './TemplateWizard'
import {
  MagnifyingGlass,
  ArrowRight,
  CheckCircle,
  Funnel,
  SelectionAll,
  Sparkle,
  User,
  Upload,
  Download,
  Trash,
} from '@phosphor-icons/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PromptTemplate } from '@/types'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type GalleryTab = 'built-in' | 'my-templates'

export function TemplateGallery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<GalleryTab>('built-in')
  const [wizardOpen, setWizardOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const setModelParameters = usePromptSmithStore((s) => s.setModelParameters)
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const savedPrompts = usePromptSmithStore((s) => s.savedPrompts)
  const deletePrompt = usePromptSmithStore((s) => s.deletePrompt)
  const savePrompt = usePromptSmithStore((s) => s.savePrompt)
  const loadPrompt = usePromptSmithStore((s) => s.loadPrompt)

  const filteredBuiltIn = useMemo(() => {
    return PROMPT_TEMPLATES.filter((template) => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const filteredUserTemplates = useMemo(() => {
    if (!searchQuery) return savedPrompts
    return savedPrompts.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [savedPrompts, searchQuery])

  const handleUseBuiltIn = async (template: GalleryTemplate) => {
    clearAllTags()
    const { tags, customText, modelParams } = await applyGalleryTemplate(template, selectedModel, showExplicit)
    for (const tag of tags) toggleTag(tag)
    setCustomText(customText)
    if (modelParams) setModelParameters(modelParams)
    setSelectedTemplate(template.id)
  }

  const handleUseUserTemplate = (template: PromptTemplate) => {
    loadPrompt(template)
    setSelectedTemplate(template.id)
  }

  const handleExportTemplate = (template: PromptTemplate) => {
    const json = exportTemplate(template)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.muse.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => importRef.current?.click()

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const json = ev.target?.result as string
      const template = importTemplate(json)
      if (template) {
        // Save as user template via store
        clearAllTags()
        loadPrompt(template)
        savePrompt(template.name)
        setActiveTab('my-templates')
      } else {
        alert('Invalid template file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-normal text-[#f5f5f5] tracking-tight">Blueprint Library</h2>
          <p className="text-sm text-[#c2c2c2] max-w-md">Standardized starting points for rapid visual development.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import */}
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-sm text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all duration-150"
          >
            <Upload weight="regular" className="w-3.5 h-3.5" />
            Import
          </button>

          {/* Wizard */}
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f5f5] text-black text-sm font-medium hover:bg-[#e0e0e0] transition-colors duration-150"
          >
            <Sparkle weight="regular" className="w-3.5 h-3.5" />
            Wizard
          </button>
        </div>
      </div>

      {/* Tabs + search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border border-[#333] rounded-full p-1 w-fit">
          <TabButton active={activeTab === 'built-in'} onClick={() => setActiveTab('built-in')} icon={<SelectionAll weight="regular" className="w-3.5 h-3.5" />} label="Templates" />
          <TabButton
            active={activeTab === 'my-templates'}
            onClick={() => setActiveTab('my-templates')}
            icon={<User weight="regular" className="w-3.5 h-3.5" />}
            label={savedPrompts.length > 0 ? `My Templates (${savedPrompts.length})` : 'My Templates'}
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c2c2c2]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-[#333] rounded-full outline-none focus:border-[#555] transition-colors text-sm text-[#f5f5f5] placeholder:text-[#c2c2c2]/30"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'built-in' ? (
          <motion.div key="built-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150",
                    selectedCategory === category.id
                      ? "bg-[#f5f5f5] text-black"
                      : "border border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
                  )}
                >
                  <span className="text-base">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuiltIn.map((template) => (
                  <BuiltInCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onSelect={() => handleUseBuiltIn(template)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredBuiltIn.length === 0 && (
              <EmptyState onReset={() => { setSearchQuery(''); setSelectedCategory('all') }} />
            )}
          </motion.div>
        ) : (
          <motion.div key="my-templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {filteredUserTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#1a1a1a] rounded-2xl">
                <p className="text-sm text-[#c2c2c2]/30 mb-4">No saved templates yet</p>
                <button
                  onClick={() => setWizardOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-sm text-[#c2c2c2] hover:border-[#555] transition-all"
                >
                  <Sparkle weight="regular" className="w-3.5 h-3.5" />
                  Create with Wizard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredUserTemplates.map(template => (
                  <UserTemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onUse={() => handleUseUserTemplate(template)}
                    onExport={() => handleExportTemplate(template)}
                    onDelete={() => deletePrompt(template.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TemplateWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
        active ? "bg-[#f5f5f5] text-black" : "text-[#c2c2c2] hover:text-[#f5f5f5]"
      )}
    >
      <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function BuiltInCard({
  template, isSelected, onSelect,
}: {
  template: GalleryTemplate
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "group relative rounded-2xl border p-6 transition-all duration-300 cursor-pointer",
        isSelected
          ? 'border-[#f5f5f5]/40 bg-white/[0.03]'
          : 'border-[#333] hover:border-[#555]'
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center text-2xl group-hover:border-[#555] transition-colors duration-300">
              {template.icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-normal text-[#f5f5f5] tracking-tight">
                {template.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                  template.difficulty === 'beginner' ? "bg-[#f5f5f5]/10 text-[#c2c2c2]" :
                  template.difficulty === 'intermediate' ? "bg-[#c2c2c2]/10 text-[#c2c2c2]" :
                  "bg-red-500/10 text-red-400"
                )}>
                  {DIFFICULTY_LABELS[template.difficulty]}
                </span>
                <span className="text-[10px] font-mono text-[#c2c2c2]/50">
                  {template.model}
                </span>
              </div>
            </div>
          </div>
          {isSelected && (
            <motion.div
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center"
            >
              <CheckCircle weight="fill" className="text-black w-3.5 h-3.5" />
            </motion.div>
          )}
        </div>

        <p className="text-sm text-[#c2c2c2] leading-relaxed line-clamp-2">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-medium border border-[#333] text-[#c2c2c2]">
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="px-3 py-1 rounded-full text-[10px] font-medium border border-[#333] text-[#c2c2c2]/50">
              +{template.tags.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#333]">
          <div className="flex items-center gap-2">
            <SelectionAll weight="regular" className={cn("w-3.5 h-3.5", isSelected ? "text-[#f5f5f5]" : "text-[#c2c2c2]/40")} />
            <span className="text-[10px] text-[#c2c2c2] uppercase tracking-wider">
              {template.tags.length} tags
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-all",
            isSelected ? "text-[#f5f5f5]" : "text-[#c2c2c2] group-hover:text-[#f5f5f5]"
          )}>
            <span>{isSelected ? 'Applied' : 'Apply'}</span>
            <ArrowRight weight="regular" className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function UserTemplateCard({
  template, isSelected, onUse, onExport, onDelete,
}: {
  template: PromptTemplate
  isSelected: boolean
  onUse: () => void
  onExport: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className={cn(
      "border rounded-2xl p-5 space-y-3 transition-all duration-300",
      isSelected ? "border-[#f5f5f5]/30 bg-white/[0.03]" : "border-[#333] hover:border-[#555]"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[#f5f5f5]">{template.name}</p>
          <p className="text-[10px] text-[#c2c2c2]/50 mt-0.5">
            {template.selections?.length ?? 0} tags · {template.model}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onExport} title="Export as JSON" className="w-7 h-7 flex items-center justify-center rounded-full text-[#c2c2c2]/40 hover:text-[#f5f5f5] hover:bg-white/5 transition-all">
            <Download weight="regular" className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <button onClick={onDelete} className="text-[10px] text-red-400 border border-red-900/50 rounded-full px-2 py-0.5 hover:text-red-300 transition-colors">
              Confirm
            </button>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-full text-[#c2c2c2]/40 hover:text-red-400 hover:bg-white/5 transition-all">
              <Trash weight="regular" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {template.selections && template.selections.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {template.selections.slice(0, 6).map(tag => (
            <span key={tag.id} className="text-[10px] px-2.5 py-1 rounded-full border border-[#333] text-[#c2c2c2]">
              {tag.label}
            </span>
          ))}
          {template.selections.length > 6 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full border border-[#333] text-[#c2c2c2]/50">
              +{template.selections.length - 6}
            </span>
          )}
        </div>
      )}

      <button
        onClick={onUse}
        className="w-full py-2.5 rounded-full border border-[#333] text-xs font-medium text-[#c2c2c2] hover:border-[#f5f5f5] hover:text-[#f5f5f5] transition-all duration-150"
      >
        {isSelected ? 'Applied' : 'Apply Template'}
      </button>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-[#333]">
      <Funnel weight="regular" className="w-10 h-10 text-[#c2c2c2]/30 mb-4" />
      <p className="text-sm text-[#c2c2c2]/50 mb-4">No matching templates found.</p>
      <button onClick={onReset} className="text-xs text-[#c2c2c2] border border-[#333] rounded-full px-4 py-2 hover:border-[#555] hover:text-[#f5f5f5] transition-all duration-150">
        Reset Filters
      </button>
    </div>
  )
}
