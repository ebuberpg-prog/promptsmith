import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import { searchTagIndex, getTagById } from '@/utils/tag-index'
import { QuickAccessBar } from './QuickAccessBar'
import { SemanticGroupNav } from './SemanticGroupNav'
import { SubcategoryList } from './SubcategoryList'
import { TagChip } from './TagChip'
import { SEMANTIC_GROUPS, getGroupForCategory } from '@/data/category-colors'
import {
  MagnifyingGlass,
} from '@phosphor-icons/react'
import type { TaxonomyCategory, TaxonomyTag } from '@/types'

function countAllTags(cat: TaxonomyCategory): number {
  let count = cat.tags?.length ?? 0
  if (cat.children) {
    for (const child of cat.children) {
      count += countAllTags(child)
    }
  }
  return count
}

function computeRanges(text: string, query: string): [number, number][] {
  if (!query) return []
  const ranges: [number, number][] = []
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let pos = 0
  while (pos < lower.length) {
    const idx = lower.indexOf(q, pos)
    if (idx === -1) break
    ranges.push([idx, idx + q.length])
    pos = idx + 1
  }
  return ranges
}

function groupSearchResults(results: TaxonomyTag[]): Map<string, TaxonomyTag[]> {
  const groups = new Map<string, TaxonomyTag[]>()
  for (const tag of results) {
    const group = getGroupForCategory(tag.category || '')
    const existing = groups.get(group) ?? []
    existing.push(tag)
    groups.set(group, existing)
  }
  return groups
}

const STARTER_SUGGESTIONS = [
  'portrait', 'cinematic', 'dramatic lighting', 'forest',
  'golden hour', 'film grain', 'close-up', 'misty',
]

