import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية — كزورا Kzora | حماية بياناتك هدفنا',
  description: 'تعرف على سياسة الخصوصية في متجر كزورا Kzora. نحن نلتزم بحماية بياناتك الشخصية وضمان تجربة تسوق آمنة وسريعة في سوريا.',
  alternates: { 
    canonical: '/privacy-policy',
  },
}

async function getPage() {
  const { data } = await supabaseAdmin
    .from('static_pages')
    .select('title, content')
    .eq('slug', 'privacy-policy')
    .single()
  return data
}

// SVG icons cycling for each paragraph
const ICONS = [
  // Lock
  <svg key="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>,
  // Database
  <svg key="db" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>,
  // Shield
  <svg key="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  // User check
  <svg key="usercheck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>,
  // Eye off
  <svg key="eyeoff" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>,
  // Mail
  <svg key="mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>,
  // Refresh
  <svg key="refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>,
  // Info
  <svg key="info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>,
]

export default async function PrivacyPolicyPage() {
  const page = await getPage()

  const title = page?.title || 'سياسة الخصوصية'
  const paragraphs = page?.content
    ? page.content.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean)
    : [
        'نحن في كزورا نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.',
        'البيانات التي نجمعها تُستخدم فقط لمعالجة طلباتك وتحسين تجربة التسوق.',
        'لا نشارك بياناتك مع أي طرف ثالث دون إذنك الصريح.',
      ]

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-[100px]">

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
              الشفافية والثقة هما أساس رحلتك معنا. تعرّف على كيفية جمع، استخدام، وحماية بياناتك الشخصية بأعلى معايير الأمان.
            </p>
            
            {/* Elegant Divider */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <div className="w-12 h-[1px] bg-[#B8860B]/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/50" />
              <div className="w-12 h-[1px] bg-[#B8860B]/30" />
            </div>
          </div>
        </section>

        {/* ── COMMITMENT BANNER ── */}
        <section className="bg-white border-b border-[#F0EBE3]">
          <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: 'تشفير وحماية',
                desc: 'تُحفظ معلوماتك وفق أعلى معايير الأمان والخصوصية المعتمدة.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                title: 'خصوصية تامة',
                desc: 'نلتزم التزاماً كاملاً بعدم بيع أو مشاركة بياناتك لأي طرف خارجي.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                ),
                title: 'شفافية الاستخدام',
                desc: 'نطلب فقط البيانات المطلوبة لتوصيل طلباتك بنجاح وسرعة.',
              },
            ].map((item) => (
              <div key={item.title} className="group flex items-start gap-4 p-6 rounded-2xl bg-[#FAFAF9] border border-[#F0EBE3] hover:border-[#B8860B]/30 hover:shadow-md hover:shadow-[#B8860B]/5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] shrink-0 group-hover:bg-[#B8860B]/20 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <div className="font-arabic font-black text-[#1A1A1A] text-sm mb-1">{item.title}</div>
                  <div className="font-arabic text-xs text-[#9E9890] leading-relaxed">{item.desc}</div>
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2 className="font-arabic text-2xl font-black text-[#1A1A1A]">البنود والسياسات</h2>
              </div>
            </div>

            {/* ✏️ EDITABLE: content field in admin/pages — each paragraph separated by blank line */}
            <div className="flex flex-col gap-4">
              {paragraphs.map((para: string, i: number) => (
                <div key={i} className="group flex items-start gap-5 p-6 rounded-2xl bg-white border border-[#F0EBE3] hover:border-[#B8860B]/20 hover:shadow-lg hover:shadow-[#B8860B]/5 transition-all duration-300">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] shrink-0 group-hover:bg-[#B8860B]/20 transition-colors">
                    {ICONS[i % ICONS.length]}
                  </div>
                  <p className="font-arabic text-[#3D3B38] leading-[2.2] text-base pt-1.5">{para}</p>
                </div>
              ))}
            </div>

            {/* Last updated */}
            <div className="mt-10 flex items-center gap-3 px-5 py-4 rounded-xl bg-[#FAF8F5] border border-[#F0EBE3]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9E9890" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="font-arabic text-sm text-[#9E9890]">
                آخر تحديث لهذه السياسة: <span className="font-bold text-[#6B6560]">2026</span>
              </p>
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
