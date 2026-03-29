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

  const [cat0, cat1, cat2, cat3] = categories

  return (
    <section dir="rtl" className="py-12 md:py-24 px-4 md:px-8 bg-[#FAF8F5]">
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10 md:mb-16">
          <div>
            <h2 className="text-xl md:text-4xl font-arabic font-bold text-[#1A1A1A] mb-3">
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

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 h-auto md:h-[680px]">

          {/* Featured card — 2 cols × 2 rows */}
          {cat0 && (
            <Link
              href={`/category/${cat0.slug}`}
              className="col-span-2 row-span-1 md:row-span-2 group relative overflow-hidden rounded-2xl bg-[#EDE8E1] block aspect-[3/4] md:aspect-auto"
            >
              {cat0.image_url && (
                <Image
                  src={cat0.image_url}
                  alt={cat0.name_ar}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-8 right-8 text-right">
                <h3 className="text-2xl md:text-3xl font-arabic font-bold text-white mb-2">
                  {cat0.name_ar}
                </h3>
                <p className="text-white/70 text-sm font-arabic mb-4">قوة التحمل بلمسة من الفخامة</p>
                <span className="inline-block text-[#FFDEA6] border-b border-[#FFDEA6] pb-0.5 text-sm font-arabic">
                  اكتشف القسم
                </span>
              </div>
            </Link>
          )}

          {/* Wide card — 2 cols × 1 row */}
          {cat1 && (
            <Link
              href={`/category/${cat1.slug}`}
              className={cn(
                'col-span-2 row-span-1 group relative overflow-hidden rounded-2xl bg-[#EDE8E1] block',
                'aspect-video md:aspect-auto'
              )}
            >
              {cat1.image_url && (
                <Image
                  src={cat1.image_url}
                  alt={cat1.name_ar}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 right-6 text-right">
                <h3 className="text-xl md:text-2xl font-arabic font-bold text-white">{cat1.name_ar}</h3>
                <span className="text-[#FFDEA6] text-sm font-arabic mt-1 block">عصرية ومريحة</span>
              </div>
            </Link>
          )}

          {/* Small card — 1 col × 1 row */}
          {cat2 && (
            <Link
              href={`/category/${cat2.slug}`}
              className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl bg-[#EDE8E1] block aspect-square md:aspect-auto"
            >
              {cat2.image_url && (
                <Image
                  src={cat2.image_url}
                  alt={cat2.name_ar}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 right-5 text-right">
                <h3 className="text-lg font-arabic font-bold text-white">{cat2.name_ar}</h3>
              </div>
            </Link>
          )}

          {/* Small card — 1 col × 1 row */}
          {cat3 && (
            <Link
              href={`/category/${cat3.slug}`}
              className="col-span-1 row-span-1 group relative overflow-hidden rounded-2xl bg-[#EDE8E1] block aspect-square md:aspect-auto"
            >
              {cat3.image_url && (
                <Image
                  src={cat3.image_url}
                  alt={cat3.name_ar}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 right-5 text-right">
                <h3 className="text-lg font-arabic font-bold text-white">{cat3.name_ar}</h3>
              </div>
            </Link>
          )}

        </div>
      </div>
    </section>
  )
}
