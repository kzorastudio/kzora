'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = () => {
      // Don't track admin pages for visitor stats
      if (pathname.startsWith('/admin')) return

      // Simple session ID using session storage
      let sessionId = sessionStorage.getItem('kzora_session_id')
      if (!sessionId) {
        sessionId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
        sessionStorage.setItem('kzora_session_id', sessionId)
      }

      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          path: pathname
        })
      }).catch(() => {})
    }

    trackVisit()
  }, [pathname])

  return null
}
