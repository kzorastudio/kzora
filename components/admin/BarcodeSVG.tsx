'use client'

import React from 'react'

// Code128 B pattern lookup table (0 - 106)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313111', '314111',
  '334111', '321131', '312113', '322111', '314111', '221411', '431111', '111224', '111422', '121124',
  '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211',
  '221114', '411112', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141',
  '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214',
  '211232', '2331112', '211132', '211231', '213211', '221131', '221311', '214111', '412111', '211141',
  '211241', '211411', '231141', '211412', '211214', '211232', '2331112'
]

function encodeCode128B(text: string): string[] {
  const codes: number[] = [104] // Start B
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0
    codes.push(val)
  }

  // Calculate checksum
  let checksum = codes[0]
  for (let i = 1; i < codes.length; i++) {
    checksum += i * codes[i]
  }
  codes.push(checksum % 103)
  codes.push(106) // Stop code

  return codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0])
}

interface BarcodeSVGProps {
  value: string
  height?: number
  showText?: boolean
  className?: string
}

export default function BarcodeSVG({ value, height = 45, showText = true, className = '' }: BarcodeSVGProps) {
  if (!value) return null

  const patterns = encodeCode128B(value)
  const moduleWidth = 2
  let currentX = 10 // Quiet zone offset

  const rects: React.ReactNode[] = []

  patterns.forEach((pattern, pIdx) => {
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10) * moduleWidth
      const isBar = i % 2 === 0
      if (isBar) {
        rects.push(
          <rect
            key={`${pIdx}-${i}`}
            x={currentX}
            y={0}
            width={width}
            height={height}
            fill="#000000"
          />
        )
      }
      currentX += width
    }
  })

  const totalWidth = currentX + 10 // Quiet zone end

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[240px] h-auto"
        style={{ shapeRendering: 'crispEdges' }}
      >
        {rects}
      </svg>
      {showText && (
        <span className="text-xs font-mono font-bold tracking-wider text-black mt-0.5">
          {value}
        </span>
      )}
    </div>
  )
}
