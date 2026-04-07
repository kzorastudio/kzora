import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import TrackOrderClient from './TrackOrderClient'

export const metadata: Metadata = {
  title: 'تتبع الطلب — كزورا Kzora سوريا',
  description: 'تتبع حالة طلبك من كزورا Kzora مباشرة من خلال رقم هاتفك. اعرف أين وصل طلبك وموعد التسويل المتوقع في جميع المحافظات السورية.',
  alternates: { 
    canonical: '/track-order',
  },
}

export default function TrackOrderPage() {
  return (
    <>
      <Header />

      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-36">

        {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-14 md:py-20 px-6 text-center border-b border-[#F0EBE3] bg-white overflow-hidden">
          {/* Subtle background gradient & decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#B8860B08_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B8860B]/10 to-transparent" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <ScrollReveal direction="up">
              <h1 className="font-arabic text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] leading-tight mb-3 tracking-tight">
                تتبع طلبك
              </h1>

              <p className="font-arabic text-[#6B6560] text-sm md:text-base max-w-md mx-auto leading-relaxed">
                أدخل رقم هاتفك لمعرفة حالة طلباتك ومتابعة رحلة الشحن خطوة بخطوة
              </p>

              <div className="flex items-center justify-center gap-3 mt-8">
                <div className="w-12 h-[1px] bg-[#B8860B]/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/50" />
                <div className="w-12 h-[1px] bg-[#B8860B]/30" />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══ TRACK SECTION ═══════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-6">
          <TrackOrderClient />
        </section>

      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
