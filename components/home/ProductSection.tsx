'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/product/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { ProductFull, ProductTag, Currency } from '@/types'

interface Props {
  title: string
  tag?: ProductTag
  viewAllHref?: string
  currency: Currency
  initialProducts?: ProductFull[]
  /** 'scroll' = horizontal scroll with arrows | 'grid' = 4-col grid | 'grid3' = 3-col grid */
  layout?: 'scroll' | 'grid' | 'grid3'
  /** Pulsing red text badge */
  badge?: string
  /** Gold pill chip next to title (e.g. "2024") */
  chipBadge?: string
}

export default function ProductSection({
  title,
  tag,
  viewAllHref,
  currency,
  initialProducts,
  layout = 'grid',
  badge,
  chipBadge,
}: Props) {
  const [products, setProducts] = useState<ProductFull[]>(initialProducts ?? [])
  const [loading, setLoading] = useState(!initialProducts)
  const [error, setError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialProducts) return
    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      setError(false)
      try {
        const params = new URLSearchParams({ limit: '8' })
        if (tag) params.set('tag', tag)
        const res = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        setProducts(data.products ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [tag, initialProducts])

  const scrollBy = (dir: 'prev' | 'next') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'next' ? -340 : 340, behavior: 'smooth' })
  }

  if (error) return null

  return (
    <section
      dir="rtl"
      className={cn(
        'py-12 md:py-24',
        layout === 'scroll' ? 'overflow-hidden' : '',
        layout === 'grid' || layout === 'grid3' ? 'px-4 md:px-8 max-w-screen-xl mx-auto' : ''
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between mb-8 md:mb-12',
        layout === 'scroll' ? 'px-4 md:px-8 max-w-screen-xl mx-auto' : ''
      )}>
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-3xl font-arabic font-bold text-[#1A1A1A]">{title}</h2>
          {chipBadge && (
            <span className="px-3 py-1 bg-[#FFDEA6] text-[#271900] text-xs font-bold rounded-full">
              {chipBadge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {badge && (
            <span className="text-[#BA1A1A] font-arabic font-bold animate-pulse text-sm">
              {badge}
            </span>
          )}
          {viewAllHref && layout !== 'scroll' && (
            <Link
              href={viewAllHref}
              className="text-[#785600] font-arabic font-medium hover:underline text-sm"
            >
              عرض الكل
            </Link>
          )}
          {layout === 'scroll' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollBy('prev')}
                aria-label="السابق"
                className="w-10 h-10 rounded-full border border-[#D3C4AF] flex items-center justify-center text-[#6B6560] hover:bg-[#785600] hover:text-white hover:border-[#785600] transition-all duration-200"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy('next')}
                aria-label="التالي"
                className="w-10 h-10 rounded-full border border-[#D3C4AF] flex items-center justify-center text-[#6B6560] hover:bg-[#785600] hover:text-white hover:border-[#785600] transition-all duration-200"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={cn(
          'grid gap-6',
          layout === 'scroll' ? 'flex gap-8 px-8' : '',
          layout === 'grid' ? 'grid-cols-2 md:grid-cols-4' : '',
          layout === 'grid3' ? 'grid-cols-1 md:grid-cols-3' : ''
        )}>
          {Array.from({ length: layout === 'grid3' ? 3 : 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className={layout === 'scroll' ? 'min-w-[300px]' : ''} />
          ))}
        </div>
      )}

      {/* Products */}
      {!loading && products.length > 0 && (
        <>
          {/* Horizontal scroll (with arrows) */}
          {layout === 'scroll' && (
            <div
              ref={scrollRef}
              className="flex gap-4 md:gap-8 overflow-x-auto pb-6 px-4 md:px-8 no-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {products.map((product) => (
                <div key={product.id} className="min-w-[180px] sm:min-w-[240px] md:min-w-[300px] snap-start shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
              {viewAllHref && (
                <div className="min-w-[160px] snap-start shrink-0 flex items-center justify-center">
                  <Link
                    href={viewAllHref}
                    className="flex flex-col items-center gap-3 text-[#785600] font-arabic font-semibold text-sm hover:opacity-80 transition-opacity"
                  >
                    <span className="w-12 h-12 rounded-full border-2 border-[#785600] flex items-center justify-center">
                      <ChevronLeft size={20} />
                    </span>
                    عرض الكل
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 4-column grid */}
          {layout === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* 3-column grid */}
          {layout === 'grid3' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <p className="text-center font-arabic text-[#9E9890] py-16">لا توجد منتجات حالياً</p>
      )}
    </section>
  )
}