export function SmartTagBrowser({ externalSearch, taxonomy: taxonomyProp }: { externalSearch?: string; taxonomy: TaxonomyCategory[] }) {
  const [localSearch, setLocalSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<string>('all')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const taxonomy = taxonomyProp

  const hasExternalSearch = Boolean(externalSearch?.trim())
  const searchQuery = hasExternalSearch ? externalSearch! : debouncedSearch
  const rawSearch = hasExternalSearch ? externalSearch! : localSearch

  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const contentVisibility = usePromptSmithStore((s) => s.contentVisibility)
  const pinnedTags = usePromptSmithStore((s) => s.pinnedTags)
  const pinTag = usePromptSmithStore((s) => s.pinTag)
  const unpinTag = usePromptSmithStore((s) => s.unpinTag)

  const selectedIds = useMemo(() => new Set(selectedTags.map((t) => t.id)), [selectedTags])
  const pinnedIds = useMemo(() => new Set(pinnedTags), [pinnedTags])

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    setFocusedIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 150)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

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

  const filteredTaxonomy = useMemo(() => {
    if (activeGroup === 'all') return taxonomy
    const group = SEMANTIC_GROUPS.find(g => g.id === activeGroup)
    if (!group) return taxonomy
    const orderMap = new Map(group.categoryIds.map((id, i) => [id, i]))
    return taxonomy
      .filter(cat => group.categoryIds.includes(cat.id))
      .sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity))
  }, [taxonomy, activeGroup])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of taxonomy) {
      const group = getGroupForCategory(cat.id)
      counts[group] = (counts[group] || 0) + countAllTags(cat)
    }
    return counts
  }, [taxonomy])

  const searchResults = useMemo(
    () => searchQuery.trim() ? searchTagIndex(searchQuery, contentVisibility, 100) : [],
    [searchQuery, contentVisibility]
  )

  const groupedResults = useMemo(() => groupSearchResults(searchResults), [searchResults])

  const totalResults = searchResults.length

  const handlePin = useCallback((tagId: string) => {
    if (pinnedIds.has(tagId)) {
      unpinTag(tagId)
    } else {
      pinTag(tagId)
    }
  }, [pinnedIds, pinTag, unpinTag])

  const handleResultKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!rawSearch.trim()) return
    const total = totalResults
    if (total === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => Math.min(prev + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => prev <= 0 ? -1 : prev - 1)
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < total) {
      e.preventDefault()
      const tag = searchResults[focusedIndex]
      if (tag) toggleTag(tag)
    }
  }, [rawSearch, totalResults, focusedIndex, searchResults, toggleTag])

  useEffect(() => {
    setFocusedIndex(-1)
  }, [rawSearch])

  const groupOrder = SEMANTIC_GROUPS.map(g => g.id)

  const buildBreadcrumb = useCallback((tag: TaxonomyTag): string | undefined => {
    if (!tag.category) return undefined
    const catName = tag.category.replace(/_/g, ' ')
    if (tag.subcategory && tag.subcategory !== tag.category) {
      return `${catName} › ${tag.subcategory.replace(/_/g, ' ')}`
    }
    return catName
  }, [])

  const handleStarterClick = useCallback((id: string) => {
    const tag = getTagById(id)
    if (tag) toggleTag(tag)
  }, [toggleTag])

  const showEmpty = !rawSearch.trim() && searchResults.length === 0

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[2rem] font-normal tracking-tight" style={{ color: 'var(--ui-text)' }}>Browse Tags</h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ui-muted-text)' }}>Click any tag to add it to your prompt. Press <kbd className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)', border: '1px solid var(--ui-border)' }}>/</kbd> to search.</p>
        </div>

        {!externalSearch && (
          <div className="relative w-full sm:w-[320px]">
            <MagnifyingGlass weight="regular" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ui-muted-text)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleResultKeyDown}
              placeholder="Search tags..."
              className="w-full pl-11 pr-4 py-2 bg-transparent border rounded-lg outline-none focus:border-[var(--ui-border-hover)] transition-colors duration-150 text-[13px] placeholder:text-[var(--ui-muted-text-faint)]"
              style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
            />
          </div>
        )}

        {externalSearch && (
          <span className="text-sm border rounded-lg px-3 py-1.5" style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-muted-text)' }}>
            Searching "{externalSearch}"
          </span>
        )}
      </div>

      {!rawSearch.trim() && (
        <SemanticGroupNav
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
          groupCounts={groupCounts}
        />
      )}

      <QuickAccessBar />

      <AnimatePresence mode="wait">
        {rawSearch.trim() ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-4"
          >
            <p className="text-xs" style={{ color: 'var(--ui-muted-text-faint)' }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              {localSearch !== debouncedSearch && !externalSearch && (
                <span className="ml-2 opacity-50">searching...</span>
              )}
            </p>

            {searchResults.length > 0 ? (
              <div className="space-y-5">
                {groupOrder.map(groupId => {
                  const groupTags = groupedResults.get(groupId)
                  if (!groupTags || groupTags.length === 0) return null
                  const group = SEMANTIC_GROUPS.find(g => g.id === groupId)
                  if (!group) return null

                  let globalIdx = 0
                  for (const gId of groupOrder) {
                    if (gId === groupId) break
                    globalIdx += groupedResults.get(gId)?.length ?? 0
                  }

                  return (
                    <div key={groupId}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: `hsl(var(--group-${groupId}) / 0.7)` }}>
                          {group.label}
                        </span>
                        <span className="text-[10px] text-[var(--ui-muted-text-faint)]">
                          {groupTags.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {groupTags.map((tag, i) => {
                          const flatIdx = globalIdx + i
                          const ranges = computeRanges(tag.label, searchQuery)
                          return (
                            <TagChip
                              key={tag.id}
                              tag={tag}
                              isSelected={selectedIds.has(tag.id)}
                              isPinned={pinnedIds.has(tag.id)}
                              onToggle={() => toggleTag(tag)}
                              onPin={() => handlePin(tag.id)}
                              breadcrumb={buildBreadcrumb(tag)}
                              highlightRanges={ranges}
                              {...(focusedIndex === flatIdx ? { 'data-focused': true } : {})}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : debouncedSearch === rawSearch ? (
              <div className="py-12 text-center border border-dashed rounded-2xl" style={{ borderColor: 'var(--ui-border)' }}>
                <p className="text-sm" style={{ color: 'var(--ui-muted-text-faint)' }}>
                  No tags match "{searchQuery}" — try a different word
                </p>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SubcategoryList
              key={activeGroup}
              categories={filteredTaxonomy}
              selectedIds={selectedIds}
              pinnedIds={pinnedIds}
              toggleTag={toggleTag}
              onPin={handlePin}
              contentVisibility={contentVisibility}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showEmpty && selectedTags.length === 0 && pinnedTags.length === 0 && (
        <div className="py-8 text-center space-y-4">
          <p className="text-sm text-[var(--ui-muted-text-faint)]">
            Start with a person, place, or style — or try one of these:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {STARTER_SUGGESTIONS.map(id => {
              const tag = getTagById(id)
              if (!tag) return null
              return (
                <button
                  key={id}
                  onClick={() => handleStarterClick(id)}
                  className="tag-chip text-xs"
                  data-group={getGroupForCategory(tag.category || '')}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
