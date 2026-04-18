'use client'

import { cn } from '@/lib/utils'
import { formatPrice, formatCurrency } from '@/lib/utils'
import type { Currency } from '@/types'

interface CartSummaryProps {
  subtotalSyp: number
  subtotalUsd: number
  discountSyp?: number
  discountUsd?: number
  multiItemDiscountSyp?: number
  multiItemDiscountUsd?: number
  couponCode?: string
  currency: Currency
  className?: string
}

export function CartSummary({
  subtotalSyp,
  subtotalUsd,
  discountSyp,
  discountUsd,
  multiItemDiscountSyp,
  multiItemDiscountUsd,
  couponCode,
  currency,
  className,
}: CartSummaryProps) {
  const subtotal = currency === 'SYP' ? subtotalSyp : subtotalUsd
  const discount = currency === 'SYP' ? (discountSyp ?? 0) : (discountUsd ?? 0)
  const multiDiscount = currency === 'SYP' ? (multiItemDiscountSyp ?? 0) : (multiItemDiscountUsd ?? 0)
  const total = Math.max(0, subtotal - discount - multiDiscount)

  const hasDiscount = discount > 0
  const hasMultiDiscount = multiDiscount > 0

  return (
    <div dir="rtl" className={cn('space-y-0', className)}>
      {/* Subtotal row */}
      <div className="flex items-center justify-between py-2.5">
        <span className="font-brand text-sm text-secondary">المجموع الفرعي</span>
        <span className="font-body text-sm tabular-nums text-on-surface" dir="rtl">
          {formatCurrency(subtotal, currency)}
        </span>
      </div>

      {/* Coupon Discount row */}
      {hasDiscount && (
        <div className="flex items-center justify-between py-2.5">
          <span className="font-brand text-sm text-secondary">
            خصم الكوبون
            {couponCode && (
              <span className="mr-1 font-body text-xs bg-surface-container px-1.5 py-0.5 rounded-full text-primary">
                {couponCode}
              </span>
            )}
          </span>
          <span className="font-body text-sm tabular-nums text-[#BA1A1A]" dir="rtl">
            {formatCurrency(discount, currency)}
          </span>
        </div>
      )}

      {/* Multi-item Discount row */}
      {hasMultiDiscount && (
        <div className="flex items-center justify-between py-2.5">
          <span className="font-brand text-sm text-secondary">حسم تعدد القطع 🔥</span>
          <span className="font-body text-sm tabular-nums text-green-700" dir="rtl">
            {formatCurrency(multiDiscount, currency)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-surface-container-high my-1" />

      {/* Total row */}
      <div className="flex items-center justify-between py-2.5">
        <span className="font-brand text-base font-semibold text-on-surface">الإجمالي</span>
        <span className="font-body text-base font-bold tabular-nums text-primary" dir="rtl">
          {formatCurrency(total, currency)}
        </span>
      </div>
    </div>
  )
}
