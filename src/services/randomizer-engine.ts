import type { TaxonomyTag } from '@/types'
import type { SlotId } from '@/data/randomizer-slots'
import { PROMPT_SLOTS, wouldConflictWithAny } from '@/data/randomizer-slots'
import { getVibeById, type VibeDefinition } from '@/data/randomizer-vibes'
import { getAllIndexedTags } from '@/utils/tag-index'
import type { RandomizerMode } from '@/data/randomizer-modes'
import { INTENTS, getIntentById } from '@/data/randomizer-modes'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededChoice<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface RandomizerResult {
  tags: TaxonomyTag[]
  seed: number
  vibe: string | null
  intent: string | null
  slots: Partial<Record<SlotId, TaxonomyTag[]>>
  warnings: string[]
  mode: RandomizerMode
}

export interface RandomizerOptions {
  vibe?: string
  intent?: string
  storySeed?: string
  intensity: 'light' | 'full'
  showExplicit: boolean
  seed: number
  mode?: RandomizerMode
  lockedTagIds?: string[]
  // Full tag objects for locked tags — used to seed conflict detection
  lockedTags?: TaxonomyTag[]
}

export class RandomizerEngine {
  randomize(options: RandomizerOptions): RandomizerResult {
    const mode = options.mode ?? 'coherence-aware'
    const seed = options.seed

    switch (mode) {
      case 'classic':
        return this.randomizeClassic({ ...options, seed })
      case 'intent-first':
        return this.randomizeIntentFirst({ ...options, seed })
      case 'coherence-aware':
        return this.randomizeCoherenceAware({ ...options, seed })
      case 'slot-filled':
        return this.randomizeSlotFilled({ ...options, seed })
      case 'story-driven':
        return this.randomizeStoryDriven({ ...options, seed })
      default:
        return this.randomizeCoherenceAware({ ...options, seed })
    }
  }

  private filterLocked<T extends { id: string }>(items: T[], lockedIds: Set<string>): T[] {
    return items.filter(item => !lockedIds.has(item.id))
  }

  // ─── CLASSIC ────────────────────────────────────────────────────────────────
  private randomizeClassic(options: RandomizerOptions): RandomizerResult {
    const rng = mulberry32(options.seed)
    const allTags = getAllIndexedTags()
    const lockedIds = new Set(options.lockedTagIds ?? [])
    if (allTags.length === 0) {
      return { tags: [], seed: options.seed, vibe: null, intent: null, slots: {}, warnings: ['Tag index not loaded'], mode: 'classic' }
    }

    const vibe = options.vibe ? getVibeById(options.vibe) : null
    const warnings: string[] = []
    const selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>> = {}
    // Pre-seed with locked tags so conflict detection respects pinned tags
    const allSelected: TaxonomyTag[] = [...(options.lockedTags ?? [])]

    const slotsToFill = options.intensity === 'light'
      ? PROMPT_SLOTS.filter(s => s.required || s.id === 'lighting' || s.id === 'style')
      : PROMPT_SLOTS

    for (const slot of slotsToFill) {
      const count = slot.required
        ? Math.max(slot.minTags, 1)
        : options.intensity === 'light'
          ? 1
          : this.pickCountClassic(slot, rng)

      if (count === 0) continue
      const candidates = this.getCandidates(slot, allTags, options.showExplicit, lockedIds)
      if (candidates.length === 0) continue

      const vibeCandidates = vibe ? this.filterByVibe(slot, candidates, vibe) : candidates
      const picks = this.pickTags(vibeCandidates, count, allSelected, warnings, rng)
      if (picks.length > 0) selectedBySlot[slot.id] = picks
    }

    return {
      tags: this.filterLocked(allSelected, lockedIds),
      seed: options.seed,
      vibe: vibe?.id ?? null,
      intent: null,
      slots: selectedBySlot,
      warnings,
      mode: 'classic',
    }
  }

