'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Printer, CheckCircle2, XCircle, Loader2, Tag, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { OrderFull } from '@/types'
import BarcodeSVG from '@/components/admin/BarcodeSVG'
import QRCodeSVG from '@/components/admin/QRCodeSVG'

const SHIPPING_DISPLAY: Record<string, string> = {
  karam: 'كرم للشحن',
  qadmous: 'قدموس للشحن',
  masarat: 'مسارات للشحن',
  delivery: 'توصيل عادي (داخل المدينة)',
  shipping: 'شحن شركات',
}

export default function PrintPreparationPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderFull[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [ids, setIds] = useState<string[]>([])
  const [printMode, setPrintMode] = useState<'thermal10cm' | 'a4'>('thermal10cm')

  useEffect(() => {
    let stored: string[] = []
    try {
      stored = JSON.parse(sessionStorage.getItem('print_order_ids') || '[]')
    } catch {
      stored = []
    }

    if (!stored || stored.length === 0) {
      toast.error('لم يتم تحديد أي طلبات للطباعة')
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="font-arabic text-sm font-bold text-gray-600">جاري تجهيز إيصالات الطباعة...</p>
      </div>
    )
  }

  return (
    <div dir="rtl" className="bg-gray-200 min-h-screen text-black print:bg-white print:p-0">
      {/* Control Bar - Screen only */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-300 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-arabic font-black text-gray-900">
            تجهيز طباعة {orders.length} طلب
          </span>

          {/* Mode Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-300">
            <button
              onClick={() => setPrintMode('thermal10cm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic font-bold transition ${
                printMode === 'thermal10cm'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag size={14} />
              ملصق حراري 10 سم (Xprinter)
            </button>
            <button
              onClick={() => setPrintMode('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic font-bold transition ${
                printMode === 'a4'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={14} />
              ورق A4 عالي الجودة
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-arabic font-bold hover:bg-blue-700 shadow-sm transition"
          >
            <Printer size={18} /> بدء الطباعة الأن
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-arabic font-bold hover:bg-green-700 transition disabled:opacity-60"
          >
            {confirming ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            تأكيد نجاح الطباعة وحفظ الحالة
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('print_order_ids')
              router.push('/admin/orders')
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-200 text-gray-800 text-sm font-arabic font-bold hover:bg-gray-300 transition"
          >
            <XCircle size={16} /> إلغاء وتراجع
          </button>
        </div>
      </div>

      {/* Screen Helper Note */}
      <div className="no-print max-w-4xl mx-auto px-4 pt-3 pb-1">
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-arabic text-amber-900 leading-relaxed">
          💡 <b>إرشادات طباعة طابعة Xprinter (لصاقة 10 سم):</b>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>في نافذة المتصفح عند الضغط على "بدء الطباعة"، اختر الطابعة: <b>Xprinter XP-480B</b>.</li>
            <li>في حجم الورق (Paper Size)، اختر: <b>100mm x 150mm</b> أو <b>User Defined (10cm)</b>.</li>
            <li>تأكد من إلغاء الهوامش (Margins: <b>None</b>) وإلغاء الرأس والتذييل (Headers and Footers: <b>Uncheck</b>).</li>
          </ul>
        </div>
      </div>

      {/* Printable Area */}
      <div className={`receipt-container mx-auto p-4 flex flex-col gap-6 ${
        printMode === 'thermal10cm' ? 'max-w-[100mm] w-[100mm]' : 'max-w-3xl'
      }`}>
        {orders.map((o) => {
          const cur = o.currency_used === 'USD' ? '$' : 'ل.س'
          const sub = o.currency_used === 'USD' ? o.subtotal_usd : o.subtotal_syp
          const ship = o.currency_used === 'USD' ? o.shipping_fee_usd : o.shipping_fee_syp
          const isAleppo = o.customer_governorate === 'حلب' || o.delivery_type === 'delivery'
          const tot = o.currency_used === 'USD' ? o.total_usd : o.total_syp
          const discount = o.currency_used === 'USD' ? (o.discount_amount_usd || 0) : (o.discount_amount_syp || 0)

          return (
            <div
              key={o.id}
              className={`receipt bg-white text-black border-2 border-black p-4 font-arabic ${
                printMode === 'thermal10cm'
                  ? 'w-[100mm] text-[11px] leading-tight rounded-none shadow-none border-2 border-black'
                  : 'rounded-xl shadow-md border border-gray-300 p-6'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2 text-black">
                <div>
                  <h1 className="text-xl font-black font-arabic tracking-tight text-black">كزورا — KZORA</h1>
                  <p className="text-[10px] font-bold text-black">إيصال طلبية ومستند تسليم</p>
                </div>
                <div className="text-left">
                  <span className="inline-block bg-black text-white px-2 py-0.5 text-xs font-black rounded">
                    {o.order_number}
                  </span>
                  <p className="text-[9px] font-bold mt-1 text-black">{formatDate(o.created_at)}</p>
                </div>
              </div>

              {/* Barcode */}
              <div className="my-2 py-1 flex justify-center border-b border-dashed border-black">
                <BarcodeSVG value={o.order_number} height={38} showText={true} />
              </div>

              {/* Customer & Shipping Info Box */}
              <div className="border-2 border-black p-2 my-2 bg-white space-y-1 text-black">
                <div className="flex justify-between items-baseline border-b border-gray-400 pb-1">
                  <span className="font-bold text-gray-700 text-[10px]">المستلم:</span>
                  <span className="font-black text-sm text-black">{o.customer_full_name}</span>
                </div>

                <div className="flex justify-between items-baseline border-b border-gray-400 pb-1">
                  <span className="font-bold text-gray-700 text-[10px]">الهاتف:</span>
                  <span className="font-black text-sm text-black" dir="ltr">{o.customer_phone}</span>
                </div>

                <div className="flex justify-between items-baseline border-b border-gray-400 pb-1">
                  <span className="font-bold text-gray-700 text-[10px]">المحافظة / المدينة:</span>
                  <span className="font-bold text-xs text-black">{o.customer_governorate}</span>
                </div>

                <div className="flex justify-between items-baseline border-b border-gray-400 pb-1">
                  <span className="font-bold text-gray-700 text-[10px]">طريقة الشحن:</span>
                  <span className="font-black text-xs text-black bg-gray-200 px-1.5 py-0.5 rounded">
                    {SHIPPING_DISPLAY[o.shipping_company || ''] || o.shipping_company || 'توصيل'}
                  </span>
                </div>

                {o.center_name && (
                  <div className="flex justify-between items-baseline border-b border-gray-400 pb-1">
                    <span className="font-bold text-gray-700 text-[10px]">المركز / الفرع:</span>
                    <span className="font-bold text-xs text-black">{o.center_name}</span>
                  </div>
                )}

                {o.customer_address && (
                  <div className="pt-0.5">
                    <span className="font-bold text-gray-700 text-[10px] block">العنوان التفصيلي:</span>
                    <span className="font-bold text-xs text-black block leading-tight">{o.customer_address}</span>
                  </div>
                )}
              </div>

              {/* Products Table */}
              <div className="my-2">
                <p className="font-black text-[10px] border-b border-black pb-0.5 mb-1 text-black">محتويات الطلبية:</p>
                <table className="w-full text-right border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-black font-black text-black">
                      <th className="py-1 text-right">المنتج</th>
                      <th className="py-1 text-center">اللون/المقاس</th>
                      <th className="py-1 text-center">الكمية</th>
                      <th className="py-1 text-left">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((it) => {
                      const unit = o.currency_used === 'USD' ? it.unit_price_usd : it.unit_price_syp
                      return (
                        <tr key={it.id} className="border-b border-gray-300 font-bold text-black">
                          <td className="py-1 font-bold text-black">{it.product_name}</td>
                          <td className="py-1 text-center text-gray-800">
                            {[it.color, it.size].filter(Boolean).join(' / ') || '—'}
                          </td>
                          <td className="py-1 text-center font-black text-black">{it.quantity}</td>
                          <td className="py-1 text-left font-black text-black">
                            {(unit * it.quantity).toLocaleString()} {cur}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & TOTAL TO COLLECT */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-black">
                  <span>مجموع المنتجات:</span>
                  <span>{sub.toLocaleString()} {cur}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[10px] font-bold text-black">
                    <span>الخصم:</span>
                    <span>- {discount.toLocaleString()} {cur}</span>
                  </div>
                )}

                {isAleppo && ship > 0 && (
                  <div className="flex justify-between text-[10px] font-bold text-black">
                    <span>أجور التوصيل (حلب):</span>
                    <span>{ship.toLocaleString()} {cur}</span>
                  </div>
                )}

                {/* Main Total Box - Prominent for Driver/Delivery */}
                <div className="mt-2 border-2 border-black bg-black text-white p-2 text-center rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-200">
                    المبلغ المطلوب قبضة من العميل
                  </p>
                  <p className="text-lg font-black tracking-tight text-white mt-0.5">
                    {tot.toLocaleString()} {cur}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {o.notes && (
                <div className="mt-2 p-1.5 border border-black text-[9.5px] bg-gray-50 text-black">
                  <span className="font-black block">ملاحظات:</span>
                  <span className="font-bold leading-tight">{o.notes}</span>
                </div>
              )}

              {/* Footer & QR */}
              <div className="mt-3 pt-2 border-t-2 border-black flex items-center justify-between gap-2 text-black">
                <div className="flex-1">
                  <p className="font-black text-[10px] text-black">متجر كزورا — Kzora Store</p>
                  <p className="text-[9.5px] font-bold text-black leading-tight mt-1">
                    بإمكانك تسوق المزيد عبر الرابط:{' '}
                    <span dir="ltr" className="font-mono font-black text-[10px] underline">https://www.kzora.co/</span>
                  </p>
                  <p className="text-[9px] font-bold text-black leading-tight mt-1">
                    شكراً لتسوقكم معنا! لأي استفسار يرجى التواصل على رقمنا: <span dir="ltr" className="font-mono font-black text-[10px]">0964514765</span>
                  </p>
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <QRCodeSVG value="https://www.kzora.co/" size={56} />
                  <span dir="ltr" className="text-[8px] font-mono font-bold mt-0.5 text-black">kzora.co</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Print Specific CSS Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-container {
            width: ${printMode === 'thermal10cm' ? '100mm' : '100%'} !important;
            max-width: ${printMode === 'thermal10cm' ? '100mm' : '100%'} !important;
            margin: 0 auto !important;
            padding: ${printMode === 'thermal10cm' ? '0' : '8mm'} !important;
            gap: 0 !important;
          }
          .receipt {
            box-shadow: none !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: ${printMode === 'thermal10cm' ? '100mm' : '100%'} !important;
            border-width: 2px !important;
            border-color: black !important;
          }
          .receipt:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          @page {
            size: ${printMode === 'thermal10cm' ? '100mm 150mm' : 'A4'};
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  )
}
