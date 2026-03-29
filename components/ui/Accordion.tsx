'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { HTMLAttributes, ReactNode, useRef, useState } from 'react'

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
  ...rest
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        'w-full',
        'bg-surface-container-low rounded-xl overflow-hidden',
        className
      )}
      dir="rtl"
      {...rest}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-3.5',
          'text-right font-arabic font-medium text-on-surface text-sm',
          'hover:bg-surface-container transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
          'select-none'
        )}
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={cn(
            'text-secondary shrink-0 transition-transform duration-300',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      {/* Animated content panel */}
      <div
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 9999 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div
          ref={contentRef}
          className="px-4 pb-4 pt-1 text-sm font-arabic text-on-surface-variant leading-relaxed"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

interface AccordionProps {
  items: { title: string; content: ReactNode; defaultOpen?: boolean }[]
  className?: string
}

function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} dir="rtl">
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          title={item.title}
          defaultOpen={item.defaultOpen}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  )
}

export { Accordion, AccordionItem }
export type { AccordionProps, AccordionItemProps }
