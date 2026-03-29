'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-l from-[#785600] to-[#986D00]',
    'text-white font-semibold',
    'hover:from-[#986D00] hover:to-[#B8860B]',
    'active:scale-[0.98]',
    'shadow-sm hover:shadow-md',
    'transition-all duration-200',
    'disabled:from-[#C4B49A] disabled:to-[#C4B49A] disabled:cursor-not-allowed disabled:shadow-none',
  ].join(' '),

  secondary: [
    'bg-surface-container-high text-on-surface',
    'hover:bg-surface-container-highest',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  outline: [
    'bg-transparent text-primary',
    'ring-1 ring-inset ring-outline-variant',
    'hover:bg-surface-container-low hover:ring-outline',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-on-surface',
    'hover:bg-surface-container-low',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  danger: [
    'bg-error text-on-error font-semibold',
    'hover:bg-[#9E1515]',
    'active:scale-[0.98]',
    'shadow-sm hover:shadow-md',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-2xl gap-2.5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-brand select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, ButtonVariant, ButtonSize }
