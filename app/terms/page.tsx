import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabaseAdmin } from '@/lib/supabase'
import { Shield, FileText, Gavel, Scale } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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
        'جميع الحقوق محفوظة لمتجر كزورا Kzora، وأي استخدام للمحتوى أو الصور دون إذن كتابي مسبق يعتبر مخالفاً لشروط الاستخدام.',
      ]

  const icons = [Shield, FileText, Gavel, Scale]

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-[100px]">
        
        {/* ── HERO ── */}
        <section className="relative py-20 px-6 text-center border-b border-[#F0EBE3] bg-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1A1A1A08_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1A1A1A]/5 to-transparent" />
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <ScrollReveal direction="up">
              <span className="inline-block px-4 py-1.5 bg-[#111110] text-white rounded-full text-[10px] font-arabic font-bold uppercase tracking-widest mb-6 shadow-xl">
                دليل المستخدم والقانون
              </span>
              <h1 className="font-arabic text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] leading-tight mb-6 tracking-tight">
                {title}
              </h1>
              <p className="font-arabic text-[#6B6560] text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                في كزورا Kzora نضع القواعد لضمان حقوقك كمستهلك وحماية علامتنا التجارية، لنبني معاً علاقة تسوق قائمة على الثقة والشفافية.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── COMMITMENT STRIP ── */}
        <section className="bg-white border-b border-[#F0EBE3]">
            <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap justify-center gap-12 md:gap-24">
                {[
                    { label: 'حقوق محمية', sub: 'بموجب القانون', icon: Shield },
                    { label: 'شفافية كاملة', sub: 'في كل إجراء', icon: Scale },
                    { label: 'خصوصية قصوى', sub: 'لبيانات الزبائن', icon: FileText },
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center gap-3 group">
                        <div className="w-12 h-12 rounded-full border-2 border-[#E8E3DB] flex items-center justify-center text-[#1A1A1A] group-hover:border-[#785600] group-hover:text-[#785600] transition-all duration-300">
                            <item.icon size={20} />
                        </div>
                        <div>
                            <div className="font-arabic font-bold text-[#1A1A1A] text-xs uppercase">{item.label}</div>
                            <div className="font-arabic text-[10px] text-[#9E9890]">{item.sub}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* ── CONTENT (List Style) ── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto space-y-16">
            {paragraphs.map((para: string, i: number) => {
                const Icon = icons[i % icons.length]
                return (
                    <ScrollReveal key={i} direction="up" delay={i * 0.1}>
                        <div className="flex gap-8 group">
                            {/* Marker */}
                            <div className="shrink-0 flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-[#FAFAF9] border border-[#F0EBE3] flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-white transition-all duration-500">
                                    <Icon size={22} strokeWidth={1.5} />
                                </div>
                                <div className="w-[1px] flex-1 bg-gradient-to-b from-[#F0EBE3] to-transparent mt-4" />
                            </div>
                            {/* Body */}
                            <div className="pb-8">
                                <div className="font-arabic font-black text-[#1A1A1A] text-lg mb-4">بند رقم {i + 1}</div>
                                <p className="font-arabic text-[#6B6560] leading-[2.4] text-base md:text-lg">
                                    {para}
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                )
            })}
          </div>
        </section>

        {/* ── FINAL NOTE ── */}
        <section className="pb-24 px-6 text-center">
            <ScrollReveal direction="up">
                <div className="max-w-xl mx-auto p-8 rounded-[2rem] border-2 border-dashed border-[#E8E3DB] bg-white">
                    <p className="font-arabic text-[#9E9890] text-sm italic">
                        هذه الشروط سارية المفعول من لحظة نشرها على الموقع الرسمي لكزورا Kzora. نحن نقدر وعيكم بالتزامنا بتقديم الأفضل.
                    </p>
                </div>
            </ScrollReveal>
        </section>

      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
