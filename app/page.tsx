export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import HeroSlider from '@/components/home/HeroSlider'
import CategoryGrid from '@/components/home/CategoryGrid'
import StatsSection from '@/components/home/StatsSection'
import ProductSection from '@/components/home/ProductSection'
import type { HeroSlide, Category, ProductFull } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ScrollHint } from '@/components/ui/ScrollHint'

// ─── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchProductsByTag(tag: string, limit = 8): Promise<ProductFull[]> {
  const { data: tagRows, error: tagError } = await supabase
    .from('product_tags')
    .select('product_id')
    .eq('tag', tag)

  if (tagError || !tagRows || tagRows.length === 0) return []

  const productIds = tagRows.map((r: { product_id: string }) => r.product_id)

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(`*, product_images (*), product_colors (*), product_sizes (*), product_tags (*), product_variants (*), categories (*)`)
    .eq('is_published', true)
    .in('id', productIds)
    .order('stock_status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (prodError || !products) return []

  return (products || []).map((p: any) => ({
    ...p,
    images:   (p.product_images as { display_order: number }[] ?? []).sort((a, b) => a.display_order - b.display_order),
    colors:   p.product_colors ?? [],
    sizes:    ((p.product_sizes as { size: number; is_available: boolean }[] ?? [])).sort((a, b) => a.size - b.size),
    tags:     ((p.product_tags as { tag: string }[] ?? [])).map((t) => t.tag),
    category: Array.isArray(p.categories) ? (p.categories[0] ?? null) : (p.categories ?? null),
    variants: p.product_variants ?? [],
  })) as ProductFull[]
}

// ─── Promo Banner ──────────────────────────────────────────────────────────────
interface PromoBannerProps {
  settings: any
}

