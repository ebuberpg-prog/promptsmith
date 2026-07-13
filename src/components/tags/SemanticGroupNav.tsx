import { User, TShirt, Tree, Palette, Smiley, Gear } from '@phosphor-icons/react'
import { SEMANTIC_GROUPS } from '@/data/category-colors'

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  TShirt,
  Tree,
  Palette,
  Smiley,
  Gear,
}

interface SemanticGroupNavProps {
  activeGroup: string
  onGroupChange: (groupId: string) => void
  groupCounts: Record<string, number>
}

export function SemanticGroupNav({ activeGroup, onGroupChange, groupCounts }: SemanticGroupNavProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Ingredient directions">
      {SEMANTIC_GROUPS.map((group) => {
        const isActive = activeGroup === group.id
        const Icon = ICON_MAP[group.icon] || Gear

        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onGroupChange(group.id === activeGroup ? 'all' : group.id)}
            className={`min-h-20 rounded-xl border p-3 text-left transition-colors duration-150 ${
              isActive
                ? 'border-[var(--ui-text)] bg-[var(--ui-surface-soft)] text-[var(--ui-text)]'
                : 'border-[var(--ui-border)] text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)]'
            }`}
            aria-pressed={isActive}
          >
            <span className="flex items-center gap-2"><Icon weight={isActive ? 'fill' : 'regular'} className="size-4" /><strong className="text-sm font-medium">{group.label}</strong>{groupCounts[group.id] !== undefined && <span className="ml-auto text-[11px] tabular-nums text-[var(--ui-muted-text)]">{groupCounts[group.id]}</span>}</span>
            <span className="mt-2 block text-xs leading-5 text-[var(--ui-muted-text)]">{group.description}</span>
          </button>
        )
      })}
    </div>
  )
}
