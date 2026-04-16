'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import type { HeroSlide } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react'

import 'swiper/css'
import 'swiper/css/navigation'

interface Props {
  slides: HeroSlide[]
  badgeText?: string
  badgeColor?: string
}

export default function HeroSlider({ slides, badgeText, badgeColor }: Props) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [contentVisible, setContentVisible] = useState(true)

  if (!slides || slides.length === 0) return null

  return (
    <section className="relative w-full overflow-hidden bg-[#F5F3F0]" style={{ height: 'max(480px, 88vh)' }} dir="rtl">
      <Swiper
        modules={[Autoplay, Navigation]}
        speed={1000}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        rewind={slides.length > 1}
        simulateTouch={false} // disables mouse drag on desktop
        allowTouchMove={true} // enables touch swipe on mobile
        onSwiper={(swiper) => { swiperRef.current = swiper }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex)
          setContentVisible(false)
          setTimeout(() => setContentVisible(true), 150)
        }}
        className="w-full h-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id} className="relative w-full h-full">
            {/* ── Background Layer ─────────────────────────────────────────── */}
            <div className="absolute inset-0 select-none">
              {slide.mobile_image_url ? (
                <>
                  <Image
                    src={slide.mobile_image_url}
                    alt={slide.heading}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover sm:hidden"
                  />
                  <Image
                    src={slide.desktop_image_url}
                    alt={slide.heading}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover hidden sm:block"
                  />
                </>
              ) : (
                <Image
                  src={slide.desktop_image_url}
                  alt={slide.heading}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              )}
              
              {/* Premium Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/40 to-transparent hidden md:block" />
              {/* Mobile: subtler white gradient from bottom */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#FAF8F5]/90 via-[#FAF8F5]/40 to-transparent md:hidden" />
              <div className="absolute inset-0 bg-black/[0.02]" />
            </div>

            {/* ── Interactive Content Layer ─────────────────────────────────── */}
            <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 flex items-end md:items-center pb-24 md:pb-0">
              <div className="w-full max-w-2xl md:max-w-3xl">
                <AnimatePresence mode="wait">
                  {contentVisible && i === activeIndex && (
                    <div className="flex flex-col items-start text-right">
                      {/* Badge / Subtitle */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-3 md:mb-6 flex items-center gap-3"
                      >
                        <div className="h-px w-8" style={{ backgroundColor: badgeColor || '#785600' }} />
                        <span 
                          className="font-arabic text-xs md:text-sm font-black tracking-[0.2em] uppercase"
                          style={{ color: badgeColor || '#785600' }}
                        >
                          {badgeText || 'تشكيلة كزورا الفاخرة ٢٠٢٦'}
                        </span>
                      </motion.div>

                      {/* Main Title */}
                      <motion.h1 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="font-arabic text-2xl sm:text-4xl md:text-6xl font-extrabold leading-snug mb-4 md:mb-6"
                        style={{ color: slide.heading_color || '#1A1A1A' }}
                      >
                        {slide.heading.split('—').map((part, idx) => (
                           <span key={idx} className={cn("inline", idx % 2 !== 0 && "mx-1")} style={{ color: idx % 2 !== 0 ? (slide.accent_color || '#785600') : undefined }}>
                             {part}
                           </span>
                        ))}
                      </motion.h1>

                      {/* Description — visible on all screens */}
                      {slide.sub_text && (
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.5 }}
                          className="font-arabic text-sm sm:text-base md:text-xl max-w-lg mb-6 md:mb-12 leading-relaxed font-medium"
                          style={{ color: slide.subtext_color || '#4A4742' }}
                        >
                          {slide.sub_text}
                        </motion.p>
                      )}

                      {/* Actions */}
                      {slide.cta_text && slide.cta_link && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          <a
                            href={slide.cta_link}
                            className="group relative inline-flex items-center gap-4 md:gap-6 px-7 py-3.5 md:px-12 md:py-5 rounded-2xl bg-[#1A1A1A] text-white overflow-hidden shadow-2xl transition-all hover:md:pr-14 cursor-pointer z-50"
                          >
                            <span className="relative z-10 font-arabic font-bold text-base md:text-lg">{slide.cta_text}</span>
                            <span className="relative z-10 text-2xl transition-transform group-hover:-translate-x-2">←</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#785600] to-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </a>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ── Custom Pagination ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-12 right-6 md:right-12 lg:right-16 z-20 flex items-center gap-4">
           <div className="flex items-baseline gap-1 font-brand text-[#1A1A1A]/40 text-sm">
              <span className="text-[#1A1A1A] font-bold text-xl">{activeIndex + 1}</span>
              <span>/</span>
              <span>{slides.length}</span>
           </div>
           
           <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => swiperRef.current?.slideTo(i)}
                className="group relative h-1.5 focus:outline-none"
                style={{ width: i === activeIndex ? '60px' : '30px', transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className={cn(
                  "absolute inset-0 rounded-full transition-colors duration-500",
                  i === activeIndex ? "bg-[#785600]" : "bg-[#1A1A1A]/10 group-hover:bg-[#1A1A1A]/20"
                )} />
              </button>
            ))}
           </div>
        </div>
      )}
      
      {/* ── Desktop Navigation Arrows ── */}
      {slides.length > 1 && (
        <div className="absolute inset-y-0 left-0 right-0 z-20 hidden md:flex items-center justify-between pointer-events-none px-6 lg:px-12">
          {/* Right Arrow (Prev in RTL) */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110 pointer-events-auto"
            aria-label="Previous slide"
          >
            <ChevronRight size={32} />
          </button>

          {/* Left Arrow (Next in RTL) */}
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110 pointer-events-auto"
            aria-label="Next slide"
          >
            <ChevronLeft size={32} />
          </button>
        </div>
      )}

      {/* Decorative vertical line */}
      <div className="absolute bottom-0 left-12 lg:left-16 w-px h-24 bg-gradient-to-t from-[#785600] to-transparent hidden md:block" />

    </section>
  )
}
