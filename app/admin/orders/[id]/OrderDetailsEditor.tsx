'use client'

import { useState } from 'react'
import { Edit2, X, Check, Loader2, User, Phone, MapPin, Truck, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { GOVERNORATES, SHIPPING_COMPANIES } from '@/lib/constants'
import type { OrderFull } from '@/types'

interface OrderDetailsEditorProps {
  order: OrderFull
}

export default function OrderDetailsEditor({ order }: OrderDetailsEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    customer_full_name: order.customer_full_name,
    customer_phone: order.customer_phone,
    customer_governorate: order.customer_governorate,
    customer_address: order.customer_address,
    shipping_company: order.shipping_company,
    notes: order.notes || '',
  })

  async function handleUpdate() {
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'فشل التحديث')
      }

      toast.success('تم تحديث بيانات الطلب بنجاح')
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setUpdating(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 text-xs font-arabic font-medium text-primary hover:text-primary-container transition-colors"
      >
        <Edit2 size={14} />
        تعديل البيانات
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
          <h2 className="text-lg font-arabic font-bold text-on-surface">تعديل بيانات الطلب</h2>
          <button onClick={() => setIsEditing(false)} className="text-secondary hover:text-on-surface transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Customer Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
              <User size={14} /> الاسم الكامل
            </label>
            <input
              type="text"
              value={formData.customer_full_name}
              onChange={(e) => setFormData({ ...formData, customer_full_name: e.target.value })}
              className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-4 text-sm font-arabic focus:outline-none focus:border-primary/60 transition"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
              <Phone size={14} /> رقم الهاتف
            </label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              dir="ltr"
              className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-4 text-sm font-label focus:outline-none focus:border-primary/60 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Governorate */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
                <MapPin size={14} /> المحافظة
              </label>
              <select
                value={formData.customer_governorate}
                onChange={(e) => setFormData({ ...formData, customer_governorate: e.target.value })}
                className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition"
              >
                {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
              </select>
            </div>

            {/* Shipping Company */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
                <Truck size={14} /> شركة الشحن
              </label>
              <select
                value={formData.shipping_company}
                onChange={(e) => setFormData({ ...formData, shipping_company: e.target.value as any })}
                className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition"
              >
                {SHIPPING_COMPANIES.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
              <MapPin size={14} /> العنوان بالتفصيل
            </label>
            <textarea
              rows={2}
              value={formData.customer_address}
              onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition resize-none"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
              <FileText size={14} /> ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-outline-variant/20 bg-surface-container-lowest">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex-1 h-11 rounded-xl bg-primary text-white font-arabic font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {updating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            حفظ التغييرات
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={updating}
            className="flex-1 h-11 rounded-xl bg-surface-container-highest text-on-surface font-arabic font-bold hover:bg-outline-variant/20 transition-all disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
