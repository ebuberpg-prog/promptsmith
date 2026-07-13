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
  const textTokens = tokenizeConcept(text)
  if (textTokens.length === 0) return false

  return [tag.label, ...(Array.isArray(tag.aliases) ? tag.aliases : [])]
    .some((phrase) => phraseAppearsInTokens(phrase, textTokens))
}

const CONCEPT_STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

function tokenizeConcept(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, ' ').trim().split(/\s+/).filter(Boolean)
}

function phraseAppearsInTokens(phrase: string, textTokens: string[]) {
  const phraseTokens = tokenizeConcept(phrase).filter((token) => token.length >= 3 && !CONCEPT_STOP_WORDS.has(token))
  if (phraseTokens.length === 0) return false

  const phraseStems = phraseTokens.map(conceptStem)
  const textStems = textTokens.map(conceptStem)
  if (phraseStems.length === 1) return textStems.includes(phraseStems[0])

  // Enhancement models often insert a useful modifier (for example,
  // "cinematic studio light" for "cinematic lighting"). Treat a concept as
  // represented only when all of its meaningful words remain close together;
  // this avoids suppressing a tag merely because its words occur in unrelated
  // parts of a long prompt.
  const maximumSpan = phraseStems.length + 2
  for (let start = 0; start < textStems.length; start += 1) {
    const window = textStems.slice(start, start + maximumSpan + 1)
    if (phraseStems.every((stem) => window.includes(stem))) return true
  }
  return false
}

function conceptStem(token: string) {
  if (token.length > 5 && token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (token.length > 5 && token.endsWith('ing')) {
    const base = token.slice(0, -3)
    if (base.endsWith('at') || base.endsWith('it') || base.endsWith('iz')) return `${base}e`
    const finalCharacter = base[base.length - 1]
    return finalCharacter && base.endsWith(finalCharacter.repeat(2)) ? base.slice(0, -1) : base
  }
  if (token.length > 4 && token.endsWith('ed')) {
    const base = token.slice(0, -2)
    const finalCharacter = base[base.length - 1]
    return finalCharacter && base.endsWith(finalCharacter.repeat(2)) ? base.slice(0, -1) : base
  }
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2)
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1)
  return token
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
