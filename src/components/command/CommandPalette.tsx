import { useRef, useEffect } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Cpu, MagnifyingGlass, Tag, User, TerminalWindow, X } from '@phosphor-icons/react'
import { useCommandPalette, type CommandResult } from '@/hooks/useCommandPalette'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const ICON_MAP: Record<string, React.ElementType> = {
  tag: Tag,
  template: User,
  model: Cpu,
  command: TerminalWindow,
}

function ResultItem({
  result,
  isSelected,
  onSelect,
}: {
  result: CommandResult
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = ICON_MAP[result.type] || Tag

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-[var(--ui-surface-soft)] text-[var(--ui-text)]'
          : 'text-[var(--ui-muted-text)] hover:text-[var(--ui-text)]'
      }`}
      role="option"
      aria-selected={isSelected}
    >
      <Icon weight={isSelected ? 'fill' : 'regular'} className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{result.label}</span>
        {result.description && (
          <span className="text-xs text-[var(--ui-muted-text-faint)] truncate block">{result.description}</span>
        )}
      </div>
      {result.group && (
        <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider">
          {result.group}
        </span>
      )}
    </button>
  )
}

export function CommandPalette() {
  const { open, setOpen, query, setQuery, results, selectedIndex, selectResult, navigateResults } = useCommandPalette()
  const { isMobile, isTabletSmall } = useBreakpoint()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selected = listRef.current.querySelector('[aria-selected="true"]')
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      navigateResults('down')
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      navigateResults('up')
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      selectResult(selectedIndex)
    }
  }

  const isMobileView = isMobile || isTabletSmall

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-[var(--ui-overlay)] z-40" />
        {isMobileView ? (
            <Dialog.Popup
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] rounded-t-2xl max-h-[80vh] flex flex-col safe-bottom"
              aria-label="Search"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ui-border)]">
                <div className="relative flex-1 mr-3">
                  <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ui-muted-text)]" />
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search tags, templates, commands..."
                    className="w-full pl-9 pr-4 py-2.5 bg-transparent border border-[var(--ui-border)] rounded-xl outline-none focus:border-[var(--ui-border-hover)] transition-colors text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text-faint)]"
                    aria-label="Search query"
                  />
                </div>
                <Dialog.Close
                  className="size-11 rounded-full text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] flex items-center justify-center"
                  aria-label="Close search"
                >
                  <X weight="bold" className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto" role="listbox">
                {results.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[var(--ui-muted-text-faint)]">No results found</p>
                  </div>
                ) : (
                  results.map((result, index) => (
                    <ResultItem
                      key={result.id}
                      result={result}

                      isSelected={index === selectedIndex}
                      onSelect={() => selectResult(index)}
                    />
                  ))
                )}
              </div>
            </Dialog.Popup>
          ) : (
            <Dialog.Popup
              className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-lg overflow-hidden"
              aria-label="Command palette"
            >
              <div className="flex items-center px-4 border-b border-[var(--ui-border)]">
                <MagnifyingGlass weight="regular" className="w-4 h-4 text-[var(--ui-muted-text)]" />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search tags, templates, commands..."
                  className="flex-1 px-3 py-3.5 bg-transparent outline-none text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text-faint)]"
                  aria-label="Search query"
                />
                <kbd className="text-[10px] text-[var(--ui-muted-text-faint)] font-mono bg-[var(--ui-surface)] px-1.5 py-0.5 rounded">ESC</kbd>
              </div>

              <div ref={listRef} className="max-h-80 overflow-y-auto" role="listbox">
                {results.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[var(--ui-muted-text-faint)]">No results found</p>
                  </div>
                ) : (
                  results.map((result, index) => (
                    <ResultItem
                      key={result.id}
                      result={result}

                      isSelected={index === selectedIndex}
                      onSelect={() => selectResult(index)}
                    />
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-[var(--ui-border)] flex items-center gap-4 text-[10px] text-[var(--ui-muted-text-faint)]">
                <span><kbd className="font-mono">Up/Down</kbd> navigate</span>
                <span><kbd className="font-mono">Enter</kbd> select</span>
                <span><kbd className="font-mono">Esc</kbd> close</span>
              </div>
            </Dialog.Popup>
          )}
      </Dialog.Portal>
    </Dialog.Root>
  )
}
