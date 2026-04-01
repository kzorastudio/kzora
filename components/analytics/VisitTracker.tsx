'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = () => {
      // Don't track admin pages for visitor stats
      if (pathname.startsWith('/admin')) return

      // Use localStorage for a persistent Visitor ID (counts as 1 "person")
      let visitorId = localStorage.getItem('kzora_visitor_id')
      if (!visitorId) {
        visitorId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
        localStorage.setItem('kzora_visitor_id', visitorId)
      }

      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: visitorId, // We'll keep the key name for DB compatibility
          path: pathname
        })
      }).catch(() => {})
    }

    trackVisit()
  }, [pathname])

  return null
}
