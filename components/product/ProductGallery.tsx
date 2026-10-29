'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  optimizeCloudinaryUrl,
  productVideoUrl,
  productVideoPosterUrl,
  formatVideoDuration,
} from '@/lib/cloudinaryUrl'
import { X, ChevronLeft, ChevronRight, ZoomIn, Play, Volume2, VolumeX } from 'lucide-react'
import type { ProductImage } from '@/types'

export interface ProductGalleryVideo {
  url: string
  duration: number | null
  position: number // 0 = first, 1 = second, -1 = last
}

type GalleryItem =
  | { kind: 'image'; img: ProductImage; imageIndex: number }
  | { kind: 'video' }

interface ProductGalleryProps {
  images: ProductImage[]
  video?: ProductGalleryVideo | null
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
  onChange,
}: {
  images: ProductImage[]
  initialIndex: number
  productName: string
  onClose: () => void
  onChange: (index: number) => void
}) {
  const [index, setIndex] = useState(initialIndex)
  
  useEffect(() => {
    onChange(index)
  }, [index, onChange])
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

      {/* Image container with AnimatePresence */}
      <div
        className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-16 overflow-hidden"
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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={images[index].id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ 
              opacity: 1, 
              scale: isZoomed ? scale : 1,
              x: position.x,
              y: position.y,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              opacity: { duration: 0.3, ease: 'easeInOut' },
              scale: { duration: 0.2, ease: 'easeOut' },
              x: { type: 'tween', duration: 0 }, // Immediate position sync when zoomed
              y: { type: 'tween', duration: 0 },
            }}
            className="relative max-w-4xl w-full aspect-[4/5] md:aspect-[3/4]"
            onClick={(e) => { e.stopPropagation(); if (!isDragging) toggleZoom() }}
          >
            <Image
              src={optimizeCloudinaryUrl(images[index].url)}
              alt={`${productName} - صورة ${index + 1}`}
              fill
              sizes="100vw"
              quality={95}
              className="object-contain select-none pointer-events-none"
              priority
            />
          </motion.div>
        </AnimatePresence>
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
                  src={optimizeCloudinaryUrl(img.url)}
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

