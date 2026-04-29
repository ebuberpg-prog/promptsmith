import { describe, expect, it } from 'vitest'
import { isPrivateHost, normalizeOpenAIBaseUrl, selectOpenAITransport } from '@/services/local-ai-service'

describe('normalizeOpenAIBaseUrl', () => {
  it('strips common OpenAI endpoint suffixes', () => {
    expect(normalizeOpenAIBaseUrl('https://integrate.api.nvidia.com/v1/chat/completions')).toBe(
      'https://integrate.api.nvidia.com'
    )
    expect(normalizeOpenAIBaseUrl('https://opencode.ai/zen/go/v1/models')).toBe(
      'https://opencode.ai/zen/go'
    )
    expect(normalizeOpenAIBaseUrl('https://example.com/v1/')).toBe('https://example.com/v1')
  })
})

describe('isPrivateHost', () => {
  it('detects common local and private hosts', () => {
    expect(isPrivateHost('localhost')).toBe(true)
    expect(isPrivateHost('127.0.0.1')).toBe(true)
    expect(isPrivateHost('192.168.1.55')).toBe(true)
    expect(isPrivateHost('host.docker.internal')).toBe(true)
    expect(isPrivateHost('studio.local')).toBe(true)
    expect(isPrivateHost('api.openai.com')).toBe(false)
  })
})

describe('selectOpenAITransport', () => {
  it('uses the gateway for remote https endpoints when available', () => {
    expect(selectOpenAITransport('https://integrate.api.nvidia.com/v1', 'https://gateway.example.com')).toBe('gateway')
  })

  it('stays direct for local and private endpoints even when a gateway exists', () => {
    expect(selectOpenAITransport('http://localhost:1234/v1', 'https://gateway.example.com')).toBe('direct')
    expect(selectOpenAITransport('http://192.168.1.25:1234/v1', 'https://gateway.example.com')).toBe('direct')
  })

  it('stays direct when no gateway is configured or the URL is not https', () => {
    expect(selectOpenAITransport('https://example.com/v1', '')).toBe('direct')
    expect(selectOpenAITransport('http://example.com/v1', 'https://gateway.example.com')).toBe('direct')
    expect(selectOpenAITransport('not-a-url', 'https://gateway.example.com')).toBe('direct')
  })
})
