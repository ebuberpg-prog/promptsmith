import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  pill?: boolean
}

export function Skeleton({ className = '', width, height, pill }: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`skeleton ${pill ? 'skeleton-pill' : ''} ${className}`}
      style={style}
    />
  )
}

export function TagSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          height="42px"
          pill
          className="w-full"
        />
      ))}
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <Skeleton width="120px" height="20px" />
        <Skeleton width="40px" height="16px" pill />
      </div>
      <TagSkeleton count={8} />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="border border-[var(--ui-border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton width="48px" height="48px" pill />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height="20px" />
          <Skeleton width="40%" height="14px" pill />
        </div>
      </div>
      <Skeleton width="100%" height="14px" />
      <Skeleton width="85%" height="14px" />
      <div className="flex gap-2 pt-2">
        <Skeleton width="60px" height="24px" pill />
        <Skeleton width="80px" height="24px" pill />
        <Skeleton width="50px" height="24px" pill />
      </div>
    </div>
  )
}
