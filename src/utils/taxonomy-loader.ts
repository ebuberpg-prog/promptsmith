import yaml from 'js-yaml'
import type { TaxonomyCategory, TaxonomyTag } from '@/types'
import { getCachedTags, setCachedTags, computeVersion } from './taxonomy-cache'
import { addTagsToIndex } from './tag-index'

const TAXONOMY_BASE = `${import.meta.env.BASE_URL}taxonomy/`

const TAXONOMY_FILES = [
  `${TAXONOMY_BASE}character_anatomy.yaml`,
  `${TAXONOMY_BASE}poses_gestures.yaml`,
  `${TAXONOMY_BASE}clothing.yaml`,
  `${TAXONOMY_BASE}environments.yaml`,
  `${TAXONOMY_BASE}camera_lighting_style.yaml`,
  `${TAXONOMY_BASE}facial_features.yaml`,
  `${TAXONOMY_BASE}hair.yaml`,
  `${TAXONOMY_BASE}body_modifications.yaml`,
  `${TAXONOMY_BASE}props_objects.yaml`,
  `${TAXONOMY_BASE}time_period.yaml`,
  `${TAXONOMY_BASE}art_medium.yaml`,
  `${TAXONOMY_BASE}mood_emotion.yaml`,
  `${TAXONOMY_BASE}composition.yaml`,
  `${TAXONOMY_BASE}hand_details.yaml`,
  `${TAXONOMY_BASE}foot_details.yaml`,
  `${TAXONOMY_BASE}body_hair.yaml`,
  `${TAXONOMY_BASE}weather_effects.yaml`,
  `${TAXONOMY_BASE}color_palette.yaml`,
  `${TAXONOMY_BASE}festival_event.yaml`,
  `${TAXONOMY_BASE}subculture.yaml`,
  `${TAXONOMY_BASE}fantasy_elements.yaml`,
  `${TAXONOMY_BASE}medical_anatomy.yaml`,
  `${TAXONOMY_BASE}food_cuisine.yaml`,
  `${TAXONOMY_BASE}social_setting.yaml`,
  `${TAXONOMY_BASE}intimate_content.yaml`,
  `${TAXONOMY_BASE}negative_prompts.yaml`,
  `${TAXONOMY_BASE}architecture.yaml`,
  `${TAXONOMY_BASE}typography.yaml`,
  `${TAXONOMY_BASE}animals.yaml`,
  `${TAXONOMY_BASE}technology.yaml`,
  `${TAXONOMY_BASE}abstract.yaml`,
  `${TAXONOMY_BASE}textures.yaml`,
  `${TAXONOMY_BASE}audio.yaml`,
  `${TAXONOMY_BASE}shapes_patterns.yaml`,
]

// Track which files have been loaded to avoid double-loading
const loadedFiles = new Set<string>()

export interface CategoryManifest {
  id: string
  name: string
  file: string
  tagCount: number
}

export function processTags(obj: Record<string, unknown>, categoryId: string, subcategoryId?: string): TaxonomyTag[] {
  const tags: TaxonomyTag[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'id' in item && 'label' in item) {
          tags.push({
            ...(item as TaxonomyTag),
            category: categoryId,
            subcategory: subcategoryId || key,
          })
        }
      }
    } else if (value && typeof value === 'object') {
      tags.push(...processTags(value as Record<string, unknown>, categoryId, key))
    }
  }

  return tags
}

function buildCategoryStructure(
  data: Record<string, unknown>,
  parentId: string = ''
): TaxonomyCategory[] {
  const categories: TaxonomyCategory[] = []

  for (const [key, value] of Object.entries(data)) {
    const id = parentId ? `${parentId}_${key}` : key

    if (Array.isArray(value)) {
      const tags = value
        .filter((item): item is TaxonomyTag =>
          item !== null && typeof item === 'object' && 'id' in item && 'label' in item
        )
        .map((tag) => ({
          ...tag,
          category: parentId || key,
          subcategory: key,
        }))

      if (tags.length > 0) {
        categories.push({
          id,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          tags,
        })
      }
    } else if (value && typeof value === 'object') {
      const children = buildCategoryStructure(
        value as Record<string, unknown>,
        id
      )

      if (children.length > 0) {
        categories.push({
          id,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          children,
        })
      }
    }
  }

  return categories
}

