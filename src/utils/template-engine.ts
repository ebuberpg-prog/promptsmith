import type { PromptTemplate, SelectedTag, SupportedModel, ModelParameters } from '@/types'
import type { GalleryTemplate } from '@/types/templates'
import { getTagById, searchTagIndex } from './tag-index'

/** Resolve a GalleryTemplate's tagIds (or tags) to SelectedTag objects for the store */
export async function applyGalleryTemplate(
  template: GalleryTemplate,
  selectedModel: SupportedModel,
  showExplicit: boolean
): Promise<{ tags: SelectedTag[]; customText: string; modelParams?: Partial<ModelParameters> }> {
  const resolvedTags: SelectedTag[] = []

  // First try tagIds (exact id lookup)
  if (template.tagIds && template.tagIds.length > 0) {
    for (const id of template.tagIds) {
      const tag = getTagById(id)
      if (tag && (showExplicit || !tag.explicit)) {
        resolvedTags.push({ ...tag, selectedAt: Date.now() })
      }
    }
  }

  // If no tagIds matched (e.g., not yet mapped), fall back to fuzzy search on label strings
  if (resolvedTags.length === 0 && template.tags.length > 0) {
    for (const label of template.tags) {
      const matches = searchTagIndex(label, showExplicit, 1)
      if (matches.length > 0) {
        const tag = matches[0]
        if (!resolvedTags.some(t => t.id === tag.id)) {
          resolvedTags.push({ ...tag, selectedAt: Date.now() })
        }
      }
    }
  }

  const modelParams = template.modelParams?.[selectedModel]

  return {
    tags: resolvedTags,
    customText: template.examplePrompt,
    modelParams,
  }
}

/** Apply a saved PromptTemplate from the store */
export function applyPromptTemplate(
  template: PromptTemplate,
  selectedModel: SupportedModel,
  showExplicit: boolean
): { tags: SelectedTag[]; customText: string; modelParams?: Partial<ModelParameters> } {
  let tags = template.selections ?? []

  // If the template has tagIds, try to resolve any that aren't already in selections
  if (template.tagIds && template.tagIds.length > 0) {
    const existingIds = new Set(tags.map(t => t.id))
    for (const id of template.tagIds) {
      if (existingIds.has(id)) continue
      const tag = getTagById(id)
      if (tag && (showExplicit || !tag.explicit)) {
        tags = [...tags, { ...tag, selectedAt: Date.now() }]
      }
    }
  }

  const modelParams = template.modelParams?.[selectedModel]

  return {
    tags,
    customText: template.customText,
    modelParams,
  }
}

/** Export a PromptTemplate as a JSON string */
export function exportTemplate(template: PromptTemplate): string {
  return JSON.stringify({ _schema: 'muse-template-v1', ...template }, null, 2)
}

/** Import a template from a JSON string. Returns null if invalid. */
export function importTemplate(json: string): PromptTemplate | null {
  try {
    const parsed = JSON.parse(json)
    if (!parsed.id || !parsed.name) return null
    // Ensure required fields have defaults
    return {
      ...parsed,
      id: parsed.id ?? crypto.randomUUID(),
      createdAt: parsed.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      selections: Array.isArray(parsed.selections) ? parsed.selections : [],
      customText: parsed.customText ?? '',
      model: parsed.model ?? 'midjourney',
      isUserTemplate: true,
    } as PromptTemplate
  } catch {
    return null
  }
}
