'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import { ORDER_STATUS_OPTIONS } from '@/lib/constants'
import { formatDate, formatPrice } from '@/lib/utils'
import StatusBadge from './StatusBadge'
import DeleteOrderModal from './DeleteOrderModal'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const SHIPPING_DISPLAY: Record<string, string> = {
  karam:   'كرم',
  qadmous: 'قدموس',
  masarat: 'مسارات',
  delivery: 'توصيل عادي (حلب)',
  shipping: 'شحن شركات',
}

interface OrderTableProps {
  orders: Order[]
  onStatusChange: (id: string, status: OrderStatus) => void
  onDeleteOrder: (id: string, restoreStock: boolean) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
}

export default function OrderTable({
  orders,
  onStatusChange,
  onDeleteOrder,
  page,
  totalPages,
  onPageChange,
  loading = false,
}: OrderTableProps) {
  const router = useRouter()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; orderNumber: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function handleRowClick(id: string) {
    router.push(`/admin/orders/${id}`)
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>, orderId: string) {
    e.stopPropagation()
    onStatusChange(orderId, e.target.value as OrderStatus)
  }

  function openDeleteModal(e: React.MouseEvent, order: Order) {
    e.stopPropagation()
    setPendingDelete({ id: order.id, orderNumber: order.order_number })
  }

  async function handleDeleteOnly() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    await onDeleteOrder(pendingDelete.id, false)
    setDeleteLoading(false)
    setPendingDelete(null)
  }

  async function handleDeleteAndRestore() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    await onDeleteOrder(pendingDelete.id, true)
    setDeleteLoading(false)
    setPendingDelete(null)
  }

  const Pagination = () => totalPages > 1 ? (
    <div className="flex items-center justify-between px-1">
      <span className="text-sm font-arabic text-secondary">صفحة {page} من {totalPages}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn('h-8 w-8 flex items-center justify-center rounded-xl text-sm transition-colors', page <= 1 ? 'text-secondary/40 cursor-not-allowed' : 'text-on-surface hover:bg-surface-container')}
        >
          <ChevronRight size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let p = i + 1
          if (totalPages > 5) {
            if (page <= 3) p = i + 1
            else if (page >= totalPages - 2) p = totalPages - 4 + i
            else p = page - 2 + i
          }
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={cn('h-8 w-8 flex items-center justify-center rounded-xl text-sm font-label transition-colors', p === page ? 'bg-primary text-white font-semibold' : 'text-on-surface hover:bg-surface-container')}
            >{p}</button>
          )
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn('h-8 w-8 flex items-center justify-center rounded-xl text-sm transition-colors', page >= totalPages ? 'text-secondary/40 cursor-not-allowed' : 'text-on-surface hover:bg-surface-container')}
        >
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  ) : null

  return (
    <div dir="rtl" className="flex flex-col gap-4">

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <DeleteOrderModal
          orderNumber={pendingDelete.orderNumber}
          loading={deleteLoading}
          onClose={() => { if (!deleteLoading) setPendingDelete(null) }}
          onDeleteOnly={handleDeleteOnly}
          onDeleteAndRestore={handleDeleteAndRestore}
        />
      )}

      {/* ── MOBILE CARDS ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient animate-pulse h-24" />
          ))
        ) : orders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 text-center text-sm font-arabic text-secondary shadow-ambient">
            لا توجد طلبات
          </div>
        ) : orders.map((order) => (
          <div
            key={order.id}
            onClick={() => handleRowClick(order.id)}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient border border-outline-variant/20 cursor-pointer active:bg-surface-container transition-colors"
          >
            {/* Row 1: order number + status */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-label font-bold text-primary">{order.order_number}</span>
              <StatusBadge status={order.status} />
            </div>
            {/* Row 2: customer */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-arabic font-semibold text-on-surface">{order.customer_full_name}</span>
              <span className="text-xs font-label text-secondary" dir="ltr">{order.customer_phone}</span>
            </div>
            {/* Row 3: total + governorate + date */}
            <div className="flex items-center justify-between text-xs text-secondary font-arabic mt-1">
              <span className="font-label font-semibold text-on-surface text-sm">
                {order.currency_used === 'USD' ? formatPrice(order.total_usd, 'USD') : formatPrice(order.total_syp, 'SYP')}
              </span>
              <span>{order.customer_governorate}</span>
              <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-0.5 rounded-lg border border-outline-variant/30 text-[10px] font-arabic font-bold text-on-surface-variant">
                <span>{order.payment_method === 'sham_cash' ? '📱 شام كاش' : '💵 عند الاستلام'}</span>
              </div>
              <span>{formatDate(order.created_at)}</span>
            </div>
            {/* Row 4: status change + delete */}
            <div className="mt-3 pt-3 border-t border-outline-variant/20 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e, order.id)}
                className="flex-1 text-sm font-arabic bg-surface-container rounded-xl border border-outline-variant/50 px-3 py-2 text-on-surface focus:outline-none focus:border-primary/60 cursor-pointer transition"
              >
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              
              <button
                onClick={(e) => openDeleteModal(e, order)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-error-container/30 text-error hover:bg-error-container/50 transition-colors"
                title="حذف الطلب"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden md:block bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-outline-variant/40">
                {['رقم الطلب','العميل','المحافظة','الإجمالي','الدفع','شركة الشحن','الحالة','التاريخ','الإجراءات'].map((col) => (
                  <th key={col} className="px-4 py-3 text-right text-xs font-arabic font-semibold text-secondary uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/20 last:border-0">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-surface-container-high animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm font-arabic text-secondary">لا توجد طلبات</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} onClick={() => handleRowClick(order.id)}
                    className="border-b border-outline-variant/20 last:border-0 cursor-pointer transition-colors hover:bg-surface-container-low/30"
                  >
                    <td className="px-4 py-3 text-sm font-label font-semibold text-primary whitespace-nowrap">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-arabic font-medium text-on-surface leading-tight">{order.customer_full_name}</span>
                        <span className="text-xs font-label text-secondary mt-0.5" dir="ltr">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-arabic text-on-surface whitespace-nowrap">{order.customer_governorate}</td>
                    <td className="px-4 py-3 text-sm font-label font-semibold text-on-surface whitespace-nowrap">
                      {order.currency_used === 'USD' ? formatPrice(order.total_usd, 'USD') : formatPrice(order.total_syp, 'SYP')}
                    </td>
                    <td className="px-4 py-3 text-sm font-arabic text-on-surface whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold",
                        order.payment_method === 'sham_cash' 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      )}>
                        {order.payment_method === 'sham_cash' ? '📱 شام كاش' : '💵 عند الاستلام'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-arabic text-on-surface-variant whitespace-nowrap">
                      {order.delivery_type === 'delivery' 
                        ? '🚀 توصيل عادي (حلب)'
                        : (SHIPPING_DISPLAY[order.shipping_company!] || order.shipping_company || 'شحن للمحافظات')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-sm font-arabic text-secondary whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <select value={order.status} onChange={(e) => handleStatusChange(e, order.id)}
                          className="text-xs font-arabic bg-surface-container rounded-lg border border-outline-variant/50 px-2 py-1.5 text-on-surface focus:outline-none cursor-pointer transition flex-1 min-w-[100px]"
                        >
                          {ORDER_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => openDeleteModal(e, order)}
                          className="p-1.5 rounded-lg bg-error-container/20 text-error hover:bg-error-container/40 transition-colors"
                          title="حذف الطلب"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination />
    </div>
  )
}
