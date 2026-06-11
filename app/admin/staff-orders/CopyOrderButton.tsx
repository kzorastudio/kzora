'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, OrderItem } from '@/types'
import { SHIPPING_LABELS, ORDER_STATUS_LABELS, formatDate, formatCurrency } from '@/lib/utils'

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

    const formattedTotal = order.currency_used === 'USD'
      ? formatCurrency(order.total_usd, 'USD')
      : 'السعر : ' + formatCurrency(order.total_syp, 'SYP')

    const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status

    const copyText = [
      `رقم الطلب: ${order.order_number}`,
      `الاسم: ${order.customer_full_name}`,
      `الهاتف: ${order.customer_phone}`,
      `المحافظة: ${order.customer_governorate}`,
      order.center_name ? `المنطقة/المركز: ${order.center_name}` : null,
      order.customer_address ? `العنوان: ${order.customer_address}` : null,
      `الشحن: ${shippingName || 'غير محدد'}`,
      `طريقة الدفع: ${order.payment_method === 'sham_cash' ? 'شام كاش' : 'الدفع عند الاستلام'}`,
      `الإجمالي: ${formattedTotal}`,
      `الحالة: ${statusLabel}`,
      `التاريخ: ${formatDate(order.created_at)}`,
    ].filter(Boolean).join('\n')

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
