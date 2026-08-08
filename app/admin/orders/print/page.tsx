'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Printer, CheckCircle2, XCircle, Loader2, Tag, FileText } from 'lucide-react'
import type { OrderFull } from '@/types'
import { LabelPage, ReceiptBody, LABEL_W_MM, LABEL_H_MM, LABEL_PAD_MM } from './ReceiptLabel'

type PrintMode = 'label' | 'a4'

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PrintPreparationPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderFull[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [ids, setIds] = useState<string[]>([])
  const [printMode, setPrintMode] = useState<PrintMode>('label')

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

  // Chrome prints the document title in the header when headers/footers are on.
  // Keep it short and meaningful instead of "كزورا — لوحة التحكم".
  useEffect(() => {
    const previous = document.title
    document.title = 'KZORA'
    return () => {
      document.title = previous
    }
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

  const isLabel = printMode === 'label'

  return (
    <div dir="rtl" className="print-root bg-gray-200 min-h-screen text-black">
      {/* Control Bar — screen only */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-300 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-arabic font-black text-gray-900">
            تجهيز طباعة {orders.length} طلب — {orders.length} ملصق بالضبط
          </span>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-300">
            <button
              onClick={() => setPrintMode('label')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic font-bold transition ${
                isLabel ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag size={14} />
              ملصق حراري 10×15 (Xprinter)
            </button>
            <button
              onClick={() => setPrintMode('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic font-bold transition ${
                !isLabel ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={14} />
              ورق A4
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

      {/* Screen helper note */}
      <div className="no-print max-w-4xl mx-auto px-4 pt-3 pb-1">
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-arabic text-amber-900 leading-relaxed">
          💡 <b>إعدادات نافذة الطباعة (Xprinter XP-480B — لصاقة 10×15):</b>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>
              الوجهة: <b>Xprinter XP-480B</b>
            </li>
            <li>
              حجم الورق: <b>100mm x 150mm</b>
            </li>
            <li>
              الهوامش: <b>بدون هوامش</b> — تغيير الحجم: <b>افتراضي (100%)</b> وليس «التلقائي»
            </li>
            <li>
              من «إعدادات إضافية» ألغِ تفعيل <b>الرؤوس والتذييلات</b> إن ظهر الخيار
            </li>
            <li>
              كل طلب يُطبع على <b>ملصق واحد فقط</b> — يتم تصغير أو تكبير المحتوى تلقائياً ليملأ اللصاقة
              (النسبة المئوية تظهر أسفل كل ملصق في المعاينة).
            </li>
          </ul>
        </div>
      </div>

      {/* Printable area */}
      {isLabel ? (
        <div className="labels-container flex flex-col items-center gap-6 py-6 print:block print:gap-0 print:py-0">
          {orders.map((o) => (
            <LabelPage key={o.id} o={o} />
          ))}
        </div>
      ) : (
        <div className="a4-container mx-auto max-w-3xl p-4 flex flex-col gap-6 print:max-w-none print:p-0 print:gap-0">
          {orders.map((o) => (
            <div
              key={o.id}
              className="a4-receipt bg-white text-black border border-gray-300 rounded-xl shadow-md p-6 print:rounded-none print:shadow-none print:border-0 print:p-[10mm]"
            >
              <ReceiptBody o={o} compact={false} />
            </div>
          ))}
        </div>
      )}

      {/* Print CSS */}
      <style jsx global>{`
        .label-page {
          box-sizing: border-box;
          width: ${LABEL_W_MM}mm;
          height: ${LABEL_H_MM}mm;
          padding: ${LABEL_PAD_MM}mm;
          overflow: hidden;
          background: #fff;
        }

        /* Screen-only framing so the preview looks like a real label */
        @media screen {
          .label-page {
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
            outline: 1px solid #cbd5e1;
          }
        }

        @media print {
          .no-print,
          [data-admin-chrome] {
            display: none !important;
          }
          aside,
          header,
          nav[role='navigation'] {
            display: none !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            width: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            max-width: none !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          .print-root {
            background: #fff !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .labels-container,
          .a4-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            width: auto !important;
            max-width: none !important;
          }

          .label-page {
            outline: none !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .a4-receipt {
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* No trailing blank label/sheet after the last order. */
          .label-page:last-child,
          .a4-receipt:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          @page {
            size: ${isLabel ? `${LABEL_W_MM}mm ${LABEL_H_MM}mm` : 'A4'};
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
