'use client'

import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, containerClassName, className, id: idProp, ...rest }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId

    return (
      <div className={cn('flex flex-col gap-1 w-full', containerClassName)} dir="rtl">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium font-arabic text-on-surface-variant select-none"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          <input
            ref={ref}
            id={id}
            dir="rtl"
            className={cn(
              // Base layout
              'w-full text-right font-arabic text-on-surface placeholder:text-secondary',
              'bg-surface-container-low',
              'px-3 pt-2.5 pb-2',
              'text-sm leading-snug',
              'rounded-t-sm rounded-b-none',
              // Remove default outline
              'outline-none',
              // Bottom-only border via box-shadow trick
              'shadow-[0_-0px_0_0_transparent,0_2px_0_0_#D3C4AF]',
              // Focus: transition bottom stroke to primary
              'focus:shadow-[0_0px_0_0_transparent,0_2px_0_0_#785600]',
              // Error state
              error && 'shadow-[0_0px_0_0_transparent,0_2px_0_0_#BA1A1A]',
              // Transition
              'transition-shadow duration-200',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            {...rest}
          />
        </div>

        {error && (
          <p className="text-xs text-error font-arabic mt-0.5 text-right" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
