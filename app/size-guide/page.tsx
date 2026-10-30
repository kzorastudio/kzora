import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'

export const metadata: Metadata = {
  title: 'دليل المقاسات — كيف تختار مقاس حذائك | كزورا Kzora',
  description: 'جدول مقاسات الأحذية الأوروبية من 36 إلى 46 مع طول القدم بالسنتيمتر، وطريقة قياس قدمك في البيت، ومعنى القالب الضيّق والواسع والنظامي في متجر كزورا Kzora.',
  alternates: {
    canonical: '/size-guide',
  },
  openGraph: {
    title: 'دليل المقاسات — كزورا Kzora',
    description: 'كيف تقيس قدمك وتختار المقاس الصحيح قبل الطلب.',
    url: 'https://www.kzora.co/size-guide',
    type: 'article',
  },
}

// EU sizes Kzora stocks (36–46). Foot length is the standard EU (Paris point)
// conversion: each size step ≈ 6.67 mm, foot ≈ shoe last minus ~1 cm.
const SIZE_ROWS: { eu: number; cm: string }[] = [
  { eu: 36, cm: '23.0' },
  { eu: 37, cm: '23.7' },
  { eu: 38, cm: '24.3' },
  { eu: 39, cm: '25.0' },
  { eu: 40, cm: '25.7' },
  { eu: 41, cm: '26.3' },
  { eu: 42, cm: '27.0' },
  { eu: 43, cm: '27.7' },
  { eu: 44, cm: '28.3' },
  { eu: 45, cm: '29.0' },
  { eu: 46, cm: '29.7' },
]

const STEPS = [
  'ضع ورقة بيضاء على أرض مستوية وملاصقة للحائط.',
  'قف على الورقة حافياً بحيث يلامس كعبك الحائط، ويفضّل القياس آخر النهار لأن القدم تكون في أكبر حجم لها.',
  'ضع علامة عند طرف أطول إصبع في قدمك.',
  'قِس المسافة من حافة الورقة عند الحائط حتى العلامة بالسنتيمتر، وكرر ذلك للقدم الثانية واعتمد القياس الأكبر.',
  'ابحث عن طول قدمك في الجدول. إذا وقع بين مقاسين فاختر المقاس الأكبر.',
]

const MOLDS = [
  {
    name: 'قالب نظامي',
    advice: 'اطلب مقاسك المعتاد كما هو في الجدول.',
  },
  {
    name: 'قالب ضيّق',
    advice: 'ننصح بطلب مقاس أكبر بدرجة واحدة من مقاسك المعتاد.',
  },
  {
    name: 'قالب واسع',
    advice: 'ننصح بطلب مقاس أصغر بدرجة واحدة من مقاسك المعتاد.',
  },
]

export default function SizeGuidePage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'دليل المقاسات — كيف تختار مقاس حذائك',
    description: 'جدول مقاسات الأحذية الأوروبية من 36 إلى 46 مع طول القدم بالسنتيمتر، وطريقة قياس القدم، ومعنى نوع القالب.',
    inLanguage: 'ar',
    url: 'https://www.kzora.co/size-guide',
    author: { '@type': 'Organization', name: 'كزورا Kzora', url: 'https://www.kzora.co' },
    publisher: { '@id': 'https://www.kzora.co' },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://www.kzora.co' },
      { '@type': 'ListItem', position: 2, name: 'دليل المقاسات', item: 'https://www.kzora.co/size-guide' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-36">
        {/* ── HERO ── */}
        <section className="relative py-16 md:py-20 px-6 text-center border-b border-[#F0EBE3] bg-white">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-arabic text-4xl md:text-5xl font-black text-[#1A1A1A] leading-tight mb-5 tracking-tight">
              دليل المقاسات
            </h1>
            <p className="font-arabic text-[#6B6560] text-base md:text-lg leading-relaxed">
              لاختيار مقاسك: قِس طول قدمك بالسنتيمتر، وابحث عنه في الجدول، ثم انتبه لنوع القالب المكتوب في صفحة كل حذاء.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 md:px-6 py-14 md:py-20 flex flex-col gap-14">
          {/* ── SIZE TABLE ── */}
          <section>
            <h2 className="font-arabic text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">جدول المقاسات</h2>
            <p className="font-arabic text-sm text-[#6B6560] mb-5 leading-relaxed">
              المقاسات في كزورا أوروبية (EU) من 36 إلى 46. الأطوال تقريبية لطول القدم نفسها.
            </p>
            <div className="bg-white rounded-2xl border border-[#F0EBE3] overflow-hidden">
              <table className="w-full text-center font-arabic">
                <thead className="bg-[#FAF8F5] text-[#1A1A1A] text-sm">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 font-bold">المقاس الأوروبي (EU)</th>
                    <th scope="col" className="py-3.5 px-4 font-bold">طول القدم (سم)</th>
                  </tr>
                </thead>
                <tbody className="text-[#3D3B38]">
                  {SIZE_ROWS.map((row) => (
                    <tr key={row.eu} className="border-t border-[#F0EBE3]">
                      <td className="py-3 px-4 font-bold">{row.eu}</td>
                      <td className="py-3 px-4" dir="ltr">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── HOW TO MEASURE ── */}
          <section>
            <h2 className="font-arabic text-xl md:text-2xl font-bold text-[#1A1A1A] mb-5">كيف تقيس قدمك في البيت؟</h2>
            <ol className="flex flex-col gap-3">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-4 items-start bg-white rounded-2xl border border-[#F0EBE3] p-5">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#785600]/10 text-[#785600] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="font-arabic text-[#3D3B38] leading-[1.9] text-sm md:text-base">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── MOLD TYPES ── */}
          <section>
            <h2 className="font-arabic text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">ما معنى نوع القالب؟</h2>
            <p className="font-arabic text-sm text-[#6B6560] mb-5 leading-relaxed">
              بعض الأحذية تأتي بقالب أضيق أو أوسع من المعتاد، لذلك نكتب نوع القالب تحت المقاسات في صفحة كل حذاء.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MOLDS.map((m) => (
                <div key={m.name} className="bg-white rounded-2xl border border-[#F0EBE3] p-5">
                  <h3 className="font-arabic font-bold text-[#1A1A1A] mb-2">{m.name}</h3>
                  <p className="font-arabic text-sm text-[#3D3B38] leading-[1.9]">{m.advice}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── HELP ── */}
          <section className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-arabic text-2xl font-bold text-white mb-4">ما زلت محتاراً؟</h2>
            <p className="font-arabic text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
              أرسل لنا طول قدمك واسم الحذاء على الواتساب ونقترح عليك المقاس. وإذا لم يناسبك، راجع{' '}
              <Link href="/returns-exchanges" className="underline text-white">سياسة التبديل</Link>.
            </p>
            <a
              href="https://wa.me/963964514765"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-[#1A1A1A] px-10 py-4 rounded-2xl font-arabic font-bold hover:scale-105 transition-transform"
            >
              اسألنا عن مقاسك
            </a>
          </section>
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
