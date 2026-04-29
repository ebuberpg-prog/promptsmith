// ─────────────────────────────────────────────────────────
// Local-First AI Service Layer
// Supports Ollama (localhost:11434), LM Studio (localhost:1234),
// and any OpenAI-compatible API (e.g. opencode-go)
// ─────────────────────────────────────────────────────────

export interface AIModel {
  id: string
  name: string
  size?: string
  provider: 'ollama' | 'lmstudio' | 'openai'
}

export interface AICompletionRequest {
  model: string
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxTokens?: number
  format?: 'text' | 'json'
  /** Raw base64 image data (no data URI prefix) for vision models */
  imageBase64?: string
  /** MIME type of the image, e.g. 'image/jpeg'. Defaults to 'image/jpeg'. */
  imageMimeType?: string
}

export interface AICompletionResponse {
  content: string
  model: string
  provider: 'ollama' | 'lmstudio' | 'openai'
}

interface AIProvider {
  id: 'ollama' | 'lmstudio' | 'openai'
  name: string
  baseUrl: string
  isAvailable(timeout?: number): Promise<boolean>
  listModels(): Promise<AIModel[]>
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
}

// ── Ollama Provider ──────────────────────────────────────

class OllamaProvider implements AIProvider {
  id = 'ollama' as const
  name = 'Ollama'
  baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async isAvailable(timeout = 2000): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal })
      clearTimeout(timer)
      return res.ok
    } catch {
      return false
    }
  }

  async listModels(): Promise<AIModel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`)
      if (!res.ok) return []
      const data = await res.json()
      return (data.models ?? []).map((m: { name: string; size?: number }) => ({
        id: m.name,
        name: m.name,
        size: m.size ? formatBytes(m.size) : undefined,
        provider: 'ollama' as const,
      }))
    } catch {
      return []
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const userMessage: Record<string, unknown> = { role: 'user', content: request.userMessage }
    if (request.imageBase64) {
      userMessage.images = [request.imageBase64]
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          userMessage,
        ],
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 500,
        },
        ...(request.format === 'json' ? { format: 'json' } : {}),
      }),
    })
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
    const data = await res.json()
    return {
      content: data.message?.content ?? '',
      model: request.model,
      provider: 'ollama',
    }
  }
}

// ── LM Studio Provider (OpenAI-compatible) ──────────────

class LMStudioProvider implements AIProvider {
  id = 'lmstudio' as const
  name = 'LM Studio'
  baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async isAvailable(timeout = 2000): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      const res = await fetch(`${this.baseUrl}/models`, { signal: controller.signal })
      clearTimeout(timer)
      return res.ok
    } catch {
      return false
    }
  }

  async listModels(): Promise<AIModel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`)
      if (!res.ok) return []
      const data = await res.json()
      return (data.data ?? []).map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
        provider: 'lmstudio' as const,
      }))
    } catch {
      return []
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const userContent: unknown = request.imageBase64
      ? [
          { type: 'text', text: request.userMessage },
          {
            type: 'image_url',
            image_url: {
              url: `data:${request.imageMimeType ?? 'image/jpeg'};base64,${request.imageBase64}`,
            },
          },
        ]
      : request.userMessage

    const body: Record<string, unknown> = {
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 500,
    }
    if (request.model) body.model = request.model

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`LM Studio error ${res.status}: ${errText}`)
    }
    const data = await res.json()
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? request.model,
      provider: 'lmstudio',
    }
  }
}

// ── OpenAI-Compatible Provider ───────────────────────────

class OpenAICompatibleProvider implements AIProvider {
  id = 'openai' as const
  name = 'OpenAI API'
  baseUrl: string
  apiKey: string
  corsProxyUrl: string

  constructor(baseUrl: string, apiKey: string, corsProxyUrl: string) {
    // Strip trailing slashes and common endpoint suffixes so users can paste
    // full URLs like https://integrate.api.nvidia.com/v1/chat/completions
    this.baseUrl = baseUrl
      .replace(/\/+$/, '')
      .replace(/\/v1\/chat\/completions$/i, '')
      .replace(/\/chat\/completions$/i, '')
      .replace(/\/v1\/models$/i, '')
      .replace(/\/models$/i, '')
    this.apiKey = apiKey
    this.corsProxyUrl = corsProxyUrl.replace(/\/+$/, '')
  }

