import { useSyncExternalStore } from 'react'
import { getStorageWriteState, subscribeStorageWrites } from '@/store/indexeddb-storage'
import { usePromptSmithStore } from '@/store/prompt-store'
import type { DraftPersistenceState } from '@/types'

export function useDraftPersistenceState(): DraftPersistenceState {
  const writeState = useSyncExternalStore(subscribeStorageWrites, getStorageWriteState, () => 'saved')
  const durability = usePromptSmithStore((state) => state.storageDurability)
  if (writeState === 'saving' || writeState === 'error') return writeState
  return durability === 'persistent' ? 'saved' : 'best-effort'
}
