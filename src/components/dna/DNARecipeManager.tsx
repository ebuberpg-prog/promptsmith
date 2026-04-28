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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <Dna weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">DNA</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Dna weight="regular" className="w-5 h-5" style={{ color: 'hsl(190, 95%, 50%)' }} />
                <h2 className="text-lg font-semibold text-foreground">Character DNA Recipes</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-surface-elevated border border-border rounded-lg p-3">
                <h3 className="text-sm font-medium text-foreground mb-3">Create New Recipe</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Recipe name (e.g., 'Elven Warrior')"
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm"
                  />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm resize-none h-16"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{selectedTags.length} tags selected</span>
                    <span>Model: {selectedModel}</span>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || selectedTags.length === 0}
                    className="w-full py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus weight="regular" className="w-4 h-4" />
                    Save as DNA Recipe
                  </button>
                </div>
              </div>

              {dnaRecipes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Saved Recipes ({dnaRecipes.length})</h3>
                  {dnaRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="bg-surface-elevated border border-border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{recipe.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(recipe)}
                            className="p-1 rounded hover:bg-background text-muted-foreground"
                            title="Copy tags"
                          >
                            {copiedId === recipe.id ? <Check weight="bold" className="w-3 h-3" /> : <Copy weight="regular" className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => loadDNARecipe(recipe)}
                            className="p-1 rounded hover:bg-background text-muted-foreground"
                            title="Load recipe"
                          >
                            <ArrowSquareOut weight="regular" className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteDNARecipe(recipe.id)}
                            className="p-1 rounded hover:bg-error/10 text-muted-foreground hover:text-error"
                            title="Delete"
                          >
                            <Trash weight="regular" className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {recipe.description && (
                        <p className="text-xs text-muted-foreground mb-2">{recipe.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 bg-background rounded text-[10px] text-muted-foreground"
                          >
                            {tag.label}
                          </span>
                        ))}
                        {recipe.tags.length > 5 && (
                          <span className="px-1.5 py-0.5 bg-background rounded text-[10px] text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">No DNA recipes yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
