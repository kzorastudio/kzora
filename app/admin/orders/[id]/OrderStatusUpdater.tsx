'use client'

import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_OPTIONS } from '@/lib/constants'
import type { OrderStatus } from '@/types'

interface OrderStatusUpdaterProps {
  orderId: string
  currentStatus: OrderStatus
}

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus)
  const [updating, setUpdating] = useState(false)

  async function handleUpdate() {
    if (selectedStatus === currentStatus) {
      toast('لم تتغير الحالة', { icon: 'ℹ️' })
      return
    }

    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'فشل التحديث')
      }

      toast.success('تم تحديث حالة الطلب بنجاح')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <RefreshCw size={16} className="text-secondary" />
        <h3 className="text-sm font-arabic font-semibold text-on-surface">تحديث الحالة</h3>
      </div>

      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
        className="w-full rounded-xl border border-outline-variant/50 bg-surface-container px-3 py-2.5 text-sm font-arabic text-on-surface focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition"
        dir="rtl"
      >
        {ORDER_STATUS_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleUpdate}
        disabled={updating || selectedStatus === currentStatus}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {updating && <Loader2 size={15} className="animate-spin" />}
        {updating ? 'جاري التحديث...' : 'تحديث الحالة'}
      </button>
    </div>
  )
}
