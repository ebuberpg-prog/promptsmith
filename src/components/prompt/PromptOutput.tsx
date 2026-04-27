import { usePromptSmithStore } from '@/store/prompt-store'
import {
  Minus,
  Plus,
  X,
  CheckCircle as CheckCircleIcon,
  Copy,
  Trash,
  CaretDown,
  PencilSimple,
  ImageSquare,
} from '@phosphor-icons/react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { imageGenService, type ImageGenState } from '@/services/image-gen-service'
import { NegativePromptIntelligence } from '@/components/negative/NegativePromptIntelligence'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function PromptOutput() {
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)
  const generateNegativePrompt = usePromptSmithStore((s) => s.generateNegativePrompt)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const removeTag = usePromptSmithStore((s) => s.removeTag)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const customText = usePromptSmithStore((s) => s.customText)
  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const aiSettings = usePromptSmithStore((s) => s.aiSettings)

  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [expertMode, setExpertMode] = useState(false)
  const [imageGenState, setImageGenState] = useState<ImageGenState>(imageGenService.getState())
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const prompt = generatePrompt()
  const negativePrompt = generateNegativePrompt()
  const hasContent = selectedTags.length > 0 || customText.trim()

  // Sync image gen service URLs from settings and subscribe to state
  useEffect(() => {
    imageGenService.setUrls(aiSettings.a1111Url, aiSettings.comfyuiUrl, aiSettings.drawthingsUrl)
    const unsub = imageGenService.subscribe(setImageGenState)
    return () => { unsub() }
  }, [aiSettings.a1111Url, aiSettings.comfyuiUrl, aiSettings.drawthingsUrl])

  const handleCopy = async () => {
    let fullPrompt = prompt
    if (selectedModel === 'midjourney') fullPrompt += ' --v 6 --ar 16:9'
    await navigator.clipboard.writeText(fullPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setImageError(null)
    setGeneratedImage(null)

    try {
      // Auto-discover provider if none active
      if (!imageGenState.activeProvider) {
        await imageGenService.discover(aiSettings.preferredImageProvider)
        const state = imageGenService.getState()
        if (!state.activeProvider) {
          setImageError('No image generation provider found. Start A1111, ComfyUI, or DrawThings.')
          return
        }
      }
      const result = await imageGenService.generate({
        prompt,
        negativePrompt: negativePrompt || undefined,
        width: 512,
        height: 512,
        steps: 20,
      })
      if (result.images.length > 0) {
        setGeneratedImage(result.images[0])
      }
    } catch (err) {
      setImageError(String(err))
    }
  }, [prompt, negativePrompt, imageGenState.activeProvider, aiSettings.preferredImageProvider])

  return (
    <div className="flex flex-col h-full gap-3 p-4">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#c2c2c2] uppercase tracking-widest">Your Prompt</span>
          {hasContent && (
            <button
              onClick={clearAllTags}
              className="text-xs text-[#c2c2c2]/50 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NegativePromptIntelligence />
          <button
            onClick={() => setExpertMode(e => !e)}
            className={cn(
              "text-xs font-medium px-3 py-1 rounded-full border transition-colors duration-150",
              expertMode
                ? "border-[#f5f5f5]/40 text-[#f5f5f5]"
                : "border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
            )}
          >
            {expertMode ? 'Expert' : 'Simple'}
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            disabled={!hasContent}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
              copied
                ? "border-[#f5f5f5]/40 text-[#f5f5f5] bg-white/10"
                : hasContent
                  ? "bg-[#f5f5f5] text-black border-[#f5f5f5] hover:bg-[#e0e0e0]"
                  : "border-[#333] text-[#c2c2c2]/40 cursor-not-allowed"
            )}
          >
            {copied
              ? <CheckCircleIcon weight="fill" className="w-3.5 h-3.5" />
              : <Copy weight="regular" className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy prompt'}
          </motion.button>
        </div>
      </div>

      {/* Tag chips + inline custom text */}
      <div className="flex-1 min-h-[72px] border border-[#333] rounded-xl p-3 flex flex-wrap content-start gap-2 overflow-y-auto scrollbar-hide hover:border-[#444] transition-colors duration-150">
        {selectedTags.map((tag) => (
          <TokenChip
            key={tag.id}
            tag={tag}
            onRemove={() => removeTag(tag.id)}
            showWeight={expertMode}
          />
        ))}

        {/* Inline custom text input */}
        {showCustomInput ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#555] min-w-[160px]">
            <input
              autoFocus
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onBlur={() => { if (!customText.trim()) setShowCustomInput(false) }}
              placeholder="Add your own words..."
              className="bg-transparent text-sm text-[#f5f5f5] placeholder:text-[#c2c2c2]/40 outline-none w-full min-w-[120px]"
            />
            {customText && (
              <button onClick={() => { setCustomText(''); setShowCustomInput(false) }} className="text-[#c2c2c2] hover:text-[#f5f5f5]">
                <X weight="bold" className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[#333] text-[#c2c2c2]/40 hover:text-[#c2c2c2] hover:border-[#555] transition-colors duration-150 text-xs"
          >
            <PencilSimple weight="regular" className="w-3 h-3" />
            {customText.trim() ? customText : 'Add your own words...'}
          </button>
        )}

        {!hasContent && !showCustomInput && (
          <div className="w-full flex items-center justify-center py-3">
            <p className="text-xs text-[#c2c2c2]/30 font-sans">
              Pick tags from the categories — your prompt builds here automatically
            </p>
          </div>
        )}
      </div>

      {/* Generated prompt preview */}
      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs font-mono text-[#c2c2c2]/50 leading-relaxed border-t border-[#222] pt-2 line-clamp-2">
              {prompt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced toggle */}
      {hasContent && (
        <div>
          <button
            onClick={() => setShowAdvanced(a => !a)}
            className="flex items-center gap-1 text-[10px] text-[#c2c2c2]/40 hover:text-[#c2c2c2] uppercase tracking-widest transition-colors"
          >
            <CaretDown weight="bold" className={cn("w-2.5 h-2.5 transition-transform duration-150", showAdvanced && "rotate-180")} />
            Advanced
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden mt-3 space-y-4"
              >
                {/* Weight controls */}
                <div>
                  <p className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-widest mb-2">Tag strength</p>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-hide">
                    {selectedTags.map((tag) => (
                      <WeightControl key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} expertMode={expertMode} />
                    ))}
                  </div>
                </div>

                {negativePrompt && (
                  <div>
                    <p className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-widest mb-1.5">Negative prompt</p>
                    <p className="text-xs font-mono text-[#c2c2c2]/50 leading-relaxed border border-[#222] rounded-lg px-3 py-2">
                      {negativePrompt}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Image generation panel */}
      <div className="border-t border-[#1a1a1a] pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageSquare weight="regular" className="w-3.5 h-3.5 text-[#c2c2c2]/50" />
            <span className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-widest">Generate Image</span>
          </div>
          {imageGenState.activeProvider && (
            <span className="text-[9px] border border-green-500/30 text-green-500/60 rounded-full px-2 py-0.5 uppercase tracking-wider">
              {imageGenState.activeProvider}
            </span>
          )}
          {!imageGenState.activeProvider && imageGenState.status !== 'checking' && (
            <span className="text-[9px] border border-[#333] text-[#c2c2c2]/30 rounded-full px-2 py-0.5 uppercase tracking-wider">
              No provider
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={!hasContent || imageGenState.status === 'generating'}
          className={cn(
            "w-full py-2 rounded-xl text-xs font-medium border transition-all duration-150 flex items-center justify-center gap-2",
            hasContent && imageGenState.status !== 'generating'
              ? "border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
              : "border-[#222] text-[#c2c2c2]/30 cursor-not-allowed"
          )}
        >
          {imageGenState.status === 'generating' ? (
            <>
              <span className="w-3 h-3 rounded-full border border-[#555] border-t-[#f5f5f5] animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <ImageSquare weight="regular" className="w-3.5 h-3.5" />
              Generate
            </>
          )}
        </motion.button>

        {imageError && (
          <p className="text-[10px] text-red-400/70 leading-relaxed">{imageError}</p>
        )}

        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative rounded-xl overflow-hidden border border-[#222] group"
            >
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-xl"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <a
                  href={generatedImage}
                  download="muse-generated.png"
                  className="px-3 py-1.5 rounded-full bg-black/80 border border-[#555] text-xs text-[#f5f5f5] hover:border-[#888] transition-colors"
                >
                  Download
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TokenChip({
  tag,
  onRemove,
  showWeight,
}: {
  tag: { id: string; label: string; customWeight?: number }
  onRemove: () => void
  showWeight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#555] text-[#f5f5f5] text-xs font-medium hover:border-[#777] transition-colors group"
    >
      <span>{tag.label}</span>
      {showWeight && tag.customWeight && tag.customWeight !== 1.0 && (
        <span className="text-[10px] font-mono text-[#c2c2c2]/60">{tag.customWeight.toFixed(1)}</span>
      )}
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-[#c2c2c2] hover:text-[#f5f5f5] transition-all ml-0.5">
        <X weight="bold" className="w-2.5 h-2.5" />
      </button>
    </motion.div>
  )
}

function WeightControl({
  tag,
  onRemove,
  expertMode,
}: {
  tag: { id: string; label: string; customWeight?: number }
  onRemove: () => void
  expertMode: boolean
}) {
  const [weight, setWeight] = useState(tag.customWeight || 1.0)

  const adjust = (delta: number) => {
    setWeight(prev => Math.max(0.1, Math.min(2.0, Number((prev + delta).toFixed(1)))))
  }

  if (!expertMode) {
    const level = weight < 0.8 ? 'Low' : weight > 1.3 ? 'High' : 'Normal'
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#333] hover:border-[#555] transition-colors group">
        <span className="text-xs text-[#c2c2c2] truncate max-w-[80px]">{tag.label}</span>
        <div className="flex items-center gap-0.5">
          {(['Low', 'Normal', 'High'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setWeight(l === 'Low' ? 0.6 : l === 'Normal' ? 1.0 : 1.5)}
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors duration-150",
                level === l
                  ? "bg-[#f5f5f5] text-black"
                  : "text-[#c2c2c2]/50 hover:text-[#c2c2c2]"
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={onRemove} className="hidden group-hover:flex text-[#c2c2c2]/40 hover:text-red-400 transition-colors">
          <Trash weight="regular" className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#333] hover:border-[#555] transition-colors group">
      <span className="text-xs text-[#c2c2c2] truncate max-w-[80px]">{tag.label}</span>
      <div className="flex items-center gap-0.5 border border-[#333] rounded-full px-1">
        <button onClick={() => adjust(-0.1)} className="p-0.5 text-[#c2c2c2] hover:text-[#f5f5f5] transition-colors">
          <Minus weight="bold" className="w-2.5 h-2.5" />
        </button>
        <span className="text-[10px] font-mono text-[#f5f5f5] w-6 text-center">{weight.toFixed(1)}</span>
        <button onClick={() => adjust(0.1)} className="p-0.5 text-[#c2c2c2] hover:text-[#f5f5f5] transition-colors">
          <Plus weight="bold" className="w-2.5 h-2.5" />
        </button>
      </div>
      <button onClick={onRemove} className="hidden group-hover:flex text-[#c2c2c2]/40 hover:text-red-400 transition-colors">
        <Trash weight="regular" className="w-3 h-3" />
      </button>
    </div>
  )
}
