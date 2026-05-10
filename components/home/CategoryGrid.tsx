'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
}

export default function CategoryGrid({ categories }: Props) {
  if (!categories || categories.length === 0) return null

  const count = categories.length

  return (
    <section dir="rtl" className="py-12 md:py-24 px-4 md:px-8 bg-[#FAF8F5]">
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10 md:mb-16">
          <div>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-arabic font-bold text-[#1A1A1A] mb-3">
              تسوق حسب القسم
            </h2>
            <div className="w-16 h-1 bg-[#785600]" />
          </div>
          <Link
            href="/categories"
            className="text-[#785600] font-arabic font-bold text-sm flex items-center gap-1.5 hover:gap-3 transition-all duration-200"
          >
            عرض الكل
            <span className="text-lg leading-none">←</span>
          </Link>
        </div>

        {/* Dynamic Grid — works for any count */}
        <div className={cn(
          "grid gap-4 md:gap-6",
          count === 1 && "grid-cols-1 max-w-3xl mx-auto",
          count === 2 && "grid-cols-1 sm:grid-cols-2",
          count >= 3 && "grid-cols-1 sm:grid-cols-2",
        )}>
          {categories.map((cat, i) => {
            const isFeatured = i === 0
            const isFullWidth = isFeatured && count >= 3

            return (
              <CategoryCard
                key={cat.id}
                category={cat}
                className={cn(
                  // Default height for all cards
                  "h-[280px] md:h-[320px]",
                  // Single category — taller
                  count === 1 && "h-[350px] md:h-[480px]",
                  // Featured first card spans full width when 3+ categories
                  isFullWidth && "sm:col-span-2 h-[320px] md:h-[420px]",
                  // If odd number of remaining cards, last one spans full width
                  !isFeatured && count >= 3 && i === count - 1 && (count - 1) % 2 !== 0 && "sm:col-span-2",
                )}
                isFeatured={isFeatured}
                subtitle={isFeatured && count > 1 ? "تشكيلة فاخرة وحصرية" : undefined}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CategoryCard({ 
  category, 
  className, 
  isFeatured = false,
  subtitle 
}: { 
  category: Category; 
  className?: string; 
  isFeatured?: boolean;
  subtitle?: string;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-[#EDE8E1] block transition-all duration-500",
        className
      )}
    >
      {category.image_url && (
        <Image
          src={category.image_url}
          alt={category.name_ar}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority={isFeatured}
        />
      )}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent",
        "transition-opacity duration-300 group-hover:opacity-90"
      )} />
      
      <div className={cn(
        "absolute text-right",
        isFeatured ? "bottom-8 right-8" : "bottom-6 right-6"
      )}>
        <h3 className={cn(
          "font-arabic font-bold text-white mb-2",
          isFeatured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
        )}>
          {category.name_ar}
        </h3>
        {subtitle && (
          <p className="text-white/70 text-xs md:text-sm font-arabic mb-4 line-clamp-1">{subtitle}</p>
        )}
        <span className="inline-flex items-center gap-2 text-[#FFDEA6] border-b border-[#FFDEA6]/30 group-hover:border-[#FFDEA6] pb-0.5 text-xs md:text-sm font-arabic transition-all">
          اكتشف القسم
          <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">←</span>
        </span>
      </div>
    </Link>
  )
}
