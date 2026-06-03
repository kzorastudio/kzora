'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Search, Package, CheckCircle2, XCircle } from 'lucide-react'
import StatusBadge from '@/components/admin/StatusBadge'
import AdminHeader from '@/components/admin/AdminHeader'
import { ORDER_STATUS_OPTIONS, ADMIN_ITEMS_PER_PAGE } from '@/lib/constants'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import type { Order, OrderStatus, StaffOrderStat } from '@/types'

export default function StaffOrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isEmployee = session?.user?.role === 'employee'

  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<StaffOrderStat[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const fetchOrders = useCallback(async (p: number, status: string, q: string, employee: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(ADMIN_ITEMS_PER_PAGE) })
      if (status) params.set('status', status)
      if (q) params.set('search', q)
      if (employee) params.set('employee', employee)
      const res = await fetch(`/api/admin/staff-orders?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch {
      toast.error('تعذر تحميل الطلبيات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders(page, statusFilter, search, employeeFilter) }, [fetchOrders, page, statusFilter, search, employeeFilter])

  useEffect(() => {
    fetch('/api/admin/staff-orders/stats')
      .then((r) => (r.ok ? r.json() : { stats: [] }))
      .then((d) => setStats(d.stats ?? []))
      .catch(() => {})
  }, [])

  // For an employee, their own aggregate is the single (or first) stat row.
  const myStat = isEmployee ? stats[0] : null
  const grandTotal = stats.reduce<StaffOrderStat | null>((acc, s) => {
    if (!acc) return { ...s, admin_id: '', admin_name: 'الإجمالي' }
    return {
      ...acc,
      total_orders: acc.total_orders + s.total_orders,
      delivered_orders: acc.delivered_orders + s.delivered_orders,
      cancelled_orders: acc.cancelled_orders + s.cancelled_orders,
      total_sales_syp: acc.total_sales_syp + s.total_sales_syp,
      total_sales_usd: acc.total_sales_usd + s.total_sales_usd,
    }
  }, null)
  // Cards reflect: employee's own (employee view), the selected employee (when filtered), else the grand total.
  const selectedStat = employeeFilter ? stats.find((s) => s.admin_id === employeeFilter) ?? null : null
  const totalAll = isEmployee ? myStat : (selectedStat ?? grandTotal)

  const FIELD = 'rounded-xl border border-outline-variant/50 bg-white px-3 py-2 text-sm font-arabic text-on-surface focus:outline-none focus:border-primary/60 transition'

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />
      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5">
      <div className="flex items-center justify-end">
        <Link
          href="/admin/staff-orders/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-bold hover:bg-primary/90 transition"
        >
          <Plus size={16} /> إنشاء طلبية جديدة
        </Link>
      </div>

      {/* Stats scope label (super_admin) */}
      {!isEmployee && (
        <div className="flex items-center gap-2 -mb-1">
          <span className="text-sm font-arabic font-bold text-on-surface">
            {selectedStat ? `إحصائيات: ${selectedStat.admin_name}` : 'الإحصائيات العامة'}
          </span>
          {selectedStat && (
            <button
              onClick={() => { setEmployeeFilter(''); setPage(1) }}
              className="text-xs font-arabic text-primary hover:underline"
            >
              عرض الكل
            </button>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Package size={18} />} label="إجمالي الطلبيات" value={totalAll?.total_orders ?? 0} color="text-primary bg-primary/10" />
        <StatCard icon={<CheckCircle2 size={18} />} label="تم التوصيل" value={totalAll?.delivered_orders ?? 0} color="text-green-600 bg-green-50" />
        <StatCard icon={<XCircle size={18} />} label="ملغية" value={totalAll?.cancelled_orders ?? 0} color="text-red-600 bg-red-50" />
        {!isEmployee && !selectedStat && (
          <StatCard icon={<Package size={18} />} label="عدد الموظفين" value={stats.length} color="text-amber-600 bg-amber-50" />
        )}
        {!isEmployee && selectedStat && (
          <StatCard icon={<Package size={18} />} label="المبيعات (ل.س)" value={selectedStat.total_sales_syp} color="text-amber-600 bg-amber-50" />
        )}
      </div>

      {/* super_admin: per-employee breakdown */}
      {!isEmployee && stats.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20">
          <h2 className="text-sm font-arabic font-bold text-on-surface mb-3">أداء الموظفين</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-secondary font-arabic text-xs border-b border-outline-variant/30">
                  <th className="text-right py-2 px-2">الموظف</th>
                  <th className="text-right py-2 px-2">الطلبات</th>
                  <th className="text-right py-2 px-2">مسلّمة</th>
                  <th className="text-right py-2 px-2">ملغية</th>
                  <th className="text-right py-2 px-2">المبيعات (ل.س)</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr
                    key={s.admin_id}
                    onClick={() => { setEmployeeFilter(employeeFilter === s.admin_id ? '' : s.admin_id); setPage(1) }}
                    className={cn(
                      'border-b border-outline-variant/10 last:border-0 cursor-pointer transition-colors',
                      employeeFilter === s.admin_id ? 'bg-primary/10' : 'hover:bg-surface-container-low/40'
                    )}
                  >
                    <td className="py-2 px-2 font-arabic font-semibold text-on-surface">{s.admin_name}</td>
                    <td className="py-2 px-2 font-label text-on-surface">{s.total_orders}</td>
                    <td className="py-2 px-2 font-label text-green-600">{s.delivered_orders}</td>
                    <td className="py-2 px-2 font-label text-red-600">{s.cancelled_orders}</td>
                    <td className="py-2 px-2 font-label text-on-surface">{s.total_sales_syp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }}
          className="flex items-center gap-2 flex-1"
        >
          <div className="relative flex items-center flex-1">
            <Search size={15} className="absolute right-3 text-secondary pointer-events-none" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="بحث برقم أو اسم أو هاتف..." className={`${FIELD} pr-9 w-full`} />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-surface-container text-sm font-arabic">بحث</button>
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className={`${FIELD} sm:min-w-[150px]`}>
          <option value="">كل الحالات</option>
          {ORDER_STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        {/* Employee filter — super_admin only */}
        {!isEmployee && stats.length > 0 && (
          <select value={employeeFilter} onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1) }} className={`${FIELD} sm:min-w-[170px]`}>
            <option value="">كل الموظفين</option>
            {stats.map((s) => <option key={s.admin_id} value={s.admin_id}>{s.admin_name}</option>)}
          </select>
        )}
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-ambient animate-pulse h-24" />
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-sm font-arabic text-secondary shadow-ambient">لا توجد طلبيات</div>
        ) : orders.map((o) => (
          <div
            key={o.id}
            onClick={() => router.push(`/admin/orders/${o.id}`)}
            className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 cursor-pointer active:bg-surface-container transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-label font-bold text-primary">{o.order_number}</span>
              <StatusBadge status={o.status as OrderStatus} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-arabic font-semibold text-on-surface">{o.customer_full_name}</span>
              <span className="text-xs font-label text-secondary" dir="ltr">{o.customer_phone}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary font-arabic">
              <span className="font-label font-semibold text-on-surface text-sm">
                {o.currency_used === 'USD' ? formatPrice(o.total_usd, 'USD') : formatPrice(o.total_syp, 'SYP')}
              </span>
              <span>{o.customer_governorate}</span>
              <span>{formatDate(o.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden md:block bg-white rounded-2xl shadow-ambient border border-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-outline-variant/40">
                {['رقم الطلب', 'العميل', 'المحافظة', 'الإجمالي', 'الحالة', 'التاريخ'].map((c) => (
                  <th key={c} className="px-4 py-3 text-right text-xs font-arabic font-semibold text-secondary whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/20"><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-surface-container-high animate-pulse rounded w-3/4" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-sm font-arabic text-secondary">لا توجد طلبيات</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} className="border-b border-outline-variant/20 last:border-0 cursor-pointer hover:bg-surface-container-low/30 transition">
                    <td className="px-4 py-3 text-sm font-label font-semibold text-primary whitespace-nowrap">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-arabic font-medium text-on-surface">{o.customer_full_name}</span>
                        <span className="text-xs font-label text-secondary" dir="ltr">{o.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-arabic text-on-surface whitespace-nowrap">{o.customer_governorate}</td>
                    <td className="px-4 py-3 text-sm font-label font-semibold text-on-surface whitespace-nowrap">
                      {o.currency_used === 'USD' ? formatPrice(o.total_usd, 'USD') : formatPrice(o.total_syp, 'SYP')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={o.status as OrderStatus} /></td>
                    <td className="px-4 py-3 text-sm font-arabic text-secondary whitespace-nowrap">{formatDate(o.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={cn('px-3 py-1.5 rounded-lg text-sm', page <= 1 ? 'text-secondary/40' : 'hover:bg-surface-container')}>السابق</button>
          <span className="text-sm font-arabic text-secondary">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={cn('px-3 py-1.5 rounded-lg text-sm', page >= totalPages ? 'text-secondary/40' : 'hover:bg-surface-container')}>التالي</button>
        </div>
      )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-ambient border border-outline-variant/20 flex items-center gap-3">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', color)}>{icon}</div>
      <div>
        <p className="text-xl font-label font-black text-on-surface">{value}</p>
        <p className="text-xs font-arabic text-secondary">{label}</p>
      </div>
    </div>
  )
}
