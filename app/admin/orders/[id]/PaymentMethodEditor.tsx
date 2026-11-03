'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentMethodEditorProps {
  orderId: string
  paymentMethod: string | null
  /** Already formatted: what the courier collects when the customer pays on delivery. */
  dueOnDelivery: string
}

const OPTIONS = [
  { value: 'cod',       label: '💵 عند الاستلام' },
  { value: 'sham_cash', label: '📱 شام كاش (مدفوع)' },
] as const

/**
 * Payment method of an order, switchable in place. Marking an order as paid by
 * Sham Cash (e.g. after the customer transferred on WhatsApp) zeroes the amount
 * to collect on the label and in the copied/WhatsApp texts, while the order's
 * real total stays intact for the stats.
 */
export default function PaymentMethodEditor({ orderId, paymentMethod, dueOnDelivery }: PaymentMethodEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const current = paymentMethod === 'sham_cash' ? 'sham_cash' : 'cod'

  async function choose(next: 'cod' | 'sham_cash') {
    if (next === current || saving) return
    setSaving(next)
    try {
      // Single-field change: no client_updated_at, so an unrelated recent edit
      // (status, printing…) never blocks marking the order as paid.
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: next }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'فشل تعديل طريقة الدفع')
      }
      toast.success(next === 'sham_cash' ? 'تم تسجيل الطلب كمدفوع (شام كاش)' : 'تم تحويل الطلب للدفع عند الاستلام')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 bg-surface-container/50 px-3 py-2.5 rounded-xl border border-outline-variant/30 mt-1">
      <span className="text-secondary text-xs">طريقة الدفع</span>
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="طريقة الدفع">
        {OPTIONS.map((o) => {
          const active = current === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!!saving}
              onClick={() => choose(o.value)}
              className={cn(
                'h-9 px-2 rounded-lg text-[11px] font-arabic font-bold border transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-60',
                active
                  ? o.value === 'sham_cash'
                    ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/40'
                    : 'bg-surface-container-lowest text-on-surface border-outline'
                  : 'bg-transparent text-secondary border-outline-variant/40 hover:border-outline'
              )}
            >
              {saving === o.value && <Loader2 size={12} className="animate-spin" />}
              {o.label}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between items-center pt-1">
        <span className="text-secondary text-xs">المطلوب تحصيله عند الاستلام</span>
        {current === 'sham_cash' ? (
          <span className="text-xs font-arabic font-bold text-[#2E7D32]">0 — مدفوع مسبقاً ✓</span>
        ) : (
          <span className="text-xs font-arabic font-bold text-on-surface">{dueOnDelivery}</span>
        )}
      </div>
    </div>
  )
}
