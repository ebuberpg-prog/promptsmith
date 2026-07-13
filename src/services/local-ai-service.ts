import type { AIEnhancementRequest, AIEnhancementResult, EnhancementGoal, FormatFamily, LocalAIProviderId, LocalModelCapabilities } from '@/types'
import { getSessionAIKey } from './ai-credential-vault'

export interface AIModel {
  id: string
  name: string
  size?: string
  provider: LocalAIProviderId
  capabilities: LocalModelCapabilities
}

export type ProviderStatus = 'checking' | 'connected' | 'disconnected' | 'running'

export interface AIServiceState {
  status: ProviderStatus
  activeProvider: LocalAIProviderId | null
  availableProviders: LocalAIProviderId[]
  availableModels: AIModel[]
  selectedModel: string | null
  destination: string | null
  error: string | null
}

interface CompletionRequest {
  model: string
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxTokens?: number
  format?: 'text' | 'json'
  imageBase64?: string
  imageMimeType?: string
  signal?: AbortSignal
}

interface Provider {
  id: LocalAIProviderId
  name: string
  baseUrl: string
  isAvailable(timeout?: number): Promise<boolean>
  listModels(): Promise<AIModel[]>
  complete(request: CompletionRequest): Promise<string>
}

const VISION_NAME_HINT = /(?:vision|llava|moondream|bakllava|minicpm-v|qwen2(?:\.5)?-vl|gemma-3|gemma3|gemma-4|gemma4|mimo-v2\.5(?:-pro)?|mimo-v2-omni)/i

function capabilitiesFor(model: string): LocalModelCapabilities {
  return { text: true, vision: VISION_NAME_HINT.test(model) }
}

function normalizeBaseUrl(value: string, provider: LocalAIProviderId): string {
  const fallback = provider === 'ollama' ? 'http://localhost:11434' : provider === 'lmstudio' ? 'http://localhost:1234/v1' : provider === 'openai-compatible' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1'
  const candidate = (value || fallback).trim().replace(/\/+$/, '')
  let parsed: URL
  try { parsed = new URL(candidate) } catch { throw new Error(`${provider === 'ollama' ? 'Ollama' : 'LM Studio'} URL is invalid.`) }
  if ((provider === 'ollama' || provider === 'lmstudio') && !isPrivateHost(parsed.hostname)) throw new Error('Local providers only connect to loopback, private LAN, .local, or Tailscale addresses.')
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Local AI must use http or https.')
  return parsed.toString().replace(/\/$/, '')
}

