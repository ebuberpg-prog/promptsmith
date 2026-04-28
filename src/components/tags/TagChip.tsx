import { memo } from 'react'
import { Check, PushPin } from '@phosphor-icons/react'
import { getGroupForCategory } from '@/data/category-colors'
import type { TaxonomyTag } from '@/types'

export interface TagChipProps {
  tag: TaxonomyTag
  isSelected: boolean
  isPinned: boolean
  onToggle: () => void
  onPin: () => void
  showPinButton?: boolean
  breadcrumb?: string
  highlightRanges?: [number, number][]
}

function highlightRanges(text: string, ranges: [number, number][]) {
  if (!ranges.length) return text
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const parts: (string | JSX.Element)[] = []
  let lastEnd = 0
  for (const [start, end] of sorted) {
    if (start > lastEnd) parts.push(text.slice(lastEnd, start))
    parts.push(
      <mark key={start} className="bg-inherit text-[var(--ui-text)] font-semibold underline decoration-[var(--ui-text)]/40 underline-offset-2">{text.slice(start, end)}</mark>
    )
    lastEnd = end
  }
  if (lastEnd < text.length) parts.push(text.slice(lastEnd))
  return parts
}

export const TagChip = memo(function TagChip({
  tag,
  isSelected,
  isPinned,
  onToggle,
  onPin,
  showPinButton = true,
  breadcrumb,
  highlightRanges: matchRanges,
}: TagChipProps) {
  const labelContent = matchRanges?.length
    ? highlightRanges(tag.label, matchRanges)
    : tag.label

  return (
    <button
      onClick={onToggle}
      data-group={getGroupForCategory(tag.category || '')}
      className={`tag-chip w-full justify-between group ${isSelected ? 'selected' : ''}`}
      aria-pressed={isSelected}
      title={`${tag.label}${tag.description ? ` — ${tag.description}` : ''}`}
    >
      <span className="text-xs font-medium leading-snug truncate flex-1 min-w-0 text-left">
        {labelContent}
        {breadcrumb && (
          <span className="text-[10px] text-[var(--ui-muted-text-faint)] ml-1.5 normal-case font-normal">
            {breadcrumb}
          </span>
        )}
      </span>
      <span className="flex-shrink-0 ml-1 flex items-center gap-1">
        {isSelected ? (
          <Check weight="bold" className="w-3 h-3 text-[var(--ui-text)]" />
        ) : isPinned ? (
          <PushPin weight="fill" className="w-3 h-3 text-[var(--ui-muted-text-faint)]" />
        ) : tag.explicit ? (
          <span className="text-[9px] font-bold text-red-500/60 uppercase">18+</span>
        ) : null}
        {!isSelected && !isPinned && !tag.explicit && showPinButton && (
          <PushPin
            weight="regular"
            className="w-3 h-3 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onPin() }}
          />
        )}
      </span>
    </button>
  )
})