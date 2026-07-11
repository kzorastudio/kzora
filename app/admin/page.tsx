import { Package, ShoppingBag, Clock, AlertTriangle, TrendingUp, Info, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import DashboardOverview from '@/components/admin/DashboardOverview'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import StatsCard from '@/components/admin/StatsCard'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDate, formatPrice, getSyriaDateParts, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

async function getDashboardStats() {
  const now = new Date()
  const { year, month, day } = getSyriaDateParts(now)
  
  // Syria is UTC+3. Start of day in Syria is 00:00:00 local time, which is 21:00:00 UTC the previous day.
  const todayStartUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  todayStartUTC.setUTCHours(todayStartUTC.getUTCHours() - 3)
  const todayStart = todayStartUTC.toISOString()

  const last15m = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { count: confirmedOrders },
    { count: deliveredOrders },
    { count: lowStockProducts },
    { data: allOrdersData },
    { data: visitsData },
  ] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).in('stock_status', ['low_stock', 'out_of_stock']),
    // Fetch all active/delivered/pending orders to compute timeframes in-memory
    supabaseAdmin.from('orders').select('total_syp, total_usd, status, created_at').limit(100000),
    // Fetch last 30 days visits in one query (prevent the 1000 postgrest limit cap)
    supabaseAdmin.from('site_visits').select('session_id, visited_at').gte('visited_at', last30d).limit(100000),
  ])

  const allOrders = allOrdersData || []
  const visits = visitsData || []

  // Filter function for visits
  const filterVisits = (since: Date) => visits.filter(v => new Date(v.visited_at) >= since)

  const activeNowVisits = filterVisits(new Date(now.getTime() - 15 * 60 * 1000))
  const todayVisits = filterVisits(new Date(todayStart))
  const last7dVisits = filterVisits(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
  const last30dVisits = visits

  // Unique session counters
  const uniqueNow = new Set(activeNowVisits.map(v => v.session_id)).size
  const uniqueToday = new Set(todayVisits.map(v => v.session_id)).size
  const unique7d = new Set(last7dVisits.map(v => v.session_id)).size
  const unique30d = new Set(last30dVisits.map(v => v.session_id)).size

  // Helper to compute period sales & orders count
  const getPeriodStats = (since: string | null) => {
    const ordersFiltered = since 
      ? allOrders.filter(o => o.created_at >= since)
      : allOrders

    // We filter for active/delivered/pending. We exclude cancelled/failed orders.
    const activeOrders = ordersFiltered.filter(o => o.status !== 'cancelled' && o.status !== 'failed')

    const syp = activeOrders.reduce((sum, o) => sum + Number(o.total_syp), 0)
    const usd = activeOrders.reduce((sum, o) => sum + Number(o.total_usd), 0)

    return {
      syp,
      usd,
      count: activeOrders.length
    }
  }

  const todayStats = getPeriodStats(todayStart)
  const last7dStats = getPeriodStats(last7d)
  const last30dStats = getPeriodStats(last30d)
  const allTimeStats = getPeriodStats(null)

  // Calculate overall delivered revenue
  const totalRevenueSYP = allOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total_syp), 0)
  const totalRevenueUSD = allOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total_usd), 0)

  return {
    totalProducts: totalProducts ?? 0,
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    confirmedOrders: confirmedOrders ?? 0,
    deliveredOrders: deliveredOrders ?? 0,
    lowStockProducts: lowStockProducts ?? 0,
    activeNow: uniqueNow,
    revenue: {
      totalSYP: totalRevenueSYP,
      totalUSD: totalRevenueUSD
    },
    periods: {
      today: { ...todayStats, uniqueVisitors: uniqueToday },
      last7d: { ...last7dStats, uniqueVisitors: unique7d },
      last30d: { ...last30dStats, uniqueVisitors: unique30d },
      allTime: { ...allTimeStats, uniqueVisitors: unique30d }
    }
  }
}

