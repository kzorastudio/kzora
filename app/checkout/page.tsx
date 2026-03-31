'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CouponInput } from '@/components/cart/CouponInput'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummaryPanel from '@/components/checkout/OrderSummaryPanel'
import { useCartStore } from '@/store/cartStore'
import { useCurrencyStore } from '@/store/currencyStore'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { SHIPPING_LABELS } from '@/lib/utils'
import type { CheckoutFormData } from '@/lib/validators'
import type { CreateOrderPayload, HomepageSettings } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, subtotalSyp, subtotalUsd, isOpen } = useCartStore()
  const { currency } = useCurrencyStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted,      setMounted]      = useState(false)

  // Coupon state
  const [couponCode,   setCouponCode]   = useState<string | undefined>()
  const [discountSyp,  setDiscountSyp]  = useState(0)
  const [discountUsd,  setDiscountUsd]  = useState(0)
  const [settings,     setSettings]     = useState<HomepageSettings | null>(null)

  useEffect(() => {
    fetch('/api/homepage/settings')
      .then(r => r.json())
      .then(d => setSettings(d.settings))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleSubmit = useCallback(
    async (formData: CheckoutFormData) => {
      if (items.length === 0) {
        toast.error('السلة فارغة')
        return
      }

      setIsSubmitting(true)

      try {
        const payload: CreateOrderPayload = {
          items: items.map((item) => ({
            product_id:    item.id,
            product_name:  item.name,
            product_image: item.image ?? null,
            color:         item.color ?? null,
            size:          item.size  ?? null,
            quantity:      item.quantity,
            unit_price_syp: item.discount_price_syp ?? item.price_syp,
            unit_price_usd: item.discount_price_usd ?? item.price_usd,
          })),
          customer: {
            full_name:   formData.full_name,
            phone:       formData.phone,
            governorate: formData.governorate,
            address:     formData.address,
          },
          shipping_company: formData.shipping_company as CreateOrderPayload['shipping_company'],
          payment_method:   formData.payment_method,
          coupon_code:      couponCode,
          currency_used:    currency,
          notes:            formData.notes ?? undefined,
        }

        const res  = await fetch('/api/orders', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error ?? 'حدث خطأ أثناء تأكيد الطلب')
          return
        }

        const { orderId, orderNumber } = data as { orderId: string; orderNumber: string }

        // Build and open WhatsApp URL
        const whatsappUrl = buildWhatsAppUrl({
          orderNumber,
          customerName:    formData.full_name,
          customerPhone:   formData.phone,
          governorate:     formData.governorate,
          address:         formData.address,
          shippingCompany: SHIPPING_LABELS[formData.shipping_company] ?? formData.shipping_company,
          items,
          couponCode,
          discountSyp:     discountSyp || undefined,
          discountUsd:     discountUsd || undefined,
          subtotalSyp:     subtotalSyp(),
          subtotalUsd:     subtotalUsd(),
          totalSyp:        Math.max(0, subtotalSyp() - discountSyp),
          totalUsd:        Math.max(0, subtotalUsd() - discountUsd),
          currency,
          paymentMethod:   formData.payment_method,
          shamCashNumber:  settings?.sham_cash_number ?? undefined,
        })

        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

        // Clear cart
        clearCart()

        // Navigate to success page
        router.push(`/order-success/${orderId}`)
      } catch {
        toast.error('حدث خطأ غير متوقع. يرجى المحاولة مجدداً.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [items, couponCode, discountSyp, discountUsd, currency, clearCart, router, subtotalSyp, subtotalUsd]
  )

  // Avoid hydration mismatch — render empty cart check only after mount
  if (!mounted) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  // Empty cart redirect
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main
          dir="rtl"
          className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-5 px-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#F2EDE6] flex items-center justify-center">
            <ShoppingBag size={32} className="text-[#9E9890]" />
          </div>
          <h1 className="font-arabic text-2xl font-bold text-[#1A1A1A]">السلة فارغة</h1>
          <p className="font-arabic text-[#6B6560] text-sm max-w-xs">
            لم تضف أي منتجات إلى السلة بعد. تصفح المنتجات وأضف ما يعجبك.
          </p>
          <Link
            href="/products"
            className={[
              'h-11 px-8 rounded-xl flex items-center gap-2',
              'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
              'font-arabic font-semibold text-sm',
              'hover:from-[#986D00] hover:to-[#B8860B] transition-all duration-200',
            ].join(' ')}
          >
            تصفح المنتجات
          </Link>
        </main>
        <Footer />
        <WhatsAppFAB />
      </>
    )
  }

  const sub_syp = subtotalSyp()
  const sub_usd = subtotalUsd()

  // Multi-product discount calculation
  let multiProductDiscountSyp = 0
  let multiProductDiscountUsd = 0
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0)

  if (settings?.discount_multi_items_enabled) {
    if (totalItemsCount >= 3) {
      multiProductDiscountSyp = settings.discount_3_items_plus_syp
    } else if (totalItemsCount >= 2) {
      multiProductDiscountSyp = settings.discount_2_items_syp
    }

    if (multiProductDiscountSyp > 0) {
      const ratio = sub_syp > 0 ? sub_usd / sub_syp : 0
      multiProductDiscountUsd = parseFloat((multiProductDiscountSyp * ratio).toFixed(2))
    }
  }

  return (
    <>
      <Header />

      <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-24 pb-16">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16">
          {/* Page heading — centered */}
          <div className="text-center mb-10">
            <h1 className="font-arabic text-3xl md:text-4xl font-bold text-[#1A1A1A]">إتمام الطلب</h1>
            <p className="font-arabic text-[#6B6560] text-sm mt-2">
              يرجى تزويدنا بتفاصيل الشحن لإتمام عملية الشراء
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form column — 8 cols (right side in RTL) */}
            <div className="lg:col-span-8">
              <CheckoutForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                settings={settings}
              />
            </div>

            {/* Summary column — 4 cols (left side in RTL) */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-4">
                {/* Order summary panel */}
                <OrderSummaryPanel
                  items={items}
                  subtotalSyp={sub_syp}
                  subtotalUsd={sub_usd}
                  discountSyp={discountSyp}
                  discountUsd={discountUsd}
                  couponCode={couponCode}
                  currency={currency}
                  isSubmitting={isSubmitting}
                  multiProductDiscountSyp={multiProductDiscountSyp}
                  multiProductDiscountUsd={multiProductDiscountUsd}
                />

                {/* Coupon */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgba(27,28,26,0.06)] border border-[#F0EBE3]">
                  <CouponInput
                    onApply={handleCouponApply}
                    onRemove={handleCouponRemove}
                    currency={currency}
                    appliedCode={couponCode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
