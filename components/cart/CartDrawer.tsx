'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useCurrencyStore } from '@/store/currencyStore'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { CouponInput } from './CouponInput'
import { useState } from 'react'
import type { HomepageSettings } from '@/types'

interface CartDrawerProps {
  className?: string
}

export function CartDrawer({ className }: CartDrawerProps) {
  const router = useRouter()
  const { isOpen, closeCart, items, itemCount, subtotalSyp, subtotalUsd } = useCartStore()
  const { currency } = useCurrencyStore()

  const [discountSyp, setDiscountSyp] = useState(0)
  const [discountUsd, setDiscountUsd] = useState(0)
  const [couponCode, setCouponCode] = useState<string | undefined>()
  const [settings, setSettings] = useState<HomepageSettings | null>(null)

  useEffect(() => {
    fetch('/api/homepage/settings')
      .then(r => r.json())
      .then(d => setSettings(d.settings))
      .catch(() => {})
  }, [])

  const count = itemCount()
  const isEmpty = items.length === 0

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    if (isOpen) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeCart])

  const handleCouponApply = useCallback(
    (code: string, dSyp: number, dUsd: number) => {
      setCouponCode(code)
      setDiscountSyp(dSyp)
      setDiscountUsd(dUsd)
    },
    []
  )

  const handleCouponRemove = useCallback(() => {
    setCouponCode(undefined)
    setDiscountSyp(0)
    setDiscountUsd(0)
  }, [])

  const handleCheckout = () => {
    closeCart()
    router.push('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 md:hidden"
            onClick={closeCart}
            aria-hidden
          />

          {/* Drawer panel — slides in from RIGHT (RTL) */}
          <motion.aside
            key="cart-panel"
            dir="rtl"
            role="dialog"
            aria-modal
            aria-label="سلة التسوق"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 z-50',
              'w-full max-w-[400px]',
              'bg-surface flex flex-col',
              'shadow-ambient-xl md:hidden',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-brand text-base font-semibold text-on-surface">
                  سلة التسوق
                </h2>
                {count > 0 && (
                  <span className="font-body text-xs font-bold tabular-nums bg-primary text-on-primary rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="إغلاق السلة"
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'text-secondary hover:text-on-surface hover:bg-surface-container',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
              >
                <X size={18} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-surface-container-high" />

            {/* Content */}
            {isEmpty ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
                  <ShoppingBag size={32} className="text-secondary opacity-50" />
                </div>
                <div className="space-y-1">
                  <p className="font-brand font-medium text-on-surface text-base">السلة فارغة</p>
                  <p className="font-brand text-secondary text-sm">
                    لم تضف أي منتجات بعد
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className={cn(
                    'mt-2 h-10 px-6 rounded-xl text-sm font-brand font-semibold',
                    'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
                    'hover:from-[#986D00] hover:to-[#B8860B]',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
                  )}
                >
                  تصفح المنتجات
                </button>
              </div>
            ) : (
              <>
                {/* Items list (scrollable) */}
                <div className="overflow-y-auto px-5 divide-y divide-surface-container-high" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                  {items.map((item) => (
                    <CartItem
                      key={`${item.id}__${item.color ?? ''}__${item.size ?? ''}`}
                      item={item}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 pb-6 pt-3 space-y-4 bg-surface-container-lowest">
                  {/* Coupon input */}
                  <CouponInput
                    onApply={handleCouponApply}
                    onRemove={handleCouponRemove}
                    currency={currency}
                    appliedCode={couponCode}
                  />

                  {/* Divider */}
                  <div className="h-px bg-surface-container-high" />

                  {/* Summary */}
                  {(() => {
                    let multiDiscSyp = 0
                    let multiDiscUsd = 0
                    const totalQty = itemCount()
                    const subSyp   = subtotalSyp()
                    const subUsd   = subtotalUsd()

                    if (settings?.discount_multi_items_enabled) {
                      if (totalQty >= 3) multiDiscSyp = settings.discount_3_items_plus_syp
                      else if (totalQty >= 2) multiDiscSyp = settings.discount_2_items_syp

                      if (multiDiscSyp > 0) {
                        const ratio = subSyp > 0 ? subUsd / subSyp : 0
                        multiDiscUsd = parseFloat((multiDiscSyp * ratio).toFixed(2))
                      }
                    }

                    return (
                      <CartSummary
                        subtotalSyp={subSyp}
                        subtotalUsd={subUsd}
                        discountSyp={discountSyp}
                        discountUsd={discountUsd}
                        multiProductDiscountSyp={multiDiscSyp}
                        multiProductDiscountUsd={multiDiscUsd}
                        couponCode={couponCode}
                        currency={currency}
                      />
                    )
                  })()}

                  {/* Checkout CTA */}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className={cn(
                      'w-full h-12 rounded-xl font-brand font-semibold text-base',
                      'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
                      'hover:from-[#986D00] hover:to-[#B8860B]',
                      'shadow-sm hover:shadow-md active:scale-[0.99]',
                      'transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    )}
                  >
                    إتمام الطلب
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
