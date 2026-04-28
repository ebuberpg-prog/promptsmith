import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { getSuggestionsForTags } from '@/data/tag-relationships'
import { getTagById } from '@/utils/tag-index'
import { getGroupForCategory } from '@/data/category-colors'

export function TagSuggestions() {
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)

  const suggestions = useMemo(() => {
    if (selectedTags.length === 0) return []

    const selectedIds = new Set(selectedTags.map(t => t.id))
    const suggestedIds = getSuggestionsForTags(
      selectedTags.map(t => t.id),
      selectedIds
    )

    return suggestedIds
      .map(id => getTagById(id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined)
      .slice(0, 6)
  }, [selectedTags])

  if (suggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkle weight="fill" className="w-3 h-3 text-[var(--ui-muted-text-faint)]" />
          <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider font-medium">
            You might also like
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <motion.button
              key={tag.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleTag(tag)}
              data-group={getGroupForCategory(tag.category || '')}
              className="tag-chip"
              title={tag.description}
            >
              <span className="truncate">{tag.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