  // ─── INTENT-FIRST ─────────────────────────────────────────────────────────
  private randomizeIntentFirst(options: RandomizerOptions): RandomizerResult {
    const rng = mulberry32(options.seed)
    const allTags = getAllIndexedTags()
    const lockedIds = new Set(options.lockedTagIds ?? [])
    if (allTags.length === 0) {
      return { tags: [], seed: options.seed, vibe: null, intent: null, slots: {}, warnings: ['Tag index not loaded'], mode: 'intent-first' }
    }

    const intent = options.intent
      ? getIntentById(options.intent)
      : seededChoice(INTENTS, rng)

    if (!intent) {
      return { tags: [], seed: options.seed, vibe: null, intent: null, slots: {}, warnings: ['No intent found'], mode: 'intent-first' }
    }

    const warnings: string[] = []
    const selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>> = {}
    // Pre-seed with locked tags so conflict detection respects pinned tags
    const allSelected: TaxonomyTag[] = [...(options.lockedTags ?? [])]

    for (const [slotId, slotIntent] of Object.entries(intent.slotIntent)) {
      const slot = PROMPT_SLOTS.find(s => s.id === slotId)
      if (!slot) continue

      const { keywords, count } = slotIntent
      const candidates = this.getCandidates(slot, allTags, options.showExplicit, lockedIds)
      const matched = candidates.filter(tag =>
        keywords.some(kw => tag.label.toLowerCase().includes(kw.toLowerCase()))
      )
      const pool = matched.length > 0 ? matched : candidates
      const picks = this.pickTags(pool, count, allSelected, warnings, rng)
      if (picks.length > 0) selectedBySlot[slotId as SlotId] = picks
    }

    return {
      tags: this.filterLocked(allSelected, lockedIds),
      seed: options.seed,
      vibe: null,
      intent: intent.id,
      slots: selectedBySlot,
      warnings,
      mode: 'intent-first',
    }
  }

  // ─── COHERENCE-AWARE ────────────────────────────────────────────────────────
  private randomizeCoherenceAware(options: RandomizerOptions): RandomizerResult {
    const rng = mulberry32(options.seed)
    const allTags = getAllIndexedTags()
    const lockedIds = new Set(options.lockedTagIds ?? [])
    if (allTags.length === 0) {
      return { tags: [], seed: options.seed, vibe: null, intent: null, slots: {}, warnings: ['Tag index not loaded'], mode: 'coherence-aware' }
    }

    const vibe = options.vibe ? getVibeById(options.vibe) : null
    const warnings: string[] = []
    const selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>> = {}
    // Pre-seed with locked tags so conflict detection respects pinned tags
    const allSelected: TaxonomyTag[] = [...(options.lockedTags ?? [])]

    const slotsToFill = options.intensity === 'light'
      ? PROMPT_SLOTS.filter(s => s.required || s.id === 'lighting' || s.id === 'style')
      : PROMPT_SLOTS

    for (const slot of slotsToFill) {
      const count = slot.required
        ? Math.max(slot.minTags, 1)
        : options.intensity === 'light'
          ? 1
          : this.pickCountClassic(slot, rng)

      if (count === 0) continue
      const candidates = this.getCandidates(slot, allTags, options.showExplicit, lockedIds)
      if (candidates.length === 0) continue

      const vibeCandidates = vibe ? this.filterByVibe(slot, candidates, vibe) : candidates
      const picks = this.pickTags(vibeCandidates, count, allSelected, warnings, rng)
      if (picks.length > 0) selectedBySlot[slot.id] = picks
    }

    if (options.intensity === 'full' && vibe && vibe.accentKeywords.length > 0) {
      this.addAccentTags(allTags, selectedBySlot, allSelected, vibe, options.showExplicit, lockedIds, rng)
    }

    const coherenceWarnings = this.runCoherencePass(selectedBySlot)
    warnings.push(...coherenceWarnings)

    return {
      tags: this.filterLocked(allSelected, lockedIds),
      seed: options.seed,
      vibe: vibe?.id ?? null,
      intent: null,
      slots: selectedBySlot,
      warnings,
      mode: 'coherence-aware',
    }
  }

  // ─── SLOT-FILLED ────────────────────────────────────────────────────────────
  private randomizeSlotFilled(options: RandomizerOptions): RandomizerResult {
    const rng = mulberry32(options.seed)
    const allTags = getAllIndexedTags()
    const lockedIds = new Set(options.lockedTagIds ?? [])
    if (allTags.length === 0) {
      return { tags: [], seed: options.seed, vibe: null, intent: null, slots: {}, warnings: ['Tag index not loaded'], mode: 'slot-filled' }
    }

    const vibe = options.vibe ? getVibeById(options.vibe) : null
    const warnings: string[] = []
    const selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>> = {}
    // Pre-seed with locked tags so conflict detection respects pinned tags
    const allSelected: TaxonomyTag[] = [...(options.lockedTags ?? [])]

    const slotsToFill = options.intensity === 'light'
      ? PROMPT_SLOTS.filter(s => s.required || s.id === 'lighting' || s.id === 'style')
      : PROMPT_SLOTS

    for (const slot of slotsToFill) {
      const count = slot.required
        ? Math.max(slot.minTags, 1)
        : options.intensity === 'light'
          ? 1
          : this.pickCountSlotFilled(slot, rng)

      if (count === 0) continue
      const candidates = this.getCandidates(slot, allTags, options.showExplicit, lockedIds)
      if (candidates.length === 0) continue

      const vibeCandidates = vibe ? this.filterByVibe(slot, candidates, vibe) : candidates
      const picks = this.pickTags(vibeCandidates, count, allSelected, warnings, rng)
      if (picks.length > 0) selectedBySlot[slot.id] = picks
    }

    if (options.intensity === 'full' && vibe && vibe.accentKeywords.length > 0) {
      this.addAccentTags(allTags, selectedBySlot, allSelected, vibe, options.showExplicit, lockedIds, rng)
    }

    return {
      tags: this.filterLocked(allSelected, lockedIds),
      seed: options.seed,
      vibe: vibe?.id ?? null,
      intent: null,
      slots: selectedBySlot,
      warnings,
      mode: 'slot-filled',
    }
  }

