'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'
import { useCartStore } from '@/store/cartStore'
import type { ProductFull, ProductColor, CartItem } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  product: ProductFull
  onColorChange?: (color: ProductColor | null) => void
}

export default function ProductActions({ product, onColorChange }: Props) {
  const { currency, setCurrency } = useCurrencyStore()
  const { addItem } = useCartStore()

  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    product.colors.length === 1 ? product.colors[0].id : null
  )
  const [selectedSize, setSelectedSize] = useState<number | null>(
    product.sizes.length === 1 ? product.sizes[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [sizeError, setSizeError] = useState(false)

  const selectedColor = useMemo(
    () => product.colors.find((c) => c.id === selectedColorId) ?? null,
    [product.colors, selectedColorId]
  )

  useEffect(() => {
    onColorChange?.(selectedColor)
  }, [selectedColor, onColorChange])

  const outOfStock = product.stock_status === 'out_of_stock'

  const hasDiscount = product.discount_price_syp != null && product.discount_price_syp < product.price_syp
  const discountPct = hasDiscount ? getDiscountPercent(product.price_syp, product.discount_price_syp!) : 0

  const currentPriceSyp = product.discount_price_syp ?? product.price_syp
  const currentPriceUsd = product.discount_price_usd ?? product.price_usd
  const displayPrice = currency === 'SYP' ? currentPriceSyp : currentPriceUsd
  const originalPrice = currency === 'SYP' ? product.price_syp : product.price_usd

  const handleAddToCart = useCallback(() => {
    if (outOfStock) return
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
    }
    addItem(item)
    toast.success(`تمت إضافة ${quantity > 1 ? quantity + ' قطع' : 'المنتج'} إلى السلة`)
    setQuantity(1)
  }, [product, selectedColor, selectedSize, quantity, outOfStock, addItem])

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
            <span className="text-[#6B6560] font-medium">اللون:</span>
            {selectedColor && (
              <span className="text-[#1A1A1A] font-bold">{selectedColor.name_ar}</span>
            )}
            {!selectedColor && (
              <span className="text-[#9E9890] text-xs font-medium italic opacity-70">يرجى اختيار لون</span>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {product.colors.map((color: ProductColor) => (
              <button
                key={color.id}
                type="button"
                title={color.name_ar}
                onClick={() => setSelectedColorId(color.id)}
                className={cn(
                  'w-10 h-10 rounded-full transition-all duration-200 shadow-sm',
                  'focus-visible:outline-none',
                  selectedColorId === color.id
                    ? 'ring-2 ring-[#785600] ring-offset-3'
                    : 'ring-1 ring-black/40 ring-offset-2 hover:ring-[#785600]'
                )}
                style={{ backgroundColor: color.hex_code }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Size selector ── */}
      {product.sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
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
            <a
              href="#size-guide"
              className="text-xs font-arabic text-[#785600] hover:underline underline-offset-4 flex items-center gap-1"
            >
              دليل المقاسات
            </a>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { setSelectedSize(size); setSizeError(false) }}
                disabled={outOfStock}
                className={cn(
                  'py-3 text-center text-sm font-medium tabular-nums transition-all duration-150',
                  'border-b-2 focus-visible:outline-none',
                  selectedSize === size
                    ? 'border-[#785600] bg-[#F5F1EB] text-[#785600] font-bold'
                    : 'border-transparent bg-[#F5F3F0] text-[#6B6560] hover:bg-[#EDE8E0] hover:text-[#1A1A1A]'
                )}
              >
                {size}
              </button>
            ))}
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
              onClick={() => setQuantity(q => Math.min(10, q + 1))}
              disabled={quantity >= 10}
              className={cn(
                'w-11 h-11 flex items-center justify-center transition-colors duration-100',
                'focus-visible:outline-none',
                quantity >= 10
                  ? 'text-[#D3C4AF] cursor-not-allowed'
                  : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#EDE8E0]'
              )}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Total for multiple items */}
          {quantity > 1 && (
            <span className="mr-3 font-arabic text-sm text-[#6B6560]">
              الإجمالي:{' '}
              <span className="font-bold text-[#785600] tabular-nums">
                {formatPrice(displayPrice * quantity, currency)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Add to cart ── */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock}
        className={cn(
          'w-full py-5 rounded-xl font-arabic font-bold text-xl transition-all duration-200',
          'flex items-center justify-center gap-3',
          'focus-visible:outline-none active:scale-[0.98]',
          outOfStock
            ? 'bg-[#ECEAE6] text-[#9E9890] cursor-not-allowed'
            : 'bg-[#B8860B] hover:bg-[#986D00] text-white shadow-lg shadow-[#785600]/20'
        )}
      >
        <ShoppingBag size={22} />
        {outOfStock ? 'نفذ من المخزن' : quantity > 1 ? `أضف ${quantity} قطع إلى السلة` : 'أضف إلى السلة'}
      </button>
    </div>
  )
}