class CompatibleProvider implements Provider {
  readonly name: string
  constructor(readonly id: 'openai-compatible' | 'anthropic-compatible', readonly baseUrl: string, readonly gatewayUrl = '') { this.name = id === 'openai-compatible' ? 'OpenAI compatible' : 'Anthropic compatible' }
  private requestUrl(upstreamUrl: string) { return this.id === 'openai-compatible' && this.gatewayUrl ? `${this.gatewayUrl}/?target=${encodeURIComponent(upstreamUrl)}` : upstreamUrl }
  private headers(): Record<string, string> {
    const key = getSessionAIKey(this.id)
    if (!key) throw new Error(`Enter a session API key for ${this.name} in Settings.`)
    return this.id === 'openai-compatible'
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
      : { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
  }
  async isAvailable(timeout = 5000) {
    const pending = timeoutSignal(timeout)
    try {
      return (await fetch(this.requestUrl(`${this.baseUrl}/models`), { headers: this.headers(), signal: pending.signal })).ok
    } catch { return false } finally { pending.clear() }
  }
  async listModels(): Promise<AIModel[]> {
    let response: Response
    const modelsUrl = this.requestUrl(`${this.baseUrl}/models`)
    try { response = await fetch(modelsUrl, { headers: this.headers() }) }
    catch { throw new Error(`The browser could not reach ${this.baseUrl}/models${this.gatewayUrl ? ' through the configured gateway' : ''}. Check the URL, network, and CORS policy.`) }
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      const summary = response.status === 401 || response.status === 403 ? 'The API key was rejected.'
        : response.status === 404 ? 'No model-list endpoint exists at this base URL.'
          : compactProviderError(detail)
      throw new Error(`${this.name} returned ${response.status}. ${summary}`)
    }
    const data = await response.json() as { data?: Array<{ id: string }> }
    const openCodeGo = this.id === 'openai-compatible' && /\/zen\/go\/v1$/i.test(this.baseUrl)
    return (data.data ?? []).map((model) => ({
      id: model.id,
      name: model.id,
      provider: this.id,
      capabilities: openCodeGo ? { text: true, vision: model.id.toLocaleLowerCase() === 'mimo-v2.5' } : capabilitiesFor(model.id),
    }))
  }
  async complete(request: CompletionRequest) {
    if (this.id === 'anthropic-compatible') {
      const content: unknown = request.imageBase64 ? [{ type: 'text', text: request.userMessage }, { type: 'image', source: { type: 'base64', media_type: request.imageMimeType ?? 'image/jpeg', data: request.imageBase64 } }] : request.userMessage
      const response = await fetch(`${this.baseUrl}/messages`, { method: 'POST', headers: this.headers(), signal: request.signal, body: JSON.stringify({ model: request.model, system: request.systemPrompt, messages: [{ role: 'user', content }], max_tokens: request.maxTokens ?? 600, temperature: request.temperature ?? 0.25 }) })
      if (!response.ok) throw new Error(await completionError(this.name, response))
      const data = await response.json() as { content?: Array<{ type: string; text?: string }> }
      return data.content?.find((part) => part.type === 'text')?.text?.trim() ?? ''
    }
    const openCodeGoMessages = /\/zen\/go\/v1$/i.test(this.baseUrl) && /^(?:minimax-m|qwen3\.)/i.test(request.model)
    if (openCodeGoMessages) {
      const endpoint = this.requestUrl(`${this.baseUrl}/messages`)
      const content: unknown = request.imageBase64 ? [{ type: 'text', text: request.userMessage }, { type: 'image', source: { type: 'base64', media_type: request.imageMimeType ?? 'image/jpeg', data: request.imageBase64 } }] : request.userMessage
      const basePayload = { model: request.model, system: request.systemPrompt, messages: [{ role: 'user', content }], temperature: request.temperature ?? 0.25, max_tokens: request.maxTokens ?? 600 }
      let response = await fetch(endpoint, { method: 'POST', headers: this.headers(), signal: request.signal, body: JSON.stringify({ ...basePayload, thinking: { type: 'disabled' } }) })
      if (await rejectsThinkingOptions(response)) response = await fetch(endpoint, { method: 'POST', headers: this.headers(), signal: request.signal, body: JSON.stringify(basePayload) })
      if (!response.ok) throw new Error(await completionError(this.name, response))
      const data = await response.json() as { content?: Array<{ type?: string; text?: string }> }
      return data.content?.find((part) => part.type === 'text')?.text?.trim() ?? ''
    }
    const endpoint = this.requestUrl(`${this.baseUrl}/chat/completions`)
    const userContent: unknown = request.imageBase64 ? [{ type: 'text', text: request.userMessage }, { type: 'image_url', image_url: { url: `data:${request.imageMimeType ?? 'image/jpeg'};base64,${request.imageBase64}` } }] : request.userMessage
    const basePayload = { model: request.model, messages: [{ role: 'system', content: request.systemPrompt }, { role: 'user', content: userContent }], temperature: request.temperature ?? 0.25, max_tokens: request.maxTokens ?? 600 }
    const isOpenCodeGo = /\/zen\/go\/v1$/i.test(this.baseUrl)
    let response = await fetch(endpoint, { method: 'POST', headers: this.headers(), signal: request.signal, body: JSON.stringify(isOpenCodeGo ? { ...basePayload, enable_thinking: false, chat_template_kwargs: { enable_thinking: false } } : basePayload) })
    if (isOpenCodeGo && await rejectsThinkingOptions(response)) response = await fetch(endpoint, { method: 'POST', headers: this.headers(), signal: request.signal, body: JSON.stringify(basePayload) })
    if (!response.ok) throw new Error(await completionError(this.name, response))
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  }
}

function compactProviderError(value: string) {
  try {
    const parsed = JSON.parse(value) as { error?: { message?: string } | string; message?: string }
    const message = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message ?? parsed.message
    if (message) return String(message).replace(/\s+/g, ' ').slice(0, 180)
  } catch { /* Use the plain response below. */ }
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180) || 'The provider did not explain the failure.'
}

