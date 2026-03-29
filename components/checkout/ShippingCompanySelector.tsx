'use client'

import { cn } from '@/lib/utils'

interface ShippingCompanySelectorProps {
  companies: any[]
  selected: string | ''
  onChange: (id: string) => void
  error?: string
  className?: string
}

export function ShippingCompanySelector({
  companies,
  selected,
  onChange,
  error,
  className,
}: ShippingCompanySelectorProps) {
  return (
    <div dir="rtl" className={cn('space-y-2', className)}>
      <label className="block text-sm font-arabic font-medium text-[#1A1A1A]">
        شركة الشحن
        <span className="text-[#BA1A1A] mr-0.5">*</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {companies.map((company) => {
          const isSelected = selected === company.slug

          return (
            <button
              key={company.id || company.slug}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(company.slug)}
              className={cn(
                'relative text-right p-4 rounded-xl transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-1',
                isSelected
                  ? 'border-2 border-[#785600] bg-[#FBF7F0]'
                  : 'bg-[#F2EDE6] hover:bg-[#EDE8DF] border-2 border-transparent'
              )}
            >
              {/* Badge */}
              {company.badge && (
                <span className="absolute top-2 left-2 text-[10px] font-arabic font-bold px-1.5 py-0.5 rounded-full bg-[#785600] text-white">
                  {company.badge}
                </span>
              )}

              {/* Radio indicator */}
              <div
                className={cn(
                  'absolute top-3 left-3 w-4 h-4 rounded-full border-2 transition-all',
                  company.badge ? 'top-7' : '',
                  isSelected
                    ? 'border-[#785600] bg-[#785600]'
                    : 'border-[#D3C4AF] bg-transparent'
                )}
              >
                {isSelected && (
                  <div className="absolute inset-[3px] rounded-full bg-white" />
                )}
              </div>

              {/* Company name */}
              <p
                className={cn(
                  'font-arabic font-semibold text-sm leading-snug',
                  isSelected ? 'text-[#785600]' : 'text-[#1A1A1A]'
                )}
              >
                {company.name}
              </p>
              {company.description && (
                <p className="font-arabic text-xs text-[#6B6560] mt-1 leading-relaxed">
                  {company.description}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs font-arabic text-[#BA1A1A] flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  )
}
