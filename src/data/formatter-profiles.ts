import type { FormatterProfile, SupportedModel } from '@/types'

export const DEFAULT_FORMATTER_PROFILE_ID = 'format:natural-language'

export const BUILT_IN_FORMATTER_PROFILES: FormatterProfile[] = [
  { id: 'format:natural-language', name: 'Natural language', family: 'natural-language', model: 'gpt-image', supportsNegative: false, supportsWeighting: false, triggerWordStyle: 'inline', parameterDefaults: {}, isBuiltIn: true },
  { id: 'format:tag-list', name: 'Tag list', family: 'tag-list', model: 'stable-diffusion', supportsNegative: true, supportsWeighting: true, triggerWordStyle: 'prefix', parameterDefaults: {}, isBuiltIn: true },
  { id: 'format:midjourney-params', name: 'Midjourney parameters', family: 'midjourney-params', model: 'midjourney', supportsNegative: false, supportsWeighting: true, triggerWordStyle: 'prefix', parameterDefaults: { aspectRatio: '16:9' }, isBuiltIn: true },
  { id: 'format:structured-instruction', name: 'Structured instruction', family: 'structured-instruction', model: 'gpt-image', supportsNegative: false, supportsWeighting: false, triggerWordStyle: 'inline', parameterDefaults: {}, isBuiltIn: true },
  { id: 'format:custom', name: 'Custom', family: 'custom', model: 'custom', supportsNegative: true, supportsWeighting: true, triggerWordStyle: 'prefix', parameterDefaults: {}, template: '{prompt}', isBuiltIn: true },
]

export const MODEL_PROFILE_MAP: Record<SupportedModel, string> = {
  'gpt-image': 'format:natural-language',
  gemini: 'format:natural-language',
  ideogram: 'format:natural-language',
  midjourney: 'format:midjourney-params',
  'stable-diffusion': 'format:tag-list',
  flux: 'format:tag-list',
  'qwen-image': 'format:tag-list',
  illustrious: 'format:tag-list',
  custom: 'format:custom',
}

export function getFormatterProfile(id: string, custom: FormatterProfile[] = []): FormatterProfile {
  return custom.find((profile) => profile.id === id)
    ?? BUILT_IN_FORMATTER_PROFILES.find((profile) => profile.id === id)
    ?? BUILT_IN_FORMATTER_PROFILES[0]
}

export function validateFormatterTemplate(template: string): string | null {
  const allowed = new Set(['prompt', 'negative', 'aspectRatio', 'parameters'])
  const placeholders = template.matchAll(/\{([^{}]+)\}/g)
  for (const match of placeholders) {
    if (!allowed.has(match[1])) return `Unknown placeholder {${match[1]}}`
  }
  return template.includes('{prompt}') ? null : 'Custom templates must include {prompt}'
}
