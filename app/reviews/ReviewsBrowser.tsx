'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Star, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export interface ReviewItem {
  id: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
  products?: { name: string; slug: string } | null
}

/** The review list with filters by star rating and by product. */
export default function ReviewsBrowser({ reviews }: { reviews: ReviewItem[] }) {
  const [stars, setStars]     = useState<number | null>(null)
  const [product, setProduct] = useState('')

  // Products that have at least one shown review, by name
  const products = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of reviews) if (r.products?.slug) map.set(r.products.slug, r.products.name)
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [reviews])

  // Star counts follow the chosen product, so each chip says what it will show
  const byProduct = product ? reviews.filter((r) => r.products?.slug === product) : reviews
  const starCount = (s: number) => byProduct.filter((r) => r.rating === s).length
  const shown = stars ? byProduct.filter((r) => r.rating === stars) : byProduct

  const chip = (active: boolean) => cn(
    'h-9 px-3.5 rounded-full border text-sm font-arabic font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap',
    active
      ? 'bg-[#785600] border-[#785600] text-white'
      : 'bg-white border-[#E8E3DB] text-[#1A1A1A] hover:border-[#785600]/50'
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب التقييم">
          <button type="button" onClick={() => setStars(null)} className={chip(stars === null)}>
            الكل <span className="opacity-70">({byProduct.length})</span>
          </button>
          {[5, 4, 3, 2, 1].map((s) => {
            const n = starCount(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStars(stars === s ? null : s)}
                disabled={n === 0 && stars !== s}
                className={cn(chip(stars === s), 'disabled:opacity-40 disabled:cursor-not-allowed')}
              >
                {s}
                <Star size={13} className={stars === s ? 'fill-white text-white' : 'fill-[#FFD700] text-[#FFD700]'} />
                <span className="opacity-70">({n})</span>
              </button>
            )
          })}
        </div>

        {products.length > 1 && (
          <select
            id="reviews-product-filter"
            value={product}
            onChange={(e) => { setProduct(e.target.value); setStars(null) }}
            aria-label="تصفية حسب المنتج"
            className="sm:mr-auto h-10 w-full sm:w-64 rounded-xl border border-[#E8E3DB] bg-white px-3 text-sm font-arabic text-[#1A1A1A] focus:outline-none focus:border-[#785600]"
          >
            <option value="">كل المنتجات</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <p className="font-arabic text-sm text-[#6B6560] bg-white border border-[#E8E3DB] rounded-2xl p-6 text-center">
          لا توجد تقييمات بهذا الاختيار.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shown.map((r, idx) => {
            const isLastOdd = idx === shown.length - 1 && shown.length % 2 !== 0
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

                  {r.comment?.trim() ? (
                    <p className="font-arabic text-[#1A1A1A] text-sm leading-relaxed mb-4 bg-[#FAF8F5] p-4 rounded-xl border border-[#F1EFE9]">
                      &ldquo;{r.comment.trim()}&rdquo;
                    </p>
                  ) : (
                    <p className="font-arabic text-[#9E9890] text-sm mb-4">تقييم بالنجوم بدون تعليق</p>
                  )}
                </div>

                {r.products?.name && (
                  <div className="pt-3 border-t border-[#F5F1EB] flex items-center justify-between text-xs font-arabic">
                    <span className="text-[#9E9890]">المنتج المشترى:</span>
                    <Link href={`/product/${r.products.slug}`} className="text-[#785600] font-bold hover:underline">
                      {r.products.name}
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
