'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingBag, X, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'
import { useCartStore } from '@/store/cartStore'
import type { ProductFull, CartItem } from '@/types'
import { trackAddToCart } from '@/lib/analytics'

const TAG_LABELS: Record<string, string> = {
  new:         'جديد',
  best_seller: 'الأكثر مبيعاً',
  on_sale:     'تخفيض',
}

interface ProductCardProps {
  product: ProductFull
  className?: string
  /** When set, forces the card into an "unavailable" state with this custom label (e.g. "غير متوفر بهذا المقاس") */
  filterUnavailableLabel?: string | null
}

export function ProductCard({ product, className, filterUnavailableLabel }: ProductCardProps) {
  const router = useRouter()
  const { currency } = useCurrencyStore()
  const { addItem, openCart } = useCartStore()

  const [isHovered, setIsHovered] = useState(false)
  const [showSizeBar, setShowSizeBar] = useState(false)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const isEntirelyOutOfStock = product.stock_status === 'out_of_stock' || 
    (product.variants && product.variants.length > 0 
      ? product.variants.every(v => (v.quantity ?? 0) <= 0) 
      : (product.colors.length > 0 || product.sizes.length > 0))

  // If the filter says this product is unavailable for the selected criteria, treat as out of stock
  const isActuallyOutOfStock = isEntirelyOutOfStock || !!filterUnavailableLabel

  const mainImage = product.images?.find(img => img.is_main) || product.images?.[0]
  const defaultImageUrl = mainImage?.url ?? '/placeholder-shoe.jpg'

  // When hovering a color, show the first image matching that color_variant
  const imageUrl = hoveredColor
    ? product.images?.find(img => img.color_variant?.trim() === hoveredColor.trim())?.url ?? defaultImageUrl
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
      if (isNavigating) return
      setIsNavigating(true)
      router.push(`/product/${product.slug}`)
    },
    [router, product.slug, isNavigating]
  )

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isActuallyOutOfStock) return

      const hasMultipleColors = (product.colors ?? []).length > 1
      const hasMultipleSizes = (product.sizes ?? []).length > 1

      if (hasMultipleColors) {
        router.push(`/product/${product.slug}`)
        return
      }

      // If there are variants, we must find which ones are actually in stock
      const getInStockSize = () => {
        if (!product.variants || product.variants.length === 0) {
          return product.sizes.find(s => (typeof s === 'number' ? true : s.is_available))?.size ?? null
        }
        // If only one color, check sizes for that color
        const colorName = product.colors?.[0]?.name_ar || ''
        return product.variants.find(v => (colorName === '' || v.color === colorName) && (v.quantity ?? 0) > 0)?.size ?? null
      }

      if (hasMultipleSizes) {
        setShowSizeBar(true)
        return
      }

      const selectedSize = getInStockSize()

      // Add immediately
      const colorName = product.colors?.[0]?.name_ar ?? ''
      const variantStock = product.variants?.find(v => v.color === colorName && v.size === selectedSize)?.quantity ?? 0
      const item: CartItem = {
        id:                 product.id,
        slug:               product.slug,
        name:               product.name,
        image:              imageUrl,
        color:              product.colors?.[0]?.name_ar ?? null,
        color_hex:          product.colors?.[0]?.hex_code ?? null,
        size:               selectedSize,
        quantity:           1,
        price_syp:          product.price_syp,
        price_usd:          product.price_usd,
        discount_price_syp: product.discount_price_syp ?? null,
        discount_price_usd: product.discount_price_usd ?? null,
        mold_type:          product.mold_type,
        max_stock:          variantStock,
      }
      addItem(item)
      trackAddToCart(product, 1)
      toast.success('تمت إضافة المنتج إلى السلة')
      openCart()
    },
    [product, imageUrl, addItem, openCart, router, isActuallyOutOfStock]
  )

  const handleAddWithSize = useCallback(
    (size: number) => {
      const colorName = product.colors?.[0]?.name_ar ?? ''
      const variantStock = product.variants?.find(v => v.color === colorName && v.size === size)?.quantity ?? 0
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
        mold_type:          product.mold_type,
        max_stock:          variantStock,
      }
      addItem(item)
      trackAddToCart(product, 1)
      setShowSizeBar(false)
      toast.success('تمت إضافة المنتج إلى السلة')
      openCart()
    },
    [product, imageUrl, addItem, openCart, router]
  )

  const priorityTag = product.tags?.find((t) => t === 'new' || t === 'best_seller' || t === 'on_sale')

  return (
    <motion.article
      dir="rtl"
      layout
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={cn(
        'group relative cursor-pointer flex flex-col h-full',
        'rounded-2xl transition-all duration-300',
        isActuallyOutOfStock 
          ? 'bg-[#F9F9F9] opacity-80 hover:opacity-100 grayscale-[0.2] shadow-none border border-transparent hover:border-[#E8E3DB]' 
          : 'bg-white shadow-sm hover:shadow-md border border-transparent hover:border-primary/10',
        isNavigating && 'opacity-70 pointer-events-none',
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
            alt={`${product.name} — من كزورا Kzora`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-transform duration-700 ease-out',
              isHovered && !isActuallyOutOfStock ? 'scale-[1.04]' : 'scale-100',
              isActuallyOutOfStock && 'opacity-90'
            )}
            priority={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-20 group-hover:opacity-30 transition-opacity">
            <ShoppingBag size={48} strokeWidth={1} className="text-[#785600]" />
            <span className="text-[10px] font-arabic font-bold uppercase tracking-widest text-[#785600]">K Z O R A</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isNavigating && (
          <div className="absolute inset-0 z-30 bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Tag badge */}
        {priorityTag && !isActuallyOutOfStock && (
          <div className="absolute top-3 right-3 z-0">
            <span
              className={cn(
                'text-[10px] font-arabic font-semibold px-2.5 py-1 rounded-full',
                priorityTag === 'new'
                  ? 'bg-[#1A1A1A] text-white'
                  : priorityTag === 'on_sale'
                  ? 'bg-[#BA1A1A] text-white'
                  : 'bg-white text-[#785600] shadow-sm'
              )}
            >
              {TAG_LABELS[priorityTag]}
            </span>
          </div>
        )}

        {/* Out of Stock or Filter Unavailable badge */}
        {isActuallyOutOfStock && (
          <div className="absolute top-3 right-3 z-0">
            <span className={cn(
              "text-[10px] font-arabic font-semibold px-2.5 py-1 rounded-full shadow-sm",
              filterUnavailableLabel
                ? "bg-[#F5E6D0] text-[#8B5E14] border border-[#E8D5B5]"
                : "bg-[#E8E4DE] text-[#6B6560]"
            )}>
              {filterUnavailableLabel || 'نفدت الكمية'}
            </span>
          </div>
        )}

        {/* Low Stock Badge (Secondary tag slot) */}
        {product.stock_status === 'low_stock' && (
          <div className={cn("absolute z-0", priorityTag ? "top-10 right-3" : "top-3 right-3")}>
             <span className="text-[10px] font-arabic font-bold px-2 py-1.5 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/20 shadow-sm">
               كمية محدودة
             </span>
          </div>
        )}

        {/* Discount % badge */}
        {hasDiscount && discountPct > 0 && !isActuallyOutOfStock && (
          <div className="absolute top-3 left-3 z-0">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#BA1A1A] text-white shadow-sm">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Quick add — appears on hover (only if in stock) */}
        {!showSizeBar && !isActuallyOutOfStock && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 px-3 pb-3 z-20',
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
              {(product.sizes || []).map((s) => {
                const size = s.size
                const colorName = product.colors?.[0]?.name_ar || ''
                const variant = product.variants?.find(v => (colorName === '' || v.color === colorName) && v.size === size)
                const hasStock = variant ? (variant.quantity ?? 0) > 0 : true
                const isAvailable = s.is_available && hasStock

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleAddWithSize(size)}
                    className={cn(
                      'min-w-[2.2rem] h-7 px-1.5 rounded-lg text-xs font-medium tabular-nums',
                      'transition-all duration-150 focus-visible:outline-none',
                      isAvailable 
                        ? 'bg-[#F5F1EB] text-[#1A1A1A] hover:bg-[#785600] hover:text-white'
                        : 'bg-[#F5F1EB]/50 text-[#9E9890] cursor-not-allowed line-through'
                    )}
                  >
                    {size}
                  </button>
                )
              })}
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
        <h3 className="text-sm font-arabic font-medium text-[#1A1A1A] leading-snug line-clamp-2 flex items-start gap-1">
          {product.is_featured && (
            <Star size={14} className="fill-[#C59B27] text-[#C59B27] shrink-0 mt-0.5" />
          )}
          <span>{product.name}</span>
        </h3>

        {/* Mold Type Badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            "text-[9px] font-arabic font-bold px-1.5 py-0.5 rounded-md border",
            product.mold_type === 'chinese' 
              ? "bg-[#E65C00]/5 text-[#E65C00] border-[#E65C00]/20" 
              : "bg-[#F5F1EB] text-[#6B6560] border-[#E8E3DB]"
          )}>
            {product.mold_type === 'chinese' ? 'قالب صيني' : 'قالب نظامي'}
          </span>
          {/* We can add more subtle badges here if needed */}
        </div>

        {/* Price */}
        <div className="mt-auto flex items-center gap-2 pt-1" dir="rtl">
          <span className={cn(
            "font-arabic font-semibold text-sm tabular-nums",
            isActuallyOutOfStock ? 'text-[#9E9890]' : 'text-[#1A1A1A]'
          )}>
            {formatPrice(displayPrice, currency)}
          </span>
          {hasDiscount && (
            <span className="font-arabic text-xs text-[#9E9890] line-through tabular-nums">
              {formatPrice(originalDisplayPrice, currency)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
