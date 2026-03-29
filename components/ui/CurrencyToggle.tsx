'use client'

import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'
import type { Currency } from '@/types'

interface CurrencyToggleProps {
  className?: string
}

const OPTIONS: Currency[] = ['SYP', 'USD']

function CurrencyToggle({ className }: CurrencyToggleProps) {
  const { currency, setCurrency } = useCurrencyStore()

  return (
    <div
      dir="ltr"
      role="group"
      aria-label="تبديل العملة"
      className={cn(
        'inline-flex items-center',
        'bg-surface-container rounded-full p-0.5',
        'gap-0.5',
        className
      )}
    >
      {OPTIONS.map((option) => {
        const isActive = currency === option
        return (
          <button
            key={option}
            onClick={() => setCurrency(option)}
            aria-pressed={isActive}
            className={cn(
              'relative px-3 py-1 rounded-full text-xs font-label font-semibold',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isActive
                ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-sm'
                : 'text-secondary hover:text-on-surface'
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export { CurrencyToggle }
export type { CurrencyToggleProps }
