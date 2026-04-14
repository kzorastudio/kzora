'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'

function MouseIcon() {
  return (
    <div
      style={{
        width: 30,
        height: 46,
        borderRadius: 999,
        border: '2px solid rgba(26,26,26,0.55)',
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 8,
      }}
    >
      <motion.div
        style={{ width: 4, height: 8, borderRadius: 999, background: '#1A1A1A' }}
        animate={{ y: [0, 16, 0], opacity: [1, 0.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      />
    </div>
  )
}

const DOT_SIZE = 26
const RING_MID = 40
const RING_OUT = 58

function SwipeGesture() {
  const TRACK_H = 120

  return (
    <div style={{ position: 'relative', width: 80, height: TRACK_H }}>

      {/* Trail — centered via marginLeft, no transform conflict */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -1,
          width: 2,
          borderRadius: 999,
          background: 'linear-gradient(to top, rgba(26,26,26,0.6), rgba(26,26,26,0))',
          transformOrigin: 'bottom',
        }}
        animate={{
          height: [0, 70, 0],
          bottom: [DOT_SIZE, DOT_SIZE, DOT_SIZE + 70],
          opacity: [0, 0.7, 0],
        }}
        transition={{ repeat: Infinity, duration: 2, ease: [0.4, 0, 0.6, 1] }}
      />

      {/* Touch circle — wrapper centered via marginLeft, motion only moves y */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -(RING_OUT / 2),
          bottom: 0,
        }}
      >
        <motion.div
          style={{ width: RING_OUT, height: RING_OUT }}
          animate={{ y: [0, -(TRACK_H - RING_OUT), -(TRACK_H - RING_OUT)], opacity: [0, 1, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            times: [0, 0.68, 1],
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Outer glow */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              background: 'rgba(26,26,26,0.07)',
            }}
            animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
          />
          {/* Middle ring */}
          <motion.div
            style={{
              position: 'absolute',
              top: (RING_OUT - RING_MID) / 2,
              left: (RING_OUT - RING_MID) / 2,
              width: RING_MID,
              height: RING_MID,
              borderRadius: 999,
              background: 'rgba(26,26,26,0.14)',
            }}
            animate={{ scale: [1, 1.35], opacity: [0.9, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.07 }}
          />
          {/* Core dot */}
          <div
            style={{
              position: 'absolute',
              top: (RING_OUT - DOT_SIZE) / 2,
              left: (RING_OUT - DOT_SIZE) / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: 999,
              background: 'rgba(26,26,26,0.65)',
              border: '2px solid rgba(26,26,26,0.3)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          />
        </motion.div>
      </div>

    </div>
  )
}

export function ScrollHint() {
  const [visible, setVisible] = useState(false)
  const isCartOpen = useCartStore(s => s.isOpen)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 1800)
    const handleScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setVisible(scrolled < total * 0.85)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearTimeout(show)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    /* Outer div: only handles fixed centering — no animation here */
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visible && !isCartOpen && (
          /* Inner motion.div: only handles fade/slide — no translate-x here */
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >

            {/* Desktop: mouse scroll */}
            <div className="hidden md:flex flex-col items-center gap-3">
              <MouseIcon />
              <span
                className="font-arabic text-xs font-bold tracking-wide"
                style={{ color: 'rgba(26,26,26,0.65)', textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}
              >
                اسحب للأسفل
              </span>
            </div>

            {/* Mobile: phone swipe gesture */}
            <div className="flex md:hidden flex-col items-center">
              <SwipeGesture />
              <span
                className="font-arabic text-xs font-bold tracking-wide"
                style={{ color: 'rgba(26,26,26,0.65)', marginTop: -6, textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}
              >
                اسحب للأسفل
              </span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
