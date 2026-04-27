import { motion, AnimatePresence } from 'framer-motion'
import { Check, PushPin } from '@phosphor-icons/react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { getTagById } from '@/utils/tag-index'
import type { TaxonomyTag } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function QuickAccessBar() {
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const pinnedTags = usePromptSmithStore((s) => s.pinnedTags)
  const recentlyUsedTags = usePromptSmithStore((s) => s.recentlyUsedTags)
  const unpinTag = usePromptSmithStore((s) => s.unpinTag)

  const selectedIds = new Set(selectedTags.map((t) => t.id))
  const pinnedIds = new Set(pinnedTags)

  // Resolve pinned tag objects from index
  const pinnedTagObjects: TaxonomyTag[] = pinnedTags
    .map((id) => getTagById(id))
    .filter((t): t is TaxonomyTag => t !== undefined)

  // Resolve recent tag objects, excluding pinned ones to avoid duplicates
  const recentTagObjects: TaxonomyTag[] = recentlyUsedTags
    .filter((id) => !pinnedIds.has(id))
    .map((id) => getTagById(id))
    .filter((t): t is TaxonomyTag => t !== undefined)
    .slice(0, 12)

  const hasContent = pinnedTagObjects.length > 0 || recentTagObjects.length > 0

  if (!hasContent) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="space-y-3 pb-4 border-b border-[#1a1a1a]"
      >
        {pinnedTagObjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PushPin weight="fill" className="w-3 h-3 text-[#c2c2c2]/50" />
              <span className="text-[10px] text-[#c2c2c2]/50 uppercase tracking-wider font-medium">Pinned</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pinnedTagObjects.map((tag) => (
                <QuickChip
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedIds.has(tag.id)}
                  onToggle={() => toggleTag(tag)}
                  onRemove={() => unpinTag(tag.id)}
                  showRemove
                />
              ))}
            </div>
          </div>
        )}

        {recentTagObjects.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] text-[#c2c2c2]/50 uppercase tracking-wider font-medium">Recent</span>
            <div className="flex flex-wrap gap-1.5">
              {recentTagObjects.map((tag) => (
                <QuickChip
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedIds.has(tag.id)}
                  onToggle={() => toggleTag(tag)}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function QuickChip({
  tag, isSelected, onToggle, onRemove, showRemove,
}: {
  tag: TaxonomyTag
  isSelected: boolean
  onToggle: () => void
  onRemove?: () => void
  showRemove?: boolean
}) {
  return (
    <div className="relative group">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border text-xs font-medium transition-all duration-150",
          isSelected
            ? "border-[#f5f5f5]/40 bg-white/5 text-[#f5f5f5]"
            : "border-[#222] text-[#c2c2c2] hover:border-[#444] hover:text-[#f5f5f5]"
        )}
      >
        {tag.label}
        {isSelected && <Check weight="bold" className="w-2.5 h-2.5" />}
      </motion.button>
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#1a1a1a] border border-[#333] text-[#c2c2c2]/50 hover:text-[#f5f5f5] hidden group-hover:flex items-center justify-center text-[8px]"
        >
          ×
        </button>
      )}
    </div>
  )
}
