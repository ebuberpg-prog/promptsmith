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
  TagSimple,
  Lightning,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NegativePromptIntelligence } from '@/components/negative/NegativePromptIntelligence'
import { getModelConfig } from '@/data/model-configs'

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

  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [expertMode, setExpertMode] = useState(false)
  const [editingTriggers, setEditingTriggers] = useState<string | null>(null)
  const [triggerInput, setTriggerInput] = useState('')

  const prompt = generatePrompt()
  const negativePrompt = generateNegativePrompt()
  const hasContent = selectedTags.length > 0 || customText.trim()
  const modelLabel = getModelConfig(selectedModel).name

  const handleCopy = async () => {
    let fullPrompt = prompt
    if (selectedModel === 'midjourney') fullPrompt += ' --v 8 --ar 16:9'
    await navigator.clipboard.writeText(fullPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
    <section className="border rounded-[20px] p-4 space-y-3.5" style={{ borderColor: 'var(--ui-border)' }}>
      <div className="space-y-3">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h2 className="font-display text-[1.5rem] font-normal tracking-tight text-balance leading-tight" style={{ color: 'var(--ui-text)' }}>
              Prompt Canvas
            </h2>
            <p className="text-[12px] leading-5 text-pretty" style={{ color: 'var(--ui-muted-text)' }}>
              Assemble the prompt here, then open deeper controls only when the draft needs them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <NegativePromptIntelligence />
            <button
              onClick={() => setExpertMode(e => !e)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors duration-150"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 border"
              style={{
                borderColor: copied ? 'var(--ui-text)' : hasContent ? 'var(--ui-text)' : 'var(--ui-border-faint)',
                color: copied ? 'var(--ui-text)' : hasContent ? 'var(--ui-bg)' : 'var(--ui-muted-text-faint)',
                backgroundColor: copied ? 'color-mix(in oklab, var(--ui-text) 10%, transparent)' : hasContent ? 'var(--ui-text)' : 'transparent',
              }}
            >
              {copied
                ? <CheckCircleIcon weight="fill" className="w-3.5 h-3.5" style={{ color: hasContent ? 'var(--ui-bg)' : 'var(--ui-text)' }} />
                : <Copy weight="regular" className="w-3.5 h-3.5" style={{ color: hasContent ? 'var(--ui-bg)' : 'var(--ui-text)' }} />}
              {copied ? 'Copied!' : 'Copy'}
            </motion.button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PromptMetaPill label="Model" value={modelLabel} />
          <PromptMetaPill label="Tags" value={`${selectedTags.length}`} />
          <PromptMetaPill label="Custom text" value={customText.trim() ? 'Added' : 'None'} />
          <PromptMetaPill label="Draft" value={hasContent ? 'Ready to refine' : 'Waiting for input'} />
        </div>
      </div>

      {/* Tag chips + inline custom text */}
      <div
        className="min-h-[108px] border rounded-[18px] p-3 flex flex-wrap content-start gap-1.5 overflow-y-auto scrollbar-hide transition-colors duration-150"
        style={{ borderColor: 'var(--ui-border)' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ui-border)')}
      >
        <div className="w-full flex items-center justify-between gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--ui-muted-text-faint)' }}>
            Working prompt
          </span>
          {hasContent && (
            <button
              onClick={clearAllTags}
              className="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
              style={{ color: 'var(--ui-muted-text-faint)', borderColor: 'var(--ui-border-faint)' }}
            >
              Clear all
            </button>
          )}
        </div>
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
            <p className="text-xs font-sans text-center text-pretty max-w-[260px]" style={{ color: 'var(--ui-muted-text-faint)' }}>
              Start with a subject, then layer in setting, light, and one clear style decision. The prompt will build here automatically.
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
            <div className="border rounded-[18px] p-3.5 space-y-2.5" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--ui-muted-text-faint)' }}>
                  Composed output
                </span>
                <span className="text-[11px]" style={{ color: 'var(--ui-muted-text)' }}>
                  {modelLabel}
                </span>
              </div>
              <p className="text-[11px] font-mono leading-5 whitespace-pre-wrap break-words max-h-36 overflow-y-auto" style={{ color: 'var(--ui-muted-text)' }}>
                {prompt}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced toggle */}
      {hasContent && (
        <div className="border rounded-[18px] p-3.5" style={{ borderColor: 'var(--ui-border)' }}>
          <button
            onClick={() => setShowAdvanced(a => !a)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--ui-muted-text)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ui-muted-text-faint)')}
          >
            <CaretDown weight="bold" className={`w-2.5 h-2.5 transition-transform duration-150 ${showAdvanced && 'rotate-180'}`} />
            Weights, triggers, and negatives
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


    </section>
  )
}

function PromptMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
      style={{
        color: 'var(--ui-muted-text)',
        backgroundColor: 'color-mix(in oklab, var(--ui-text) 4%, transparent)',
        border: '1px solid var(--ui-border-faint)',
      }}
    >
      <span style={{ color: 'var(--ui-muted-text-faint)' }}>{label}</span>
      <span style={{ color: 'var(--ui-text)' }}>{value}</span>
    </span>
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