async function completionError(providerName: string, response: Response) {
  const detail = compactProviderError(await response.text().catch(() => ''))
  if (response.status === 401) return `${providerName}: ${detail || 'The API key was rejected.'}`
  if (response.status === 403) return `${providerName}: ${detail || 'The key does not have access to this model.'}`
  if (response.status === 404) return `${providerName}: ${detail || 'The completion endpoint or model was not found.'}`
  return `${providerName} returned ${response.status}. ${detail}`
}

async function rejectsThinkingOptions(response: Response) {
  if (response.ok || ![400, 422, 500].includes(response.status)) return false
  const detail = await response.clone().text().catch(() => '')
  return /reasoning_effort|enable_thinking|chat_template_kwargs|thinking.+(?:invalid|unsupported|literal_error)/i.test(detail)
}

function timeoutSignal(timeout: number, parent?: AbortSignal) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), timeout)
  parent?.addEventListener('abort', () => controller.abort(parent.reason), { once: true })
  return { signal: controller.signal, clear: () => window.clearTimeout(timer) }
}

class OllamaProvider implements Provider {
  readonly id = 'ollama' as const
  readonly name = 'Ollama'
  constructor(readonly baseUrl: string) {}

  async isAvailable(timeout = 3000) {
    const pending = timeoutSignal(timeout)
    try { return (await fetch(`${this.baseUrl}/api/tags`, { signal: pending.signal })).ok } catch { return false } finally { pending.clear() }
  }

  async listModels(): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`)
    if (!response.ok) return []
    const data = await response.json() as { models?: Array<{ name: string; size?: number }> }
    return (data.models ?? []).map((model) => ({
      id: model.name,
      name: model.name,
      size: model.size ? formatBytes(model.size) : undefined,
      provider: this.id,
      capabilities: capabilitiesFor(model.name),
    }))
  }

  async complete(request: CompletionRequest) {
    const user: Record<string, unknown> = { role: 'user', content: request.userMessage }
    if (request.imageBase64) user.images = [request.imageBase64]
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        messages: [{ role: 'system', content: request.systemPrompt }, user],
        stream: false,
        options: { temperature: request.temperature ?? 0.25, num_predict: request.maxTokens ?? 600 },
        ...(request.format === 'json' ? { format: 'json' } : {}),
      }),
    })
    if (!response.ok) throw new Error(`Ollama returned ${response.status}. Check that the model is loaded.`)
    const data = await response.json() as { message?: { content?: string } }
    return data.message?.content?.trim() ?? ''
  }
}

class LMStudioProvider implements Provider {
  readonly id = 'lmstudio' as const
  readonly name = 'LM Studio'
  constructor(readonly baseUrl: string) {}

  async isAvailable(timeout = 3000) {
    const pending = timeoutSignal(timeout)
    try { return (await fetch(`${this.baseUrl}/models`, { signal: pending.signal })).ok } catch { return false } finally { pending.clear() }
  }

  async listModels(): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/models`)
    if (!response.ok) return []
    const data = await response.json() as { data?: Array<{ id: string }> }
    let advertised = new Map<string, LocalModelCapabilities>()
    try {
      const nativeRoot = this.baseUrl.replace(/\/v1$/, '')
      const nativeResponse = await fetch(`${nativeRoot}/api/v1/models`)
      if (nativeResponse.ok) {
        const nativeData = await nativeResponse.json() as { models?: Array<{ key?: string; capabilities?: { vision?: boolean } }> }
        advertised = new Map((nativeData.models ?? []).filter((model) => model.key).map((model) => [model.key!, { text: true, vision: Boolean(model.capabilities?.vision) }]))
      }
    } catch { /* OpenAI-compatible metadata remains the fallback. */ }
    return (data.data ?? []).map((model) => ({ id: model.id, name: model.id, provider: this.id, capabilities: advertised.get(model.id) ?? capabilitiesFor(model.id) }))
  }

  async complete(request: CompletionRequest) {
    const userContent: unknown = request.imageBase64 ? [
      { type: 'text', text: request.userMessage },
      { type: 'image_url', image_url: { url: `data:${request.imageMimeType ?? 'image/jpeg'};base64,${request.imageBase64}` } },
    ] : request.userMessage
    const payload: Record<string, unknown> = {
        model: request.model,
        messages: [{ role: 'system', content: request.systemPrompt }, { role: 'user', content: userContent }],
        temperature: request.temperature ?? 0.25,
        max_tokens: request.maxTokens ?? 600,
        ...(request.format === 'json' ? { response_format: { type: 'json_object' } } : {}),
      }
    let response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
      body: JSON.stringify(payload),
    })
    // Some LM Studio model runtimes accept OpenAI chat completions but reject
    // response_format. Retry once without it; the system prompt still requests JSON.
    if (response.status === 400 && request.format === 'json') {
      const compatiblePayload: Record<string, unknown> = { ...payload }
      delete compatiblePayload.response_format
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
        body: JSON.stringify(compatiblePayload),
      })
    }
    if (response.status === 400 && request.imageBase64) {
      const compatiblePayload: Record<string, unknown> = {
        ...payload,
        messages: [{ role: 'user', content: [
          { type: 'text', text: `${request.systemPrompt}\n\n${request.userMessage}` },
          { type: 'image_url', image_url: { url: `data:${request.imageMimeType ?? 'image/jpeg'};base64,${request.imageBase64}` } },
        ] }],
      }
      delete compatiblePayload.response_format
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
        body: JSON.stringify(compatiblePayload),
      })
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      const hint = /image|vision|multimodal/i.test(detail)
        ? 'The loaded model or template rejected image input. Load a vision model in LM Studio and retry.'
        : 'Check the local server and loaded model.'
      throw new Error(`LM Studio returned ${response.status}. ${hint}`)
    }
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  }
}

