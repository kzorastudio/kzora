import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ChevronDown } from 'lucide-react'
import { getExchangeDays, daysText } from '@/lib/returnPolicy'

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة — متجر كزورا Kzora للأحذية في سوريا',
  description: 'إجابات عن أكثر الأسئلة شيوعاً حول الطلب من متجر كزورا Kzora: التوصيل لكل المحافظات السورية، الدفع عند الاستلام، تبديل المقاس، الإرجاع، وتتبع الطلب.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'الأسئلة الشائعة — متجر كزورا Kzora',
    description: 'كل ما تحتاج معرفته قبل الطلب من كزورا: التوصيل، الدفع عند الاستلام، تبديل المقاس والإرجاع.',
    url: 'https://www.kzora.co/faq',
    type: 'website',
  },
}

// The exchange window comes from the admin panel; saving the returns page purges this page.
export const revalidate = 3600

// Single source for both the visible page and the FAQPage schema — Google only
// honours FAQ markup whose answers are also visible on the page.
// `exchange` is the admin-set exchange window as text, e.g. "٣ أيام".
function faqGroups(exchange: string): { title: string; items: { q: string; a: string }[] }[] {
  return [
  {
    title: 'الطلب والدفع',
    items: [
      {
        q: 'ما هو متجر كزورا Kzora؟',
        a: 'كزورا Kzora متجر أحذية أونلاين مقره حلب في سوريا، يبيع أحذية رجالية ونسائية ورياضية بجودة عالية، ويوصل الطلبات لجميع المحافظات السورية مع الدفع عند الاستلام.',
      },
      {
        q: 'كيف يُكتب اسم كزورا بالإنجليزية؟',
        a: 'يُكتب Kzora (أو KZORA)، والموقع الرسمي للمتجر هو kzora.co. للوصول إلينا من محركات البحث اكتب «كزورا» أو «متجر كزورا للأحذية» أو «Kzora shoes».',
      },
      {
        q: 'كيف أطلب من موقع كزورا؟',
        a: 'اختر المنتج والمقاس من موقع kzora.co وأضفه للسلة، ثم أكمل الطلب بإدخال اسمك ورقمك وعنوانك. سيتواصل معك فريقنا عبر الواتساب لتأكيد الطلب. ويمكنك أيضاً الطلب مباشرة عبر الواتساب على الرقم 963964514765.',
      },
      {
        q: 'هل يتوفر الدفع عند الاستلام؟',
        a: 'نعم، يمكنك الدفع نقداً عند استلام طلبك. وفي حلب يمكنك فحص المقاس والجودة أمام المندوب قبل الدفع. ونقبل أيضاً الدفع المسبق عبر شام كاش.',
      },
      {
        q: 'بأي عملة تكون الأسعار؟',
        a: 'الأسعار معروضة بالليرة السورية وبالدولار الأمريكي، ويمكنك الدفع بأي منهما.',
      },
    ],
  },
  {
    title: 'الشحن والتوصيل',
    items: [
      {
        q: 'هل يتوفر توصيل لكافة المحافظات السورية؟',
        a: 'نعم. داخل مدينة حلب يصلك الطلب لباب منزلك عبر مندوبي كزورا. ولريف حلب وباقي المحافظات (دمشق، حمص، حماة، اللاذقية، طرطوس وغيرها) نشحن عبر شركات شحن معتمدة مثل القدموس والكرم ومسارات.',
      },
      {
        q: 'كم يستغرق التوصيل؟',
        a: 'داخل حلب يصلك الطلب بسرعة عبر مندوبينا. ولباقي المحافظات يصل الطلب خلال ٢ إلى ٤ أيام عمل عبر شركة الشحن.',
      },
      {
        q: 'كم تكلفة الشحن؟',
        a: 'تُحسب أجور التوصيل والشحن تلقائياً في سلة المشتريات حسب عدد القطع، فتعرف التكلفة قبل تأكيد الطلب. وللطلبات التي تزيد عن ٣ قطع نتواصل معك عبر الواتساب لتنسيق أفضل سعر.',
      },
      {
        q: 'كيف أتتبع طلبي؟',
        a: 'من صفحة "تتبع الطلب" في الموقع، باستخدام رقم الهاتف الذي طلبت به.',
      },
    ],
  },
  {
    title: 'المقاسات والإرجاع',
    items: [
      {
        q: 'هل يمكنني تبديل المقاس إذا لم يكن مناسباً؟',
        a: `نعم. في حلب تفحص المقاس لحظة وصول المندوب، وإذا لم يناسبك تعيده معه فوراً وتدفع أجرة التوصيل فقط. وفي باقي المحافظات يحق لك تبديل المقاس خلال ${exchange} من الاستلام، بشرط ألا يكون الحذاء ملبوساً وأن يكون بعلبته الأصلية، ويتحمل الزبون أجور الشحن ذهاباً وإياباً.`,
      },
      {
        q: 'ما هي سياسة الإرجاع؟',
        a: `يمكن إرجاع المنتج خلال ${exchange} من الاستلام في حال وجود عيب مصنعي أو إرسال منتج خاطئ، وفي هذه الحالة تتحمل كزورا تكاليف الشحن. يُشترط أن يكون الحذاء غير ملبوس وبعلبته الأصلية. تواصل معنا عبر الواتساب مع رقم الطلب.`,
      },
      {
        q: 'كيف أعرف مقاسي؟',
        a: 'قِس طول قدمك بالسنتيمتر وطابقه مع جدول المقاسات في صفحة دليل المقاسات (المقاسات من 36 إلى 46). وانتبه لنوع القالب المكتوب في صفحة الحذاء: القالب الضيّق يحتاج مقاساً أكبر بدرجة، والواسع مقاساً أصغر بدرجة. وإذا احترت راسلنا على الواتساب.',
      },
    ],
  },
  {
    title: 'الجودة والثقة',
    items: [
      {
        q: 'ما جودة الأحذية في كزورا؟',
        a: 'ننتقي أحذية مصنوعة من خامات وجلود عالية الجودة تجمع بين المتانة والراحة والأناقة، ونلتزم بأن تطابق الصور والوصف المنتج الحقيقي.',
      },
      {
        q: 'هل كزورا متجر موثوق؟',
        a: 'نعم، كزورا متجر سوري يعمل من حلب، ويمكنك قراءة تقييمات زبائننا الحقيقيين في صفحة آراء العملاء. والدفع عند الاستلام يضمن ألا تدفع إلا بعد أن يصلك طلبك.',
      },
      {
        q: 'ما هي أوقات العمل وكيف أتواصل معكم؟',
        a: 'نعمل يومياً من الساعة ٩ صباحاً حتى ١٠ مساءً ما عدا يوم الجمعة. تواصل معنا عبر الواتساب على الرقم 963964514765، أو عبر صفحاتنا على فيسبوك وإنستغرام kzora.studio.',
      },
    ],
  },
  ]
}

