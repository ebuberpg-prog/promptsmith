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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-elevated border hover:text-[var(--ui-text)] transition-colors"
        style={{ color: 'var(--ui-muted-text)', borderColor: 'var(--ui-border)' }}
      >
        <Stack weight="regular" className="w-4 h-4" />
        <span className="hidden sm:inline">Style Matrix</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--ui-overlay)' }}>
          <div className="border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--ui-surface)', borderColor: 'var(--ui-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ui-border)' }}>
              <div className="flex items-center gap-2">
                <Stack weight="regular" className="w-5 h-5" style={{ color: 'var(--ui-muted-text)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>Style Transfer Matrix</h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ui-text)' }}>Source Styles</h3>
                  <div className="flex flex-wrap gap-1">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style, 'source')}
                        className="px-2 py-1 text-xs rounded transition-colors"
                        style={{
                          backgroundColor: sourceStyles.includes(style) ? 'var(--ui-text)' : 'var(--ui-bg)',
                          color: sourceStyles.includes(style) ? 'var(--ui-bg)' : 'var(--ui-muted-text)',
                        }}
                      >
                        {style.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ui-text)' }}>Target Styles</h3>
                  <div className="flex flex-wrap gap-1">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style, 'target')}
                        className="px-2 py-1 text-xs rounded transition-colors"
                        style={{
                          backgroundColor: targetStyles.includes(style) ? 'var(--ui-text)' : 'var(--ui-bg)',
                          color: targetStyles.includes(style) ? 'var(--ui-bg)' : 'var(--ui-muted-text)',
                        }}
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
                className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                style={{ backgroundColor: 'var(--ui-text)', color: 'var(--ui-bg)' }}
              >
                <Lightning weight="regular" className="w-4 h-4" />
                Analyze Compatibility
              </button>

              {styleMatrix.length > 0 && (
                <div className="space-y-2">
                  {styleMatrix.slice().reverse().map((matrix) => (
                    <div key={matrix.id} className="border rounded-lg p-3" style={{ backgroundColor: 'var(--ui-surface-elevated)', borderColor: 'var(--ui-border)' }}>
                      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ui-text)' }}>Compatibility Matrix</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="text-left p-1" style={{ color: 'var(--ui-muted-text)' }}></th>
                              {matrix.targetStyles.map((s) => (
                                <th key={s} className="text-left p-1" style={{ color: 'var(--ui-muted-text)' }}>
                                  {s.replace('_', ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {matrix.sourceStyles.map((source, i) => (
                              <tr key={source}>
                                <td className="text-left p-1" style={{ color: 'var(--ui-muted-text)' }}>
                                  {source.replace('_', ' ')}
                                </td>
                                {matrix.compatibilityScores[i]?.map((score, j) => (
                                  <td key={j} className="p-1">
                                    <div
                                      className="px-2 py-1 rounded text-center"
                                      style={{
                                        backgroundColor: `color-mix(in oklab, var(--ui-text) ${Math.round(score * 100)}%, transparent)`,
                                        color: score > 0.5 ? 'var(--ui-bg)' : 'var(--ui-text)',
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
