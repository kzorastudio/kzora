'use client'

import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react'

interface DeleteOrderModalProps {
  orderNumber: string
  onClose: () => void
  onMarkReturned: () => void
  onDeleteOnly: () => void
  loading?: boolean
  // Ghost/reservation order — it never deducted stock, so "restore" must be hidden
  // (restoring would inflate inventory with quantities that were never taken).
  isReservation?: boolean
}

export default function DeleteOrderModal({
  orderNumber,
  onClose,
  onMarkReturned,
  onDeleteOnly,
  loading = false,
  isReservation = false,
}: DeleteOrderModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <RotateCcw size={16} className="text-primary" />
            </div>
            <span className="text-base font-arabic font-semibold text-on-surface">
              إلغاء ومرتجع / حذف الطلب
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3.5">
          <p className="text-sm font-arabic text-on-surface-variant leading-relaxed">
            الطلب رقم <span className="font-semibold text-primary font-label">{orderNumber}</span>:
            {isReservation ? ' هذا طلب حجز لم يُخصم من المخزون، لذا سيُحذف دون تأثير على الجرد.' : ' اختر الإجراء المناسب:'}
          </p>

          {/* Option 1 — Mark as Returned (Restores stock & keeps customer data) */}
          {!isReservation && (
            <button
              onClick={onMarkReturned}
              disabled={loading}
              className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                <RotateCcw size={16} className="text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-arabic font-bold text-primary">
                  ملغي مرتجع (إرجاع للمخزون وحفظ بيانات الزبون)
                </span>
                <span className="text-xs font-arabic text-secondary leading-relaxed">
                  يتم تحويل حالة الطلب إلى <strong>«ملغي مرتجع»</strong> وإعادة الكميات تلقائياً إلى المخزون، مع <strong>بقاء بيانات الزبون وسجل الطلب بالكامل</strong>.
                </span>
              </div>
            </button>
          )}

          {/* Option 2 — Delete only */}
          <button
            onClick={onDeleteOnly}
            disabled={loading}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-error-container/30 flex items-center justify-center">
              <Trash2 size={16} className="text-error" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-arabic font-semibold text-on-surface">
                حذف الطلب نهائياً
              </span>
              <span className="text-xs font-arabic text-secondary leading-relaxed">
                يتم مسح الطلب نهائياً من قاعدة البيانات (تضيع بيانات الزبون) دون أي تأثير على المخزون.
              </span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-arabic text-secondary hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
