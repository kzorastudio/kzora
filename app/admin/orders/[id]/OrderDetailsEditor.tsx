'use client'

import { useState, useEffect, useMemo } from 'react'
import { Edit2, X, Check, Loader2, User, Phone, MapPin, Truck, FileText, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { GOVERNORATES } from '@/lib/constants'
import type { OrderFull } from '@/types'
import { cn } from '@/lib/utils'

interface OrderDetailsEditorProps {
  order: OrderFull
}

export default function OrderDetailsEditor({ order }: OrderDetailsEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [methodsLoading, setMethodsLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    customer_full_name: order.customer_full_name,
    customer_phone: order.customer_phone,
    customer_governorate: order.customer_governorate,
    customer_address: order.customer_address,
    center_name: (order as any).center_name || null,
    shipping_company: order.shipping_company,
    delivery_type: (order as any).delivery_type || 'shipping',
    notes: order.notes || '',
  })

  // Fetch shipping methods dynamically from DB
  useEffect(() => {
    if (isEditing) {
      setMethodsLoading(true)
      fetch('/api/shipping')
        .then(r => r.json())
        .then(d => setShippingMethods(d.methods || []))
        .catch(() => {})
        .finally(() => setMethodsLoading(false))
    }
  }, [isEditing])

  // Branch addresses for the selected company + governorate ONLY (strict — no
  // falling back to other companies). Empty when that company has no branch in
  // this governorate, which blocks saving with a clear reason.
  const availableBranches = useMemo(() => {
    if (!formData.customer_governorate || !formData.shipping_company) return []
    const company = shippingMethods.find(m => m.slug === formData.shipping_company)
    const gov = company?.governorates?.find((g: any) => g.name === formData.customer_governorate)
    if (gov?.branch_addresses) {
      return gov.branch_addresses.split('\n').map((s: string) => s.trim()).filter(Boolean)
    }
    return []
  }, [formData.customer_governorate, formData.shipping_company, shippingMethods])

  // For shipping orders to non-Aleppo governorates, the address must be one of the
  // system's preset branches for the chosen company + governorate. Aleppo / home
  // delivery are left exactly as before (free text, never block-disabled).
  const isBranchMode = formData.delivery_type !== 'delivery' && formData.customer_governorate !== 'حلب'
  const addressInvalid = isBranchMode && (availableBranches.length === 0 || !availableBranches.includes(formData.customer_address))

  async function handleUpdate() {
    if (isBranchMode) {
      if (availableBranches.length === 0) {
        toast.error('لا توجد فروع مسجّلة لهذه الشركة في هذه المحافظة. اختر شركة أخرى أو أضِف الفرع من لوحة الشحن.')
        return
      }
      if (!availableBranches.includes(formData.customer_address)) {
        toast.error('يرجى اختيار العنوان بالتفصيل من القائمة')
        return
      }
    } else if (!formData.customer_address) {
      // Aleppo / home delivery — original validation, unchanged.
      toast.error('يرجى اختيار العنوان بالتفصيل')
      return
    }

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
              <User size={14} /> الاسم الكامل <span className="text-error">*</span>
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
              <Phone size={14} /> رقم الهاتف <span className="text-error">*</span>
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
            {/* Governorate & Center */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
                <MapPin size={14} /> المحافظة المنطقة <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                 <select
                   value={formData.customer_governorate}
                   onChange={(e) => {
                     setFormData({ ...formData, customer_governorate: e.target.value, customer_address: '', center_name: null })
                   }}
                   className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition"
                 >
                   <option value="">اختر المحافظة...</option>
                   {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                 </select>
                 
                 {formData.customer_governorate !== 'حلب' ? (
                   <input
                     type="text"
                     value={formData.center_name || ''}
                     onChange={e => setFormData({ ...formData, center_name: e.target.value })}
                     placeholder="اسم المنطقة (مثال: عفرين)"
                     className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition"
                   />
                 ) : (
                   <div className="flex items-center justify-center bg-surface-container/50 px-3 h-11 rounded-xl text-xs font-arabic text-secondary">
                     مدينة حلب (توصيل منزلي)
                   </div>
                 )}
              </div>
            </div>

            {/* Shipping Company — Dynamic */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
                <Truck size={14} /> خيار التوصيل <span className="text-error">*</span>
              </label>
              <select
                value={formData.delivery_type}
                onChange={(e) => {
                  setFormData({ ...formData, delivery_type: e.target.value, shipping_company: e.target.value === 'delivery' ? null : formData.shipping_company, customer_address: '' })
                }}
                disabled={formData.customer_governorate === 'حلب'}
                className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              >
                <option value="delivery">🚀 توصيل عادي</option>
                <option value="shipping">📦 شحن شركات</option>
              </select>
            </div>

            {formData.delivery_type === 'shipping' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
                  <Truck size={14} /> شركة الشحن <span className="text-error">*</span>
                </label>
                <select
                  value={formData.shipping_company || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, shipping_company: e.target.value })
                  }}
                  className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition"
                >
                  <option value="">اختر شركة الشحن...</option>
                  {shippingMethods.map((m: any) => (
                    <option key={m.slug} value={m.slug}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
              <MapPin size={14} /> العنوان بالتفصيل <span className="text-error">*</span>
            </label>
            {formData.delivery_type === 'delivery' || formData.customer_governorate === 'حلب' ? (
              /* Aleppo / home delivery → free text address (kept as-is). */
              <textarea
                rows={2}
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                placeholder="أدخل العنوان بالتفصيل..."
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition resize-none"
              />
            ) : methodsLoading ? (
              /* Still loading the company branches from the system. */
              <div className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container px-4 flex items-center text-sm font-arabic text-secondary">
                جارٍ تحميل العناوين...
              </div>
            ) : availableBranches.length > 0 ? (
              /* Other governorates → choose ONLY from the system's branches for this
                 company + governorate. No free typing. */
              <div className="relative">
                <select
                  value={availableBranches.includes(formData.customer_address) ? formData.customer_address : ''}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  className="w-full h-11 rounded-xl border border-outline-variant/60 bg-surface-container pr-4 pl-10 text-sm font-arabic focus:outline-none focus:border-primary/60 transition appearance-none"
                >
                  <option value="">اختر العنوان بالتفصيل...</option>
                  {availableBranches.map((branch: string, idx: number) => (
                    <option key={idx} value={branch}>{branch}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary/40">
                  <ChevronDown size={16} />
                </div>
              </div>
            ) : (
              /* No system branch for this company + governorate → block saving and explain why. */
              <div className="flex flex-col gap-1.5">
                <div className="w-full h-11 rounded-xl border border-error/40 bg-error-container/20 px-4 flex items-center text-sm font-arabic font-bold text-error">
                  لا يوجد
                </div>
                <p className="text-xs font-arabic text-error leading-relaxed">
                  لا توجد فروع مُسجّلة لشركة الشحن المختارة في محافظة «{formData.customer_governorate || '—'}».
                  لا يمكن حفظ التغييرات حتى تختار شركة لها فرع في هذه المحافظة، أو تُضيف الفرع من
                  لوحة التحكم ▸ الشحن.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-arabic font-medium text-secondary flex items-center gap-2">
              <FileText size={14} /> ملاحظات إضافية
              <span className="text-[10px] text-secondary/60 font-normal">(اختياري)</span>
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أضف ملاحظة..."
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-arabic focus:outline-none focus:border-primary/60 transition resize-none placeholder:text-secondary/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-outline-variant/20 bg-surface-container-lowest">
          <button
            onClick={handleUpdate}
            disabled={updating || addressInvalid}
            title={addressInvalid ? 'لا يمكن الحفظ: لا يوجد عنوان متاح لهذه الشركة في هذه المحافظة' : undefined}
            className="flex-1 h-11 rounded-xl bg-primary text-white font-arabic font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
