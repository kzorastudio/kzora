'use client'

import { cn } from '@/lib/utils'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'

interface PriceDisplayProps {
  priceSyp: number
  priceUsd: number
  discountPriceSyp?: number | null
  discountPriceUsd?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: {
    current: 'text-sm font-semibold',
    original: 'text-xs',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  md: {
    current: 'text-base font-semibold',
    original: 'text-sm',
    badge: 'text-xs px-2 py-0.5',
  },
  lg: {
    current: 'text-xl font-bold',
    original: 'text-sm',
    badge: 'text-xs px-2 py-0.5',
  },
}

export function PriceDisplay({
  priceSyp,
  priceUsd,
  discountPriceSyp,
  discountPriceUsd,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const { currency } = useCurrencyStore()

  const originalPrice = currency === 'SYP' ? priceSyp : priceUsd
  const discountPrice = currency === 'SYP' ? discountPriceSyp : discountPriceUsd
  const hasDiscount = discountPrice != null && discountPrice < originalPrice

  const currentPrice = hasDiscount ? discountPrice! : originalPrice
  const discountPct = hasDiscount
    ? getDiscountPercent(originalPrice, discountPrice!)
    : 0

  const classes = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} dir="ltr">
      {/* Current price */}
      <span
        className={cn(
          classes.current,
          'font-body tabular-nums',
          hasDiscount ? 'text-primary' : 'text-on-surface'
        )}
      >
        {formatPrice(currentPrice, currency)}
      </span>

      {/* Original price (strikethrough) */}
      {hasDiscount && (
        <span
          className={cn(
            classes.original,
            'font-body tabular-nums line-through text-secondary'
          )}
        >
          {formatPrice(originalPrice, currency)}
        </span>
      )}

      {/* Discount badge */}
      {hasDiscount && discountPct > 0 && (
        <span
          className={cn(
            classes.badge,
            'font-body font-semibold rounded-full',
            'bg-[#BA1A1A]/10 text-[#BA1A1A]'
          )}
        >
          -{discountPct}%
        </span>
      )}
    </div>
  )
}
