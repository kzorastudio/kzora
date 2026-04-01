'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import type { ProductImage } from '@/types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName?: string
  tags?: string[]
  hasDiscount?: boolean
  discountPct?: number
  className?: string
  activeColor?: string | null
  onIndexChange?: (index: number) => void
}

const TAG_LABELS: Record<string, string> = {
  new:         'جديد',
  best_seller: 'الأكثر مبيعاً',
  on_sale:     'تخفيض',
}

// ─── Lightbox Component ─────────────────────────────────────────────────────
function Lightbox({
  images,
  initialIndex,
  productName,
  onClose,
}: {
  images: ProductImage[]
  initialIndex: number
  productName: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const isZoomed = scale > 1

  const prev = useCallback(() => {
    if (isZoomed) return
    setIndex(i => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length, isZoomed])

  const next = useCallback(() => {
    if (isZoomed) return
    setIndex(i => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length, isZoomed])

  const toggleZoom = useCallback(() => {
    if (isZoomed) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }, [isZoomed])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') next()
      if (e.key === 'ArrowRight') prev()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Touch drag for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isZoomed || e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isZoomed || e.touches.length !== 1) return
    setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y })
  }

  // Swipe for mobile when not zoomed
  const [touchStartX, setTouchStartX] = useState(0)
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (isZoomed) return
    setTouchStartX(e.touches[0].clientX)
  }
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (isZoomed) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 60) {
      if (diff > 0) next()
      else prev()
    }
  }

  // Reset position when changing image
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [index])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-lg"
        onClick={onClose}
      />

      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
          aria-label="إغلاق"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm font-arabic">
            {index + 1} / {images.length}
          </span>
          <button
            onClick={toggleZoom}
            className={cn(
              'w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-colors',
              isZoomed ? 'bg-[#785600]' : 'bg-white/10 hover:bg-white/20'
            )}
            aria-label={isZoomed ? 'تصغير' : 'تكبير'}
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && !isZoomed && (
        <>
          <button
            onClick={prev}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            aria-label="السابق"
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={next}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            aria-label="التالي"
          >
            <ChevronLeft size={24} />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-16"
        onClick={(e) => { if (e.target === e.currentTarget && !isZoomed) onClose() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => { handleTouchStart(e); handleSwipeStart(e) }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => { setIsDragging(false); handleSwipeEnd(e) }}
        style={{ cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <div
          className="relative max-w-4xl w-full aspect-[4/5] md:aspect-[3/4] transition-transform duration-200"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          onClick={(e) => { e.stopPropagation(); toggleZoom() }}
        >
          <Image
            src={images[index].url}
            alt={`${productName} - صورة ${index + 1}`}
            fill
            sizes="100vw"
            quality={95}
            className="object-contain select-none pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Bottom thumbnails */}
      {images.length > 1 && !isZoomed && (
        <div className="absolute bottom-4 md:bottom-8 left-0 right-0 z-20 flex justify-center gap-2 px-4">
          <div className="flex gap-2 bg-black/40 backdrop-blur-md rounded-xl p-2 max-w-full overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setIndex(i)}
                className={cn(
                  'relative shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-150',
                  i === index
                    ? 'ring-2 ring-white opacity-100'
                    : 'opacity-40 hover:opacity-80'
                )}
              >
                <Image
                  src={img.url}
                  alt={`صورة ${i + 1}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ProductGallery Component ─────────────────────────────────────────────────
export function ProductGallery({
  images,
  productName = 'صورة المنتج',
  tags = [],
  hasDiscount = false,
  discountPct = 0,
  className,
  activeColor = null,
  onIndexChange
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const allSorted = useMemo(() => {
    return [...(images ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [images])

  // Show all images but allow jumping to color-specific ones
  const sorted = allSorted

  // Jump to first image of that color when color selection changes in parent
  useEffect(() => {
    if (activeColor) {
      const trimmedActive = activeColor.trim()
      const colorIndex = sorted.findIndex(img => img.color_variant?.trim() === trimmedActive)
      if (colorIndex !== -1) {
        setActiveIndex(colorIndex)
      }
    }
  }, [activeColor, sorted])

  const handleIndexChange = useCallback((newIndex: number) => {
    setActiveIndex(newIndex)
    if (onIndexChange) onIndexChange(newIndex)
  }, [onIndexChange])

  // Reset to first image when color changes
  useEffect(() => {
    handleIndexChange(0)
  }, [activeColor, handleIndexChange])

  const activeImage = sorted[activeIndex]

  if (!sorted.length) {
    return (
      <div className={cn('aspect-[4/5] rounded-2xl bg-[#F5F1EB] flex items-center justify-center', className)}>
        <span className="text-[#9E9890] font-arabic text-sm">لا توجد صورة</span>
      </div>
    )
  }

  return (
    <>
      <div dir="rtl" className={cn('flex flex-col gap-4 md:flex-row-reverse', className)}>

        {/* Main image */}
        <div
          className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F1EB] cursor-zoom-in group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setLightboxOpen(true)}
        >
          {activeImage && (
            <div className="absolute inset-0 transition-opacity duration-500 ease-in-out" key={activeImage.id}>
              <Image
                src={activeImage.url}
                alt={productName}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                className={cn(
                  'object-cover transition-transform duration-700 ease-out',
                  isHovered ? 'scale-105' : 'scale-100'
                )}
              />
            </div>
          )}

          {/* Zoom indicator */}
          <div className={cn(
            'absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-black/50 text-white text-xs font-arabic rounded-full px-3 py-1.5 backdrop-blur-sm transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            <ZoomIn size={14} />
            اضغط للتكبير
          </div>

          {/* Tag badges */}
          {tags.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'px-3 py-1 text-xs font-arabic font-bold rounded-md',
                    tag === 'new'         ? 'bg-[#1A1A1A] text-white' :
                    tag === 'on_sale'     ? 'bg-[#BA1A1A] text-white' :
                    tag === 'best_seller' ? 'bg-[#785600] text-white' :
                    'bg-[#1A1A1A] text-white'
                  )}
                >
                  {TAG_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && discountPct > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-[#BA1A1A] text-white px-2.5 py-1 text-xs font-bold rounded-md">
                خصم {discountPct}%
              </span>
            </div>
          )}

          {/* Prev/Next arrows */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                aria-label="الصورة السابقة"
                onClick={(e) => { e.stopPropagation(); handleIndexChange(activeIndex === 0 ? sorted.length - 1 : activeIndex - 1) }}
                className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md z-10"
              >
                <ChevronRight size={24} />
              </button>
              <button
                type="button"
                aria-label="الصورة التالية"
                onClick={(e) => { e.stopPropagation(); handleIndexChange(activeIndex === sorted.length - 1 ? 0 : activeIndex + 1) }}
                className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md z-10"
              >
                <ChevronLeft size={24} />
              </button>
            </>
          )}

          {/* Counter */}
          {sorted.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-arabic rounded-full px-3 py-1.5 backdrop-blur-sm z-10">
              {activeIndex + 1} / {sorted.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {sorted.length > 1 && (
          <div className="flex flex-row gap-3 overflow-x-auto md:flex-col md:overflow-y-auto md:max-h-[560px] md:w-20 shrink-0 no-scrollbar pb-2">
            {sorted.map((img, i) => (
              <button
                key={img.id}
                type="button"
                aria-label={`صورة ${i + 1}`}
                onClick={() => handleIndexChange(i)}
                className={cn(
                  'relative shrink-0 rounded-xl overflow-hidden transition-all duration-200',
                  'w-[72px] h-20 md:w-full md:aspect-[4/5]',
                  'focus-visible:outline-none',
                  i === activeIndex
                    ? 'ring-2 ring-[#785600] ring-offset-2 scale-95 opacity-100 shadow-sm'
                    : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-[#E8E3DB] hover:ring-offset-1'
                )}
              >
                <Image
                  src={img.url}
                  alt={`${productName} - صورة ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={sorted}
          initialIndex={activeIndex}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
