'use client'

import { useEffect, useState } from 'react'
import { resolveShippingName } from './utils'

export { resolveShippingName }
export type ShippingNames = Record<string, string>

// One fetch per page load, shared by every component that needs names.
let cache: ShippingNames | null = null
let inflight: Promise<ShippingNames> | null = null

export function loadShippingNames(): Promise<ShippingNames> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch('/api/shipping/names', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        cache = d?.names || {}
        return cache!
      })
      .catch(() => ({}))
      .finally(() => { inflight = null })
  }
  return inflight
}

export function useShippingNames(): ShippingNames | null {
  const [names, setNames] = useState<ShippingNames | null>(cache)
  useEffect(() => {
    let alive = true
    loadShippingNames().then(n => { if (alive) setNames(n) })
    return () => { alive = false }
  }, [])
  return names
}
