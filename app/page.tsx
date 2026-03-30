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
    .select(`*, product_images (*), product_colors (*), product_sizes (*), product_tags (*), categories (*)`)
    .eq('is_published', true)
    .in('id', productIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (prodError || !products) return []

  return products.map((p: Record<string, unknown>) => ({
    ...p,
    images:   (p.product_images as { display_order: number }[] ?? []).sort((a, b) => a.display_order - b.display_order),
    colors:   p.product_colors ?? [],
    sizes:    ((p.product_sizes as { size: number }[] ?? [])).map((s) => s.size).sort((a, b) => a - b),
    tags:     ((p.product_tags as { tag: string }[] ?? [])).map((t) => t.tag),
    category: Array.isArray(p.categories) ? (p.categories[0] ?? null) : (p.categories ?? null),
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

      <main className="min-h-screen bg-[#FAF8F5] pt-24">
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
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
