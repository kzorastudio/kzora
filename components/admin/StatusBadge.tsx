import { ORDER_STATUS_OPTIONS } from '@/lib/constants'
import type { OrderStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const option = ORDER_STATUS_OPTIONS.find((o) => o.id === status)

  if (!option) {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-arabic font-medium bg-surface-container text-secondary',
          className
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-arabic font-medium',
        option.color,
        className
      )}
    >
      {option.label}
    </span>
  )
}
