'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ProductGallery } from '@/components/product/ProductGallery'
import { truncate, getDiscountPercent } from '@/lib/utils'
import type { ProductFull, ProductColor, HomepageSettings } from '@/types'
import ProductActions from './ProductActions'
import AccordionItemClient from './AccordionItemClient'

interface Props {
  product: ProductFull
  settings: HomepageSettings | null
  relatedProductsNode: React.ReactNode
}

export default function ProductPageClient({ product, settings, relatedProductsNode }: Props) {
  const [activeColor, setActiveColor] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Increment view count
    fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(() => {})
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
    <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-24">
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
            />
          </div>

          {/* Details */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div>
              <h1 className="font-arabic text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight mb-2">
                {product.name}
              </h1>
              {product.category && (
                <Link href={`/category/${product.category.slug}`} className="text-sm font-arabic text-[#9E9890] hover:text-[#785600]">
                  {product.category.name_ar}
                </Link>
              )}
            </div>
            
            <ProductActions product={product} onColorChange={(c: ProductColor | null) => setActiveColor(c?.name_ar ?? null)} />

            <div className="border-t border-[#E8E3DB] mt-2">
              {accordionContent.map((item) => (
                <AccordionItemClient key={item.title} title={item.title} content={item.content} defaultOpen={item.defaultOpen} />
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {product.category && (
          <section className="mt-24">
            <h2 className="font-arabic text-3xl font-bold text-[#1A1A1A] mb-10">
              منتجات قد تعجبك
            </h2>
            {relatedProductsNode}
          </section>
        )}
      </div>
    </main>
  )
}
