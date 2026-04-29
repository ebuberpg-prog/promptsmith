import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { aiService, type AIModel, type ProviderStatus } from '@/services/local-ai-service'
import { X, CircleNotch } from '@phosphor-icons/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { applyPwaUpdate, checkForPwaUpdates, getPwaUpdateState, subscribePwaUpdates } from '@/utils/pwa-updater'

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

  const [ollamaTest, setOllamaTest] = useState<TestState>('idle')
  const [lmStudioTest, setLmStudioTest] = useState<TestState>('idle')
  const [openaiTest, setOpenaiTest] = useState<TestState>('idle')

  const [openaiTestError, setOpenaiTestError] = useState<string>('')

  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([])
  const [lmStudioModels, setLmStudioModels] = useState<AIModel[]>([])
  const [openaiModels, setOpenaiModels] = useState<AIModel[]>([])
  const [aiStatus, setAIStatus] = useState<ProviderStatus>('disconnected')
  const [openaiInputMode, setOpenaiInputMode] = useState<'auto' | 'manual'>(aiSettings.openaiModelInputMode)
  const [openaiManualModel, setOpenaiManualModel] = useState(aiSettings.openaiManualModel)
  const [pwaUpdateState, setPwaUpdateState] = useState(getPwaUpdateState())

  // Sync from store when opened
  useEffect(() => {
    if (isOpen) {
      setOllamaUrl(aiSettings.ollamaUrl)
      setLmStudioUrl(aiSettings.lmStudioUrl)
      setOpenaiUrl(aiSettings.openaiUrl)
      setOpenaiApiKey(aiSettings.openaiApiKey)
      setCorsProxyUrl(aiSettings.corsProxyUrl)
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

  useEffect(() => subscribePwaUpdates(() => setPwaUpdateState(getPwaUpdateState())), [])

  const save = useCallback(() => {
    updateAISettings({
      ollamaUrl, lmStudioUrl, openaiUrl, openaiApiKey,
      openaiModelInputMode: openaiInputMode,
      openaiManualModel,
      corsProxyUrl,
    })
    aiService.setUrls(ollamaUrl, lmStudioUrl, openaiUrl, openaiApiKey, corsProxyUrl)
    if (aiSettings.preferredAIModel) {
      aiService.setSelectedModel(aiSettings.preferredAIModel)
    }
    if (aiSettings.preferredAIProvider) {
      aiService.setActiveProvider(aiSettings.preferredAIProvider)
    }
  }, [ollamaUrl, lmStudioUrl, openaiUrl, openaiApiKey, openaiInputMode, openaiManualModel, corsProxyUrl, updateAISettings, aiSettings.preferredAIModel, aiSettings.preferredAIProvider])

  const testOllama = async () => {
    save()
    setOllamaTest('testing')
    setOllamaModels([])
    const { ok, models } = await aiService.testProvider('ollama')
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
    const { ok, models } = await aiService.testProvider('lmstudio')
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-[var(--ui-bg)] border-l border-[var(--ui-surface)] z-[80] overflow-y-auto scrollbar-hide"
          >
            <div className="p-8 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-normal text-[var(--ui-text)] tracking-tight">AI Connections</h2>
                  <p className="text-xs text-[var(--ui-muted-text)]/60 mt-1">
                    Connect to local AI services or any OpenAI-compatible API.
                  </p>
                </div>
                <button
                  onClick={() => { save(); onClose() }}
                  className="text-[var(--ui-muted-text)]/50 hover:text-[var(--ui-text)] transition-colors"
                >
                  <X weight="regular" className="w-5 h-5" />
                </button>
              </div>

              {/* AI Text Providers */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-[var(--ui-text)]">AI Text Providers</h3>
                  <StatusBadge status={aiStatus === 'connected' ? 'ok' : aiStatus === 'checking' ? 'testing' : 'idle'} />
                </div>
                <p className="text-xs text-[var(--ui-muted-text)]/50">Used for prompt enhancement, text-to-tags, and tag suggestions.</p>

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

              <div className="h-px bg-[var(--ui-surface)]" />

              <div className="h-px bg-[var(--ui-surface)]" />

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-[var(--ui-text)]">App Updates</h3>
                  <StatusBadge status={mapPwaStatusToTestState(pwaUpdateState.status)} />
                </div>
                <div className="flex items-center justify-between gap-4 p-4 border border-[var(--ui-surface)] rounded-2xl">
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--ui-text)]">Refresh cached app files when a new build is available.</p>
                    <p className="text-[10px] text-[var(--ui-muted-text)]/50">{pwaUpdateState.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={checkForPwaUpdates}
                      disabled={pwaUpdateState.status === 'checking' || pwaUpdateState.status === 'updating'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--ui-border)] text-[10px] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] transition-all disabled:opacity-40"
                    >
                      {pwaUpdateState.status === 'checking' ? <CircleNotch weight="regular" className="w-2.5 h-2.5 animate-spin" /> : null}
                      Check now
                    </button>
                    {pwaUpdateState.status === 'available' && (
                      <button
                        onClick={applyPwaUpdate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors duration-150"
                        style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
                      >
                        Update now
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Save */}
              <button
                onClick={() => { save(); onClose() }}
                className="w-full py-3 rounded-full bg-[var(--ui-text)] text-[var(--ui-bg)] text-sm font-medium hover:bg-[var(--ui-surface)] transition-colors"
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
    <div className="space-y-2 p-4 border border-[var(--ui-surface)] rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--ui-muted-text)]">{label}</span>
        <StatusBadge status={testState} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          placeholder={hint}
          className="flex-1 px-3 py-2 bg-transparent border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/30 outline-none focus:border-[var(--ui-border-hover)]"
        />
        <button
          onClick={onTest}
          disabled={testState === 'testing'}
          className="px-4 py-2 rounded-xl border border-[var(--ui-border)] text-xs text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] transition-all disabled:opacity-40"
        >
          {testState === 'testing' ? 'Testing…' : 'Test'}
        </button>
      </div>
      {models.length > 0 && (
        <div>
          <label className="text-[10px] text-[var(--ui-muted-text)]/50 uppercase tracking-wider">Model</label>
          <select
            value={selectedModel ?? ''}
            onChange={e => onModelChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] outline-none"
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
    <div className="space-y-2 p-4 border border-[var(--ui-surface)] rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--ui-muted-text)]">OpenAI API</span>
        <StatusBadge status={testState} />
      </div>
      <p className="text-[10px] text-[var(--ui-muted-text)]/30 leading-relaxed">
        Paste any OpenAI-compatible base URL and API key here. PromptSmith will connect directly to local or LAN servers, and will automatically use the API Gateway for hosted providers so they work cleanly in the browser and installed PWA. Example URLs: <code className="text-[var(--ui-muted-text)]/50">https://opencode.ai/zen/go/v1</code> for OpenCode Go and <code className="text-[var(--ui-muted-text)]/50">https://integrate.api.nvidia.com/v1</code> for NVIDIA NIM.
      </p>
      <input
        type="text"
        value={url}
        onChange={e => onUrlChange(e.target.value)}
        placeholder="https://opencode.ai/zen/go/v1"
        className="w-full px-3 py-2 bg-transparent border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/30 outline-none focus:border-[var(--ui-border-hover)]"
      />
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={e => onApiKeyChange(e.target.value)}
          placeholder="API key"
          className="flex-1 px-3 py-2 bg-transparent border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/30 outline-none focus:border-[var(--ui-border-hover)]"
        />
        <button
          onClick={onTest}
          disabled={testState === 'testing'}
          className="px-4 py-2 rounded-xl border border-[var(--ui-border)] text-xs text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] transition-all disabled:opacity-40"
        >
          {testState === 'testing' ? 'Testing…' : 'Test'}
        </button>
      </div>

      {/* API Gateway */}
      <div>
        <label className="text-[10px] text-[var(--ui-muted-text)]/40 uppercase tracking-wider mb-1 block">API Gateway</label>
        <input
          type="text"
          value={corsProxyUrl}
          onChange={e => onCorsProxyUrlChange(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          className="w-full px-3 py-2 bg-transparent border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/30 outline-none focus:border-[var(--ui-border-hover)]"
        />
        <p className="text-[10px] text-[var(--ui-muted-text)]/25 mt-1">
          This is only used for hosted HTTPS providers. Leave the default gateway in place, or swap it for your own worker if you want to self-host it.
        </p>
      </div>

      {testError && testState === 'fail' && (
        <div className="space-y-1">
          <p className="text-[10px] text-red-400/60 leading-relaxed">{testError}</p>
          <p className="text-[10px] text-[var(--ui-muted-text)]/30 leading-relaxed">
            For NVIDIA: some models need to be enabled in build.nvidia.com before requests will succeed. Local and LAN servers do not use the gateway.
          </p>
        </div>
      )}

      {/* Model selection: auto-discover or manual */}
      {(testState === 'ok' || models.length > 0 || inputMode === 'manual') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-[var(--ui-muted-text)]/50 uppercase tracking-wider">Model</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onInputModeChange('auto')}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${inputMode === 'auto' ? 'bg-[var(--ui-surface-soft)] text-[var(--ui-text)]' : 'text-[var(--ui-muted-text)]/40 hover:text-[var(--ui-muted-text)]'}`}
              >
                Auto
              </button>
              <button
                onClick={() => onInputModeChange('manual')}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${inputMode === 'manual' ? 'bg-[var(--ui-surface-soft)] text-[var(--ui-text)]' : 'text-[var(--ui-muted-text)]/40 hover:text-[var(--ui-muted-text)]'}`}
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
                className="flex-1 px-3 py-2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] outline-none"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.size ? ` (${m.size})` : ''}</option>
                ))}
              </select>
              <button
                onClick={onRefreshModels}
                className="px-3 py-2 rounded-xl border border-[var(--ui-border)] text-[10px] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] transition-all"
                title="Refresh model list"
              >
                Refresh
              </button>
            </div>
          )}

          {inputMode === 'auto' && models.length === 0 && testState === 'ok' && (
            <p className="text-[10px] text-[var(--ui-muted-text)]/30">
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
                className="w-full px-3 py-2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted-text)]/30 outline-none focus:border-[var(--ui-border-hover)]"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['kimi-k2.5', 'kimi-k2.6', 'qwen3.6-plus', 'qwen3.5-plus', 'glm-5', 'deepseek-v4-flash'].map(m => (
                  <button
                    key={m}
                    onClick={() => onManualModelChange(m)}
                    className="text-[9px] px-2 py-0.5 rounded-full border border-[var(--ui-border)] text-[var(--ui-muted-text)]/40 hover:text-[var(--ui-text)] hover:border-[var(--ui-border-hover)] transition-colors"
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



function StatusBadge({ status }: { status: TestState | 'idle' }) {
  const map: Record<string, { label: string; cls: string }> = {
    idle: { label: 'Not tested', cls: 'text-[var(--ui-muted-text)]/40 border-[var(--ui-border)]' },
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

function mapPwaStatusToTestState(status: 'idle' | 'checking' | 'available' | 'updating' | 'offline-ready' | 'error'): TestState | 'idle' {
  if (status === 'checking' || status === 'updating') return 'testing'
  if (status === 'available' || status === 'offline-ready') return 'ok'
  if (status === 'error') return 'idle'
  return 'idle'
}


