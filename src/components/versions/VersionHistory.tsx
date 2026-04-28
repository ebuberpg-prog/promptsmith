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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated border hover:text-[var(--ui-text)] transition-colors"
        style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border)' }}
      >
        <ClockCounterClockwise weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Versions</span>
        {promptVersions.length > 0 && (
          <span
            className="ml-1 px-1.5 py-0.5 text-xs rounded"
            style={{ backgroundColor: 'color-mix(in oklab, var(--ui-text) 20%, transparent)', color: 'var(--ui-text)' }}
          >
            {promptVersions.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--ui-overlay)' }}>
          <div className="border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2">
                <ClockCounterClockwise weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>Prompt Version History</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--ui-muted-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ui-text)' }}>Save Current Version</h3>
                <div className="space-y-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Version notes (optional)"
                    className="w-full px-2 py-1.5 border rounded text-sm resize-none h-16 outline-none"
                    style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                  />
                  <div className="text-xs" style={{ color: 'var(--ui-muted-text)' }}>
                    Current: {generatePrompt().substring(0, 50)}...
                  </div>
                  <button
                    onClick={handleCreateVersion}
                    className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity"
                    style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
                  >
                    <Plus weight="regular" className="w-4 h-4" />
                    Save Version
                  </button>
                </div>
              </div>

              {promptVersions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Version History</h3>
                  {promptVersions
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <div
                        key={version.id}
                        className="border rounded-lg p-3"
                        style={{
                          backgroundColor: 'var(--ui-surface-elevated)',
                          borderColor: currentVersion === version.version ? 'var(--ui-border-hover)' : 'var(--ui-border)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>
                              Version {version.version}
                            </span>
                            {currentVersion === version.version && (
                              <span
                                className="px-1.5 py-0.5 text-[10px] rounded"
                                style={{ backgroundColor: 'color-mix(in oklab, var(--ui-text) 20%, transparent)', color: 'var(--ui-text)' }}
                              >
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => loadVersion(version.version)}
                              className="p-1 rounded transition-colors"
                              style={{ color: 'var(--ui-muted-text)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-bg)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              title="Load version"
                            >
                              <ArrowCounterClockwise weight="regular" className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] mb-2" style={{ color: 'var(--ui-muted-text)' }}>
                          <Clock weight="regular" className="w-3 h-3" />
                          {formatDate(version.createdAt)}
                        </div>
                        {version.notes && (
                          <p className="text-xs mb-2" style={{ color: 'var(--ui-muted-text)' }}>{version.notes}</p>
                        )}
                        <div className="text-xs rounded p-2 max-h-20 overflow-y-auto" style={{ backgroundColor: 'var(--ui-bg)', color: 'var(--ui-muted-text)' }}>
                          {version.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {promptVersions.length === 0 && (
                <div className="text-center py-8">
                  <GitBranch weight="regular" className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--ui-muted-text-faint)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>No versions saved</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ui-muted-text)' }}>
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
