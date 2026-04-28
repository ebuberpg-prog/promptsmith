import { useState, useEffect, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { searchTagIndex, getTagById } from '@/utils/tag-index'
import { getGroupForCategory } from '@/data/category-colors'

export type CommandResultType = 'tag' | 'template' | 'command'

export interface CommandResult {
  id: string
  type: CommandResultType
  label: string
  description?: string
  group?: string
  action: () => void
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [results, setResults] = useState<CommandResult[]>([])

  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const clearAllTags = usePromptSmithStore((s) => s.clearAllTags)
  const savePrompt = usePromptSmithStore((s) => s.savePrompt)
  const savedPrompts = usePromptSmithStore((s) => s.savedPrompts)
  const loadPrompt = usePromptSmithStore((s) => s.loadPrompt)

  const buildCommands = useCallback((): CommandResult[] => {
    const cmds: CommandResult[] = []

    if (query.length >= 2) {
      const tagResults = searchTagIndex(query, true, 20)
      for (const tag of tagResults) {
        cmds.push({
          id: `tag-${tag.id}`,
          type: 'tag',
          label: tag.label,
          description: tag.description,
          group: getGroupForCategory(tag.category || ''),
          action: () => toggleTag(tag),
        })
        if (cmds.filter(c => c.type === 'tag').length >= 8) break
      }
    }

    if (query.length >= 2) {
      const matchingTemplates = savedPrompts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
      for (const tmpl of matchingTemplates) {
        cmds.push({
          id: `template-${tmpl.id}`,
          type: 'template',
          label: tmpl.name,
          description: `${tmpl.selections?.length ?? 0} tags`,
          action: () => loadPrompt(tmpl),
        })
      }
    }

    if (query.length === 0 || 'clear'.includes(query.toLowerCase())) {
      cmds.push({
        id: 'cmd-clear',
        type: 'command',
        label: 'Clear all tags',
        description: 'Remove all selected tags',
        action: () => clearAllTags(),
      })
    }

    if (query.length === 0 || 'save'.includes(query.toLowerCase())) {
      cmds.push({
        id: 'cmd-save',
        type: 'command',
        label: 'Save prompt',
        description: 'Save current prompt as template',
        action: () => {
          const name = prompt('Name this prompt:')
          if (name) savePrompt(name)
        },
      })
    }

    return cmds
  }, [query, selectedTags, savedPrompts, toggleTag, clearAllTags, savePrompt, loadPrompt])

  useEffect(() => {
    setResults(buildCommands())
    setSelectedIndex(0)
  }, [buildCommands])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(prev => !prev)
      setQuery('')
    }
    if (e.key === 'Escape' && open) {
      setOpen(false)
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const handler = () => {
      setOpen(true)
      setQuery('')
    }
    window.addEventListener('command-palette-open', handler)
    return () => window.removeEventListener('command-palette-open', handler)
  }, [])

  const selectResult = useCallback((index: number) => {
    if (index >= 0 && index < results.length) {
      results[index].action()
      setOpen(false)
      setQuery('')
    }
  }, [results])

  const navigateResults = useCallback((direction: 'up' | 'down') => {
    setSelectedIndex(prev => {
      if (direction === 'up') return Math.max(0, prev - 1)
      return Math.min(results.length - 1, prev + 1)
    })
  }, [results.length])

  return {
    open,
    setOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    selectResult,
    navigateResults,
  }
}
