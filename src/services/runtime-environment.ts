export function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function getMuseRuntime(): 'browser' | 'desktop' {
  return isTauriRuntime() ? 'desktop' : 'browser'
}
