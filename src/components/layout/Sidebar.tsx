import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePromptSmithStore } from '@/store/prompt-store'
import {
  CaretRight,
  CaretDown,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import type { TaxonomyCategory } from '@/types'

function CategoryItem({ category, depth = 0 }: { category: TaxonomyCategory; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const activeCategory = usePromptSmithStore((s) => s.activeCategory)
  const setActiveCategory = usePromptSmithStore((s) => s.setActiveCategory)

  const hasChildren = !!category.children?.length
  const isActive = activeCategory === category.id

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(e => !e)
          setActiveCategory(isActive ? null : category.id)
        }}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        className={`w-full flex items-center gap-2 pr-3 py-1.5 text-sm transition-colors duration-150 group ${
          isActive ? 'text-[#f5f5f5]' : 'text-[#c2c2c2] hover:text-[#f5f5f5]'
        }`}
      >
        <span className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
          {hasChildren
            ? expanded
              ? <CaretDown weight="regular" className="w-3 h-3" />
              : <CaretRight weight="regular" className="w-3 h-3" />
            : <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#f5f5f5]' : 'bg-[#555]'}`} />
          }
        </span>
        <span className="truncate font-medium text-xs">{category.name}</span>
        {category.tags && (
          <span className="ml-auto text-[10px] font-mono text-[#333] group-hover:text-[#555] transition-colors flex-shrink-0">
            {category.tags.length}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {category.children!.map(child => (
              <CategoryItem key={child.id} category={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ taxonomy }: { taxonomy: TaxonomyCategory[] }) {
  const searchQuery = usePromptSmithStore((s) => s.searchQuery)
  const setSearchQuery = usePromptSmithStore((s) => s.setSearchQuery)

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-[#1a1a1a] flex flex-col bg-black">

      {/* Search */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <p className="text-[10px] font-medium text-[#333] uppercase tracking-widest mb-3">Categories</p>
        <div className="relative">
          <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-transparent border border-[#1a1a1a] rounded-full text-xs text-[#f5f5f5] placeholder:text-[#333] outline-none focus:border-[#333] transition-colors duration-150"
          />
        </div>
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {taxonomy.map(category => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#333]" />
          <span className="text-[10px] font-mono text-[#333]">MUSE v0.9.4</span>
        </div>
      </div>
    </aside>
  )
}
