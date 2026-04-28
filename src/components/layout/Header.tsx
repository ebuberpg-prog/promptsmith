import { usePromptSmithStore } from '@/store/prompt-store'
import {
  Eye,
  EyeSlash,
  Gear,
  CaretDown,
  Lightning,
  CheckCircle,
  DotsThree,
  FloppyDisk,
  FolderOpen,
  ClockCounterClockwise,
  Download,
  Stack,
  Moon,
  Sun,
  MagnifyingGlass,
  ArrowUUpLeft,
  ArrowUUpRight,
} from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import type { SupportedModel } from '@/types'
import { AISettingsPanel } from '@/components/settings/AISettingsPanel'
import { LMPromptEnhancer } from '@/components/ai/LMPromptEnhancer'
import { MODEL_GROUPS, getModelConfig } from '@/data/model-configs'
import { VersionHistory } from '@/components/versions/VersionHistory'
import { PromptDiff } from '@/components/diff/PromptDiff'
import { ABTesting } from '@/components/abtest/ABTesting'
import { StyleTransferMatrix } from '@/components/style/StyleTransferMatrix'
import { BatchGeneration } from '@/components/batch/BatchGeneration'
import { DNARecipeManager } from '@/components/dna/DNARecipeManager'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSearchOpen: () => void
}

