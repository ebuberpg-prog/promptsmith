import { useState, useEffect, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService, type AIServiceState } from '@/services/local-ai-service'
import { searchTagIndex } from '@/utils/tag-index'
import { Sparkles, Loader2, AlertCircle, Check, Volume2, VolumeX, ImageIcon, UploadCloud, X } from 'lucide-react'

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
      aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl, aiSettings.openaiUrl, aiSettings.openaiApiKey)
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
        className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f5] text-black rounded-lg text-sm font-medium hover:bg-[#e0e0e0] transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">AI Enhance</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#f5f5f5]" />
                <span className="text-sm font-medium text-[#f5f5f5]">AI Tools</span>
                <StatusPill status={isChecking ? 'checking' : isConnected ? 'connected' : 'disconnected'} provider={aiState.activeProvider} />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMuteTts(!muteTts)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[#c2c2c2]/50 hover:text-[#c2c2c2] transition-colors"
                >
                  {muteTts ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[#c2c2c2]/50 hover:text-[#f5f5f5] transition-colors text-base leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Not connected state */}
              {!isConnected && !isChecking && (
                <div className="p-4 border border-[#1a1a1a] rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#c2c2c2]/50" />
                    <span className="text-sm text-[#c2c2c2]">No AI provider found</span>
                  </div>
                  <p className="text-xs text-[#c2c2c2]/50 leading-relaxed">
                    Start Ollama or LM Studio locally, then click Reconnect. Configure URLs in the ⚙️ settings panel.
                  </p>
                  <button
                    onClick={() => {
                      aiService.setUrls(aiSettings.ollamaUrl, aiSettings.lmStudioUrl, aiSettings.openaiUrl, aiSettings.openaiApiKey)
                      aiService.discover(aiSettings.preferredAIProvider)
                    }}
                    className="px-4 py-2 rounded-full border border-[#333] text-sm text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all"
                  >
                    Reconnect
                  </button>
                </div>
              )}

              {isChecking && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <div className="w-4 h-4 rounded-full border border-[#333] border-t-[#f5f5f5] animate-spin" />
                  <span className="text-sm text-[#c2c2c2]/60">Detecting local AI providers…</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 border border-red-900/40 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {isConnected && (
                <>
                  {/* Enhance Prompt */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium text-[#c2c2c2] uppercase tracking-wider">Enhance Prompt</h3>
                    <div className="p-3 border border-[#1a1a1a] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider">Current prompt</span>
                        <button
                          onClick={() => speakPrompt(fullPrompt)}
                          className="text-[#c2c2c2]/30 hover:text-[#c2c2c2] transition-colors"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-[#f5f5f5]/70 leading-relaxed line-clamp-4">
                        {fullPrompt || <span className="text-[#c2c2c2]/30 italic">No tags or text yet — add some first</span>}
                      </p>
                    </div>

                    <button
                      onClick={handleEnhance}
                      disabled={isEnhancing || !fullPrompt.trim()}
                      className="w-full py-2.5 bg-[#f5f5f5] text-black rounded-xl text-sm font-medium hover:bg-[#e0e0e0] disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                    >
                      {isEnhancing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enhancing…</> : <><Sparkles className="w-3.5 h-3.5" /> Enhance with AI</>}
                    </button>

                    {enhancedPrompt && (
                      <div className="p-3 border border-[#555] rounded-xl space-y-2">
                        <span className="text-[10px] text-[#f5f5f5] uppercase tracking-wider">Enhanced</span>
                        <p className="text-xs text-[#f5f5f5]/80 leading-relaxed">{enhancedPrompt}</p>
                        <button
                          onClick={applyEnhancement}
                          className="flex items-center gap-1.5 text-xs text-[#f5f5f5] hover:text-[#c2c2c2] transition-colors"
                        >
                          <Check className="w-3 h-3" /> Apply this enhancement
                        </button>
                      </div>
                    )}
                  </section>

                  <div className="h-px bg-[#1a1a1a]" />

                  {/* Describe → Tags */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium text-[#c2c2c2] uppercase tracking-wider">Describe → Tags</h3>
                    <p className="text-[10px] text-[#c2c2c2]/40">Describe what you want and get matching taxonomy tags back.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={describeInput}
                        onChange={e => setDescribeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleTextToTags()}
                        placeholder="e.g. a warrior woman in a dark forest at night…"
                        className="flex-1 px-3 py-2 bg-transparent border border-[#222] rounded-full text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444] transition-colors"
                      />
                      <button
                        onClick={handleTextToTags}
                        disabled={isTranslating || !describeInput.trim()}
                        className="px-4 py-2 rounded-full border border-[#333] text-xs text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] disabled:opacity-40 transition-all flex items-center gap-1.5"
                      >
                        {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {isTranslating ? 'Translating…' : 'Convert'}
                      </button>
                    </div>

                    {translatedTags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-[#c2c2c2]/40">Click to add to prompt</span>
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
                                className="px-3 py-1.5 rounded-full border text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
                              >
                                {displayLabel}
                                {found && <span className="ml-1 text-green-500/60">✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="h-px bg-[#1a1a1a]" />

                  {/* Suggest More */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-medium text-[#c2c2c2] uppercase tracking-wider">Suggest More</h3>
                    <p className="text-[10px] text-[#c2c2c2]/40">Based on your {selectedTags.length} selected tags, get complementary suggestions.</p>

                    <button
                      onClick={handleSuggestMore}
                      disabled={isSuggesting || selectedTags.length === 0}
                      className="w-full py-2 rounded-xl border border-[#333] text-sm text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {isSuggesting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Suggesting…</> : 'Suggest complementary tags'}
                    </button>

                    {suggestedLabels.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-[#c2c2c2]/40">Click to add</span>
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
                                className="px-3 py-1.5 rounded-full border text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
                              >
                                {found && match!.label.toLowerCase() !== label.toLowerCase() ? match!.label : label}
                                {alreadySelected && <span className="ml-1 text-[#c2c2c2]/40">✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="h-px bg-[#1a1a1a]" />

                  {/* Image → Tags */}
                  <section className="space-y-3" onPaste={handleImagePaste}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-[#c2c2c2]/50" />
                      <h3 className="text-xs font-medium text-[#c2c2c2] uppercase tracking-wider">Image → Tags</h3>
                    </div>
                    <p className="text-[10px] text-[#c2c2c2]/40">Upload an image and extract taxonomy tags using your vision model.</p>

                    {/* Drop zone */}
                    {!imagePreview ? (
                      <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleImageDrop}
                        className={`flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150 ${
                          isDragging ? 'border-[#555] bg-white/5' : 'border-[#2a2a2a] hover:border-[#444]'
                        }`}
                      >
                        <UploadCloud className="w-5 h-5 text-[#c2c2c2]/30" />
                        <span className="text-xs text-[#c2c2c2]/40">Drop image, paste, or click to upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImageFile(f) }}
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-[#1a1a1a] group">
                        <img src={imagePreview} alt="Selected" className="w-full max-h-48 object-contain bg-[#111]" />
                        <button
                          onClick={() => { setImagePreview(null); setImageBase64(null); setImageTags([]) }}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/70 text-[#c2c2c2] hover:text-[#f5f5f5] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {imagePreview && (
                        <button
                          onClick={handleImageToTags}
                          disabled={isExtractingTags || !imageBase64}
                          className="w-full py-2.5 bg-[#f5f5f5] text-black rounded-xl text-sm font-medium hover:bg-[#e0e0e0] disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                        >
                          {isExtractingTags
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting…</>
                            : <><ImageIcon className="w-3.5 h-3.5" /> Extract Tags</>}
                        </button>
                    )}

                    {imageTags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-[#c2c2c2]/40">Click to add to prompt ({imageTags.length} found)</span>
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
                                className="px-3 py-1.5 rounded-full border text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
                              >
                                {display}
                                {alreadySelected && <span className="ml-1 text-[#c2c2c2]/40">✓</span>}
                                {!found && <span className="ml-1 text-[#c2c2c2]/20">—</span>}
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
    <span className="text-[9px] border border-yellow-500/30 text-yellow-500/70 rounded-full px-2 py-0.5 uppercase tracking-wider">Connecting…</span>
  )
  if (status === 'connected') return (
    <span className="text-[9px] border border-green-500/30 text-green-500/70 rounded-full px-2 py-0.5 uppercase tracking-wider">{provider ?? 'AI'} connected</span>
  )
  return (
    <span className="text-[9px] border border-[#333] text-[#c2c2c2]/40 rounded-full px-2 py-0.5 uppercase tracking-wider">Not connected</span>
  )
}
