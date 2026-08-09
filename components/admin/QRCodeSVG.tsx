'use client'

import React from 'react'
import { encodeQR, type ECLevel } from '@/lib/qrcode'

interface QRCodeSVGProps {
  value: string
  /** Rendered edge length in px, including the quiet zone. */
  size?: number
  /** Error correction level. M is a good balance for thermal labels. */
  ecLevel?: ECLevel
  className?: string
}

/** The spec requires at least 4 light modules around the symbol, or scanners fail. */
const QUIET_ZONE = 4

export default function QRCodeSVG({ value, size = 70, ecLevel = 'M', className = '' }: QRCodeSVGProps) {
  const matrix = React.useMemo(() => {
    try {
      return encodeQR(value, ecLevel)
    } catch {
      return null
    }
  }, [value, ecLevel])

  if (!matrix) return null

  const modules = matrix.length
  const total = modules + QUIET_ZONE * 2

  // Merge horizontal runs into single rects — far fewer nodes to print and embed.
  const rects: React.ReactNode[] = []
  for (let r = 0; r < modules; r++) {
    let c = 0
    while (c < modules) {
      if (!matrix[r][c]) {
        c++
        continue
      }
      let run = 1
      while (c + run < modules && matrix[r][c + run]) run++
      rects.push(
        <rect key={`${r}-${c}`} x={c + QUIET_ZONE} y={r + QUIET_ZONE} width={run} height={1} fill="#000000" />
      )
      c += run
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${total} ${total}`}
        className="border border-black"
        shapeRendering="crispEdges"
        role="img"
        aria-label={value}
      >
        {/* The quiet zone must be white, not transparent, whatever sits behind it. */}
        <rect x={0} y={0} width={total} height={total} fill="#FFFFFF" />
        {rects}
      </svg>
    </div>
  )
}
