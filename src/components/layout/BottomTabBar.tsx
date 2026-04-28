import { motion } from 'framer-motion'
import { SquaresFour, Tag, ChatText, MagnifyingGlass } from '@phosphor-icons/react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

type MobileTab = 'templates' | 'build' | 'prompt'

interface BottomTabBarProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  tagCount: number
  onSearch: () => void
}

export function BottomTabBar({ activeTab, onTabChange, tagCount, onSearch }: BottomTabBarProps) {
  const { isMobile, isTabletSmall } = useBreakpoint()
  const show = isMobile || isTabletSmall

  if (!show) return null

  const tabs: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
    {
      id: 'templates',
      icon: <SquaresFour weight={activeTab === 'templates' ? 'fill' : 'regular'} className="w-5 h-5" />,
      label: 'Templates',
    },
    {
      id: 'build',
      icon: <Tag weight={activeTab === 'build' ? 'fill' : 'regular'} className="w-5 h-5" />,
      label: 'Build',
    },
    {
      id: 'prompt',
      icon: <ChatText weight={activeTab === 'prompt' ? 'fill' : 'regular'} className="w-5 h-5" />,
      label: 'Prompt',
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] safe-bottom"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[var(--ui-muted-text)] transition-colors relative"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--ui-text)] rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="text-[var(--ui-text)]">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {tab.id === 'prompt' && tagCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-16px)] w-4 h-4 rounded-full bg-[var(--ui-text)] text-[var(--ui-bg)] text-[9px] font-bold flex items-center justify-center">
                {tagCount > 9 ? '9+' : tagCount}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={onSearch}
          className="flex flex-col items-center justify-center gap-0.5 text-[var(--ui-muted-text)] hover:text-[var(--ui-text)] transition-colors px-4"
          aria-label="Search tags and commands"
        >
          <MagnifyingGlass weight="regular" className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
      </div>
    </nav>
  )
}
