'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  Tag,
  Image,
  FileText,
  LogOut,
  Menu,
  Truck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin',            label: 'الرئيسية',         icon: LayoutDashboard, exact: true  },
  { href: '/admin/products',   label: 'المنتجات',         icon: Package,          exact: false },
  { href: '/admin/categories', label: 'الأقسام',          icon: FolderOpen,       exact: false },
  { href: '/admin/navigation', label: 'إدارة التنقل',     icon: Menu,             exact: false },
  { href: '/admin/orders',     label: 'الطلبات',          icon: ShoppingBag,      exact: false },
  { href: '/admin/coupons',    label: 'الكوبونات',        icon: Tag,              exact: false },
  { href: '/admin/homepage',   label: 'محتوى المتجر',     icon: Image,            exact: false },
  { href: '/admin/shipping',   label: 'شركات الشحن',      icon: Truck,            exact: false },
  { href: '/admin/pages',      label: 'الصفحات',          icon: FileText,         exact: false },
]

interface AdminSidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on client
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auto-close on route change
  useEffect(() => {
    onClose?.()
  }, [pathname])

  function isActive(href: string, exact: boolean): boolean {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/') || (pathname.startsWith(href) && pathname.length > href.length && pathname[href.length] === '/')
  }

  async function handleLogout() {
    await signOut({ callbackUrl: '/admin/login' })
  }

  // On mobile: only show when explicitly opened
  // On desktop: always show
  const visible = isMobile ? open : true

  if (!visible) return null

  return (
    <>
      {/* Overlay — mobile only */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-[60]"
          onClick={onClose}
        />
      )}

      <aside
        dir="rtl"
        className="fixed top-0 right-0 h-screen w-[280px] bg-white flex flex-col z-[70] border-l border-outline-variant/30 shadow-ambient"
      >
        {/* Logo + close button */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6 border-b border-outline-variant/20 mb-4 relative">
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-container transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X size={18} />
            </button>
          )}
          <NextImage
            src="/newlogo.png"
            alt="كزورا Kzora"
            width={160}
            height={96}
            className="h-28 w-auto object-contain"
            priority
          />
          <div className="mt-3 flex items-center gap-2">
            <span className="h-px w-4 bg-outline-variant/60" />
            <span className="text-[10px] uppercase font-arabic font-bold text-secondary tracking-[0.2em] opacity-70">
              لوحة الإدارة
            </span>
            <span className="h-px w-4 bg-outline-variant/60" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-arabic font-bold transition-all duration-300 group',
                  active
                    ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-lg shadow-[#785600]/20 translate-x-1'
                    : 'text-secondary hover:bg-[#F5F3F0] hover:text-[#1A1A1A] hover:translate-x-1'
                )}
              >
                <Icon
                  size={20}
                  className={cn('shrink-0 transition-transform duration-300', active ? 'text-white scale-110' : 'text-[#D3C4AF] group-hover:text-primary')}
                />
                <span>{item.label}</span>
                {active && (
                  <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Store Link & Logout */}
        <div className="px-4 pb-6 pt-3 border-t border-outline-variant/40 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-arabic font-bold text-secondary hover:bg-surface-container transition-colors"
          >
            <Menu size={18} className="text-[#D3C4AF]" />
            <span>زيارة المتجر</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-arabic font-bold text-secondary hover:text-error hover:bg-error-container/40 transition-colors duration-150 text-start"
          >
            <LogOut size={18} className="shrink-0 text-error" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  )
}