  // ─── STORY-DRIVEN ───────────────────────────────────────────────────────────
  private randomizeStoryDriven(options: RandomizerOptions): RandomizerResult {
    const rng = mulberry32(options.seed)
    const allTags = getAllIndexedTags()
    const lockedIds = new Set(options.lockedTagIds ?? [])
    if (allTags.length === 0) {
      return { tags: [], seed: options.seed, vibe: null, intent: null, slots: {}, warnings: ['Tag index not loaded'], mode: 'story-driven' }
    }

    const storySeed = options.storySeed?.trim() ?? ''
    // Fall back to coherence-aware when no story text is provided
    if (!storySeed) {
      return this.randomizeCoherenceAware({ ...options, mode: 'coherence-aware' })
    }

    const vibe = options.vibe ? getVibeById(options.vibe) : null
    const warnings: string[] = []
    const selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>> = {}
    // Pre-seed with locked tags so conflict detection respects pinned tags
    const allSelected: TaxonomyTag[] = [...(options.lockedTags ?? [])]

    const seedKeywords = this.extractKeywordsFromSeed(storySeed)

    const slotsToFill = options.intensity === 'light'
      ? PROMPT_SLOTS.filter(s => s.required || s.id === 'lighting' || s.id === 'style')
      : PROMPT_SLOTS

    for (const slot of slotsToFill) {
      const count = slot.required
        ? Math.max(slot.minTags, 1)
        : options.intensity === 'light'
          ? 1
          : this.pickCountClassic(slot, rng)

      if (count === 0) continue
      const candidates = this.getCandidates(slot, allTags, options.showExplicit, lockedIds)
      if (candidates.length === 0) continue

      const storyMatched = candidates.filter(tag =>
        seedKeywords.some(kw => tag.label.toLowerCase().includes(kw.toLowerCase()))
      )

      let pool = candidates
      if (storyMatched.length > 0) {
        pool = storyMatched
        warnings.push(`Story-matched ${storyMatched.length} tags for slot ${slot.id}`)
      } else if (vibe) {
        const vibeMatched = this.filterByVibe(slot, candidates, vibe)
        if (vibeMatched.length > 0) pool = vibeMatched
      }

      const picks = this.pickTags(pool, count, allSelected, warnings, rng)
      if (picks.length > 0) selectedBySlot[slot.id] = picks
    }

    return {
      tags: this.filterLocked(allSelected, lockedIds),
      seed: options.seed,
      vibe: vibe?.id ?? null,
      intent: null,
      slots: selectedBySlot,
      warnings,
      mode: 'story-driven',
    }
  }

  // ─── SHARED HELPERS ─────────────────────────────────────────────────────────

  private getCandidates(
    slot: (typeof PROMPT_SLOTS)[number],
    allTags: TaxonomyTag[],
    showExplicit: boolean,
    lockedIds: Set<string>
  ): TaxonomyTag[] {
    return allTags.filter(tag => {
      if (!showExplicit && tag.explicit) return false
      if (lockedIds.has(tag.id)) return false
      return slot.taxonomyCategoryIds.some(catId =>
        tag.category === catId || tag.category?.startsWith(catId)
      )
    })
  }

  private filterByVibe(slot: (typeof PROMPT_SLOTS)[number], candidates: TaxonomyTag[], vibe: VibeDefinition): TaxonomyTag[] {
    const vibeKeywords = vibe.slotKeywords[slot.id] ?? []
    if (vibeKeywords.length === 0) return candidates
    return candidates.filter(tag =>
      vibeKeywords.some(kw => tag.label.toLowerCase().includes(kw.toLowerCase()))
    )
  }

  private pickTags(
    candidates: TaxonomyTag[],
    count: number,
    allSelected: TaxonomyTag[],
    warnings: string[],
    rng: () => number
  ): TaxonomyTag[] {
    const shuffled = seededShuffle(candidates, rng)
    const picked: TaxonomyTag[] = []

    for (const candidate of shuffled) {
      if (picked.length >= count) break
      const conflict = wouldConflictWithAny(candidate, allSelected)
      if (conflict) {
        if (conflict.severity === 'soft') {
          warnings.push(`Soft conflict allowed: "${candidate.label}" vs existing (${conflict.reason})`)
          picked.push(candidate)
          allSelected.push(candidate)
        }
        continue
      }
      picked.push(candidate)
      allSelected.push(candidate)
    }
    return picked
  }

