'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()
  const trackedPaths = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) return

    // Already tracked this path in this session
    if (trackedPaths.current.has(pathname)) return

    const trackVisit = () => {
      // Basic bot filter (server-side also filters)
      if (typeof window === 'undefined') return
      if (window.navigator.webdriver) return

      const ua = window.navigator.userAgent.toLowerCase()
      const isBot = /bot|crawler|spider|google|bing|yandex|slurp|duckduckbot|facebookexternalhit|linkedinbot|embedly|lighthouse|headless|screenshot|preview|whatsapp/i.test(ua)
      if (isBot) return

      // Mark as tracked immediately to prevent duplicates
      trackedPaths.current.add(pathname)

      try {
        let visitorId = localStorage.getItem('kzora_visitor_id')
        if (!visitorId) {
          visitorId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
          localStorage.setItem('kzora_visitor_id', visitorId)
        }

        // Use sendBeacon for reliability (won't be cancelled on navigation)
        const payload = JSON.stringify({
          sessionId: visitorId,
          path: pathname
        })

        // Try sendBeacon first (most reliable), fall back to fetch
        const beaconSent = navigator.sendBeacon?.('/api/system/ping', new Blob([payload], { type: 'application/json' }))

        if (!beaconSent) {
          fetch('/api/system/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {})
        }
      } catch (e) {
        // Silent fail - analytics should never break the store
      }
    }

    // Track immediately on page load - no delay!
    trackVisit()

  }, [pathname])

  return null
}
