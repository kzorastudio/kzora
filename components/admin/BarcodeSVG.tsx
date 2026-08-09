'use client'

import React from 'react'

/** Standard ISO/IEC 15417 Code 128 pattern bitstrings (symbols 0 to 106) */
const BARS: string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
  '11010011100', '1100011101011'
]

function generateCode128Bits(text: string): string {
  // Start Code B (index 104)
  let bits = BARS[104]
  let checksum = 104

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0
    bits += BARS[val] || BARS[0]
    checksum += val * (i + 1)
  }

  // Modulo 103 checksum character
  bits += BARS[checksum % 103] || BARS[0]
  // Stop Code (index 106)
  bits += BARS[106]

  return bits
}

interface BarcodeSVGProps {
  value: string
  height?: number
  showText?: boolean
  className?: string
}

export default function BarcodeSVG({ value, height = 45, showText = true, className = '' }: BarcodeSVGProps) {
  if (!value) return null

  const bits = generateCode128Bits(value)
  const moduleWidth = 2
  const quietZoneModules = 10
  const quietZonePx = quietZoneModules * moduleWidth

  const rects: React.ReactNode[] = []
  let currentX = quietZonePx
  let barWidth = 0

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      barWidth += moduleWidth
    } else {
      if (barWidth > 0) {
        rects.push(
          <rect
            key={currentX}
            x={currentX}
            y={0}
            width={barWidth}
            height={height}
            fill="#000000"
          />
        )
        currentX += barWidth
        barWidth = 0
      }
      currentX += moduleWidth
    }
  }

  // Draw final bar if string ends on '1'
  if (barWidth > 0) {
    rects.push(
      <rect
        key={currentX}
        x={currentX}
        y={0}
        width={barWidth}
        height={height}
        fill="#000000"
      />
    )
    currentX += barWidth
  }

  const totalWidth = currentX + quietZonePx

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
