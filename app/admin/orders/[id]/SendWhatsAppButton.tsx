'use client'

import { MessageCircle } from 'lucide-react'
import type { OrderFull } from '@/types'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { SHIPPING_LABELS } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface SendWhatsAppButtonProps {
  order: OrderFull
}

export default function SendWhatsAppButton({ order }: SendWhatsAppButtonProps) {
  const [shippingCompanyName, setShippingCompanyName] = useState('')

  useEffect(() => {
    // Fetch shipping methods to resolve display name dynamically, just like in checkout
    if (order.delivery_type === 'shipping' && order.shipping_company) {
      fetch('/api/shipping')
        .then((r) => r.json())
        .then((d) => {
          const methods = d.methods || []
          const method = methods.find((m: any) => m.slug === order.shipping_company)
          setShippingCompanyName(method?.name || SHIPPING_LABELS[order.shipping_company!] || order.shipping_company!)
        })
        .catch(() => {
          setShippingCompanyName(SHIPPING_LABELS[order.shipping_company!] || order.shipping_company!)
        })
    }
  }, [order.delivery_type, order.shipping_company])

  const handleSend = () => {
    // Map OrderItem to CartItem format
    const itemsForWhatsApp = order.items.map((item) => ({
      id: item.product_id || '',
      slug: '',
      name: item.product_name,
      image: item.product_image || '',
      color: item.color,
      color_name: item.color,
      size: item.size,
      quantity: item.quantity,
      price_syp: item.unit_price_syp,
      price_usd: item.unit_price_usd,
      discount_price_syp: null,
      discount_price_usd: null,
      mold_type: 'normal' as const,
    }))

    const currency = order.currency_used

    // Construct WhatsApp deep link
    const whatsappUrl = buildWhatsAppUrl({
      orderNumber: order.order_number,
      customerName: order.customer_full_name,
      customerPhone: order.customer_phone,
      governorate: order.customer_governorate,
      centerName: order.center_name || undefined,
      address: order.customer_address,
      deliveryType: order.delivery_type,
      shippingCompany: order.shipping_company || '',
      shippingCompanyName: shippingCompanyName || SHIPPING_LABELS[order.shipping_company || ''] || order.shipping_company || '',
      items: itemsForWhatsApp as any,
      couponCode: order.coupon_code || undefined,
      discountSyp: order.discount_amount_syp || undefined,
      discountUsd: order.discount_amount_usd || undefined,
      loyaltyDiscountSyp: order.loyalty_discount_syp || undefined,
      loyaltyDiscountUsd: order.loyalty_discount_usd || undefined,
      shippingFeeSyp: order.shipping_fee_syp,
      shippingFeeUsd: order.shipping_fee_usd,
      // Shipping with no stored fee → negotiated with the seller (e.g. 4+ pieces).
      shippingFeeDetermined:
        order.delivery_type === 'shipping' &&
        (order.shipping_fee_syp || 0) === 0 &&
        (order.shipping_fee_usd || 0) === 0,
      subtotalSyp: order.subtotal_syp,
      subtotalUsd: order.subtotal_usd,
      totalSyp: order.total_syp,
      totalUsd: order.total_usd,
      currency,
      paymentMethod: order.payment_method,
      paymentTransactionId: order.payment_transaction_id || undefined,
      notes: order.notes || undefined,
    })

    // Open WhatsApp URL in a new window/tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleSend}
      className="h-9 px-4 inline-flex items-center gap-2 rounded-xl text-xs font-arabic font-semibold transition-all shadow-sm bg-[#25D366]/10 text-[#20BC5C] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white"
    >
      <MessageCircle size={14} />
      إرسال عبر واتساب
    </button>
  )
}
