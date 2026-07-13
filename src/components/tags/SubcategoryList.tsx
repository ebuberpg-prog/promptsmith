import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react'
import { TagChip } from './TagChip'
import type { ContentVisibility, TaxonomyCategory, TaxonomyTag } from '@/types'

function flattenTags(cat: TaxonomyCategory): TaxonomyTag[] {
  const tags: TaxonomyTag[] = []
  if (cat.tags) tags.push(...cat.tags)
  if (cat.children) {
    for (const child of cat.children) {
      tags.push(...flattenTags(child))
    }
  }
  return tags
}

interface SubcategoryListProps {
  categories: TaxonomyCategory[]
  selectedIds: Set<string>
  pinnedIds: Set<string>
  toggleTag: (tag: TaxonomyTag) => void
  onPin: (tagId: string) => void
  contentVisibility: ContentVisibility
}

export function SubcategoryList({
  categories,
  selectedIds,
  pinnedIds,
  toggleTag,
  onPin,
  contentVisibility,
}: SubcategoryListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (categories.length > 0) {
      setExpandedIds(new Set([categories[0].id]))
    }
  }, [categories])

  const handleToggle = (cat: TaxonomyCategory) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(cat.id)) {
        next.delete(cat.id)
      } else {
        next.add(cat.id)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    setExpandedIds(new Set(categories.map(c => c.id)))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  return (
    <div className="space-y-1">
      {categories.length > 2 && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleExpandAll}
            className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text-faint)] hover:text-[var(--ui-text)] transition-colors font-medium"
          >
            Expand all
          </button>
          <span className="text-[10px] text-[var(--ui-border)]">·</span>
          <button
            onClick={handleCollapseAll}
            className="text-[10px] uppercase tracking-wider text-[var(--ui-muted-text-faint)] hover:text-[var(--ui-text)] transition-colors font-medium"
          >
            Collapse all
          </button>
        </div>
      )}
      {categories.map((cat) => {
        const isExpanded = expandedIds.has(cat.id)
        const allTags = flattenTags(cat)
        const tags = allTags.filter(t => contentVisibility === 'all' || !t.explicit)
        const selectedCount = allTags.filter(t => selectedIds.has(t.id)).length

        if (tags.length === 0 && selectedCount === 0) return null

        return (
          <div key={cat.id}>
            <button
              onClick={() => handleToggle(cat)}
              className="w-full flex items-center justify-between py-3 px-1 group min-h-[44px]"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium transition-colors ${
                  isExpanded ? 'text-[var(--ui-text)]' : 'text-[var(--ui-muted-text)] group-hover:text-[var(--ui-text)]'
                }`}>
                  {cat.name.replace(/_/g, ' ')}
                </span>
                {selectedCount > 0 && (
                  <span className="text-[10px] text-[var(--ui-muted-text-faint)] border border-[var(--ui-border)] rounded-lg px-2 py-0.5">
                    {selectedCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[var(--ui-muted-text-faint)]">
                  {tags.length || ''}
                </span>
                <CaretDown weight="regular" className={`w-3.5 h-3.5 text-[var(--ui-muted-text-faint)] transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </div>
            </button>

            <div className="h-px bg-[var(--ui-border-faint)]" />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {tags.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 py-4">
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
                  ) : (
                    <p className="py-4 text-xs text-[var(--ui-muted-text-faint)]">No tags in this category</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
