'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Printer, CheckCircle2, XCircle, Loader2, Tag, FileText, RefreshCw } from 'lucide-react'
import type { OrderFull } from '@/types'
import { LabelPage, ReceiptBody, isElectroOrder, LABEL_W_MM, LABEL_H_MM, LABEL_PAD_MM } from './ReceiptLabel'

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

  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [printing, setPrinting] = useState(false)
  // Orders that were picked but can't be printed any more (deleted after a merge, or cancelled).
  const [skipped, setSkipped] = useState<{ missing: number; cancelled: string[] }>({ missing: 0, cancelled: [] })
  const idsRef = useRef<string[]>([])

  // Always print what is in the database *now*. This tab can sit open for a long
  // time (phones keep it in the background), and an order edited or merged in the
  // meantime used to come out of the PDF in its old form.
  const loadOrders = useCallback(async (silent = false): Promise<boolean> => {
    const wanted = idsRef.current
    if (wanted.length === 0) return false
    if (silent) setRefreshing(true)
    try {
      const res = await fetch(`/api/admin/orders/print-data?t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: wanted }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      const all: OrderFull[] = d.orders ?? []
      const cancelled = all.filter((o) => o.status === 'cancelled')
      setOrders(all.filter((o) => o.status !== 'cancelled'))
      setSkipped({ missing: Math.max(0, wanted.length - all.length), cancelled: cancelled.map((o) => o.order_number) })
      setLoadedAt(new Date())
      return true
    } catch {
      toast.error('تعذر تحميل بيانات الطباعة')
      return false
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

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
    idsRef.current = stored
    setIds(stored)
    loadOrders()
  }, [loadOrders])

  // Coming back to this tab (or the browser restoring it from memory) reloads the data.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadOrders(true) }
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) loadOrders(true) }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onShow)
    }
  }, [loadOrders])

  async function handlePrint() {
    if (printing) return
    setPrinting(true)
    const ok = await loadOrders(true)
    if (!ok) { setPrinting(false); return }
    // Let React paint the fresh labels (and their auto-fit scale) before the dialog opens.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150))))
    setPrinting(false)
    window.print()
  }

  // Chrome prints the document title in the header when headers/footers are on.
  // Keep it short and meaningful instead of "كزورا — لوحة التحكم".
  useEffect(() => {
    const previous = document.title
    const hasElectro = orders.some(isElectroOrder)
    document.title = hasElectro && orders.length === 1 ? 'ELECTRO STORE' : 'KZORA'
    return () => {
      document.title = previous
    }
  }, [orders])

  async function handleConfirm() {
    if (ids.length === 0 || orders.length === 0) return
    setConfirming(true)
    try {
      const res = await fetch('/api/admin/orders/bulk-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only what was actually on the labels — not deleted or cancelled picks.
        body: JSON.stringify({ ids: orders.map((o) => o.id) }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json().catch(() => ({}))
      toast.success(
        data.shipped > 0
          ? `تم حفظ الطباعة، وتحويل ${data.shipped} طلب إلى «تم الشحن»`
          : 'تم حفظ حالة الطباعة بنجاح'
      )
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
            onClick={() => loadOrders(true)}
            disabled={refreshing || printing}
            title="جلب آخر نسخة من الطلبات"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-800 text-sm font-arabic font-bold hover:bg-gray-200 transition disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> تحديث
          </button>
          <button
            onClick={handlePrint}
            disabled={printing || orders.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-arabic font-bold hover:bg-blue-700 shadow-sm transition disabled:opacity-60"
          >
            {printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} بدء الطباعة الأن
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
      <div className="no-print max-w-4xl mx-auto px-4 pt-3 pb-1 flex flex-col gap-2">
        {loadedAt && (
          <div className="p-2.5 bg-green-50 border border-green-300 rounded-xl text-xs font-arabic text-green-900">
            ✅ البيانات محدّثة من النظام الساعة{' '}
            <b dir="ltr">{loadedAt.toLocaleTimeString('en-GB', { timeZone: 'Asia/Damascus' })}</b>
            {' '}— وبتتحدث تلقائياً قبل كل طباعة أو حفظ PDF.
          </div>
        )}
        {(skipped.missing > 0 || skipped.cancelled.length > 0) && (
          <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs font-arabic text-red-900 leading-relaxed">
            ⚠️ تم استبعاد طلبات من الطباعة:
            {skipped.missing > 0 && <> {skipped.missing} طلب محذوف (مثلاً بعد دمجه بطلب آخر).</>}
            {skipped.cancelled.length > 0 && <> طلبات ملغاة: <b dir="ltr">{skipped.cancelled.join('، ')}</b>.</>}
          </div>
        )}
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
