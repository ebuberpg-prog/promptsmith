import type { FormatterProfile, ModelParameters, PromptVariable, SelectedTag } from '@/types'
import { promptComposer } from './prompt-composer'

export function detectPromptVariables(text: string, existing: PromptVariable[] = []): PromptVariable[] {
  const values = new Map(existing.map((variable) => [variable.name, variable]))
  const names = [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map((match) => match[1])
  return [...new Set(names)].map((name) => values.get(name) ?? { name })
}

export function resolvePromptVariables(text: string, variables: PromptVariable[]): { text: string; unresolved: string[] } {
  const byName = new Map(variables.map((variable) => [variable.name, variable.value || variable.defaultValue || '']))
  const unresolved: string[] = []
  const resolved = text.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name: string) => {
    const value = byName.get(name)
    if (!value) {
      unresolved.push(name)
      return token
    }
    return value
  })
  return { text: resolved, unresolved: [...new Set(unresolved)] }
}

export function composeWithProfile(options: {
  profile: FormatterProfile
  tags: SelectedTag[]
  customText: string
  variables?: PromptVariable[]
  parameters: ModelParameters
  negativePrompt?: string
}): { prompt: string; unresolvedVariables: string[] } {
  const resolved = resolvePromptVariables(options.customText, options.variables ?? [])
  const remainingTags = options.tags.filter((tag) => !conceptAppearsInText(resolved.text, tag))
  const baseModel = options.profile.family === 'natural-language' || options.profile.family === 'structured-instruction'
    ? 'gpt-image'
    : options.profile.family === 'tag-list' ? 'stable-diffusion' : options.profile.model ?? 'custom'
  const parameters = { ...options.profile.parameterDefaults, ...options.parameters }
  let prompt = promptComposer.compose({ tags: remainingTags, customText: resolved.text, model: baseModel, parameters })

  if (options.profile.family === 'natural-language') {
    const labels = uniqueLabels(remainingTags)
    const ingredientSentence = labels.length ? `The visual direction includes ${joinNatural(labels)}.` : ''
    prompt = [resolved.text.trim(), ingredientSentence].filter(Boolean).join(' ')
  }
  if (options.profile.family === 'tag-list') {
    const seen = new Set<string>()
    prompt = [resolved.text.trim(), ...remainingTags.map((tag) => tag.label.trim())]
      .filter((part) => part && !seen.has(part.toLocaleLowerCase()) && seen.add(part.toLocaleLowerCase()))
      .join(', ')
  }
  if (options.profile.family === 'structured-instruction') prompt = composeStructuredInstruction(resolved.text, remainingTags, options.negativePrompt)
  if (options.profile.family === 'custom' && options.profile.template) {
    const renderedParameters = Object.entries(parameters).map(([key, value]) => `${key}=${value}`).join(', ')
    prompt = options.profile.template
      .split('{prompt}').join(prompt)
      .split('{negative}').join(options.negativePrompt ?? '')
      .split('{aspectRatio}').join(String(parameters.aspectRatio ?? ''))
      .split('{parameters}').join(renderedParameters)
      .trim()
  }

  return { prompt, unresolvedVariables: resolved.unresolved }
}

export function conceptAppearsInText(text: string, tag: SelectedTag) {
  const normalizedText = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}'-]+/gu, ' ').trim()} `
  return [tag.label, ...(Array.isArray(tag.aliases) ? tag.aliases : [])].some((phrase) => {
    const normalizedPhrase = phrase.toLowerCase().replace(/[^\p{L}\p{N}'-]+/gu, ' ').trim()
    return normalizedPhrase.length >= 3 && normalizedText.includes(` ${normalizedPhrase} `)
  })
}

function uniqueLabels(tags: SelectedTag[]) {
  const seen = new Set<string>()
  return tags.map((tag) => tag.label.trim()).filter((label) => label && !seen.has(label.toLowerCase()) && seen.add(label.toLowerCase()))
}

function joinNatural(values: string[]) {
  if (values.length < 2) return values[0] ?? ''
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`
}


function composeStructuredInstruction(authoredText: string, tags: SelectedTag[], negativePrompt?: string) {
  const groups = new Map<string, string[]>()
  for (const tag of tags) {
    const category = `${tag.category ?? ''} ${tag.subcategory ?? ''}`.toLowerCase()
    const label = tag.label.toLowerCase()
    const section = /surrealis|realism|painting|drawing|sketch|anime|cinematic|photograph|render|watercolor|illustration|vintage|noir|minimal|baroque|art deco|art nouveau|pixel art/.test(label) ? 'Style & mood'
      : /environment|weather|time_period|setting|architecture/.test(category) ? 'Setting'
      : /lighting/.test(category) ? 'Lighting'
        : /composition|camera/.test(category) ? 'Composition'
          : /art_medium|style|mood|color|texture/.test(category) ? 'Style & mood'
            : 'Subject & details'
    const values = groups.get(section) ?? []
    if (!values.some((value) => value.toLowerCase() === tag.label.toLowerCase())) values.push(tag.label)
    groups.set(section, values)
  }
  const lines = authoredText.trim() ? [`Direction: ${authoredText.trim()}`] : []
  for (const section of ['Subject & details', 'Setting', 'Lighting', 'Composition', 'Style & mood']) {
    const values = groups.get(section)
    if (values?.length) lines.push(`${section}: ${values.join(', ')}`)
  }
  if (negativePrompt?.trim()) lines.push(`Avoid: ${negativePrompt.trim()}`)
  return lines.join('\n')
}
