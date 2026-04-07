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

        {/* Dynamic Layout */}
        <div className="w-full">
          {count === 1 && (
             <div className="max-w-4xl mx-auto">
                <CategoryCard category={categories[0]} className="h-[400px] md:h-[500px]" isFeatured />
             </div>
          )}

          {count === 2 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
                {categories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} className="h-[300px] md:h-[450px]" isFeatured />
                ))}
             </div>
          )}

          {count === 3 && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-auto md:h-[500px]">
                <CategoryCard category={categories[0]} className="md:col-span-2 md:h-full h-[300px]" isFeatured subtitle="تشكيلة فاخرة وحصرية" />
                <div className="flex flex-col gap-4 md:gap-6 md:h-full">
                   <CategoryCard category={categories[1]} className="flex-1 h-[250px] md:h-auto" />
                   <CategoryCard category={categories[2]} className="flex-1 h-[250px] md:h-auto" />
                </div>
             </div>
          )}

          {count >= 4 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 h-auto md:h-[650px]">
              {/* Featured card — 2 cols × 2 rows */}
              <CategoryCard 
                category={categories[0]} 
                className="col-span-2 row-span-1 md:row-span-2 h-[400px] md:h-auto" 
                isFeatured 
                subtitle="قوة التحمل بلمسة من الفخامة" 
              />
              
              {/* Wide card — 2 cols × 1 row */}
              <CategoryCard 
                category={categories[1]} 
                className="col-span-2 row-span-1 h-[250px] md:h-auto" 
                subtitle="عصرية ومريحة" 
              />
              
              {/* Small cards — 1 col × 1 row */}
              <CategoryCard category={categories[2]} className="col-span-1 row-span-1 h-[200px] md:h-auto" />
              <CategoryCard category={categories[3]} className="col-span-1 row-span-1 h-[200px] md:h-auto" />
            </div>
          )}
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

