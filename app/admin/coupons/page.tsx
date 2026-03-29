'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Loader2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminHeader from '@/components/admin/AdminHeader'
import CouponForm from './CouponForm'
import { formatDate, cn } from '@/lib/utils'
import type { Coupon } from '@/types'

const TYPE_LABEL: Record<string, string> = {
  percentage:   'نسبة مئوية',
  fixed_amount: 'مبلغ ثابت',
}

export default function CouponsPage() {
  const [coupons, setCoupons]       = useState<Coupon[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/coupons')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCoupons(data.coupons ?? [])
    } catch {
      toast.error('فشل تحميل الكوبونات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  async function handleToggleActive(coupon: Coupon) {
    setTogglingId(coupon.id)
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (!res.ok) throw new Error()
      toast.success(coupon.is_active ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون')
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      )
    } catch {
      toast.error('فشل تحديث الحالة')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`هل أنت متأكد من حذف كوبون "${coupon.code}"؟`)) return

    setDeletingId(coupon.id)
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم حذف الكوبون بنجاح')
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
    } catch {
      toast.error('فشل حذف الكوبون')
    } finally {
      setDeletingId(null)
    }
  }

  function handleFormSuccess() {
    setModalOpen(false)
    fetchCoupons()
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-6 flex flex-col gap-5">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-arabic font-medium text-secondary">
            إجمالي الكوبونات: <span className="font-bold text-on-surface">{coupons.length}</span>
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors shadow-ambient"
          >
            <Plus size={16} />
            إضافة كوبون
          </button>
        </div>

        {/* ── MOBILE CARDS ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient animate-pulse h-20" />
            ))
          ) : coupons.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center text-sm font-arabic text-secondary shadow-ambient">لا توجد كوبونات</div>
          ) : coupons.map((coupon) => {
            const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false
            return (
              <div key={coupon.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient border border-outline-variant/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-label font-bold text-primary tracking-wider">{coupon.code}</span>
                  <button onClick={() => handleToggleActive(coupon)} disabled={togglingId === coupon.id} className="transition-opacity disabled:opacity-50">
                    {togglingId === coupon.id ? <Loader2 size={20} className="animate-spin text-secondary" /> : coupon.is_active ? <ToggleRight size={24} className="text-primary" /> : <ToggleLeft size={24} className="text-secondary" />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-arabic text-secondary mb-3">
                  <span>{TYPE_LABEL[coupon.type] ?? coupon.type} — <span className="font-semibold text-on-surface">{coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toLocaleString('ar-SY')} ل.س`}</span></span>
                  {coupon.min_order_syp > 0 && <span>حد أدنى: {coupon.min_order_syp.toLocaleString('ar-SY')} ل.س</span>}
                  <span>استخدم: {coupon.used_count}{coupon.max_uses !== null && ` / ${coupon.max_uses}`}</span>
                  {coupon.expires_at && <span className={isExpired ? 'text-error font-medium' : ''}>{isExpired ? '⚠ ' : ''}{formatDate(coupon.expires_at)}</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-arabic font-medium', coupon.is_active && !isExpired ? 'bg-green-50 text-green-700' : 'bg-surface-container text-secondary')}>
                    {coupon.is_active && !isExpired ? 'نشط' : isExpired ? 'منتهي' : 'معطّل'}
                  </span>
                  <button onClick={() => handleDelete(coupon)} disabled={deletingId === coupon.id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                  >
                    {deletingId === coupon.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── DESKTOP TABLE ── */}
        <div className="hidden md:block bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant/40">
                  {['الكود', 'النوع', 'القيمة', 'الحد الأدنى', 'الاستخدامات', 'تاريخ الانتهاء', 'نشط', 'الإجراءات'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-right text-xs font-arabic font-semibold text-secondary uppercase tracking-wide whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant/20 last:border-0">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-surface-container-high animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : coupons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-sm font-arabic text-secondary"
                    >
                      لا توجد كوبونات. أضف كوبوناً جديداً.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const isExpired =
                      coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false

                    return (
                      <tr
                        key={coupon.id}
                        className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/20 transition-colors"
                      >
                        {/* Code */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-label font-semibold text-primary tracking-wider">
                              {coupon.code}
                            </span>
                            {coupon.auto_generated && (
                              <span className="text-xs font-arabic text-secondary">مولّد تلقائياً</span>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 text-sm font-arabic text-on-surface-variant whitespace-nowrap">
                          {TYPE_LABEL[coupon.type] ?? coupon.type}
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3 text-sm font-label font-semibold text-on-surface whitespace-nowrap">
                          {coupon.type === 'percentage'
                            ? `${coupon.value}%`
                            : `${coupon.value.toLocaleString('ar-SY')} ل.س`}
                        </td>

                        {/* Min order */}
                        <td className="px-4 py-3 text-sm font-label text-on-surface-variant whitespace-nowrap">
                          {coupon.min_order_syp > 0
                            ? `${coupon.min_order_syp.toLocaleString('ar-SY')} ل.س`
                            : '—'}
                        </td>

                        {/* Uses */}
                        <td className="px-4 py-3 text-sm font-label text-on-surface-variant whitespace-nowrap">
                          {coupon.used_count}
                          {coupon.max_uses !== null && ` / ${coupon.max_uses}`}
                        </td>

                        {/* Expires */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {coupon.expires_at ? (
                            <span
                              className={cn(
                                'text-sm font-arabic',
                                isExpired ? 'text-error font-medium' : 'text-on-surface-variant'
                              )}
                            >
                              {isExpired ? '⚠ ' : ''}
                              {formatDate(coupon.expires_at)}
                            </span>
                          ) : (
                            <span className="text-sm font-arabic text-secondary">لا يوجد</span>
                          )}
                        </td>

                        {/* Active toggle */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            disabled={togglingId === coupon.id}
                            title={coupon.is_active ? 'تعطيل' : 'تفعيل'}
                            className="flex items-center transition-opacity disabled:opacity-50"
                          >
                            {togglingId === coupon.id ? (
                              <Loader2 size={18} className="animate-spin text-secondary" />
                            ) : coupon.is_active ? (
                              <ToggleRight size={22} className="text-primary" />
                            ) : (
                              <ToggleLeft size={22} className="text-secondary" />
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(coupon)}
                            disabled={deletingId === coupon.id}
                            title="حذف"
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                          >
                            {deletingId === coupon.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add coupon modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div
            className="relative bg-surface-container-lowest rounded-2xl shadow-ambient-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40 sticky top-0 bg-surface-container-lowest z-10">
              <h2 className="text-base font-arabic font-semibold text-on-surface">
                إضافة كوبون جديد
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-container transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <CouponForm onSuccess={handleFormSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
