'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'

interface Props {
  orderId: string
  total: number
  items: any[]
}

export default function TrackPurchase({ orderId, total, items }: Props) {
  useEffect(() => {
    trackPurchase(orderId, total, items)
  }, [orderId, total, items])

  return null
}
