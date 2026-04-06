import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabaseAdmin } from '@/lib/supabase'
import { Truck, MapPin, Clock, ShieldCheck } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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
        'تكلفة الشحن رمزية وتحدد بناءً على المحافظة وعدد القطع، وسيقوم فريقنا بتأكيد التكلفة النهائية معك عبر الواتساب قبل إرسال الطلب.',
      ]

  const icons = [Truck, MapPin, Clock, ShieldCheck]

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-[100px]">
        
        {/* ── HERO ── */}
        <section className="relative py-20 px-6 text-center border-b border-[#F0EBE3] bg-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#78560008_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#785600]/10 to-transparent" />
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <ScrollReveal direction="up">
              <span className="inline-block px-4 py-1.5 bg-[#F5F1EB] text-[#785600] rounded-full text-[10px] font-arabic font-bold uppercase tracking-widest mb-6 border border-[#E8E3DB]">
                اللوجستيات والشحن
              </span>
              <h1 className="font-arabic text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] leading-tight mb-6 tracking-tight">
                {title}
              </h1>
              <p className="font-arabic text-[#6B6560] text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                رحلة حذائك من كزورا تبدأ من لحظة التأكيد لتصل إلى عتبة دارك بأمان وسرعة في أي مكان داخل سوريا.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── CORE VALUES STRIP ── */}
        <section className="bg-white border-b border-[#F0EBE3]">
            <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap justify-center gap-8 md:gap-16">
                {[
                    { label: 'تغطية كاملة', sub: 'لكل سوريا', icon: MapPin },
                    { label: 'شحن سريع', sub: '٢٤-٧٢ ساعة', icon: Truck },
                    { label: 'تتبع مباشر', sub: 'عبر الموقع', icon: Clock },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#785600]/5 flex items-center justify-center text-[#785600] group-hover:bg-[#785600] group-hover:text-white transition-all duration-300">
                            <item.icon size={20} />
                        </div>
                        <div>
                            <div className="font-arabic font-bold text-[#1A1A1A] text-sm uppercase">{item.label}</div>
                            <div className="font-arabic text-xs text-[#9E9890]">{item.sub}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* ── CONTENT ── */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paragraphs.map((para: string, i: number) => {
                    const Icon = icons[i % icons.length]
                    return (
                        <ScrollReveal key={i} direction="up" delay={i * 0.1}>
                            <div className="group relative bg-white rounded-3xl border border-[#F0EBE3] p-8 hover:border-[#785600]/20 hover:shadow-xl hover:shadow-[#785600]/5 transition-all duration-500 h-full flex flex-col gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#785600] group-hover:scale-110 transition-transform duration-500">
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>
                                <p className="font-arabic text-[#3D3B38] leading-[2.2] text-base flex-1">
                                    {para}
                                </p>
                                <div className="absolute top-6 left-8 font-brand font-black text-4xl text-[#785600]/5 select-none">
                                    0{i + 1}
                                </div>
                            </div>
                        </ScrollReveal>
                    )
                })}
            </div>

            {/* Local Callout */}
            <ScrollReveal direction="up" delay={0.4}>
                <div className="mt-16 bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#78560030_0%,transparent_70%)] opacity-50" />
                    <h3 className="relative z-10 font-arabic text-2xl font-bold text-white mb-4">هل لديك استفسار محدد؟</h3>
                    <p className="relative z-10 font-arabic text-white/60 mb-8 max-w-md mx-auto">فريق خدمة العملاء لدينا جاهز للرد على كافة أسئلتكم بخصوص الشحن عبر الواتساب مباشرة.</p>
                    <a 
                        href="https://wa.me/963964514765" 
                        target="_blank"
                        className="relative z-10 inline-flex items-center gap-3 bg-white text-[#1A1A1A] px-10 py-4 rounded-2xl font-arabic font-bold hover:scale-105 transition-transform"
                    >
                        تواصل معنا الآن
                    </a>
                </div>
            </ScrollReveal>
          </div>
        </section>

      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