function fileKeyToId(file: string): string {
  return file.replace(/.*\/taxonomy\//, '').replace('.yaml', '')
}

function fileKeyToName(file: string): string {
  return fileKeyToId(file).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Load just a manifest (names + counts) without parsing full tag data. Fast startup. */
export async function loadTaxonomyManifest(): Promise<CategoryManifest[]> {
  return TAXONOMY_FILES.map((file) => ({
    id: fileKeyToId(file),
    name: fileKeyToName(file),
    file,
    tagCount: 0, // Will be populated when category is loaded
  }))
}

/** Load tags for a single category file on demand. Returns the TaxonomyCategory tree. */
export async function loadCategoryTags(file: string): Promise<TaxonomyCategory[]> {
  if (loadedFiles.has(file)) {
    // Already loaded — return empty since tags are in the index
    return []
  }

  try {
    const response = await fetch(file)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    const data = yaml.load(text) as Record<string, unknown>

    if (!data) return []

    const categoryId = fileKeyToId(file)
    const tags = processTags(data, categoryId)
    addTagsToIndex(tags)

    const categories = buildCategoryStructure(data)
    loadedFiles.add(file)
    return categories
  } catch (error) {
    console.error(`Failed to load taxonomy file: ${file}`, error)
    return []
  }
}

function dedupeCategories(categories: TaxonomyCategory[]): TaxonomyCategory[] {
  const seen = new Set<string>()
  const result: TaxonomyCategory[] = []
  for (const cat of categories) {
    if (seen.has(cat.id)) continue
    seen.add(cat.id)
    result.push(cat)
  }
  return result
}

/** Load all taxonomy files. Uses IndexedDB cache on repeat visits. */
export async function loadTaxonomy(): Promise<TaxonomyCategory[]> {
  const allCategories: TaxonomyCategory[] = []
  const cacheVersion = computeVersion(TAXONOMY_FILES)

  // Clear loadedFiles to handle HMR (hot module replacement) in dev
  // The Set persists across reloads, causing files to be skipped
  loadedFiles.clear()

  // Try cache first
  const cached = await getCachedTags(cacheVersion)
  if (cached) {
    addTagsToIndex(cached)
    // Still need to build category structure — load files but use cache for tags
    for (const file of TAXONOMY_FILES) {
      try {
        if (loadedFiles.has(file)) continue
        const response = await fetch(file)
        if (!response.ok) continue
        const text = await response.text()
        const data = yaml.load(text) as Record<string, unknown>
        if (data) {
          allCategories.push(...buildCategoryStructure(data))
          loadedFiles.add(file)
        }
      } catch {
        // non-fatal
      }
    }
    return dedupeCategories(allCategories)
  }

  // No cache — load fresh
  const allTags: TaxonomyTag[] = []

  for (const file of TAXONOMY_FILES) {
    if (loadedFiles.has(file)) continue
    try {
      const response = await fetch(file)
      if (!response.ok) continue
      const text = await response.text()
      const data = yaml.load(text) as Record<string, unknown>

      if (data) {
        const categoryId = fileKeyToId(file)
        const tags = processTags(data, categoryId)
        allTags.push(...tags)
        allCategories.push(...buildCategoryStructure(data))
        loadedFiles.add(file)
      }
    } catch (error) {
      console.error(`Failed to load taxonomy file: ${file}`, error)
    }
  }

  addTagsToIndex(allTags)
  await setCachedTags(cacheVersion, allTags)

  return dedupeCategories(allCategories)
}