  buildUrl(path: string): string {
    const fullUrl = `${this.baseUrl}${path}`
    if (this.corsProxyUrl) {
      return `${this.corsProxyUrl}/?target=${encodeURIComponent(fullUrl)}`
    }
    return fullUrl
  }

  headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h.Authorization = `Bearer ${this.apiKey}`
    return h
  }

  async isAvailable(timeout = 5000): Promise<boolean> {
    if (!this.baseUrl || this.baseUrl === 'https://') return false
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      let res = await fetch(this.buildUrl('/models'), {
        signal: controller.signal,
        headers: this.headers(),
      }).catch(() => null)
      clearTimeout(timer)
      if (res?.ok) return true

      const controller2 = new AbortController()
      const timer2 = setTimeout(() => controller2.abort(), timeout)
      res = await fetch(this.buildUrl('/chat/completions'), {
        method: 'POST',
        signal: controller2.signal,
        headers: this.headers(),
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      }).catch(() => null)
      clearTimeout(timer2)
      if (res) {
        return res.ok || res.status === 400 || res.status === 401 || res.status === 403 || res.status === 422
      }
      return false
    } catch {
      return false
    }
  }

  async listModels(): Promise<AIModel[]> {
    try {
      const res = await fetch(this.buildUrl('/models'), { headers: this.headers() })
      if (!res.ok) {
        console.warn('[OpenAI] /models returned', res.status)
        return []
      }
      const data = await res.json()
      console.log('[OpenAI] /models response:', JSON.stringify(data).slice(0, 500))
      // Handle both { data: [...] } and { models: [...] } and array responses
      const rawModels = data.data ?? data.models ?? (Array.isArray(data) ? data : [])
      return rawModels.map((m: { id: string; name?: string }) => {
        // Keep the full model ID (including vendor prefixes like nvidia/ or meta/)
        // because many OpenAI-compatible providers require the full path in API calls.
        const fullId = m.id
        const prefixMatch = fullId.match(/^([a-z0-9-]+)\//i)
        const shortName = prefixMatch ? fullId.slice(prefixMatch[0].length) : fullId
        return {
          id: fullId,
          name: m.name ?? shortName,
          provider: 'openai' as const,
        }
      })
    } catch (e) {
      console.error('[OpenAI] listModels error:', e)
      return []
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const userContent: unknown = request.imageBase64
      ? [
          { type: 'text', text: request.userMessage },
          {
            type: 'image_url',
            image_url: {
              url: `data:${request.imageMimeType ?? 'image/jpeg'};base64,${request.imageBase64}`,
            },
          },
        ]
      : request.userMessage

    const body: Record<string, unknown> = {
      model: request.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 500,
    }

    const res = await fetch(this.buildUrl('/chat/completions'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      // Detect NVIDIA-specific "Function not found for account" errors
      if (errText.includes('Function') && errText.includes('Not found for account')) {
        throw new Error(
          `NVIDIA API error: This model is not activated for your account. ` +
          `Go to build.nvidia.com, find the model, and click "Get API Key" or "Deploy" to enable it. ` +
          `If the issue persists, try a different model (e.g., meta/llama-3.1-8b-instruct) or generate a new API key.`
        )
      }
      throw new Error(`OpenAI API error ${res.status}: ${errText}`)
    }
    const data = await res.json()
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? request.model,
      provider: 'openai',
    }
  }
}

// ── System prompts ────────────────────────────────────────

const ENHANCE_SYSTEM_PROMPT = `You are an expert AI image prompt engineer. Enhance the given prompt to produce better results from AI image generators.
- Add specific lighting, mood, and atmosphere details
- Reference art styles when appropriate
- Keep it concise (under 150 words)
Return ONLY the enhanced prompt text, no explanation.`

const TEXT_TO_TAGS_SYSTEM_PROMPT = `You are a tag extraction assistant for an AI image prompt builder.
Given a description, extract keywords that match image generation tags.
Return ONLY a JSON array of strings: ["tag1", "tag2", ...]
Maximum 12 tags. Prefer specific, visual descriptors. No explanation.`

const SUGGEST_TAGS_SYSTEM_PROMPT = `You are an AI image composition assistant.
Given selected tags, suggest 5-8 complementary tags that would enhance the image.
Return ONLY a JSON array of strings: ["suggestion1", "suggestion2", ...]
Do not repeat tags already selected. No explanation.`

const IMAGE_TO_TAGS_SYSTEM_PROMPT = `You are an expert at analyzing images for AI image generation prompts.
Examine the provided image carefully and extract descriptive tags that capture its visual content.
Return ONLY a JSON array of strings covering: subject/characters, environment/setting, lighting, mood/atmosphere, art style, color palette, composition, and notable visual elements.
Maximum 15 tags. Prefer specific single-word or short descriptors. No explanation.
Example: ["portrait", "forest", "golden hour", "melancholic", "cinematic", "mist", "detailed", "oil painting"]`

const ANALYZE_NEGATIVES_SYSTEM_PROMPT = `You are an expert at Stable Diffusion negative prompts. Analyze the given image generation prompt and return a JSON object identifying common failure modes.

Return ONLY valid JSON in this exact shape:
{
  "detectedIssues": ["issue1", "issue2"],
  "negatives": [
    { "text": "bad anatomy", "reason": "Human figures often have distorted proportions", "priority": 1, "category": "anatomy" }
  ]
}

Categories: "quality" | "anatomy" | "hands" | "artifacts" | "face"
Priority: 1=high, 2=medium, 3=low
Return 6-10 targeted negatives. No explanation outside the JSON.`

// ── AIServiceManager ─────────────────────────────────────

export type ProviderStatus = 'checking' | 'connected' | 'disconnected'

export interface AIServiceState {
  status: ProviderStatus
  activeProvider: 'ollama' | 'lmstudio' | 'openai' | null
  availableProviders: ('ollama' | 'lmstudio' | 'openai')[]
  availableModels: AIModel[]
  selectedModel: string | null
}

class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map()
  private active: AIProvider | null = null
  private _models: AIModel[] = []
  private _selectedModel: string | null = null
  private _status: ProviderStatus = 'disconnected'
  private _availableProviders: ('ollama' | 'lmstudio' | 'openai')[] = []
  private listeners = new Set<(state: AIServiceState) => void>()

  subscribe(cb: (state: AIServiceState) => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private emit() {
    const state = this.getState()
    this.listeners.forEach(cb => cb(state))
  }

  getState(): AIServiceState {
    return {
      status: this._status,
      activeProvider: this.active?.id ?? null,
      availableProviders: this._availableProviders,
      availableModels: this._models,
      selectedModel: this._selectedModel,
    }
  }

  setUrls(ollamaUrl: string, lmStudioUrl: string, openaiUrl: string, openaiApiKey: string, corsProxyUrl?: string) {
    this.providers.set('ollama', new OllamaProvider(ollamaUrl))
    this.providers.set('lmstudio', new LMStudioProvider(lmStudioUrl))
    this.providers.set('openai', new OpenAICompatibleProvider(openaiUrl, openaiApiKey, corsProxyUrl || ''))
  }

  async discover(preferredProvider?: 'ollama' | 'lmstudio' | 'openai' | null): Promise<void> {
    this._status = 'checking'
    this.emit()

    const ids: ('ollama' | 'lmstudio' | 'openai')[] = ['ollama', 'lmstudio', 'openai']
    const results = await Promise.all(
      ids.map(async (id) => {
        const provider = this.providers.get(id)
        if (!provider) return { id, ok: false }
        const ok = await provider.isAvailable(3000)
        return { id, ok }
      })
    )

    this._availableProviders = results.filter(r => r.ok).map(r => r.id)

    if (this._availableProviders.length === 0) {
      this.active = null
      this._status = 'disconnected'
      this._models = []
      this.emit()
      return
    }

    const pickId = preferredProvider && this._availableProviders.includes(preferredProvider)
      ? preferredProvider
      : this._availableProviders[0]

    const picked = this.providers.get(pickId)!
    this.active = picked
    this._models = await picked.listModels()
    if (this._models.length > 0 && !this._selectedModel) {
      this._selectedModel = this._models[0].id
    }
    this._status = 'connected'
    this.emit()
  }

  async testProvider(id: 'ollama' | 'lmstudio' | 'openai'): Promise<{ ok: boolean; models: AIModel[]; error?: string }> {
    const provider = this.providers.get(id)
    if (!provider) return { ok: false, models: [], error: 'Provider not configured' }
    const ok = await provider.isAvailable(5000)
    if (!ok) {
      if (id === 'openai') {
        const p = provider as OpenAICompatibleProvider
        try {
          const res = await fetch(p.buildUrl('/models'), {
            headers: p.headers(),
          }).catch(() => null)
          if (res?.status === 401) return { ok: false, models: [], error: 'Invalid API key (401 Unauthorized)' }
          if (res?.status === 403) return { ok: false, models: [], error: 'Access forbidden (403). Check your API key and subscription.' }
          if (res?.status === 404) return { ok: false, models: [], error: 'Endpoint not found (404). Check the URL.' }
          if (!res) return { ok: false, models: [], error: 'Network error — the proxy or target server may be unreachable.' }
        } catch {
          return { ok: false, models: [], error: 'Connection failed. Check the URL and proxy.' }
        }
      }
      return { ok: false, models: [], error: 'Could not reach the provider' }
    }
    const models = await provider.listModels()
    return { ok: true, models }
  }

  setSelectedModel(model: string) {
    this._selectedModel = model
    this.emit()
  }

  setActiveProvider(id: 'ollama' | 'lmstudio' | 'openai') {
    const provider = this.providers.get(id)
    if (provider) {
      this.active = provider
      this._status = 'connected'
      this.emit()
    }
  }

  private get activeModel(): string {
    return this._selectedModel ?? this._models[0]?.id ?? ''
  }

  async enhancePrompt(prompt: string): Promise<string> {
    if (!this.active) throw new Error('No AI provider connected')
    const res = await this.active.complete({
      model: this.activeModel,
      systemPrompt: ENHANCE_SYSTEM_PROMPT,
      userMessage: prompt,
    })
    return res.content.trim()
  }

  async textToTags(description: string): Promise<string[]> {
    if (!this.active) throw new Error('No AI provider connected')
    const res = await this.active.complete({
      model: this.activeModel,
      systemPrompt: TEXT_TO_TAGS_SYSTEM_PROMPT,
      userMessage: description,
      format: 'json',
    })
    try {
      const parsed = JSON.parse(res.content)
      if (Array.isArray(parsed)) return parsed.map(String)
      const first = Object.values(parsed)[0]
      if (Array.isArray(first)) return first.map(String)
    } catch {
      return res.content.replace(/[[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  async analyzeNegatives(prompt: string): Promise<{
    detectedIssues: string[]
    negatives: { text: string; reason: string; priority: number; category: string }[]
  }> {
    if (!this.active) throw new Error('No AI provider connected')
    const res = await this.active.complete({
      model: this.activeModel,
      systemPrompt: ANALYZE_NEGATIVES_SYSTEM_PROMPT,
      userMessage: prompt,
      format: 'json',
    })
    try {
      const parsed = JSON.parse(res.content)
      return {
        detectedIssues: Array.isArray(parsed.detectedIssues) ? parsed.detectedIssues.map(String) : [],
        negatives: Array.isArray(parsed.negatives) ? parsed.negatives : [],
      }
    } catch {
      return { detectedIssues: [], negatives: [] }
    }
  }

  async suggestTags(currentTags: string[]): Promise<string[]> {
    if (!this.active) throw new Error('No AI provider connected')
    const res = await this.active.complete({
      model: this.activeModel,
      systemPrompt: SUGGEST_TAGS_SYSTEM_PROMPT,
      userMessage: `Current tags: ${currentTags.join(', ')}`,
      format: 'json',
    })
    try {
      const parsed = JSON.parse(res.content)
      if (Array.isArray(parsed)) return parsed.map(String)
      const first = Object.values(parsed)[0]
      if (Array.isArray(first)) return first.map(String)
    } catch {
      return res.content.replace(/[[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  async imageToTags(imageBase64: string, imageMimeType = 'image/jpeg'): Promise<string[]> {
    if (!this.active) throw new Error('No AI provider connected')
    const res = await this.active.complete({
      model: this.activeModel,
      systemPrompt: IMAGE_TO_TAGS_SYSTEM_PROMPT,
      userMessage: 'Analyze this image and return descriptive tags as a JSON array.',
      imageBase64,
      imageMimeType,
    })
    try {
      const clean = res.content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) return parsed.map(String)
      const first = Object.values(parsed)[0]
      if (Array.isArray(first)) return first.map(String)
    } catch {
      return res.content.replace(/[[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }
}

// ── Singleton export ─────────────────────────────────────

export const aiService = new AIServiceManager()

// Initialize with default URLs (all local except OpenAI which is empty)
aiService.setUrls('http://localhost:11434', 'http://localhost:1234/v1', '', '')

// ── Helpers ──────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)}MB`
  return `${(bytes / 1e9).toFixed(1)}GB`
}
