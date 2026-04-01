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

        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: visitorId,
            path: pathname
          })
        }).catch(() => {})
      } catch (e) {}
    }

    // Delay the tracking to avoid counting "hits and leaves"
    const timer = setTimeout(() => {
      // If after 3 seconds they haven't moved but are still on page, count them?
      // Better to wait for an interaction or just a longer delay
      trackVisit()
    }, 3000)

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
