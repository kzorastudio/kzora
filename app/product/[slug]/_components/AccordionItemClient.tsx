'use client'

import { useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title:        string
  content:      string
  defaultOpen?: boolean
}

export default function AccordionItemClient({ title, content, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef      = useRef<HTMLDivElement>(null)

  return (
    <div className="border-b border-[#E8E3DB]" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-right focus-visible:outline-none select-none"
      >
        <span className="text-sm font-arabic font-bold text-[#1A1A1A]">{title}</span>
        <ChevronDown
          size={18}
          className={cn(
            'text-[#9E9890] shrink-0 transition-transform duration-300',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      <div
        style={{
          maxHeight:  open ? (contentRef.current?.scrollHeight ?? 9999) + 'px' : '0px',
          overflow:   'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div
          ref={contentRef}
          className="pb-5 text-sm font-arabic text-[#6B6560] leading-loose [&_p]:mb-3 [&_p:last-child]:mb-0 [&_br]:block"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
}
