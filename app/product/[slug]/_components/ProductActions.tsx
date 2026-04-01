'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'
import { useCartStore } from '@/store/cartStore'
import type { ProductFull, ProductColor, CartItem, HomepageSettings } from '@/types'
import toast from 'react-hot-toast'

import { useRouter } from 'next/navigation'

interface Props {
  product: ProductFull
  settings: HomepageSettings | null
  activeColorName?: string | null
  onColorChange?: (color: ProductColor | null) => void
}

export default function ProductActions({ product, settings, activeColorName, onColorChange }: Props) {
  const router = useRouter()
  const { currency, setCurrency } = useCurrencyStore()
  const { addItem, openCart } = useCartStore()

  const outOfStockGlobal = product.stock_status === 'out_of_stock'

  const isColorInStock = useCallback((colorName: string) => {
    if (!product.variants || product.variants.length === 0) return true
    return product.variants.some(v => v.color === colorName && v.quantity > 0)
  }, [product.variants])

  const isSizeInStockForColor = useCallback((sizeVal: number, colorName: string | null) => {
    if (!product.variants || product.variants.length === 0) return true
    const c = colorName || ''
    return product.variants.some(v => v.color === c && v.size === sizeVal && v.quantity > 0)
  }, [product.variants])

  const [selectedColorId, setSelectedColorId] = useState<string | null>(() => {
    const available = product.colors.filter(c => c.is_available && isColorInStock(c.name_ar))
    return available.length === 1 ? available[0].id : null
  })
  
  const [selectedSize, setSelectedSize] = useState<number | null>(() => {
    // If only 1 size available at all, auto select it?
    // Safer to just leave it null unless there's only 1 size in the whole product.
    // We defer strict checks to the UI.
    const available = product.sizes.filter(s => {
       const sz = typeof s === 'number' ? s : s.size
       return (typeof s === 'number' ? true : s.is_available)
    })
    return available.length === 1 ? (typeof available[0] === 'number' ? available[0] : available[0].size) : null
  })
  const [quantity, setQuantity] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [colorError, setColorError] = useState(false)

  const selectedColor = useMemo(
    () => product.colors.find((c) => c.id === selectedColorId) ?? null,
    [product.colors, selectedColorId]
  )

  // Sync color from parent (e.g. from gallery swiping)
  useEffect(() => {
    if (!activeColorName) {
      if (selectedColorId !== null && product.colors.length > 1) {
        setSelectedColorId(null)
      }
      return
    }

    const trimmedParent = activeColorName.trim().toLowerCase()
    const currentName = selectedColor?.name_ar?.trim().toLowerCase()

    if (trimmedParent !== currentName) {
      const match = product.colors.find(c => c.name_ar?.trim().toLowerCase() === trimmedParent)
      if (match) {
        setSelectedColorId(match.id)
        setColorError(false)
      }
    }
  }, [activeColorName, product.colors, selectedColor, selectedColorId])

  // NO feedback loop useEffect for onColorChange. 
  // We call onColorChange directly in handleColorSelect.

  const handleColorSelect = (color: ProductColor) => {
    setSelectedColorId(color.id)
    setColorError(false)
    onColorChange?.(color)
  }

  const currentAvailableStock = useMemo(() => {
    // If we have variants, find the specific stock
    if (product.variants && product.variants.length > 0) {
      const c = selectedColor?.name_ar || ''
      const s = selectedSize || 0
      const v = product.variants.find(v => v.color === c && v.size === s)
      return v ? (v.quantity ?? 0) : 0
    }
    // If no variants, we might use a global quantity if it existed, 
    // but in this schema we usually use stock_status or variants.
    return 999 
  }, [product.variants, selectedColor, selectedSize])

  const isComboOutOfStock = useMemo(() => {
    // If no selection yet, it's NOT 'out of stock' for the UI, just 'unselected'
    if (product.variants && product.variants.length > 0) {
      if (selectedColorId !== null || product.colors.length === 0) {
        if (selectedSize !== null || product.sizes.length === 0) {
          return currentAvailableStock <= 0
        }
      }
    }
    return false
  }, [product.variants, product.colors.length, product.sizes.length, selectedColorId, selectedSize, currentAvailableStock])

  // A product is entirely out of stock if:
  // 1. Explicitly marked as such
  // 2. OR it has variants and ALL of them are 0
  const isEntirelyOutOfStock = useMemo(() => {
    if (outOfStockGlobal) return true
    if (product.variants && product.variants.length > 0) {
      return product.variants.every(v => (v.quantity ?? 0) <= 0)
    }
    return false
  }, [outOfStockGlobal, product.variants])

  const outOfStock = isEntirelyOutOfStock || isComboOutOfStock

  const hasDiscount = product.discount_price_syp != null && product.discount_price_syp < product.price_syp
  const discountPct = hasDiscount ? getDiscountPercent(product.price_syp, product.discount_price_syp!) : 0

  const currentPriceSyp = product.discount_price_syp ?? product.price_syp
  const currentPriceUsd = product.discount_price_usd ?? product.price_usd
  const displayPrice = currency === 'SYP' ? currentPriceSyp : currentPriceUsd
  const originalPrice = currency === 'SYP' ? product.price_syp : product.price_usd

  // Multi-product discount calculation (Live)
  const multiDiscSyp = useMemo(() => {
    if (!settings?.discount_multi_items_enabled) return 0
    if (quantity >= 3) return settings.discount_3_items_plus_syp
    if (quantity >= 2) return settings.discount_2_items_syp
    return 0
  }, [quantity, settings])

  const multiDiscUsd = useMemo(() => {
    if (multiDiscSyp === 0) return 0
    const ratio = product.price_syp > 0 ? product.price_usd / product.price_syp : 0
    return parseFloat((multiDiscSyp * ratio).toFixed(2))
  }, [multiDiscSyp, product.price_syp, product.price_usd])

  const currentMultiDisc = currency === 'SYP' ? multiDiscSyp : multiDiscUsd
  
  // Calculate delivery/shipping fee for total price display (1 piece vs multiple)
  let currentFee = 0
  if (settings) {
    if (quantity >= 3) {
      currentFee = currency === 'SYP' ? (settings.delivery_fee_3_plus_pieces_syp || 0) : (settings.delivery_fee_3_plus_pieces_usd || 0)
    } else if (quantity === 2) {
      currentFee = currency === 'SYP' ? (settings.delivery_fee_2_pieces_syp || 0) : (settings.delivery_fee_2_pieces_usd || 0)
    } else {
      currentFee = currency === 'SYP' ? (settings.delivery_fee_1_piece_syp || 0) : (settings.delivery_fee_1_piece_usd || 0)
    }
  }

  const totalPrice = (displayPrice * quantity) - currentMultiDisc + currentFee

  const handleAddToCart = useCallback(() => {
    if (outOfStock) return
    if (product.colors.length > 0 && selectedColorId === null) {
      setColorError(true)
      toast.error('يرجى اختيار اللون أولاً')
      return
    }
    if (product.sizes.length > 0 && selectedSize === null) {
      setSizeError(true)
      toast.error('يرجى اختيار المقاس أولاً')
      return
    }
    const item: CartItem = {
      id:                 product.id,
      slug:               product.slug,
      name:               product.name,
      image:              product.images[0]?.url ?? '',
      color:              selectedColor?.name_ar ?? null,
      color_hex:          selectedColor?.hex_code ?? null,
      size:               selectedSize,
      quantity,
      price_syp:          product.price_syp,
      price_usd:          product.price_usd,
      discount_price_syp: product.discount_price_syp ?? null,
      discount_price_usd: product.discount_price_usd ?? null,
      mold_type:          product.mold_type,
      multi_discount_syp: multiDiscSyp,
    }
    addItem(item)
    
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768

    if (isDesktop) {
      router.push('/checkout')
    } else {
      openCart()
      toast.success(`تمت إضافة ${quantity > 1 ? quantity + ' قطع' : 'المنتج'} إلى السلة`)
      setQuantity(1)
    }
  }, [product, selectedColor, selectedSize, quantity, outOfStock, addItem, openCart, router])

  return (
    <div dir="rtl" className="space-y-6">

      {/* ── Price block ── */}
      <div className="flex items-center justify-between bg-[#F5F3F0] px-5 py-4 rounded-2xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-[#785600] tabular-nums">
              {formatPrice(displayPrice, currency)}
            </span>
            {hasDiscount && discountPct > 0 && (
              <span className="bg-[#FFDAD6] text-[#BA1A1A] px-2 py-0.5 text-xs font-bold rounded-md">
                خصم {discountPct}%
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="text-[#9E9890] line-through text-base tabular-nums">
              {formatPrice(originalPrice, currency)}
            </span>
          )}
          {multiDiscSyp > 0 && quantity > 1 && (
             <span className="text-[#B8860B] font-arabic text-sm font-bold flex items-center gap-1.5 animate-pulse">
               <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
               عرض خاص: خصم إضافي {formatPrice(currentMultiDisc, currency)}
             </span>
          )}

          {/* 🚚 Delivery/Shipping Fee Notice */}
          {settings && (
            <div className="flex flex-col gap-0.5 mt-1 border-t border-black/5 pt-2">
              <div className="flex items-center gap-2 text-[11px] font-arabic text-[#6B6560]">
                <span className="opacity-80">🚀 توصيل عادي:</span>
                <span className="font-bold text-[#1A1A1A] tabular-nums">
                  +{formatPrice(currency === 'SYP' ? (settings.delivery_fee_1_piece_syp || 0) : (settings.delivery_fee_1_piece_usd || 0), currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-arabic text-[#6B6560]">
                <span className="opacity-80">📦 شحن محافظات:</span>
                <span className="font-bold text-[#1A1A1A] tabular-nums">
                  +{formatPrice(currency === 'SYP' ? (settings.shipping_fee_1_piece_syp || 0) : (settings.shipping_fee_1_piece_usd || 0), currency)}
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Currency toggle */}
        <div className="flex items-center gap-1 bg-[#E8E4DE] p-1 rounded-full">
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              currency === 'USD' ? 'bg-[#785600] text-white shadow-sm' : 'text-[#6B6560] hover:text-[#1A1A1A]'
            )}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => setCurrency('SYP')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 font-arabic',
              currency === 'SYP' ? 'bg-[#785600] text-white shadow-sm' : 'text-[#6B6560] hover:text-[#1A1A1A]'
            )}
          >
            ل.س
          </button>
        </div>
      </div>

      {/* ── Color selector ── */}
      {product.colors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-arabic">
            <span className={cn(
              'font-medium transition-colors',
              colorError ? 'text-[#BA1A1A]' : 'text-[#6B6560]'
            )}>اللون:</span>
            {selectedColor && (
              <span className="text-[#1A1A1A] font-bold">{selectedColor.name_ar}</span>
            )}
            {!selectedColor && (
              <span className={cn(
                "text-xs font-medium italic opacity-70",
                colorError ? "text-[#BA1A1A] font-bold animate-pulse" : "text-[#9E9890]"
              )}>
                {colorError ? "يرجى اختيار لون" : "يرجى اختيار لون"}
              </span>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {product.colors.map((color: ProductColor) => {
              const available = color.is_available && isColorInStock(color.name_ar)
              return (
                <div key={color.id} className="relative">
                  <button
                    type="button"
                    title={color.name_ar}
                    disabled={!available}
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      'w-10 h-10 rounded-full transition-all duration-200 shadow-sm',
                      'focus-visible:outline-none',
                      selectedColorId === color.id
                        ? 'ring-2 ring-[#785600] ring-offset-3'
                        : 'ring-1 ring-black/40 ring-offset-2 hover:ring-[#785600]',
                      !available && 'opacity-25 cursor-not-allowed grayscale scale-90'
                    )}
                    style={{ backgroundColor: color.hex_code }}
                  />
                  {!available && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-[1px] h-full bg-black/60 rotate-45" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Size selector ── */}
      {product.sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm font-arabic">
                <span className={cn(
                  'font-medium transition-colors',
                  sizeError ? 'text-[#BA1A1A]' : 'text-[#6B6560]'
                )}>
                  المقاس:
                </span>
                {selectedSize !== null && (
                  <span className="text-[#1A1A1A] font-bold tabular-nums">
                    {selectedSize}
                  </span>
                )}
                {sizeError && (
                  <span className="text-[#BA1A1A] text-xs font-bold animate-pulse">
                     يرجى اختيار المقاس
                  </span>
                )}
              </div>
              
              <div className={cn(
                "inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-arabic font-bold",
                product.mold_type === 'chinese' 
                  ? "bg-[#FFF0E6] text-[#E65C00] border border-[#FFD1B3]"
                  : "bg-[#E6F4EA] text-[#137333] border border-[#BCE3C6]"
              )}>
                {product.mold_type === 'chinese' ? '⚠️ القالب صيني (ننصح بمقاس أكبر)' : '📏 القالب طبيعي (نظامي)'}
              </div>
            </div>
            
            <a
              href="#size-guide"
              className="text-xs font-arabic text-[#785600] hover:underline underline-offset-4 flex items-center gap-1 mt-0.5"
            >
              دليل المقاسات
            </a>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((s) => {
              const item = typeof s === 'number' ? { size: s, is_available: true } : s
              const size = item.size
              
              const isAvailable = item.is_available && !outOfStockGlobal && isSizeInStockForColor(size, selectedColor?.name_ar ?? null)

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setSelectedSize(size); setSizeError(false) }}
                  disabled={!isAvailable}
                  className={cn(
                    'py-3 text-center text-sm font-medium tabular-nums transition-all duration-150',
                    'border-b-2 focus-visible:outline-none',
                    selectedSize === size
                      ? 'border-[#785600] bg-[#F5F1EB] text-[#785600] font-bold'
                      : 'border-transparent bg-[#F5F3F0] text-[#6B6560] hover:bg-[#EDE8E0] hover:text-[#1A1A1A]',
                    !isAvailable && 'opacity-40 cursor-not-allowed line-through grayscale border-transparent bg-[#F5F3F0]/50'
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quantity selector ── */}
      <div className="space-y-3">
        <p className="text-sm font-arabic font-bold text-[#1A1A1A]">الكمية</p>
        <div className="flex items-center gap-1">
          <div className="flex items-center border border-[#E8E3DB] rounded-xl overflow-hidden bg-[#F5F3F0]">
            <button
              type="button"
              aria-label="تقليل الكمية"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className={cn(
                'w-11 h-11 flex items-center justify-center transition-colors duration-100',
                'focus-visible:outline-none',
                quantity <= 1
                  ? 'text-[#D3C4AF] cursor-not-allowed'
                  : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#EDE8E0]'
              )}
            >
              <Minus size={16} />
            </button>
            <span className="w-14 text-center text-base font-bold tabular-nums text-[#1A1A1A] select-none border-x border-[#E8E3DB]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="زيادة الكمية"
              onClick={() => setQuantity(q => {
                const maxAllowed = product.variants?.length ? Math.min(10, currentAvailableStock) : 10;
                if (q >= maxAllowed) {
                  toast.error(`عذراً، أقصى كمية متاحة هي ${maxAllowed}`);
                  return q;
                }
                return q + 1;
              })}
              disabled={quantity >= 10 || (product.variants?.length ? quantity >= currentAvailableStock : false)}
              className={cn(
                'w-11 h-11 flex items-center justify-center transition-colors duration-100',
                'focus-visible:outline-none',
                (quantity >= 10 || (product.variants?.length ? quantity >= currentAvailableStock : false))
                  ? 'text-[#D3C4AF] cursor-not-allowed'
                  : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#EDE8E0]'
              )}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Total for multiple items */}
          {quantity > 1 && (
            <span className="mr-3 font-arabic text-sm text-[#6B6560] flex flex-col items-start gap-0.5">
              <span className="opacity-70">المجموع النهائي:</span>
              <span className="font-bold text-[#785600] text-lg tabular-nums">
                {formatPrice(totalPrice, currency)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Add to cart ── */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={cn(
            'w-full py-5 rounded-2xl font-arabic font-black text-xl transition-all duration-300',
            'flex items-center justify-center gap-3',
            'focus-visible:outline-none active:scale-[0.98] relative overflow-hidden group',
            outOfStock
              ? 'bg-[#F5F3F0] text-[#9E9890] cursor-not-allowed border-2 border-[#E8E3DB]'
              : 'bg-gradient-to-l from-[#785600] to-[#986D00] hover:from-[#986D00] hover:to-[#B8860B] text-white shadow-xl shadow-[#785600]/20'
          )}
        >
          {outOfStock ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9E9890] shrink-0" />
              نفذت الكمية حالياً
            </span>
          ) : (
            <>
              <ShoppingBag size={22} className="group-hover:scale-110 transition-transform duration-300" />
              <span>إضافة إلى السلة</span>
            </>
          )}
          
          {!outOfStock && (
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          )}
        </button>
        
        {outOfStock && (
          <p className="text-center text-[11px] font-arabic text-[#9E9890] mt-3 font-medium">
            سيتم توفير كميات جديدة قريباً، شكراً لتفهمك.
          </p>
        )}
      </div>
    </div>
  )
}
