import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'

export const metadata: Metadata = {
  title: 'سياسة الشحن — كزورا',
}

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-white pt-24">
        <section className="relative flex items-center justify-center bg-[#1A1A1A] py-20 px-6">
          <div className="relative z-10 text-center max-w-2xl">
            <span className="inline-block text-[#B8860B] font-arabic font-black text-xs uppercase tracking-[0.4em] mb-5">كزورا</span>
            <h1 className="font-arabic text-4xl md:text-6xl font-black text-white leading-tight mb-6">سياسة الشحن</h1>
            <div className="w-16 h-[3px] bg-[#B8860B] mx-auto rounded-full" />
          </div>
        </section>
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-arabic text-lg text-[#6B6560]">سيتم إضافة تفاصيل سياسة الشحن قريباً.</p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
