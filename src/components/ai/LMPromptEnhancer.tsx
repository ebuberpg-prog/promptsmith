import { useState, useEffect, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService, type AIServiceState } from '@/services/local-ai-service'
import { searchTagIndex } from '@/utils/tag-index'
import { 
  Sparkle, 
  Spinner, 
  WarningCircle, 
  Check, 
  SpeakerHigh, 
  SpeakerSlash, 
  Image as ImageIcon, 
CloudArrowUp,
  X,
  Spinner as Loader2
} from '@phosphor-icons/react'

export function LMPromptEnhancer() {
  const [isOpen, setIsOpen] = useState(false)
  const [aiState, setAIState] = useState<AIServiceState>(aiService.getState())
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [suggestedLabels, setSuggestedLabels] = useState<string[]>([])
  const [translatedTags, setTranslatedTags] = useState<string[]>([])
  const [describeInput, setDescribeInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [muteTts, setMuteTts] = useState(true)
  // Image → Tags state
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState('image/jpeg')
  const [imageTags, setImageTags] = useState<string[]>([])
  const [isExtractingTags, setIsExtractingTags] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const setCustomText = usePromptSmithStore((s) => s.setCustomText)
  const generatePrompt = usePromptSmithStore((s) => s.generatePrompt)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)
  const aiSettings = usePromptSmithStore((s) => s.aiSettings)

  // The full assembled prompt (tags + customText) — this is what the user sees and what AI should enhance
  const fullPrompt = generatePrompt()

  // Subscribe to AI service state changes
  useEffect(() => {
    const unsub = aiService.subscribe(setAIState)
    return () => { unsub() }
  }, [])

  // Auto-discover when panel opens
  useEffect(() => {
    if (isOpen && aiState.status === 'disconnected') {
      aiService.setUrls(
        aiSettings.ollamaUrl,
        aiSettings.lmStudioUrl,
        aiSettings.openaiUrl,
        aiSettings.openaiApiKey,
        aiSettings.corsProxyUrl
      )
      aiService.discover(aiSettings.preferredAIProvider)
    }
  }, [isOpen, aiState.status, aiSettings])

  const handleEnhance = useCallback(async () => {
    if (!fullPrompt.trim()) return
    setIsEnhancing(true)
    setError(null)
    try {
      const result = await aiService.enhancePrompt(fullPrompt)
      setEnhancedPrompt(result)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsEnhancing(false)
    }
  }, [fullPrompt])

  const handleTextToTags = useCallback(async () => {
    if (!describeInput.trim()) return
    setIsTranslating(true)
    setError(null)
    setTranslatedTags([])
    try {
      const labels = await aiService.textToTags(describeInput)
      setTranslatedTags(labels)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsTranslating(false)
    }
  }, [describeInput])

  const handleSuggestMore = useCallback(async () => {
    if (selectedTags.length === 0) return
    setIsSuggesting(true)
    setError(null)
    setSuggestedLabels([])
    try {
      const labels = await aiService.suggestTags(selectedTags.map(t => t.label))
      setSuggestedLabels(labels)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsSuggesting(false)
    }
  }, [selectedTags])

  const applyEnhancement = () => {
    if (enhancedPrompt) {
      // Clear tags — the AI has incorporated them into the enhanced text
      clearAllTags()
      setCustomText(enhancedPrompt)
      setEnhancedPrompt('')
    }
    setIsOpen(false)
  }

  // Find the best matching taxonomy tag for a label — tries full phrase, then individual words
  const findBestTag = useCallback((label: string) => {
    const full = searchTagIndex(label, showExplicit, 1)
    if (full.length > 0) return full[0]
    // Fallback: try each word individually and return the first hit
    const words = label.split(/\s+/).filter(w => w.length > 2)
    for (const word of words) {
      const hits = searchTagIndex(word, showExplicit, 1)
      if (hits.length > 0) return hits[0]
    }
    return null
  }, [showExplicit])

  const applyTranslatedTag = (label: string) => {
    const tag = findBestTag(label)
    if (tag) toggleTag(tag)
  }

  const applySuggestedTag = (label: string) => {
    const tag = findBestTag(label)
    if (tag) toggleTag(tag)
  }

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageMime(file.type)
    setImageTags([])
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      // Strip the "data:image/...;base64," prefix — providers want raw base64
      setImageBase64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadImageFile(file)
  }, [])

  const handleImagePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) loadImageFile(item.getAsFile()!)
  }, [])

  const handleImageToTags = useCallback(async () => {
    if (!imageBase64) return
    setIsExtractingTags(true)
    setError(null)
    setImageTags([])
    try {
      const labels = await aiService.imageToTags(imageBase64, imageMime)
      setImageTags(labels)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsExtractingTags(false)
    }
  }, [imageBase64, imageMime])

  const speakPrompt = (text: string) => {
    if (muteTts || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    speechSynthesis.speak(utterance)
  }

  const isConnected = aiState.status === 'connected'
  const isChecking = aiState.status === 'checking'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border"
        style={{
          borderColor: 'var(--ui-border)',
          backgroundColor: 'var(--ui-surface)',
          color: 'var(--ui-text)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
          e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--ui-border)'
          e.currentTarget.style.backgroundColor = 'var(--ui-surface)'
        }}
      >
        <Sparkle weight="regular" className="w-4 h-4" style={{ color: 'var(--ui-muted-text)' }} />
        <span className="hidden sm:inline">AI Enhance</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div 
            className="rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            style={{ 
              backgroundColor: 'var(--ui-surface)', 
              border: '1px solid var(--ui-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >

            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--ui-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkle weight="regular" className="w-4 h-4" style={{ color: 'var(--ui-text)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>AI Tools</span>
                <StatusPill status={isChecking ? 'checking' : isConnected ? 'connected' : 'disconnected'} provider={aiState.activeProvider} />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMuteTts(!muteTts)}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: 'var(--ui-muted-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)' }}
                >
                  {muteTts ? <SpeakerSlash weight="regular" className="w-3.5 h-3.5" /> : <SpeakerHigh weight="regular" className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-colors text-base leading-none"
                  style={{ color: 'var(--ui-muted-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--destructive))' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)' }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Not connected state */}
              {!isConnected && !isChecking && (
                <div className="p-4 border rounded-xl space-y-3" style={{ borderColor: 'var(--ui-border)' }}>
                  <div className="flex items-center gap-2">
                    <WarningCircle weight="regular" className="w-4 h-4" style={{ color: 'var(--ui-muted-text)' }} />
                    <span className="text-sm" style={{ color: 'var(--ui-text)' }}>No AI provider found</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ui-muted-text)' }}>
                    Start Ollama or LM Studio locally, then click Reconnect. Configure URLs in the ⚙️ settings panel.
                  </p>
                  <button
                    onClick={() => {
                      aiService.setUrls(
                        aiSettings.ollamaUrl,
                        aiSettings.lmStudioUrl,
                        aiSettings.openaiUrl,
                        aiSettings.openaiApiKey,
                        aiSettings.corsProxyUrl
                      )
                      aiService.discover(aiSettings.preferredAIProvider)
                    }}
                    className="px-4 py-2 rounded-full border text-sm transition-all"
                    style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)' }}
                  >
                    Reconnect
                  </button>
                </div>
              )}

              {isChecking && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <div 
                    className="w-4 h-4 rounded-full border animate-spin"
                    style={{ borderColor: 'var(--ui-border)', borderTopColor: 'var(--ui-text)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>Detecting local AI providers…</span>
                </div>
              )}

              {error && (
                <div 
                  className="flex items-center gap-2 p-3 border rounded-xl text-xs"
                  style={{ borderColor: 'hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))' }}
                >
                  <WarningCircle weight="regular" className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {isConnected && (
                <>
                  {/* Enhance Prompt */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ui-muted-text)' }}>Enhance Prompt</h3>
                    <div className="p-3 border rounded-xl" style={{ borderColor: 'var(--ui-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ui-muted-text-faint)' }}>Current prompt</span>
                        <button
                          onClick={() => speakPrompt(fullPrompt)}
                          className="transition-colors"
                          style={{ color: 'var(--ui-muted-text-faint)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-text)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text-faint)' }}
                        >
                          <SpeakerHigh weight="regular" className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-4" style={{ color: 'var(--ui-muted-text)' }}>
                        {fullPrompt || <span className="italic" style={{ color: 'var(--ui-muted-text-faint)' }}>No tags or text yet -- add some first</span>}
                      </p>
                    </div>

                    <button
                      onClick={handleEnhance}
                      disabled={isEnhancing || !fullPrompt.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2 transition-all border"
                      style={{ 
                        borderColor: 'var(--ui-border)', 
                        color: 'var(--ui-text)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => { 
                        if (!isEnhancing && fullPrompt.trim()) {
                          e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
                          e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)'
                        }
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.borderColor = 'var(--ui-border)'
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {isEnhancing ? <><Spinner weight="regular" className="w-3.5 h-3.5 animate-spin" /> Enhancing…</> : <><Sparkle weight="regular" className="w-3.5 h-3.5" /> Enhance with AI</>}
                    </button>

                    {enhancedPrompt && (
                      <div className="p-3 border rounded-xl space-y-2" style={{ borderColor: 'var(--ui-border-hover)' }}>
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ui-text)' }}>Enhanced</span>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--ui-muted-text)' }}>{enhancedPrompt}</p>
                        <button
                          onClick={applyEnhancement}
                          className="flex items-center gap-1.5 text-xs transition-colors"
                          style={{ color: 'var(--ui-text)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui-muted-text)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui-text)' }}
                        >
                          <Check weight="regular" className="w-3 h-3" /> Apply this enhancement
                        </button>
                      </div>
                    )}
                  </section>

                  <div className="h-px" style={{ backgroundColor: 'var(--ui-border-faint)' }} />

                  {/* Describe → Tags */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ui-muted-text)' }}>Describe → Tags</h3>
                    <p className="text-[10px]" style={{ color: 'var(--ui-muted-text-faint)' }}>Describe what you want and get matching taxonomy tags back.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={describeInput}
                        onChange={e => setDescribeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleTextToTags()}
                        placeholder="e.g. a warrior woman in a dark forest at night…"
                        className="flex-1 px-3 py-2 bg-transparent border rounded-full text-xs outline-none transition-colors"
                        style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)' }}
                      />
                      <button
                        onClick={handleTextToTags}
                        disabled={isTranslating || !describeInput.trim()}
                        className="px-4 py-2 rounded-full border text-xs disabled:opacity-40 transition-all flex items-center gap-1.5"
                        style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border-hover)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)' }}
                      >
                        {isTranslating ? <Spinner weight="regular" className="w-3 h-3 animate-spin" /> : null}
                        {isTranslating ? 'Translating…' : 'Convert'}
                      </button>
                    </div>

                    {translatedTags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px]" style={{ color: 'var(--ui-muted-text-faint)' }}>Click to add to prompt</span>
                        <div className="flex flex-wrap gap-1.5">
                          {translatedTags.map((label, i) => {
                            const match = findBestTag(label)
                            const found = match !== null
                            // Show the actual taxonomy label if it differs from what the AI returned
                            const displayLabel = found && match!.label.toLowerCase() !== label.toLowerCase()
                              ? `${label} → ${match!.label}`
                              : label
                            return (
                              <button
                                key={i}
                                onClick={() => applyTranslatedTag(label)}
                                disabled={!found}
                                title={found ? `Add "${match!.label}" to prompt` : `"${label}" not found in taxonomy`}
                                className="px-3 py-1.5 rounded-full border text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
                                onMouseEnter={(e) => { if (found) { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
                              >
                                {displayLabel}
                                {found && <span className="ml-1" style={{ color: 'hsl(var(--success))' }}>✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="h-px" style={{ backgroundColor: 'var(--ui-border-faint)' }} />

                  {/* Suggest More */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ui-muted-text)' }}>Suggest More</h3>
                    <p className="text-[10px]" style={{ color: 'var(--ui-muted-text-faint)' }}>Based on your {selectedTags.length} selected tags, get complementary suggestions.</p>

                    <button
                      onClick={handleSuggestMore}
                      disabled={isSuggesting || selectedTags.length === 0}
                      className="w-full py-2 rounded-xl border text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                      style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                      onMouseEnter={(e) => { if (!isSuggesting && selectedTags.length > 0) { e.currentTarget.style.borderColor = 'var(--ui-border-hover)' }}}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)' }}
                    >
                      {isSuggesting ? <><Spinner weight="regular" className="w-3.5 h-3.5 animate-spin" /> Suggesting…</> : 'Suggest complementary tags'}
                    </button>

                    {suggestedLabels.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px]" style={{ color: 'var(--ui-muted-text-faint)' }}>Click to add</span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedLabels.map((label, i) => {
                            const match = findBestTag(label)
                            const found = match !== null
                            const alreadySelected = found && selectedTags.some(t => t.id === match!.id)
                            return (
                              <button
                                key={i}
                                onClick={() => applySuggestedTag(label)}
                                disabled={!found || alreadySelected}
                                className="px-3 py-1.5 rounded-full border text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
                                onMouseEnter={(e) => { if (found && !alreadySelected) { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
                              >
                                {found && match!.label.toLowerCase() !== label.toLowerCase() ? match!.label : label}
                                {alreadySelected && <span className="ml-1" style={{ color: 'var(--ui-muted-text-faint)' }}>✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="h-px" style={{ backgroundColor: 'var(--ui-border-faint)' }} />

                  {/* Image → Tags */}
                  <section className="space-y-3" onPaste={handleImagePaste}>
                    <div className="flex items-center gap-2">
                      <ImageIcon weight="regular" className="w-3.5 h-3.5" style={{ color: 'var(--ui-muted-text-faint)' }} />
                      <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ui-muted-text)' }}>Image → Tags</h3>
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--ui-muted-text-faint)' }}>Upload an image and extract taxonomy tags using your vision model.</p>

                    {/* Drop zone */}
                    {!imagePreview ? (
                      <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleImageDrop}
                        className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150"
                        style={{ 
                          borderColor: isDragging ? 'var(--ui-border-hover)' : 'var(--ui-border-faint)',
                          backgroundColor: isDragging ? 'color-mix(in oklab, var(--ui-text) 5%, transparent)' : 'transparent'
                        }}
                      >
                        <CloudArrowUp weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text-faint)' }} />
                        <span className="text-xs" style={{ color: 'var(--ui-muted-text-faint)' }}>Drop image, paste, or click to upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImageFile(f) }}
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border group" style={{ borderColor: 'var(--ui-border)' }}>
                        <img src={imagePreview} alt="Selected" className="w-full max-h-48 object-contain" style={{ backgroundColor: 'var(--ui-bg)' }} />
                        <button
                          onClick={() => { setImagePreview(null); setImageBase64(null); setImageTags([]) }}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'var(--ui-text)' }}
                        >
                          <X weight="regular" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {imagePreview && (
                        <button
                          onClick={handleImageToTags}
                          disabled={isExtractingTags || !imageBase64}
                          className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2 transition-all border"
                          style={{ 
                            borderColor: 'var(--ui-border)', 
                            color: 'var(--ui-text)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => { 
                            if (!isExtractingTags) {
                              e.currentTarget.style.borderColor = 'var(--ui-border-hover)'
                              e.currentTarget.style.backgroundColor = 'color-mix(in oklab, var(--ui-text) 5%, transparent)'
                            }
                          }}
                          onMouseLeave={(e) => { 
                            e.currentTarget.style.borderColor = 'var(--ui-border)'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {isExtractingTags
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting…</>
                            : <><ImageIcon weight="regular" className="w-3.5 h-3.5" /> Extract Tags</>}
                        </button>
                    )}

                    {imageTags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px]" style={{ color: 'var(--ui-muted-text-faint)' }}>Click to add to prompt ({imageTags.length} found)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {imageTags.map((label, i) => {
                            const match = findBestTag(label)
                            const found = match !== null
                            const alreadySelected = found && selectedTags.some(t => t.id === match!.id)
                            const display = found && match!.label.toLowerCase() !== label.toLowerCase()
                              ? match!.label
                              : label
                            return (
                              <button
                                key={i}
                                onClick={() => { if (found) toggleTag(match!) }}
                                disabled={!found || alreadySelected}
                                title={found ? `Add "${match!.label}"` : `"${label}" not in taxonomy`}
                                className="px-3 py-1.5 rounded-full border text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}
                                onMouseEnter={(e) => { if (found && !alreadySelected) { e.currentTarget.style.borderColor = 'var(--ui-border-hover)'; e.currentTarget.style.color = 'var(--ui-text)' }}}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui-border)'; e.currentTarget.style.color = 'var(--ui-muted-text)' }}
                              >
                                {display}
                                {alreadySelected && <span className="ml-1" style={{ color: 'var(--ui-muted-text-faint)' }}>✓</span>}
                                {!found && <span className="ml-1" style={{ color: 'var(--ui-muted-text-faint)', opacity: 0.5 }}>—</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusPill({ status, provider }: { status: 'connected' | 'checking' | 'disconnected'; provider: string | null }) {
  if (status === 'checking') return (
    <span 
      className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider"
      style={{ borderColor: 'hsl(var(--warning) / 0.3)', color: 'hsl(var(--warning) / 0.7)' }}
    >
      Connecting…
    </span>
  )
  if (status === 'connected') return (
    <span 
      className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider"
      style={{ borderColor: 'hsl(var(--success) / 0.3)', color: 'hsl(var(--success) / 0.7)' }}
    >
      {provider ?? 'AI'} connected
    </span>
  )
  return (
    <span 
      className="text-[9px] border rounded-full px-2 py-0.5 uppercase tracking-wider"
      style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text-faint)' }}
    >
      Not connected
    </span>
  )
}
