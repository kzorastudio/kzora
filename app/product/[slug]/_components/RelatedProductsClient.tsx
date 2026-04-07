'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductFull } from '@/types'

interface Props {
  products: ProductFull[]
}

export default function RelatedProductsClient({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollByAmount = (dir: 'prev' | 'next') => {
    if (!scrollRef.current) return
    // We scroll by approximately one product card width
    scrollRef.current.scrollBy({ left: dir === 'next' ? -340 : 340, behavior: 'smooth' })
  }

  return (
    <section className="mt-20">
      {/* Header with Title and Nav Buttons */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h2 className="font-arabic text-2xl md:text-3xl font-bold text-[#1A1A1A]">
          منتجات قد تعجبك
        </h2>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount('prev')}
            aria-label="السابق"
            className="w-10 h-10 rounded-full border border-[#D3C4AF] flex items-center justify-center text-[#6B6560] hover:bg-[#785600] hover:text-white hover:border-[#785600] transition-all duration-200"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('next')}
            aria-label="التالي"
            className="w-10 h-10 rounded-full border border-[#D3C4AF] flex items-center justify-center text-[#6B6560] hover:bg-[#785600] hover:text-white hover:border-[#785600] transition-all duration-200"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        dir="rtl"
        className="flex gap-4 md:gap-8 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="min-w-[200px] sm:min-w-[260px] md:min-w-[300px] snap-start shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
