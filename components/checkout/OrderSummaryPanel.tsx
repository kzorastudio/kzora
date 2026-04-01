'use client'

import Image from 'next/image'
import { cn, formatPrice } from '@/lib/utils'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { CartItem, Currency } from '@/types'

interface Props {
  items: CartItem[]
  subtotalSyp: number
  subtotalUsd: number
  discountSyp?: number
  discountUsd?: number
  couponCode?: string
  currency: Currency
  isSubmitting?: boolean
  multiProductDiscountSyp?: number
  multiProductDiscountUsd?: number
  shippingFeeSyp?: number
  shippingFeeUsd?: number
}

export default function OrderSummaryPanel({
  items,
  subtotalSyp,
  subtotalUsd,
  discountSyp,
  discountUsd,
  couponCode,
  currency,
  isSubmitting = false,
  multiProductDiscountSyp = 0,
  multiProductDiscountUsd = 0,
  shippingFeeSyp = 0,
  shippingFeeUsd = 0,
}: Props) {
  const { updateQuantity, removeItem } = useCartStore()
  const subtotal = currency === 'SYP' ? subtotalSyp : subtotalUsd
  const discount = currency === 'SYP' ? (discountSyp ?? 0) : (discountUsd ?? 0)
  const multiDiscount = currency === 'SYP' ? (multiProductDiscountSyp ?? 0) : (multiProductDiscountUsd ?? 0)
  const shippingFee = currency === 'SYP' ? (shippingFeeSyp ?? 0) : (shippingFeeUsd ?? 0)
  const total = subtotal - discount - multiDiscount + shippingFee

  const hasDiscount = discount > 0

  return (
    <aside
      dir="rtl"
      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3]"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F0EBE3]">
        <h2 className="font-arabic text-base font-bold text-[#1A1A1A]">ملخص الطلب</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Items list */}
        <ul className="space-y-4">
          {items.map((item) => {
            const itemPrice =
              currency === 'SYP'
                ? (item.discount_price_syp ?? item.price_syp)
                : (item.discount_price_usd ?? item.price_usd)

            return (
              <li key={`${item.id}-${item.color ?? ''}-${item.size ?? ''}`} className="flex gap-3 items-center group">
                {/* Thumbnail — right side */}
                <div className="relative w-[50px] h-[55px] rounded-lg bg-[#F5F1EB] overflow-hidden shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="50px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#E8E3DB]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col py-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-arabic font-medium text-[#1A1A1A] line-clamp-1 leading-snug">
                      {item.name}
                    </p>
                    <button
                      onClick={() => removeItem(item.id, item.color, item.size)}
                      className="text-[#9E9890] hover:text-[#BA1A1A] transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    {item.color && (
                      <span className="text-[10px] font-arabic text-[#6B6560] flex items-center gap-1">
                        {item.color}
                        {item.color_hex && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: item.color_hex }}
                          />
                        )}
                      </span>
                    )}
                    {item.size && (
                      <span className="text-[10px] font-arabic text-[#6B6560]">
                        | {item.size} {item.mold_type === 'chinese' && <span className="text-[#E65C00] font-bold">(صيني)</span>}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5">
                    {/* Stepper */}
                    <div className="flex items-center bg-[#F5F1EB] rounded-md overflow-hidden scale-90 origin-right">
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#1A1A1A] hover:bg-[#E8E3DB] transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 size={10} className="text-[#BA1A1A]" /> : <Minus size={10} />}
                      </button>
                      <span className="w-6 text-center text-[11px] font-bold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#1A1A1A] hover:bg-[#E8E3DB] transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <span className="text-xs font-body text-[#785600] font-bold tabular-nums" dir="ltr">
                      {formatPrice(itemPrice * item.quantity, currency)}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Divider */}
        <div className="border-t border-[#F0EBE3]" />

        {/* Totals */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-arabic text-[#6B6560]">المجموع الفرعي</span>
            <span className="font-body tabular-nums text-[#1A1A1A]" dir="ltr">
              {formatPrice(subtotal, currency)}
            </span>
          </div>

          {hasDiscount && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-arabic text-[#6B6560]">
                خصم الكوبون
                {couponCode && (
                  <span className="font-body text-[#785600] mr-1 text-xs">({couponCode})</span>
                )}
              </span>
              <span className="font-body tabular-nums text-[#BA1A1A] font-semibold" dir="ltr">
                -{formatPrice(discount, currency)}
              </span>
            </div>
          )}

          {multiDiscount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-arabic text-[#6B6560]">خصم تعدد المنتجات</span>
              <span className="font-body tabular-nums text-[#BA1A1A] font-semibold" dir="ltr">
                -{formatPrice(multiDiscount, currency)}
              </span>
            </div>
          )}

          {(shippingFeeSyp > 0 || shippingFeeUsd > 0) && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-arabic text-[#6B6560]">
                أجرة التوصيل والشحن
              </span>
              <span className="font-body tabular-nums text-[#2E7D32] font-semibold" dir="ltr">
                +{formatPrice(shippingFee, currency)}
              </span>
            </div>
          )}

          <div className="border-t border-[#F0EBE3] pt-3 flex items-center justify-between">
            <span className="font-arabic font-bold text-[#1A1A1A] text-base">الإجمالي</span>
            <span
              className="font-body font-bold text-lg tabular-nums text-[#785600]"
              dir="ltr"
            >
              {formatPrice(total, currency)}
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <button
          type="submit"
          form="checkout-form"
          disabled={isSubmitting}
          className={cn(
            'w-full py-3.5 rounded-xl font-arabic font-bold text-sm text-white',
            'bg-gradient-to-l from-[#785600] to-[#986D00]',
            'hover:from-[#986D00] hover:to-[#B8860B]',
            'transition-all duration-200 shadow-md shadow-[#785600]/20',
            'focus-visible:outline-none active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2'
          )}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              جارٍ تأكيد الطلب...
            </>
          ) : (
            <>
              <span>✅</span>
              تأكيد الطلب
            </>
          )}
        </button>

        {/* Trust note */}
        <p className="text-center text-[10px] font-arabic text-[#9E9890] leading-relaxed">
          بضغطك على تأكيد الطلب، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بكزورا.
        </p>
      </div>
    </aside>
  )
}
