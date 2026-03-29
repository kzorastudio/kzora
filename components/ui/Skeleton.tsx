import { cn } from '@/lib/utils'

type SkeletonVariant = 'card' | 'text' | 'circle'

interface SkeletonProps {
  variant?: SkeletonVariant
  className?: string
  /** For text variant: number of lines */
  lines?: number
}

/** Base shimmer block */
function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md overflow-hidden relative',
        'bg-surface-container',
        className
      )}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}

function Skeleton({ variant = 'text', className, lines = 3 }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <ShimmerBlock
        className={cn('rounded-full w-10 h-10', className)}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {/* Image area */}
        <ShimmerBlock className="w-full aspect-[3/4] rounded-2xl" />
        {/* Title */}
        <ShimmerBlock className="h-4 w-3/4 rounded-full" />
        {/* Sub line */}
        <ShimmerBlock className="h-3.5 w-1/2 rounded-full" />
        {/* Price */}
        <ShimmerBlock className="h-4 w-1/3 rounded-full" />
      </div>
    )
  }

  // text variant — stacked lines
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBlock
          key={i}
          className={cn(
            'h-3.5 rounded-full',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

export { Skeleton }
export type { SkeletonProps, SkeletonVariant }
