import { useState } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { Stack, X, Lightning } from '@phosphor-icons/react'

const STYLE_PRESETS = [
  'photography', 'illustration', 'anime', '3d', 'oil_painting',
  'watercolor', 'pixel_art', 'concept_art', 'cinematic', 'portrait',
  'sci-fi', 'fantasy', 'horror', 'romance', 'minimalist', 'maximalist',
]

export function StyleTransferMatrix() {
  const [isOpen, setIsOpen] = useState(false)
  const [sourceStyles, setSourceStyles] = useState<string[]>([])
  const [targetStyles, setTargetStyles] = useState<string[]>([])
  
  const styleMatrix = usePromptSmithStore((s) => s.styleMatrix)
  const analyzeStyleTransfer = usePromptSmithStore((s) => s.analyzeStyleTransfer)

  const toggleStyle = (style: string, list: 'source' | 'target') => {
    if (list === 'source') {
      setSourceStyles(prev =>
        prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
      )
    } else {
      setTargetStyles(prev =>
        prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
      )
    }
  }

  const handleAnalyze = () => {
    if (sourceStyles.length > 0 && targetStyles.length > 0) {
      analyzeStyleTransfer(sourceStyles, targetStyles)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <Stack weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Style Matrix</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Stack weight="regular" className="w-5 h-5" style={{ color: 'hsl(250, 95%, 66%)' }} />
                <h2 className="text-lg font-semibold text-foreground">Style Transfer Matrix</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
              >
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-elevated border border-border rounded-lg p-3">
                  <h3 className="text-sm font-medium text-foreground mb-2">Source Styles</h3>
                  <div className="flex flex-wrap gap-1">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style, 'source')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          sourceStyles.includes(style)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {style.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-elevated border border-border rounded-lg p-3">
                  <h3 className="text-sm font-medium text-foreground mb-2">Target Styles</h3>
                  <div className="flex flex-wrap gap-1">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style, 'target')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          targetStyles.includes(style)
                            ? 'bg-pink-500 text-white'
                            : 'bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {style.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={sourceStyles.length === 0 || targetStyles.length === 0}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lightning weight="regular" className="w-4 h-4" />
                Analyze Compatibility
              </button>

              {styleMatrix.length > 0 && (
                <div className="space-y-2">
                  {styleMatrix.slice().reverse().map((matrix) => (
                    <div key={matrix.id} className="bg-surface-elevated border border-border rounded-lg p-3">
                      <h3 className="text-sm font-medium text-foreground mb-2">Compatibility Matrix</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="text-left p-1 text-muted-foreground"></th>
                              {matrix.targetStyles.map((s) => (
                                <th key={s} className="text-left p-1 text-muted-foreground">
                                  {s.replace('_', ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {matrix.sourceStyles.map((source, i) => (
                              <tr key={source}>
                                <td className="text-left p-1 text-muted-foreground">
                                  {source.replace('_', ' ')}
                                </td>
                                {matrix.compatibilityScores[i]?.map((score, j) => (
                                  <td key={j} className="p-1">
                                    <div
                                      className="px-2 py-1 rounded text-center"
                                      style={{
                                        backgroundColor: `rgba(139, 92, 246, ${score})`,
                                        color: score > 0.5 ? 'white' : 'inherit',
                                      }}
                                    >
                                      {Math.round(score * 100)}%
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
