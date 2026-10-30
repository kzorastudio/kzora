'use client'

import { useState } from 'react'
import { Edit2, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

interface ShippingFeeEditorProps {
  orderId: string
  updatedAt?: string | null
  currency: 'SYP' | 'USD'
  feeSyp: number
  feeUsd: number
  /** "تتحدد مع البائع" — fee not agreed yet */
  determinedLater: boolean
}

/** The delivery-fee row of an order's summary, with in-place editing. Saving moves the total by the same amount. */
export default function ShippingFeeEditor({ orderId, updatedAt, currency, feeSyp, feeUsd, determinedLater }: ShippingFeeEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [syp, setSyp] = useState(String(feeSyp || 0))
  const [usd, setUsd] = useState(String(feeUsd || 0))

  async function save() {
    const nextSyp = Number(syp)
    const nextUsd = Number(usd)
    if (!Number.isFinite(nextSyp) || !Number.isFinite(nextUsd) || nextSyp < 0 || nextUsd < 0) {
      toast.error('أدخل أجرة صحيحة (صفر أو أكثر)')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipping_fee_syp: nextSyp, shipping_fee_usd: nextUsd, client_updated_at: updatedAt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'فشل تعديل الأجرة')
      }
      toast.success('تم تعديل أجرة التوصيل والإجمالي')
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex justify-between items-center gap-2">
        <span className="text-secondary flex items-center gap-1.5">
          أجرة الشحن
          <button
            type="button"
            onClick={() => { setSyp(String(feeSyp || 0)); setUsd(String(feeUsd || 0)); setEditing(true) }}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface-container transition-colors"
            title="تعديل أجرة التوصيل"
            aria-label="تعديل أجرة التوصيل"
          >
            <Edit2 size={13} />
          </button>
        </span>
        {determinedLater ? (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">تتحدد مع البائع</span>
        ) : (
          <span className="text-on-surface">
            {currency === 'USD' ? formatPrice(feeUsd, 'USD') : formatPrice(feeSyp, 'SYP')}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30">
      <span className="text-secondary text-xs">أجرة التوصيل لهذا الطلب</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-secondary">
          ل.س
          <input
            id={`fee-syp-${orderId}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={syp}
            onChange={(e) => setSyp(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm font-body text-on-surface focus:border-primary outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-secondary">
          $
          <input
            id={`fee-usd-${orderId}`}
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm font-body text-on-surface focus:border-primary outline-none"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          حفظ
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-surface-container text-secondary text-xs hover:text-on-surface"
        >
          <X size={14} />
          إلغاء
        </button>
      </div>
    </div>
  )
}