async function getRecentOrders(): Promise<Order[]> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (data as Order[]) ?? []
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (session?.user?.role === 'employee') {
    redirect('/admin/products')
  }

  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
  ])

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-5 md:gap-8 max-w-[1600px] mx-auto w-full">
        {/* Greeting Banner */}
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-[#785600] to-[#B8860B] p-6 md:p-10 shadow-xl shadow-[#785600]/20">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl md:text-4xl font-arabic font-black text-white leading-tight">
                        أهلاً بك في كزورا 👋
                    </h2>
                    <p className="text-white/80 font-arabic text-sm md:text-base max-w-md">
                        إليك ملخص سريع لأداء متجرك اليوم. يمكنك إدارة المنتجات وتتبع الطلبات بكل سهولة.
                    </p>
                </div>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                    <Link
                        href="/admin/stats"
                        className="px-4 md:px-6 py-2.5 md:py-3 rounded-2xl bg-white text-[#785600] font-arabic font-black text-sm shadow-sm hover:bg-opacity-90 transition-all active:scale-95"
                    >
                        الإحصائيات والتحليلات 📊
                    </Link>
                    <Link
                        href="/admin/products/new"
                        className="px-4 md:px-6 py-2.5 md:py-3 rounded-2xl bg-white/10 text-white border border-white/20 font-arabic font-black text-sm hover:bg-white/25 transition-all active:scale-95"
                    >
                        إضافة منتج جديد
                    </Link>
                    <Link
                        href="/"
                        target="_blank"
                        className="px-4 md:px-6 py-2.5 md:py-3 rounded-2xl bg-black/20 text-white font-arabic font-black text-sm backdrop-blur-md border border-white/10 hover:bg-black/30 transition-all"
                    >
                        زيارة المتجر
                    </Link>
                </div>
            </div>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
        </div>

        {/* Real-time Dashboard Overview (Interactive Client Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
          <div className="lg:col-span-2 flex flex-col w-full min-w-0">
            <DashboardOverview stats={stats} />
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] rounded-3xl p-5 md:p-8 shadow-xl relative overflow-hidden group flex flex-col justify-between min-h-[200px] h-full">
             <div className="relative z-10 flex flex-col gap-1.5">
                <h3 className="text-white/60 font-arabic text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">إجمالي الأرباح المستلمة</h3>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-base sm:text-2xl md:text-3xl font-label font-black text-white">{formatPrice(stats.revenue.totalSYP, 'SYP').replace('السعر : ', '')}</span>
                  <span className="text-[10px] sm:text-sm font-label font-bold text-[#C5A059]">{formatPrice(stats.revenue.totalUSD, 'USD').replace('السعر : ', '')}</span>
                </div>
             </div>
             <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                <p className="text-white/40 text-[9px] sm:text-[10px] font-arabic leading-relaxed">
                  يتم احتساب هذه الأرباح فقط من الطلبات التي تم تعليمها كـ <span className="text-white font-bold">"تم التوصيل"</span>.
                </p>
             </div>
             <DollarSign className="absolute -bottom-6 -right-6 text-white/5 w-32 h-32 sm:w-40 sm:h-40 transform -rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatsCard
            title="إجمالي المنتجات"
            value={stats.totalProducts.toString()}
            icon={Package}
            className="border-none"
          />
          <StatsCard
            title="الطلبات الكلية"
            value={stats.totalOrders.toString()}
            subtitle={`${stats.deliveredOrders} تم توصيله | ${stats.confirmedOrders} مؤكد`}
            icon={ShoppingBag}
            className="border-none"
          />
          <StatsCard
            title="طلبات قيد الانتظار"
            value={stats.pendingOrders.toString()}
            icon={Clock}
            className="border-none"
          />
          <StatsCard
            title="تنبيه المخزون"
            value={stats.lowStockProducts.toString()}
            icon={AlertTriangle}
            className="border-none"
          />
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-[2.5rem] shadow-ambient overflow-hidden border border-outline-variant/10">
          <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10">
            <div>
                <h2 className="text-xl font-arabic font-black text-[#1A1A1A]">
                أحدث الطلبات
                </h2>
                <p className="text-xs font-arabic text-secondary mt-1">تابع آخر العمليات في متجرك</p>
            </div>
            <Link
              href="/admin/orders"
              className="px-6 py-2.5 bg-surface-container rounded-2xl text-sm font-arabic font-bold text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
            >
              عرض كل الطلبات
            </Link>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col divide-y divide-outline-variant/10 md:hidden">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="text-secondary font-arabic">لا توجد طلبات بعد</span>
              </div>
            ) : recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-[#FAF8F5] transition-colors active:bg-[#FAF8F5]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-label font-black text-primary">{order.order_number}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-arabic font-bold text-[#1A1A1A]">{order.customer_full_name}</span>
                  <span className="text-sm font-label font-bold text-[#1A1A1A]">
                    {order.currency_used === 'USD' ? formatPrice(order.total_usd, 'USD') : formatPrice(order.total_syp, 'SYP')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9E9890]">
                  <span dir="ltr">{order.customer_phone}</span>
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#FAF8F5]/50">
                  {['رقم الطلب', 'العميل', 'الإجمالي', 'الحالة', 'التاريخ'].map((col) => (
                    <th key={col} className="px-8 py-4 text-right text-[10px] font-arabic font-black text-[#9E9890] uppercase tracking-[0.15em] whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center"><span className="text-secondary font-arabic text-lg">لا توجد طلبات بعد</span></td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-8 py-5 text-sm font-label font-black text-primary whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                        <span className="underline decoration-primary/20 underline-offset-4">{order.order_number}</span>
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-arabic font-black text-[#1A1A1A] leading-none mb-1">{order.customer_full_name}</span>
                        <span className="text-[11px] font-label text-[#9E9890] font-medium" dir="ltr">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-label font-bold text-[#1A1A1A] whitespace-nowrap">
                        {order.currency_used === 'USD' ? formatPrice(order.total_usd, 'USD') : formatPrice(order.total_syp, 'SYP')}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-arabic font-bold text-[#1A1A1A]">{formatDateTime(order.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
