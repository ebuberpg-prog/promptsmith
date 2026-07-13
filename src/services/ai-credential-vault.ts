import type { LocalAIProviderId } from '@/types'

const PREFIX = 'muse-ai-session-key:'

export function getSessionAIKey(provider: LocalAIProviderId) {
  if (provider === 'ollama' || provider === 'lmstudio') return ''
  try { return sessionStorage.getItem(`${PREFIX}${provider}`) ?? '' } catch { return '' }
}

export function setSessionAIKey(provider: LocalAIProviderId, value: string) {
  if (provider === 'ollama' || provider === 'lmstudio') return
  try {
    if (value) sessionStorage.setItem(`${PREFIX}${provider}`, value)
    else sessionStorage.removeItem(`${PREFIX}${provider}`)
  } catch { /* Session-only credentials may be unavailable in restricted browsers. */ }
}
