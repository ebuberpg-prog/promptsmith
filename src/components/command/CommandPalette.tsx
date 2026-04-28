import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, Tag, User, TerminalWindow, X } from '@phosphor-icons/react'
import { useCommandPalette, type CommandResult } from '@/hooks/useCommandPalette'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { getGroupForCategory } from '@/data/category-colors'

const ICON_MAP: Record<string, React.ElementType> = {
  tag: Tag,
  template: User,
  command: TerminalWindow,
}

function ResultItem({
  result,
  index,
  isSelected,
  onSelect,
}: {
  result: CommandResult
  index: number
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
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--ui-overlay)] z-50"
            onClick={() => setOpen(false)}
          />

          {isMobileView ? (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] rounded-t-2xl max-h-[80vh] flex flex-col safe-bottom"
              role="dialog"
              aria-label="Search"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ui-border)]">
                <div className="relative flex-1 mr-3">
                  <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ui-muted-text)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search tags, templates, commands..."
                    className="w-full pl-9 pr-4 py-2.5 bg-transparent border border-[var(--ui-border)] rounded-xl outline-none focus:border-[var(--ui-border-hover)] transition-colors text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text-faint)]"
                    aria-label="Search query"
                  />
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors"
                  aria-label="Close search"
                >
                  <X weight="bold" className="w-4 h-4" />
                </button>
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
                      index={index}
                      isSelected={index === selectedIndex}
                      onSelect={() => selectResult(index)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-lg overflow-hidden pointer-events-auto"
              role="dialog"
              aria-label="Command palette"
            >
              <div className="flex items-center px-4 border-b border-[var(--ui-border)]">
                <MagnifyingGlass weight="regular" className="w-4 h-4 text-[var(--ui-muted-text)]" />
                <input
                  ref={inputRef}
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
                      index={index}
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
            </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
