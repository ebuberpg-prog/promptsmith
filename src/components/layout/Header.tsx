import { usePromptSmithStore } from '@/store/prompt-store'
import {
  Eye,
  EyeSlash,
  Gear,
  CaretDown,
  Lightning,
  CheckCircle,
  Moon,
  Sun,
  MagnifyingGlass,
  ArrowUUpLeft,
  ArrowUUpRight,
} from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import { AISettingsPanel } from '@/components/settings/AISettingsPanel'
import { LMPromptEnhancer } from '@/components/ai/LMPromptEnhancer'
import { MODEL_GROUPS, getModelConfig } from '@/data/model-configs'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSearchOpen: () => void
}

export function Header({ theme, onToggleTheme, onSearchOpen }: HeaderProps) {
  const contentVisibility = usePromptSmithStore((s) => s.contentVisibility)
  const toggleContentVisibility = usePromptSmithStore((s) => s.toggleContentVisibility)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const setSelectedModel = usePromptSmithStore((s) => s.setSelectedModel)
  const undo = usePromptSmithStore((s) => s.undo)
  const redo = usePromptSmithStore((s) => s.redo)
  const canUndo = usePromptSmithStore((s) => s.canUndo)
  const canRedo = usePromptSmithStore((s) => s.canRedo)

  const [modelOpen, setModelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentModel = getModelConfig(selectedModel)

  return (
    <>
    <header className="h-14 flex items-center px-4 sm:px-5 gap-4 sm:gap-5 border-b safe-top" style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--ui-border)' }}>
          <Lightning weight="fill" className="w-3.5 h-3.5" style={{ color: 'var(--ui-text)' }} />
        </div>
        <span className="font-display text-lg font-normal leading-none tracking-tight hidden sm:block" style={{ color: 'var(--ui-text)' }}>
          MUSE
        </span>
      </div>

      <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ backgroundColor: 'var(--ui-border)' }} />

      {/* Model selector */}
      <div className="relative" ref={modelRef}>
        <button
          onClick={() => setModelOpen(o => !o)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors duration-150 text-[13px] min-h-[40px]"
          style={{ borderColor: 'var(--ui-border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
        >
          <span className="font-medium" style={{ color: 'var(--ui-text)' }}>{currentModel.name}</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--ui-muted-text)' }}>{currentModel.version}</span>
          <CaretDown weight="bold" className={`w-3 h-3 transition-transform duration-150 ${modelOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--ui-muted-text)' }} />
        </button>

        <button
          onClick={() => setModelOpen(o => !o)}
          className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors duration-150 text-[12px] min-h-[36px]"
          style={{ borderColor: 'var(--ui-border)' }}
        >
          <span className="font-medium truncate max-w-[84px]" style={{ color: 'var(--ui-text)' }}>{currentModel.name}</span>
          <CaretDown weight="bold" className={`w-3 h-3 transition-transform duration-150 ${modelOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--ui-muted-text)' }} />
        </button>

        {modelOpen && (
          <div className="absolute top-full left-0 mt-2 py-2 min-w-[220px] border rounded-xl shadow-lg z-50" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            {MODEL_GROUPS.map(group => (
              <div key={group.label} className="mb-1 last:mb-0">
                <div className="px-4 py-1 text-[9px] uppercase tracking-wider font-medium" style={{ color: 'var(--ui-muted-text-faint)' }}>{group.label}</div>
                {group.models.map(m => {
                  const cfg = getModelConfig(m)
                  return (
                    <button
                      key={m}
                      onClick={() => { setSelectedModel(m); setModelOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors min-h-[40px]"
                      style={{ color: 'var(--ui-muted-text)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)'; e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span className="font-medium">{cfg.name}</span>
                      <span className="ml-1 text-[10px] font-mono" style={{ color: 'var(--ui-muted-text-faint)' }}>{cfg.version}</span>
                      {selectedModel === m && (
                        <CheckCircle weight="fill" className="ml-auto w-3.5 h-3.5" style={{ color: 'var(--ui-text)' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* AI Enhance */}
        <LMPromptEnhancer />

        <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: 'var(--ui-border)' }} />
        {/* Search (mobile) */}
        <button
          onClick={onSearchOpen}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent transition-colors duration-150 sm:hidden"
          style={{ color: 'var(--ui-muted-text)' }}
          aria-label="Search"
        >
          <MagnifyingGlass weight="regular" className="w-4 h-4" />
        </button>

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent transition-colors duration-150 disabled:opacity-30"
            style={{ color: 'var(--ui-muted-text)' }}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <ArrowUUpLeft weight="regular" className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent transition-colors duration-150 disabled:opacity-30"
            style={{ color: 'var(--ui-muted-text)' }}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <ArrowUUpRight weight="regular" className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: 'var(--ui-border)' }} />

        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent transition-colors duration-150"
          style={{ color: 'var(--ui-muted-text)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun weight="regular" className="w-4 h-4" />
            : <Moon weight="regular" className="w-4 h-4" />}
        </button>

        {/* Taxonomy visibility toggle */}
        <button
          onClick={toggleContentVisibility}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors duration-150 text-[11px] font-medium min-h-[36px] sm:min-h-[40px] ${
            contentVisibility === 'all'
              ? 'border-red-900/60 text-red-400'
              : ''
          }`}
          style={contentVisibility === 'all' ? {} : { borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
          aria-label={contentVisibility === 'all' ? 'Showing all taxonomy tags' : 'Showing filtered taxonomy tags'}
        >
          {contentVisibility === 'all'
            ? <Eye weight="regular" className="w-3.5 h-3.5" />
            : <EyeSlash weight="regular" className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{contentVisibility === 'all' ? 'All tags' : 'Filtered tags'}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent transition-colors duration-150"
          style={{ color: 'var(--ui-muted-text)' }}
          title="Local connections"
        >
          <Gear weight="regular" className="w-4 h-4" />
        </button>
      </div>
    </header>

    <AISettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
