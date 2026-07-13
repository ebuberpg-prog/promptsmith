const LEADING_INSTRUCTIONS = /^(?:please\s+)?(?:create|generate|make|render|show|design|illustrate|photograph|produce)\s+(?:an?\s+)?/i
const GENERIC_OPENERS = /^(?:image|picture|photo|photograph|illustration|scene)\s+of\s+/i
const VARIABLE_TOKEN = /\{[^}]+\}/g

function sentenceCase(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function suggestPromptTitle(text: string, labels: string[], now = new Date()) {
  const source = text.trim() || labels.slice(0, 4).join(' ')
  if (!source) return `Untitled prompt ${now.toLocaleDateString()}`

  const cleaned = source
    .replace(VARIABLE_TOKEN, '')
    .replace(LEADING_INSTRUCTIONS, '')
    .replace(GENERIC_OPENERS, '')
    .split(/[,.!?;:\n]/)[0]
    .replace(/\s+/g, ' ')
    .replace(/\s+(?:of|with|and|for|in|on|at|by)\s*$/i, '')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')

  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 7)
  const title = sentenceCase(words.join(' '))
  return title || sentenceCase(labels.slice(0, 4).join(' ')) || `Untitled prompt ${now.toLocaleDateString()}`
}
