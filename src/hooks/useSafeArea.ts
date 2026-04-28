import { useState, useEffect } from 'react'

export function useSafeArea() {
  const [safeAreas, setSafeAreas] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  useEffect(() => {
    const compute = () => {
      const style = getComputedStyle(document.documentElement)
      const parse = (prop: string) => {
        const val = style.getPropertyValue(prop)
        if (!val) return 0
        const num = parseFloat(val)
        return isNaN(num) ? 0 : num
      }
      setSafeAreas({
        top: parse('--sat') || parse('env(safe-area-inset-top)'),
        bottom: parse('--sab') || parse('env(safe-area-inset-bottom)'),
        left: parse('--sal') || parse('env(safe-area-inset-left)'),
        right: parse('--sar') || parse('env(safe-area-inset-right)'),
      })
    }

    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return safeAreas
}
