import { usePromptSmithStore } from '@/store/prompt-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  PersonSimple,
  TShirt,
  MapPin,
  Sun,
  Camera,
  PaintBrush,
  Smiley,
  CheckCircle,
  WarningCircle,
  Plus,
  X,
  Lightning,
} from '@phosphor-icons/react'
import { useMemo, useState, useCallback } from 'react'
import { searchTagIndex, getAllIndexedTags } from '@/utils/tag-index'
import { PROMPT_SLOTS, hasConflict, type PromptSlot } from '@/data/randomizer-slots'
import type { TaxonomyTag, SelectedTag } from '@/types'

const SLOT_ICONS: Record<string, React.ElementType> = {
  subject: User,
  body: PersonSimple,
  clothing: TShirt,
  setting: MapPin,
  lighting: Sun,
  camera: Camera,
  style: PaintBrush,
  mood: Smiley,
}

function getSlotTags(slot: PromptSlot, selectedTags: SelectedTag[]): SelectedTag[] {
  return selectedTags.filter(tag => {
    if (slot.taxonomyCategoryIds.length === 0) return false
    return slot.taxonomyCategoryIds.some(catId => {
      return tag.category === catId || tag.id.startsWith(catId) || tag.subcategory === catId
    })
  })
}

function getAllConflicts(tags: SelectedTag[]) {
  const conflicts: { tagA: SelectedTag; tagB: SelectedTag; reason: string; severity: 'hard' | 'soft' }[] = []
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const rule = hasConflict(tags[i].label, tags[j].label)
      if (rule) {
        conflicts.push({ tagA: tags[i], tagB: tags[j], reason: rule.reason, severity: rule.severity })
      }
    }
  }
  return conflicts
}

