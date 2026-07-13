import { useCallback, useEffect, useState } from 'react'
import { Lightning } from '@phosphor-icons/react'
import { StudioExperience } from '@/components/workspace/StudioExperience'
import { loadTaxonomy } from '@/utils/taxonomy-loader'
import { usePromptSmithStore } from '@/store/prompt-store'
import { clearStorageError, flushPendingState, getStorageDurability, getStorageError } from '@/store/indexeddb-storage'
import type { TaxonomyCategory } from '@/types'

function exportRecoveryBackup() {
  const json = usePromptSmithStore.getState().exportCompleteBackup()
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `muse-recovery-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function resetPreferencesOnly() {
  usePromptSmithStore.setState({
    contentVisibility: 'filtered',
    workspaceDepth: 'simple',
    workspaceView: 'home',
    theme: 'light',
    selectedFormatterProfileId: 'format:natural-language',
    storageDurability: 'best-effort',
  })
}

function App() {
  const [loading, setLoading] = useState(true)
  const [taxonomy, setTaxonomy] = useState<TaxonomyCategory[]>([])
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(usePromptSmithStore.persist.hasHydrated())
  const [continueWithFallback, setContinueWithFallback] = useState(false)
  const theme = usePromptSmithStore((state) => state.theme)

  const loadTaxonomyData = useCallback(async () => {
    setLoading(true)
    setTaxonomyError(null)
    try {
      const data = await loadTaxonomy()
      if (data.length === 0) throw new Error('No taxonomy categories could be loaded.')
      setTaxonomy(data)
    } catch (error) {
      setTaxonomyError(error instanceof Error ? error.message : 'The prompt library could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTaxonomyData()
  }, [loadTaxonomyData])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('promptsmith-theme', theme)
  }, [theme])

  useEffect(() => usePromptSmithStore.persist.onFinishHydration(() => setHydrated(true)), [])

  useEffect(() => {
    const flush = () => { void flushPendingState() }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  useEffect(() => {
    if (!hydrated || usePromptSmithStore.getState().storageDurability === 'denied') return
    void getStorageDurability().then((durability) => usePromptSmithStore.getState().setStorageDurability(durability))
  }, [hydrated])

  if (loading || !hydrated) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[var(--ui-bg)]">
        <section className="text-center" aria-live="polite">
          <div className="size-12 mx-auto mb-6 rounded-lg border border-[var(--ui-border)] flex items-center justify-center">
            <Lightning weight="fill" className="size-5 text-[var(--ui-text)]" />
          </div>
          <h1 className="font-display text-3xl text-balance text-[var(--ui-text)]">MUSE Prompt Studio</h1>
          <p className="mt-2 text-sm text-pretty text-[var(--ui-muted-text)]">Opening your private workspace…</p>
        </section>
      </main>
    )
  }

  const storageError = getStorageError()
  if (storageError && !continueWithFallback) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-[var(--ui-bg)] text-[var(--ui-text)]">
        <section className="w-full max-w-md text-center" role="alert" aria-live="assertive">
          <Lightning weight="fill" className="size-6 mx-auto text-[var(--ui-muted-text)]" />
          <h1 className="mt-5 font-display text-3xl text-balance">Private storage needs attention.</h1>
          <p className="mt-3 text-sm text-pretty text-[var(--ui-muted-text)]">MUSE could not open its durable local database. Your legacy local copy has not been deleted.</p>
          <p className="mt-2 text-xs text-pretty text-[var(--ui-muted-text-faint)]">{storageError.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => {
              clearStorageError()
              void usePromptSmithStore.persist.rehydrate()
            }} className="min-h-11 px-4 rounded-lg bg-[var(--ui-text)] text-[var(--ui-bg)]">Retry</button>
            <button type="button" onClick={() => setContinueWithFallback(true)} className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Continue with legacy storage</button>
            <button type="button" onClick={exportRecoveryBackup} className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Export recoverable data</button>
            <button type="button" onClick={resetPreferencesOnly} className="min-h-11 px-4 rounded-lg border border-[var(--ui-border)]">Reset app preferences</button>
          </div>
        </section>
      </main>
    )
  }

  if (taxonomyError) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-[var(--ui-bg)]">
        <section className="w-full max-w-md text-center" role="alert" aria-live="assertive">
          <div className="size-12 mx-auto mb-6 rounded-lg border border-[var(--ui-border)] flex items-center justify-center">
            <Lightning weight="fill" className="size-5 text-[var(--ui-text)]" />
          </div>
          <h1 className="font-display text-2xl text-balance text-[var(--ui-text)]">Prompt library unavailable</h1>
          <p className="mt-3 text-sm text-pretty text-[var(--ui-muted-text)]">MUSE could not load its local taxonomy. Try loading it again.</p>
          <p className="mt-2 text-xs text-pretty text-[var(--ui-muted-text-faint)]">{taxonomyError}</p>
          <button type="button" onClick={() => void loadTaxonomyData()} className="mt-6 min-h-11 rounded-lg border border-[var(--ui-border)] px-5 text-sm text-[var(--ui-text)] hover:border-[var(--ui-border-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Retry loading
          </button>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={exportRecoveryBackup} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Export recoverable data</button>
            <button type="button" onClick={resetPreferencesOnly} className="min-h-11 rounded-lg border border-[var(--ui-border)] px-4 text-sm">Reset app preferences</button>
          </div>
        </section>
      </main>
    )
  }

  return <StudioExperience taxonomy={taxonomy} />
}

export default App
