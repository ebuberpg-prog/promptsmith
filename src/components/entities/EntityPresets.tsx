import { usePromptSmithStore } from '@/store/prompt-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FloppyDisk,
  FolderOpen,
  DownloadSimple,
  UploadSimple,
  Trash,
  Star,
  X,
  CaretDown,
  CaretRight,
  Plus,
  CheckCircle,
} from '@phosphor-icons/react'
import { useState, useRef, useCallback } from 'react'
import type { SavedEntity, EntityKind } from '@/types'

const KIND_LABELS: Record<EntityKind, string> = {
  character: 'Character',
  environment: 'Environment',
  style: 'Style',
  mood: 'Mood',
  custom: 'Custom',
}

const KIND_ORDER: EntityKind[] = ['character', 'environment', 'style', 'mood', 'custom']

export function EntityPresets() {
  const savedEntities = usePromptSmithStore((s) => s.savedEntities)
  const saveEntity = usePromptSmithStore((s) => s.saveEntity)
  const loadEntity = usePromptSmithStore((s) => s.loadEntity)
  const deleteEntity = usePromptSmithStore((s) => s.deleteEntity)
  const updateEntity = usePromptSmithStore((s) => s.updateEntity)
  const exportEntities = usePromptSmithStore((s) => s.exportEntities)
  const importEntities = usePromptSmithStore((s) => s.importEntities)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveKind, setSaveKind] = useState<EntityKind>('character')
  const [saveDescription, setSaveDescription] = useState('')
  const [expandedKinds, setExpandedKinds] = useState<Set<EntityKind>>(new Set(['character', 'environment']))
  const [imported, setImported] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const grouped = KIND_ORDER.map(kind => ({
    kind,
    label: KIND_LABELS[kind],
    entities: savedEntities.filter(e => e.kind === kind).sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return b.createdAt - a.createdAt
    }),
  }))

  const toggleKind = (kind: EntityKind) => {
    setExpandedKinds(prev => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const handleSave = () => {
    if (!saveName.trim() || selectedTags.length === 0) return
    saveEntity(saveName.trim(), saveKind, saveDescription.trim() || undefined)
    setSaveName('')
    setSaveDescription('')
    setShowSaveDialog(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleExport = () => {
    const json = exportEntities()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `muse-entities-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const count = importEntities(text)
      if (count > 0) {
        setImported(true)
        setTimeout(() => setImported(false), 1500)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [importEntities])

  const totalEntities = savedEntities.length
  const favoriteCount = savedEntities.filter(e => e.isFavorite).length

  return (
    <div className="border border-[#333] rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-[#f5f5f5]">Saved Entities</h3>
          <p className="text-[10px] text-[#c2c2c2]/40 mt-0.5">
            {totalEntities === 0 ? 'No saved entities yet' : `${totalEntities} saved${favoriteCount > 0 ? `, ${favoriteCount} starred` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            disabled={totalEntities === 0}
            className="p-1.5 rounded-lg text-[#c2c2c2]/30 hover:text-[#c2c2c2]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Export entities"
          >
            <DownloadSimple weight="regular" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-[#c2c2c2]/30 hover:text-[#c2c2c2]/60 transition-colors"
            title="Import entities"
          >
            <UploadSimple weight="regular" className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedTags.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#333] text-[10px] text-[#c2c2c2]/40 hover:text-[#c2c2c2]/70 hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus weight="bold" className="w-2.5 h-2.5" />
            Save
          </button>
        </div>
      </div>

      {/* Import/export feedback */}
      <AnimatePresence>
        {imported && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-green-400/60"
          >
            <CheckCircle weight="fill" className="w-3 h-3" />
            Entities imported successfully.
          </motion.div>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-green-400/60"
          >
            <CheckCircle weight="fill" className="w-3 h-3" />
            Entity saved.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entity list */}
      {totalEntities === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-[#c2c2c2]/20">Save tag combinations as reusable entities.</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
          {grouped.filter(g => g.entities.length > 0).map(group => (
            <div key={group.kind}>
              {/* Group header */}
              <button
                onClick={() => toggleKind(group.kind)}
                className="flex items-center gap-2 w-full py-1.5 text-left"
              >
                {expandedKinds.has(group.kind)
                  ? <CaretDown weight="bold" className="w-3 h-3 text-[#c2c2c2]/30" />
                  : <CaretRight weight="bold" className="w-3 h-3 text-[#c2c2c2]/30" />
                }
                <span className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider">{group.label}</span>
                <span className="text-[10px] text-[#c2c2c2]/20">{group.entities.length}</span>
              </button>

              {/* Group entities */}
              <AnimatePresence>
                {expandedKinds.has(group.kind) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-1 pb-1"
                  >
                    {group.entities.map(entity => (
                      <EntityRow
                        key={entity.id}
                        entity={entity}
                        onLoadReplace={() => loadEntity(entity, 'replace')}
                        onLoadAppend={() => loadEntity(entity, 'append')}
                        onDelete={() => deleteEntity(entity.id)}
                        onToggleFavorite={() => updateEntity(entity.id, { isFavorite: !entity.isFavorite })}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Save dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm mx-4 border border-[#333] rounded-2xl bg-black p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#f5f5f5]">Save Entity</h4>
                <button onClick={() => setShowSaveDialog(false)} className="text-[#c2c2c2]/40 hover:text-[#c2c2c2] transition-colors">
                  <X weight="bold" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider mb-1 block">Name</label>
                  <input
                    autoFocus
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                    placeholder="e.g. Cyberpunk protagonist"
                    className="w-full px-3 py-2 bg-transparent border border-[#333] rounded-lg text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/25 outline-none focus:border-[#555] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider mb-1 block">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {KIND_ORDER.map(kind => (
                      <button
                        key={kind}
                        onClick={() => setSaveKind(kind)}
                        className={`px-2.5 py-1 rounded-full text-[10px] border transition-colors ${
                          saveKind === kind
                            ? 'border-[#f5f5f5]/40 text-[#f5f5f5] bg-white/5'
                            : 'border-[#333] text-[#c2c2c2]/40 hover:border-[#555]'
                        }`}
                      >
                        {KIND_LABELS[kind]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider mb-1 block">Description</label>
                  <input
                    value={saveDescription}
                    onChange={e => setSaveDescription(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 bg-transparent border border-[#333] rounded-lg text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/25 outline-none focus:border-[#555] transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-[#c2c2c2]/25">{selectedTags.length} tags will be saved</p>
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f5f5f5] text-black text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#e0e0e0] transition-colors"
                  >
                    <FloppyDisk weight="fill" className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EntityRow({
  entity,
  onLoadReplace,
  onLoadAppend,
  onDelete,
  onToggleFavorite,
}: {
  entity: SavedEntity
  onLoadReplace: () => void
  onLoadAppend: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
      <button
        onClick={onToggleFavorite}
        className="flex-shrink-0"
      >
        <Star
          weight={entity.isFavorite ? 'fill' : 'regular'}
          className={`w-3 h-3 transition-colors ${entity.isFavorite ? 'text-amber-400/60' : 'text-[#c2c2c2]/15 group-hover:text-[#c2c2c2]/30'}`}
        />
      </button>

      <button
        onClick={onLoadReplace}
        className="flex-1 text-left min-w-0"
        title="Replace current selection"
      >
        <p className="text-[11px] text-[#c2c2c2]/60 truncate">{entity.name}</p>
        {entity.description && (
          <p className="text-[10px] text-[#c2c2c2]/25 truncate">{entity.description}</p>
        )}
      </button>

      <span className="text-[9px] text-[#c2c2c2]/15 flex-shrink-0">{entity.tags.length} tags</span>

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-[#c2c2c2]/25 hover:text-[#c2c2c2]/50 transition-all"
        >
          <CaretDown weight="bold" className="w-2.5 h-2.5" />
        </button>

        <AnimatePresence>
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-full mt-1 w-36 border border-[#333] rounded-lg bg-black z-20 py-1"
              >
                <button
                  onClick={() => { onLoadAppend(); setShowActions(false) }}
                  className="w-full px-3 py-1.5 text-left text-[10px] text-[#c2c2c2]/50 hover:text-[#f5f5f5] hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <FolderOpen weight="regular" className="w-3 h-3" />
                  Append to current
                </button>
                <button
                  onClick={() => { onDelete(); setShowActions(false) }}
                  className="w-full px-3 py-1.5 text-left text-[10px] text-red-400/50 hover:text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Trash weight="regular" className="w-3 h-3" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
