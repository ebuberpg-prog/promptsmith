import { usePromptSmithStore } from '@/store/prompt-store'
import { motion } from 'framer-motion'
import { 
  Dna, 
  User, 
  Sun, 
  Camera, 
  Palette, 
  ShirtFolded, 
  MapPin,
  Highlighter,
  TrendUp
} from '@phosphor-icons/react'
import { useMemo } from 'react'

const CATEGORY_MAP: Record<string, { label: string, icon: React.ElementType }> = {
  subject: { label: 'Subject', icon: User },
  body: { label: 'Physical', icon: User },
  clothing: { label: 'Attire', icon: ShirtFolded },
  environment: { label: 'Setting', icon: MapPin },
  lighting: { label: 'Lighting', icon: Sun },
  camera: { label: 'Technical', icon: Camera },
  style: { label: 'Aesthetic', icon: Palette },
  quality: { label: 'Refinement', icon: Highlighter },
}

export function PromptDNA() {
  const selectedTags = usePromptSmithStore((s) => s.selectedTags)

  const dnaStats = useMemo(() => {
    const stats: Record<string, number> = {}
    selectedTags.forEach(tag => {
      let found = false
      for (const cat in CATEGORY_MAP) {
        if (tag.id.startsWith(cat)) {
          stats[cat] = (stats[cat] || 0) + (tag.customWeight || 1)
          found = true
          break
        }
      }
      if (!found) stats['other'] = (stats['other'] || 0) + (tag.customWeight || 1)
    })
    return stats
  }, [selectedTags])

  const totalWeight = Object.values(dnaStats).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="border border-[#333] rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full border border-[#333] flex items-center justify-center">
          <Dna weight="regular" className="w-4 h-4 text-[#c2c2c2]" />
        </div>
        <div>
          <h3 className="font-display text-lg font-normal text-[#f5f5f5] tracking-tight">Semantic DNA</h3>
          <p className="text-[10px] text-[#c2c2c2]/50 uppercase tracking-wider">Composition Analysis</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(CATEGORY_MAP).map(([key, config]) => {
          const weight = dnaStats[key] || 0
          const percentage = (weight / totalWeight) * 100
          if (percentage === 0 && selectedTags.length > 0) return null

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <config.icon weight="regular" className="w-3.5 h-3.5 text-[#c2c2c2]/50" />
                  <span className="text-[#c2c2c2]">{config.label}</span>
                </div>
                <span className="text-[#c2c2c2]/50 font-mono text-[10px]">{percentage.toFixed(0)}%</span>
              </div>
              <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#f5f5f5]"
                />
              </div>
            </div>
          )
        })}

        {selectedTags.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <TrendUp weight="regular" className="w-10 h-10 text-[#c2c2c2]/20 mb-4" />
            <p className="text-sm text-[#c2c2c2]/50">Select tags to generate composition analysis.</p>
          </div>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#333] flex items-center justify-between text-[10px] text-[#c2c2c2]/50 uppercase tracking-wider">
           <span>Complexity: {selectedTags.length > 10 ? 'High' : 'Optimal'}</span>
           <span className="text-[#c2c2c2]">{totalWeight.toFixed(1)} units</span>
        </div>
      )}
    </div>
  )
}
