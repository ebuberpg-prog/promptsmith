import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@base-ui/react/dialog'
import { usePromptSmithStore } from '@/store/prompt-store'
import { TEMPLATE_CATEGORIES, DIFFICULTY_LABELS } from '@/types/templates'
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
  Mountains,
  Buildings,
  DeviceMobile,
  Diamond,
  Waves,
  Heart,
  GameController,
  Tree,
  Church,
  Armchair,
  Plant,
  Cookie,
  Sneaker,
  Skull,
  Gear,
  Star,
  VideoCamera,
  Circle,
  Seal,
  Smiley,
  Cube,
  Drop,
  PencilLine,
  Car,
  PersonSimpleRun,
  SquaresFour,
  X,
} from '@phosphor-icons/react'
import type { PromptTemplate, SupportedModel } from '@/types'
import { getModelConfig } from '@/data/model-configs'
import {
  BLUEPRINT_TEMPLATES,
  FLAGSHIP_TEMPLATES,
  getTemplateImage,
  type BlueprintGalleryTemplate,
} from '@/data/template-blueprints'

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
  Mountains,
  Buildings,
  DeviceMobile,
  Diamond,
  Waves,
  Heart,
  GameController,
  Tree,
  Church,
  Armchair,
  Plant,
  Cookie,
  Sneaker,
  Skull,
  Gear,
  Star,
  VideoCamera,
  Circle,
  Seal,
  Smiley,
  Cube,
  Drop,
  PencilLine,
  Car,
  PersonSimpleRun,
  SquaresFour,
}

function renderIcon(name: string, className = 'w-4 h-4') {
  const Icon = ICON_MAP[name] || Sparkle
  return <Icon weight="regular" className={className} />
}

type GalleryTab = 'built-in' | 'my-templates'
type CollectionView = 'flagship' | 'all'

