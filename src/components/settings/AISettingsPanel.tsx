import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService, type AIModel, type ProviderStatus } from '@/services/local-ai-service'
import { imageGenService } from '@/services/image-gen-service'
import type { ImageGenProviderId } from '@/services/image-gen-service'
import { X, Check, CircleNotch, Warning } from '@phosphor-icons/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface AISettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

type TestState = 'idle' | 'testing' | 'ok' | 'fail'

export function AISettingsPanel({ isOpen, onClose }: AISettingsPanelProps) {
  const aiSettings = usePromptSmithStore((s) => s.aiSettings)
  const updateAISettings = usePromptSmithStore((s) => s.updateAISettings)

  const [ollamaUrl, setOllamaUrl] = useState(aiSettings.ollamaUrl)
  const [lmStudioUrl, setLmStudioUrl] = useState(aiSettings.lmStudioUrl)
  const [openaiUrl, setOpenaiUrl] = useState(aiSettings.openaiUrl)
  const [openaiApiKey, setOpenaiApiKey] = useState(aiSettings.openaiApiKey)
  const [corsProxyUrl, setCorsProxyUrl] = useState(aiSettings.corsProxyUrl)
  const [a1111Url, setA1111Url] = useState(aiSettings.a1111Url)
  const [comfyuiUrl, setComfyuiUrl] = useState(aiSettings.comfyuiUrl)
  const [drawthingsUrl, setDrawthingsUrl] = useState(aiSettings.drawthingsUrl)

  const [ollamaTest, setOllamaTest] = useState<TestState>('idle')
  const [lmStudioTest, setLmStudioTest] = useState<TestState>('idle')
  const [openaiTest, setOpenaiTest] = useState<TestState>('idle')
  const [a1111Test, setA1111Test] = useState<TestState>('idle')
  const [comfyuiTest, setComfyuiTest] = useState<TestState>('idle')
  const [drawthingsTest, setDrawthingsTest] = useState<TestState>('idle')

  const [openaiTestError, setOpenaiTestError] = useState<string>('')

  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([])
  const [lmStudioModels, setLmStudioModels] = useState<AIModel[]>([])
  const [openaiModels, setOpenaiModels] = useState<AIModel[]>([])
  const [aiStatus, setAIStatus] = useState<ProviderStatus>('disconnected')
  const [openaiInputMode, setOpenaiInputMode] = useState<'auto' | 'manual'>(aiSettings.openaiModelInputMode)
  const [openaiManualModel, setOpenaiManualModel] = useState(aiSettings.openaiManualModel)

  // Sync from store when opened
  useEffect(() => {
    if (isOpen) {
      setOllamaUrl(aiSettings.ollamaUrl)
      setLmStudioUrl(aiSettings.lmStudioUrl)
      setOpenaiUrl(aiSettings.openaiUrl)
      setOpenaiApiKey(aiSettings.openaiApiKey)
      setCorsProxyUrl(aiSettings.corsProxyUrl)
      setA1111Url(aiSettings.a1111Url)
      setComfyuiUrl(aiSettings.comfyuiUrl)
      setDrawthingsUrl(aiSettings.drawthingsUrl)
    }
  }, [isOpen, aiSettings])

  // Subscribe to AI service state
  useEffect(() => {
    const unsub = aiService.subscribe(state => {
      setAIStatus(state.status)
      if (state.activeProvider === 'ollama') setOllamaModels(state.availableModels)
      if (state.activeProvider === 'lmstudio') setLmStudioModels(state.availableModels)
      if (state.activeProvider === 'openai') setOpenaiModels(state.availableModels)
    })
    return () => { unsub() }
  }, [])

  const save = useCallback(() => {
    updateAISettings({
      ollamaUrl, lmStudioUrl, openaiUrl, openaiApiKey, a1111Url, comfyuiUrl, drawthingsUrl,
      openaiModelInputMode: openaiInputMode,
      openaiManualModel,
      corsProxyUrl,
    })
    aiService.setUrls(ollamaUrl, lmStudioUrl, openaiUrl, openaiApiKey, corsProxyUrl)
    imageGenService.setUrls(a1111Url, comfyuiUrl, drawthingsUrl)
    if (aiSettings.preferredAIModel) {
      aiService.setSelectedModel(aiSettings.preferredAIModel)
    }
    if (aiSettings.preferredAIProvider) {
      aiService.setActiveProvider(aiSettings.preferredAIProvider)
    }
  }, [ollamaUrl, lmStudioUrl, openaiUrl, openaiApiKey, a1111Url, comfyuiUrl, drawthingsUrl, openaiInputMode, openaiManualModel, corsProxyUrl, updateAISettings, aiSettings.preferredAIModel, aiSettings.preferredAIProvider])

  const testOllama = async () => {
    save()
    setOllamaTest('testing')
    setOllamaModels([])
    const { ok, models, error } = await aiService.testProvider('ollama')
    setOllamaTest(ok ? 'ok' : 'fail')
    if (ok) {
      setOllamaModels(models)
      aiService.setActiveProvider('ollama')
      if (models.length > 0) {
        aiService.setSelectedModel(models[0].id)
        updateAISettings({ preferredAIProvider: 'ollama', preferredAIModel: models[0].id })
      }
    }
  }

  const testLMStudio = async () => {
    save()
    setLmStudioTest('testing')
    setLmStudioModels([])
    const { ok, models, error } = await aiService.testProvider('lmstudio')
    setLmStudioTest(ok ? 'ok' : 'fail')
    if (ok) {
      setLmStudioModels(models)
      aiService.setActiveProvider('lmstudio')
      if (models.length > 0) {
        aiService.setSelectedModel(models[0].id)
        updateAISettings({ preferredAIProvider: 'lmstudio', preferredAIModel: models[0].id })
      }
    }
  }

  const testOpenAI = async () => {
    save()
    setOpenaiTest('testing')
    setOpenaiModels([])
    setOpenaiTestError('')
    try {
      const { ok, models, error } = await aiService.testProvider('openai')
      setOpenaiTest(ok ? 'ok' : 'fail')
      if (ok) {
        setOpenaiModels(models)
        aiService.setActiveProvider('openai')
        if (models.length > 0) {
          aiService.setSelectedModel(models[0].id)
          updateAISettings({ preferredAIProvider: 'openai', preferredAIModel: models[0].id })
        } else {
          // No models returned — switch to manual mode with a default
          const defaultModel = 'kimi-k2.5'
          setOpenaiInputMode('manual')
          setOpenaiManualModel(defaultModel)
          aiService.setSelectedModel(defaultModel)
          updateAISettings({ preferredAIProvider: 'openai', preferredAIModel: defaultModel, openaiModelInputMode: 'manual', openaiManualModel: defaultModel })
        }
      } else {
        setOpenaiTestError(error || 'Could not reach the endpoint.')
      }
    } catch (err) {
      setOpenaiTest('fail')
      setOpenaiTestError(String(err))
    }
  }

  const testImageProvider = async (id: ImageGenProviderId, setter: (s: TestState) => void) => {
    save()
    setter('testing')
    const ok = await imageGenService.testProvider(id)
    setter(ok ? 'ok' : 'fail')
    if (ok) updateAISettings({ preferredImageProvider: id })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-[#0a0a0a] border-l border-[#1a1a1a] z-50 overflow-y-auto scrollbar-hide"
          >
            <div className="p-8 space-y-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-normal text-[#f5f5f5] tracking-tight">AI Connections</h2>
                  <p className="text-xs text-[#c2c2c2]/60 mt-1">
                    Connect to local AI services or any OpenAI-compatible API.
                  </p>
                </div>
                <button
                  onClick={() => { save(); onClose() }}
                  className="text-[#c2c2c2]/50 hover:text-[#f5f5f5] transition-colors"
                >
                  <X weight="regular" className="w-5 h-5" />
                </button>
              </div>

              {/* AI Text Providers */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-[#f5f5f5]">AI Text Providers</h3>
                  <StatusBadge status={aiStatus === 'connected' ? 'ok' : aiStatus === 'checking' ? 'testing' : 'idle'} />
                </div>
                <p className="text-xs text-[#c2c2c2]/50">Used for prompt enhancement, text-to-tags, and tag suggestions.</p>

                <ProviderRow
                  label="Ollama"
                  url={ollamaUrl}
                  onUrlChange={setOllamaUrl}
                  testState={ollamaTest}
                  onTest={testOllama}
                  models={ollamaModels}
                  selectedModel={aiSettings.preferredAIModel}
                  onModelChange={m => { aiService.setSelectedModel(m); updateAISettings({ preferredAIModel: m, preferredAIProvider: 'ollama' }) }}
                  hint="localhost:11434"
                />

                <ProviderRow
                  label="LM Studio"
                  url={lmStudioUrl}
                  onUrlChange={setLmStudioUrl}
                  testState={lmStudioTest}
                  onTest={testLMStudio}
                  models={lmStudioModels}
                  selectedModel={aiSettings.preferredAIModel}
                  onModelChange={m => { aiService.setSelectedModel(m); updateAISettings({ preferredAIModel: m, preferredAIProvider: 'lmstudio' }) }}
                  hint="localhost:1234/v1"
                />

                <OpenAIProviderRow
                  url={openaiUrl}
                  apiKey={openaiApiKey}
                  onUrlChange={setOpenaiUrl}
                  onApiKeyChange={setOpenaiApiKey}
                  corsProxyUrl={corsProxyUrl}
                  onCorsProxyUrlChange={setCorsProxyUrl}
                  testState={openaiTest}
                  onTest={testOpenAI}
                  models={openaiModels}
                  selectedModel={aiSettings.preferredAIModel}
                  onModelChange={m => { aiService.setSelectedModel(m); updateAISettings({ preferredAIModel: m, preferredAIProvider: 'openai' }) }}
                  inputMode={openaiInputMode}
                  onInputModeChange={setOpenaiInputMode}
                  manualModel={openaiManualModel}
                  onManualModelChange={v => { aiService.setSelectedModel(v); setOpenaiManualModel(v) }}
                  onRefreshModels={testOpenAI}
                  testError={openaiTestError}
                />
              </section>

              <div className="h-px bg-[#1a1a1a]" />

              {/* Image Generation */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-[#f5f5f5]">Image Generation</h3>
                <p className="text-xs text-[#c2c2c2]/50">Send your prompt directly to a local image generator.</p>

                <SimpleProviderRow
                  label="Automatic1111"
                  url={a1111Url}
                  onUrlChange={setA1111Url}
                  testState={a1111Test}
                  onTest={() => testImageProvider('a1111', setA1111Test)}
                  hint="localhost:7860"
                />
                <SimpleProviderRow
                  label="ComfyUI"
                  url={comfyuiUrl}
                  onUrlChange={setComfyuiUrl}
                  testState={comfyuiTest}
                  onTest={() => testImageProvider('comfyui', setComfyuiTest)}
                  hint="localhost:8188"
                />
                <SimpleProviderRow
                  label="DrawThings"
                  url={drawthingsUrl}
                  onUrlChange={setDrawthingsUrl}
                  testState={drawthingsTest}
                  onTest={() => testImageProvider('drawthings', setDrawthingsTest)}
                  hint="localhost:3820"
                />
              </section>

              {/* Save */}
              <button
                onClick={() => { save(); onClose() }}
                className="w-full py-3 rounded-full bg-[#f5f5f5] text-black text-sm font-medium hover:bg-white transition-colors"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Sub-components ───────────────────────────────────────

function ProviderRow({
  label, url, onUrlChange, testState, onTest, models, selectedModel, onModelChange, hint,
}: {
  label: string
  url: string
  onUrlChange: (v: string) => void
  testState: TestState
  onTest: () => void
  models: AIModel[]
  selectedModel: string | null
  onModelChange: (v: string) => void
  hint: string
}) {
  return (
    <div className="space-y-2 p-4 border border-[#1a1a1a] rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#c2c2c2]">{label}</span>
        <StatusBadge status={testState} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          placeholder={hint}
          className="flex-1 px-3 py-2 bg-transparent border border-[#222] rounded-xl text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444]"
        />
        <button
          onClick={onTest}
          disabled={testState === 'testing'}
          className="px-4 py-2 rounded-xl border border-[#333] text-xs text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all disabled:opacity-40"
        >
          {testState === 'testing' ? 'Testing…' : 'Test'}
        </button>
      </div>
      {models.length > 0 && (
        <div>
          <label className="text-[10px] text-[#c2c2c2]/50 uppercase tracking-wider">Model</label>
          <select
            value={selectedModel ?? ''}
            onChange={e => onModelChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-xl text-xs text-[#f5f5f5] outline-none"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}{m.size ? ` (${m.size})` : ''}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function OpenAIProviderRow({
  url, apiKey, onUrlChange, onApiKeyChange, corsProxyUrl, onCorsProxyUrlChange, testState, onTest, models, selectedModel, onModelChange,
  inputMode, onInputModeChange, manualModel, onManualModelChange, onRefreshModels, testError,
}: {
  url: string
  apiKey: string
  onUrlChange: (v: string) => void
  onApiKeyChange: (v: string) => void
  corsProxyUrl: string
  onCorsProxyUrlChange: (v: string) => void
  testState: TestState
  onTest: () => void
  models: AIModel[]
  selectedModel: string | null
  onModelChange: (v: string) => void
  inputMode: 'auto' | 'manual'
  onInputModeChange: (mode: 'auto' | 'manual') => void
  manualModel: string
  onManualModelChange: (v: string) => void
  onRefreshModels: () => void
  testError?: string
}) {
  return (
    <div className="space-y-2 p-4 border border-[#1a1a1a] rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#c2c2c2]">OpenAI API</span>
        <StatusBadge status={testState} />
      </div>
      <p className="text-[10px] text-[#c2c2c2]/30 leading-relaxed">
        Works with any OpenAI-compatible endpoint. For OpenCode Go, use <code className="text-[#c2c2c2]/50">https://opencode.ai/zen/go/v1</code> with your Zen API key.
      </p>
      <input
        type="text"
        value={url}
        onChange={e => onUrlChange(e.target.value)}
        placeholder="https://opencode.ai/zen/go/v1"
        className="w-full px-3 py-2 bg-transparent border border-[#222] rounded-xl text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444]"
      />
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={e => onApiKeyChange(e.target.value)}
          placeholder="API key"
          className="flex-1 px-3 py-2 bg-transparent border border-[#222] rounded-xl text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444]"
        />
        <button
          onClick={onTest}
          disabled={testState === 'testing'}
          className="px-4 py-2 rounded-xl border border-[#333] text-xs text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all disabled:opacity-40"
        >
          {testState === 'testing' ? 'Testing…' : 'Test'}
        </button>
      </div>

      {/* CORS Proxy */}
      <div>
        <label className="text-[10px] text-[#c2c2c2]/40 uppercase tracking-wider mb-1 block">CORS Proxy (optional)</label>
        <input
          type="text"
          value={corsProxyUrl}
          onChange={e => onCorsProxyUrlChange(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          className="w-full px-3 py-2 bg-transparent border border-[#222] rounded-xl text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444]"
        />
        <p className="text-[10px] text-[#c2c2c2]/25 mt-1">
          Routes requests through a proxy to bypass CORS. Needed for OpenCode Go from the browser.
        </p>
      </div>

      {testError && testState === 'fail' && (
        <div className="space-y-1">
          <p className="text-[10px] text-red-400/60 leading-relaxed">{testError}</p>
          <p className="text-[10px] text-[#c2c2c2]/30 leading-relaxed">
            If you see a network error, the server may be blocking cross-origin (CORS) requests from your browser. Try building and running the production version, or use a CORS proxy.
          </p>
        </div>
      )}

      {/* Model selection: auto-discover or manual */}
      {(testState === 'ok' || models.length > 0 || inputMode === 'manual') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-[#c2c2c2]/50 uppercase tracking-wider">Model</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onInputModeChange('auto')}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${inputMode === 'auto' ? 'bg-white/10 text-[#f5f5f5]' : 'text-[#c2c2c2]/40 hover:text-[#c2c2c2]'}`}
              >
                Auto
              </button>
              <button
                onClick={() => onInputModeChange('manual')}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${inputMode === 'manual' ? 'bg-white/10 text-[#f5f5f5]' : 'text-[#c2c2c2]/40 hover:text-[#c2c2c2]'}`}
              >
                Manual
              </button>
            </div>
          </div>

          {inputMode === 'auto' && models.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedModel ?? ''}
                onChange={e => onModelChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-xl text-xs text-[#f5f5f5] outline-none"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.size ? ` (${m.size})` : ''}</option>
                ))}
              </select>
              <button
                onClick={onRefreshModels}
                className="px-3 py-2 rounded-xl border border-[#333] text-[10px] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5] transition-all"
                title="Refresh model list"
              >
                Refresh
              </button>
            </div>
          )}

          {inputMode === 'auto' && models.length === 0 && testState === 'ok' && (
            <p className="text-[10px] text-[#c2c2c2]/30">
              This provider doesn't expose a model list. Switch to Manual to enter a model ID.
            </p>
          )}

          {inputMode === 'manual' && (
            <div>
              <input
                type="text"
                value={manualModel}
                onChange={e => onManualModelChange(e.target.value)}
                placeholder="kimi-k2.5"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-xl text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444]"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['kimi-k2.5', 'kimi-k2.6', 'qwen3.6-plus', 'qwen3.5-plus', 'glm-5', 'deepseek-v4-flash'].map(m => (
                  <button
                    key={m}
                    onClick={() => onManualModelChange(m)}
                    className="text-[9px] px-2 py-0.5 rounded-full border border-[#333] text-[#c2c2c2]/40 hover:text-[#f5f5f5] hover:border-[#555] transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SimpleProviderRow({
  label, url, onUrlChange, testState, onTest, hint,
}: {
  label: string
  url: string
  onUrlChange: (v: string) => void
  testState: TestState
  onTest: () => void
  hint: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-[#1a1a1a] rounded-2xl">
      <span className="text-xs font-medium text-[#c2c2c2] w-28 flex-shrink-0">{label}</span>
      <input
        type="text"
        value={url}
        onChange={e => onUrlChange(e.target.value)}
        placeholder={hint}
        className="flex-1 px-3 py-1.5 bg-transparent border border-[#222] rounded-full text-xs text-[#f5f5f5] placeholder:text-[#c2c2c2]/30 outline-none focus:border-[#444]"
      />
      <button
        onClick={onTest}
        disabled={testState === 'testing'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#333] text-[10px] text-[#c2c2c2] hover:border-[#555] transition-all disabled:opacity-40 flex-shrink-0"
      >
        <StatusIcon state={testState} />
        {testState === 'testing' ? 'Testing' : 'Test'}
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: TestState | 'idle' }) {
  const map: Record<string, { label: string; cls: string }> = {
    idle: { label: 'Not tested', cls: 'text-[#c2c2c2]/40 border-[#333]' },
    testing: { label: 'Connecting…', cls: 'text-yellow-500/70 border-yellow-500/30' },
    ok: { label: 'Connected', cls: 'text-green-500/70 border-green-500/30' },
    fail: { label: 'Not found', cls: 'text-red-500/70 border-red-500/30' },
  }
  const { label, cls } = map[status] ?? map.idle
  return (
    <span className={cn('text-[9px] font-medium uppercase tracking-wider border rounded-full px-2 py-0.5', cls)}>
      {label}
    </span>
  )
}

function StatusIcon({ state }: { state: TestState }) {
  if (state === 'testing') return <CircleNotch weight="regular" className="w-2.5 h-2.5 animate-spin" />
  if (state === 'ok') return <Check weight="bold" className="w-2.5 h-2.5 text-green-500/70" />
  if (state === 'fail') return <Warning weight="fill" className="w-2.5 h-2.5 text-red-500/70" />
  return null
}
