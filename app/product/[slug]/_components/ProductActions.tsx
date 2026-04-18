'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, formatCurrency, getDiscountPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'
import { useCartStore } from '@/store/cartStore'
import type { ProductFull, ProductColor, CartItem, HomepageSettings } from '@/types'
import toast from 'react-hot-toast'
import { trackAddToCart } from '@/lib/analytics'

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
  const { addItem, openCart, items: cartItems } = useCartStore()

  const outOfStockGlobal = product.stock_status === 'out_of_stock'

  const isColorInStock = useCallback((colorName: string) => {
    if (!product.variants || product.variants.length === 0) return false
    return product.variants.some(v => v.color === colorName && v.quantity > 0)
  }, [product.variants])

  const isSizeInStockForColor = useCallback((sizeVal: number, colorName: string | null) => {
    if (!product.variants || product.variants.length === 0) return false
    const c = colorName || ''
    return product.variants.some(v => v.color === c && v.size === sizeVal && v.quantity > 0)
  }, [product.variants])

  const [selectedColorId, setSelectedColorId] = useState<string | null>(() => {
    const available = product.colors.filter(c => c.is_available && isColorInStock(c.name_ar))
    return available.length === 1 ? available[0].id : null
  })
  
  const [selectedSize, setSelectedSize] = useState<number | null>(() => {
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

  const handleColorSelect = (color: ProductColor) => {
    setSelectedColorId(color.id)
    setColorError(false)
    onColorChange?.(color)
  }

  const currentAvailableStock = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const c = selectedColor?.name_ar || ''
      const s = selectedSize || 0
      const v = product.variants.find(v => v.color === c && v.size === s)
      return v ? (v.quantity ?? 0) : 0
    }
    return 0 
  }, [product.variants, selectedColor, selectedSize])

  const alreadyInCart = useMemo(() => {
    const c = selectedColor?.name_ar ?? null
    const s = selectedSize ?? null
    const found = cartItems.find(
      i => i.id === product.id && i.color === c && (i.size ?? null) === s
    )
    return found ? found.quantity : 0
  }, [cartItems, product.id, selectedColor, selectedSize])

  const effectiveMax = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      if (selectedColorId === null || selectedSize === null) {
        const maxAcrossAll = Math.max(...product.variants.map(v => v.quantity ?? 0));
        return Math.min(10, maxAcrossAll);
      }
      const raw = Math.min(10, currentAvailableStock)
      return Math.max(0, raw - alreadyInCart)
    }
    return 10;
  }, [currentAvailableStock, alreadyInCart, product.variants, selectedColorId, selectedSize])

  const isComboOutOfStock = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      if (selectedColorId !== null || product.colors.length === 0) {
        if (selectedSize !== null || product.sizes.length === 0) {
          return currentAvailableStock <= 0
        }
      }
    }
    return false
  }, [product.variants, product.colors.length, product.sizes.length, selectedColorId, selectedSize, currentAvailableStock])

  const isEntirelyOutOfStock = useMemo(() => {
    if (outOfStockGlobal) return true
    if (product.variants && product.variants.length > 0) {
      return product.variants.every(v => (v.quantity ?? 0) <= 0)
    }
    if (product.colors.length > 0 || product.sizes.length > 0) return true
    return false
  }, [outOfStockGlobal, product.variants, product.colors.length, product.sizes.length])

  const outOfStock = isEntirelyOutOfStock || isComboOutOfStock

  useEffect(() => {
    if (selectedColorId && selectedSize && effectiveMax > 0 && quantity > effectiveMax) {
      setQuantity(effectiveMax)
    }
  }, [effectiveMax, selectedColorId, selectedSize, quantity])

  const hasDiscount = product.discount_price_syp != null && product.discount_price_syp < product.price_syp
  const discountPct = hasDiscount ? getDiscountPercent(product.price_syp, product.discount_price_syp!) : 0

  const currentPriceSyp = product.discount_price_syp ?? product.price_syp
  const currentPriceUsd = product.discount_price_usd ?? product.price_usd
  const displayPrice = currency === 'SYP' ? currentPriceSyp : currentPriceUsd
  const originalPrice = currency === 'SYP' ? product.price_syp : product.price_usd

  // Multi-item discount calculation
  const multiItemDiscountSyp = useMemo(() => {
    if (!product.multi_discount_enabled) return 0
    if (quantity === 2) return product.multi_discount_2_items_syp || 0
    if (quantity >= 3) return product.multi_discount_3_plus_syp || 0
    return 0
  }, [quantity, product])

  const multiItemDiscount = useMemo(() => {
    if (multiItemDiscountSyp <= 0) return 0
    if (currency === 'SYP') return multiItemDiscountSyp
    // Use product-level USD value if set
    const usdVal = quantity === 2
      ? (product.multi_discount_2_items_usd || 0)
      : (product.multi_discount_3_plus_usd || 0)
    if (usdVal > 0) return usdVal
    // Fallback: calculate from ratio
    const ratio = currentPriceSyp > 0 ? currentPriceUsd / currentPriceSyp : 0
    return parseFloat((multiItemDiscountSyp * ratio).toFixed(2))
  }, [multiItemDiscountSyp, currency, currentPriceSyp, currentPriceUsd, quantity, product])

  const totalPrice = (displayPrice * quantity) - multiItemDiscount

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
    const colorSpecificImage = selectedColor 
      ? product.images.find(img => img.color_variant === selectedColor.name_ar)?.url
      : null;

    const item: CartItem = {
      id:                 product.id,
      slug:               product.slug,
      name:               product.name,
      image:              colorSpecificImage ?? (product.images[0]?.url ?? ''),
      color:              selectedColor?.name_ar ?? null,
      color_hex:          selectedColor?.hex_code ?? null,
      size:               selectedSize,
      quantity,
      price_syp:          product.price_syp,
      price_usd:          product.price_usd,
      discount_price_syp: product.discount_price_syp ?? null,
      discount_price_usd: product.discount_price_usd ?? null,
      mold_type:          product.mold_type,
      multi_discount_syp: 0,
      max_stock:          currentAvailableStock,
      // Per-product multi-item discount settings
      multi_discount_enabled:      product.multi_discount_enabled ?? false,
      multi_discount_2_items_syp:  product.multi_discount_2_items_syp ?? 0,
      multi_discount_2_items_usd:  product.multi_discount_2_items_usd ?? 0,
      multi_discount_3_plus_syp:   product.multi_discount_3_plus_syp ?? 0,
      multi_discount_3_plus_usd:   product.multi_discount_3_plus_usd ?? 0,
    }
    addItem(item)
    trackAddToCart(product, quantity)
    toast.success(`تمت إضافة ${quantity > 1 ? quantity + ' قطع' : 'المنتج'} إلى السلة`)
    setQuantity(1)
    openCart()
  }, [product, selectedColor, selectedSize, quantity, outOfStock, addItem, openCart, currentAvailableStock])

  return (
    <div dir="rtl" className="space-y-6">

      {/* ── Price block ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-[#F5F3F0] px-5 py-4 rounded-2xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#785600] tabular-nums whitespace-nowrap">
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

        {/* Multi-item discount banner — per product */}
        {product.multi_discount_enabled && (
          <div className="bg-[#E8F5E9] border border-[#2E7D32]/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0">
              <span className="text-lg">🔥</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-arabic font-bold text-[#1B5E20]">وفّر أكثر مع كزورا!</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-[11px] font-arabic text-[#1B5E20]/80">
                  حسم <span className="font-bold underline">
                    {formatCurrency(currency === 'SYP' ? (product.multi_discount_2_items_syp || 0) : (product.multi_discount_2_items_usd || ((product.multi_discount_2_items_syp || 0) * (currentPriceUsd/currentPriceSyp))), currency)}
                  </span> عند شراء قطعتين
                </span>
                <span className="text-[11px] font-arabic text-[#1B5E20]/80">
                  حسم <span className="font-bold underline">
                    {formatCurrency(currency === 'SYP' ? (product.multi_discount_3_plus_syp || 0) : (product.multi_discount_3_plus_usd || ((product.multi_discount_3_plus_syp || 0) * (currentPriceUsd/currentPriceSyp))), currency)}
                  </span> عند شراء 3 قطع+
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shipping info */}
        {settings && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 border border-[#E8E3DB] p-3 rounded-xl">
              <span className="block text-[10px] font-arabic text-[#9E9890] mb-0.5">🚀 توصيل عادي (حلب)</span>
              <span className="text-xs font-bold text-[#1A1A1A] tabular-nums" dir="rtl">
                {/* Aleppo is ALWAYS flat fee from settings */}
                {formatPrice(currency === 'SYP' ? (settings.delivery_fee_syp || 0) : (settings.delivery_fee_usd || 0), currency)}
              </span>
            </div>
            <div className="bg-white/50 border border-[#E8E3DB] p-3 rounded-xl">
              <span className="block text-[10px] font-arabic text-[#9E9890] mb-0.5">📦 شحن محافظات ({quantity} {quantity >= 3 ? 'قطع' : 'قطعة'})</span>
              <span className="text-xs font-bold text-[#1A1A1A] tabular-nums" dir="rtl">
                {(() => {
                  // Rule for Provincial Shipping: 4+ items = WhatsApp
                  if (quantity >= 4) {
                    return <span className="text-[#2E7D32] font-arabic font-bold">يتحدد عبر الواتساب</span>
                  }
                  
                  const feeSyp = quantity === 1 
                    ? settings.shipping_fee_1_piece_syp 
                    : quantity === 2 
                      ? settings.shipping_fee_2_pieces_syp 
                      : settings.shipping_fee_3_plus_pieces_syp;
                      
                  const feeUsd = quantity === 1 
                    ? settings.shipping_fee_1_piece_usd 
                    : quantity === 2 
                      ? settings.shipping_fee_2_pieces_usd 
                      : settings.shipping_fee_3_plus_pieces_usd;
                  
                  if (quantity === 3 && (!feeSyp || feeSyp === 0)) {
                    return <span className="text-[#2E7D32] font-arabic font-bold">يتحدد عبر الواتساب</span>
                  }
                  
                  return formatPrice(currency === 'SYP' ? (feeSyp || 0) : (feeUsd || 0), currency)
                })()}
              </span>
            </div>
          </div>
        )}
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
                يرجى اختيار لون
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
                if (q >= effectiveMax) {
                  if (effectiveMax === 0) {
                    toast.error(alreadyInCart > 0 ? "الكمية المتاحة موجودة بالكامل في السلة" : "عذراً، المنتج غير متوفر حالياً");
                  } else {
                    toast.error(`عذراً، أقصى كمية متاحة هي ${effectiveMax}${alreadyInCart > 0 ? ` (لديك ${alreadyInCart} في السلة)` : ''}`);
                  }
                  return q;
                }
                return q + 1;
              })}
              disabled={quantity >= effectiveMax}
              className={cn(
                'w-11 h-11 flex items-center justify-center transition-colors duration-100',
                'focus-visible:outline-none',
                quantity >= effectiveMax
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
              <span className="font-bold text-[#785600] text-lg tabular-nums whitespace-nowrap">
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

      {/* 🎁 Loyalty Program Card */}
      {!outOfStock && (
        <div className="bg-[#FFFBEA] border border-[#FBE39A] rounded-2xl p-4 flex items-start gap-3 shadow-sm group hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#785600] flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:rotate-12 transition-transform">
            <span className="text-xl">🎁</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-arabic font-bold text-[#785600]">مفاجأة بانتظارك!</p>
            <p className="text-[11px] font-arabic text-[#785600]/80 leading-relaxed">
              لأنك عميل مميز، ستحصل على <span className="font-bold underline">خصم حصري وهدية مميزة</span> فور إتمامك لـ 3 طلبيات من متجرنا. وفّر أكثر مع برنامج الولاء!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
