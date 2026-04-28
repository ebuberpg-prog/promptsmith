import { create } from 'zustand'
import type { SelectedTag, SupportedModel } from '@/types'

export interface StateSnapshot {
  selectedTags: SelectedTag[]
  customText: string
  selectedModel: SupportedModel
  timestamp: number
}

interface HistoryStore {
  past: StateSnapshot[]
  future: StateSnapshot[]
  maxHistory: number

  canUndo: () => boolean
  canRedo: () => boolean

  saveSnapshot: (snapshot: StateSnapshot) => void
  undo: (currentSnapshot: StateSnapshot) => StateSnapshot | null
  redo: (currentSnapshot: StateSnapshot) => StateSnapshot | null
  clear: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  saveSnapshot: (snapshot) => {
    set((state) => {
      const past = [...state.past, snapshot]
      if (past.length > state.maxHistory) {
        past.shift()
      }
      return { past, future: [] }
    })
  },

  undo: (currentSnapshot) => {
    const state = get()
    if (state.past.length === 0) return null

    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, -1)
    const newFuture = [currentSnapshot, ...state.future]

    set({ past: newPast, future: newFuture })
    return previous
  },

  redo: (currentSnapshot) => {
    const state = get()
    if (state.future.length === 0) return null

    const next = state.future[0]
    const newFuture = state.future.slice(1)
    const newPast = [...state.past, currentSnapshot]

    if (newPast.length > state.maxHistory) {
      newPast.shift()
    }

    set({ past: newPast, future: newFuture })
    return next
  },

  clear: () => set({ past: [], future: [] }),
}))

// Helper to create a deep-cloned snapshot from current state
export function createSnapshot(
  selectedTags: SelectedTag[],
  customText: string,
  selectedModel: SupportedModel
): StateSnapshot {
  return {
    selectedTags: JSON.parse(JSON.stringify(selectedTags)),
    customText,
    selectedModel,
    timestamp: Date.now(),
  }
}
