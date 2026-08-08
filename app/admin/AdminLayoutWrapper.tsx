'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Menu } from 'lucide-react'

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on every route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/setup'
  if (isLoginPage) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-surface w-full max-w-full overflow-x-hidden print:block print:min-h-0 print:bg-white print:overflow-visible" dir="rtl" lang="ar">
      <div data-admin-chrome className="contents print:hidden">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 lg:mr-[230px] bg-surface min-h-screen w-full max-w-full overflow-x-hidden print:m-0 print:mr-0 print:p-0 print:min-h-0 print:w-auto print:max-w-none print:overflow-visible print:bg-white">
        {/* Mobile top bar — must stay hidden when printing: at label width (100mm ≈ 378px)
            the `lg:hidden` breakpoint would otherwise make it visible and waste a whole label. */}
        <div className="lg:hidden print:!hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-outline-variant/20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface active:scale-95 transition-transform"
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>
          <span className="font-arabic font-black text-sm text-[#1A1A1A]">كزورا — لوحة التحكم</span>
          <div className="w-9" />
        </div>

        {children}
      </main>
    </div>
  )
}
