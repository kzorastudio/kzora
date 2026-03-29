import type { CartItem, Currency } from '@/types'
import { formatPrice, SHIPPING_LABELS } from './utils'

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '963964514765'

interface OrderForWhatsApp {
  orderNumber: string
  customerName: string
  customerPhone: string
  governorate: string
  address: string
  shippingCompany: string
  items: CartItem[]
  couponCode?: string
  discountSyp?: number
  discountUsd?: number
  subtotalSyp: number
  subtotalUsd: number
  totalSyp: number
  totalUsd: number
  currency: Currency
}

export function buildWhatsAppUrl(order: OrderForWhatsApp): string {
  const currency = order.currency
  const lines: string[] = [
    `🛍️ *طلب جديد من كزورا*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 *رقم الطلب:* ${order.orderNumber}`,
    ``,
    `👤 *بيانات العميل:*`,
    `الاسم: ${order.customerName}`,
    `الهاتف: ${order.customerPhone}`,
    `المحافظة: ${order.governorate}`,
    `العنوان: ${order.address}`,
    ``,
    `🚚 *شركة الشحن:* ${SHIPPING_LABELS[order.shippingCompany] || order.shippingCompany}`,
    ``,
    `📦 *المنتجات:*`,
  ]

  order.items.forEach((item, i) => {
    const price = currency === 'SYP'
      ? formatPrice(item.discount_price_syp ?? item.price_syp, 'SYP')
      : formatPrice(item.discount_price_usd ?? item.price_usd, 'USD')
    lines.push(`${i + 1}. ${item.name}`)
    if (item.color) lines.push(`   اللون: ${item.color}`)
    if (item.size)  lines.push(`   المقاس: ${item.size}`)
    lines.push(`   الكمية: ${item.quantity} × ${price}`)
  })

  lines.push(``)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)

  const subtotal = currency === 'SYP'
    ? formatPrice(order.subtotalSyp, 'SYP')
    : formatPrice(order.subtotalUsd, 'USD')

  lines.push(`المجموع الفرعي: ${subtotal}`)

  if (order.couponCode && (order.discountSyp || order.discountUsd)) {
    const discount = currency === 'SYP'
      ? formatPrice(order.discountSyp!, 'SYP')
      : formatPrice(order.discountUsd!, 'USD')
    lines.push(`كود الخصم (${order.couponCode}): -${discount}`)
  }

  const total = currency === 'SYP'
    ? formatPrice(order.totalSyp, 'SYP')
    : formatPrice(order.totalUsd, 'USD')

  lines.push(`*الإجمالي: ${total}*`)
  lines.push(`طريقة الدفع: الدفع عند الاستلام 💵`)

  const message = lines.join('\n')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
}
