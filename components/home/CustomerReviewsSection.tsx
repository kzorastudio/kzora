import Link from 'next/link'
import { Star, MessageSquareQuote, CheckCircle2, ArrowLeft } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export interface HomeReviewItem {
  id: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
  product_name?: string | null
}

interface CustomerReviewsSectionProps {
  reviews: HomeReviewItem[]
  totalReviewsCount?: number
  averageRating?: number
}

export default function CustomerReviewsSection({
  reviews,
  totalReviewsCount = 41,
  averageRating = 4.9,
}: CustomerReviewsSectionProps) {
  if (!reviews || reviews.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-[#FAF8F5] relative overflow-hidden border-t border-[#E8E3DB]/60" dir="rtl">
      {/* Decorative Glow */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-[#785600]/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <ScrollReveal direction="down">
              <span className="bg-[#785600]/10 text-[#785600] px-4 py-1.5 rounded-full text-xs font-arabic font-bold mb-3 inline-block">
                ثقة ومصداقية
              </span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.1}>
              <h2 className="text-2xl sm:text-4xl font-arabic font-bold text-[#1A1A1A] tracking-tight">
                آراء وتجارب عملاء كزورا Kzora
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2}>
              <p className="text-sm sm:text-base font-arabic text-[#6B6560] mt-2 max-w-xl leading-relaxed">
                كلمات حقيقية من عملائنا في مختلف المحافظات السورية تعكس التزامنا بأعلى معايير الجودة والأناقة والخدمة.
              </p>
            </ScrollReveal>
          </div>

          {/* Social Proof Rating Badge */}
          <ScrollReveal direction="left" delay={0.2}>
            <div className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-2xl border border-[#E8E3DB] shadow-sm">
              <div className="text-3xl font-bold font-arabic text-[#1A1A1A]">{averageRating}</div>
              <div className="flex flex-col">
                <div className="flex gap-0.5 text-[#FFD700]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} className="fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
                <span className="text-xs font-arabic text-[#6B6560] font-semibold mt-0.5">
                  بناءً على أكثر من {totalReviewsCount} تقييم معتمد
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((item, idx) => (
            <ScrollReveal key={item.id} direction="up" delay={0.1 * (idx % 3)}>
              <div className="bg-white p-6 rounded-2xl border border-[#E8E3DB] hover:border-[#785600]/40 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full group">
                <div>
                  {/* Top Bar: Stars + Quote Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-[#FFD700]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= item.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-[#D1C9BE]'}
                        />
                      ))}
                    </div>
                    <MessageSquareQuote size={22} className="text-[#785600]/20 group-hover:text-[#785600]/40 transition-colors" />
                  </div>

                  {/* Comment */}
                  <p className="font-arabic text-[#1A1A1A] text-sm leading-relaxed mb-6 font-medium">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-[#F5F1EB] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-arabic font-bold text-sm text-[#1A1A1A] flex items-center gap-1.5">
                      {item.user_name}
                      <span title="مشتري موثق" className="inline-flex items-center">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      </span>
                    </span>
                    {item.product_name && (
                      <span className="text-[11px] font-arabic text-[#785600] mt-0.5 line-clamp-1">
                        طلب: {item.product_name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-arabic text-[#9E9890]">
                    {format(new Date(item.created_at), 'd MMMM yyyy', { locale: ar })}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* View All Reviews CTA */}
        <div className="mt-12 text-center">
          <ScrollReveal direction="up" delay={0.2}>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] border border-[#E8E3DB] hover:border-[#785600] px-8 py-3.5 rounded-xl font-arabic font-bold text-sm transition-all duration-200 shadow-sm group"
            >
              <span>مشاهدة كافة آراء وتقييمات العملاء</span>
              <ArrowLeft size={16} className="rtl:rotate-0 transition-transform group-hover:-translate-x-1 text-[#785600]" />
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
