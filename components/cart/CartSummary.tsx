'use client'

import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import type { Currency } from '@/types'

interface CartSummaryProps {
  subtotalSyp: number
  subtotalUsd: number
  discountSyp?: number
  discountUsd?: number
  couponCode?: string
  currency: Currency
  className?: string
}

export function CartSummary({
  subtotalSyp,
  subtotalUsd,
  discountSyp,
  discountUsd,
  couponCode,
  currency,
  className,
}: CartSummaryProps) {
  const subtotal = currency === 'SYP' ? subtotalSyp : subtotalUsd
  const discount = currency === 'SYP' ? (discountSyp ?? 0) : (discountUsd ?? 0)
  const total = Math.max(0, subtotal - discount)

  const hasDiscount = discount > 0

  return (
    <div dir="rtl" className={cn('space-y-0', className)}>
      {/* Subtotal row */}
      <div className="flex items-center justify-between py-2.5">
        <span className="font-brand text-sm text-secondary">المجموع الفرعي</span>
        <span className="font-body text-sm tabular-nums text-on-surface" dir="ltr">
          {formatPrice(subtotal, currency)}
        </span>
      </div>

      {/* Discount row */}
      {hasDiscount && (
        <div className="flex items-center justify-between py-2.5">
          <span className="font-brand text-sm text-secondary">
            خصم
            {couponCode && (
              <span className="mr-1 font-body text-xs bg-surface-container px-1.5 py-0.5 rounded-full text-primary">
                {couponCode}
              </span>
            )}
          </span>
          <span className="font-body text-sm tabular-nums text-[#BA1A1A]" dir="ltr">
            -{formatPrice(discount, currency)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-surface-container-high my-1" />

      {/* Total row */}
      <div className="flex items-center justify-between py-2.5">
        <span className="font-brand text-base font-semibold text-on-surface">الإجمالي</span>
        <span className="font-body text-base font-bold tabular-nums text-primary" dir="ltr">
          {formatPrice(total, currency)}
        </span>
      </div>
    </div>
  )
}
