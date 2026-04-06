'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'
import { X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

const NAV_LINKS = [
  { label: 'الرئيسية',     href: '/' },
  { label: 'جميع المنتجات', href: '/products' },
  { label: 'الأقسام',    href: '/categories' },
  { label: 'تتبع الطلب',  href: '/track-order' },
  { label: 'من نحن',     href: '/about' },
]

const FIXED_CATEGORY_LINKS = [
  { label: 'عروض حصرية', href: '/products?tag=on_sale', highlight: true },
]

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        if (data) setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" dir="rtl">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="absolute top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white flex flex-col overflow-y-auto"
            role="navigation"
            aria-label="القائمة الجانبية"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0EBE3]">
              <Link href="/" onClick={onClose}>
                <Image
                  src="/logo.png"
                  alt="كزورا Kzora"
                  width={120}
                  height={72}
                  className="h-28 w-auto object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className="w-9 h-9 rounded-full bg-[#F5F1EB] flex items-center justify-center text-[#6B6560] hover:bg-[#EDE8E0] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main nav */}
            <nav className="px-4 pt-6 pb-4">
              {NAV_LINKS.map((link, i) => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(link.href)
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center justify-between px-3 py-3.5 rounded-xl',
                        'text-base font-arabic font-semibold',
                        'transition-colors duration-150',
                        isActive
                          ? 'text-[#785600] bg-[#FDF8F0]'
                          : 'text-[#1A1A1A] hover:bg-[#F5F1EB]'
                      )}
                    >
                      {link.label}
                      <ChevronLeft size={16} className="text-[#C0B8B0]" />
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Divider + Categories */}
            <div className="px-6 pb-2">
              <p className="text-xs font-arabic font-medium text-[#9E9890] tracking-widest uppercase">
                الأقسام
              </p>
            </div>
            <nav className="px-4 pb-4">
              {loading ? (
                 <div className="px-4 py-4 space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-10 bg-[#F5F1EB] rounded-xl animate-pulse" />
                    ))}
                 </div>
              ) : (
                <>
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={onClose}
                        className={cn(
                          'flex items-center justify-between px-3 py-3 rounded-xl',
                          'text-sm font-arabic',
                          'transition-colors duration-150',
                          'text-[#3D3B38] hover:bg-[#F5F1EB]'
                        )}
                      >
                        {cat.name_ar}
                        <ChevronLeft size={14} className="text-[#D0CAC0]" />
                      </Link>
                    </motion.div>
                  ))}
                  
                  {FIXED_CATEGORY_LINKS.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + (categories.length + i) * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center justify-between px-3 py-3 rounded-xl',
                          'text-sm font-arabic',
                          'transition-colors duration-150',
                          link.highlight
                            ? 'text-[#BA1A1A] font-semibold hover:bg-[#FFF0F0]'
                            : 'text-[#3D3B38] hover:bg-[#F5F1EB]'
                        )}
                      >
                        {link.label}
                        <ChevronLeft size={14} className="text-[#D0CAC0]" />
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom */}
            <div className="border-t border-[#F0EBE3] px-6 py-5 space-y-4">
              <CurrencyToggle />
              <p className="text-xs font-arabic text-[#B0A89E] text-center leading-5">
                شحن مجاني للطلبات فوق ٥٠٠٬٠٠٠ ل.س
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
