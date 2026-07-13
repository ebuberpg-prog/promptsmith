import { describe, expect, it } from 'vitest'
import { isPrivateHost } from '@/services/local-ai-service'

describe('local AI address policy', () => {
  it('accepts loopback, private LAN, local DNS, and Tailscale ranges', () => {
    expect(isPrivateHost('localhost')).toBe(true)
    expect(isPrivateHost('127.0.0.1')).toBe(true)
    expect(isPrivateHost('192.168.1.55')).toBe(true)
    expect(isPrivateHost('10.0.0.4')).toBe(true)
    expect(isPrivateHost('172.20.0.4')).toBe(true)
    expect(isPrivateHost('100.88.1.2')).toBe(true)
    expect(isPrivateHost('studio.local')).toBe(true)
  })

  it('rejects public and lookalike addresses', () => {
    expect(isPrivateHost('api.openai.com')).toBe(false)
    expect(isPrivateHost('172.2.0.4')).toBe(false)
    expect(isPrivateHost('100.10.1.2')).toBe(false)
  })
})
