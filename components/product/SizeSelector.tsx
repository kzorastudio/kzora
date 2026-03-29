'use client'

import { cn } from '@/lib/utils'

interface SizeSelectorProps {
  sizes: number[]
  selectedSize: number | null
  onChange: (size: number) => void
  outOfStock?: boolean
  className?: string
}

export function SizeSelector({
  sizes,
  selectedSize,
  onChange,
  outOfStock = false,
  className,
}: SizeSelectorProps) {
  if (!sizes || sizes.length === 0) return null

  return (
    <div className={cn('space-y-2', className)} dir="rtl">
      <p className="text-xs font-brand text-secondary">
        المقاس
        {selectedSize != null && (
          <span className="mr-1 font-body font-semibold text-on-surface">{selectedSize}</span>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size

          return (
            <button
              key={size}
              type="button"
              disabled={outOfStock}
              onClick={() => onChange(size)}
              className={cn(
                'min-w-[2.5rem] h-10 px-2 rounded-lg',
                'font-body text-sm tabular-nums',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                isSelected
                  ? [
                      'bg-surface-container-highest text-on-surface font-semibold',
                      'border-b-2 border-primary',
                    ]
                  : [
                      'bg-surface-container-low text-secondary',
                      'hover:bg-surface-container hover:text-on-surface',
                      'border-b-2 border-transparent',
                    ],
                outOfStock && 'opacity-40 cursor-not-allowed line-through'
              )}
            >
              {size}
            </button>
          )
        })}
      </div>
    </div>
  )
}