function PromoBanner({ settings }: PromoBannerProps) {
  if (!settings?.promo_banner_url) return null

  return (
    <section className="px-4 md:px-8 py-8 md:py-12 overflow-hidden">
      <ScrollReveal direction="none" duration={0.8} delay={0.1}>
        <div className="max-w-screen-xl mx-auto relative h-[340px] md:h-[400px] rounded-2xl overflow-hidden bg-[#785600] shadow-2xl group">
          <Image
            src={settings.promo_banner_url}
            alt="خصومات الموسم"
            fill
            sizes="100vw"
            className="object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8" dir="rtl">
            <ScrollReveal direction="down" delay={0.2}>
              <span className="bg-white text-[#785600] px-5 py-1.5 rounded-full text-xs font-arabic font-bold mb-6 tracking-widest uppercase inline-block shadow-lg">
                عروض حصرية
              </span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.3}>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-arabic font-bold text-white mb-5 leading-tight drop-shadow-md">
                {settings.promo_banner_heading || 'احصل على خصم مميز'}
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.4}>
              <p className="text-white/80 text-base md:text-lg font-arabic mb-8 max-w-xl leading-relaxed drop-shadow-sm">
                {settings.promo_banner_subtext || 'العرض لفترة محدودة.'}
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.5}>
              <Link
                href={settings.promo_banner_link || '/products?tag=on_sale'}
                className="bg-[#1A1A1A] text-white px-10 py-4 rounded-xl font-arabic font-bold hover:scale-105 transition-transform duration-200 active:scale-95 inline-block shadow-xl shadow-black/20"
              >
                {settings.promo_banner_button_text || 'عرض الكل'}
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  let slides: HeroSlide[]
  let categories: Category[]
  let newProducts: ProductFull[]
  let bestSellers: ProductFull[]
  let offers: ProductFull[]
  let settings: any = null

  const [slidesResult, categoriesResult, _new, _best, _offers, settingsResult] = await Promise.all([
    supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('categories').select('*').eq('show_in_home', true).eq('is_active', true).order('home_order', { ascending: true }).limit(4),
    fetchProductsByTag('new', 8),
    fetchProductsByTag('best_seller', 8),
    fetchProductsByTag('on_sale', 6),
    supabase.from('homepage_settings').select('*').limit(1).single(),
  ])

  slides      = slidesResult.data ?? []
  categories  = categoriesResult.data ?? []
  newProducts = _new
  bestSellers = _best
  offers      = _offers
  settings    = settingsResult.data

  return (
    <>
      <Header />

      {/* FAQ Schema for Google Search Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'هل يتوفر توصيل لكافة المحافظات السورية؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'نعم، في متجر كزورا Kzora نوفر خدمة التوصيل السريع لكافة المحافظات السورية (حلب، دمشق، حمص، حماة، اللاذقية، طرطوس، وغيرها) مع ضمان وصول المنتج بأمان.',
                },
              },
              {
                '@type': 'Question',
                name: 'هل يمكنني تبديل المقاس إذا كان غير مناسب؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'بالتأكيد، في كزورا Kzora رضاكم هو ركيزتنا. نوفر سياسة تبديل مرنة وسهلة خلال ٤٨ ساعة من استلام الطلب لضمان حصولكم على المقاس المثالي.',
                },
              },
              {
                '@type': 'Question',
                name: 'ما هي جودة الأحذية المتوفرة في كزورا Kzora؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'نفتخر في كزورا Kzora بتقديم أحذية مصنعة من أجود الخامات والجلود الطبيعية التي تجمع بين المتانة والأناقة الكلاسيكية والراحة اليومية.',
                },
              },
              {
                '@type': 'Question',
                name: 'كيف يمكنني الطلب من متجر كزورا أونلاين؟',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'يمكنكم الطلب مباشرة عبر موقعنا الإلكتروني kzora.co بإضافة المنتجات للسلة، أو التواصل معنا مباشرة عبر الواتساب على الرقم 963964514765.',
                },
              },
            ],
          }),
        }}
      />

      <main className="min-h-screen bg-[#FAF8F5] pt-24 text-right">
        {/* SEO Accessibility H1 */}
        <h1 className="sr-only">
          متجر كزورا Kzora للأحذية — أفضل متجر أحذية أونلاين في سوريا وحلب. أحذية رجالية، أحذية نسائية، أحذية رياضية، وأحذية جلد طبيعي فاخرة.
        </h1>

        {/* 1. Hero Slider */}
        <HeroSlider 
          slides={slides} 
          badgeText={settings?.hero_badge_text} 
          badgeColor={settings?.hero_badge_color} 
        />

        {/* 1.5 Success Stats (Social Proof) */}
        {settings?.section_stats && (
           <StatsSection settings={settings} />
        )}

        {/* 2. Category Bento Grid */}
        {settings?.section_categories && categories.length > 0 && (
          <ScrollReveal direction="up">
            <CategoryGrid categories={categories} />
          </ScrollReveal>
        )}

        {/* 3. New Arrivals — horizontal scroll with arrows */}
        {settings?.section_new_arrivals && (
          <ScrollReveal direction="left" delay={0.1}>
            <div className="bg-[#F5F3F0]">
              <ProductSection
                title="وصل حديثاً"
                tag="new"
                viewAllHref="/products?tag=new"
                currency="SYP"
                initialProducts={newProducts}
                layout="scroll"
                chipBadge="2026"
              />
            </div>
          </ScrollReveal>
        )}

        {/* 4. Best Sellers — 4-col grid */}
        {settings?.section_best_sellers && (
          <ScrollReveal direction="up" delay={0.2}>
            <ProductSection
              title="الأكثر مبيعاً"
              tag="best_seller"
              viewAllHref="/products?tag=best_seller"
              currency="SYP"
              initialProducts={bestSellers}
              layout="grid"
            />
          </ScrollReveal>
        )}

        {/* 5. Promo Banner */}
        {settings?.section_promo_banner && settings?.promo_banner_url && (
          <PromoBanner settings={settings} />
        )}

        {/* 6. Exclusive Offers — 3-col grid */}
        {settings?.section_offers && (
          <ScrollReveal direction="up" delay={0.2}>
            <ProductSection
              title="عروض حصرية"
              tag="on_sale"
              viewAllHref="/products?tag=on_sale"
              currency="SYP"
              initialProducts={offers}
              layout="grid3"
              badge="ينتهي العرض قريباً"
            />
          </ScrollReveal>
        )}

        {/* 7. SEO Content Section (Rich Text for Search Engines) */}
        <section className="px-8 py-16 border-t border-surface-container-high bg-white/50">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-arabic font-bold text-on-surface mb-6">
                  لماذا تختار كزورا Kzora لتسوق الأحذية في سوريا؟
                </h2>
                <p className="text-secondary font-arabic text-sm leading-relaxed mb-4">
                  يعتبر متجر <span className="text-primary font-bold">كزورا Kzora</span> الوجهة الأولى لعشاق الأناقة والجودة في <span className="font-bold text-on-surface">سوريا</span>. نحن نفخر بتقديم تشكيلة واسعة من <span className="font-bold">الأحذية الرجالية الفاخرة</span> و <span className="font-bold">الأحذية النسائية العصرية</span> التي تناسب كافة الأذواق والمناسبات.
                </p>
                <p className="text-secondary font-arabic text-sm leading-relaxed mb-4">
                  سواء كنت تبحث عن <span className="font-bold">أحذية رياضية (سبور)</span> مريحة للمشي والركض، أو <span className="font-bold">أحذية رسمية</span> للمناسبات الخاصة، أو حتى <span className="font-bold">أحذية طبية</span> توفر الراحة لقدميك، فإن كزورا توفر لك الأفضل بأعلى معايير الجودة وأنسب <span className="font-bold">أسعار الأحذية في سوريا</span>.
                </p>
                <p className="text-secondary font-arabic text-sm leading-relaxed">
                  نحن نتخذ من مدينة <span className="font-bold text-on-surface">حلب</span> مركزاً لنا وفخورون بخدمة زبائننا في كافة المحافظات (دمشق، حمص، حماة، اللاذقية، طرطوس) مع نظام توصيل سريع ودقيق. تسوق الآن عبر الإنترنت وتمتع بتجربة شراء أحذية سهلة وآمنة.
                </p>
              </div>
              <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/30">
                <h3 className="text-lg font-arabic font-bold text-on-surface mb-4">أهم تصنيفاتنا</h3>
                <ul className="grid grid-cols-2 gap-3 text-sm font-arabic text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    أحذية رجالية رسمية وكاجوال
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    أحذية نسائية (كعب، فلات، جزم)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    أحذية رياضية (سنيكرز) ماركات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    صبابات ولحف جلد طبيعي
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    أحذية شتوية وصيفية موديلات 2026
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    إكسسوارات وعناية بالأحذية
                  </li>
                </ul>
                <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-xs font-arabic text-primary leading-relaxed">
                    <strong>كلمات دلالية للبحث:</strong> كزورا، kzora، أحذية سوريا، أحذية حلب، شراء أحذية أونلاين، أسعار الأحذية، أحذية رياضية سوريا، صبابات جلد طبيعي، موديلات أحذية 2026.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
      <ScrollHint />
    </>
  )
}
