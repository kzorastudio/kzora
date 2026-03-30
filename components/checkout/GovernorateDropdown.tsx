'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GovernorateDropdownProps {
  governorates: string[]
  shippingCompanySelected: boolean
  value: string
  onChange: (governorate: string) => void
  error?: string
  className?: string
}

export function GovernorateDropdown({
  governorates,
  shippingCompanySelected,
  value,
  onChange,
  error,
  className,
}: GovernorateDropdownProps) {
  const isDisabled = !shippingCompanySelected || governorates.length === 0

  return (
    <div dir="rtl" className={cn('space-y-1.5', className)}>
      <label
        htmlFor="governorate-select"
        className="block text-sm font-arabic font-medium text-[#1A1A1A]"
      >
        المحافظة
        <span className="text-[#BA1A1A] mr-0.5">*</span>
      </label>

      <div className="relative">
        <select
          id="governorate-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className={cn(
            'w-full appearance-none',
            'h-11 pr-3 pl-8 rounded-none',
            'bg-transparent font-arabic text-sm',
            'border-b-2 transition-all duration-150',
            'focus:outline-none',
            error
              ? 'border-[#BA1A1A] text-[#1A1A1A] focus:border-[#BA1A1A]'
              : isDisabled
              ? 'border-[#D3C4AF]/40 text-[#9E9890] cursor-not-allowed'
              : value
              ? 'border-[#785600] text-[#1A1A1A] focus:border-[#785600]'
              : 'border-[#D3C4AF] text-[#6B6560] focus:border-[#785600]',
            'cursor-pointer disabled:cursor-not-allowed'
          )}
        >
          <option value="">اختر المحافظة</option>
          {governorates.map((gov) => (
            <option key={gov} value={gov}>
              {gov}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none',
            isDisabled ? 'text-[#D3C4AF]' : 'text-[#6B6560]'
          )}
        />
      </div>

      {error && (
        <p className="text-xs font-arabic text-[#BA1A1A]">{error}</p>
      )}
    </div>
  )
}