export function TemplateGallery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<GalleryTab>('built-in')
  const [collectionView, setCollectionView] = useState<CollectionView>('flagship')
  const [previewTemplate, setPreviewTemplate] = useState<BlueprintGalleryTemplate | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const setModelParameters = usePromptSmithStore((s) => s.setModelParameters)
  const contentVisibility = usePromptSmithStore((s) => s.contentVisibility)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const savedPrompts = usePromptSmithStore((s) => s.savedPrompts)
  const deletePrompt = usePromptSmithStore((s) => s.deletePrompt)
  const savePrompt = usePromptSmithStore((s) => s.savePrompt)
  const loadPrompt = usePromptSmithStore((s) => s.loadPrompt)
  const setWorkspaceView = usePromptSmithStore((s) => s.setWorkspaceView)

  const filteredBuiltIn = useMemo(() => {
    const templates = searchQuery.trim()
      ? BLUEPRINT_TEMPLATES
      : collectionView === 'flagship' ? FLAGSHIP_TEMPLATES : BLUEPRINT_TEMPLATES
    return templates.filter((template) => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [collectionView, selectedCategory, searchQuery])

  const visibleCategories = useMemo(() => {
    const templates = collectionView === 'flagship' ? FLAGSHIP_TEMPLATES : BLUEPRINT_TEMPLATES
    const categoryIds = new Set(templates.map((template) => template.category))
    return TEMPLATE_CATEGORIES.filter((category) => category.id === 'all' || categoryIds.has(category.id as BlueprintGalleryTemplate['category']))
  }, [collectionView])

  const filteredUserTemplates = useMemo(() => {
    if (!searchQuery) return savedPrompts
    return savedPrompts.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [savedPrompts, searchQuery])

  const handleUseBuiltIn = async (template: BlueprintGalleryTemplate, continueInCraft: boolean) => {
    const store = usePromptSmithStore.getState()
    store.captureDraftSnapshot('template')
    store._saveHistory()
    store.startHistoryBatch()
    clearAllTags()
    const { tags, customText, modelParams } = await applyGalleryTemplate(template, selectedModel, contentVisibility)
    for (const tag of tags) toggleTag(tag)
    setCustomText(customText)
    if (modelParams) setModelParameters(modelParams)
    store.endHistoryBatch()
    setSelectedTemplate(template.id)
    setPreviewTemplate(null)
    if (continueInCraft) setWorkspaceView('craft')
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
        setImportMessage('Template imported to your local Library.')
      } else {
        setImportMessage('That file is not a valid MUSE prompt template. Nothing was changed.')
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
          <h2 className="font-display text-[2rem] font-normal text-balance" style={{ color: 'var(--ui-text)' }}>Blueprint Library</h2>
          <p className="text-[13px] max-w-xl text-pretty" style={{ color: 'var(--ui-muted-text)' }}>Structured starting points with an editable subject, composition, light, medium, and constraints.</p>
        </div>

        <div className="flex items-center gap-2">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] transition-all duration-150"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
          >
            <Upload weight="regular" className="w-3.5 h-3.5" />
            Import
          </button>

          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150"
            style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Sparkle weight="regular" className="w-3.5 h-3.5" />
            Wizard
          </button>
        </div>
      </div>
      {importMessage && <p role="status" className="text-xs text-[var(--ui-muted-text)]">{importMessage}</p>}

      {/* Tabs + search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div role="tablist" aria-label="Template sources" className="flex items-center gap-1 border rounded-lg p-1 w-fit" style={{ borderColor: 'var(--ui-border)' }}>
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
            className="w-full pl-10 pr-4 py-2 bg-transparent border rounded-lg outline-none focus:border-[var(--ui-border-hover)] transition-colors text-[13px] placeholder:text-[var(--ui-muted-text-faint)]"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'built-in' ? (
          <motion.div key="built-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Choose the depth of the library</p>
                <p className="mt-0.5 text-xs text-pretty text-[var(--ui-muted-text)]">
                  {collectionView === 'flagship'
                    ? `${FLAGSHIP_TEMPLATES.length} verified blueprints with exact ingredients and distinct visual references.`
                    : 'The complete legacy collection, including text-only starters still awaiting structured ingredients.'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1 rounded-lg border border-[var(--ui-border)] p-1" role="group" aria-label="Template collection">
                <button type="button" aria-pressed={collectionView === 'flagship'} onClick={() => { setCollectionView('flagship'); setSelectedCategory('all') }} className={`min-h-10 rounded-lg px-3 text-xs font-medium ${collectionView === 'flagship' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]'}`}>Curated {FLAGSHIP_TEMPLATES.length}</button>
                <button type="button" aria-pressed={collectionView === 'all'} onClick={() => { setCollectionView('all'); setSelectedCategory('all') }} className={`min-h-10 rounded-lg px-3 text-xs font-medium ${collectionView === 'all' ? 'bg-[var(--ui-text)] text-[var(--ui-bg)]' : 'text-[var(--ui-muted-text)]'}`}>All {BLUEPRINT_TEMPLATES.length}</button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {visibleCategories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  aria-pressed={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
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
                    onPreview={() => setPreviewTemplate(template)}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all"
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
      <TemplatePreviewDialog
        template={previewTemplate}
        selectedModel={selectedModel}
        onClose={() => setPreviewTemplate(null)}
        onApply={(template) => void handleUseBuiltIn(template, false)}
        onApplyAndContinue={(template) => void handleUseBuiltIn(template, true)}
      />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
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
  template, isSelected, onPreview,
}: {
  template: BlueprintGalleryTemplate
  isSelected: boolean
  onPreview: () => void
}) {
  const image = getTemplateImage(template)
  const ingredientLabel = template.tagIds.length > 0 ? `${template.tagIds.length} exact ingredients` : 'Text blueprint'

  return (
    <motion.button
      type="button"
      aria-label={`Preview ${template.name} blueprint`}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onPreview}
      className="group relative rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer"
      style={{
        borderColor: isSelected ? 'color-mix(in oklab, var(--ui-text) 40%, transparent)' : 'var(--ui-border)',
        backgroundColor: isSelected ? 'color-mix(in oklab, var(--ui-text) 3%, transparent)' : 'transparent',
      }}
    >
      <div className="space-y-4">
        <span className="block w-full aspect-[16/9] rounded-xl overflow-hidden"><img src={image.src} srcSet={image.srcSet} sizes="(max-width: 640px) 90vw, 320px" alt="" width={image.width} height={image.height} loading="lazy" className="size-full scale-[1.12] object-cover" /></span>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-lg border flex items-center justify-center transition-colors duration-150" style={{ borderColor: 'var(--ui-border)' }}>
              {renderIcon(template.icon, 'w-5 h-5')}
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-normal text-balance" style={{ color: 'var(--ui-text)' }}>
                {template.name}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium uppercase"
                  style={{
                    backgroundColor: template.difficulty === 'beginner' ? 'color-mix(in oklab, var(--ui-text) 10%, transparent)' : template.difficulty === 'intermediate' ? 'color-mix(in oklab, var(--ui-muted-text) 10%, transparent)' : 'hsl(var(--destructive) / 0.1)',
                    color: template.difficulty === 'advanced' ? 'hsl(var(--destructive))' : 'var(--ui-muted-text)',
                  }}
                >
                  {DIFFICULTY_LABELS[template.difficulty]}
                </span>
              </div>
            </div>
          </div>
          {isSelected && (
            <motion.div
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--ui-text)' }}
            >
              <CheckCircle weight="fill" className="w-3.5 h-3.5" style={{ color: 'var(--ui-bg)' }} />
            </motion.div>
          )}
        </div>

        <p className="text-sm leading-relaxed text-pretty line-clamp-2" style={{ color: 'var(--ui-muted-text)' }}>
          {template.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-lg text-[10px] font-medium border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}>
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="px-3 py-1 rounded-lg text-[10px] font-medium border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}>
              +{template.tags.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderTopColor: 'var(--ui-border)' }}>
          <div className="flex items-center gap-2">
            <SelectionAll weight="regular" className="w-3.5 h-3.5" style={{ color: isSelected ? 'var(--ui-text)' : 'var(--ui-muted-text-faint)' }} />
            <span className="text-[10px] uppercase" style={{ color: 'var(--ui-muted-text)' }}>
              {ingredientLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase" style={{ color: isSelected ? 'var(--ui-text)' : 'var(--ui-muted-text)' }}>
            <span>{isSelected ? 'Applied · Preview' : 'Preview'}</span>
            <ArrowRight weight="regular" className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

function TemplatePreviewDialog({
  template,
  selectedModel,
  onClose,
  onApply,
  onApplyAndContinue,
}: {
  template: BlueprintGalleryTemplate | null
  selectedModel: SupportedModel
  onClose: () => void
  onApply: (template: BlueprintGalleryTemplate) => void
  onApplyAndContinue: (template: BlueprintGalleryTemplate) => void
}) {
  const image = template ? getTemplateImage(template) : null
  const selectedModelName = getModelConfig(selectedModel).name
  const isTunedForModel = Boolean(template?.modelParams?.[selectedModel])

  return (
    <Dialog.Root open={Boolean(template)} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 grid max-h-[min(90vh,760px)] w-[min(900px,calc(100vw_-_2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-lg lg:grid-cols-[0.9fr_1.1fr]">
          {template && image && (
            <>
              <div className="min-h-56 overflow-hidden bg-[var(--ui-surface-soft)] lg:min-h-full">
                <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 1024px) 100vw, 420px" alt={image.alt} width={image.width} height={image.height} className="size-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase text-[var(--ui-muted-text)]">{DIFFICULTY_LABELS[template.difficulty]} blueprint</p>
                    <Dialog.Title className="mt-1 font-display text-3xl text-balance">{template.name}</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">{template.description}</Dialog.Description>
                  </div>
                  <Dialog.Close className="size-11 shrink-0 rounded-lg border border-[var(--ui-border)] text-[var(--ui-muted-text)]" aria-label={`Close ${template.name} preview`}><X className="mx-auto size-4" /></Dialog.Close>
                </div>

                <section className="mt-6" aria-labelledby="prompt-anatomy-title">
                  <h3 id="prompt-anatomy-title" className="text-xs font-medium uppercase text-[var(--ui-muted-text)]">Prompt anatomy</h3>
                  <dl className="mt-2 grid gap-px overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-border)] sm:grid-cols-2">
                    {template.anatomy.map((part) => (
                      <div key={`${part.dimension}-${part.value}`} className="bg-[var(--ui-bg)] p-3">
                        <dt className="text-[10px] font-medium uppercase text-[var(--ui-muted-text-faint)]">{part.dimension}</dt>
                        <dd className="mt-1 text-sm text-pretty">{part.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="mt-5" aria-labelledby="starter-prompt-title">
                  <h3 id="starter-prompt-title" className="text-xs font-medium uppercase text-[var(--ui-muted-text)]">Editable starter prompt</h3>
                  <p className="mt-2 rounded-xl bg-[var(--ui-surface-soft)] p-4 text-sm leading-6 text-pretty">{template.examplePrompt}</p>
                </section>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--ui-muted-text)]">
                  <span className="rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5">{template.tagIds.length > 0 ? `${template.tagIds.length} exact taxonomy ingredients` : 'Text-only starter'}</span>
                  <span className="rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5">{isTunedForModel ? `Tuned for ${selectedModelName}` : `Compatible with ${selectedModelName}`}</span>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => onApply(template)} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Apply here</button>
                  <button type="button" onClick={() => onApplyAndContinue(template)} className="min-h-11 rounded-lg bg-[var(--ui-text)] px-4 text-sm font-medium text-[var(--ui-bg)]">Apply and continue in Craft</button>
                </div>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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
          <button onClick={onExport} title="Export as JSON" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: 'var(--ui-muted-text-faint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)'; e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text-faint)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Download weight="regular" className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <button onClick={onDelete} className="text-[10px] border rounded-lg px-2 py-0.5 transition-colors" style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive) / 0.5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive) / 0.8)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive))')}
            >
              Confirm
            </button>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: 'var(--ui-muted-text-faint)' }}
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
            <span key={tag.id} className="text-[10px] px-2.5 py-1 rounded-lg border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}>
              {tag.label}
            </span>
          ))}
          {template.selections.length > 6 && (
            <span className="text-[10px] px-2.5 py-1 rounded-lg border" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}>
              +{template.selections.length - 6}
            </span>
          )}
        </div>
      )}

      <button
        onClick={onUse}
        className="w-full py-2.5 rounded-lg border text-xs font-medium transition-all duration-150"
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
      <button onClick={onReset} className="text-xs border rounded-lg px-4 py-2 transition-all duration-150" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
      >
        Reset Filters
      </button>
    </div>
  )
}
