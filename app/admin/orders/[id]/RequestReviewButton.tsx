'use client'

import { Star } from 'lucide-react'
import { normalizePhone } from '@/lib/utils'

interface RequestReviewButtonProps {
  customerName: string
  customerPhone: string
  products: { name: string; slug: string }[]
}

// wa.me needs the full international form; normalizePhone yields the 9-digit local part.
function toWhatsAppNumber(phone: string): string | null {
  const local = normalizePhone(phone)
  return local.length === 9 ? `963${local}` : null
}

// Opens a WhatsApp chat with the customer asking them to review what they bought.
// Fresh, real reviews are one of the strongest signals for Google and AI answers,
// and every link lands on the product's review form.
export default function RequestReviewButton({ customerName, customerPhone, products }: RequestReviewButtonProps) {
  const number = toWhatsAppNumber(customerPhone)
  if (!number || products.length === 0) return null

  const firstName = customerName.trim().split(/\s+/)[0] || ''
  const links = products
    .map((p) => `• ${p.name.trim()}:\nhttps://www.kzora.co/product/${encodeURI(p.slug)}#reviews`)
    .join('\n')
  const message = [
    `أهلاً ${firstName} 🌟`,
    'شكراً لثقتك بكزورا! نتمنى يكون الحذاء عجبك.',
    'رأيك بيهمنا كتير وبيساعد غيرك يختار، بتقدر تكتب تقييمك من هون:',
    links,
  ].join('\n\n')

  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="إرسال طلب تقييم للزبون عبر واتساب"
      className="h-9 px-4 inline-flex items-center gap-2 rounded-xl text-xs font-arabic font-semibold transition-all shadow-sm bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-400 hover:text-white"
    >
      <Star size={14} className="fill-amber-400 text-amber-500" />
      طلب تقييم
    </a>
  )
}
