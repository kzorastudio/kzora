import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'سياسة الإرجاع والاستبدال — كزورا',
  description: 'سياسات وشروط الإرجاع والاستبدال للمنتجات في متجر كزورا',
}

async function getPage() {
  const { data } = await supabaseAdmin
    .from('static_pages')
    .select('title, content, meta')
    .eq('slug', 'returns-exchanges')
    .single()
  return data
}

const WHATSAPP = process.env.WHATSAPP_NUMBER ?? '963964514765'

export default async function ReturnPolicyPage() {
  const page = await getPage()

  const title = page?.title || 'سياسة الإرجاع والاستبدال'
  const paragraphs = page?.content
    ? page.content.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [
        'يحق لك إرجاع أو استبدال المنتج خلال 7 أيام من تاريخ الاستلام.',
        'يُشترط أن يكون المنتج بحالته الأصلية تماماً وغير مستخدم أو ملبوس، وأن يكون بغلافه وعبوته الأصلية.',
        'في حال الاستبدال بمنتج آخر ذي تكلفة مختلفة، سيتم تسوية فارق السعر بشكل آمن ومريح لك.',
        'للبدء بطلب الإرجاع أو الاستبدال، يُرجى التواصل معنا عبر واتساب وتزويدنا برقم الطلب.',
      ]

  const features = page?.meta?.features || [
    { count: '٧ أيام', label: 'فترة الإرجاع', desc: 'يحق لك الإرجاع أو الاستبدال خلال 7 أيام من استلام الطلب' },
    { count: 'غير مستخدم', label: 'شرط للاسترجاع', desc: 'يجب أن يكون المنتج بحالته الأصلية تماماً وبعلبته الأساسية' },
    { count: '٤٨ ساعة', label: 'سرعة الإنجاز', desc: 'تتم معالجة الطلب واسترداد المبلغ فور فحص المنتج المسترجع' },
  ]

  const icons = [
    (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    )
  ]

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-36">

        {/* ── HERO ── */}
        <section className="relative py-16 px-6 text-center border-b border-[#F0EBE3] bg-white">
          {/* Subtle background gradient & decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#B8860B08_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B8860B]/10 to-transparent" />
          
          <div className="relative z-10 max-w-3xl mx-auto mt-6">
            {/* Title */}
            <h1 className="font-arabic text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] leading-tight mb-4 tracking-tight drop-shadow-sm">
              {title}
            </h1>
            
            {/* Subtitle */}
            <p className="font-arabic text-[#6B6560] text-base md:text-lg max-w-lg mx-auto leading-relaxed">
              تسوق بثقة وراحة بال. اكتشف شروط وخطوات الإرجاع أو الاستبدال بوضوح وشفافية لضمان تجربة مميزة ومريحة.
            </p>
            
            {/* Elegant Divider */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <div className="w-12 h-[1px] bg-[#B8860B]/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/50" />
              <div className="w-12 h-[1px] bg-[#B8860B]/30" />
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="bg-white border-b border-[#F0EBE3]">
          <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((feature: any, i: number) => (
              <div key={feature.label || i} className="group relative flex flex-col gap-4 p-7 rounded-2xl bg-[#FAFAF9] border border-[#F0EBE3] hover:border-[#B8860B]/40 hover:shadow-lg hover:shadow-[#B8860B]/5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B]/20 transition-colors">
                  {icons[i] || icons[0]}
                </div>
                <div>
                  <div className="font-arabic text-2xl font-black text-[#1A1A1A] mb-1">{feature.count}</div>
                  <div className="font-arabic text-sm font-bold text-[#1A1A1A] mb-1">{feature.label}</div>
                  <div className="font-arabic text-xs text-[#9E9890] leading-relaxed">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTENT ── */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">

            <div className="flex items-center gap-4 mb-12">
              <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h2 className="font-arabic text-2xl font-black text-[#1A1A1A]">التفاصيل والشروط</h2>
              </div>
            </div>

            {/* ✏️ EDITABLE: content field in admin/pages — each paragraph separated by blank line */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute right-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#B8860B]/30 via-[#B8860B]/10 to-transparent" />

              <div className="flex flex-col gap-6">
                {paragraphs.map((para: string, i: number) => (
                  <div key={i} className="flex gap-6 group">
                    {/* Step circle */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-[#B8860B]/40 flex items-center justify-center group-hover:border-[#B8860B] group-hover:bg-[#B8860B]/5 transition-all duration-300 z-10 relative">
                        <span className="font-arabic text-xs font-black text-[#B8860B]">{i + 1}</span>
                      </div>
                    </div>
                    {/* Card */}
                    <div className="flex-1 bg-white rounded-2xl border border-[#F0EBE3] p-6 group-hover:border-[#B8860B]/20 group-hover:shadow-md group-hover:shadow-[#B8860B]/5 transition-all duration-300">
                      <p className="font-arabic text-[#3D3B38] leading-[2.2] text-base">{para}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-[#111110] px-8 py-12 text-center">
              {/* bg glow */}
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at center, #B8860B 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22} className="text-[#B8860B]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <p className="font-arabic text-white/50 text-sm mb-2">هل لديك استفسار عن طلب إرجاع؟</p>
                <h3 className="font-arabic text-3xl font-black text-white mb-8">تواصل معنا مباشرة</h3>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن سياسة الإرجاع')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] text-white font-arabic font-black text-base hover:bg-[#22c55e] transition-colors shadow-2xl shadow-[#25D366]/30"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  تواصل عبر واتساب
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
