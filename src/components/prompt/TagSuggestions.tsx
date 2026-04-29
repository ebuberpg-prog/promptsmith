import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkle, Spinner, WarningCircle } from '@phosphor-icons/react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { getSuggestionsForTags } from '@/data/tag-relationships'
import { getTagById, getTagsByCategory, getAllIndexedTags } from '@/utils/tag-index'
import { getGroupForCategory, SEMANTIC_GROUPS } from '@/data/category-colors'
import { aiService, type AIServiceState } from '@/services/local-ai-service'

// Complementary groups: if you have tags in X, suggest from Y
const COMPLEMENTARY_GROUPS: Record<string, string[]> = {
  subject: ['appearance', 'setting', 'style', 'mood'],
  appearance: ['subject', 'setting', 'style'],
  setting: ['subject', 'style', 'mood', 'appearance'],
  style: ['subject', 'setting', 'mood', 'appearance'],
  mood: ['subject', 'setting', 'style'],
  quality: ['style', 'subject'],
}

function getTagSignature(tags: { id: string }[]): string {
  return tags.map((t) => t.id).sort().join(',')
}

export function TagSuggestions() {
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)

  const [aiState, setAIState] = useState<AIServiceState>(aiService.getState())
  const [aiLabels, setAiLabels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tagSignature = useMemo(() => getTagSignature(selectedTags), [selectedTags])

  useEffect(() => {
    const unsub = aiService.subscribe(setAIState)
    return () => {
      unsub()
    }
  }, [])

  const fetchAISuggestions = useCallback(async () => {
    if (selectedTags.length === 0 || aiState.status !== 'connected') return
    setIsLoading(true)
    setError(null)
    try {
      const labels = await aiService.suggestTags(selectedTags.map((t) => t.label))
      setAiLabels(labels)
    } catch (err) {
      setError(String(err))
      setAiLabels([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedTags, aiState.status])

  // Auto-fetch when AI connects or tags change meaningfully
  useEffect(() => {
    if (aiState.status === 'connected' && selectedTags.length > 0) {
      fetchAISuggestions()
    }
  }, [aiState.status, tagSignature, fetchAISuggestions, selectedTags.length])

  const suggestions = useMemo(() => {
    if (selectedTags.length === 0) return []
    const selectedIds = new Set(selectedTags.map((t) => t.id))
    const suggested: Array<NonNullable<ReturnType<typeof getTagById>>> = []

    const addTag = (tag: ReturnType<typeof getTagById>): boolean => {
      if (!tag) return false
      if (selectedIds.has(tag.id)) return false
      if (suggested.some((s) => s.id === tag.id)) return false
      suggested.push(tag)
      return true
    }

    // 1. AI suggestions
    for (const label of aiLabels) {
      const allTags = getAllIndexedTags()
      const exact = allTags.find((t) => t.label.toLowerCase() === label.toLowerCase())
      if (addTag(exact)) continue
      const partial = allTags.find(
        (t) =>
          t.label.toLowerCase().includes(label.toLowerCase()) ||
          label.toLowerCase().includes(t.label.toLowerCase())
      )
      if (addTag(partial)) continue
      // Word-by-word fallback
      const words = label.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
      for (const word of words) {
        const wordMatch = allTags.find((t) => t.label.toLowerCase().includes(word))
        if (addTag(wordMatch)) break
      }
    }

    // 2. Static relationships
    const staticIds = getSuggestionsForTags(
      selectedTags.map((t) => t.id),
      selectedIds
    )
    for (const id of staticIds) {
      addTag(getTagById(id))
    }

    // 3. Complementary group suggestions
    if (suggested.length < 6) {
      const groupCounts = new Map<string, number>()
      for (const tag of selectedTags) {
        const group = getGroupForCategory(tag.category || '')
        groupCounts.set(group, (groupCounts.get(group) || 0) + 1)
      }

      const neededGroups: string[] = []
      for (const [group, compGroups] of Object.entries(COMPLEMENTARY_GROUPS)) {
        const count = groupCounts.get(group) || 0
        if (count > 0) {
          for (const comp of compGroups) {
            if (!neededGroups.includes(comp) && (groupCounts.get(comp) || 0) === 0) {
              neededGroups.push(comp)
            }
          }
        }
      }

      for (const groupId of neededGroups) {
        const group = SEMANTIC_GROUPS.find((g) => g.id === groupId)
        if (!group) continue
        for (const catId of group.categoryIds) {
          const catTags = getTagsByCategory(catId)
          for (const tag of catTags) {
            if (addTag(tag)) {
              if (suggested.length >= 6) break
            }
          }
          if (suggested.length >= 6) break
        }
        if (suggested.length >= 6) break
      }
    }

    // 4. Same-group variety
    if (suggested.length < 6) {
      const groupCounts = new Map<string, number>()
      for (const tag of selectedTags) {
        const group = getGroupForCategory(tag.category || '')
        groupCounts.set(group, (groupCounts.get(group) || 0) + 1)
      }
      const topGroup = Array.from(groupCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
      if (topGroup) {
        const group = SEMANTIC_GROUPS.find((g) => g.id === topGroup)
        if (group) {
          for (const catId of group.categoryIds) {
            const catTags = getTagsByCategory(catId)
            for (const tag of catTags) {
              if (addTag(tag)) {
                if (suggested.length >= 6) break
              }
            }
            if (suggested.length >= 6) break
          }
        }
      }
    }

    return suggested.slice(0, 6)
  }, [selectedTags, aiLabels])

  const isConnected = aiState.status === 'connected'
  const isChecking = aiState.status === 'checking'

  if (selectedTags.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkle weight="fill" className="w-3 h-3 text-[var(--ui-muted-text-faint)]" />
        <span className="text-[10px] text-[var(--ui-muted-text-faint)] uppercase tracking-wider font-medium">
          {isLoading || isChecking ? 'Analyzing draft…' : isConnected ? 'AI suggestions' : 'Related tags'}
        </span>
        {(isLoading || isChecking) && (
          <Spinner weight="regular" className="w-3 h-3 animate-spin" style={{ color: 'var(--ui-muted-text-faint)' }} />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'hsl(var(--destructive))' }}>
          <WarningCircle weight="regular" className="w-3 h-3 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {suggestions.map((tag) => (
            <motion.button
              key={tag.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleTag(tag)}
              data-group={getGroupForCategory(tag.category || '')}
              className="tag-chip"
              title={tag.description}
            >
              <span className="truncate">{tag.label}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {suggestions.length === 0 && !isLoading && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ui-muted-text-faint)' }}>
          {isConnected
            ? 'No suggestions found. Try selecting different tags.'
            : 'Select more tags or connect a local AI provider for smarter suggestions.'}
        </p>
      )}

      {!isConnected && !isChecking && suggestions.length > 0 && (
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ui-muted-text-faint)' }}>
          Connect a local AI provider (Ollama, LM Studio, or OpenAI) for context-aware suggestions.
        </p>
      )}
    </div>
  )
}
