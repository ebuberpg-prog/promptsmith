import { useEffect, useMemo, useState } from 'react'
import { Check, Plus } from '@phosphor-icons/react'
import { analyzeComposerInput } from '@/services/composer-analysis'
import { usePromptSmithStore } from '@/store/prompt-store'

const MINIMUM_MEANINGFUL_LENGTH = 3
const SUGGESTION_DELAY_MS = 500

export function RelatedTagSuggestions({ text }: { text: string }) {
  const contentVisibility = usePromptSmithStore((state) => state.contentVisibility)
  const selectedTags = usePromptSmithStore((state) => state.selectedTags)
  const addTag = usePromptSmithStore((state) => state.addTag)
  const [settledText, setSettledText] = useState(text)
  const [expanded, setExpanded] = useState(false)
  const [addedTagLabel, setAddedTagLabel] = useState<string | null>(null)

  useEffect(() => {
    const normalized = text.trim()
    if (normalized.length < MINIMUM_MEANINGFUL_LENGTH) {
      setSettledText('')
      setExpanded(false)
      return
    }

    const timer = window.setTimeout(() => {
      setSettledText(text)
      setExpanded(false)
    }, SUGGESTION_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [text])

  const selectedIds = useMemo(() => new Set(selectedTags.map((tag) => tag.id)), [selectedTags])
  const suggestions = useMemo(
    () => (analyzeComposerInput(settledText, contentVisibility, 10).scoredSuggestions ?? []).filter((result) => !selectedIds.has(result.tag.id)),
    [contentVisibility, selectedIds, settledText],
  )

  if (!settledText.trim() || (suggestions.length === 0 && !addedTagLabel)) return null

  const visibleSuggestions = suggestions.slice(0, expanded ? 8 : 3)
  const hiddenCount = Math.max(0, Math.min(8, suggestions.length) - 3)

  const selectTag = (result: (typeof suggestions)[number]) => {
    const tag = result.tag
    addTag(tag)
    setAddedTagLabel(tag.label)
    window.setTimeout(() => setAddedTagLabel((current) => current === tag.label ? null : current), 1200)
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Related taxonomy ingredients">
      {visibleSuggestions.map((result) => {
        const tag = result.tag
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => selectTag(result)}
            className="min-h-11 px-3 rounded-lg border border-[var(--ui-border)] flex items-center gap-1.5 text-xs text-[var(--ui-muted-text)] hover:border-[var(--ui-border-hover)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Add ${tag.label}. Matched ${result.matchedPhrase} in ${result.matchedField}. ${tag.description}`}
            title={`Matched “${result.matchedPhrase}” · ${tag.description}`}
          >
            <Plus className="size-3.5" />
            <span>{tag.label}</span>
            {tag.explicit && <span className="text-[10px] text-[var(--ui-muted-text-faint)]">mature</span>}
          </button>
        )
      })}
      {!expanded && hiddenCount > 0 && (
        <button type="button" onClick={() => setExpanded(true)} className="min-h-11 px-2 text-xs text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`Show ${hiddenCount} more related ingredients`}>+{hiddenCount} more</button>
      )}
      {expanded && suggestions.length > 3 && (
        <button type="button" onClick={() => setExpanded(false)} className="min-h-11 px-2 text-xs text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Show less</button>
      )}
      {addedTagLabel && <span className="min-h-11 px-2 flex items-center gap-1.5 text-xs text-[var(--ui-muted-text)]"><Check className="size-3.5" weight="bold" />Added {addedTagLabel}</span>}
      <span className="sr-only" aria-live="polite">{addedTagLabel ? `${addedTagLabel} added to the prompt` : ''}</span>
    </div>
  )
}
