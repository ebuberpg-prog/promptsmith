import { usePromptSmithStore } from '@/store/prompt-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { AlertDialog } from '@base-ui/react/alert-dialog'
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

export function EntityPresets({ embedded = false }: { embedded?: boolean }) {
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
    <div className={embedded ? 'space-y-4' : 'border border-[var(--ui-border)] rounded-2xl p-5 space-y-4'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-[var(--ui-text)]">Reusable building blocks</h3>
          <p className="text-[10px] text-[var(--ui-muted-text)]/40 mt-0.5">
            {totalEntities === 0 ? 'No saved entities yet' : `${totalEntities} saved${favoriteCount > 0 ? `, ${favoriteCount} starred` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            disabled={totalEntities === 0}
            className="p-1.5 rounded-lg text-[var(--ui-muted-text)]/30 hover:text-[var(--ui-muted-text)]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Export entities"
          >
            <DownloadSimple weight="regular" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-[var(--ui-muted-text)]/30 hover:text-[var(--ui-muted-text)]/60 transition-colors"
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--ui-border)] text-[10px] text-[var(--ui-muted-text)]/40 hover:text-[var(--ui-muted-text)]/70 hover:border-[var(--ui-border-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
          <p className="text-xs text-[var(--ui-muted-text)]">Save the current ingredients as a character, environment, style, or mood.</p>
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
                  ? <CaretDown weight="bold" className="w-3 h-3 text-[var(--ui-muted-text)]/30" />
                  : <CaretRight weight="bold" className="w-3 h-3 text-[var(--ui-muted-text)]/30" />
                }
                <span className="text-[10px] text-[var(--ui-muted-text)]/40 uppercase tracking-wider">{group.label}</span>
                <span className="text-[10px] text-[var(--ui-muted-text)]/20">{group.entities.length}</span>
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
      <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border border-[var(--ui-border)] rounded-2xl bg-[var(--ui-bg)] p-5 space-y-4" aria-label="Save entity">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[var(--ui-text)]">Save Entity</h4>
                <Dialog.Close className="size-11 flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors" aria-label="Close save entity">
                  <X weight="bold" className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[var(--ui-muted-text)]/40 uppercase tracking-wider mb-1 block">Name</label>
                  <input
                    autoFocus
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                    placeholder="e.g. Cyberpunk protagonist"
                    className="w-full px-3 py-2 bg-transparent border border-[var(--ui-border)] rounded-lg text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/25 outline-none focus:border-[var(--ui-border-hover)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--ui-muted-text)]/40 uppercase tracking-wider mb-1 block">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {KIND_ORDER.map(kind => (
                      <button
                        key={kind}
                        onClick={() => setSaveKind(kind)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                          saveKind === kind
                            ? 'border-[var(--ui-text)]/40 text-[var(--ui-text)] bg-[var(--ui-surface-soft)]'
                            : 'border-[var(--ui-border)] text-[var(--ui-muted-text)]/40 hover:border-[var(--ui-border-hover)]'
                        }`}
                      >
                        {KIND_LABELS[kind]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--ui-muted-text)]/40 uppercase tracking-wider mb-1 block">Description</label>
                  <input
                    value={saveDescription}
                    onChange={e => setSaveDescription(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 bg-transparent border border-[var(--ui-border)] rounded-lg text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/25 outline-none focus:border-[var(--ui-border-hover)] transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-[var(--ui-muted-text)]/25">{selectedTags.length} tags will be saved</p>
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)] text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--ui-surface)] transition-colors"
                  >
                    <FloppyDisk weight="fill" className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--ui-surface-soft)] transition-colors">
      <button
        onClick={onToggleFavorite}
        className="flex-shrink-0"
      >
        <Star
          weight={entity.isFavorite ? 'fill' : 'regular'}
          className={`w-3 h-3 transition-colors ${entity.isFavorite ? 'text-amber-400/60' : 'text-[var(--ui-muted-text)]/15 group-hover:text-[var(--ui-muted-text)]/30'}`}
        />
      </button>

      <button
        onClick={onLoadReplace}
        className="flex-1 text-left min-w-0"
        title="Replace current selection"
      >
        <p className="text-[11px] text-[var(--ui-muted-text)]/60 truncate">{entity.name}</p>
        {entity.description && (
          <p className="text-[10px] text-[var(--ui-muted-text)]/25 truncate">{entity.description}</p>
        )}
      </button>

      <span className="text-[9px] text-[var(--ui-muted-text)]/15 flex-shrink-0">{entity.tags.length} tags</span>

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <Menu.Root><Menu.Trigger className="size-11 rounded-full flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-all" aria-label={`More actions for ${entity.name}`}>
          <CaretDown weight="bold" className="w-3 h-3" />
        </Menu.Trigger><Menu.Portal><Menu.Positioner align="end" sideOffset={6} className="z-40"><Menu.Popup className="w-40 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] p-1.5 shadow-lg">
                <Menu.Item
                  onClick={onLoadAppend}
                  className="min-h-11 px-3 rounded-md text-left text-xs text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] data-[highlighted]:bg-[var(--ui-surface-soft)] outline-none flex items-center gap-2"
                >
                  <FolderOpen weight="regular" className="w-3 h-3" />
                  Append to current
                </Menu.Item>
                <Menu.Item
                  onClick={() => setDeleteOpen(true)}
                  className="min-h-11 px-3 rounded-md text-left text-xs text-[var(--destructive)] data-[highlighted]:bg-[var(--ui-surface-soft)] outline-none flex items-center gap-2"
                >
                  <Trash weight="regular" className="w-3 h-3" />
                  Delete
                </Menu.Item>
        </Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>
        <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6"><AlertDialog.Title className="font-display text-2xl">Delete {entity.name}?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm text-[var(--ui-muted-text)]">This removes the local entity preset from this device.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Cancel</AlertDialog.Close><AlertDialog.Close onClick={onDelete} className="min-h-11 px-4 rounded-lg border border-[var(--destructive)]">Delete</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>
      </div>
    </div>
  )
}
