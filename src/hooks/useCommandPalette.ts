import { useState, useEffect, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { searchTagIndex } from '@/utils/tag-index'
import { getGroupForCategory } from '@/data/category-colors'
import { MODEL_CONFIGS } from '@/data/model-configs'
import { BLUEPRINT_TEMPLATES } from '@/data/template-blueprints'
import { applyGalleryTemplate } from '@/utils/template-engine'

export type CommandResultType = 'tag' | 'template' | 'model' | 'command'

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

  const toggleTag = usePromptSmithStore((s) => s.toggleTag)
  const startNewPrompt = usePromptSmithStore((s) => s.startNewPrompt)
  const savedPrompts = usePromptSmithStore((s) => s.savedPrompts)
  const loadPrompt = usePromptSmithStore((s) => s.loadPrompt)
  const contentVisibility = usePromptSmithStore((s) => s.contentVisibility)

  const buildCommands = useCallback((): CommandResult[] => {
    const cmds: CommandResult[] = []

    if (query.length >= 2) {
      const tagResults = searchTagIndex(query, contentVisibility, 20)
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

      const builtInTemplates = BLUEPRINT_TEMPLATES.filter((template) =>
        `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 4)
      for (const template of builtInTemplates) {
        cmds.push({
          id: `built-in-${template.id}`,
          type: 'template',
          label: template.name,
          description: template.description,
          group: 'Starter',
          action: () => {
            void (async () => {
              const store = usePromptSmithStore.getState()
              const resolved = await applyGalleryTemplate(template, store.selectedModel, store.contentVisibility)
              store.captureDraftSnapshot('template')
              store.startHistoryBatch()
              store.clearAllTags()
              resolved.tags.forEach((tag) => store.toggleTag(tag))
              store.setCustomText(resolved.customText)
              if (resolved.modelParams) store.setModelParameters(resolved.modelParams)
              store.endHistoryBatch()
              store.setWorkspaceView('craft')
            })()
          },
        })
      }

      for (const model of Object.values(MODEL_CONFIGS).filter((model) =>
        `${model.name} ${model.version}`.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 4)) {
        cmds.push({
          id: `model-${model.id}`,
          type: 'model',
          label: model.name,
          description: model.version,
          group: 'Model',
          action: () => usePromptSmithStore.getState().setSelectedModel(model.id),
        })
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

    if (query.length === 0 || 'new blank clear reset'.includes(query.toLowerCase())) {
      cmds.push({
        id: 'cmd-clear',
        type: 'command',
        label: 'New blank prompt',
        description: 'Clear words, ingredients, negatives, and the Library link',
        action: () => startNewPrompt(),
      })
    }

    if (query.length === 0 || 'save'.includes(query.toLowerCase())) {
      cmds.push({
        id: 'cmd-save',
        type: 'command',
        label: 'Save prompt',
        description: 'Save current prompt as template',
        action: () => window.dispatchEvent(new CustomEvent('prompt-save')),
      })
    }

    if (query.length === 0 || 'home craft analyze library'.includes(query.toLowerCase())) {
      for (const view of ['home', 'craft', 'analyze', 'library'] as const) {
        if (query && !view.includes(query.toLowerCase())) continue
        cmds.push({
          id: `cmd-view-${view}`,
          type: 'command',
          label: `Open ${view}`,
          description: `Go to the ${view} workspace`,
          action: () => usePromptSmithStore.getState().setWorkspaceView(view),
        })
      }
    }

    return cmds
  }, [query, savedPrompts, toggleTag, startNewPrompt, loadPrompt, contentVisibility])

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
