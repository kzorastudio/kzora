'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Only track human-like behavior
    let tracked = false
    
    const trackVisit = () => {
      if (tracked) return
      if (pathname.startsWith('/admin')) return
      
      // Basic bot filter - most automated crawlers set this
      if (typeof window !== 'undefined' && window.navigator.webdriver) return

      tracked = true

      try {
        let visitorId = localStorage.getItem('kzora_visitor_id')
        if (!visitorId) {
          visitorId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
          localStorage.setItem('kzora_visitor_id', visitorId)
        }

        fetch('/api/system/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: visitorId,
            path: pathname
          })
        }).catch(() => {})
      } catch (e) {}
    }

    // Delay the tracking slightly to ensure page load but avoid adblocker drops
    const timer = setTimeout(() => {
      trackVisit()
    }, 1000)

    // Also track on interaction for faster confirmation
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, trackVisit, { once: true }))

    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, trackVisit))
    }
  }, [pathname])

  return null
}
