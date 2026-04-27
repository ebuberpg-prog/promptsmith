// ─────────────────────────────────────────────────────────
// Image Generation Service
// Supports A1111 (7860), ComfyUI (8188), DrawThings (3820)
// ─────────────────────────────────────────────────────────

export interface ImageGenRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  cfgScale?: number
  seed?: number
  model?: string
}

export interface ImageGenResult {
  images: string[]   // base64 data URLs
  seed?: number
  provider: ImageGenProviderId
}

export type ImageGenProviderId = 'a1111' | 'comfyui' | 'drawthings'

interface ImageGenProvider {
  id: ImageGenProviderId
  name: string
  baseUrl: string
  isAvailable(timeout?: number): Promise<boolean>
  generate(request: ImageGenRequest): Promise<ImageGenResult>
}

// ── A1111 / DrawThings Provider (shared format) ──────────

class SDWebUIProvider implements ImageGenProvider {
  id: ImageGenProviderId
  name: string
  baseUrl: string

  constructor(id: ImageGenProviderId, name: string, baseUrl: string) {
    this.id = id
    this.name = name
    this.baseUrl = baseUrl
  }

  async isAvailable(timeout = 2000): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      const res = await fetch(`${this.baseUrl}/sdapi/v1/sd-models`, { signal: controller.signal })
      clearTimeout(timer)
      return res.ok
    } catch {
      return false
    }
  }

  async generate(request: ImageGenRequest): Promise<ImageGenResult> {
    const body = {
      prompt: request.prompt,
      negative_prompt: request.negativePrompt ?? '',
      width: request.width ?? 512,
      height: request.height ?? 512,
      steps: request.steps ?? 20,
      cfg_scale: request.cfgScale ?? 7,
      seed: request.seed ?? -1,
    }

    const res = await fetch(`${this.baseUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`${this.name} error: ${res.status}`)
    const data = await res.json()

    return {
      images: (data.images ?? []).map((b64: string) => `data:image/png;base64,${b64}`),
      seed: data.info ? JSON.parse(data.info).seed : undefined,
      provider: this.id,
    }
  }
}

// ── ComfyUI Provider ─────────────────────────────────────

// Minimal txt2img workflow template — prompt injected at runtime
const COMFY_WORKFLOW_TEMPLATE = {
  "3": {
    "inputs": { "seed": 42, "steps": 20, "cfg": 7, "sampler_name": "euler", "scheduler": "normal",
      "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] },
    "class_type": "KSampler"
  },
  "4": { "inputs": { "ckpt_name": "v1-5-pruned-emaonly.ckpt" }, "class_type": "CheckpointLoaderSimple" },
  "5": { "inputs": { "width": 512, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
  "6": { "inputs": { "text": "POSITIVE_PROMPT", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
  "7": { "inputs": { "text": "NEGATIVE_PROMPT", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
  "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
  "9": { "inputs": { "filename_prefix": "muse", "images": ["8", 0] }, "class_type": "SaveImage" }
}

class ComfyUIProvider implements ImageGenProvider {
  id = 'comfyui' as const
  name = 'ComfyUI'
  baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async isAvailable(timeout = 2000): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      const res = await fetch(`${this.baseUrl}/system_stats`, { signal: controller.signal })
      clearTimeout(timer)
      return res.ok
    } catch {
      return false
    }
  }

  async generate(request: ImageGenRequest): Promise<ImageGenResult> {
    const workflow = JSON.parse(JSON.stringify(COMFY_WORKFLOW_TEMPLATE))
    workflow["6"].inputs.text = request.prompt
    workflow["7"].inputs.text = request.negativePrompt ?? 'low quality, bad anatomy'
    workflow["3"].inputs.seed = request.seed ?? Math.floor(Math.random() * 2 ** 32)
    workflow["3"].inputs.steps = request.steps ?? 20
    workflow["3"].inputs.cfg = request.cfgScale ?? 7
    workflow["5"].inputs.width = request.width ?? 512
    workflow["5"].inputs.height = request.height ?? 512

    // Submit workflow
    const submitRes = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    })
    if (!submitRes.ok) throw new Error(`ComfyUI submit error: ${submitRes.status}`)
    const { prompt_id } = await submitRes.json()

    // Poll for completion (max 60s)
    const start = Date.now()
    while (Date.now() - start < 60_000) {
      await sleep(1000)
      const histRes = await fetch(`${this.baseUrl}/history/${prompt_id}`)
      if (!histRes.ok) continue
      const history = await histRes.json()
      const entry = history[prompt_id]
      if (!entry) continue

      const outputs = entry.outputs ?? {}
      const images: string[] = []
      for (const node of Object.values(outputs) as { images?: { filename: string; subfolder: string; type: string }[] }[]) {
        for (const img of node.images ?? []) {
          const url = `${this.baseUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`
          const imgRes = await fetch(url)
          if (imgRes.ok) {
            const blob = await imgRes.blob()
            const b64 = await blobToBase64(blob)
            images.push(b64)
          }
        }
      }

      if (images.length > 0) {
        return { images, seed: workflow["3"].inputs.seed, provider: 'comfyui' }
      }
    }

    throw new Error('ComfyUI timed out after 60s')
  }
}

// ── ImageGenManager ──────────────────────────────────────

export type ImageGenStatus = 'idle' | 'checking' | 'generating' | 'error'

export interface ImageGenState {
  status: ImageGenStatus
  availableProviders: ImageGenProviderId[]
  activeProvider: ImageGenProviderId | null
  lastResult: ImageGenResult | null
  error: string | null
}

class ImageGenManager {
  private providers: Map<ImageGenProviderId, ImageGenProvider> = new Map()
  private active: ImageGenProvider | null = null
  private _status: ImageGenStatus = 'idle'
  private _lastResult: ImageGenResult | null = null
  private _error: string | null = null
  private _availableProviders: ImageGenProviderId[] = []
  private listeners = new Set<(state: ImageGenState) => void>()

  subscribe(cb: (state: ImageGenState) => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private emit() {
    const state = this.getState()
    this.listeners.forEach(cb => cb(state))
  }

  getState(): ImageGenState {
    return {
      status: this._status,
      availableProviders: this._availableProviders,
      activeProvider: this.active?.id ?? null,
      lastResult: this._lastResult,
      error: this._error,
    }
  }

  setUrls(a1111Url: string, comfyuiUrl: string, drawthingsUrl: string) {
    this.providers.set('a1111', new SDWebUIProvider('a1111', 'Automatic1111', a1111Url))
    this.providers.set('comfyui', new ComfyUIProvider(comfyuiUrl))
    this.providers.set('drawthings', new SDWebUIProvider('drawthings', 'DrawThings', drawthingsUrl))
  }

  async testProvider(id: ImageGenProviderId): Promise<boolean> {
    const provider = this.providers.get(id)
    if (!provider) return false
    return provider.isAvailable(3000)
  }

  async discover(preferred?: ImageGenProviderId | null): Promise<void> {
    this._status = 'checking'
    this.emit()

    const order: ImageGenProviderId[] = ['a1111', 'drawthings', 'comfyui']
    const available: ImageGenProviderId[] = []

    for (const id of order) {
      const provider = this.providers.get(id)
      if (!provider) continue
      const ok = await provider.isAvailable(1500)
      if (ok) available.push(id)
    }

    this._availableProviders = available
    const preferredAvailable = preferred && available.includes(preferred)
    const first = preferredAvailable ? preferred : available[0]
    this.active = first ? (this.providers.get(first) ?? null) : null
    this._status = 'idle'
    this.emit()
  }

  setActiveProvider(id: ImageGenProviderId) {
    const provider = this.providers.get(id)
    if (provider) {
      this.active = provider
      this.emit()
    }
  }

  async generate(request: ImageGenRequest): Promise<ImageGenResult> {
    if (!this.active) throw new Error('No image generation provider connected')
    this._status = 'generating'
    this._error = null
    this.emit()

    try {
      const result = await this.active.generate(request)
      this._lastResult = result
      this._status = 'idle'
      this.emit()
      return result
    } catch (err) {
      this._error = String(err)
      this._status = 'error'
      this.emit()
      throw err
    }
  }
}

export const imageGenService = new ImageGenManager()

// Initialize with default URLs
imageGenService.setUrls(
  'http://localhost:7860',
  'http://localhost:8188',
  'http://localhost:3820'
)

// ── Helpers ──────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
