import { Users, Heart, ShieldCheck, RotateCcw } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'

interface StatsSectionProps {
  settings: {
    stat_customers_count: string | null
    stat_satisfaction_rate: string | null
    stat_returns_count: string | null
    stat_exchanges_count: string | null
  }
}

export default function StatsSection({ settings }: StatsSectionProps) {
  const stats = [
    {
      label: settings.stat_customers_count || '+1000 زبون',
      sub: 'عملاء نعتز بهم',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: settings.stat_satisfaction_rate || '99% رضا العملاء',
      sub: 'جودة نضمنها لك',
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      label: settings.stat_returns_count || '27 عملية إرجاع',
      sub: 'سياسة إرجاع مرنة',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: settings.stat_exchanges_count || '68 عملية تبديل',
      sub: 'تبديل سهل وسريع',
      icon: RotateCcw,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <section className="bg-[#FAF8F5] py-16 md:py-24 relative overflow-hidden" dir="rtl">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#785600]/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal direction="up" duration={0.8}>
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(120,86,0,0.1)] border border-[#E8E3DB]/80 overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[#E8E3DB]/80">
              {stats.map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "group flex flex-col items-center text-center p-6 sm:p-8 md:p-10 transition-colors duration-300",
                    "hover:bg-[#FAF8F5]/60",
                    /* Handle borders for 2x2 grid on mobile/tablet */
                    idx % 2 !== 0 && "border-r border-[#E8E3DB]/80 lg:border-r-0",
                    idx >= 2 && "border-t border-[#E8E3DB]/80 lg:border-t-0"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm",
                    item.iconBg
                  )}>
                    <item.icon className={cn("w-6 h-6 md:w-8 md:h-8", item.iconColor)} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-arabic font-black text-[#1A1A1A] tracking-tight mb-1.5 md:mb-2">
                    {item.label}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base font-arabic text-[#6B6560] font-medium leading-relaxed">
                     {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
