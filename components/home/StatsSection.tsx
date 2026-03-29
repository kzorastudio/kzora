import { Users, Star, RotateCcw, RefreshCw } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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
      label: settings.stat_customers_count || '+١٠٠٠ زبون',
      sub: 'عملاء نعتز بهم',
      icon: Users,
    },
    {
      label: settings.stat_satisfaction_rate || '٩٩٪ رضا العملاء',
      sub: 'جودة نضمنها لك',
      icon: Star,
    },
    {
      label: settings.stat_returns_count || '٥٠ عملية إرجاع',
      sub: 'سياسة إرجاع مرنة',
      icon: RotateCcw,
    },
    {
      label: settings.stat_exchanges_count || '١٠٠ عملية تبديل',
      sub: 'تبديل سهل وسريع',
      icon: RefreshCw,
    },
  ]

  return (
    <section className="bg-white border-y border-[#D3C4AF]/30 py-10 md:py-16">
      <div className="max-w-screen-xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12" dir="rtl">
          {stats.map((item, idx) => (
            <ScrollReveal 
              key={idx} 
              direction="up" 
              delay={idx * 0.1} 
              duration={0.6}
            >
              <div className="flex flex-col items-center text-center group">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#F2EDE6] flex items-center justify-center mb-5 group-hover:bg-[#785600] transition-all duration-300 group-hover:scale-110 shadow-sm overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#785600]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <item.icon className="w-6 h-6 md:w-7 md:h-7 text-[#785600] group-hover:text-white relative z-10 transition-colors" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl md:text-2xl font-arabic font-bold text-[#1A1A1A] mb-1.5 whitespace-nowrap">
                  {item.label}
                </h3>
                <p className="text-xs md:text-sm font-arabic text-[#6B6560] font-medium opacity-80 uppercase tracking-wide">
                  {item.sub}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
