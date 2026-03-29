import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: number   // positive or negative percentage
  className?: string
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const trendPositive = trend !== undefined && trend >= 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div
      dir="rtl"
      className={cn(
        'group bg-white rounded-3xl shadow-ambient p-6 flex flex-col gap-4 border border-outline-variant/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        className
      )}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        {/* Icon container */}
        <div className="h-14 w-14 rounded-2xl bg-[#F5F3F0] group-hover:bg-gradient-to-br group-hover:from-[#785600] group-hover:to-[#B8860B] flex items-center justify-center shrink-0 transition-all duration-500 shadow-inner">
          <Icon size={28} className="text-primary group-hover:text-white transition-colors duration-300" />
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shadow-sm',
              trendPositive && 'bg-emerald-50 text-emerald-700 border border-emerald-100',
              trendNegative && 'bg-rose-50 text-rose-700 border border-rose-100'
            )}
          >
            {trendPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value + title */}
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-3xl font-brand font-black text-[#1A1A1A] leading-none tracking-tight">
          {value}
        </span>
        <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 bg-primary/30 rounded-full" />
            <span className="text-sm font-arabic font-bold text-secondary group-hover:text-primary transition-colors">
            {title}
            </span>
        </div>
        {subtitle && (
          <span className="text-xs font-arabic text-[#9E9890] mt-1 pr-5">
            {subtitle}
          </span>
        )}
      </div>
    </div>

  )
}