// ─── Video slide ──────────────────────────────────────────────────────────────
// Shows the poster right away and only mounts the <video> once the page has
// finished loading, so the video never delays the photos, price or buttons.
// Plays muted and looped; tap toggles pause. Respects the browser's data-saver.
function VideoSlide({ video, priority }: { video: ProductGalleryVideo; priority: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const poster = productVideoPosterUrl(video.url)

  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) {
      setPaused(true) // wait for a tap
      return
    }
    if (document.readyState === 'complete') {
      setMounted(true)
      return
    }
    const onLoad = () => setMounted(true)
    window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !mounted) return
    // Set muted as a property before play(): mobile browsers only autoplay muted video
    el.muted = muted
    if (!paused) el.play().catch(() => setPaused(true))
  }, [mounted]) // run once, when the <video> mounts

  const togglePlay = () => {
    if (!mounted) {
      setMounted(true)
      setPaused(false)
      return
    }
    const el = ref.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => {})
      setPaused(false)
    } else {
      el.pause()
      setPaused(true)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !muted
    setMuted(next)
    if (ref.current) ref.current.muted = next
  }

  return (
    <div className="w-full h-full relative" onClick={togglePlay}>
      <Image
        src={poster}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 60vw"
        priority={priority}
        className="object-cover select-none"
        draggable={false}
      />
      {mounted && (
        <video
          ref={ref}
          src={productVideoUrl(video.url)}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
          onTimeUpdate={e => {
            const v = e.currentTarget
            if (v.duration) setProgress(v.currentTime / v.duration)
          }}
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
      )}

      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
            <Play size={28} fill="currentColor" className="translate-x-0.5" />
          </span>
        </div>
      )}

      {mounted && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          className="absolute bottom-9 md:bottom-4 left-4 z-10 w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25 z-10 pointer-events-none">
        <div className="h-full bg-[#785600]" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

// ─── ProductGallery Component ─────────────────────────────────────────────────
export function ProductGallery({
  images,
  video = null,
  productName = 'صورة المنتج',
  tags = [],
  hasDiscount = false,
  discountPct = 0,
  className,
  activeColor = null,
  onIndexChange
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const sorted = useMemo(() => {
    return [...(images ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [images])

  // Gallery slides: the sorted photos, with the video (if any) inserted at its position
  const items = useMemo<GalleryItem[]>(() => {
    const list: GalleryItem[] = sorted.map((img, i) => ({ kind: 'image', img, imageIndex: i }))
    if (video?.url) {
      const pos = video.position < 0 || video.position > list.length ? list.length : video.position
      list.splice(pos, 0, { kind: 'video' })
    }
    return list
  }, [sorted, video?.url, video?.position])

  // Stable synchronization between activeColor prop and internal gallery index
  const lastPropColor = useRef<string | null>(activeColor)

  useEffect(() => {
    if (activeColor !== lastPropColor.current) {
      lastPropColor.current = activeColor
      if (activeColor) {
        const trimmedActive = activeColor.trim().toLowerCase()
        const current = items[activeIndex]
        const currentColor = current?.kind === 'image' ? current.img.color_variant : null

        if (currentColor?.trim().toLowerCase() !== trimmedActive) {
          const colorIndex = items.findIndex(it => it.kind === 'image' && it.img.color_variant?.trim().toLowerCase() === trimmedActive)
          if (colorIndex !== -1) {
            setDirection(colorIndex > activeIndex ? 1 : -1)
            setActiveIndex(colorIndex)
          }
        }
      }
    }
  }, [activeColor, items, activeIndex])

  const handleIndexChange = useCallback((newIndex: number) => {
    if (newIndex === activeIndex) return
    setDirection(newIndex > activeIndex ? 1 : -1)
    setActiveIndex(newIndex)
    // Parent tracks photos only (to sync the selected color); the video has no color
    const item = items[newIndex]
    if (onIndexChange && item?.kind === 'image') onIndexChange(item.imageIndex)
  }, [onIndexChange, activeIndex, items])

  // Lightbox shows photos only, so translate between photo index and slide index
  const handleLightboxChange = useCallback((imageIndex: number) => {
    const slide = items.findIndex(it => it.kind === 'image' && it.imageIndex === imageIndex)
    if (slide !== -1) handleIndexChange(slide)
  }, [items, handleIndexChange])

  const slideVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      scale: 1.05,
    }),
    center: {
      opacity: 1,
      scale: 1,
      zIndex: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      scale: 0.95,
      zIndex: 0,
    }),
  }

  const activeItem = items[activeIndex]
  const activeImage = activeItem?.kind === 'image' ? activeItem.img : null

  if (!items.length) {
    return (
      <div className={cn('aspect-[4/5] rounded-2xl bg-[#F5F1EB] flex items-center justify-center', className)}>
        <span className="text-[#9E9890] font-arabic text-sm">لا توجد صورة</span>
      </div>
    )
  }

  return (
    <>
      <div dir="rtl" className={cn('flex flex-col gap-4 lg:flex-row-reverse', className)}>
        {/* Main image container */}
        <div
          className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F1EB] group shadow-sm border border-[#E8E3DB]/30"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {activeItem && (
              <motion.div
                key={activeImage ? activeImage.id : 'video'}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  opacity: { duration: 0.3, ease: 'easeInOut' },
                  scale: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500
                  if (swipe) {
                    if (offset.x > 0) {
                      handleIndexChange(activeIndex === 0 ? items.length - 1 : activeIndex - 1)
                    } else {
                      handleIndexChange(activeIndex === items.length - 1 ? 0 : activeIndex + 1)
                    }
                  }
                }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                {activeImage ? (
                  <div
                    className="w-full h-full relative"
                    onClick={(e) => {
                      // Only trigger lightbox if it wasn't a significant drag
                      setLightboxOpen(true)
                    }}
                  >
                    <Image
                      src={optimizeCloudinaryUrl(activeImage.url)}
                      alt={productName}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      priority
                      className={cn(
                        'object-cover transition-transform duration-500 ease-out select-none',
                        isHovered ? 'scale-105' : 'scale-100'
                      )}
                      draggable={false}
                    />
                  </div>
                ) : video && (
                  <VideoSlide video={video} priority={activeIndex === 0} />
                )}
              </motion.div>
            )}
          </AnimatePresence>


          {/* Zoom indicator (desktop only) */}
          <div className={cn(
            'hidden md:flex absolute bottom-4 right-4 z-10 items-center gap-1.5 bg-black/50 text-white text-xs font-arabic rounded-full px-3 py-1.5 backdrop-blur-sm transition-opacity duration-200 pointer-events-none',
            isHovered && activeImage ? 'opacity-100' : 'opacity-0'
          )}>
            <ZoomIn size={14} />
            اضغط للتكبير
          </div>

          {/* Swipe indicator (mobile only) */}
          <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {items.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex ? "bg-[#785600] w-4" : "bg-white/40"
                )}
              />
            ))}
          </div>

          {/* Tag badges */}
          {tags.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-none">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'px-3 py-1 text-xs font-arabic font-bold rounded-md shadow-sm',
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
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <span className="bg-[#BA1A1A] text-white px-2.5 py-1 text-xs font-bold rounded-md shadow-sm">
                خصم {discountPct}%
              </span>
            </div>
          )}

          {/* Controls - PC style */}
          {items.length > 1 && (
            <div className="hidden md:block">
              <button
                type="button"
                aria-label="الصورة السابقة"
                onClick={(e) => { e.stopPropagation(); handleIndexChange(activeIndex === 0 ? items.length - 1 : activeIndex - 1) }}
                className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md z-10"
              >
                <ChevronRight size={24} />
              </button>
              <button
                type="button"
                aria-label="الصورة التالية"
                onClick={(e) => { e.stopPropagation(); handleIndexChange(activeIndex === items.length - 1 ? 0 : activeIndex + 1) }}
                className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md z-10"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {items.length > 1 && (
          <div className="flex flex-row gap-3 overflow-x-auto md:flex-col md:overflow-y-auto md:max-h-[560px] md:w-20 shrink-0 no-scrollbar py-1">
            {items.map((item, i) => (
              <button
                key={item.kind === 'image' ? item.img.id : 'video'}
                type="button"
                aria-label={item.kind === 'image' ? `صورة ${item.imageIndex + 1}` : 'فيديو المنتج'}
                onClick={() => handleIndexChange(i)}
                className={cn(
                  'relative shrink-0 rounded-xl overflow-hidden transition-all duration-200',
                  'w-16 h-20 md:w-full md:aspect-[4/5]',
                  'focus-visible:outline-none',
                  i === activeIndex
                    ? 'ring-2 ring-[#785600] ring-offset-2 scale-95 opacity-100 shadow-sm'
                    : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-[#E8E3DB] hover:ring-offset-1'
                )}
              >
                {item.kind === 'image' ? (
                  <Image
                    src={optimizeCloudinaryUrl(item.img.url)}
                    alt={`${productName} - صورة ${item.imageIndex + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : video && (
                  <>
                    <Image
                      src={productVideoPosterUrl(video.url)}
                      alt={`${productName} - فيديو`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <span className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-[#1A1A1A]">
                        <Play size={12} fill="currentColor" className="translate-x-px" />
                      </span>
                    </span>
                    {video.duration != null && (
                      <span dir="ltr" className="absolute bottom-1 left-1 bg-black/65 text-white text-[10px] leading-none px-1 py-0.5 rounded tabular-nums">
                        {formatVideoDuration(video.duration)}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox (photos only) */}
      {lightboxOpen && activeItem?.kind === 'image' && (
        <Lightbox
          images={sorted}
          initialIndex={activeItem.imageIndex}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
          onChange={handleLightboxChange}
        />
      )}
    </>
  )
}