const GOAL_COPY: Record<EnhancementGoal, string> = {
  'preserve-intent': 'Clarify visual detail while changing as little as possible.',
  'more-visual': 'Make at least one concrete revision that makes the visual qualities more specific.',
  lighting: 'Make at least one concrete revision that strengthens only the lighting direction.',
  composition: 'Make at least one concrete revision that strengthens composition, framing, spatial arrangement, or point of view.',
  concise: 'Make a concrete revision that removes repetition and makes the direction more concise.',
}

const FORMAT_ENHANCEMENT_GUIDANCE: Record<FormatFamily, string> = {
  'tag-list': 'Use short, concrete, visually specific wording. Keep it readable as authored direction; do not return a comma-delimited tag dump.',
  'natural-language': 'Use fluent, cohesive descriptive prose with natural sentence rhythm.',
  'structured-instruction': 'Use precise concepts that can later be separated into structured fields, but do not add headings, labels, bullets, or sections.',
  'midjourney-params': 'Use compact, high-signal visual concepts. Do not add --parameters, weights, or Midjourney syntax.',
  custom: 'Remain format-neutral. Improve only the authored artistic direction.',
}

const ENHANCEMENT_SYSTEM = `You revise authored art-direction text inside a private prompt studio.
Preserve the subject, action, relationships, medium, location, and important wording.
Use selected ingredients only as supporting context; never turn them into formatter headings.
The requested format family may guide diction and density only. Never perform final formatting.
Never insert field headings, bullet lists, tag-list delimiters, weights, negative-prompt syntax, model parameters, or template wrappers.
Do not invent a new location, objects, equipment, artist names, neon, bokeh, 8K, masterpiece, best quality, or other quality clichés.
Do not add contradictions. Return only replacement authored text with no heading, quotes, explanation, or markdown.`

const TAG_SYSTEM = `Suggest complementary visual taxonomy labels for the supplied art direction. Return only a JSON array of 3 to 6 labels. When allowed labels are supplied, copy choices verbatim from that list. Do not repeat existing labels and do not add quality clichés.`
const IMAGE_SYSTEM = `Analyze this image as a visual reference. Return only a JSON array of 10 to 16 concise visual labels covering visible subject, objects, setting, lighting, mood, medium, color, texture and composition. Each array item must contain exactly one concept. Never combine concepts with commas, semicolons, slashes or "and". Do not infer identity or hidden context.`
const NEGATIVE_SYSTEM = `Return JSON with detectedIssues and negatives. Negatives must address technical image-generation failure modes only. Shape: {"detectedIssues":[],"negatives":[{"text":"","reason":"","priority":1,"category":"quality"}]}`

class AIServiceManager {
  private providers = new Map<LocalAIProviderId, Provider>()
  private active: Provider | null = null
  private models: AIModel[] = []
  private selectedByProvider: Partial<Record<LocalAIProviderId, string>> = {}
  private status: ProviderStatus = 'disconnected'
  private availableProviders: LocalAIProviderId[] = []
  private error: string | null = null
  private listeners = new Set<(state: AIServiceState) => void>()
  private activeController: AbortController | null = null

