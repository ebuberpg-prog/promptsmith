import { usePromptSmithStore } from '@/store/prompt-store'
import { X, Search, Tag } from 'lucide-react'
import { useMemo } from 'react'
import { searchTags } from '@/utils/taxonomy-loader'
import type { TaxonomyCategory, TaxonomyTag } from '@/types'

interface TagSelectorProps {
  taxonomy: TaxonomyCategory[]
  showExplicit: boolean
}

function TagChip({ tag }: { tag: TaxonomyTag }) {
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const isSelected = selectedTags.some((t) => t.id === tag.id)

  return (
    <button
      onClick={() => toggleTag(tag)}
      className={`tag-chip ${isSelected ? 'selected' : ''} ${
        tag.explicit ? 'explicit' : ''
      }`}
      title={tag.description}
    >
      {tag.explicit && <span className="explicit-badge">18+</span>}
      {tag.label}
      {isSelected && <X className="w-3 h-3 ml-0.5" />}
    </button>
  )
}

function TagGroup({
  title,
  tags,
}: {
  title: string
  tags: TaxonomyTag[]
}) {
  if (tags.length === 0) return null

  return (
    <div className="mb-4">
      <h4 className="section-header">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  )
}

function flattenCategories(
  categories: TaxonomyCategory[]
): TaxonomyCategory[] {
  const result: TaxonomyCategory[] = []

  function flatten(cat: TaxonomyCategory) {
    if (cat.tags && cat.tags.length > 0) {
      result.push(cat)
    }
    if (cat.children) {
      cat.children.forEach(flatten)
    }
  }

  categories.forEach(flatten)
  return result
}

export function TagSelector({ taxonomy, showExplicit }: TagSelectorProps) {
  const activeCategory = usePromptSmithStore((s) => s.activeCategory)
  const searchQuery = usePromptSmithStore((s) => s.searchQuery)
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchTags(taxonomy, searchQuery, showExplicit)
  }, [taxonomy, searchQuery, showExplicit])

  const visibleCategories = useMemo(() => {
    if (searchQuery.trim()) return []

    if (activeCategory) {
      const allFlat = flattenCategories(taxonomy)
      return allFlat.filter(
        (cat) =>
          cat.id === activeCategory || cat.id.startsWith(`${activeCategory}_`)
      )
    }

    return taxonomy.slice(0, 3).flatMap((cat) => flattenCategories([cat])).slice(0, 5)
  }, [taxonomy, activeCategory, searchQuery])

  return (
    <div className="space-y-5">
      {selectedTags.length > 0 && (
        <div className="glass-panel rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Selected Tags ({selectedTags.length})
            </h3>
            <button
              onClick={clearAllTags}
              className="text-xs text-muted-foreground hover:text-error transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {searchQuery.trim() ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Search Results ({searchResults.length})
            </h3>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tags found for "{searchQuery}"
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {searchResults.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      ) : (
        visibleCategories.map((cat) => (
          <TagGroup
            key={cat.id}
            title={cat.name}
            tags={
              showExplicit
                ? cat.tags || []
                : (cat.tags || []).filter((t) => !t.explicit)
            }
          />
        ))
      )}

      {!searchQuery.trim() && activeCategory && visibleCategories.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Select a category from the sidebar to browse tags
        </p>
      )}
    </div>
  )
}
