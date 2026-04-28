import { useEffect, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'

export function useKeyboardShortcuts() {
  const undo = usePromptSmithStore((s) => s.undo)
  const redo = usePromptSmithStore((s) => s.redo)
  const canUndo = usePromptSmithStore((s) => s.canUndo)
  const canRedo = usePromptSmithStore((s) => s.canRedo)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey
      if (!isMeta) return

      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (e.key === 'z' && !e.shiftKey) {
        if (isTyping) return
        e.preventDefault()
        if (canUndo()) undo()
      }

      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (isTyping) return
        e.preventDefault()
        if (canRedo()) redo()
      }
    },
    [undo, redo, canUndo, canRedo]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
