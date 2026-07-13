import type { StorageDurability } from '@/types'

export interface DiagnosticSummary {
  _schema: 'muse-diagnostics-v1'
  createdAt: number
  appVersion: string
  storageDurability: StorageDurability
  serviceWorkerStatus: 'active' | 'unsupported' | 'inactive'
  taxonomyTagCount: number
  savedPromptCount: number
  savedEntityCount: number
  referenceCount: number
  promptText?: string
}

export function createDiagnosticSummary(input: Omit<DiagnosticSummary, '_schema' | 'createdAt' | 'appVersion' | 'serviceWorkerStatus'>): DiagnosticSummary {
  return {
    _schema: 'muse-diagnostics-v1',
    createdAt: Date.now(),
    appVersion: '1.0.0',
    serviceWorkerStatus: typeof navigator === 'undefined' || !('serviceWorker' in navigator)
      ? 'unsupported'
      : navigator.serviceWorker.controller ? 'active' : 'inactive',
    ...input,
  }
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
