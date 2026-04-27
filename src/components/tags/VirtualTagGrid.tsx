import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import type { TaxonomyTag } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COLUMNS = 4
const ROW_HEIGHT = 52 // px — height of TagChip + gap
const GAP = 8 // px

interface VirtualTagGridProps {
  tags: TaxonomyTag[]
  selectedIds: Set<string>
  onToggle: (tag: TaxonomyTag) => void
  pinnedIds?: Set<string>
  onPin?: (tagId: string) => void
}

export function VirtualTagGrid({ tags, selectedIds, onToggle, pinnedIds, onPin }: VirtualTagGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rows = useMemo(() => {
    const result: TaxonomyTag[][] = []
    for (let i = 0; i < tags.length; i += COLUMNS) {
      result.push(tags.slice(i, i + COLUMNS))
    }
    return result
  }, [tags])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + GAP,
    overscan: 8,
  })

  const totalHeight = virtualizer.getTotalSize()

  return (
    <div
      ref={parentRef}
      style={{ maxHeight: 400, overflowY: 'auto' }}
      className="scrollbar-hide"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vRow) => {
          const rowTags = rows[vRow.index]
          return (
            <div
              key={vRow.key}
              style={{
                position: 'absolute',
                top: vRow.start,
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
                display: 'grid',
                gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                gap: GAP,
              }}
            >
              {rowTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedIds.has(tag.id)}
                  isPinned={pinnedIds?.has(tag.id) ?? false}
                  onToggle={() => onToggle(tag)}
                  onPin={onPin ? () => onPin(tag.id) : undefined}
                />
              ))}
            </div>
          )
        })}
      </div>
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
  onPin?: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      onContextMenu={onPin ? (e) => { e.preventDefault(); onPin() } : undefined}
      title={onPin ? `${tag.label}${tag.description ? ` — ${tag.description}` : ''}\nRight-click to ${isPinned ? 'unpin' : 'pin'}` : tag.description}
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 h-[46px]",
        isSelected
          ? "border-[#f5f5f5]/40 bg-white/5 text-[#f5f5f5]"
          : "border-[#222] text-[#c2c2c2] hover:border-[#444] hover:text-[#f5f5f5]"
      )}
    >
      <span className="text-xs font-medium leading-snug truncate flex-1 min-w-0">
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
