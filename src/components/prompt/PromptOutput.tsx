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
  TagSimple,
  Lightning,
  ClockCounterClockwise,
  GitDiff,
  ChartBar,
} from '@phosphor-icons/react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { imageGenService, type ImageGenState } from '@/services/image-gen-service'
import { NegativePromptIntelligence } from '@/components/negative/NegativePromptIntelligence'
import { VersionHistory } from '@/components/versions/VersionHistory'
import { PromptDiff } from '@/components/diff/PromptDiff'
import { ABTesting } from '@/components/abtest/ABTesting'

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
  const setTagTriggerWords = usePromptSmithStore((s) => s.setTagTriggerWords)
  const aiSettings = usePromptSmithStore((s) => s.aiSettings)

  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [expertMode, setExpertMode] = useState(false)
  const [editingTriggers, setEditingTriggers] = useState<string | null>(null)
  const [triggerInput, setTriggerInput] = useState('')
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

  const startEditTriggers = (tagId: string, existing: string[]) => {
    setEditingTriggers(tagId)
    setTriggerInput(existing.join(', '))
  }

  const saveTriggers = (tagId: string) => {
    const words = triggerInput.split(',').map(w => w.trim()).filter(Boolean)
    setTagTriggerWords(tagId, words)
    setEditingTriggers(null)
    setTriggerInput('')
  }

  return (
    <div className="flex flex-col h-full gap-3 p-4">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--ui-muted-text)' }}>Your Prompt</span>
          {hasContent && (
            <button
              onClick={clearAllTags}
              className="text-xs transition-colors"
              style={{ color: 'var(--ui-muted-text-faint)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text-faint)')}
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NegativePromptIntelligence />
          <VersionHistory />
          <PromptDiff />
          <ABTesting />
          <button
            onClick={() => setExpertMode(e => !e)}
            className="text-xs font-medium px-3 py-1 rounded-full border transition-colors duration-150"
            style={{
              borderColor: expertMode ? 'var(--ui-text)' : 'var(--ui-border)',
              color: expertMode ? 'var(--ui-text)' : 'var(--ui-muted-text)',
            }}
          >
            {expertMode ? 'Expert' : 'Simple'}
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            disabled={!hasContent}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
            style={{
              borderColor: copied ? 'var(--ui-text)' : hasContent ? 'var(--ui-text)' : 'var(--ui-border-faint)',
              color: copied || hasContent ? 'var(--ui-text)' : 'var(--ui-muted-text-faint)',
              backgroundColor: copied ? 'color-mix(in oklab, var(--ui-text) 10%, transparent)' : hasContent ? 'var(--ui-text)' : 'transparent',
            }}
          >
            {copied
              ? <CheckCircleIcon weight="fill" className="w-3.5 h-3.5" style={{ color: hasContent ? 'var(--ui-bg)' : 'var(--ui-text)' }} />
              : <Copy weight="regular" className="w-3.5 h-3.5" style={{ color: hasContent ? 'var(--ui-bg)' : 'var(--ui-text)' }} />}
            {copied ? 'Copied!' : 'Copy prompt'}
          </motion.button>
        </div>
      </div>

      {/* Tag chips + inline custom text */}
      <div
        className="flex-1 min-h-[72px] border rounded-xl p-3 flex flex-wrap content-start gap-2 overflow-y-auto scrollbar-hide transition-colors duration-150"
        style={{ borderColor: 'var(--ui-border)' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
      >
        {selectedTags.map((tag) => (
          editingTriggers === tag.id ? (
            <div key={tag.id} className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full border" style={{ borderColor: 'var(--ui-border-strong)', backgroundColor: 'color-mix(in oklab, var(--ui-text) 5%, transparent)' }}>
              <TagSimple weight="fill" className="w-3 h-3" style={{ color: 'var(--ui-muted-text)' }} />
              <input
                autoFocus
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTriggers(tag.id); if (e.key === 'Escape') setEditingTriggers(null) }}
                onBlur={() => saveTriggers(tag.id)}
                placeholder="trigger1, trigger2..."
                className="bg-transparent text-xs outline-none w-28"
                style={{ color: 'var(--ui-text)' }}
              />
            </div>
          ) : (
            <TokenChip
              key={tag.id}
              tag={tag}
              onRemove={() => removeTag(tag.id)}
              showWeight={expertMode}
              onEditTriggers={() => startEditTriggers(tag.id, tag.triggerWords || [])}
            />
          )
        ))}

        {/* Inline custom text input */}
        {showCustomInput ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border min-w-[160px]" style={{ borderColor: 'var(--ui-border-strong)' }}>
            <input
              autoFocus
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onBlur={() => { if (!customText.trim()) setShowCustomInput(false) }}
              placeholder="Add your own words..."
              className="bg-transparent text-sm outline-none w-full min-w-[120px]"
              style={{ color: 'var(--ui-text)' }}
            />
            {customText && (
              <button onClick={() => { setCustomText(''); setShowCustomInput(false) }} style={{ color: 'var(--ui-muted-text)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-text)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}>
                <X weight="bold" className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed transition-colors duration-150 text-xs"
            style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text-faint)' }}
          >
            <PencilSimple weight="regular" className="w-3 h-3" />
            {customText.trim() ? customText : 'Add your own words...'}
          </button>
        )}

        {!hasContent && !showCustomInput && (
          <div className="w-full flex items-center justify-center py-3">
            <p className="text-xs font-sans" style={{ color: 'var(--ui-muted-text-faint)' }}>
              Pick tags from the categories -- your prompt builds here automatically
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs font-mono leading-relaxed border-t pt-2 line-clamp-2" style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border-faint)' }}>
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
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors"
            style={{ color: 'var(--ui-muted-text-faint)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text-faint)')}
          >
            <CaretDown weight="bold" className={`w-2.5 h-2.5 transition-transform duration-150 ${showAdvanced && 'rotate-180'}`} />
            Advanced
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden mt-3 space-y-4"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--ui-muted-text-faint)' }}>Tag strength</p>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-hide">
                    {selectedTags.map((tag) => (
                      <WeightControl key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} expertMode={expertMode} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--ui-muted-text-faint)' }}>Trigger words</p>
                  <p className="text-[10px] leading-relaxed mb-2" style={{ color: 'var(--ui-muted-text-faint)' }}>
                    Trigger words are prepended to a tag in the final prompt. Useful for LoRA activations, style keywords, or model-specific syntax.
                  </p>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ui-muted-text-faint)', opacity: 0.75 }}>
                    Click the <Lightning weight="regular" className="w-2.5 h-2.5 inline -mt-0.5" /> icon on any tag chip above to add or edit triggers.
                  </p>
                </div>

                {negativePrompt && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--ui-muted-text-faint)' }}>Negative prompt</p>
                    <p className="text-xs font-mono leading-relaxed border rounded-lg px-3 py-2" style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border-faint)' }}>
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
      <div className="border-t pt-3 space-y-3" style={{ borderColor: 'var(--ui-border-faint)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageSquare weight="regular" className="w-3.5 h-3.5" style={{ color: 'var(--ui-muted-text)' }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ui-muted-text-faint)' }}>Generate Image</span>
          </div>
          {imageGenState.activeProvider && (
            <span className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider" style={{ borderColor: 'hsl(var(--success) / 0.3)', color: 'hsl(var(--success) / 0.6)' }}>
              {imageGenState.activeProvider}
            </span>
          )}
          {!imageGenState.activeProvider && imageGenState.status !== 'checking' && (
            <span className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}>
              No provider
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={!hasContent || imageGenState.status === 'generating'}
          className="w-full py-2 rounded-xl text-xs font-medium border transition-all duration-150 flex items-center justify-center gap-2"
          style={{
            borderColor: hasContent && imageGenState.status !== 'generating' ? 'var(--ui-border)' : 'var(--ui-border-faint)',
            color: hasContent && imageGenState.status !== 'generating' ? 'var(--ui-muted-text)' : 'var(--ui-muted-text-faint)',
            cursor: !hasContent || imageGenState.status === 'generating' ? 'not-allowed' : undefined,
          }}
          onMouseEnter={(e) => { if (hasContent && imageGenState.status !== 'generating') { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' } }}
          onMouseLeave={(e) => { if (hasContent && imageGenState.status !== 'generating') { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' } }}
        >
          {imageGenState.status === 'generating' ? (
            <>
              <span className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: 'var(--ui-border)', borderTopColor: 'var(--ui-text)' }} />
              Generating...
            </>
          ) : (
            <>
              <ImageSquare weight="regular" className="w-3.5 h-3.5" />
              Generate
            </>
          )}
        </motion.button>

        {imageError && (
          <p className="text-[10px] leading-relaxed" style={{ color: 'hsl(var(--destructive) / 0.7)' }}>{imageError}</p>
        )}

        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative rounded-xl overflow-hidden border group"
              style={{ borderColor: 'var(--ui-border-faint)' }}
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
                  className="px-3 py-1.5 rounded-full border text-xs transition-colors"
                  style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'var(--ui-border-hover)', color: 'var(--ui-text)' }}
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
  onEditTriggers,
}: {
  tag: { id: string; label: string; customWeight?: number; triggerWords?: string[] }
  onRemove: () => void
  showWeight?: boolean
  onEditTriggers: () => void
}) {
  const hasTriggers = tag.triggerWords && tag.triggerWords.length > 0
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-colors group"
      style={{ borderColor: 'var(--ui-border-strong)', color: 'var(--ui-text)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-strong)')}
    >
      <span>{tag.label}</span>
      {hasTriggers && (
        <span className="text-[9px] font-mono" style={{ color: 'var(--ui-muted-text-faint)' }}>
          [{tag.triggerWords!.join(', ')}]
        </span>
      )}
      {showWeight && tag.customWeight && tag.customWeight !== 1.0 && (
        <span className="text-[10px] font-mono" style={{ color: 'var(--ui-muted-text)' }}>{tag.customWeight.toFixed(1)}</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEditTriggers() }}
        className="flex items-center justify-center w-4 h-4 rounded transition-all"
        style={{
          color: hasTriggers ? 'var(--ui-muted-text)' : 'var(--ui-muted-text-faint)',
          opacity: hasTriggers ? 1 : undefined,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)'; e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 10%, transparent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = hasTriggers ? 'var(--ui-muted-text)' : 'var(--ui-muted-text-faint)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        title={hasTriggers ? 'Edit trigger words' : 'Add trigger words'}
      >
        <Lightning weight={hasTriggers ? 'fill' : 'regular'} className="w-2.5 h-2.5" />
      </button>
      <button
        onClick={onRemove}
        className="transition-all"
        style={{ color: 'var(--ui-muted-text)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive))')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
      >
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
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border transition-colors group" style={{ borderColor: 'var(--ui-border)' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
      >
        <span className="text-xs truncate max-w-[80px]" style={{ color: 'var(--ui-muted-text)' }}>{tag.label}</span>
        <div className="flex items-center gap-0.5">
          {(['Low', 'Normal', 'High'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setWeight(l === 'Low' ? 0.6 : l === 'Normal' ? 1.0 : 1.5)}
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors duration-150"
              style={{
                backgroundColor: level === l ? 'var(--ui-text)' : 'transparent',
                color: level === l ? 'var(--ui-bg)' : 'var(--ui-muted-text-faint)',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={onRemove} className="hidden group-hover:flex transition-colors" style={{ color: 'var(--ui-muted-text-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive))')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text-faint)')}
        >
          <Trash weight="regular" className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border transition-colors group" style={{ borderColor: 'var(--ui-border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
    >
      <span className="text-xs truncate max-w-[80px]" style={{ color: 'var(--ui-muted-text)' }}>{tag.label}</span>
      <div className="flex items-center gap-0.5 border rounded-full px-1" style={{ borderColor: 'var(--ui-border)' }}>
        <button onClick={() => adjust(-0.1)} className="p-0.5 transition-colors" style={{ color: 'var(--ui-muted-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
        >
          <Minus weight="bold" className="w-2.5 h-2.5" />
        </button>
        <span className="text-[10px] font-mono w-6 text-center" style={{ color: 'var(--ui-text)' }}>{weight.toFixed(1)}</span>
        <button onClick={() => adjust(0.1)} className="p-0.5 transition-colors" style={{ color: 'var(--ui-muted-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
        >
          <Plus weight="bold" className="w-2.5 h-2.5" />
        </button>
      </div>
      <button onClick={onRemove} className="hidden group-hover:flex transition-colors" style={{ color: 'var(--ui-muted-text-faint)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--destructive))')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text-faint)')}
      >
        <Trash weight="regular" className="w-3 h-3" />
      </button>
    </div>
  )
}
