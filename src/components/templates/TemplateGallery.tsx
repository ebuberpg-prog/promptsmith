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
  FilmSlate,
  Sun,
  Package,
  Palette,
  Sword,
  Building,
  Knife,
  Dress,
  Rocket,
  Camera,
  Image,
} from '@phosphor-icons/react'
import type { PromptTemplate } from '@/types'

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkle,
  User,
  FilmSlate,
  Sun,
  Image,
  Package,
  Palette,
  Sword,
  Building,
  Knife,
  Dress,
  Rocket,
  Camera,
  MagnifyingGlass,
}

function renderIcon(name: string, className = 'w-4 h-4') {
  const Icon = ICON_MAP[name] || Sparkle
  return <Icon weight="regular" className={className} />
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
    const store = usePromptSmithStore.getState()
    store._saveHistory()
    store.startHistoryBatch()
    clearAllTags()
    const { tags, customText, modelParams } = await applyGalleryTemplate(template, selectedModel, showExplicit)
    for (const tag of tags) toggleTag(tag)
    setCustomText(customText)
    if (modelParams) setModelParameters(modelParams)
    store.endHistoryBatch()
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
        const store = usePromptSmithStore.getState()
        store._saveHistory()
        store.startHistoryBatch()
        clearAllTags()
        loadPrompt(template)
        store.endHistoryBatch()
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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-2">
          <h2 className="font-display text-[2rem] font-normal tracking-tight" style={{ color: 'var(--ui-text)' }}>Blueprint Library</h2>
          <p className="text-[13px] max-w-md" style={{ color: 'var(--ui-muted-text)' }}>Standardized starting points for rapid visual development.</p>
        </div>

        <div className="flex items-center gap-2">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border text-[13px] transition-all duration-150"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
          >
            <Upload weight="regular" className="w-3.5 h-3.5" />
            Import
          </button>

          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors duration-150"
            style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Sparkle weight="regular" className="w-3.5 h-3.5" />
            Wizard
          </button>
        </div>
      </div>

      {/* Tabs + search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 border rounded-full p-1 w-fit" style={{ borderColor: 'var(--ui-border)' }}>
          <TabButton active={activeTab === 'built-in'} onClick={() => setActiveTab('built-in')} icon={<SelectionAll weight="regular" className="w-3.5 h-3.5" />} label="Templates" />
          <TabButton
            active={activeTab === 'my-templates'}
            onClick={() => setActiveTab('my-templates')}
            icon={<User weight="regular" className="w-3.5 h-3.5" />}
            label={savedPrompts.length > 0 ? `My Templates (${savedPrompts.length})` : 'My Templates'}
          />
        </div>

        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--ui-muted-text-faint)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-transparent border rounded-full outline-none focus:border-[var(--ui-border-hover)] transition-colors text-[13px] placeholder:text-[var(--ui-muted-text-faint)]"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'built-in' ? (
          <motion.div key="built-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
                  style={{
                    backgroundColor: selectedCategory === category.id ? 'var(--ui-text)' : 'transparent',
                    color: selectedCategory === category.id ? 'var(--ui-bg)' : 'var(--ui-muted-text)',
                    border: selectedCategory === category.id ? 'none' : '1px solid var(--ui-border)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.id) {
                      e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
                      e.currentTarget.style.color = 'var(--ui-text)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.id) {
                      e.currentTarget.style.borderColor = 'var(--ui-border)'
                      e.currentTarget.style.color = 'var(--ui-muted-text)'
                    }
                  }}
                >
                  <span className="text-base">{renderIcon(category.icon, 'w-4 h-4')}</span>
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
              <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl" style={{ borderColor: 'var(--ui-border-faint)' }}>
                <p className="text-sm mb-4" style={{ color: 'var(--ui-muted-text-faint)' }}>No saved templates yet</p>
                <button
                  onClick={() => setWizardOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all"
                  style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
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
      className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
      style={{
        backgroundColor: active ? 'var(--ui-text)' : 'transparent',
        color: active ? 'var(--ui-bg)' : 'var(--ui-muted-text)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--ui-text)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--ui-muted-text)' }}
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="group relative rounded-2xl border p-6 transition-all duration-300 cursor-pointer"
      style={{
        borderColor: isSelected ? 'color-mix(in oklab, var(--ui-text) 40%, transparent)' : 'var(--ui-border)',
        backgroundColor: isSelected ? 'color-mix(in oklab, var(--ui-text) 3%, transparent)' : 'transparent',
      }}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full border flex items-center justify-center transition-colors duration-300" style={{ borderColor: 'var(--ui-border)' }}>
              {renderIcon(template.icon, 'w-5 h-5')}
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-normal tracking-tight" style={{ color: 'var(--ui-text)' }}>
                {template.name}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: template.difficulty === 'beginner' ? 'color-mix(in oklab, var(--ui-text) 10%, transparent)' : template.difficulty === 'intermediate' ? 'color-mix(in oklab, var(--ui-muted-text) 10%, transparent)' : 'hsl(var(--destructive) / 0.1)',
                    color: template.difficulty === 'advanced' ? 'hsl(var(--destructive))' : 'var(--ui-muted-text)',
                  }}
                >
                  {DIFFICULTY_LABELS[template.difficulty]}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--ui-muted-text)' }}>{template.model}</span>
              </div>
            </div>
          </div>
          {isSelected && (
            <motion.div
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--ui-text)' }}
            >
              <CheckCircle weight="fill" className="w-3.5 h-3.5" style={{ color: 'var(--ui-bg)' }} />
            </motion.div>
          )}
        </div>

        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--ui-muted-text)' }}>
          {template.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-medium border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}>
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="px-3 py-1 rounded-full text-[10px] font-medium border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}>
              +{template.tags.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderTopColor: 'var(--ui-border)' }}>
          <div className="flex items-center gap-2">
            <SelectionAll weight="regular" className="w-3.5 h-3.5" style={{ color: isSelected ? 'var(--ui-text)' : 'var(--ui-muted-text-faint)' }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ui-muted-text)' }}>
              {template.tags.length} tags
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-all" style={{ color: isSelected ? 'var(--ui-text)' : 'var(--ui-muted-text)' }}>
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
    <div
      className="border rounded-2xl p-5 space-y-3 transition-all duration-300"
      style={{
        borderColor: isSelected ? 'color-mix(in oklab, var(--ui-text) 30%, transparent)' : 'var(--ui-border)',
        backgroundColor: isSelected ? 'color-mix(in oklab, var(--ui-text) 3%, transparent)' : 'transparent',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>{template.name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--ui-muted-text-faint)' }}>
            {template.selections?.length ?? 0} tags {template.model}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onExport} title="Export as JSON" className="w-7 h-7 flex items-center justify-center rounded-full transition-all" style={{ color: 'var(--ui-muted-text-faint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)'; e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text-faint)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Download weight="regular" className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <button onClick={onDelete} className="text-[10px] border rounded-full px-2 py-0.5 transition-colors" style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive) / 0.8)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive))')}
            >
              Confirm
            </button>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-full transition-all" style={{ color: 'var(--ui-muted-text-faint)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--destructive))'; e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text-faint)'; e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Trash weight="regular" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {template.selections && template.selections.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {template.selections.slice(0, 6).map(tag => (
            <span key={tag.id} className="text-[10px] px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}>
              {tag.label}
            </span>
          ))}
          {template.selections.length > 6 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}>
              +{template.selections.length - 6}
            </span>
          )}
        </div>
      )}

      <button
        onClick={onUse}
        className="w-full py-2.5 rounded-full border text-xs font-medium transition-all duration-150"
        style={{
          borderColor: isSelected ? 'var(--ui-text)' : 'var(--ui-border)',
          color: isSelected ? 'var(--ui-text)' : 'var(--ui-muted-text)',
        }}
        onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--ui-text)'; e.currentTarget.style.color = 'var(--ui-text)' } }}
        onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' } }}
      >
        {isSelected ? 'Applied' : 'Apply Template'}
      </button>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed" style={{ borderColor: 'var(--ui-border)' }}>
      <Funnel weight="regular" className="w-10 h-10 mb-4" style={{ color: 'var(--ui-muted-text-faint)' }} />
      <p className="text-sm mb-4" style={{ color: 'var(--ui-muted-text)' }}>No matching templates found.</p>
      <button onClick={onReset} className="text-xs border rounded-full px-4 py-2 transition-all duration-150" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
      >
        Reset Filters
      </button>
    </div>
  )
}
