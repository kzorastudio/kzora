'use client'

import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useCurrencyStore } from '@/store/currencyStore'
import { ShoppingBag, Search, X, Truck, AlignRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MobileMenu } from './MobileMenu'

import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

const FIXED_LINKS_START = [
  { label: 'الرئيسية',  href: '/' },
  { label: 'جميع المنتجات', href: '/products' },
]

const FIXED_LINKS_END = [
  { label: 'من نحن', href: '/about' },
]

// ── Search overlay ──────────────────────────────────────────────────────────
function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [popularCats, setPopularCats] = useState<{ name_ar: string; slug: string }[]>([])

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    
    // Fetch some real categories for suggestions
    async function fetchPopular() {
      const { data } = await supabase
        .from('categories')
        .select('name_ar, slug')
        .eq('is_active', true)
        .limit(6)
      if (data) setPopularCats(data)
    }
    fetchPopular()

    setTimeout(() => inputRef.current?.focus(), 60)
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        router.push(`/products?search=${encodeURIComponent(query.trim())}`)
        onClose()
      }
    },
    [query, router, onClose]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden />
      
      <div className="relative z-10 flex flex-col items-center pt-24 px-4" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="w-full max-w-2xl" dir="rtl">
          <div className="flex items-center gap-4 bg-white rounded-2xl shadow-2xl px-5 py-4 border border-[#E8E3DB]">
            <Search size={22} className="text-[#B8860B] shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="عن ماذا تبحث اليوم؟"
              dir="rtl"
              className="flex-1 bg-transparent outline-none text-lg font-arabic text-[#1A1A1A] placeholder:text-[#C0B8B0]"
            />
            <button 
              type="button" 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5F1EB] text-[#9E9890] hover:text-[#1A1A1A] transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-8 space-y-6" dir="rtl">
            {/* Suggested Categories */}
            <div className="space-y-3">
              <p className="text-xs font-arabic font-bold text-white/60 tracking-widest uppercase px-1">الأقسام الأكثر بحثاً</p>
              <div className="flex flex-wrap gap-2.5">
                {popularCats.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => { router.push(`/category/${cat.slug}`); onClose() }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white text-white hover:text-[#785600] text-sm font-arabic font-semibold rounded-2xl border border-white/20 hover:border-white transition-all duration-300"
                  >
                    {cat.name_ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-3">
              <p className="text-xs font-arabic font-bold text-white/60 tracking-widest uppercase px-1">اقتراحات ذكية</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🔥 العروض الخاصة', href: '/products?tag=on_sale' },
                  { label: '✨ وصلنا حديثاً', href: '/products?tag=new' },
                  { label: '🏆 الأكثر مبيعاً', href: '/products?tag=best_seller' },
                ].map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => { router.push(item.href); onClose() }}
                    className="px-4 py-2 bg-[#B8860B]/20 hover:bg-[#B8860B] text-[#FFD700] hover:text-white text-sm font-arabic font-bold rounded-xl border border-[#B8860B]/30 transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Header ──────────────────────────────────────────────────────────────────
export function Header() {
  const pathname  = usePathname()
  const itemCount = useCartStore((s) => s.itemCount())
  const openCart  = useCartStore((s) => s.openCart)
  const { currency, setCurrency } = useCurrencyStore()

  const [scrolled,    setScrolled]    = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [navCategories, setNavCategories] = useState<Category[]>([])

  useEffect(() => {
    async function fetchNav() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('show_in_header', true)
        .eq('is_active', true)
        .order('header_order', { ascending: true })

      if (data) setNavCategories(data)
    }
    fetchNav()
  }, [])

  const NAV_LINKS = [
    ...FIXED_LINKS_START,
    ...navCategories.map(c => ({ label: c.name_ar, href: `/category/${c.slug}` })),
    ...FIXED_LINKS_END
  ]

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.includes('?')) {
      const [path, qs] = href.split('?')
      return pathname?.startsWith(path) && (typeof window !== 'undefined' ? window.location.search.includes(qs) : false)
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <>
      <header
        dir="rtl"
        className={cn(
          'fixed top-0 w-full z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#FAF8F5]/90 backdrop-blur-xl shadow-[0_4px_40px_rgba(27,28,26,0.10)]'
            : 'bg-[#FAF8F5]/70 backdrop-blur-lg shadow-[0_4px_40px_rgba(27,28,26,0.04)]'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 py-4">

          {/* Right Section: Mobile Menu + Logo (appears on RIGHT in RTL) */}
          <div className="flex items-center sm:gap-2 shrink-0">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="القائمة"
              title="القائمة"
              className="md:hidden flex items-center justify-center p-2 mr-[-10px] ml-1 rounded-xl text-[#1A1A1A] hover:bg-[#F0EBE3] transition-all duration-150"
            >
              <AlignRight size={28} strokeWidth={2} />
            </button>

            <Link href="/" aria-label="كزورا" className="shrink-0">
              <Image
                src="/logo.png"
                alt="كزورا Kzora"
                width={140}
                height={84}
                className="h-16 w-auto object-contain scale-[1.7] origin-right -translate-y-2"
                priority
              />
            </Link>
          </div>

          {/* Desktop nav — CENTER */}
          <nav className="hidden md:flex items-center gap-10" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-arabic font-medium transition-colors duration-200 pb-1',
                    active
                      ? 'text-[#B8860B] border-b-2 border-[#B8860B] font-bold'
                      : 'text-[#6B6560] hover:text-[#1A1A1A]'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions — appears on LEFT in RTL */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">

            {/* Currency switcher — Desktop: Pill, Mobile: Circular Toggle */}
            <div className="hidden md:flex items-center bg-black/5 backdrop-blur-sm rounded-full p-[1.5px] border border-[#E8E3DB]/40 ml-2 transition-all shrink-0">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300',
                  currency === 'USD' 
                    ? 'bg-white text-[#785600] shadow-sm cursor-default' 
                    : 'text-[#9E9890] hover:text-[#1A1A1A]'
                )}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('SYP')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-bold font-arabic transition-all duration-300',
                  currency === 'SYP' 
                    ? 'bg-white text-[#785600] shadow-sm cursor-default' 
                    : 'text-[#9E9890] hover:text-[#1A1A1A]'
                )}
              >
                ل.س
              </button>
            </div>

            {/* Mobile Currency Toggle — Small circle */}
            <button
              type="button"
              onClick={() => setCurrency(currency === 'USD' ? 'SYP' : 'USD')}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-surface-container/50 border border-outline-variant/30 text-[10px] font-bold font-arabic text-on-surface hover:bg-surface-container transition-all active:scale-95 ml-1"
            >
              {currency === 'USD' ? '$' : 'ل.س'}
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
              title="بحث"
              className="p-2.5 rounded-xl text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F0EBE3] transition-all duration-150"
            >
              <Search size={20} />
            </button>
            
            {/* Track Order Icon - Desktop Only */}
            <Link
              href="/track-order"
              aria-label="تتبع الطلب"
              title="تتبع الطلب"
              className={cn(
                "hidden md:flex p-2.5 rounded-xl transition-all duration-150",
                isActive('/track-order') 
                  ? "text-[#B8860B] bg-[#F0EBE3]" 
                  : "text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F0EBE3]"
              )}
            >
              <Truck size={20} />
            </Link>

            {/* Cart — desktop: navigate to checkout, mobile: open drawer */}
            <Link
              href="/checkout"
              aria-label={`سلة التسوق${itemCount > 0 ? ` — ${itemCount} منتج` : ''}`}
              title="سلة التسوق"
              className="hidden md:flex relative p-2.5 rounded-xl hover:bg-[#F0EBE3] transition-all duration-150"
            >
              <ShoppingBag
                size={20}
                className={itemCount > 0 ? 'text-[#B8860B]' : 'text-[#6B6560] hover:text-[#1A1A1A]'}
              />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-[17px] h-[17px] px-0.5 flex items-center justify-center rounded-full bg-[#785600] text-white text-[9px] font-bold leading-none select-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label={`سلة التسوق${itemCount > 0 ? ` — ${itemCount} منتج` : ''}`}
              title="سلة التسوق"
              className="md:hidden relative p-2.5 rounded-xl hover:bg-[#F0EBE3] transition-all duration-150"
            >
              <ShoppingBag
                size={20}
                className={itemCount > 0 ? 'text-[#B8860B]' : 'text-[#6B6560] hover:text-[#1A1A1A]'}
              />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-[17px] h-[17px] px-0.5 flex items-center justify-center rounded-full bg-[#785600] text-white text-[9px] font-bold leading-none select-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