export function Header({ theme, onToggleTheme, onSearchOpen }: HeaderProps) {
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)
  const toggleExplicit = usePromptSmithStore((s) => s.toggleExplicit)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const setSelectedModel = usePromptSmithStore((s) => s.setSelectedModel)
  const aiSettings = usePromptSmithStore((s) => s.aiSettings)
  const undo = usePromptSmithStore((s) => s.undo)
  const redo = usePromptSmithStore((s) => s.redo)
  const canUndo = usePromptSmithStore((s) => s.canUndo)
  const canRedo = usePromptSmithStore((s) => s.canRedo)

  const [modelOpen, setModelOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentModel = getModelConfig(selectedModel)

  return (
    <>
    <header className="h-14 flex items-center px-4 sm:px-6 gap-4 sm:gap-6 border-b safe-top" style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--ui-border)' }}>
          <Lightning weight="fill" className="w-3.5 h-3.5" style={{ color: 'var(--ui-text)' }} />
        </div>
        <span className="font-display text-lg font-normal leading-none tracking-tight hidden sm:block" style={{ color: 'var(--ui-text)' }}>
          MUSE
        </span>
      </div>

      <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ backgroundColor: 'var(--ui-border)' }} />

      {/* Model selector */}
      <div className="relative hidden sm:block" ref={modelRef}>
        <button
          onClick={() => setModelOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors duration-150 text-sm min-h-[44px]"
          style={{ borderColor: 'var(--ui-border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
        >
          <span className="font-medium" style={{ color: 'var(--ui-text)' }}>{currentModel.name}</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--ui-muted-text)' }}>{currentModel.version}</span>
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
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors min-h-[44px]"
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

      {/* AI Provider quick-switch */}
      {aiSettings.preferredAIProvider && (
        <>
          <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ backgroundColor: 'var(--ui-border)' }} />
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                const providers = ['ollama', 'lmstudio', 'openai'].filter(p => {
                  if (p === 'ollama') return true
                  if (p === 'lmstudio') return true
                  if (p === 'openai') return aiSettings.openaiUrl && aiSettings.openaiApiKey
                  return false
                })
                if (providers.length > 1) {
                  const currentIdx = providers.indexOf(aiSettings.preferredAIProvider!)
                  const nextIdx = (currentIdx + 1) % providers.length
                  usePromptSmithStore.getState().updateAISettings({ preferredAIProvider: providers[nextIdx] as 'ollama' | 'lmstudio' | 'openai' })
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 text-[10px] uppercase tracking-wider min-h-[44px]"
              style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
              title="Click to cycle AI provider"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--success) / 0.7)' }} />
              <span>{aiSettings.preferredAIProvider}</span>
            </button>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">

        {/* Search (mobile) */}
        <button
          onClick={onSearchOpen}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-colors duration-150 sm:hidden"
          style={{ color: 'var(--ui-muted-text)' }}
          aria-label="Search"
        >
          <MagnifyingGlass weight="regular" className="w-4 h-4" />
        </button>

        {/* Search (desktop) */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors duration-150 text-xs min-h-[44px]"
          style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
        >
          <MagnifyingGlass weight="regular" className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="text-[10px] font-mono" style={{ color: 'var(--ui-muted-text-faint)' }}>K</kbd>
        </button>

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-colors duration-150 disabled:opacity-30"
            style={{ color: 'var(--ui-muted-text)' }}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <ArrowUUpLeft weight="regular" className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-colors duration-150 disabled:opacity-30"
            style={{ color: 'var(--ui-muted-text)' }}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <ArrowUUpRight weight="regular" className="w-4 h-4" />
          </button>
        </div>

        {/* Tool buttons */}
        <div className="hidden sm:flex items-center gap-1">
          <VersionHistory />
          <PromptDiff />
          <ABTesting />
        </div>
        <div className="hidden md:flex items-center gap-1">
          <StyleTransferMatrix />
          <DNARecipeManager />
          <BatchGeneration />
        </div>

        {/* AI Enhance */}
        <LMPromptEnhancer />

        <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: 'var(--ui-border)' }} />

        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-colors duration-150"
          style={{ color: 'var(--ui-muted-text)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun weight="regular" className="w-4 h-4" />
            : <Moon weight="regular" className="w-4 h-4" />}
        </button>

        {/* Safe mode toggle */}
        <button
          onClick={toggleExplicit}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors duration-150 text-xs font-medium min-h-[44px] ${
            showExplicit
              ? 'border-red-900/60 text-red-400'
              : ''
          }`}
          style={showExplicit ? {} : { borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
          onMouseEnter={(e) => { if (!showExplicit) { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' } }}
          onMouseLeave={(e) => { if (!showExplicit) { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' } }}
        >
          {showExplicit
            ? <Eye weight="regular" className="w-3.5 h-3.5" />
            : <EyeSlash weight="regular" className="w-3.5 h-3.5" />}
          <span className="hidden xl:block">{showExplicit ? 'Unfiltered' : 'Safe'}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-colors duration-150"
          style={{ color: 'var(--ui-muted-text)' }}
          title="Local connections"
        >
          <Gear weight="regular" className="w-4 h-4" />
        </button>

        {/* More menu */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-colors duration-150"
            style={{ color: 'var(--ui-muted-text)' }}
          >
            <DotsThree weight="bold" className="w-4 h-4" />
          </button>

          {moreOpen && (
            <div className="absolute top-full right-0 mt-2 py-1.5 min-w-[180px] border rounded-xl shadow-lg z-50" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
              {/* Tools — shown on mobile/tablet where header buttons are hidden */}
              <div className="sm:hidden">
                <div className="px-3 py-1 text-[9px] uppercase tracking-wider font-medium" style={{ color: 'var(--ui-muted-text-faint)' }}>Tools</div>
                <div onClick={() => setMoreOpen(false)}><VersionHistory /></div>
                <div onClick={() => setMoreOpen(false)}><PromptDiff /></div>
                <div onClick={() => setMoreOpen(false)}><ABTesting /></div>
                <div onClick={() => setMoreOpen(false)}><StyleTransferMatrix /></div>
                <div onClick={() => setMoreOpen(false)}><DNARecipeManager /></div>
                <div onClick={() => setMoreOpen(false)}><BatchGeneration /></div>
                <div className="my-1" style={{ borderTop: '1px solid var(--ui-border-faint)' }} />
              </div>
              <div className="md:hidden hidden sm:block">
                <div className="px-3 py-1 text-[9px] uppercase tracking-wider font-medium" style={{ color: 'var(--ui-muted-text-faint)' }}>Tools</div>
                <div onClick={() => setMoreOpen(false)}><StyleTransferMatrix /></div>
                <div onClick={() => setMoreOpen(false)}><DNARecipeManager /></div>
                <div onClick={() => setMoreOpen(false)}><BatchGeneration /></div>
                <div className="my-1" style={{ borderTop: '1px solid var(--ui-border-faint)' }} />
              </div>
              <MenuItem icon={<FloppyDisk weight="regular" className="w-3.5 h-3.5" />} label="Save workspace" />
              <MenuItem icon={<FolderOpen weight="regular" className="w-3.5 h-3.5" />} label="Open project" />
              <MenuItem icon={<ClockCounterClockwise weight="regular" className="w-3.5 h-3.5" />} label="History" />
              <div className="my-1" style={{ borderTop: '1px solid var(--ui-border-faint)' }} />
              <MenuItem icon={<Download weight="regular" className="w-3.5 h-3.5" />} label="Export" />
            </div>
          )}
        </div>
      </div>
    </header>

    <AISettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors min-h-[44px]"
      style={{ color: 'var(--ui-muted-text)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)'; e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)'; e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <span style={{ color: 'var(--ui-muted-text-faint)' }}>{icon}</span>
      {label}
    </button>
  )
}
