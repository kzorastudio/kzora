'use client'

import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, LogOut, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin':            'الرئيسية',
  '/admin/products':   'المنتجات',
  '/admin/products/new': 'منتج جديد',
  '/admin/categories': 'الأقسام',
  '/admin/orders':     'الطلبات',
  '/admin/coupons':    'الكوبونات',
  '/admin/homepage':   'الصفحة الرئيسية',
  '/admin/pages':      'الصفحات',
  '/admin/shipping':   'شركات الشحن',
  '/admin/navigation': 'إدارة التنقل',
  '/admin/users':      'المدراء والموظفين',
}

const DYNAMIC_LABELS: Record<string, string> = {
  'edit': 'تعديل',
  'new': 'جديد',
}

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: 'الرئيسية', href: '/admin' },
  ]

  if (pathname === '/admin') return crumbs

  const segments = pathname.split('/').filter(Boolean)
  let accumulated = ''
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accumulated += '/' + seg
    if (accumulated === '/admin') continue

    let label = BREADCRUMB_MAP[accumulated] ?? DYNAMIC_LABELS[seg]
    
    // If no label and i > 0, check if we are in products or orders to give a context label instead of UUID
    if (!label && i > 0) {
      if (segments[i-1] === 'products') label = 'المنتجات'
      else if (segments[i-1] === 'orders') label = 'تفاصيل الطلب'
      else label = seg
    } else if (!label) {
      label = seg
    }

    crumbs.push({ label: label!, href: accumulated })
  }
  return crumbs
}

interface AdminHeaderProps {
  className?: string
}

export default function AdminHeader({ className }: AdminHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const breadcrumbs = buildBreadcrumbs(pathname)
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'الإدارة'

  async function handleLogout() {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <header
      dir="rtl"
      className={cn(
        'hidden lg:flex sticky top-0 z-30 h-18 py-4 bg-white/80 backdrop-blur-md border-b border-outline-variant/20 items-center justify-between px-4 md:px-8 gap-2 md:gap-4',
        className
      )}
    >
      {/* Right side: breadcrumb + page title */}
      <div className="flex flex-col justify-center min-w-0">
        {/* Breadcrumb — hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-2 text-[10px] uppercase font-bold text-[#9E9890] font-arabic mb-1 tracking-widest">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {i > 0 && (
                <div className="w-1 h-1 rounded-full bg-outline-variant" />
              )}
              <Link
                href={crumb.href}
                className={cn(
                  'transition-colors duration-200',
                  i === breadcrumbs.length - 1
                    ? 'text-primary'
                    : 'hover:text-on-surface cursor-pointer'
                )}
              >
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>
        <h1 className="text-base md:text-xl font-arabic font-black text-[#1A1A1A] leading-none tracking-tight truncate max-w-[150px] sm:max-w-none">
          {pageTitle}
        </h1>
      </div>

      {/* Left side: search + user */}
      <div className="flex items-center gap-6 shrink-0">


        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-3 pr-3 md:pr-4 border-r border-outline-variant/30">
            <div className="flex flex-col items-start text-start">
              <span className="text-sm font-arabic font-black text-[#1A1A1A] leading-none mb-0.5">
                {session.user.name ?? 'المدير'}
              </span>
              <span className="text-[10px] font-arabic text-secondary font-bold tracking-tight opacity-60">
                مسؤول المتجر
              </span>
            </div>
          </div>
        )}

        {/* Logout icon */}
        <button
          onClick={handleLogout}
          title="تسجيل الخروج"
          className="h-10 w-10 flex items-center justify-center rounded-2xl text-secondary hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </header>

  )
}
