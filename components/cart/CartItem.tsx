'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useCurrencyStore } from '@/store/currencyStore'
import type { CartItem as CartItemType } from '@/types'
import toast from 'react-hot-toast'

interface CartItemProps {
  item: CartItemType
  className?: string
}

export function CartItem({ item, className }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const { currency } = useCurrencyStore()

  const effectivePriceSyp = item.discount_price_syp ?? item.price_syp
  const effectivePriceUsd = item.discount_price_usd ?? item.price_usd
  const unitPrice = currency === 'SYP' ? effectivePriceSyp : effectivePriceUsd
  const lineTotal = unitPrice * item.quantity

  const maxStock = item.max_stock ?? Infinity
  const atMax = item.quantity >= maxStock

  const handleDecrement = () => {
    updateQuantity(item.id, item.color, item.size, item.quantity - 1)
  }
  const handleIncrement = () => {
    if (atMax) {
      toast.error(`عذراً، الكمية المتوفرة ${maxStock} فقط`)
      return
    }
    updateQuantity(item.id, item.color, item.size, item.quantity + 1)
  }
  const handleRemove = () => {
    removeItem(item.id, item.color, item.size)
  }

  return (
    <div
      dir="rtl"
      className={cn(
        'flex gap-3 py-4 relative',
        className
      )}
    >
      {/* Product image */}
      <div className="relative shrink-0 w-[60px] h-[70px] rounded-lg overflow-hidden bg-surface-container-low">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="60px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Name */}
        <p className="font-brand text-sm font-medium text-on-surface leading-snug line-clamp-2">
          {item.name}
        </p>

        {/* Variant details */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.color && (
            <span className="inline-flex items-center gap-1 text-xs font-brand text-secondary">
              {item.color_hex && (
                <span
                  className="w-3 h-3 rounded-full ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: item.color_hex }}
                />
              )}
              {item.color}
            </span>
          )}
          {item.size && (
            <span className="text-xs font-arabic text-secondary tabular-nums flex items-center gap-1.5">
              <span>مقاس {item.size}</span>
              <span className="w-1 h-1 rounded-full bg-secondary/30" />
              <span className={cn(item.mold_type === 'chinese' ? "text-[#E65C00] font-bold" : "text-secondary/70")}>
                {item.mold_type === 'chinese' ? 'قالب صيني' : 'قالب نظامي'}
              </span>
            </span>
          )}
        </div>

        {/* Quantity stepper + price row */}
        <div className="flex items-center justify-between mt-3">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
            <button
              type="button"
              aria-label="تقليل الكمية"
              onClick={handleDecrement}
              className={cn(
                'w-9 h-9 flex items-center justify-center',
                'text-secondary hover:text-on-surface hover:bg-surface-container-high',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary'
              )}
            >
              {item.quantity === 1 ? (
                <Trash2 size={15} className="text-[#BA1A1A]" />
              ) : (
                <Minus size={15} />
              )}
            </button>
            <span className="w-10 text-center text-sm font-body font-bold tabular-nums text-on-surface select-none">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="زيادة الكمية"
              onClick={handleIncrement}
              disabled={atMax}
              className={cn(
                'w-9 h-9 flex items-center justify-center',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary',
                atMax
                  ? 'text-secondary/30 cursor-not-allowed'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
              )}
            >
              <Plus size={15} />
            </button>
          </div>
 
          {/* Low stock warning */}
          {maxStock <= 3 && maxStock !== Infinity && (
            <span className="text-[10px] font-arabic text-[#BA1A1A] font-bold">
              متبقي {maxStock} فقط
            </span>
          )}

          {/* Line total */}
          <div className="text-left">
            <span className="block text-[10px] font-arabic text-secondary mb-0.5">الإجمالي</span>
            <span className="font-body font-bold text-base text-[#785600] tabular-nums" dir="ltr">
              {formatPrice(lineTotal, currency)}
            </span>
          </div>
        </div>
      </div>
 
      {/* Remove button — top left in RTL */}
      <button
        type="button"
        aria-label="حذف المنتج"
        onClick={handleRemove}
        className={cn(
          'absolute -top-1 -left-1',
          'w-8 h-8 flex items-center justify-center rounded-full',
          'bg-white/80 backdrop-blur-sm border border-outline-variant/20 shadow-sm',
          'text-secondary hover:text-[#BA1A1A] hover:border-[#BA1A1A]/30 hover:bg-[#BA1A1A]/5',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BA1A1A]'
        )}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
