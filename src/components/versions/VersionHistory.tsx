import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { ClockCounterClockwise, Plus, Clock, ArrowCounterClockwise, X, GitBranch } from '@phosphor-icons/react'

export function VersionHistory() {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  
  const promptVersions = usePromptSmithStore((s) => s.promptVersions)
  const currentVersion = usePromptSmithStore((s) => s.currentVersion)
  const createVersion = usePromptSmithStore((s) => s.createVersion)
  const loadVersion = usePromptSmithStore((s) => s.loadVersion)
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)

  const handleCreateVersion = () => {
    createVersion(notes.trim() || undefined)
    setNotes('')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <ClockCounterClockwise weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Versions</span>
        {promptVersions.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
            {promptVersions.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ClockCounterClockwise weight="regular" className="w-5 h-5" style={{ color: 'hsl(38, 92%, 50%)' }} />
                <h2 className="text-lg font-semibold text-foreground">Prompt Version History</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-surface-elevated border border-border rounded-lg p-3">
                <h3 className="text-sm font-medium text-foreground mb-3">Save Current Version</h3>
                <div className="space-y-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Version notes (optional)"
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm resize-none h-16"
                  />
                  <div className="text-xs text-muted-foreground">
                    Current: {generatePrompt().substring(0, 50)}...
                  </div>
                  <button
                    onClick={handleCreateVersion}
                    className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500 flex items-center justify-center gap-2"
                  >
                    <Plus weight="regular" className="w-4 h-4" />
                    Save Version
                  </button>
                </div>
              </div>

              {promptVersions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Version History</h3>
                  {promptVersions
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <div
                        key={version.id}
                        className={`bg-surface-elevated border rounded-lg p-3 ${
                          currentVersion === version.version
                            ? 'border-amber-500'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              Version {version.version}
                            </span>
                            {currentVersion === version.version && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => loadVersion(version.version)}
                              className="p-1 rounded hover:bg-background text-muted-foreground"
                              title="Load version"
                            >
                              <ArrowCounterClockwise weight="regular" className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                          <Clock weight="regular" className="w-3 h-3" />
                          {formatDate(version.createdAt)}
                        </div>
                        {version.notes && (
                          <p className="text-xs text-muted-foreground mb-2">{version.notes}</p>
                        )}
                        <div className="text-xs text-muted-foreground bg-background rounded p-2 max-h-20 overflow-y-auto">
                          {version.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {promptVersions.length === 0 && (
                <div className="text-center py-8">
                  <GitBranch weight="regular" className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--ui-muted-text-faint)', opacity: 0.3 }} />
                  <p className="text-sm text-muted-foreground">No versions saved</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Save versions to track your prompt evolution
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
