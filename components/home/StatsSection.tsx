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
      color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-600',
      borderColor: 'group-hover:border-blue-200',
    },
    {
      label: settings.stat_satisfaction_rate || '99% رضا العملاء',
      sub: 'جودة نضمنها لك',
      icon: Heart,
      color: 'from-rose-500/20 to-rose-600/5',
      iconColor: 'text-rose-600',
      borderColor: 'group-hover:border-rose-200',
    },
    {
      label: settings.stat_returns_count || '27 عملية إرجاع',
      sub: 'سياسة إرجاع مرنة',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-600',
      borderColor: 'group-hover:border-emerald-200',
    },
    {
      label: settings.stat_exchanges_count || '68 عملية تبديل',
      sub: 'تبديل سهل وسريع',
      icon: RotateCcw,
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-600',
      borderColor: 'group-hover:border-amber-200',
    },
  ]

  return (
    <section className="bg-[#FAF8F5] py-20 md:py-32 relative overflow-hidden" dir="rtl">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#785600]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
      
      <div className="max-w-screen-xl mx-auto px-6 md:px-8 relative z-10">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {stats.map((item, idx) => (
            <ScrollReveal 
              key={idx} 
              direction="up" 
              delay={idx * 0.1} 
              duration={0.8}
              className="h-full"
            >
              <div className={cn(
                "group relative flex flex-col items-center text-center p-8 md:p-10 rounded-[2.5rem] bg-white border border-[#E8E3DB]/60 transition-all duration-500 h-full",
                "hover:shadow-[0_20px_50px_-15px_rgba(120,86,0,0.12)] hover:-translate-y-2",
                item.borderColor
              )}>
                {/* Icon Container */}
                <div className={cn(
                  "relative w-20 h-20 rounded-3xl mb-8 flex items-center justify-center transition-all duration-500 overflow-hidden",
                  "bg-gradient-to-br shadow-inner shadow-white",
                  item.color,
                  "group-hover:scale-110 group-hover:rotate-3"
                )}>
                  <div className="absolute inset-0 bg-white/40 blur-md opacity-50" />
                  <item.icon className={cn("w-10 h-10 relative z-10 transition-transform duration-500 group-hover:scale-110", item.iconColor)} strokeWidth={1.5} />
                </div>
                
                {/* Content */}
                <div className="space-y-2 relative">
                  <h3 className="text-3xl md:text-4xl font-arabic font-black text-[#1A1A1A] tracking-tighter tabular-nums">
                    {item.label}
                  </h3>
                  <div className="flex flex-col items-center gap-2">
                    <span className="h-0.5 w-10 bg-gradient-to-l from-transparent via-[#785600]/30 to-transparent rounded-full" />
                    <p className="text-sm md:text-base font-arabic text-[#6B6560] font-medium tracking-wide">
                      {item.sub}
                    </p>
                  </div>
                </div>

                {/* Glassy Background Reveal on Hover */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
