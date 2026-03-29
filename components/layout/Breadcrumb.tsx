'use client'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface BreadcrumbItem { label: string; href?: string }
interface Props { items: BreadcrumbItem[] }

export default function Breadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-[#6B6560] font-arabic mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronLeft className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-[#B8860B] transition-colors">{item.label}</Link>
          ) : (
            <span className="text-[#1A1A1A] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