  constructor() { this.setUrls('http://localhost:11434', 'http://localhost:1234/v1') }
  subscribe(callback: (state: AIServiceState) => void) { this.listeners.add(callback); return () => { this.listeners.delete(callback) } }
  private emit() { const state = this.getState(); this.listeners.forEach((listener) => listener(state)) }
  getState(): AIServiceState {
    const selectedModel = this.active ? this.selectedByProvider[this.active.id] ?? this.models[0]?.id ?? null : null
    return { status: this.status, activeProvider: this.active?.id ?? null, availableProviders: this.availableProviders, availableModels: this.models, selectedModel, destination: this.active ? `${this.active.name} · ${selectedModel ?? 'no model'} · ${this.active.baseUrl}` : null, error: this.error }
  }

  setUrls(ollamaUrl: string, lmStudioUrl: string) {
    this.providers.delete('ollama'); this.providers.delete('lmstudio')
    try { this.providers.set('ollama', new OllamaProvider(normalizeBaseUrl(ollamaUrl, 'ollama'))) } catch (error) { this.error = error instanceof Error ? error.message : 'Invalid Ollama URL.' }
    try { this.providers.set('lmstudio', new LMStudioProvider(normalizeBaseUrl(lmStudioUrl, 'lmstudio'))) } catch (error) { this.error = error instanceof Error ? error.message : 'Invalid LM Studio URL.' }
  }

  setCompatibleUrls(openAIUrl: string, anthropicUrl: string, gatewayUrl = '') {
    const normalizedGateway = gatewayUrl.trim().replace(/\/+$/, '')
    try { if (normalizedGateway && new URL(normalizedGateway).protocol !== 'https:') throw new Error('The remote API gateway must use HTTPS.'); } catch (error) { this.error = error instanceof Error ? error.message : 'Invalid API gateway URL.' }
    try { this.providers.set('openai-compatible', new CompatibleProvider('openai-compatible', normalizeBaseUrl(openAIUrl, 'openai-compatible'), normalizedGateway)) } catch (error) { this.error = error instanceof Error ? error.message : 'Invalid OpenAI-compatible URL.' }
    try { this.providers.set('anthropic-compatible', new CompatibleProvider('anthropic-compatible', normalizeBaseUrl(anthropicUrl, 'anthropic-compatible'))) } catch (error) { this.error = error instanceof Error ? error.message : 'Invalid Anthropic-compatible URL.' }
  }

  async discover(preferred?: LocalAIProviderId | null) {
    this.status = 'checking'; this.error = null; this.emit()
    const candidates = preferred ? [preferred] : (['ollama', 'lmstudio'] as LocalAIProviderId[])
    const results = await Promise.all(candidates.map(async (id) => ({ id, ok: await this.providers.get(id)?.isAvailable() ?? false })))
    this.availableProviders = results.filter((item) => item.ok).map((item) => item.id)
    const chosen = preferred && this.availableProviders.includes(preferred) ? preferred : this.availableProviders[0]
    if (!chosen) { this.active = null; this.models = []; this.status = 'disconnected'; this.error = 'No local AI server was found.'; this.emit(); return }
    await this.activate(chosen)
  }

  async testProvider(id: LocalAIProviderId) {
    const provider = this.providers.get(id)
    if (!provider) return { ok: false, models: [] as AIModel[], error: `The ${id} connection is not configured.` }
    try {
      if ((id === 'ollama' || id === 'lmstudio') && !await provider.isAvailable(5000)) return { ok: false, models: [] as AIModel[], error: `Could not reach ${provider.name} at its configured address.` }
      const models = await provider.listModels()
      return models.length ? { ok: true, models } : { ok: false, models, error: 'The provider returned an empty model list.' }
    } catch (error) {
      return { ok: false, models: [] as AIModel[], error: error instanceof Error ? error.message : `Could not test ${provider.name}.` }
    }
  }

  async activate(id: LocalAIProviderId) {
    const provider = this.providers.get(id)
    if (!provider) return
    this.active = provider
    this.models = await provider.listModels()
    if (!this.selectedByProvider[id] || !this.models.some((model) => model.id === this.selectedByProvider[id])) this.selectedByProvider[id] = this.models[0]?.id
    this.status = this.models.length ? 'connected' : 'disconnected'
    this.error = this.models.length ? null : 'The local server is available but no model is loaded.'
    this.emit()
  }

