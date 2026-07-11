'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import AdminHeader from '@/components/admin/AdminHeader'
import OrderTable from '@/components/admin/OrderTable'
import { Search, Printer, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ORDER_STATUS_OPTIONS } from '@/lib/constants'
import { ADMIN_ITEMS_PER_PAGE } from '@/lib/constants'
import type { Order, OrderStatus } from '@/types'

interface OrdersResponse {
  orders: Order[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

interface EmployeeRef { id: string; name: string; role: string }
interface ShippingMethodRef { slug: string; name: string }

export default function OrdersPage() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'super_admin'

  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [printedFilter, setPrintedFilter] = useState('')   // '', 'true', 'false'
  const [sourceFilter, setSourceFilter]   = useState('')    // '', 'store', 'staff', or employee id
  const [companyFilter, setCompanyFilter] = useState('')    // '', 'delivery', or shipping company slug
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [employees, setEmployees] = useState<EmployeeRef[]>([])
  const [companies, setCompanies] = useState<ShippingMethodRef[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchOrders = useCallback(async (p: number, status: string, q: string, printed: string, source: string, company: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(ADMIN_ITEMS_PER_PAGE) })
      if (status)  params.set('status', status)
      if (q)       params.set('search', q)
      if (printed) params.set('printed', printed)
      if (source)  params.set('source', source)
      if (company) params.set('company', company)

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
    fetchOrders(page, statusFilter, search, printedFilter, sourceFilter, companyFilter)
  }, [fetchOrders, page, statusFilter, search, printedFilter, sourceFilter, companyFilter])

  // Load employees for the source filter (super_admin only)
  useEffect(() => {
    if (!isSuperAdmin) return
    fetch('/api/admin/employees')
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((d) => setEmployees(d.employees ?? []))
      .catch(() => {})
  }, [isSuperAdmin])

  // Load shipping companies for the company filter
  useEffect(() => {
    fetch('/api/shipping')
      .then((r) => (r.ok ? r.json() : { methods: [] }))
      .then((d) => setCompanies((d.methods ?? []).map((m: any) => ({ slug: m.slug, name: m.name }))))
      .catch(() => {})
  }, [])

  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم تحديث حالة الطلب')
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحالة')
      fetchOrders(page, statusFilter, search, printedFilter, sourceFilter, companyFilter)
    }
  }

  async function handleDeleteOrder(id: string, restoreStock: boolean) {
    try {
      const url = restoreStock ? `/api/orders/${id}?restore_stock=true` : `/api/orders/${id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(restoreStock ? 'تم حذف الطلب وإرجاع الكميات' : 'تم حذف الطلب بنجاح')
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch {
      toast.error('فشل حذف الطلب')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = orders.every((o) => next.has(o.id))
      if (allSelected) orders.forEach((o) => next.delete(o.id))
      else orders.forEach((o) => next.add(o.id))
      return next
    })
  }

  function handlePrintSelected() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { toast.error('حدد طلباً واحداً على الأقل'); return }
    sessionStorage.setItem('print_order_ids', JSON.stringify(ids))
    window.open('/admin/orders/print', '_blank')
  }

  const FIELD_CLASS =
    'rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition'

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }} className="flex items-center gap-2 flex-1 sm:flex-none">
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
            <button type="submit" className="px-4 py-2 rounded-xl bg-surface-container text-sm font-arabic text-on-surface hover:bg-surface-container-high transition-colors shrink-0">بحث</button>
          </form>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className={`${FIELD_CLASS} w-full sm:w-auto sm:min-w-[150px]`}>
            <option value="">كل الحالات</option>
            {ORDER_STATUS_OPTIONS.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>

          <select value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); setPage(1) }} className={`${FIELD_CLASS} w-full sm:w-auto sm:min-w-[160px]`}>
            <option value="">الشركة: الكل</option>
            <option value="delivery">توصيل عادي (حلب)</option>
            {companies.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>

          {isSuperAdmin && (
            <>
              <select value={printedFilter} onChange={(e) => { setPrintedFilter(e.target.value); setPage(1) }} className={`${FIELD_CLASS} w-full sm:w-auto sm:min-w-[140px]`}>
                <option value="">الطباعة: الكل</option>
                <option value="false">غير مطبوع</option>
                <option value="true">مطبوع</option>
              </select>

              <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }} className={`${FIELD_CLASS} w-full sm:w-auto sm:min-w-[160px]`}>
                <option value="">المصدر: الكل</option>
                <option value="store">طلبات المتجر</option>
                <option value="staff">طلبيات الموظفين</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </>
          )}

          {(search || statusFilter || printedFilter || sourceFilter || companyFilter) && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setPrintedFilter(''); setSourceFilter(''); setCompanyFilter(''); setPage(1) }}
              className="px-4 py-2 rounded-xl text-sm font-arabic text-secondary hover:text-error hover:bg-error-container/20 transition-colors"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Bulk action bar (super_admin) */}
        {isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-2.5 border border-outline-variant/20">
            <button onClick={selectAllOnPage} className="text-xs font-arabic text-secondary hover:text-on-surface transition">
              {orders.length > 0 && orders.every((o) => selectedIds.has(o.id)) ? 'إلغاء تحديد الصفحة' : 'تحديد كل الصفحة'}
            </button>
            <span className="text-xs font-arabic text-secondary">محدد: {selectedIds.size}</span>
            {selectedIds.size > 0 && (
              <button onClick={() => setSelectedIds(new Set())} className="text-xs font-arabic text-secondary hover:text-error flex items-center gap-1 transition">
                <X size={12} /> مسح التحديد
              </button>
            )}
            <button
              onClick={handlePrintSelected}
              disabled={selectedIds.size === 0}
              className="mr-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-arabic font-bold hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Printer size={16} /> طباعة الفواتير المحددة ({selectedIds.size})
            </button>
          </div>
        )}

        <OrderTable
          orders={orders}
          onStatusChange={handleStatusChange}
          onDeleteOrder={handleDeleteOrder}
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          loading={loading}
          selectable={isSuperAdmin}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      </div>
    </div>
  )
}
