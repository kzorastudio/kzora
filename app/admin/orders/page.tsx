'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import OrderTable from '@/components/admin/OrderTable'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { ORDER_STATUS_OPTIONS } from '@/lib/constants'
import { ADMIN_ITEMS_PER_PAGE } from '@/lib/constants'
import type { Order, OrderStatus } from '@/types'

interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchOrders = useCallback(async (p: number, status: string, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:  String(p),
        limit: String(ADMIN_ITEMS_PER_PAGE),
      })
      if (status) params.set('status', status)
      if (q)      params.set('search', q)

      const res = await fetch(`/api/orders?${params.toString()}`)
      if (!res.ok) throw new Error('فشل تحميل الطلبات')

      const data: OrdersResponse = await res.json()
      setOrders(data.orders ?? [])
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch {
      toast.error('حدث خطأ أثناء تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(page, statusFilter, search)
  }, [fetchOrders, page, statusFilter, search])

  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    )
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('فشل تحديث الحالة')
      toast.success('تم تحديث حالة الطلب')
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحالة')
      // Revert
      fetchOrders(page, statusFilter, search)
    }
  }

  async function handleDeleteOrder(id: string, restoreStock: boolean) {
    try {
      const url = restoreStock
        ? `/api/orders/${id}?restore_stock=true`
        : `/api/orders/${id}`

      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error()

      toast.success(
        restoreStock
          ? 'تم حذف الطلب وإرجاع الكميات إلى المخزون'
          : 'تم حذف الطلب بنجاح'
      )
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch {
      toast.error('فشل حذف الطلب، يرجى المحاولة مرة أخرى')
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function handleStatusFilter(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  function handlePageChange(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const FIELD_CLASS =
    'rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5">


        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:flex-none">
            <div className="relative flex items-center flex-1 sm:flex-none">
              <Search size={15} className="absolute right-3 text-secondary pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="البحث برقم طلب أو اسم أو هاتف..."
                className={`${FIELD_CLASS} pr-9 w-full sm:w-64`}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-surface-container text-sm font-arabic text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            >
              بحث
            </button>
          </form>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className={`${FIELD_CLASS} w-full sm:w-auto sm:min-w-[160px]`}
          >
            <option value="">كل الحالات</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('')
                setSearchInput('')
                setStatusFilter('')
                setPage(1)
              }}
              className="px-4 py-2 rounded-xl text-sm font-arabic text-secondary hover:text-error hover:bg-error-container/20 transition-colors"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Order table */}
        <OrderTable
          orders={orders}
          onStatusChange={handleStatusChange}
          onDeleteOrder={handleDeleteOrder}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
    </div>
  )
}
