'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingBag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'
import { useCartStore } from '@/store/cartStore'
import type { ProductFull, CartItem } from '@/types'

const TAG_LABELS: Record<string, string> = {
  new:         'جديد',
  best_seller: 'الأكثر مبيعاً',
  on_sale:     'تخفيض',
}

interface ProductCardProps {
  product: ProductFull
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const router = useRouter()
  const { currency } = useCurrencyStore()
  const { addItem } = useCartStore()

  const [isHovered, setIsHovered] = useState(false)
  const [showSizeBar, setShowSizeBar] = useState(false)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)

  const mainImage = product.images?.find(img => img.is_main) || product.images?.[0]
  const defaultImageUrl = mainImage?.url ?? '/placeholder-shoe.jpg'

  // When hovering a color, show the first image matching that color_variant
  const imageUrl = hoveredColor
    ? product.images?.find(img => img.color_variant === hoveredColor)?.url ?? defaultImageUrl
    : defaultImageUrl

  const currentPriceSyp = product.discount_price_syp ?? product.price_syp
  const currentPriceUsd = product.discount_price_usd ?? product.price_usd
  const hasDiscount =
    product.discount_price_syp != null &&
    product.discount_price_syp < product.price_syp

  const discountPct = hasDiscount
    ? getDiscountPercent(product.price_syp, product.discount_price_syp!)
    : 0

  const displayPrice = currency === 'SYP' ? currentPriceSyp : currentPriceUsd
  const originalDisplayPrice =
    currency === 'SYP' ? product.price_syp : product.price_usd

  const handleNavigate = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-no-navigate]')) return
      router.push(`/product/${product.slug}`)
    },
    [router, product.slug]
  )

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (product.sizes.length <= 1) {
        const item: CartItem = {
          id:                 product.id,
          slug:               product.slug,
          name:               product.name,
          image:              imageUrl,
          color:              product.colors?.[0]?.name_ar ?? null,
          color_hex:          product.colors?.[0]?.hex_code ?? null,
          size:               product.sizes[0] ?? null,
          quantity:           1,
          price_syp:          product.price_syp,
          price_usd:          product.price_usd,
          discount_price_syp: product.discount_price_syp ?? null,
          discount_price_usd: product.discount_price_usd ?? null,
        }
        addItem(item)
      } else {
        setShowSizeBar(true)
      }
    },
    [product, imageUrl, addItem]
  )

  const handleAddWithSize = useCallback(
    (size: number) => {
      const item: CartItem = {
        id:                 product.id,
        slug:               product.slug,
        name:               product.name,
        image:              imageUrl,
        color:              product.colors?.[0]?.name_ar ?? null,
        color_hex:          product.colors?.[0]?.hex_code ?? null,
        size,
        quantity:           1,
        price_syp:          product.price_syp,
        price_usd:          product.price_usd,
        discount_price_syp: product.discount_price_syp ?? null,
        discount_price_usd: product.discount_price_usd ?? null,
      }
      addItem(item)
      setShowSizeBar(false)
    },
    [product, imageUrl, addItem]
  )

  const priorityTag = product.tags?.find((t) => t === 'new' || t === 'best_seller' || t === 'on_sale')

  return (
    <article
      dir="rtl"
      className={cn(
        'group relative cursor-pointer flex flex-col h-full',
        'bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowSizeBar(false)
      }}
      onClick={handleNavigate}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#F7F4F0] flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-transform duration-700 ease-out',
              isHovered ? 'scale-[1.04]' : 'scale-100'
            )}
            priority={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-20 group-hover:opacity-30 transition-opacity">
             <ShoppingBag size={48} strokeWidth={1} className="text-[#785600]" />
             <span className="text-[10px] font-arabic font-bold uppercase tracking-widest text-[#785600]">K Z O R A</span>
          </div>
        )}

        {/* Tag badge */}
        {priorityTag && (
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                'text-[10px] font-arabic font-semibold px-2.5 py-1 rounded-full',
                priorityTag === 'new'
                  ? 'bg-[#1A1A1A] text-white'
                  : priorityTag === 'on_sale'
                  ? 'bg-[#BA1A1A] text-white'
                  : 'bg-white text-[#785600]'
              )}
            >
              {TAG_LABELS[priorityTag]}
            </span>
          </div>
        )}

        {/* Discount % badge */}
        {hasDiscount && discountPct > 0 && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#BA1A1A] text-white">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Quick add — appears on hover */}
        {!showSizeBar && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 px-3 pb-3',
              'transition-all duration-300',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <button
              data-no-navigate
              type="button"
              onClick={handleQuickAdd}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-10 rounded-xl',
                'bg-white/95 backdrop-blur-sm text-[#1A1A1A]',
                'text-sm font-arabic font-semibold',
                'hover:bg-[#785600] hover:text-white',
                'shadow-lg transition-all duration-200',
                'focus-visible:outline-none'
              )}
            >
              <ShoppingBag size={15} />
              أضف للسلة
            </button>
          </div>
        )}

        {/* Size bar */}
        {showSizeBar && (
          <div
            data-no-navigate
            className="absolute bottom-0 left-0 right-0 bg-white/97 backdrop-blur-md rounded-b-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-arabic font-medium text-[#6B6560]">اختر المقاس</span>
              <button
                type="button"
                onClick={() => setShowSizeBar(false)}
                className="text-[#9E9890] hover:text-[#1A1A1A] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleAddWithSize(size)}
                  className={cn(
                    'min-w-[2.2rem] h-7 px-1.5 rounded-lg text-xs font-medium tabular-nums',
                    'bg-[#F5F1EB] text-[#1A1A1A]',
                    'hover:bg-[#785600] hover:text-white',
                    'transition-all duration-150 focus-visible:outline-none'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="pt-3 pb-3 px-3 space-y-1.5 flex-1 flex flex-col">
        {/* Color swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5" data-no-navigate>
            {product.colors.slice(0, 5).map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.name_ar}
                onMouseEnter={() => setHoveredColor(color.name_ar)}
                onMouseLeave={() => setHoveredColor(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/product/${product.slug}`)
                }}
                className={cn(
                  'w-4 h-4 rounded-full shrink-0 transition-all duration-150',
                  hoveredColor === color.name_ar
                    ? 'ring-2 ring-[#785600] ring-offset-1 scale-110'
                    : 'ring-1 ring-black/25 hover:ring-[#785600]/50'
                )}
                style={{ backgroundColor: color.hex_code }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] font-arabic text-[#9E9890]">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Name */}
        <h3 className="text-sm font-arabic font-medium text-[#1A1A1A] leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-auto flex items-center gap-2 pt-1" dir="ltr">
          <span className="font-arabic font-semibold text-sm text-[#1A1A1A] tabular-nums">
            {formatPrice(displayPrice, currency)}
          </span>
          {hasDiscount && (
            <span className="font-arabic text-xs text-[#9E9890] line-through tabular-nums">
              {formatPrice(originalDisplayPrice, currency)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
