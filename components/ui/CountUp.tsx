'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  /** النص الكامل مثل "1000+" أو "99%" أو "27 عملية إرجاع" — يُستخرج منه الرقم ويتحرك من الصفر */
  value: string
  className?: string
  /** مدة الحركة بالميلي ثانية */
  duration?: number
}

/**
 * يعرض النص كما هو لكن يُحرّك أول رقم بداخله من 0 إلى قيمته
 * عند دخوله مجال الرؤية (scroll into view). يحافظ على أي نص/رمز قبل أو بعد الرقم.
 */
export function CountUp({ value, className, duration = 1800 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  // يلتقط أول رقم (مع الفواصل والكسور) داخل النص
  const match = value.match(/\d[\d,]*\.?\d*/)

  const buildString = (numStr: string) =>
    match
      ? value.slice(0, match.index) + numStr + value.slice(match.index! + match[0].length)
      : value

  // الحالة الابتدائية: النص الأصلي برقمها الحقيقي ليراها محرك البحث وبوتات الذكاء فوراً في الـ HTML
  const [display, setDisplay] = useState(value)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!inView || !match || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    const raw = match[0]
    const target = parseFloat(raw.replace(/,/g, ''))
    const decimals = raw.includes('.') ? raw.split('.')[1].length : 0
    const start = performance.now()
    let frame: number

    // البدء من الصفر فور دخول مجال الرؤية لتحقيق الحركة البصرية
    setDisplay(buildString('0'))

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // easeOutExpo — يبدأ سريعاً ويتباطأ في النهاية
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = target * eased
      const formatted = current.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      setDisplay(buildString(formatted))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <span ref={ref} className={className} aria-label={value} data-stat-value={value}>
      {display}
    </span>
  )
}
