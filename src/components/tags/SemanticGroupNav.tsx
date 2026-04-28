import { motion } from 'framer-motion'
import { SEMANTIC_GROUPS } from '@/data/category-colors'
import * as Icons from '@phosphor-icons/react'

interface SemanticGroupNavProps {
  activeGroup: string
  onGroupChange: (groupId: string) => void
  groupCounts: Record<string, number>
}

export function SemanticGroupNav({ activeGroup, onGroupChange, groupCounts }: SemanticGroupNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {SEMANTIC_GROUPS.map((group) => {
        const isActive = activeGroup === group.id
        const Icon = Icons[group.icon as keyof typeof Icons] as React.ComponentType<{ weight?: string; className?: string }> || Icons.GridFour

        return (
          <button
            key={group.id}
            onClick={() => onGroupChange(group.id === activeGroup ? 'all' : group.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-150 whitespace-nowrap min-h-[44px] ${
              isActive
                ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)] text-[var(--ui-text)]'
                : 'border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]'
            }`}
            aria-pressed={isActive}
          >
            <Icon weight={isActive ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
            <span>{group.label}</span>
            {groupCounts[group.id] !== undefined && (
              <span className="text-[10px] text-[var(--ui-muted-text-faint)]">
                ({groupCounts[group.id]})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
