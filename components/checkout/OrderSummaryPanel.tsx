'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn, formatPrice } from '@/lib/utils'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { CartItem, Currency } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  items: CartItem[]
  subtotalSyp: number
  subtotalUsd: number
  discountSyp?: number
  discountUsd?: number
  couponCode?: string
  currency: Currency
  isSubmitting?: boolean
  shippingFeeSyp?: number
  shippingFeeUsd?: number
  shippingFeeDetermined?: boolean
  deliveryType?: 'delivery' | 'shipping'
  loyaltyDiscountSyp?: number
  loyaltyDiscountUsd?: number
  multiItemDiscountSyp?: number
  multiItemDiscountUsd?: number
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
  shippingFeeSyp = 0,
  shippingFeeUsd = 0,
  shippingFeeDetermined = false,
  deliveryType = 'delivery',
  loyaltyDiscountSyp = 0,
  loyaltyDiscountUsd = 0,
  multiItemDiscountSyp = 0,
  multiItemDiscountUsd = 0,
}: Props) {
  const { updateQuantity, removeItem } = useCartStore()
  const subtotal = currency === 'SYP' ? subtotalSyp : subtotalUsd
  const discount = currency === 'SYP' ? (discountSyp ?? 0) : (discountUsd ?? 0)
  const loyaltyDiscount = currency === 'SYP' ? (loyaltyDiscountSyp ?? 0) : (loyaltyDiscountUsd ?? 0)
  const multiItemDiscount = currency === 'SYP' ? (multiItemDiscountSyp ?? 0) : (multiItemDiscountUsd ?? 0)
  const shippingFee = currency === 'SYP' ? (shippingFeeSyp ?? 0) : (shippingFeeUsd ?? 0)
  const total = subtotal - discount - loyaltyDiscount - multiItemDiscount + shippingFee

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
                <Link 
                  href={`/product/${item.slug}`}
                  className="relative w-[50px] h-[55px] rounded-lg bg-[#F5F1EB] overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
                >
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
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col py-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <Link 
                      href={`/product/${item.slug}`}
                      className="text-sm font-arabic font-medium text-[#1A1A1A] line-clamp-1 leading-snug hover:text-[#785600] transition-colors"
                    >
                      {item.name}
                    </Link>
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
                      <span className="text-[10px] font-arabic text-[#6B6560] flex items-center gap-1">
                        | مقاس {item.size} • <span className={item.mold_type === 'chinese' ? "text-[#E65C00] font-bold" : ""}>
                          {item.mold_type === 'chinese' ? 'قالب صيني' : 'قالب نظامي'}
                        </span>
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
                        onClick={() => {
                          const max = item.max_stock ?? Infinity
                          if (item.quantity >= max) {
                            toast.error(`عذراً، الكمية المتوفرة ${max} فقط`)
                            return
                          }
                          updateQuantity(item.id, item.color, item.size, item.quantity + 1)
                        }}
                        disabled={item.quantity >= (item.max_stock ?? Infinity)}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center transition-colors",
                          item.quantity >= (item.max_stock ?? Infinity)
                            ? "text-[#D3C4AF] cursor-not-allowed"
                            : "text-[#1A1A1A] hover:bg-[#E8E3DB]"
                        )}
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <span className="text-xs font-body text-[#785600] font-bold tabular-nums" dir="rtl">
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
            <span className="font-body tabular-nums text-[#1A1A1A]" dir="rtl">
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
              <span className="font-body tabular-nums text-[#BA1A1A] font-semibold" dir="rtl">
                {formatPrice(discount, currency)}
              </span>
            </div>
          )}

          {(currency === 'SYP' ? (loyaltyDiscountSyp || 0) : (loyaltyDiscountUsd || 0)) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-arabic text-[#6B6560]">خصم الولاء 🎁</span>
              <span className="font-body tabular-nums text-[#BA1A1A] font-semibold" dir="rtl">
                {formatPrice(currency === 'SYP' ? (loyaltyDiscountSyp || 0) : (loyaltyDiscountUsd || 0), currency)}
              </span>
            </div>
          )}

          {(currency === 'SYP' ? (multiItemDiscountSyp || 0) : (multiItemDiscountUsd || 0)) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-arabic text-[#6B6560]">حسم تعدد القطع 🔥</span>
              <span className="font-body tabular-nums text-[#BA1A1A] font-semibold" dir="rtl">
                {formatPrice(currency === 'SYP' ? (multiItemDiscountSyp || 0) : (multiItemDiscountUsd || 0), currency)}
              </span>
            </div>
          )}

          {shippingFeeDetermined ? (
            <div className="flex flex-col gap-1 py-1.5 px-3 bg-[#E8F5E9] rounded-lg border border-[#2E7D32]/20 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-arabic text-[#6B6560]">أجرة الشحن</span>
                <span className="font-arabic text-[#1B5E20] font-bold text-[11px] flex items-center gap-1">
                  <span>يتم تحديد السعر عبر الواتساب</span>
                  <span className="text-base">💬</span>
                </span>
              </div>
              <p className="text-[10px] font-arabic text-[#1B5E20]/80 leading-tight">
                سيقوم فريقنا بالتواصل معك لتأكيد تكلفة التوصيل النهائية بعد مراجعة الطلب.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="font-arabic text-[#6B6560]">
                {deliveryType === 'delivery' ? 'أجرة التوصيل' : 'أجرة الشحن'}
              </span>
              <span className="font-body tabular-nums font-semibold text-[#2E7D32]" dir="rtl">
                {formatPrice(shippingFee, currency)}
              </span>
            </div>
          )}

          <div className="border-t border-[#F0EBE3] pt-3 flex items-center justify-between">
            <span className="font-arabic font-bold text-[#1A1A1A] text-base">الإجمالي</span>
            <span
              className="font-body font-bold text-lg tabular-nums text-[#785600]"
              dir="rtl"
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
