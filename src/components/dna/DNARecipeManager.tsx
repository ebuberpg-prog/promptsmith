import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { Dna, Plus, Trash, ArrowSquareOut, Copy, X, Check } from '@phosphor-icons/react'
import type { DNARecipe } from '@/types'

export function DNARecipeManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)
  const selectedModel = usePromptSmithStore((s) => s.selectedModel)
  const dnaRecipes = usePromptSmithStore((s) => s.dnaRecipes)
  const createDNARecipe = usePromptSmithStore((s) => s.createDNARecipe)
  const loadDNARecipe = usePromptSmithStore((s) => s.loadDNARecipe)
  const deleteDNARecipe = usePromptSmithStore((s) => s.deleteDNARecipe)

  const handleCreate = () => {
    if (newName.trim()) {
      createDNARecipe(newName.trim(), newDescription.trim())
      setNewName('')
      setNewDescription('')
    }
  }

  const handleCopy = (recipe: DNARecipe) => {
    const tags = recipe.tags.map(t => t.label).join(', ')
    navigator.clipboard.writeText(tags)
    setCopiedId(recipe.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated border hover:text-[var(--ui-text)] transition-colors"
        style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border)' }}
      >
        <Dna weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">DNA</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--ui-overlay)' }}>
          <div className="border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2">
                <Dna weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>Character DNA Recipes</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--ui-muted-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-surface-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ui-text)' }}>Create New Recipe</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Recipe name (e.g., 'Elven Warrior')"
                    className="w-full px-2 py-1.5 border rounded text-sm outline-none"
                    style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                  />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-2 py-1.5 border rounded text-sm resize-none h-16 outline-none"
                    style={{ backgroundColor: 'var(--ui-bg)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }}
                  />
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--ui-muted-text)' }}>
                    <span>{selectedTags.length} tags selected</span>
                    <span>Model: {selectedModel}</span>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || selectedTags.length === 0}
                    className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                    style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
                  >
                    <Plus weight="regular" className="w-4 h-4" />
                    Save as DNA Recipe
                  </button>
                </div>
              </div>

              {dnaRecipes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Saved Recipes ({dnaRecipes.length})</h3>
                  {dnaRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="border rounded-lg p-3"
                      style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>{recipe.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(recipe)}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--ui-muted-text)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-bg)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            title="Copy tags"
                          >
                            {copiedId === recipe.id ? <Check weight="bold" className="w-3 h-3" /> : <Copy weight="regular" className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => loadDNARecipe(recipe)}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--ui-muted-text)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ui-bg)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            title="Load recipe"
                          >
                            <ArrowSquareOut weight="regular" className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteDNARecipe(recipe.id)}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--ui-muted-text)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)', e.currentTarget.style.color = 'hsl(var(--destructive))')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = 'var(--ui-muted-text)')}
                            title="Delete"
                          >
                            <Trash weight="regular" className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {recipe.description && (
                        <p className="text-xs mb-2" style={{ color: 'var(--ui-muted-text)' }}>{recipe.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: 'var(--ui-bg)', color: 'var(--ui-muted-text)' }}
                          >
                            {tag.label}
                          </span>
                        ))}
                        {recipe.tags.length > 5 && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: 'var(--ui-bg)', color: 'var(--ui-muted-text)' }}
                          >
                            +{recipe.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dnaRecipes.length === 0 && (
                <div className="text-center py-8">
                  <Dna weight="regular" className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--ui-muted-text-faint)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--ui-muted-text)' }}>No DNA recipes yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ui-muted-text)' }}>
                    Select tags and save them as a reusable character recipe
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
