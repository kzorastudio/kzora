'use client'

import { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  ArrowUpRight, 
  MapPin, 
  Coins, 
  Calendar,
  RefreshCw,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  Archive,
  BarChart3,
  Percent,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { formatCurrency, STOCK_STATUS_LABELS, ORDER_STATUS_LABELS } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'

interface StatsDashboardProps {
  initialOrders: any[]
  initialOrderItems: any[]
  initialVariants: any[]
  initialProducts: any[]
}

type Timeframe = 'current_month' | 'last_month' | 'last_3_months' | 'current_year' | 'all'
type CurrencyType = 'SYP' | 'USD'

export default function StatsDashboard({
  initialOrders,
  initialOrderItems,
  initialVariants,
  initialProducts
}: StatsDashboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('current_month')
  const [currency, setCurrency] = useState<CurrencyType>('SYP')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 1. Filter orders based on timeframe
  const filteredOrders = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return initialOrders.filter(o => {
      const date = new Date(o.created_at)
      const orderYear = date.getFullYear()
      const orderMonth = date.getMonth()

      if (timeframe === 'current_month') {
        return orderYear === currentYear && orderMonth === currentMonth
      }
      if (timeframe === 'last_month') {
        const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return orderYear === targetYear && orderMonth === targetMonth
      }
      if (timeframe === 'last_3_months') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        return date >= ninetyDaysAgo
      }
      if (timeframe === 'current_year') {
        return orderYear === currentYear
      }
      return true // 'all'
    })
  }, [initialOrders, timeframe])

  // 2. Filter order items based on filtered orders
  const filteredItems = useMemo(() => {
    const activeOrderIds = new Set(filteredOrders.map(o => o.id))
    return initialOrderItems.filter(item => activeOrderIds.has(item.order_id))
  }, [initialOrderItems, filteredOrders])

  // 3. Current Month fixed stats (for reference card)
  const currentMonthStats = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const thisMonthOrders = initialOrders.filter(o => {
      const date = new Date(o.created_at)
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth && o.status !== 'cancelled'
    })

    const totalSYP = thisMonthOrders.reduce((sum, o) => sum + Number(o.total_syp), 0)
    const totalUSD = thisMonthOrders.reduce((sum, o) => sum + Number(o.total_usd), 0)

    return {
      syp: totalSYP,
      usd: totalUSD,
      count: thisMonthOrders.length
    }
  }, [initialOrders])

  // 4. Timeframe computations
  const kpiData = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled')
    
    // Total Revenue (Active Orders)
    const activeSYP = activeOrders.reduce((sum, o) => sum + Number(o.total_syp), 0)
    const activeUSD = activeOrders.reduce((sum, o) => sum + Number(o.total_usd), 0)

    // Overall Revenue (All orders in period, including cancelled)
    const overallSYP = filteredOrders.reduce((sum, o) => sum + Number(o.total_syp), 0)
    const overallUSD = filteredOrders.reduce((sum, o) => sum + Number(o.total_usd), 0)

    // Total pieces sold (quantity in active order items)
    const activeOrderIds = new Set(activeOrders.map(o => o.id))
    const activeItems = filteredItems.filter(item => activeOrderIds.has(item.order_id))
    const piecesSold = activeItems.reduce((sum, item) => sum + item.quantity, 0)

    // Average Order Value (AOV)
    const orderCount = activeOrders.length
    const aovSYP = orderCount > 0 ? Math.round(activeSYP / orderCount) : 0
    const aovUSD = orderCount > 0 ? Number((activeUSD / orderCount).toFixed(2)) : 0

    // Cancelled stats
    const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length
    const cancelledRate = filteredOrders.length > 0 
      ? Math.round((cancelledCount / filteredOrders.length) * 100) 
      : 0

    return {
      revenue: {
        activeSYP,
        activeUSD,
        overallSYP,
        overallUSD
      },
      piecesSold,
      orderCount,
      aov: {
        syp: aovSYP,
        usd: aovUSD
      },
      cancelled: {
        count: cancelledCount,
        rate: cancelledRate
      }
    }
  }, [filteredOrders, filteredItems])

  // 5. Total items in stock (constant, current inventory state)
  const stockStats = useMemo(() => {
    const totalStock = initialVariants.reduce((sum, v) => sum + v.quantity, 0)
    
    // Calculate low stock products (based on product table)
    const lowStockCount = initialProducts.filter(p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock').length
    const inStockCount = initialProducts.filter(p => p.stock_status === 'in_stock').length

    return {
      totalStock,
      lowStockCount,
      inStockCount,
      totalCatalog: initialProducts.length
    }
  }, [initialVariants, initialProducts])

  // 6. Top selling products
  const topProducts = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled')
    const activeOrderIds = new Set(activeOrders.map(o => o.id))
    const activeItems = filteredItems.filter(item => activeOrderIds.has(item.order_id))

    const productMap: Record<string, { name: string; qty: number; revSYP: number; revUSD: number }> = {}

    activeItems.forEach(item => {
      const prodId = item.product_id || item.product_name
      if (!productMap[prodId]) {
        productMap[prodId] = {
          name: item.product_name,
          qty: 0,
          revSYP: 0,
          revUSD: 0
        }
      }
      productMap[prodId].qty += item.quantity
      productMap[prodId].revSYP += item.quantity * Number(item.unit_price_syp)
      productMap[prodId].revUSD += item.quantity * Number(item.unit_price_usd)
    })

    return Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6)
  }, [filteredOrders, filteredItems])

  // 7. Governorate breakdown
  const governorateStats = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled')
    const govMap: Record<string, { name: string; salesSYP: number; salesUSD: number; count: number }> = {}

    activeOrders.forEach(o => {
      const gov = o.customer_governorate || 'غير محدد'
      if (!govMap[gov]) {
        govMap[gov] = { name: gov, salesSYP: 0, salesUSD: 0, count: 0 }
      }
      govMap[gov].salesSYP += Number(o.total_syp)
      govMap[gov].salesUSD += Number(o.total_usd)
      govMap[gov].count += 1
    })

    return Object.values(govMap)
      .sort((a, b) => b.salesSYP - a.salesSYP)
      .slice(0, 6)
  }, [filteredOrders])

  // 8. Order Status breakdown
  const statusStats = useMemo(() => {
    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }

    filteredOrders.forEach(o => {
      if (o.status in statusMap) {
        statusMap[o.status] += 1
      }
    })

    return Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: filteredOrders.length > 0 ? Math.round((count / filteredOrders.length) * 100) : 0
    }))
  }, [filteredOrders])

  // 9. Currency breakdown
  const currencyStats = useMemo(() => {
    let sypCount = 0
    let usdCount = 0

    filteredOrders.forEach(o => {
      if (o.currency_used === 'USD') {
        usdCount += 1
      } else {
        sypCount += 1
      }
    })

    const total = filteredOrders.length
    return {
      syp: { count: sypCount, percentage: total > 0 ? Math.round((sypCount / total) * 100) : 0 },
      usd: { count: usdCount, percentage: total > 0 ? Math.round((usdCount / total) * 100) : 0 }
    }
  }, [filteredOrders])

  // 10. Chart data points (daily or monthly depending on timeframe)
  const chartPoints = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled')
    const now = new Date()

    if (timeframe === 'current_month' || timeframe === 'last_month') {
      let targetYear = now.getFullYear()
      let targetMonth = now.getMonth()

      if (timeframe === 'last_month') {
        targetMonth = targetMonth === 0 ? 11 : targetMonth - 1
        targetYear = targetMonth === 11 ? targetYear - 1 : targetYear
      }

      const numDays = new Date(targetYear, targetMonth + 1, 0).getDate()
      const dailyData = Array.from({ length: numDays }, (_, i) => ({
        day: i + 1,
        syp: 0,
        usd: 0
      }))

      activeOrders.forEach(o => {
        const oDate = new Date(o.created_at)
        if (oDate.getFullYear() === targetYear && oDate.getMonth() === targetMonth) {
          const d = oDate.getDate()
          if (d >= 1 && d <= numDays) {
            dailyData[d - 1].syp += Number(o.total_syp)
            dailyData[d - 1].usd += Number(o.total_usd)
          }
        }
      })

      return dailyData.map(d => ({
        label: `${d.day}/${targetMonth + 1}`,
        syp: Math.round(d.syp),
        usd: Math.round(d.usd)
      }))
    }

    if (timeframe === 'last_3_months') {
      // Group by weeks
      const numWeeks = 12
      const weeklyData = Array.from({ length: numWeeks }, (_, i) => {
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000
        const end = new Date(now.getTime() - (numWeeks - 1 - i) * oneWeekMs)
        const start = new Date(end.getTime() - oneWeekMs)
        return {
          label: `أسبوع ${i + 1}`,
          start,
          end,
          syp: 0,
          usd: 0
        }
      })

      activeOrders.forEach(o => {
        const oDate = new Date(o.created_at)
        const bucket = weeklyData.find(w => oDate >= w.start && oDate < w.end)
        if (bucket) {
          bucket.syp += Number(o.total_syp)
          bucket.usd += Number(o.total_usd)
        }
      })

      return weeklyData.map(w => ({
        label: w.label,
        syp: Math.round(w.syp),
        usd: Math.round(w.usd)
      }))
    }

    const monthNames = ['كانون 2', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين 1', 'تشرين 2', 'كانون 1']

    if (timeframe === 'current_year') {
      const targetYear = now.getFullYear()
      const monthlyData = monthNames.map((name, idx) => ({
        label: name,
        monthIdx: idx,
        syp: 0,
        usd: 0
      }))

      activeOrders.forEach(o => {
        const oDate = new Date(o.created_at)
        if (oDate.getFullYear() === targetYear) {
          const m = oDate.getMonth()
          if (m >= 0 && m < 12) {
            monthlyData[m].syp += Number(o.total_syp)
            monthlyData[m].usd += Number(o.total_usd)
          }
        }
      })

      return monthlyData.map(m => ({
        label: m.label,
        syp: Math.round(m.syp),
        usd: Math.round(m.usd)
      }))
    }

    // timeframe === 'all'
    const yearlyMonthlyMap: Record<string, { syp: number; usd: number; date: Date }> = {}
    activeOrders.forEach(o => {
      const oDate = new Date(o.created_at)
      const key = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}`
      if (!yearlyMonthlyMap[key]) {
        yearlyMonthlyMap[key] = { syp: 0, usd: 0, date: new Date(oDate.getFullYear(), oDate.getMonth(), 1) }
      }
      yearlyMonthlyMap[key].syp += Number(o.total_syp)
      yearlyMonthlyMap[key].usd += Number(o.total_usd)
    })

    const sortedKeys = Object.keys(yearlyMonthlyMap).sort().slice(-12) // Show last 12 active months
    if (sortedKeys.length === 0) {
      return monthNames.slice(0, now.getMonth() + 1).map(name => ({
        label: name,
        syp: 0,
        usd: 0
      }))
    }

    return sortedKeys.map(k => {
      const data = yearlyMonthlyMap[k]
      const month = data.date.getMonth()
      const yearShort = data.date.getFullYear() % 100
      return {
        label: `${monthNames[month]} '${yearShort}`,
        syp: Math.round(data.syp),
        usd: Math.round(data.usd)
      }
    })
  }, [filteredOrders, timeframe])

  // Custom SVG chart calculations
  const chartConfig = useMemo(() => {
    const values = chartPoints.map(pt => currency === 'SYP' ? pt.syp : pt.usd)
    const maxVal = Math.max(...values, 1000)
    
    // SVG padding and size
    const paddingLeft = 70
    const paddingRight = 20
    const paddingTop = 30
    const paddingBottom = 40
    const width = 650
    const height = 280

    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    const points = chartPoints.map((pt, idx) => {
      const val = currency === 'SYP' ? pt.syp : pt.usd
      const x = paddingLeft + (chartPoints.length > 1 ? (idx / (chartPoints.length - 1)) * chartWidth : 0)
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight
      return { x, y, label: pt.label, value: val }
    })

    // Generate SVG path for line
    let pathD = ''
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} `
      for (let i = 1; i < points.length; i++) {
        pathD += `L ${points[i].x} ${points[i].y} `
      }
    }

    // Generate area path (closing the line path to the bottom)
    let areaD = ''
    if (points.length > 0) {
      const firstX = points[0].x
      const lastX = points[points.length - 1].x
      const bottomY = paddingTop + chartHeight
      areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
    }

    return {
      points,
      pathD,
      areaD,
      maxVal,
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartWidth,
      chartHeight
    }
  }, [chartPoints, currency])

  // Handler for manual refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  // Format currency with shorthand (K for thousands, M for millions)
  const formatShorthand = (val: number) => {
    if (currency === 'USD') {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
      return `$${val}`
    } else {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)} مليون`
      if (val >= 1000) return `${(val / 1000).toFixed(0)} ألف`
      return `${val}`
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto w-full">
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-outline-variant/10 shadow-ambient">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#FAF8F5] rounded-xl text-[#785600]">
              <BarChart3 size={20} />
            </span>
            <h1 className="text-xl md:text-2xl font-arabic font-black text-[#1A1A1A]">الإحصائيات والتحليلات للمتجر</h1>
          </div>
          <p className="text-xs font-arabic text-secondary">
            متابعة دقيقة للأداء المالي، المبيعات وحالة المخزون بشكل تفاعلي ومباشر.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Toggle */}
          <div className="bg-[#FAF8F5] p-1 rounded-2xl border border-divider flex items-center shadow-sm">
            <button
              onClick={() => setCurrency('SYP')}
              className={`px-4 py-1.5 rounded-xl font-label font-bold text-xs transition-all ${
                currency === 'SYP' ? 'bg-[#785600] text-white shadow-sm' : 'text-secondary hover:text-[#1A1A1A]'
              }`}
            >
              ل.س
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1.5 rounded-xl font-label font-bold text-xs transition-all ${
                currency === 'USD' ? 'bg-[#785600] text-white shadow-sm' : 'text-secondary hover:text-[#1A1A1A]'
              }`}
            >
              USD
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-[#FAF8F5] rounded-2xl border border-divider hover:bg-surface-container active:scale-95 transition-all text-secondary disabled:opacity-50"
            aria-label="تحديث البيانات"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-[#785600]' : ''} />
          </button>
        </div>
      </div>

      {/* Timeframe Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { key: 'current_month', label: 'الشهر الحالي' },
          { key: 'last_month', label: 'الشهر الماضي' },
          { key: 'last_3_months', label: 'آخر 3 أشهر' },
          { key: 'current_year', label: 'السنة الحالية' },
          { key: 'all', label: 'كافة الأوقات' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setTimeframe(tab.key as Timeframe)
              setHoveredIdx(null)
            }}
            className={`px-5 py-2.5 rounded-2xl font-arabic font-bold text-xs whitespace-nowrap shadow-sm border transition-all ${
              timeframe === tab.key
                ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white border-[#785600] shadow-lg shadow-[#785600]/10'
                : 'bg-white text-secondary border-outline-variant/10 hover:border-[#785600]/30 hover:text-[#1A1A1A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Selected Period Revenue */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-outline-variant/10 shadow-ambient flex flex-col justify-between group hover:border-[#785600]/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-arabic font-bold text-secondary uppercase tracking-wider">مبيعات الفترة المحددة</span>
            <span className="p-2 bg-green-50 text-green-600 rounded-2xl text-xs font-bold flex items-center gap-0.5">
              <TrendingUp size={12} />
              نشطة
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl font-label font-black text-[#1A1A1A] tracking-tight">
              {currency === 'SYP' 
                ? formatCurrency(kpiData.revenue.activeSYP, 'SYP') 
                : formatCurrency(kpiData.revenue.activeUSD, 'USD')}
            </span>
            <span className="text-xs font-label font-bold text-secondary">
              المقابل بالعملة الأخرى:{' '}
              <span className="text-[#1A1A1A]">
                {currency === 'SYP' 
                  ? formatCurrency(kpiData.revenue.activeUSD, 'USD') 
                  : formatCurrency(kpiData.revenue.activeSYP, 'SYP')}
              </span>
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between text-[10px] font-arabic text-secondary">
            <span>الطلبات المستلمة والنشطة: <span className="font-bold text-[#1A1A1A]">{kpiData.orderCount}</span></span>
            <span className="text-[9px] text-[#9E9890]">إجمالي الفترة: {currency === 'SYP' ? formatShorthand(kpiData.revenue.overallSYP) : formatShorthand(kpiData.revenue.overallUSD)}</span>
          </div>
        </div>

        {/* Metric 2: Current Month Total Sales (Regardless of Status) */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] rounded-[2.5rem] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 flex items-center justify-between mb-4">
            <span className="text-[10px] font-arabic font-bold text-white/60 uppercase tracking-wider">مبيعات الشهر الحالي (الإجمالي)</span>
            <span className="p-1.5 bg-white/10 text-[#C5A059] rounded-xl text-[9px] font-arabic font-bold flex items-center gap-1">
              <Sparkles size={10} />
              حجم مبيعات اليوم
            </span>
          </div>
          <div className="relative z-10 flex flex-col gap-1 mt-1">
            <span className="text-2xl font-label font-black text-white tracking-tight">
              {currency === 'SYP' 
                ? formatCurrency(currentMonthStats.syp, 'SYP') 
                : formatCurrency(currentMonthStats.usd, 'USD')}
            </span>
            <span className="text-xs font-label font-bold text-white/50">
              المقابل:{' '}
              <span className="text-[#C5A059]">
                {currency === 'SYP' 
                  ? formatCurrency(currentMonthStats.usd, 'USD') 
                  : formatCurrency(currentMonthStats.syp, 'SYP')}
              </span>
            </span>
          </div>
          <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-arabic text-white/40">
            <span>طلبات الشهر الحالي: <span className="font-bold text-white">{currentMonthStats.count} طلب</span></span>
            <span className="text-[9px] text-[#C5A059] font-bold">مبيعات كلية نشطة</span>
          </div>
          <Coins className="absolute -bottom-6 -right-6 text-white/5 w-24 h-24 transform -rotate-12 group-hover:scale-110 transition-transform" />
        </div>

        {/* Metric 3: Total Pieces Sold */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-outline-variant/10 shadow-ambient flex flex-col justify-between group hover:border-[#785600]/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-arabic font-bold text-secondary uppercase tracking-wider">القطع المباعة (الفترة)</span>
            <span className="p-2 bg-[#FAF8F5] text-[#785600] rounded-2xl text-xs font-bold flex items-center gap-1">
              <ShoppingBag size={12} />
              مخرجات
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-label font-black text-[#1A1A1A]">{kpiData.piecesSold}</span>
              <span className="text-xs font-arabic font-bold text-secondary">قطعة مباعة</span>
            </div>
            <span className="text-xs font-arabic text-secondary">
              معدل القطع لكل طلب:{' '}
              <span className="font-bold text-[#1A1A1A]">
                {kpiData.orderCount > 0 ? (kpiData.piecesSold / kpiData.orderCount).toFixed(1) : 0} قطعة
              </span>
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between text-[10px] font-arabic text-secondary">
            <span>متوسط الطلب: <span className="font-bold text-[#1A1A1A]">{currency === 'SYP' ? formatCurrency(kpiData.aov.syp, 'SYP') : formatCurrency(kpiData.aov.usd, 'USD')}</span></span>
          </div>
        </div>

        {/* Metric 4: Pieces In Stock (Total Inventory) */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-outline-variant/10 shadow-ambient flex flex-col justify-between group hover:border-[#785600]/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-arabic font-bold text-secondary uppercase tracking-wider">المخزون المتوفر لدينا</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-2xl text-xs font-bold flex items-center gap-1">
              <Package size={12} />
              مستودع
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-label font-black text-[#1A1A1A]">{stockStats.totalStock}</span>
              <span className="text-xs font-arabic font-bold text-secondary">قطعة متوفرة</span>
            </div>
            <span className="text-xs font-arabic text-secondary">
              أصناف مهددة بالنفاد (Low):{' '}
              <span className="font-bold text-red-600">{stockStats.lowStockCount} أصناف</span>
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between text-[10px] font-arabic text-secondary">
            <span>إجمالي الكتالوج: <span className="font-bold text-[#1A1A1A]">{stockStats.totalCatalog} منتج</span></span>
            <span className="text-[9px] text-[#9E9890]">متوفر: {stockStats.inStockCount}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* Interactive SVG Sales Area Chart */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-ambient border border-outline-variant/10 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-arabic font-black text-[#1A1A1A]">حركة المبيعات والطلب عبر الزمن</h2>
              <p className="text-xs font-arabic text-secondary">أداء الإيرادات بالـ ({currency === 'SYP' ? 'ليرة السورية' : 'الدولار الأمريكي'})</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-arabic text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#785600]" />
                <span>الإيرادات النشطة</span>
              </div>
              <span className="mx-2 text-divider">|</span>
              <div className="flex items-center gap-1">
                <Info size={12} className="text-secondary/60" />
                <span>مرر الماوس للتفاصيل</span>
              </div>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative flex-1 min-h-[260px] w-full mt-2">
            {chartConfig.points.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-secondary font-arabic">
                لا توجد بيانات مبيعات متوفرة لهذه الفترة.
              </div>
            ) : (
              <>
                <svg 
                  viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`} 
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#785600" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#785600" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = chartConfig.paddingTop + chartConfig.chartHeight * (1 - pct)
                    const labelVal = chartConfig.maxVal * pct
                    return (
                      <g key={idx} className="opacity-40">
                        <line 
                          x1={chartConfig.paddingLeft} 
                          y1={y} 
                          x2={chartConfig.width - chartConfig.paddingRight} 
                          y2={y} 
                          stroke="#E4E2DF" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />
                        <text 
                          x={chartConfig.paddingLeft - 10} 
                          y={y + 4} 
                          textAnchor="end" 
                          className="font-label font-bold text-[10px] fill-secondary"
                        >
                          {formatShorthand(labelVal)}
                        </text>
                      </g>
                    )
                  })}

                  {/* Y Axis Line */}
                  <line 
                    x1={chartConfig.paddingLeft} 
                    y1={chartConfig.paddingTop} 
                    x2={chartConfig.paddingLeft} 
                    y2={chartConfig.paddingTop + chartConfig.chartHeight} 
                    stroke="#E4E2DF" 
                    strokeWidth="1.5" 
                  />

                  {/* X Axis Line */}
                  <line 
                    x1={chartConfig.paddingLeft} 
                    y1={chartConfig.paddingTop + chartConfig.chartHeight} 
                    x2={chartConfig.width - chartConfig.paddingRight} 
                    y2={chartConfig.paddingTop + chartConfig.chartHeight} 
                    stroke="#E4E2DF" 
                    strokeWidth="1.5" 
                  />

                  {/* X Axis Labels */}
                  {chartConfig.points.map((pt, idx) => {
                    // Show thin label layout for density
                    const skipCount = Math.ceil(chartConfig.points.length / 8)
                    if (idx % skipCount !== 0 && idx !== chartConfig.points.length - 1) return null

                    return (
                      <text
                        key={idx}
                        x={pt.x}
                        y={chartConfig.height - 15}
                        textAnchor="middle"
                        className="font-arabic font-bold text-[9px] fill-secondary"
                      >
                        {pt.label}
                      </text>
                    )
                  })}

                  {/* Animated Area Gradient */}
                  <motion.path 
                    d={chartConfig.areaD} 
                    fill="url(#chartAreaGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />

                  {/* Animated Line */}
                  <motion.path 
                    d={chartConfig.pathD} 
                    fill="none" 
                    stroke="#785600" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />

                  {/* Interactive Dot Highlights */}
                  {chartConfig.points.map((pt, idx) => (
                    <g key={idx}>
                      {/* Highlight circle on hover */}
                      {hoveredIdx === idx && (
                        <>
                          <line 
                            x1={pt.x} 
                            y1={chartConfig.paddingTop} 
                            x2={pt.x} 
                            y2={chartConfig.paddingTop + chartConfig.chartHeight} 
                            stroke="#785600" 
                            strokeWidth="1.5" 
                            strokeDasharray="3 3"
                            className="opacity-75"
                          />
                          <circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            r="7" 
                            fill="#785600" 
                            stroke="#ffffff" 
                            strokeWidth="2.5" 
                            className="shadow-sm"
                          />
                        </>
                      )}
                      
                      {/* Interactive invisible hover block */}
                      <rect 
                        x={pt.x - (chartConfig.chartWidth / chartConfig.points.length) / 2} 
                        y={chartConfig.paddingTop} 
                        width={chartConfig.chartWidth / chartConfig.points.length} 
                        height={chartConfig.chartHeight} 
                        fill="transparent" 
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    </g>
                  ))}
                </svg>

                {/* HTML Tooltip (Absolute overlayed box) */}
                <AnimatePresence>
                  {hoveredIdx !== null && chartConfig.points[hoveredIdx] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute p-3 rounded-2xl bg-white border border-outline-variant/20 shadow-ambient-lg text-right z-10 flex flex-col gap-1 pointer-events-none"
                      style={{
                        left: `${(chartConfig.points[hoveredIdx].x / chartConfig.width) * 100}%`,
                        top: `${(chartConfig.points[hoveredIdx].y / chartConfig.height) * 100 - 30}%`,
                        transform: 'translate(-50%, -100%)',
                      }}
                    >
                      <span className="text-[10px] font-arabic font-bold text-secondary">{chartConfig.points[hoveredIdx].label}</span>
                      <span className="text-sm font-label font-black text-[#1A1A1A]">
                        {currency === 'SYP' 
                          ? formatCurrency(chartConfig.points[hoveredIdx].value, 'SYP') 
                          : formatCurrency(chartConfig.points[hoveredIdx].value, 'USD')}
                      </span>
                      {currency === 'SYP' ? (
                        <span className="text-[10px] font-label font-bold text-[#785600]">
                          {formatCurrency(chartPoints[hoveredIdx].usd, 'USD')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-label font-bold text-[#785600]">
                          {formatCurrency(chartPoints[hoveredIdx].syp, 'SYP')}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        {/* Top Governorates list */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-ambient border border-outline-variant/10 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="p-2 bg-[#FAF8F5] rounded-xl text-[#785600]">
              <MapPin size={18} />
            </span>
            <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-arabic font-black text-[#1A1A1A]">المحافظات الأكثر طلباً</h2>
              <p className="text-[10px] font-arabic text-secondary">ترتيب المبيعات حسب المحافظة في الفترة المحددة</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-5 justify-center">
            {governorateStats.length === 0 ? (
              <div className="text-center py-10 text-secondary font-arabic text-sm">لا تتوفر مبيعات مصنفة جغرافياً</div>
            ) : (
              governorateStats.map((gov, idx) => {
                const maxSales = governorateStats[0].salesSYP || 1
                const percent = Math.round((gov.salesSYP / maxSales) * 100)
                
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-arabic font-black text-[#1A1A1A]">
                        {idx + 1}. {gov.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-label font-bold text-[#785600]">
                          {currency === 'SYP' ? formatCurrency(gov.salesSYP, 'SYP') : formatCurrency(gov.salesUSD, 'USD')}
                        </span>
                        <span className="text-[10px] text-secondary font-arabic">({gov.count} طلب)</span>
                      </div>
                    </div>
                    {/* Horizontal animated progress bar */}
                    <div className="h-2 w-full rounded-full bg-[#FAF8F5] overflow-hidden border border-divider">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="h-full bg-gradient-to-l from-[#785600] to-[#986D00] rounded-full"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Distributions & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Top Selling Products Component */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-ambient border border-outline-variant/10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#FAF8F5] rounded-xl text-[#785600]">
                <Package size={18} />
              </span>
              <div className="flex flex-col">
                <h2 className="text-base md:text-lg font-arabic font-black text-[#1A1A1A]">المنتجات الأكثر طلباً ومبيعاً</h2>
                <p className="text-[10px] font-arabic text-secondary">الترتيب بحسب الكمية الكلية المباعة للفترة المحددة</p>
              </div>
            </div>
            <Link 
              href="/admin/products"
              className="text-xs font-arabic font-bold text-[#785600] hover:underline"
            >
              إدارة المنتجات
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-divider bg-[#FAF8F5]/50 text-[10px] text-secondary font-arabic">
                  <th className="py-3 px-4 font-black">المنتج</th>
                  <th className="py-3 px-4 text-center font-black">الكمية المباعة</th>
                  <th className="py-3 px-4 font-black">حجم الإيراد بالليرة</th>
                  <th className="py-3 px-4 font-black">حجم الإيراد بالدولار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-secondary font-arabic">
                      لا تتوفر تفاصيل مبيعات منتجات بعد.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-4 px-4 font-arabic font-black text-[#1A1A1A] leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#785600] to-[#C5A059]/40 text-white flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{prod.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 bg-[#FAF8F5] border border-divider text-[#1A1A1A] font-bold rounded-lg">
                          {prod.qty} قطعة
                        </span>
                      </td>
                      <td className="py-4 px-4 font-label font-bold text-[#1A1A1A]">
                        {formatCurrency(prod.revSYP, 'SYP')}
                      </td>
                      <td className="py-4 px-4 font-label font-bold text-[#785600]">
                        {formatCurrency(prod.revUSD, 'USD')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-ambient border border-outline-variant/10 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6">
            <span className="p-2 bg-[#FAF8F5] rounded-xl text-[#785600]">
              <Layers size={18} />
            </span>
            <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-arabic font-black text-[#1A1A1A]">توزيع حالات الطلبات</h2>
              <p className="text-[10px] font-arabic text-secondary">حالات طلبات الفترة المحددة ونسبها المئوية</p>
            </div>
          </div>

          {/* Simple custom Ring Donut using SVG */}
          <div className="flex items-center justify-center py-4 relative">
            {filteredOrders.length === 0 ? (
              <div className="text-secondary font-arabic text-xs py-8">لا تتوفر طلبات مصنفة</div>
            ) : (
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 w-full justify-around">
                {/* SVG Ring Donut */}
                <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FAF8F5" strokeWidth="10" />
                    {(() => {
                      const radius = 40
                      const circumference = 2 * Math.PI * radius
                      let currentOffset = 0
                      
                      // Filter and map only non-zero statuses to render rings
                      return statusStats.map((st, idx) => {
                        if (st.count === 0) return null
                        
                        const strokeLength = (st.percentage / 100) * circumference
                        const strokeOffset = circumference - currentOffset
                        currentOffset += strokeLength

                        // Colors for status rings
                        const colors: Record<string, string> = {
                          pending: '#F7BD48', // Yellow
                          confirmed: '#4B6339', // Green
                          shipped: '#785600', // Gold/Bronze
                          delivered: '#22C55E', // Bright green
                          cancelled: '#BA1A1A'  // Red
                        }

                        return (
                          <motion.circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={colors[st.status] || '#E4E2DF'}
                            strokeWidth="10"
                            strokeDasharray={`${strokeLength} ${circumference}`}
                            strokeDashoffset={strokeOffset}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: strokeOffset }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          />
                        )
                      })
                    })()}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-label font-black text-[#1A1A1A]">{filteredOrders.length}</span>
                    <span className="text-[8px] font-arabic font-bold text-secondary">إجمالي الطلبات</span>
                  </div>
                </div>

                {/* Status legend list */}
                <div className="flex flex-col gap-2 flex-1">
                  {statusStats.map((st, idx) => {
                    const dotColors: Record<string, string> = {
                      pending: 'bg-[#F7BD48]',
                      confirmed: 'bg-[#4B6339]',
                      shipped: 'bg-[#785600]',
                      delivered: 'bg-green-500',
                      cancelled: 'bg-red-600'
                    }

                    return (
                      <div key={idx} className="flex items-center justify-between text-xs w-full">
                        <div className="flex items-center gap-1.5 font-arabic font-bold">
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColors[st.status]}`} />
                          <span className="text-secondary">{ORDER_STATUS_LABELS[st.status] || st.status}</span>
                        </div>
                        <div className="flex gap-2 text-right">
                          <span className="font-label font-black text-[#1A1A1A]">{st.count}</span>
                          <span className="text-[10px] text-secondary font-label font-bold">({st.percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cancelled rate warnings indicator */}
          <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between text-xs">
            <span className="font-arabic font-bold text-secondary flex items-center gap-1">
              <Info size={12} className="text-secondary/60" />
              معدل الإلغاء للفترة
            </span>
            <span className={`px-2 py-0.5 rounded-xl font-bold font-label ${
              kpiData.cancelled.rate > 15 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {kpiData.cancelled.rate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
