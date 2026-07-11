'use client'

import { useState } from 'react'
import { TrendingUp, ShoppingBag, Users, Clock, Globe, MousePointerClick, Percent } from 'lucide-react'
import RefreshButton from './RefreshButton'

function formatCurrency(amount: number, currency: 'USD' | 'SYP') {
  if (currency === 'USD') {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(amount).toLocaleString()} ل.س`
}

type PeriodStats = {
  syp: number
  usd: number
  count: number
  uniqueVisitors: number
}

interface DashboardOverviewProps {
  stats: {
    totalProducts: number
    totalOrders: number
    pendingOrders: number
    confirmedOrders: number
    deliveredOrders: number
    lowStockProducts: number
    activeNow: number
    periods: {
      today: PeriodStats
      last7d: PeriodStats
      last30d: PeriodStats
      allTime: PeriodStats
    }
  }
}

export default function DashboardOverview({ stats }: DashboardOverviewProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'last7d' | 'last30d' | 'allTime'>('today')

  const TIMEFRAMES = [
    { id: 'today', label: 'اليوم' },
    { id: 'last7d', label: 'آخر 7 أيام' },
    { id: 'last30d', label: 'آخر 30 يوم' },
    { id: 'allTime', label: 'كل الأوقات' },
  ] as const

  const currentStats = stats.periods[timeframe]

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {/* Timeframe selector & header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-3xl border border-outline-variant/10 shadow-ambient w-full min-w-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-base sm:text-lg md:text-xl font-arabic font-black text-[#1A1A1A]">نشاط وأداء المتجر</h2>
          <p className="text-[11px] sm:text-xs font-arabic text-secondary">
            متابعة سريعة للمبيعات، الطلبات، وحركة الزوار عبر فترات زمنية مختلفة.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end xs:self-auto shrink-0">
          <RefreshButton />
          
          <div className="flex bg-[#FAF8F5] p-1 rounded-2xl border border-divider shadow-sm">
            {TIMEFRAMES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-arabic font-bold transition-all ${
                  timeframe === tab.id
                    ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-md'
                    : 'text-secondary hover:text-[#1A1A1A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        
        {/* KPI 1: Revenue/Sales */}
        <div className="bg-white rounded-3xl p-3 sm:p-5 border border-outline-variant/10 shadow-ambient flex flex-col justify-between group hover:border-[#785600]/20 transition-all duration-300">
          <div className="flex flex-col gap-1 mb-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[8px] sm:text-[10px] font-arabic font-bold text-secondary uppercase tracking-wider truncate">المبيعات الإجمالية</span>
            <span className="p-1 sm:p-1.5 bg-green-50 text-green-600 rounded-lg text-[8px] sm:text-xs font-bold flex items-center gap-0.5 self-start sm:self-auto">
              <TrendingUp size={10} />
              نشطة
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <span className="text-base sm:text-xl md:text-2xl font-label font-black text-[#1A1A1A] tracking-tight truncate">
              {formatCurrency(currentStats.syp, 'SYP')}
            </span>
            <span className="text-[9px] sm:text-xs font-label font-bold text-secondary truncate">
              المقابل:{' '}
              <span className="text-[#1A1A1A]">
                {formatCurrency(currentStats.usd, 'USD')}
              </span>
            </span>
          </div>
          <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-divider text-[8px] sm:text-[9px] text-[#9E9890] truncate">
            مبيعات الفترة الحالية
          </div>
        </div>

        {/* KPI 2: Order Count */}
        <div className="bg-white rounded-3xl p-3 sm:p-5 border border-outline-variant/10 shadow-ambient flex flex-col justify-between group hover:border-[#785600]/20 transition-all duration-300">
          <div className="flex flex-col gap-1 mb-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[8px] sm:text-[10px] font-arabic font-bold text-secondary uppercase tracking-wider truncate">الطلبات المستلمة</span>
            <span className="p-1 sm:p-1.5 bg-[#FAF8F5] text-[#785600] rounded-lg text-[8px] sm:text-xs font-bold flex items-center gap-0.5 self-start sm:self-auto">
              <ShoppingBag size={10} />
              طلبات
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-2xl font-label font-black text-[#1A1A1A]">
              {currentStats.count}
            </span>
            <span className="text-[9px] sm:text-xs font-arabic text-[#9E9890] mt-1 truncate">إجمالي طلبات الفترة</span>
          </div>
          <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-divider text-[8px] sm:text-[9px] text-[#9E9890] truncate">
            حالة الطلبات نشطة/مستلمة
          </div>
        </div>

        {/* KPI 3: Unique Visitors */}
        <div className="bg-white rounded-3xl p-3 sm:p-5 border border-outline-variant/10 shadow-ambient flex flex-col justify-between group hover:border-[#785600]/20 transition-all duration-300">
          <div className="flex flex-col gap-1 mb-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[8px] sm:text-[10px] font-arabic font-bold text-secondary uppercase tracking-wider truncate">زوار المتجر</span>
            <span className="p-1 sm:p-1.5 bg-[#FAF8F5] text-[#785600] rounded-lg text-[8px] sm:text-[10px] font-bold flex items-center gap-0.5 self-start sm:self-auto">
              <Users size={10} />
              زائر
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-2xl font-label font-black text-[#1A1A1A]">
              {currentStats.uniqueVisitors}
            </span>
            <span className="text-[9px] sm:text-[10px] font-arabic text-[#9E9890] mt-1 truncate">زوار فريدين فعليين</span>
          </div>
          <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-divider text-[8px] sm:text-[9px] text-[#9E9890] truncate">
            باستثناء الروبوتات والزحف
          </div>
        </div>

        {/* KPI 4: Active Users Now */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] rounded-3xl p-3 sm:p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-1 mb-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[8px] sm:text-[10px] font-arabic font-bold text-white/60 uppercase tracking-wider truncate">النشاط المباشر</span>
            <div className="flex items-center gap-1 bg-green-500/10 text-green-400 p-1 rounded-lg text-[8px] sm:text-[9px] font-bold self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>مباشر</span>
            </div>
          </div>
          <div className="relative z-10 flex flex-col mt-0.5 sm:mt-1">
            <span className="text-base sm:text-2xl font-label font-black text-white">
              {stats.activeNow}
            </span>
            <span className="text-[9px] sm:text-[10px] font-arabic text-white/50 mt-1 truncate">زوار نشطون آخر 15 دقيقة</span>
          </div>
          <div className="relative z-10 mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-white/10 text-[8px] sm:text-[9px] text-[#C5A059] font-bold truncate">
            نبض المتجر في الوقت الفعلي
          </div>
        </div>

      </div>
    </div>
  )
}