export function PromptDNA() {
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const removeTag = usePromptSmithStore((s) => s.removeTag)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const showExplicit = usePromptSmithStore((s) => s.showExplicit)
  const [suggestingSlot, setSuggestingSlot] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<TaxonomyTag[]>([])
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  const slotAnalysis = useMemo(() => {
    return PROMPT_SLOTS.map(slot => {
      const tags = getSlotTags(slot, selectedTags)
      return {
        ...slot,
        tags,
        count: tags.length,
        isFilled: tags.length >= slot.minTags,
        isOverloaded: tags.length > slot.maxTags,
        isRequired: slot.required,
      }
    })
  }, [selectedTags])

  const filledCount = slotAnalysis.filter(s => s.isFilled).length
  const totalCount = slotAnalysis.length
  const requiredFilled = slotAnalysis.filter(s => s.isRequired && s.isFilled).length
  const requiredTotal = slotAnalysis.filter(s => s.isRequired).length

  const conflicts = useMemo(() => getAllConflicts(selectedTags), [selectedTags])

  const fetchSuggestions = useCallback((slotId: string) => {
    const slot = PROMPT_SLOTS.find(s => s.id === slotId)
    if (!slot) return
    const keyword = slot.taxonomyCategoryIds[0] || slotId
    const results = searchTagIndex(keyword, showExplicit, 12)
    const filtered = results.filter(r => !selectedTags.some(t => t.id === r.id))
    setSuggestions(filtered.slice(0, 8))
    setSuggestingSlot(slotId)
    setExpandedSlot(slotId)
  }, [showExplicit, selectedTags])

  const closeSuggestions = () => {
    setSuggestingSlot(null)
    setSuggestions([])
  }

  const score = totalCount > 0 ? filledCount / totalCount : 0
  const scoreLabel = score === 0 ? 'Empty' : score < 0.4 ? 'Sparse' : score < 0.7 ? 'Good' : 'Complete'
  const scoreColor = score === 0 ? 'text-[#c2c2c2]/30' : score < 0.4 ? 'text-amber-400/60' : score < 0.7 ? 'text-[#c2c2c2]' : 'text-[#f5f5f5]'

  const allTags = getAllIndexedTags()

  return (
    <div className="border border-[#333] rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-[#f5f5f5]">Composition</h3>
          <p className="text-[10px] text-[#c2c2c2]/40 mt-0.5">
            {requiredTotal > 0
              ? `${requiredFilled}/${requiredTotal} required, ${filledCount}/${totalCount} total`
              : `${filledCount}/${totalCount} slots filled`
            }
          </p>
        </div>
        <span className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</span>
      </div>

      {/* Completion bar */}
      <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(filledCount / totalCount) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`h-full rounded-full ${score < 0.4 ? 'bg-amber-400/40' : score < 0.7 ? 'bg-[#c2c2c2]/40' : 'bg-[#f5f5f5]/60'}`}
        />
      </div>

      {/* Conflicts banner */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-400/20 bg-amber-400/5">
              <WarningCircle weight="fill" className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {conflicts.slice(0, 3).map((c, i) => (
                  <p key={i} className="text-[10px] text-amber-400/50 leading-relaxed">
                    <span className="text-amber-400/70 font-medium">{c.tagA.label}</span>
                    {' vs '}
                    <span className="text-amber-400/70 font-medium">{c.tagB.label}</span>
                    {' — '}{c.reason}
                  </p>
                ))}
                {conflicts.length > 3 && (
                  <p className="text-[10px] text-amber-400/40">+{conflicts.length - 3} more</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot rows */}
      <div className="space-y-1">
        {slotAnalysis.map(slot => {
          const Icon = SLOT_ICONS[slot.id] || User
          const isExpanded = expandedSlot === slot.id
          const isSuggesting = suggestingSlot === slot.id

          return (
            <div key={slot.id} className="rounded-lg">
              {/* Slot header */}
              <div className="flex items-center justify-between py-1.5">
                <button
                  onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <Icon
                    weight={slot.isFilled ? 'fill' : 'regular'}
                    className={`w-3.5 h-3.5 transition-colors ${slot.isFilled ? 'text-[#f5f5f5]' : 'text-[#c2c2c2]/20'}`}
                  />
                  <span className={`text-xs transition-colors ${slot.isFilled ? 'text-[#f5f5f5]' : 'text-[#c2c2c2]/30'}`}>
                    {slot.label}
                  </span>
                  {slot.isRequired && !slot.isFilled && (
                    <span className="text-[9px] text-red-400/50 uppercase tracking-wider">required</span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {slot.count > 0 && (
                    <span className="text-[10px] text-[#c2c2c2]/40">
                      {slot.count}/{slot.maxTags}
                    </span>
                  )}
                  {slot.isOverloaded && (
                    <WarningCircle weight="fill" className="w-3 h-3 text-amber-400/50" />
                  )}
                  {!isSuggesting && slot.count < slot.maxTags && (
                    <button
                      onClick={() => fetchSuggestions(slot.id)}
                      className="text-[10px] text-[#c2c2c2]/25 hover:text-[#c2c2c2]/60 transition-colors flex items-center gap-0.5"
                      title="Suggest tags"
                    >
                      <Plus weight="bold" className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned tags */}
              <AnimatePresence>
                {isExpanded && slot.tags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden pb-2"
                  >
                    <div className="flex flex-wrap gap-1.5 ml-5.5">
                      {slot.tags.map(tag => (
                        <motion.span
                          key={tag.id}
                          layout
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.03] border border-[#333] text-[10px] text-[#c2c2c2]/60 group hover:border-[#555] transition-colors"
                        >
                          {tag.label}
                          <button
                            onClick={() => removeTag(tag.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#c2c2c2]/30 hover:text-red-400 transition-all"
                          >
                            <X weight="bold" className="w-2.5 h-2.5" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestions */}
              <AnimatePresence>
                {isSuggesting && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden pb-2"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 ml-5.5">
                      <Lightning weight="fill" className="w-2.5 h-2.5 text-[#c2c2c2]/30" />
                      <span className="text-[10px] text-[#c2c2c2]/30">Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-5.5">
                      {suggestions.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => { toggleTag(tag); closeSuggestions() }}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-[#333] text-[#c2c2c2]/40 hover:border-[#555] hover:text-[#f5f5f5] transition-colors"
                        >
                          {tag.label}
                        </button>
                      ))}
                      <button
                        onClick={closeSuggestions}
                        className="text-[10px] px-2 py-0.5 text-[#c2c2c2]/20 hover:text-[#c2c2c2]/40 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="h-px bg-[#1a1a1a]" />
            </div>
          )
        })}
      </div>

      {/* Footer recommendation */}
      {selectedTags.length > 0 && (
        <div className="pt-2">
          {conflicts.length === 0 && score >= 0.7 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle weight="fill" className="w-3 h-3 text-[#c2c2c2]/30" />
              <p className="text-[10px] text-[#c2c2c2]/30">Composition looks solid.</p>
            </div>
          )}
          {score < 0.7 && conflicts.length === 0 && (
            <p className="text-[10px] text-[#c2c2c2]/25 leading-relaxed">
              Add more slots for a richer prompt.
            </p>
          )}
        </div>
      )}

      {selectedTags.length === 0 && (
        <div className="py-4 text-center">
          <p className="text-xs text-[#c2c2c2]/20">Select tags to see composition analysis.</p>
        </div>
      )}
    </div>
  )
}
