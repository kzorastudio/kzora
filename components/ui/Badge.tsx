import { cn } from '@/lib/utils'

type BadgeVariant = 'new' | 'best_seller' | 'on_sale' | 'exclusive'

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

const variantConfig: Record<
  BadgeVariant,
  { label: string; className: string }
> = {
  new: {
    label: 'جديد',
    className: 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white',
  },
  best_seller: {
    label: 'الأكثر مبيعاً',
    className: 'bg-amber-500 text-white',
  },
  on_sale: {
    label: 'تخفيض',
    className: 'bg-error text-on-error',
  },
  exclusive: {
    label: 'حصري',
    className: 'bg-inverse-surface text-inverse-on-surface',
  },
}

function Badge({ variant, className }: BadgeProps) {
  const { label, className: variantClass } = variantConfig[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-2.5 py-0.5 rounded-full',
        'text-xs font-semibold font-arabic',
        'whitespace-nowrap select-none',
        'leading-none tracking-wide',
        variantClass,
        className
      )}
    >
      {label}
    </span>
  )
}

export { Badge }
export type { BadgeVariant, BadgeProps }