export default async function FaqPage() {
  const FAQ_GROUPS = faqGroups(daysText(await getExchangeDays()))

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://www.kzora.co' },
      { '@type': 'ListItem', position: 2, name: 'الأسئلة الشائعة', item: 'https://www.kzora.co/faq' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Header />
      <main dir="rtl" className="min-h-screen bg-[#FAFAF9] pt-36">
        {/* ── HERO ── */}
        <section className="relative py-16 md:py-20 px-6 text-center border-b border-[#F0EBE3] bg-white">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-arabic text-4xl md:text-5xl font-black text-[#1A1A1A] leading-tight mb-5 tracking-tight">
              الأسئلة الشائعة
            </h1>
            <p className="font-arabic text-[#6B6560] text-base md:text-lg leading-relaxed">
              كل ما تحتاج معرفته قبل الطلب من كزورا: التوصيل، الدفع عند الاستلام، تبديل المقاس والإرجاع.
            </p>
          </div>
        </section>

        {/* ── QUESTIONS ── */}
        <section className="py-14 md:py-20 px-4 md:px-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-12">
            {FAQ_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="font-arabic text-xl md:text-2xl font-bold text-[#1A1A1A] mb-5">{group.title}</h2>
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <details
                      key={item.q}
                      className="group bg-white rounded-2xl border border-[#F0EBE3] open:border-[#785600]/20 open:shadow-lg open:shadow-[#785600]/5 transition-all"
                    >
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 md:p-6 [&::-webkit-details-marker]:hidden">
                        <h3 className="font-arabic font-bold text-[#1A1A1A] text-base md:text-lg">{item.q}</h3>
                        <ChevronDown size={20} className="shrink-0 text-[#785600] transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="font-arabic text-[#3D3B38] leading-[2] text-sm md:text-base px-5 md:px-6 pb-5 md:pb-6">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-[#1A1A1A] rounded-3xl p-8 md:p-12 text-center">
              <h2 className="font-arabic text-2xl font-bold text-white mb-4">لم تجد جواب سؤالك؟</h2>
              <p className="font-arabic text-white/60 mb-8 max-w-md mx-auto">
                فريقنا جاهز للرد عليك عبر الواتساب، ويمكنك أيضاً قراءة{' '}
                <Link href="/reviews" className="underline text-white">تجارب زبائننا</Link>.
              </p>
              <a
                href="https://wa.me/963964514765"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-[#1A1A1A] px-10 py-4 rounded-2xl font-arabic font-bold hover:scale-105 transition-transform"
              >
                تواصل معنا الآن
              </a>
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
