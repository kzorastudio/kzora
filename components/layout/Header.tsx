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
      <div className="fixed top-0 left-0 w-full z-50 flex flex-col">
        {/* Top Bar - Loyalty Program */}
        <div className="w-full bg-[#1A1A1A] py-2 md:py-1.5 px-6 overflow-hidden border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <p className="text-[10px] md:text-xs font-arabic font-bold text-[#FFDEA6] flex items-center justify-center text-center gap-2 md:gap-3 whitespace-normal md:whitespace-nowrap animate-pulse leading-tight md:leading-relaxed">
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#FFDEA6] shrink-0" />
              ✨ برنامج الولاء: أكمل 3 طلبيات واحصل على عرض خاص وهدية في طلبيتك القادمة!
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#FFDEA6] shrink-0 hidden sm:inline" />
            </p>
          </div>
        </div>

        {/* Main Header */}
        <header
          dir="rtl"
          className={cn(
            'w-full transition-all duration-300',
            scrolled
              ? 'bg-[#FAF8F5]/90 backdrop-blur-xl shadow-[0_4px_40px_rgba(27,28,26,0.10)] py-2'
              : 'bg-[#FAF8F5]/70 backdrop-blur-lg shadow-[0_4px_40px_rgba(27,28,26,0.04)] py-4'
          )}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8">
            {/* Right Section: Mobile Menu + Logo */}
            <div className="flex items-center sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="md:hidden flex items-center justify-center p-2 mr-[-10px] ml-1 rounded-xl text-[#1A1A1A] hover:bg-[#F0EBE3] transition-all duration-150"
              >
                <AlignRight size={28} strokeWidth={2} />
              </button>

              <Link href="/" className="shrink-0">
                <Image
                  src="/logo.png"
                  alt="كزورا Kzora"
                  width={140}
                  height={84}
                  className="h-12 md:h-16 w-auto object-contain scale-[1.7] origin-right"
                  priority
                />
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-10">
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

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Currency switcher */}
              <div className="hidden md:flex items-center bg-black/5 backdrop-blur-sm rounded-full p-[1.5px] border border-[#E8E3DB]/40 ml-2 transition-all">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300',
                    currency === 'USD' ? 'bg-white text-[#785600] shadow-sm' : 'text-[#9E9890]'
                  )}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('SYP')}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold font-arabic transition-all duration-300',
                    currency === 'SYP' ? 'bg-white text-[#785600] shadow-sm' : 'text-[#9E9890]'
                  )}
                >
                  ل.س
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCurrency(currency === 'USD' ? 'SYP' : 'USD')}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-surface-container/50 border border-outline-variant/30 text-[10px] font-bold font-arabic text-on-surface ml-1"
              >
                {currency === 'USD' ? '$' : 'ل.س'}
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-xl text-[#6B6560] hover:bg-[#F0EBE3]"
              >
                <Search size={20} />
              </button>
              
              <Link
                href="/track-order"
                className={cn(
                  "hidden md:flex p-2.5 rounded-xl",
                  isActive('/track-order') ? "text-[#B8860B] bg-[#F0EBE3]" : "text-[#6B6560] hover:bg-[#F0EBE3]"
                )}
              >
                <Truck size={20} />
              </Link>

              <Link
                href="/checkout"
                className="hidden md:flex relative p-2.5 rounded-xl hover:bg-[#F0EBE3]"
              >
                <ShoppingBag size={20} className={itemCount > 0 ? 'text-[#B8860B]' : 'text-[#6B6560]'} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-[#785600] text-white text-[9px] font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
              
              <button
                type="button"
                onClick={openCart}
                className="md:hidden relative p-2.5 rounded-xl hover:bg-[#F0EBE3]"
              >
                <ShoppingBag size={20} className={itemCount > 0 ? 'text-[#B8860B]' : 'text-[#6B6560]'} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-[#785600] text-white text-[9px] font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Spacer to prevent content jump */}
      <div className="h-[96px] md:h-[120px]" />

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
