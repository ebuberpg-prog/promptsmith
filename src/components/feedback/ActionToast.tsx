import { useEffect } from 'react'
import { CheckCircle, X } from '@phosphor-icons/react'

export function ActionToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 2400)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null
  return <div role="status" aria-live="polite" className="fixed left-1/2 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-text)] px-3 py-2.5 text-[var(--ui-bg)] shadow-lg flex items-center gap-2"><CheckCircle className="size-4 shrink-0" weight="fill" /><span className="min-w-0 flex-1 text-sm truncate">{message}</span><button type="button" onClick={onDismiss} className="size-11 -my-2 flex items-center justify-center" aria-label="Dismiss notification"><X className="size-4" /></button></div>
}
