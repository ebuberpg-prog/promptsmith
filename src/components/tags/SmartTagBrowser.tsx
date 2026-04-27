import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { loadTaxonomy, loadCategoryTags } from '@/utils/taxonomy-loader'
import { searchTagIndex, addTagsToIndex } from '@/utils/tag-index'
import { QuickAccessBar } from './QuickAccessBar'
import { VirtualTagGrid } from './VirtualTagGrid'
import {
  MagnifyingGlass,
  CaretDown,
  Check,
  User,
  TreePalm,
  Palette,
  Cube,
  Smiley,
  GridFour,
} from '@phosphor-icons/react'
import type { TaxonomyCategory, TaxonomyTag } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Meta-categories for filtering taxonomy files
type MetaCategory = 'all' | 'character' | 'environment' | 'style' | 'props' | 'mood'

interface MetaCategoryDef {
  id: MetaCategory
  label: string
  icon: React.ElementType
  // Which category IDs (YAML top-level keys) belong to this meta-category
  categoryIds: string[]
}

const META_CATEGORIES: MetaCategoryDef[] = [
  {
    id: 'all',
    label: 'All',
    icon: GridFour,
    categoryIds: [], // Special: shows all
  },
  {
    id: 'character',
    label: 'Character',
    icon: User,
    categoryIds: [
      // character_anatomy.yaml
      'body_types', 'breast', 'buttocks', 'male_chest', 'skin', 'age', 'ethnicity',
      'anthropomorphic', 'fantasy_races', 'hands_details', 'feet_details',
      'body_proportions', 'musculature', 'neck_details', 'creatures_expanded',
      // poses_gestures.yaml
      'standing_poses', 'sitting_poses', 'lying_poses', 'reclining_poses', 'action_poses',
      'intimate_poses', 'intimate_gestures', 'hand_gestures', 'facial_expressions',
      'yoga_poses', 'martial_arts', 'everyday_poses', 'fashion_poses', 'couple_poses',
      'animal_poses', 'bound_restraint', 'worship_religion',
      // clothing.yaml
      'tops', 'bottoms', 'full_body', 'lingerie', 'footwear', 'clothing_states', 'accessories',
      // facial_features.yaml
      'eyes', 'nose', 'lips', 'jawline', 'cheeks', 'forehead', 'ears', 'face_shape',
      'skin_details', 'neck_details', 'throat_details', 'makeup_styles', 'eye_conditions',
      'pupil_details', 'eyelashes', 'skin_conditions',
      // hair.yaml
      'hair_length', 'hair_style_women', 'hair_style_men', 'hair_color', 'hair_texture',
      'facial_hair', 'braiding_styles', 'updos_expanded', 'hair_accessories',
      'hair_treatments', 'hair_color_expanded', 'facial_hair_expanded', 'mens_styles_expanded',
      // body_hair.yaml
      'body_hair_locations', 'facial_hair_body', 'body_hair_styles', 'body_hair_colors', 'special',
      // body_modifications.yaml
      'tattoos', 'piercings', 'scars', 'other_modifications', 'tattoo_subjects',
      'piercings_expanded', 'uv_body_art', 'cosmetic_procedures', 'brand_scars', 'gauge_expansion',
      // hand_details.yaml
      'finger_positions', 'nail_styles', 'hand_states', 'hand_details',
      // foot_details.yaml
      'foot_positions', 'footwear_states', 'toe_styles', 'foot_details',
      // medical_anatomy.yaml
      'skeletal', 'muscular', 'internal', 'body_systems', 'body_parts',
      // intimate_content.yaml
      'intimate_poses', 'intimate_gestures', 'clothing_fetish', 'body_states',
      'adult_settings', 'fetish_specific', 'aftermath', 'sensation',
    ],
  },
  {
    id: 'environment',
    label: 'Environment',
    icon: TreePalm,
    categoryIds: [
      // environments.yaml (top-level keys)
      'interior_locations', 'exterior_locations', 'nature', 'urban', 'fantasy_locations',
      'sci_fi_locations', 'historical_locations', 'underwater', 'vehicles', 'mood',
      'religious_places', 'architectural_elements', 'atmospheric',
      // weather_effects.yaml
      'precipitation', 'wind', 'clouds', 'atmospheric', 'particles', 'celestial', 'extreme',
      // time_period.yaml
      'ancient', 'historical', 'modern', 'cultural', 'seasonal',
      // social_setting.yaml
      'intimate', 'social_gatherings', 'work_professional', 'casual', 'outdoor',
      'events', 'family', 'solitary', 'romantic_specific',
      // festival_event.yaml
      'religious', 'cultural', 'music', 'celebrations', 'sports', 'seasonal', 'nightlife',
    ],
  },
  {
    id: 'style',
    label: 'Style',
    icon: Palette,
    categoryIds: [
      // camera_lighting_style.yaml
      'camera', 'lighting', 'art_styles', 'quality', 'camera_types', 'camera_movements',
      'film_stocks_expanded', 'lighting_modifiers', 'lighting_setups_expanded', 'animation_styles',
      // art_medium.yaml
      'photography', 'three_dimensional', 'animation', 'video', 'mixed_media',
      // color_palette.yaml
      'monochromatic', 'complementary', 'analogous', 'triadic', 'split_complementary',
      'thematic', 'mood_based',
      // composition.yaml
      'rule_of_thirds', 'framing', 'perspective', 'leading_lines', 'balance',
      'depth', 'cropping', 'dynamic',
    ],
  },
  {
    id: 'props',
    label: 'Props & Items',
    icon: Cube,
    categoryIds: [
      // props_objects.yaml
      'weapons', 'armor', 'tools', 'storage', 'furniture', 'vehicles', 'electronics',
      'communication', 'lighting_props', 'decorative', 'personal_items', 'food',
      'books', 'toys', 'sports', 'crafting', 'medical', 'technology',
      // food_cuisine.yaml
      'cuisines', 'drinks', 'desserts', 'settings',
      // fantasy_elements.yaml
      'magic_types', 'magical_creatures', 'fairies', 'magical_items',
      'spell_effects', 'supernatural',
    ],
  },
  {
    id: 'mood',
    label: 'Mood & Culture',
    icon: Smiley,
    categoryIds: [
      // mood_emotion.yaml
      'positive', 'negative', 'fearful', 'neutral', 'complex',
      // negative_prompts.yaml
      'universal', 'character_specific', 'style_specific', 'model_specific',
      // subculture.yaml
      'goth', 'punk', 'hipster', 'biker', 'military_tactical', 'streetwear',
      'fashion', 'anime_manga', 'gaming', 'esoteric', 'adult',
    ],
  },
]

