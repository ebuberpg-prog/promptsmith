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
} from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import type { SupportedModel } from '@/types'
import { AISettingsPanel } from '@/components/settings/AISettingsPanel'
import { LMPromptEnhancer } from '@/components/ai/LMPromptEnhancer'

const MODELS: { id: SupportedModel; label: string; version: string }[] = [
  { id: 'midjourney', label: 'Midjourney', version: 'v6' },
  { id: 'stable-diffusion', label: 'SDXL', version: '1.0' },
  { id: 'dalle-3', label: 'DALL-E', version: '3' },
  { id: 'flux', label: 'FLUX', version: '1.0' },
  { id: 'ideogram', label: 'Ideogram', version: '2.0' },
]

export function Header() {
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)
  const toggleExplicit = usePromptSmithStore((s) => s.toggleExplicit)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const setSelectedModel = usePromptSmithStore((s) => s.setSelectedModel)

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

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0]

  return (
    <>
    <header className="h-14 flex items-center px-6 gap-6 border-b border-[#333] bg-black">

      {/* Logo — editorial serif */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full border border-[#333] flex items-center justify-center">
          <Lightning weight="fill" className="w-3.5 h-3.5 text-[#f5f5f5]" />
        </div>
        <div>
          <span className="font-display text-lg font-normal text-[#f5f5f5] leading-none tracking-tight">
            MUSE
          </span>
        </div>
      </div>

      <div className="w-px h-4 bg-[#333]" />

      {/* Model selector — pill, click to open */}
      <div className="relative" ref={modelRef}>
        <button
          onClick={() => setModelOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#333] hover:border-[#555] transition-colors duration-150 text-sm"
        >
          <span className="text-[#f5f5f5] font-medium">{currentModel.label}</span>
          <span className="text-[10px] text-[#c2c2c2] font-mono">{currentModel.version}</span>
          <CaretDown weight="bold" className={`w-3 h-3 text-[#c2c2c2] transition-transform duration-150 ${modelOpen ? 'rotate-180' : ''}`} />
        </button>

        {modelOpen && (
          <div className="absolute top-full left-0 mt-2 py-1.5 min-w-[180px] bg-[#0d0d0d] border border-[#333] rounded-xl shadow-editorial z-50">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedModel(m.id); setModelOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c2c2c2] hover:text-[#f5f5f5] hover:bg-white/5 transition-colors"
              >
                <span className="font-medium">{m.label}</span>
                <span className="ml-1 text-[10px] font-mono text-[#c2c2c2]/50">{m.version}</span>
                {selectedModel === m.id && (
                  <CheckCircle weight="fill" className="ml-auto w-3.5 h-3.5 text-[#f5f5f5]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">

        {/* AI Enhance */}
        <LMPromptEnhancer />

        <div className="w-px h-4 bg-[#333]" />

        {/* Safe mode toggle */}
        <button
          onClick={toggleExplicit}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors duration-150 text-xs font-medium ${
            showExplicit
              ? 'border-red-900/60 text-red-400 hover:border-red-800'
              : 'border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]'
          }`}
        >
          {showExplicit
            ? <Eye weight="regular" className="w-3.5 h-3.5" />
            : <EyeSlash weight="regular" className="w-3.5 h-3.5" />}
          <span className="hidden xl:block">{showExplicit ? 'Unfiltered' : 'Safe'}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent text-[#c2c2c2] hover:text-[#f5f5f5] hover:border-[#333] transition-colors duration-150"
          title="Local connections"
        >
          <Gear weight="regular" className="w-4 h-4" />
        </button>

        {/* More menu */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent text-[#c2c2c2] hover:text-[#f5f5f5] hover:border-[#333] transition-colors duration-150"
          >
            <DotsThree weight="bold" className="w-4 h-4" />
          </button>

          {moreOpen && (
            <div className="absolute top-full right-0 mt-2 py-1.5 min-w-[160px] bg-[#0d0d0d] border border-[#333] rounded-xl shadow-editorial z-50">
              <MenuItem icon={<FloppyDisk weight="regular" className="w-3.5 h-3.5" />} label="Save workspace" />
              <MenuItem icon={<FolderOpen weight="regular" className="w-3.5 h-3.5" />} label="Open project" />
              <MenuItem icon={<ClockCounterClockwise weight="regular" className="w-3.5 h-3.5" />} label="History" />
              <div className="my-1 border-t border-[#333]" />
              <MenuItem icon={<Download weight="regular" className="w-3.5 h-3.5" />} label="Export" />
              <MenuItem icon={<Stack weight="regular" className="w-3.5 h-3.5" />} label="Batch generate" />
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
      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#c2c2c2] hover:text-[#f5f5f5] hover:bg-white/5 transition-colors"
    >
      <span className="text-[#c2c2c2]/60">{icon}</span>
      {label}
    </button>
  )
}