  private pickCountClassic(slot: { minTags: number; maxTags: number }, rng: () => number): number {
    if (rng() < 0.1) return 0
    const range = slot.maxTags - slot.minTags
    return slot.minTags + (range === 0 ? 0 : Math.floor(rng() * (range + 1)))
  }

  private pickCountSlotFilled(slot: { minTags: number; maxTags: number }, rng: () => number): number {
    const range = slot.maxTags - slot.minTags
    return slot.minTags + (range === 0 ? 1 : 1 + Math.floor(rng() * range))
  }

  private addAccentTags(
    allTags: TaxonomyTag[],
    selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>>,
    allSelected: TaxonomyTag[],
    vibe: VibeDefinition,
    showExplicit: boolean,
    lockedIds: Set<string>,
    rng: () => number
  ): void {
    if (vibe.accentKeywords.length === 0) return
    const accentCandidates = allTags.filter(tag => {
      if (!showExplicit && tag.explicit) return false
      if (lockedIds.has(tag.id)) return false
      if (allSelected.some(s => s.id === tag.id)) return false
      return vibe.accentKeywords.some(kw => tag.label.toLowerCase().includes(kw.toLowerCase()))
    })
    if (accentCandidates.length > 0) {
      const accent = seededChoice(accentCandidates, rng)
      const conflict = wouldConflictWithAny(accent, allSelected)
      if (!conflict || conflict.severity === 'soft') {
        allSelected.push(accent)
        selectedBySlot['style'] = [...(selectedBySlot['style'] ?? []), accent]
      }
    }
  }

  // ─── COHERENCE POST-PROCESSING ──────────────────────────────────────────────

  private runCoherencePass(
    selectedBySlot: Partial<Record<SlotId, TaxonomyTag[]>>
  ): string[] {
    const coherenceWarnings: string[] = []

    const envLightingRules: Array<[string[], string[], string]> = [
      [['underwater', 'ocean', 'beach'], ['golden hour', 'natural light', 'soft light'], 'outdoor/underwater settings pair better with natural/soft lighting'],
      [['urban', 'city street', 'alleyway'], ['studio lighting', 'softbox'], 'urban settings pair better with natural or neon lighting rather than studio'],
      [['studio', 'minimal'], ['neon lighting', 'natural light'], 'studio settings pair better with controlled studio lighting'],
      [['forest', 'garden', 'meadow'], ['studio lighting', 'neon lighting'], 'nature settings pair better with natural or golden hour lighting'],
    ]

    const settingMoodRules: Array<[string[], string[], string]> = [
      [['nightclub', 'city street', 'cyberpunk'], ['peaceful', 'serene', 'calm'], 'tense/dystopian moods pair better with intense/tense atmospheres'],
      [['garden', 'meadow', 'beach'], ['intense', 'dramatic', 'hostile'], 'peaceful settings pair better with calm/romantic moods'],
    ]

    const getSlotTags = (slotId: SlotId): string[] => {
      const tags = selectedBySlot[slotId] ?? []
      return tags.map(t => t.label.toLowerCase())
    }

    const envLabels = getSlotTags('setting')
    const lightingLabels = getSlotTags('lighting')
    const moodLabels = getSlotTags('mood')

    for (const [envPats, lightPats, reason] of envLightingRules) {
      const envMatch = envPats.some(p => envLabels.some(l => l.includes(p)))
      const lightMatch = lightPats.some(p => lightingLabels.some(l => l.includes(p)))
      if (envMatch && lightMatch) {
        coherenceWarnings.push(reason)
      }
    }

    for (const [envPats, moodPats, reason] of settingMoodRules) {
      const envMatch = envPats.some(p => envLabels.some(l => l.includes(p)))
      const moodMatch = moodPats.some(p => moodLabels.some(l => l.includes(p)))
      if (envMatch && moodMatch) {
        coherenceWarnings.push(reason)
      }
    }

    return coherenceWarnings
  }

  private extractKeywordsFromSeed(seed: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'at', 'in', 'on', 'of', 'with', 'and', 'or', 'to', 'is', 'was', 'were',
      'at', 'by', 'for', 'as', 'that', 'this', 'it', 'be', 'are', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
      'i', 'you', 'he', 'she', 'they', 'we', 'my', 'your', 'his', 'her', 'their', 'our',
      'some', 'any', 'no', 'not', 'but', 'if', 'else', 'when', 'where', 'how', 'what', 'which',
      'who', 'whom', 'whose', 'why', 'a', 'about', 'above', 'after', 'again', 'against',
      'all', 'am', 'are', 'as', 'because', 'before', 'below', 'between', 'both', 'but', 'by',
    ])
    const words = seed
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
    return [...new Set(words)]
  }
}
