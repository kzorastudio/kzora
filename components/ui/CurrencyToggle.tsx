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
        'bg-black/5 backdrop-blur-sm rounded-full p-[1.5px] border border-[#E8E3DB]/40',
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
              'px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-300',
              isActive
                ? 'bg-white text-[#785600] shadow-sm cursor-default scale-100'
                : 'text-[#9E9890] hover:text-[#1A1A1A] scale-95 opacity-80'
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
