import { useEffect, useState } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { CaretDown, FolderOpen, Plus, Trash, X } from '@phosphor-icons/react'
import { flushPendingState, removeWorkspaceState } from '@/store/indexeddb-storage'
import {
  activateWorkspace,
  createWorkspace,
  deleteWorkspaceFromRegistry,
  flushWorkspaceRegistry,
  getWorkspaceRegistry,
  renameWorkspace,
  subscribeWorkspaces,
} from '@/services/workspace-service'
import type { MuseWorkspaceRegistry } from '@/types'

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const [registry, setRegistry] = useState<MuseWorkspaceRegistry>(() => getWorkspaceRegistry())
  const [newName, setNewName] = useState('')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [message, setMessage] = useState('')
  const activeWorkspace = registry.workspaces.find((workspace) => workspace.id === registry.activeWorkspaceId) ?? registry.workspaces[0]

  useEffect(() => subscribeWorkspaces(() => setRegistry(getWorkspaceRegistry())), [])

  const enterWorkspace = async (id: string) => {
    if (id === registry.activeWorkspaceId) { setOpen(false); return }
    setMessage('Saving the current workspace…')
    await flushPendingState()
    activateWorkspace(id)
    await flushWorkspaceRegistry()
    window.location.reload()
  }

  const addWorkspace = async () => {
    try {
      await flushPendingState()
      const workspace = createWorkspace(newName)
      await flushWorkspaceRegistry()
      setMessage(`Opening ${workspace.name}…`)
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace could not be created.')
    }
  }

  const saveRename = () => {
    if (!renameId) return
    try {
      renameWorkspace(renameId, renameValue)
      setRenameId(null)
      setRenameValue('')
      setMessage('Workspace renamed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace could not be renamed.')
    }
  }

  const removeWorkspace = async (id: string) => {
    try {
      await removeWorkspaceState(id)
      deleteWorkspaceFromRegistry(id)
      setMessage('Workspace removed from this device.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace could not be removed.')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="size-11 lg:size-auto lg:min-h-11 lg:max-w-52 rounded-lg border border-[var(--ui-border)] px-3 flex items-center justify-center lg:justify-start gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`Current workspace: ${activeWorkspace.name}. Manage workspaces`}>
        <FolderOpen className="size-4 shrink-0 text-[var(--ui-muted-text)]" />
        <span className="hidden min-w-0 flex-1 truncate text-xs lg:block">{activeWorkspace.name}</span>
        <CaretDown className="hidden size-3.5 shrink-0 text-[var(--ui-muted-text)] lg:block" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[var(--ui-overlay)]" />
        <Dialog.Popup className="fixed right-0 inset-y-0 z-50 w-[min(100%,520px)] overflow-y-auto border-l border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 sm:p-7 safe-bottom" aria-label="Studio workspaces">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-3xl text-balance">Studio workspaces</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-pretty text-[var(--ui-muted-text)]">Separate client work, reference studies, drafts, and local model preferences into independent folios.</Dialog.Description>
            </div>
            <Dialog.Close className="size-11 shrink-0 rounded-lg border border-[var(--ui-border)] flex items-center justify-center" aria-label="Close workspace manager"><X className="size-4" /></Dialog.Close>
          </div>

          <section className="mt-7" aria-labelledby="workspace-folios-heading">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--ui-border)] pb-2">
              <h2 id="workspace-folios-heading" className="text-xs font-medium">Workspace folios</h2>
              <span className="text-xs tabular-nums text-[var(--ui-muted-text)]">{registry.workspaces.length} local</span>
            </div>
            <div className="divide-y divide-[var(--ui-border)]">
              {registry.workspaces.map((workspace) => {
                const active = workspace.id === registry.activeWorkspaceId
                const renaming = renameId === workspace.id
                return <article key={workspace.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => void enterWorkspace(workspace.id)} className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-current={active ? 'true' : undefined}>
                      <span className="flex items-center gap-2"><FolderOpen weight={active ? 'fill' : 'regular'} className="size-5 shrink-0" /><strong className="truncate text-sm font-medium">{workspace.name}</strong></span>
                      <span className="mt-1 block pl-7 text-xs text-[var(--ui-muted-text)]">{active ? 'Open now' : `Last opened ${new Date(workspace.lastOpenedAt).toLocaleDateString()}`}</span>
                    </button>
                    {!active && <AlertDialog.Root>
                      <AlertDialog.Trigger className="size-11 shrink-0 rounded-lg flex items-center justify-center text-[var(--ui-muted-text)] hover:text-[var(--destructive)]" aria-label={`Delete ${workspace.name}`}><Trash className="size-4" /></AlertDialog.Trigger>
                      <AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-[var(--ui-overlay)]" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[70] w-[min(92vw,430px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6"><AlertDialog.Title className="font-display text-2xl text-balance">Delete {workspace.name}?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm leading-6 text-pretty text-[var(--ui-muted-text)]">Prompts, references, analyses, and recovery drafts in this workspace will be removed from this device. Export its backup first if you need to keep it.</AlertDialog.Description><div className="mt-6 flex justify-end gap-2"><AlertDialog.Close className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Cancel</AlertDialog.Close><AlertDialog.Close onClick={() => void removeWorkspace(workspace.id)} className="min-h-11 rounded-lg border border-[var(--destructive)] px-4 text-sm text-[var(--destructive)]">Delete workspace</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal>
                    </AlertDialog.Root>}
                  </div>
                  {renaming ? <div className="mt-3 flex gap-2 pl-7"><label className="min-w-0 flex-1"><span className="sr-only">New name for {workspace.name}</span><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={60} className="min-h-11 w-full rounded-lg bg-[var(--ui-surface-soft)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label><button type="button" onClick={saveRename} disabled={!renameValue.trim()} className="min-h-11 rounded-lg bg-[var(--ui-text)] px-4 text-xs text-[var(--ui-bg)] disabled:opacity-40">Save</button><button type="button" onClick={() => setRenameId(null)} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-3 text-xs">Cancel</button></div> : <button type="button" onClick={() => { setRenameId(workspace.id); setRenameValue(workspace.name) }} className="mt-2 min-h-9 rounded-lg pl-7 pr-3 text-xs text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]">Rename folio</button>}
                </article>
              })}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-4" aria-labelledby="new-workspace-heading">
            <h2 id="new-workspace-heading" className="font-display text-xl text-balance">Open a fresh folio</h2>
            <p className="mt-1 text-xs leading-5 text-pretty text-[var(--ui-muted-text)]">The current workspace is saved before MUSE opens the new one.</p>
            <label className="mt-4 block"><span className="text-xs font-medium">Workspace name</span><input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={60} placeholder="Client, campaign, or personal archive" className="mt-2 min-h-12 w-full rounded-lg bg-[var(--ui-surface-soft)] px-3 text-sm outline-none placeholder:text-[var(--ui-muted-text-faint)] focus-visible:ring-2 focus-visible:ring-[var(--ui-border-strong)]" /></label>
            <button type="button" onClick={() => void addWorkspace()} disabled={!newName.trim()} className="mt-3 min-h-11 rounded-lg bg-[var(--ui-text)] px-4 text-sm text-[var(--ui-bg)] flex items-center gap-2 disabled:opacity-40"><Plus className="size-4" />Create and open</button>
          </section>

          {message && <p className="mt-4 text-xs text-pretty text-[var(--ui-muted-text)]" role="status">{message}</p>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
