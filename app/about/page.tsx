import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import Link from 'next/link'
import Image from 'next/image'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ShieldCheck, Gem, Truck } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'من نحن — كزورا Kzora | قصة شغف بالأحذية في سوريا',
  description: 'تعرف على قصة كزورا Kzora للأحذية في سوريا. نحن نجمع بين الحرفية اليدوية السورية وأحدث التصاميم العالمية لنقدم أفضل تجربة تسوق أحذية أونلاين في حلب وكافة المحافظات السورية.',
  alternates: { 
    canonical: '/about',
  },
}

async function getAboutPage() {
  const { data } = await supabaseAdmin
    .from('static_pages')
    .select('title, content')
    .eq('slug', 'about')
    .single()
  return data
}

export default async function AboutPage() {
  const page = await getAboutPage()

  const heroTitle = page?.title || 'من نحن'
  const paragraphs = page?.content
    ? page.content.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [
        'بدأت كزورا برؤية بسيطة: تقديم أحذية فاخرة تجمع بين الجودة العالية والراحة المطلقة، لأننا نؤمن أن حذائك هو سر أناقتك.',
        'من قلب سوريا، ننتقي أفضل الجلود الطبيعية ونصنعها بحرفية يدوية، لنقدم لك منتجاً تفتخر بارتدائه ويعكس التزامنا بالكمال.',
      ]

  return (
    <>
      <Header />

      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-[100px]">

        {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-14 md:py-20 px-6 text-center border-b border-[#F0EBE3] bg-white overflow-hidden">
          {/* Subtle background gradient & decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#B8860B08_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B8860B]/10 to-transparent" />
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <ScrollReveal direction="up">
                <h1 className="font-arabic text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] leading-tight mb-3 tracking-tight">
                  {heroTitle}
                </h1>
                
                {/* Subtitle */}
                <p className="font-arabic text-[#6B6560] text-sm md:text-base max-w-md mx-auto leading-relaxed">
                  نروي في كزورا قصة شغف بالأناقة؛ نجمع بين الحرفية السورية الأصيلة والتصميم العصري، لنقدم لك حذاءً يرافقك بثقة في كل خطوة.
                </p>
                
                <div className="flex items-center justify-center gap-3 mt-8">
                  <div className="w-12 h-[1px] bg-[#B8860B]/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/50" />
                  <div className="w-12 h-[1px] bg-[#B8860B]/30" />
                </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══ OUR STORY ══════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-12 bg-[#FAF8F5]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="right">
                <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl rotate-2">
                    <Image
                        src="https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop"
                        alt="Kzora Story"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[3rem]" />
                </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
                <div className="flex flex-col gap-6">
                    <h2 className="font-arabic text-3xl md:text-4xl font-black text-[#1A1A1A]">قصتنا الحقيقية</h2>
                    {paragraphs.map((para: string, i: number) => (
                      <p key={i} className="font-arabic text-lg text-[#6B6560] leading-relaxed">
                        {para}
                      </p>
                    ))}
                    <div className="flex items-center gap-4 mt-4">
                        <div className="h-[2px] w-12 bg-primary" />
                        <span className="font-arabic font-bold text-primary">عالم كزورا — خيار النخبة</span>
                    </div>
                </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══ VALUES ══════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    { title: 'جودة استثنائية', desc: 'جلود طبيعية مختارة بعناية تدوم طويلاً وتزداد جمالاً مع الوقت.', icon: Gem },
                    { title: 'راحة مطلقة', desc: 'تصاميم هندسية مدروسة تضمن لك الراحة في كل خطوة تخطوها.', icon: ShieldCheck },
                    { title: 'ثقة متبادلة', desc: 'التزام كامل بالمصداقية في الوصف والصور وسرعة التوصيل.', icon: Truck }
                ].map((v, i) => (
                    <ScrollReveal key={v.title} direction="up" delay={i * 0.15}>
                        <div className="group text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-[#F5F3F0] group-hover:bg-primary transition-all duration-500 flex items-center justify-center shadow-sm group-hover:shadow-primary/30 group-hover:-translate-y-2">
                                <v.icon size={32} className="text-primary group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-arabic text-xl font-black text-[#1A1A1A]">{v.title}</h3>
                            <p className="font-arabic text-[#6B6560] leading-relaxed max-w-xs">{v.desc}</p>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 text-center">
            <ScrollReveal direction="up">
                <h2 className="font-arabic text-2xl md:text-3xl font-black text-[#1A1A1A] mb-8">هل أنت مستعد للانضمام لعالمنا؟</h2>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-4 px-12 py-5 rounded-[2rem] bg-gradient-to-l from-[#785600] to-[#B8860B] text-white font-arabic font-black text-lg shadow-2xl hover:scale-105 transition-all duration-500"
                >
                  ابدأ التسوق الآن
                  <span className="text-2xl">←</span>
                </Link>
            </ScrollReveal>
        </section>

      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
