import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'سياسة الشحن — كزورا Kzora | توصيل سريع لكل سوريا',
  description: 'تعرف على تفاصيل الشحن والتوصيل في كزورا Kzora. نوفر خدمة التوصيل السريع لجميع المحافظات السورية خلال ٢٤-٧٢ ساعة وبأفضل الأسعار.',
  alternates: { 
    canonical: '/shipping',
  },
}

async function getShippingPage() {
  const { data } = await supabaseAdmin
    .from('static_pages')
    .select('title, content')
    .eq('slug', 'shipping')
    .single()
  return data
}

export default async function ShippingPage() {
  const page = await getShippingPage()

  const title = page?.title || 'سياسة الشحن والتوصيل'
  const paragraphs = page?.content
    ? page.content.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [
        'نفتخر في كزورا Kzora بتوفير خدمة التوصيل لجميع المحافظات السورية، بما في ذلك حلب، دمشق، ريف دمشق، حمص، حماة، اللاذقية، طرطوس، والسويداء.',
        'نعمل جاهدين لتسليم طلباتكم في أسرع وقت ممكن. تستغرق عملية التوصيل عادةً ما بين ٢٤ إلى ٧٢ ساعة عمل من تاريخ تأكيد الطلب عبر الواتساب.',
        'يمكنكم تتبع حالة طلبكم مباشرة عبر صفحة "تتبع الطلب" في موقعنا باستخدام رقم الهاتف الذي تم استخدامه أثناء عملية الشراء.',
      ]

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-white pt-24">
        <section className="relative flex items-center justify-center bg-[#1A1A1A] py-20 px-6">
          <div className="relative z-10 text-center max-w-2xl">
            <span className="inline-block text-[#B8860B] font-arabic font-black text-xs uppercase tracking-[0.4em] mb-5">كزورا Kzora</span>
            <h1 className="font-arabic text-4xl md:text-6xl font-black text-white leading-tight mb-6">{title}</h1>
            <div className="w-16 h-[3px] bg-[#B8860B] mx-auto rounded-full" />
          </div>
        </section>
        <section className="py-20 px-6 bg-[#FAFAF9]">
          <div className="max-w-3xl mx-auto space-y-12">
            {paragraphs.map((para: string, i: number) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-[#F0EBE3] shadow-sm">
                <p className="font-arabic text-lg text-[#6B6560] leading-loose">
                  {para}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
