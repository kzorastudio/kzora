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
    <section className="bg-white py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="max-w-screen-xl mx-auto px-6 md:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8" dir="rtl">
          {stats.map((item, idx) => (
            <ScrollReveal 
              key={idx} 
              direction="up" 
              delay={idx * 0.15} 
              duration={0.8}
            >
              <div className="flex flex-col items-center p-8 rounded-[2.5rem] bg-[#FAF8F5] border border-[#E8E3DB]/40 hover:border-[#785600]/30 hover:bg-white hover:shadow-2xl hover:shadow-[#785600]/5 transition-all duration-500 group">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-[#E8E3DB]/40 flex items-center justify-center mb-6 group-hover:bg-[#785600] group-hover:border-transparent transition-all duration-500 shadow-sm relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-[#785600]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <item.icon className="w-6 h-6 md:w-7 md:h-7 text-[#785600] group-hover:text-white relative z-10 transition-all duration-500" strokeWidth={2} />
                </div>
                
                <h3 className="text-xl md:text-2xl font-arabic font-black text-[#1A1A1A] mb-2 tracking-tight">
                  {item.label}
                </h3>
                <p className="text-xs md:text-sm font-arabic text-[#6B6560] font-bold opacity-70 tracking-wide uppercase">
                  {item.sub}
                </p>
                
                {/* Subtle bottom indicator */}
                <div className="w-8 h-1 bg-[#E8E3DB] rounded-full mt-6 group-hover:w-12 group-hover:bg-[#785600] transition-all duration-500" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
