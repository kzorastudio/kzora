'use client'

import { MessageCircle } from 'lucide-react'
import type { Order, OrderItem } from '@/types'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { SHIPPING_LABELS } from '@/lib/utils'

type OrderWithItems = Order & { items?: OrderItem[] }

interface Props {
  order: OrderWithItems
  shippingMethods: { slug: string; name: string }[]
  className?: string
}

// Compact WhatsApp button for the staff-orders list. Builds the same formatted
// message (with full pricing) that the order detail page sends, straight from
// the list card — no need to open the order first.
export default function SendOrderWhatsApp({ order, shippingMethods, className }: Props) {
  const handleSend = (e: React.MouseEvent) => {
    e.stopPropagation() // don't navigate into the order detail

    const items = order.items || []
    const itemsForWhatsApp = items.map((item) => ({
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

    const method = shippingMethods.find((m) => m.slug === order.shipping_company)
    const shippingCompanyName =
      method?.name || SHIPPING_LABELS[order.shipping_company || ''] || order.shipping_company || ''

    // Shipping with no stored fee → negotiated with the seller (e.g. 4+ pieces).
    // Inferred from the data so it's correct regardless of the stored flag.
    const feeDetermined =
      order.delivery_type === 'shipping' &&
      (order.shipping_fee_syp || 0) === 0 &&
      (order.shipping_fee_usd || 0) === 0

    const url = buildWhatsAppUrl({
      orderNumber: order.order_number,
      customerName: order.customer_full_name,
      customerPhone: order.customer_phone,
      governorate: order.customer_governorate,
      centerName: order.center_name || undefined,
      address: order.customer_address,
      deliveryType: order.delivery_type,
      shippingCompany: order.shipping_company || '',
      shippingCompanyName,
      items: itemsForWhatsApp as any,
      shippingFeeSyp: order.shipping_fee_syp,
      shippingFeeUsd: order.shipping_fee_usd,
      shippingFeeDetermined: feeDetermined,
      subtotalSyp: order.subtotal_syp,
      subtotalUsd: order.subtotal_usd,
      totalSyp: order.total_syp,
      totalUsd: order.total_usd,
      currency: order.currency_used,
      paymentMethod: order.payment_method,
      notes: order.notes || undefined,
    })

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleSend}
      title="إرسال عبر واتساب"
      className={
        className ||
        'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-arabic font-semibold transition-all bg-[#25D366]/10 text-[#20BC5C] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white'
      }
    >
      <MessageCircle size={14} />
      إرسال عبر واتساب
    </button>
  )
}
