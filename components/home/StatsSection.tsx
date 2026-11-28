import { Users, BadgeCheck, Undo2, Repeat } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { CountUp } from '@/components/ui/CountUp'

interface StatsSectionProps {
  settings: {
    stat_customers_count: string | null
    stat_satisfaction_rate: string | null
    stat_returns_count: string | null
    stat_exchanges_count: string | null
  }
  /**
   * Live number of orders placed. When provided it replaces the hand-typed
   * customers figure, so the counter grows on its own with every order instead of
   * being edited by hand. The other three figures have no data source in the
   * system yet, so they stay exactly as typed in the admin panel.
   */
  ordersCount?: number
}

// Strip any words typed in the admin field ("27 عملية إرجاع" → "27") — the label
// under each number already says what it is.
const numberOnly = (v: string | null, fallback: string) => {
  const m = (v || '').match(/[+]?\d[\d,]*\.?\d*\s*%?\+?/)
  return m ? m[0].replace(/\s+/g, '') : fallback
}

export default function StatsSection({ settings, ordersCount }: StatsSectionProps) {
  const customers =
    typeof ordersCount === 'number' && ordersCount > 0
      ? `+${ordersCount.toLocaleString('en-US')}`
      : numberOnly(settings.stat_customers_count, '+1000')

  const secondary = [
    { value: numberOnly(settings.stat_satisfaction_rate, '99%'), label: 'جودة نضمنها', icon: BadgeCheck },
    { value: numberOnly(settings.stat_returns_count, '+27'),     label: 'إرجاع مرن',   icon: Undo2 },
    { value: numberOnly(settings.stat_exchanges_count, '+68'),   label: 'تبديل سهل',   icon: Repeat },
  ]

  return (
    <section className="bg-[#FAF8F5] py-14 md:py-20" dir="rtl">
      <div className="max-w-screen-lg mx-auto px-5 sm:px-6">
        <ScrollReveal direction="up" duration={0.8}>
          <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-0">
            {/* Main figure — customers */}
            <div className="flex flex-col items-center text-center lg:w-[42%]">
              <div className="flex items-center gap-3 md:gap-4" dir="ltr">
                <span className="font-label text-[3.25rem] sm:text-6xl md:text-7xl font-light tracking-tighter leading-none text-[#1A1A1A] tabular-nums">
                  <CountUp value={customers} duration={2200} />
                </span>
                <Users className="w-7 h-7 md:w-9 md:h-9 text-[#1A1A1A]" strokeWidth={1.25} aria-hidden />
              </div>
              <p className="mt-3 font-arabic text-sm md:text-base text-[#6B6560]">زبون وثقوا بكزورا</p>
            </div>

            {/* Divider: horizontal on phone, vertical on desktop */}
            <div className="w-full h-px bg-[#E3DCCF] lg:w-px lg:h-24" />

            {/* Three smaller figures */}
            <div className="grid grid-cols-3 w-full lg:w-[52%]">
              {secondary.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex flex-col items-center text-center px-1 ${i < 2 ? 'border-l border-[#E3DCCF]' : ''}`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2" dir="ltr">
                    <span className="font-label text-xl sm:text-2xl md:text-3xl font-medium text-[#1A1A1A] tabular-nums">
                      <CountUp value={s.value} />
                    </span>
                    <s.icon className="w-4 h-4 md:w-5 md:h-5 text-[#1A1A1A]" strokeWidth={1.5} aria-hidden />
                  </div>
                  <p className="mt-1.5 font-arabic text-xs md:text-sm text-[#6B6560]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
