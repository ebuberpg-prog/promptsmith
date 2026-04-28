// Cloudflare Worker CORS proxy for OpenAI-compatible APIs
// Deploy to Cloudflare Workers (free tier)
// Replace YOUR_WORKER_URL with the deployed worker URL in the app settings

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    // The target URL is passed as a query parameter: ?target=https://opencode.ai/zen/go/v1/models
    const targetUrl = url.searchParams.get('target')
    if (!targetUrl) {
      return new Response('Missing target parameter', { status: 400 })
    }

    // Forward the request
    const headers = new Headers(request.headers)
    headers.delete('Host')
    headers.delete('Origin')
    headers.delete('Referer')

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    })

    // Add CORS headers to the response
    const corsHeaders = new Headers(response.headers)
    corsHeaders.set('Access-Control-Allow-Origin', '*')
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
    })
  },
}

interface Env {
  // Add any bindings here (secrets, KV namespaces, etc.)
}
