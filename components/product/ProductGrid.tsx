'use client'

import { cn } from '@/lib/utils'
import type { ProductFull } from '@/types'
import { ProductCard } from './ProductCard'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

interface ProductGridProps {
  products: ProductFull[]
  isLoading?: boolean
  columns?: number
  className?: string
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="aspect-[3/4] bg-[#ECEAE6] shimmer" />
      <div className="p-3 space-y-2">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#ECEAE6] shimmer" />
          ))}
        </div>
        <div className="h-4 w-3/4 rounded-lg bg-[#ECEAE6] shimmer" />
        <div className="h-3 w-1/3 rounded-lg bg-[#ECEAE6] shimmer" />
      </div>
    </div>
  )
}

export function ProductGrid({
  products,
  isLoading = false,
  columns = 4,
  className,
}: ProductGridProps) {
  const colClass: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }

  if (isLoading) {
    return (
      <div
        dir="rtl"
        className={cn(
          'grid gap-3 md:gap-5',
          colClass[columns] ?? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-[#F0EBE3] flex items-center justify-center mb-8 rotate-3 shadow-inner">
          <ShoppingBag size={32} className="text-[#9E9890]" />
        </div>
        <h3 className="font-arabic text-[#1A1A1A] font-bold text-2xl mb-2">لا توجد منتجات حالياً</h3>
        <p className="font-arabic text-[#9E9890] text-base mb-8 max-w-xs mx-auto">نحن نعمل على إضافة منتجات جديدة لهذا القسم قريباً. ترقبونا!</p>
        <Link 
            href="/products" 
            className="bg-[#785600] text-white px-10 py-3.5 rounded-2xl font-arabic font-bold hover:scale-105 transition-transform"
        >
            تصفح كل المنتجات
        </Link>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className={cn(
        'grid gap-3 md:gap-5',
        colClass[columns] ?? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