  setActiveProvider(id: LocalAIProviderId) {
    this.active = this.providers.get(id) ?? null
    this.models = []
    this.status = 'disconnected'
    this.error = null
    this.emit()
  }
  setSelectedModel(model: string) { if (this.active) this.selectedByProvider[this.active.id] = model; this.emit() }
  getSelectedModelCapabilities() {
    const selectedModel = this.getState().selectedModel
    if (!selectedModel) return { text: true, vision: false }
    if (this.active?.id === 'openai-compatible' && /\/zen\/go\/v1$/i.test(this.active.baseUrl)) return { text: true, vision: selectedModel.toLocaleLowerCase() === 'mimo-v2.5' }
    const advertised = this.models.find((model) => model.id === selectedModel)?.capabilities
    const inferred = capabilitiesFor(selectedModel)
    return { text: advertised?.text ?? true, vision: Boolean(advertised?.vision || inferred.vision) }
  }
  cancelActiveRequest() { this.activeController?.abort(); this.activeController = null; if (this.active) this.status = 'connected'; this.emit() }

  private async complete(request: Omit<CompletionRequest, 'model' | 'signal'>, timeout = 45_000) {
    if (!this.active) throw new Error('Choose and connect an AI provider in Settings first.')
    const model = this.getState().selectedModel
    if (!model) throw new Error('Load and select a local model first.')
    this.activeController = new AbortController()
    const pending = timeoutSignal(timeout, this.activeController.signal)
    this.status = 'running'; this.error = null; this.emit()
    try { return await this.active.complete({ ...request, model, signal: pending.signal }) }
    catch (error) {
      if ((error as Error).name === 'AbortError' || (error as Error).name === 'TimeoutError') throw new Error('The AI provider took too long. Your draft was not changed; retry when the model is ready.')
      throw error
    } finally { pending.clear(); this.activeController = null; this.status = this.active ? 'connected' : 'disconnected'; this.emit() }
  }

  async enhancePrompt(request: AIEnhancementRequest | string): Promise<AIEnhancementResult> {
    const normalized: AIEnhancementRequest = typeof request === 'string' ? { authoredText: request, ingredients: [], goal: 'preserve-intent' } : request
    const authored = normalized.authoredText.trim()
    if (!authored) throw new Error('Write some authored text before enhancing it.')
    const ingredientContext = normalized.ingredients.map((item) => `${item.label} (${item.dimension ?? 'ingredient'}, weight ${item.weight ?? 1})`).join('; ') || 'None'
    const family = normalized.formatFamily ?? 'custom'
    const customGuidance = normalized.formatGuidance?.replace(/\s+/g, ' ').trim().slice(0, 300)
    const formatGuidance = customGuidance || FORMAT_ENHANCEMENT_GUIDANCE[family]
    const content = await this.complete({
      systemPrompt: ENHANCEMENT_SYSTEM,
      userMessage: `Goal: ${GOAL_COPY[normalized.goal]}\nFormat family: ${family}\nFormat-family wording guidance: ${formatGuidance}\nRemember: return authored wording only; deterministic formatting happens later.\nAuthored text (preserve its intent):\n${authored}\nSelected ingredients (context only):\n${ingredientContext}`,
      temperature: 0.2,
      maxTokens: 650,
    })
    const text = sanitizeReplacement(content)
    if (!text) throw new Error('The AI provider did not return usable replacement text. Your draft was left untouched.')
    if (text.toLocaleLowerCase() === authored.toLocaleLowerCase()) throw new Error('No changes were suggested. Try More visual, Stronger lighting, Stronger composition, or More concise.')
    if (text.length > Math.max(1800, authored.length * 5)) throw new Error('The AI provider returned an unexpectedly long result. Your draft was left untouched.')
    return { text, provider: this.active!.id, model: this.getState().selectedModel!, goal: normalized.goal, completedAt: Date.now() }
  }

