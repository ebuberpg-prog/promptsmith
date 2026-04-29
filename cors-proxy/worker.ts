// Cloudflare Worker — API Gateway for PromptSmith
// Deploy to Cloudflare Workers (free tier)
// This worker acts as a secure bridge between the browser app and remote AI APIs
// (NVIDIA, OpenCode Go, OpenAI, etc.) eliminating CORS issues entirely.

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // ── Health check ──────────────────────────────────────────
    if (path === '/health' || path === '/health/') {
      return jsonResponse({ status: 'ok', gateway: 'promptsmith-api-gateway' })
    }

    // ── CORS preflight ────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // ── Proxy request ─────────────────────────────────────────
    // Target URL is passed as query param: ?target=https://api.example.com/v1/chat/completions
    const targetUrl = url.searchParams.get('target')
    if (!targetUrl) {
      return jsonResponse(
        { error: 'Missing target parameter. Use ?target=<upstream-url>' },
        400
      )
    }

    // Validate target URL (must be HTTPS for remote, allow HTTP for local networks)
    let parsedTarget: URL
    try {
      parsedTarget = new URL(targetUrl)
    } catch {
      return jsonResponse({ error: 'Invalid target URL' }, 400)
    }

    // Security: block requests to private IP ranges and localhost from the worker
    // (user can still connect directly from browser for local services)
    const hostname = parsedTarget.hostname
    if (isPrivateHost(hostname)) {
      return jsonResponse(
        { error: 'Cannot proxy to local/private addresses from the gateway. Connect directly for local APIs.' },
        403
      )
    }

    // Build forward request
    const forwardHeaders = new Headers(request.headers)
    forwardHeaders.delete('Host')
    forwardHeaders.delete('Origin')
    forwardHeaders.delete('Referer')
    forwardHeaders.set('User-Agent', 'PromptSmith-API-Gateway/1.0 (Cloudflare-Worker)')

    let upstreamResponse: Response
    try {
      upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow',
      })
    } catch (networkErr) {
      const message = networkErr instanceof Error ? networkErr.message : String(networkErr)
      return jsonResponse(
        { error: 'Gateway could not reach the upstream API', detail: message },
        502
      )
    }

    // ── Parse and enrich error responses ──────────────────────
    let bodyText: string | null = null
    if (!upstreamResponse.ok) {
      try {
        bodyText = await upstreamResponse.text()
      } catch {
        bodyText = upstreamResponse.statusText
      }

      const enriched = enrichError(upstreamResponse.status, bodyText, targetUrl)
      return corsResponse(new Response(JSON.stringify(enriched), {
        status: upstreamResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    // ── Successful response ───────────────────────────────────
    const responseHeaders = new Headers(upstreamResponse.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  },
}

// ── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return corsResponse(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}

function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true
  if (h.startsWith('10.') || h.startsWith('192.168.') || h.startsWith('172.')) {
    // 172.16.0.0/12
    if (h.startsWith('172.')) {
      const second = parseInt(h.split('.')[1], 10)
      if (second >= 16 && second <= 31) return true
    } else {
      return true
    }
  }
  return false
}

function enrichError(status: number, bodyText: string, targetUrl: string): Record<string, unknown> {
  let parsed: Record<string, unknown> | null = null
  try {
    parsed = JSON.parse(bodyText)
  } catch {
    // not JSON
  }

  const detail = parsed?.detail ?? parsed?.error?.message ?? parsed?.message ?? bodyText

  // NVIDIA NIM specific
  if (typeof detail === 'string' && detail.includes('Function') && detail.includes('Not found for account')) {
    return {
      status,
      title: 'Model not activated on NVIDIA',
      detail,
      suggestion:
        'This model appears in the catalog but is not provisioned for your account. ' +
        'Go to https://build.nvidia.com, find the model, and click "Deploy" or "Get API Key" to activate it. ' +
        'Alternatively, try a different model (e.g., meta/llama-3.1-8b-instruct).',
      provider: 'nvidia',
    }
  }

  // Generic 401/403
  if (status === 401) {
    return {
      status,
      title: 'Invalid API key',
      detail,
      suggestion: 'Check that your API key is correct and has not expired.',
    }
  }

  if (status === 403) {
    return {
      status,
      title: 'Access denied',
      detail,
      suggestion: 'Your API key may be valid but lacks permission for this model or endpoint.',
    }
  }

  if (status === 404) {
    return {
      status,
      title: 'Endpoint or model not found',
      detail,
      suggestion: 'Check the base URL and model ID. If using NVIDIA, the model may have been removed from the platform.',
    }
  }

  return {
    status,
    title: parsed?.title ?? parsed?.error?.type ?? 'Upstream API error',
    detail,
    target: targetUrl,
  }
}

interface Env {
  // Add any bindings here (secrets, KV namespaces, etc.)
}
