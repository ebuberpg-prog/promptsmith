import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  mobile: 0,
  tabletSmall: 600,
  tablet: 768,
  desktopSmall: 900,
  desktop: 1279,
} as const

type BreakpointName = keyof typeof BREAKPOINTS

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<BreakpointName>('desktop')

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth
      if (width >= BREAKPOINTS.desktop) setBreakpoint('desktop')
      else if (width >= BREAKPOINTS.desktopSmall) setBreakpoint('desktopSmall')
      else if (width >= BREAKPOINTS.tablet) setBreakpoint('tablet')
      else if (width >= BREAKPOINTS.tabletSmall) setBreakpoint('tabletSmall')
      else setBreakpoint('mobile')
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTabletSmall: breakpoint === 'tabletSmall',
    isTablet: breakpoint === 'tablet',
    isDesktopSmall: breakpoint === 'desktopSmall',
    isDesktop: breakpoint === 'desktop',
    isLessThanTablet: breakpoint === 'mobile' || breakpoint === 'tabletSmall',
    isLessThanDesktop: breakpoint !== 'desktop' && breakpoint !== 'desktopSmall',
  }
}
