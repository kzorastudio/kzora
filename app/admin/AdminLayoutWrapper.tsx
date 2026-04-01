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
    <div className="flex min-h-screen bg-surface" dir="rtl" lang="ar">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:mr-[230px] bg-surface min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-outline-variant/20 shadow-sm">
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