export function SmartTagBrowser({ externalSearch }: { externalSearch?: string }) {
  const [taxonomy, setTaxonomy] = useState<TaxonomyCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [localSearch, setLocalSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [activeMetaCategory, setActiveMetaCategory] = useState<MetaCategory>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchQuery = externalSearch ?? debouncedSearch
  const rawSearch = externalSearch ?? localSearch

  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)
  const pinnedTags = usePromptSmithStore((s) => s.pinnedTags)
  const pinTag = usePromptSmithStore((s) => s.pinTag)
  const unpinTag = usePromptSmithStore((s) => s.unpinTag)

  const selectedIds = useMemo(() => new Set(selectedTags.map((t) => t.id)), [selectedTags])
  const pinnedIds = useMemo(() => new Set(pinnedTags), [pinnedTags])

  useEffect(() => {
    loadTaxonomy().then((data) => {
      setTaxonomy(data)
      setLoading(false)
      // Start with first category open (accordion behavior)
      if (data.length > 0) {
        setExpandedCategories(new Set([data[0].id]))
      }
    })
  }, [])

  // 150ms debounce on local search
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 150)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        handleSearchChange('')
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      // If already open, close it (collapse all)
      if (prev.has(id)) {
        return new Set()
      }
      // Otherwise, close all others and open only this one (accordion behavior)
      return new Set([id])
    })
  }

  // Filter taxonomy based on active meta-category
  const filteredTaxonomy = activeMetaCategory === 'all'
    ? taxonomy
    : taxonomy.filter(cat => {
        const metaDef = META_CATEGORIES.find(m => m.id === activeMetaCategory)
        return metaDef?.categoryIds.includes(cat.id) ?? false
      })

  // Reset expanded category when filter changes
  useEffect(() => {
    if (filteredTaxonomy.length > 0) {
      setExpandedCategories(new Set([filteredTaxonomy[0].id]))
    } else {
      setExpandedCategories(new Set())
    }
  }, [activeMetaCategory, filteredTaxonomy])

  // Fuse-based fuzzy search via tag index
  const searchResults = searchQuery.trim()
    ? searchTagIndex(searchQuery, showExplicit, 100)
    : []

  const handlePin = useCallback((tagId: string) => {
    if (pinnedIds.has(tagId)) {
      unpinTag(tagId)
    } else {
      pinTag(tagId)
    }
  }, [pinnedIds, pinTag, unpinTag])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 rounded-full border border-[#333] border-t-[#f5f5f5] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-normal text-[#f5f5f5] tracking-tight">Browse Tags</h2>
          <p className="text-sm text-[#c2c2c2] mt-1">Click any tag to add it to your prompt. Press <kbd className="text-[10px] font-mono bg-[#1a1a1a] border border-[#333] px-1 py-0.5 rounded">/</kbd> to search.</p>
        </div>

        {!externalSearch && (
          <div className="relative w-full sm:w-[320px]">
            <MagnifyingGlass weight="regular" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c2c2]" />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-11 pr-4 py-2.5 bg-transparent border border-[#333] rounded-full outline-none focus:border-[#555] transition-colors duration-150 text-sm text-[#f5f5f5] placeholder:text-[#c2c2c2]/40"
            />
          </div>
        )}

        {externalSearch && (
          <span className="text-sm text-[#c2c2c2] border border-[#333] rounded-full px-3 py-1.5">
            Searching "{externalSearch}"
          </span>
        )}
      </div>

      {/* Meta-category filter pills */}
      {!rawSearch.trim() && (
        <div className="flex flex-wrap gap-2">
          {META_CATEGORIES.map((meta) => {
            const Icon = meta.icon
            const isActive = activeMetaCategory === meta.id
            const count = meta.id === 'all'
              ? taxonomy.length
              : taxonomy.filter(cat => meta.categoryIds.includes(cat.id)).length
            return (
              <button
                key={meta.id}
                onClick={() => setActiveMetaCategory(meta.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
                  isActive
                    ? "bg-white/10 border-[#f5f5f5]/30 text-[#f5f5f5]"
                    : "bg-transparent border-[#333] text-[#c2c2c2] hover:border-[#555] hover:text-[#f5f5f5]"
                )}
              >
                <Icon weight={isActive ? "fill" : "regular"} className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
                <span className="text-[10px] text-[#c2c2c2]/50">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Quick access bar (pinned + recent) */}
      <QuickAccessBar />

      <AnimatePresence mode="wait">
        {rawSearch.trim() ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            <p className="text-xs text-[#c2c2c2]/50">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              {localSearch !== debouncedSearch && !externalSearch && (
                <span className="ml-2 opacity-50">searching…</span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {searchResults.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedIds.has(tag.id)}
                  isPinned={pinnedIds.has(tag.id)}
                  onToggle={() => toggleTag(tag)}
                  onPin={() => handlePin(tag.id)}
                />
              ))}
            </div>
            {searchResults.length === 0 && debouncedSearch === rawSearch && (
              <div className="py-16 text-center border border-dashed border-[#333] rounded-2xl">
                <p className="text-sm text-[#c2c2c2]/50">
                  No tags match "{searchQuery}" — try a different word
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {filteredTaxonomy.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
                selectedIds={selectedIds}
                pinnedIds={pinnedIds}
                toggleTag={toggleTag}
                onPin={handlePin}
                showExplicit={showExplicit}
                onCategoriesLoaded={(loadedCats) => {
                  setTaxonomy(prev => {
                    const newTaxonomy = [...prev]
                    for (const loadedCat of loadedCats) {
                      const idx = newTaxonomy.findIndex(c => c.id === loadedCat.id)
                      if (idx >= 0) {
                        newTaxonomy[idx] = { ...newTaxonomy[idx], ...loadedCat }
                      }
                    }
                    return newTaxonomy
                  })
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CategorySection({
  category, isExpanded, onToggle, selectedIds, pinnedIds, toggleTag, onPin, showExplicit, onCategoriesLoaded,
}: {
  category: TaxonomyCategory
  isExpanded: boolean
  onToggle: () => void
  selectedIds: Set<string>
  pinnedIds: Set<string>
  toggleTag: (tag: TaxonomyTag) => void
  onPin: (tagId: string) => void
  showExplicit: boolean
  onCategoriesLoaded?: (cats: TaxonomyCategory[]) => void
}) {
  const [lazyTags, setLazyTags] = useState<TaxonomyTag[]>(category.tags ?? [])
  const [lazyChildren, setLazyChildren] = useState<TaxonomyCategory[]>(category.children ?? [])
  const [loadingLazy, setLoadingLazy] = useState(false)
  const loadedRef = useRef(false)

  const tags = lazyTags.filter(tag => showExplicit || !tag.explicit)
  const selectedCount = tags.filter(t => selectedIds.has(t.id)).length

  const handleToggle = async () => {
    onToggle()
    // Lazy-load if this is a top-level category that maps to a YAML file
    if (!loadedRef.current && !category.tags?.length && !category.children?.length) {
      loadedRef.current = true
      setLoadingLazy(true)
      const fileKey = `/taxonomy/${category.id}.yaml`
      const loaded = await loadCategoryTags(fileKey)
      if (loaded.length > 0) {
        // Flatten all tags from the loaded category structure
        const flatTags: TaxonomyTag[] = []
        const flatCats: TaxonomyCategory[] = []
        const flatten = (cats: TaxonomyCategory[]) => {
          for (const cat of cats) {
            if (cat.tags) {
              flatTags.push(...cat.tags)
            }
            if (cat.children) {
              flatCats.push(...cat.children)
              flatten(cat.children)
            }
          }
        }
        flatten(loaded)
        setLazyTags(prev => [...prev, ...flatTags])
        setLazyChildren(prev => [...prev, ...flatCats])
        addTagsToIndex(flatTags)
        if (onCategoriesLoaded && loaded.length > 0) {
          onCategoriesLoaded(loaded)
        }
      }
      setLoadingLazy(false)
    }
  }

  if (tags.length === 0 && !lazyChildren.length && !category.children?.length) {
    // Still show collapsed with lazy loading available for YAML-backed categories
    const hasFile = !category.id.includes('_') // top-level IDs map to files
    if (!hasFile) return null
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-sm font-medium transition-colors duration-150",
            isExpanded ? "text-[#f5f5f5]" : "text-[#c2c2c2] group-hover:text-[#f5f5f5]"
          )}>
            {category.name}
          </span>
          {selectedCount > 0 && (
            <span className="text-[10px] text-[#c2c2c2] border border-[#333] rounded-full px-2 py-0.5">
              {selectedCount} added
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#c2c2c2]/30 group-hover:text-[#c2c2c2]/50 transition-colors">
            {tags.length || ''}
          </span>
          {loadingLazy ? (
            <div className="w-3.5 h-3.5 rounded-full border border-[#333] border-t-[#f5f5f5] animate-spin" />
          ) : (
            <CaretDown weight="regular" className={cn(
              "w-3.5 h-3.5 text-[#c2c2c2]/40 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          )}
        </div>
      </button>

      <div className="h-px bg-[#1a1a1a]" />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {tags.length > 20 ? (
              <div className="py-4">
                <VirtualTagGrid
                  tags={tags}
                  selectedIds={selectedIds}
                  onToggle={toggleTag}
                  pinnedIds={pinnedIds}
                  onPin={onPin}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 py-4">
                {tags.map(tag => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    isSelected={selectedIds.has(tag.id)}
                    isPinned={pinnedIds.has(tag.id)}
                    onToggle={() => toggleTag(tag)}
                    onPin={() => onPin(tag.id)}
                  />
                ))}
              </div>
            )}

            {lazyChildren.length > 0 && (
              <div className="pl-4 border-l border-[#1a1a1a] space-y-4 mb-2">
                {lazyChildren.map(child => (
                  <CategorySection
                    key={child.id}
                    category={child}
                    isExpanded={true}
                    onToggle={() => {}}
                    selectedIds={selectedIds}
                    pinnedIds={pinnedIds}
                    toggleTag={toggleTag}
                    onPin={onPin}
                    showExplicit={showExplicit}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TagChip({
  tag, isSelected, isPinned, onToggle, onPin,
}: {
  tag: TaxonomyTag
  isSelected: boolean
  isPinned: boolean
  onToggle: () => void
  onPin: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      onContextMenu={(e) => { e.preventDefault(); onPin() }}
      title={`${tag.label}${tag.description ? ` — ${tag.description}` : ''}\nRight-click to ${isPinned ? 'unpin' : 'pin'}`}
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150",
        isSelected
          ? "border-[#f5f5f5]/40 bg-white/5 text-[#f5f5f5]"
          : "border-[#222] text-[#c2c2c2] hover:border-[#444] hover:text-[#f5f5f5]"
      )}
    >
      <span className="text-xs font-medium leading-snug truncate">
        {tag.label}
      </span>
      <span className="flex-shrink-0">
        {isSelected
          ? <Check weight="bold" className="w-3 h-3 text-[#f5f5f5]" />
          : isPinned
            ? <span className="text-[9px] text-[#c2c2c2]/60">📌</span>
            : tag.explicit
              ? <span className="text-[9px] font-bold text-red-500/60 uppercase">18+</span>
              : null
        }
      </span>
    </motion.button>
  )
}