  async suggestTags(currentTags: string[], authoredText = '', allowedLabels: string[] = []): Promise<string[]> {
    const allowed = allowedLabels.length ? `\nAllowed labels (choose only from these): ${allowedLabels.join(', ')}` : ''
    const content = await this.complete({ systemPrompt: TAG_SYSTEM, userMessage: `Authored text: ${authoredText}\nExisting labels: ${currentTags.join(', ')}${allowed}`, format: 'json', maxTokens: 220 })
    const parsed = parseStringArray(content)
    if (parsed.length > 0) return parsed
    const mentioned = exactAllowedMentions(content, allowedLabels)
    if (mentioned.length > 0 || allowedLabels.length === 0) return mentioned
    const fallback = await this.complete({
      systemPrompt: 'Choose 3 to 6 complementary labels verbatim from the allowed list. Return only a comma-separated list. No explanation.',
      userMessage: `Art direction: ${authoredText}\nExisting labels: ${currentTags.join(', ')}\nAllowed labels: ${allowedLabels.join(', ')}`,
      maxTokens: 160,
    })
    return exactAllowedMentions(fallback, allowedLabels)
  }

  async imageToTags(imageBase64: string, imageMimeType = 'image/jpeg') {
    if (!this.getSelectedModelCapabilities().vision) throw new Error('The selected local model is not marked as vision-capable. Choose a vision model, then retry.')
    return parseStringArray(await this.complete({ systemPrompt: IMAGE_SYSTEM, userMessage: 'Analyze this reference only after this explicit request. Return 10 to 16 separate atomic labels.', imageBase64, imageMimeType, format: 'json', maxTokens: 500 })).slice(0, 16)
  }

  async analyzeNegatives(prompt: string): Promise<{ detectedIssues: string[]; negatives: Array<{ text: string; reason: string; priority: number; category: string }> }> {
    const content = await this.complete({ systemPrompt: NEGATIVE_SYSTEM, userMessage: prompt, format: 'json', maxTokens: 500 })
    try {
      const parsed = JSON.parse(stripFences(content)) as { detectedIssues?: unknown[]; negatives?: Array<{ text: string; reason: string; priority: number; category: string }> }
      return { detectedIssues: (parsed.detectedIssues ?? []).map(String), negatives: Array.isArray(parsed.negatives) ? parsed.negatives : [] }
    } catch { return { detectedIssues: [], negatives: [] } }
  }
}

function sanitizeReplacement(value: string) {
  const cleaned = stripFences(value).replace(/^(?:enhanced prompt|replacement|result)\s*:\s*/i, '').trim().replace(/^(["'])([\s\S]*)\1$/, '$2').trim()
  if (/^(?:here(?:'s| is)|i (?:have|will)|sure[,!])/i.test(cleaned)) return ''
  return cleaned
}

function stripFences(value: string) { return value.replace(/^```(?:json|text)?\s*/i, '').replace(/```$/i, '').trim() }
function parseStringArray(value: string): string[] {
  const cleaned = stripFences(value)
  try {
    const parsed = JSON.parse(cleaned) as unknown
    const list = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed
        ? Object.values(parsed).flatMap((entry) => Array.isArray(entry) ? entry : typeof entry === 'string' ? [entry] : [])
        : []
    if (list.length > 0) return list.map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item).trim()
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const preferred = record.label ?? record.name ?? record.tag ?? record.text ?? record.description
        if (typeof preferred === 'string') return preferred.trim()
        const firstString = Object.values(record).find((entry) => typeof entry === 'string')
        return typeof firstString === 'string' ? firstString.trim() : ''
      }
      return ''
    }).filter(Boolean)
  } catch { /* Small local models sometimes return plain lists despite instructions. */ }
  return cleaned.split(/[\n,;]+/).map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^['"]|['"]$/g, '').trim()).filter((item) => item.length >= 2 && item.length <= 80).slice(0, 12)
}
function exactAllowedMentions(value: string, allowedLabels: string[]): string[] {
  const normalized = value.toLocaleLowerCase()
  return allowedLabels.filter((label) => normalized.includes(label.toLocaleLowerCase())).slice(0, 6)
}
function formatBytes(bytes: number) { return bytes < 1e9 ? `${(bytes / 1e6).toFixed(0)}MB` : `${(bytes / 1e9).toFixed(1)}GB` }

export function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1', 'host.docker.internal'].includes(host) || host.endsWith('.local')) return true
  if (host.startsWith('10.') || host.startsWith('192.168.')) return true
  const parts = host.split('.').map(Number)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true
  return false
}

export const aiService = new AIServiceManager()
