'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, Loader2 } from 'lucide-react'

export default function ConfirmReservationButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm-reservation`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل تثبيت الحجز')
      toast.success('تم تثبيت الحجز وخصم المخزون')
      setConfirming(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-arabic font-bold bg-violet-600 text-white hover:bg-violet-600/90 transition"
      >
        <Check size={14} /> تثبيت الحجز
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-2.5 py-1.5">
      <span className="text-[11px] font-arabic text-violet-800">تثبيت وخصم المخزون؟</span>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-arabic font-bold bg-violet-600 text-white hover:bg-violet-600/90 transition disabled:opacity-60"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} تأكيد
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="rounded-lg px-2.5 py-1 text-[11px] font-arabic font-bold bg-white text-secondary border border-outline-variant/40 hover:bg-surface-container transition disabled:opacity-50"
      >
        إلغاء
      </button>
    </div>
  )
}
