'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, OrderItem } from '@/types'
import { SHIPPING_LABELS, ORDER_STATUS_LABELS, formatDate, formatCurrency, toArabicNumerals } from '@/lib/utils'

type OrderWithItems = Order & { items?: OrderItem[] }

interface Props {
  order: OrderWithItems
  shippingMethods: { slug: string; name: string }[]
  className?: string
}

export default function CopyOrderButton({ order, shippingMethods, className }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation() // don't navigate into the order detail page

    const method = shippingMethods.find((m) => m.slug === order.shipping_company)
    let shippingName = method?.name || SHIPPING_LABELS[order.shipping_company || ''] || order.shipping_company || ''
    
    // Clean emojis and parenthesized English text if present
    shippingName = shippingName.replace(/[\uD800-\uDFFF\u2600-\u27BF]/g, '').trim()
    if (shippingName.includes('(')) {
      shippingName = shippingName.split('(')[0].trim()
    }
    shippingName = shippingName.trim()

    const isAleppo = order.delivery_type === 'delivery'
    const cur: 'SYP' | 'USD' = order.currency_used === 'USD' ? 'USD' : 'SYP'
    const pick = (syp: number, usd: number) => (cur === 'USD' ? usd : syp)

    const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status

    const lines: (string | null)[] = [
      `رقم الطلب: ${order.order_number}`,
      `الاسم: ${order.customer_full_name}`,
      `الهاتف: ${order.customer_phone}`,
      `المحافظة: ${order.customer_governorate}`,
      order.center_name ? `المنطقة/المركز: ${order.center_name}` : null,
      // Aleppo orders carry a real street address; shipping orders to other
      // governorates only use the center, so skip the duplicated العنوان line.
      isAleppo && order.customer_address ? `العنوان: ${order.customer_address}` : null,
      `الشحن: ${shippingName || 'غير محدد'}`,
      `طريقة الدفع: ${order.payment_method === 'sham_cash' ? 'شام كاش' : 'الدفع عند الاستلام'}`,
    ]

    const items = order.items ?? []
    if (items.length) {
      lines.push('المنتجات:')
      items.forEach((it, i) => {
        lines.push(`\u200F${toArabicNumerals(i + 1)}. ${it.product_name}`)
        const details: string[] = []
        if (it.color) details.push(`اللون: ${it.color}`)
        if (it.size != null) details.push(`النمرة: ${it.size}`)
        if (details.length) lines.push(`   ${details.join(' - ')}`)
        const unit = pick(it.unit_price_syp, it.unit_price_usd)
        lines.push(
          it.quantity > 1
            ? `   الكمية: ${it.quantity} × ${formatCurrency(unit, cur)} = ${formatCurrency(unit * it.quantity, cur)}`
            : `   الكمية: ${it.quantity} × ${formatCurrency(unit, cur)}`
        )
      })
    }

    if (isAleppo) {
      const formattedTotal = cur === 'USD'
        ? formatCurrency(order.total_usd, 'USD')
        : 'السعر : ' + formatCurrency(order.total_syp, 'SYP')
      lines.push(`الإجمالي: ${formattedTotal}`)
    } else {
      const shippingFee = order.shipping_fee_determined ? 0 : pick(order.shipping_fee_syp, order.shipping_fee_usd)
      const totalWithoutShipping = pick(order.total_syp, order.total_usd) - shippingFee
      lines.push(`الإجمالي بدون الشحن: ${formatCurrency(totalWithoutShipping, cur)}`)
    }

    lines.push(`الحالة: ${statusLabel}`)
    lines.push(`التاريخ: ${formatDate(order.created_at)}`)

    const copyText = lines.filter(Boolean).join('\n')

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(copyText)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = copyText
        textArea.style.position = 'fixed'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      toast.success('تم نسخ تفاصيل الطلب!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('فشل نسخ التفاصيل')
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="نسخ تفاصيل الطلب"
      className={
        className ||
        'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-arabic font-semibold transition-all bg-[#bfa15f]/15 text-[#785600] border border-[#bfa15f]/25 hover:bg-[#bfa15f] hover:text-white min-w-[95px] justify-center'
      }
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'تم النسخ' : 'نسخ الطلب'}
    </button>
  )
}
