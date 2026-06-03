'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Printer, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { OrderFull } from '@/types'

const SHIPPING_DISPLAY: Record<string, string> = {
  karam: 'كرم', qadmous: 'قدموس', masarat: 'مسارات',
  delivery: 'توصيل عادي (حلب)', shipping: 'شحن شركات',
}

export default function PrintPreparationPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderFull[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    let stored: string[] = []
    try {
      stored = JSON.parse(sessionStorage.getItem('print_order_ids') || '[]')
    } catch { stored = [] }

    if (!stored || stored.length === 0) {
      toast.error('لم يتم تحديد أي طلبات')
      setLoading(false)
      return
    }
    setIds(stored)

    fetch('/api/admin/orders/print-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: stored }),
    })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => toast.error('تعذر تحميل بيانات الطباعة'))
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirm() {
    if (ids.length === 0) return
    setConfirming(true)
    try {
      const res = await fetch('/api/admin/orders/bulk-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ حالة الطباعة بنجاح')
      sessionStorage.removeItem('print_order_ids')
      router.push('/admin/orders')
    } catch {
      toast.error('تعذر حفظ حالة الطباعة')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  return (
    <div dir="rtl" className="bg-gray-100 min-h-screen print:bg-white">
      {/* Floating control bar — hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-outline-variant/30 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-arabic font-bold text-on-surface">
          تجهيز طباعة {orders.length} طلب
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-arabic font-bold hover:bg-primary/90 transition"
          >
            <Printer size={16} /> بدء الطباعة
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-arabic font-bold hover:bg-green-700 transition disabled:opacity-60"
          >
            {confirming ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            تأكيد نجاح الطباعة وحفظ الحالة
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('print_order_ids'); router.push('/admin/orders') }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-arabic font-bold hover:bg-surface-container-high transition"
          >
            <XCircle size={16} /> إلغاء وتراجع
          </button>
        </div>
      </div>

      <div className="no-print max-w-3xl mx-auto px-4 pt-3">
        <p className="text-xs font-arabic text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          ملاحظة: لن تتغيّر حالة الطلبات إلى "مطبوعة" إلا بعد ضغطك على زر <b>"تأكيد نجاح الطباعة"</b>. إلغاء الطباعة من المتصفح لا يؤثر على البيانات.
        </p>
      </div>

      {/* Printable receipts */}
      <div className="print-area max-w-3xl mx-auto p-4 flex flex-col gap-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="receipt bg-white rounded-xl border border-outline-variant/30 p-6 print:border-0 print:rounded-none print:p-4"
          >
            <div className="flex items-center justify-between border-b border-gray-300 pb-3 mb-3">
              <div>
                <h2 className="text-lg font-arabic font-black text-black">كزورا — Kzora</h2>
                <p className="text-xs font-arabic text-gray-500">إيصال طلب</p>
              </div>
              <div className="text-left">
                <p className="text-base font-label font-black text-black">{o.order_number}</p>
                <p className="text-xs font-arabic text-gray-500">{formatDate(o.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm font-arabic text-black mb-3">
              <p><span className="text-gray-500">الاسم:</span> {o.customer_full_name}</p>
              <p dir="ltr" className="text-right"><span className="text-gray-500">الهاتف:</span> {o.customer_phone}</p>
              <p><span className="text-gray-500">المحافظة:</span> {o.customer_governorate}</p>
              <p><span className="text-gray-500">الشحن:</span> {SHIPPING_DISPLAY[o.shipping_company || ''] || o.shipping_company || '—'}</p>
              {o.center_name && <p><span className="text-gray-500">المركز:</span> {o.center_name}</p>}
              {o.customer_address && <p className="col-span-2"><span className="text-gray-500">العنوان:</span> {o.customer_address}</p>}
            </div>

            <table className="w-full text-sm border-collapse mb-3">
              <thead>
                <tr className="border-y border-gray-300 text-gray-600 font-arabic text-xs">
                  <th className="text-right py-1.5">المنتج</th>
                  <th className="text-right py-1.5">اللون/المقاس</th>
                  <th className="text-center py-1.5">الكمية</th>
                  <th className="text-left py-1.5">السعر</th>
                </tr>
              </thead>
              <tbody>
                {(o.items || []).map((it) => {
                  const unit = o.currency_used === 'USD' ? it.unit_price_usd : it.unit_price_syp
                  const cur = o.currency_used === 'USD' ? '$' : 'ل.س'
                  return (
                    <tr key={it.id} className="border-b border-gray-100 font-arabic text-black">
                      <td className="py-1.5">{it.product_name}</td>
                      <td className="py-1.5 text-gray-600">{[it.color, it.size].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-left font-label">{(unit * it.quantity).toLocaleString()} {cur}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-1 text-sm font-arabic text-black">
              {(() => {
                const cur = o.currency_used === 'USD' ? '$' : 'ل.س'
                const sub = o.currency_used === 'USD' ? o.subtotal_usd : o.subtotal_syp
                const ship = o.currency_used === 'USD' ? o.shipping_fee_usd : o.shipping_fee_syp
                const tot = o.currency_used === 'USD' ? o.total_usd : o.total_syp
                return (
                  <>
                    <p className="text-gray-600">المجموع الفرعي: {sub.toLocaleString()} {cur}</p>
                    <p className="text-gray-600">الشحن: {ship.toLocaleString()} {cur}</p>
                    <p className="text-base font-black border-t border-gray-300 pt-1 mt-1">الإجمالي: {tot.toLocaleString()} {cur}</p>
                  </>
                )
              })()}
            </div>

            {o.notes && <p className="mt-3 text-xs font-arabic text-gray-600 border-t border-gray-200 pt-2">ملاحظات: {o.notes}</p>}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          /* Hide the admin sidebar, header & mobile bar so only receipts are printed */
          aside, header { display: none !important; }
          main { margin: 0 !important; }
          .receipt { page-break-after: always; break-after: page; }
          .receipt:last-child { page-break-after: auto; break-after: auto; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  )
}
