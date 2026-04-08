'use client'

import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react'

interface DeleteOrderModalProps {
  orderNumber: string
  onClose: () => void
  onDeleteOnly: () => void
  onDeleteAndRestore: () => void
  loading?: boolean
}

export default function DeleteOrderModal({
  orderNumber,
  onClose,
  onDeleteOnly,
  onDeleteAndRestore,
  loading = false,
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
            <div className="w-8 h-8 rounded-xl bg-error-container/40 flex items-center justify-center">
              <AlertTriangle size={16} className="text-error" />
            </div>
            <span className="text-base font-arabic font-semibold text-on-surface">
              حذف الطلب
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
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm font-arabic text-on-surface-variant leading-relaxed">
            هل تريد حذف الطلب{' '}
            <span className="font-semibold text-primary font-label">{orderNumber}</span>
            ؟ اختر أحد الخيارين:
          </p>

          {/* Option 1 — Delete only */}
          <button
            onClick={onDeleteOnly}
            disabled={loading}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-error-container/30 flex items-center justify-center">
              <Trash2 size={15} className="text-error" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-arabic font-semibold text-on-surface">
                حذف الطلب فقط
              </span>
              <span className="text-xs font-arabic text-secondary leading-relaxed">
                يتم حذف الطلب من السجلات دون أي تأثير على المخزون.
                استخدم هذا إذا كانت الكميات قد تم تعديلها يدوياً أو إذا كان الطلب وهمياً.
              </span>
            </div>
          </button>

          {/* Option 2 — Delete + restore stock */}
          <button
            onClick={onDeleteAndRestore}
            disabled={loading}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
              <RotateCcw size={15} className="text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-arabic font-semibold text-on-surface">
                حذف الطلب وإرجاع المخزون
              </span>
              <span className="text-xs font-arabic text-secondary leading-relaxed">
                يتم حذف الطلب وإعادة الكميات المطلوبة إلى المخزون تلقائياً حسب اللون والمقاس والموديل.
                استخدم هذا إذا كان الطلب حقيقياً وتم إلغاؤه.
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
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
