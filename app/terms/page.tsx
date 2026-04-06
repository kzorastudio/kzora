import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'شروط الاستخدام — كزورا Kzora | دليل التسوق الآمن',
  description: 'اطلع على شروط استخدام موقع كزورا Kzora للأحذية. نحن نضع القواعد لضمان تجربة تسوق عادلة وآمنة لكل عملائنا في سوريا.',
  alternates: { 
    canonical: '/terms',
  },
}

async function getTermsPage() {
  const { data } = await supabaseAdmin
    .from('static_pages')
    .select('title, content')
    .eq('slug', 'terms')
    .single()
  return data
}

export default async function TermsPage() {
  const page = await getTermsPage()

  const title = page?.title || 'شروط الاستخدام'
  const paragraphs = page?.content
    ? page.content.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [
        'استخدامك لموقع كزورا Kzora يعني موافقتك الكاملة على جميع الشروط والأحكام المذكورة هنا. نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت لتتواكب مع حقوق المستهلك وتطور خدماتنا.',
        'نحن نسعى لعرض ألوان وتفاصيل الأحذية بأكبر قدر ممكن من الدقة. ومع ذلك، قد تختلف درجة اللون قليلاً حسب إعدادات شاشة جهازك. نحن نضمن لك توافق المنتج مع الوصف المذكور.',
        'أنت مسؤول عن تزويدنا بعنوان دقيق ورقم هاتف فعال لضمان تواصل فريق التوصيل معك وتسليم المنتجات في الوقت المحدد. أي تأخير ناتج عن خطأ في البيانات المقدمة يتحمله الطرف المعني.',
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
          <div className="max-w-3xl mx-auto space-y-8">
            {paragraphs.map((para: string, i: number) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-[#F0EBE3] shadow-sm">
                <h2 className="font-arabic text-xl font-bold text-[#1A1A1A] mb-4">{i + 1}. التفاصيل</h2>
                <p className="font-arabic text-base text-[#6B6560] leading-loose">
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
