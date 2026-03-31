'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ProductColor } from '@/types'

interface ColorSelectorProps {
  colors: ProductColor[]
  selectedColor: string | null
  onChange: (colorId: string, color: ProductColor) => void
  className?: string
}

export function ColorSelector({
  colors,
  selectedColor,
  onChange,
  className,
}: ColorSelectorProps) {
  const [tooltip, setTooltip] = useState<string | null>(null)

  if (!colors || colors.length === 0) return null

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} dir="rtl">
      {colors.map((color) => {
        const isSelected = selectedColor === color.id

        return (
          <div key={color.id} className="relative">
            <button
              type="button"
              aria-label={color.name_ar}
              disabled={!color.is_available}
              onClick={() => onChange(color.id, color)}
              onMouseEnter={() => setTooltip(color.id)}
              onMouseLeave={() => setTooltip(null)}
              className={cn(
                'w-7 h-7 rounded-full transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 scale-110'
                  : 'hover:scale-105 ring-1 ring-black/25',
                !color.is_available && 'opacity-25 cursor-not-allowed scale-90 grayscale ring-0'
              )}
              style={{ backgroundColor: color.hex_code }}
            />
            
            {!color.is_available && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[1px] h-full bg-white/60 rotate-45" />
              </div>
            )}

            {/* Tooltip */}
            {tooltip === color.id && (
              <div
                className={cn(
                  'absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2',
                  'bg-inverse-surface text-inverse-on-surface',
                  'text-xs font-brand rounded-md px-2 py-1 whitespace-nowrap',
                  'pointer-events-none z-10',
                  'animate-fade-in'
                )}
              >
                {color.name_ar}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-inverse-surface" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
