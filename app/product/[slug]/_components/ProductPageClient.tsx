'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ProductGallery } from '@/components/product/ProductGallery'
import { Star } from 'lucide-react'
import { truncate, getDiscountPercent } from '@/lib/utils'
import type { ProductFull, ProductColor, HomepageSettings } from '@/types'
import ProductActions from './ProductActions'
import AccordionItemClient from './AccordionItemClient'
import ProductReviews from './ProductReviews'

interface Props {
  product: ProductFull
  settings: HomepageSettings | null
  relatedProductsNode: React.ReactNode
}

export default function ProductPageClient({ product, settings, relatedProductsNode }: Props) {
  const [activeColor, setActiveColor] = React.useState<string | null>(null)
  const [reviewsMetadata, setReviewsMetadata] = useState<{ totalReviews: number; averageRating: number } | null>(null)

  React.useEffect(() => {
    // Increment view count
    fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(() => {})
    
    // Fetch review metadata
    fetch(`/api/products/${product.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.metadata) setReviewsMetadata(data.metadata)
      })
      .catch(() => {})
  }, [product.id])

  const hasDiscount = product.discount_price_syp != null && product.discount_price_syp < product.price_syp
  const discountPct = hasDiscount ? getDiscountPercent(product.price_syp, product.discount_price_syp!) : 0

  const accordionContent = [
    { title: 'الوصف', content: product.description || 'لا يوجد وصف متاح.', defaultOpen: true },
    { 
      title: 'معلومات الشحن', 
      content: settings?.shipping_policy || 'نوفر خدمة التوصيل إلى جميع المحافظات السورية.' 
    },
    { 
      title: 'سياسة الإرجاع', 
      content: settings?.return_policy || 'إرجاع خلال 7 أيام من الاستلام.' 
    },
  ]

  return (
    <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-32">
      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-4 pb-20">
        {/* Breadcrumb */}
        <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-sm font-arabic text-[#9E9890] mb-10">
          <Link href="/" className="hover:text-[#785600] transition-colors">الرئيسية</Link>
          <span>›</span>
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug}`} className="hover:text-[#785600] transition-colors">
                {product.category.name_ar}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-[#1A1A1A] font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-10 md:gap-16 items-start">
          {/* Gallery */}
          <div className="md:col-span-6">
            <ProductGallery
              images={product.images}
              productName={product.name}
              tags={product.tags}
              hasDiscount={hasDiscount}
              discountPct={discountPct}
              activeColor={activeColor}
              onIndexChange={useCallback((idx: number) => {
                const sortedImages = [...product.images].sort((a,b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                const img = sortedImages[idx]
                if (img?.color_variant) {
                  if (img.color_variant !== activeColor) setActiveColor(img.color_variant)
                } else if (activeColor !== null) {
                  setActiveColor(null)
                }
              }, [activeColor, product.images])}
            />
          </div>

          {/* Details */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-arabic text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight flex-1 flex items-center gap-3">
                  {product.name}
                  {product.is_featured && (
                    <span className="shrink-0 bg-[#FFFBEA] border border-[#FBE39A] text-[#C59B27] px-3 py-1.5 rounded-full font-arabic font-bold text-sm shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                      <Star size={14} className="fill-[#C59B27] mt-0.5" />
                      منتج مميز
                    </span>
                  )}
                </h1>
                
                {product.stock_status === 'out_of_stock' && (
                  <span className="shrink-0 bg-[#1A1A1A] text-white px-3 py-1.5 rounded-full font-arabic font-bold text-sm shadow-sm whitespace-nowrap">
                    نفدت الكمية
                  </span>
                )}
                
                {product.stock_status === 'low_stock' && (
                  <span className="shrink-0 bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/20 px-3 py-1.5 rounded-full font-arabic font-bold text-sm shadow-sm whitespace-nowrap">
                    كمية محدودة
                  </span>
                )}
              </div>

              {/* Rating Summary */}
              {reviewsMetadata && (
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star 
                        key={num} 
                        size={16} 
                        className={`${reviewsMetadata.averageRating >= num ? 'fill-[#FFD700] text-[#FFD700]' : 'text-[#D1C9BE]'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#6B655D]">
                    {reviewsMetadata.totalReviews > 0 
                      ? `${reviewsMetadata.averageRating} (${reviewsMetadata.totalReviews} تقييم)`
                      : 'لم يقدم أحد المنتج بعد'
                    }
                  </span>
                </div>
              )}

              {product.category && (
                <Link href={`/category/${product.category.slug}`} className="text-sm font-arabic text-[#9E9890] hover:text-[#785600] inline-block mt-2">
                  {product.category.name_ar}
                </Link>
              )}
            </div>
            
            <ProductActions 
              product={product} 
              settings={settings} 
              activeColorName={activeColor}
              onColorChange={useCallback((c: ProductColor | null) => {
                if (c?.name_ar) {
                  if (c.name_ar !== activeColor) setActiveColor(c.name_ar)
                } else if (activeColor !== null) {
                  setActiveColor(null)
                }
              }, [activeColor])} 
            />

            <div className="border-t border-[#E8E3DB] mt-2">
              {accordionContent.map((item) => (
                <AccordionItemClient key={item.title} title={item.title} content={item.content} defaultOpen={item.defaultOpen} />
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {product.category && (
          relatedProductsNode
        )}

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>
    </main>

  )
}
