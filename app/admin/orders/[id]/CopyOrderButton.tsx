'use client'

import { ClipboardCheck, Copy } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { OrderFull } from '@/types'
import { formatDate, formatPrice, SHIPPING_LABELS } from '@/lib/utils'

import { useSession } from 'next-auth/react'

interface CopyOrderButtonProps {
  order: OrderFull
}

export default function CopyOrderButton({ order }: CopyOrderButtonProps) {
  const [copied, setCopied] = useState(false)
  const { data: session } = useSession()
  const isEmployee = session?.user?.role === 'employee'

  const handleCopy = async () => {
    try {
      const governorate = order.customer_governorate
      const deliveryType = (order as any).delivery_type || 'shipping'
      const shippingInfo = deliveryType === 'delivery' 
        ? 'توصيل شامي (مندوب)' 
        : (SHIPPING_LABELS[order.shipping_company!] || order.shipping_company || 'شحن خارجي')

      const itemsText = order.items.map((item, idx) => (
        `${idx + 1}. ${item.product_name}\n   (اللون: ${item.color || '-'} | المقاس: ${item.size || '-'} | الكمية: ${item.quantity})`
      )).join('\n')

      const totalPrice = order.currency_used === 'USD'
        ? formatPrice(order.total_usd, 'USD')
        : formatPrice(order.total_syp, 'SYP')

      const paymentMethod = order.payment_method === 'sham_cash' ? '📱 شام كاش' : '💵 عند الاستلام'

      const textToCopy = `
🛍️ تفاصيل الطلب: ${order.order_number}
📅 التاريخ: ${new Date(order.created_at).toLocaleDateString('ar-SY')}

👤 العميل: ${order.customer_full_name}
📞 الهاتف: ${order.customer_phone}
📍 المحافظة: ${governorate}
🏠 العنوان: ${order.customer_address}

🛒 المنتجات:
${itemsText}

🚚 الشحن: ${shippingInfo}
💳 الدفع: ${paymentMethod}
${!isEmployee ? `💰 الإجمالي: ${totalPrice}\n` : ''}

✨ شكراً لاختياركم كزورا ✨
      `.trim()

      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success('تم نسخ كافة التفاصيل بنجاح')
      
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('فشل النسخ، يرجى المحاولة يدوياً')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`h-9 px-4 inline-flex items-center gap-2 rounded-xl text-xs font-arabic font-semibold transition-all shadow-sm ${
        copied 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-surface-container-high text-on-surface hover:bg-primary hover:text-white'
      }`}
    >
      {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
      {copied ? 'تم النسخ' : 'نسخ تفاصيل الطلب'}
    </button>
  )
}
