'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 1.0,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const getVariants = () => {
    switch (direction) {
      case 'up':
        return { hidden: { opacity: 0, y: 100 }, visible: { opacity: 1, y: 0 } }
      case 'down':
        return { hidden: { opacity: 0, y: -100 }, visible: { opacity: 1, y: 0 } }
      case 'left':
        return { hidden: { opacity: 0, x: -100 }, visible: { opacity: 1, x: 0 } }
      case 'right':
        return { hidden: { opacity: 0, x: 100 }, visible: { opacity: 1, x: 0 } }
      case 'none':
        return { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }
      default:
        return { hidden: { opacity: 0, y: 100 }, visible: { opacity: 1, y: 0 } }
    }
  }

  return (
    <motion.div
      variants={getVariants()}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.25, margin: '0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
