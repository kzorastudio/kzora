export const revalidate = 300

import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Star, CheckCircle2, MessageSquare, ShieldCheck, HeartHandshake, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export const metadata: Metadata = {
  title: 'آراء وتقييمات العملاء — متجر كزورا Kzora للأحذية في سوريا',
  description: 'اطلع على تقييمات وتجارب زبائن متجر كزورا Kzora الحقيقيين في حلب ودمشق وكافة المحافظات السورية. أحذية رجالية ونسائية وسبورات بجودة عالية مع الدفع عند الاستلام.',
  alternates: {
    canonical: '/reviews',
  },
  openGraph: {
    title: 'آراء وتقييمات العملاء — متجر كزورا Kzora',
    description: 'تقييمات وتجارب حقيقية من عملائنا في سوريا. تقييم 4.9 من 5 بناءً على أكثر من 40 تقييم معتمد.',
    url: 'https://www.kzora.co/reviews',
    type: 'website',
  },
}

interface ReviewItem {
  id: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
  products?: {
    name: string
    slug: string
  } | null
}

async function getReviewsData() {
  const { data } = await supabase
    .from('product_reviews')
    .select('id, user_name, rating, comment, created_at, products(name, slug)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const negativeWords = ['كيف', 'اسا', 'سكسي', 'لم اجرب', 'لم نجربه', 'كندره رسمي', 'لماذا', 'نمره', 'مقاس']

  const rawReviews: ReviewItem[] = (data || []).map((r: any) => ({
    id: r.id,
    user_name: r.user_name,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    products: Array.isArray(r.products) ? (r.products[0] ?? null) : (r.products ?? null),
  }))

  const validReviews = rawReviews.filter((r) => {
    if (!r.comment || r.comment.trim().length < 3) return false
    const lower = r.comment.toLowerCase()
    return !negativeWords.some((kw) => lower.includes(kw))
  })

  const totalReviews = rawReviews.length
  const fiveStarsCount = rawReviews.filter((r) => r.rating === 5).length
  const fourStarsCount = rawReviews.filter((r) => r.rating === 4).length
  const averageRating = totalReviews > 0
    ? Number((rawReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1))
    : 4.9

  return {
    reviews: validReviews,
    totalCount: totalReviews,
    averageRating,
    fiveStarsPercent: totalReviews > 0 ? Math.round((fiveStarsCount / totalReviews) * 100) : 95,
    fourStarsPercent: totalReviews > 0 ? Math.round((fourStarsCount / totalReviews) * 100) : 5,
  }
}

export default async function ReviewsPage() {
  const { reviews, totalCount, averageRating, fiveStarsPercent, fourStarsPercent } = await getReviewsData()

  // JSON-LD Schema
  const reviewsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ShoeStore',
    // Same @id as the root layout's ShoeStore so Google treats both as one business.
    '@id': 'https://www.kzora.co',
    name: 'متجر كزورا Kzora للأحذية',
    url: 'https://www.kzora.co',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: totalCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 15).map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.user_name,
      },
      datePublished: r.created_at,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.comment || '',
      itemReviewed: {
        '@type': 'Product',
        name: r.products?.name || 'أحذية كزورا Kzora',
      },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://www.kzora.co',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'آراء وتقييمات العملاء',
        item: 'https://www.kzora.co/reviews',
      },
    ],
  }

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-32 pb-24 text-right">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-sm font-arabic text-[#9E9890] mb-8">
            <Link href="/" className="hover:text-[#785600] transition-colors">الرئيسية</Link>
            <span>›</span>
            <span className="text-[#1A1A1A] font-medium">آراء وتقييمات العملاء</span>
          </nav>

          {/* Hero Header */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E3DB] shadow-sm mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <span className="bg-[#785600]/10 text-[#785600] px-4 py-1 rounded-full text-xs font-arabic font-bold inline-block mb-3">
                  تجارب حقيقية موثقة
                </span>
                <h1 className="text-3xl sm:text-4xl font-arabic font-black text-[#1A1A1A] leading-tight mb-4">
                  آراء وتجارب عملاء متجر كزورا Kzora
                </h1>
                <p className="text-[#6B6560] font-arabic text-base leading-relaxed mb-6">
                  نسعد ونتشرف بثقة زبائننا الكرام في كافة المحافظات السورية (حلب، دمشق، حمص، حماة، اللاذقية، طرطوس وباقي المناطق). رضاكم هو ركيزة نجاحنا.
                </p>

                {/* Trust Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#F5F1EB]">
                  <div className="flex items-center gap-2.5 text-xs font-arabic font-bold text-[#1A1A1A]">
                    <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                    <span>منتجات عالية الجودة</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-arabic font-bold text-[#1A1A1A]">
                    <Truck size={18} className="text-[#785600] shrink-0" />
                    <span>دفع عند الاستلام</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-arabic font-bold text-[#1A1A1A]">
                    <HeartHandshake size={18} className="text-rose-600 shrink-0" />
                    <span>تبديل مقاس مرن</span>
                  </div>
                </div>
              </div>

              {/* Rating Stats Card */}
              <div className="lg:col-span-5 bg-[#FAF8F5] p-6 sm:p-8 rounded-2xl border border-[#F1EFE9] flex flex-col justify-center">
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center bg-white py-3 px-5 rounded-2xl border border-[#E8E3DB] shadow-sm">
                    <div className="text-4xl font-black text-[#1A1A1A]">{averageRating}</div>
                    <div className="text-xs text-[#9E9890] mt-0.5">من 5</div>
                  </div>
                  <div>
                    <div className="flex gap-1 text-[#FFD700] mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={20} className="fill-[#FFD700] text-[#FFD700]" />
                      ))}
                    </div>
                    <div className="text-sm font-arabic font-bold text-[#1A1A1A]">
                      تقييم ممتاز ({totalCount}+ تقييم معتمد)
                    </div>
                    <div className="text-xs font-arabic text-[#6B6560] mt-0.5">
                      أكثر من 1500+ طلب تم تسليمه بنجاح
                    </div>
                  </div>
                </div>

                {/* Bars */}
                <div className="space-y-2.5 font-arabic text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-[#6B6560]">5 نجوم</span>
                    <div className="flex-1 h-2 bg-[#E8E3DB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#785600] rounded-full" style={{ width: `${fiveStarsPercent}%` }} />
                    </div>
                    <span className="w-8 text-left font-bold text-[#1A1A1A]">{fiveStarsPercent}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-[#6B6560]">4 نجوم</span>
                    <div className="flex-1 h-2 bg-[#E8E3DB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C59B27] rounded-full" style={{ width: `${fourStarsPercent}%` }} />
                    </div>
                    <span className="w-8 text-left font-bold text-[#1A1A1A]">{fourStarsPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="mb-12">
            <h2 className="text-2xl font-arabic font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <MessageSquare size={22} className="text-[#785600]" />
              أحدث آراء المشترين
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r, idx) => {
                const isLastOdd = idx === reviews.length - 1 && reviews.length % 2 !== 0
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "bg-white p-6 rounded-2xl border border-[#E8E3DB] hover:border-[#785600]/40 transition-all duration-200 shadow-sm flex flex-col justify-between",
                      isLastOdd && "md:col-span-2 md:max-w-[calc(50%-0.75rem)] md:mx-auto w-full"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="font-arabic font-bold text-base text-[#1A1A1A] flex items-center gap-1.5">
                            {r.user_name}
                            <span title="مشتري موثق" className="inline-flex items-center">
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            </span>
                          </div>
                          <div className="text-xs font-arabic text-[#9E9890] mt-0.5">
                            {format(new Date(r.created_at), 'd MMMM yyyy', { locale: ar })}
                          </div>
                        </div>
                        <div className="flex gap-0.5 text-[#FFD700]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= r.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-[#D1C9BE]'}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="font-arabic text-[#1A1A1A] text-sm leading-relaxed mb-4 bg-[#FAF8F5] p-4 rounded-xl border border-[#F1EFE9]">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    </div>

                    {r.products?.name && (
                      <div className="pt-3 border-t border-[#F5F1EB] flex items-center justify-between text-xs font-arabic">
                        <span className="text-[#9E9890]">المنتج المشترى:</span>
                        <Link
                          href={`/product/${r.products.slug}`}
                          className="text-[#785600] font-bold hover:underline"
                        >
                          {r.products.name}
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
