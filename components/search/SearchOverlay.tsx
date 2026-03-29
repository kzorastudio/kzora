'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCard } from '@/components/product/ProductCard'
import { cn } from '@/lib/utils'
import type { ProductFull } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductFull[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Autofocus when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setResults([])
      setSearched(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)

    fetch(`/api/products?search=${encodeURIComponent(debouncedQuery.trim())}&limit=12`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json()
      })
      .then((data) => {
        setResults(data.products ?? [])
        setSearched(true)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setResults([])
          setSearched(true)
          setLoading(false)
        }
      })
  }, [debouncedQuery])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const isEmpty = searched && !loading && results.length === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col"
          dir="rtl"
          role="dialog"
          aria-label="بحث"
          aria-modal="true"
        >
          {/* Header bar */}
          <div className="flex items-center gap-3 px-4 md:px-8 pt-4 pb-2 border-b-2 border-[#B8860B]">
            <Search className="text-[#B8860B] shrink-0" size={22} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن حذاء..."
              className={cn(
                'flex-1 bg-transparent text-xl md:text-2xl font-arabic text-[#1A1A1A]',
                'placeholder:text-[#6B6560]/50 focus:outline-none'
              )}
              aria-label="بحث عن منتج"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setSearched(false)
                  inputRef.current?.focus()
                }}
                className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors p-1"
                aria-label="مسح البحث"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'p-2 rounded-lg text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#EDE5D8]',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B]'
              )}
              aria-label="إغلاق البحث"
            >
              <X size={22} />
            </button>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 animate-pulse">
                    <div className="w-full aspect-[4/5] rounded-lg bg-[#EDE5D8]" />
                    <div className="h-4 w-3/4 rounded-full bg-[#EDE5D8]" />
                    <div className="h-3 w-1/2 rounded-full bg-[#EDE5D8]" />
                  </div>
                ))}
              </div>
            )}

            {/* Results grid */}
            {!loading && results.length > 0 && (
              <>
                <p className="text-sm font-arabic text-[#6B6560] mb-4">
                  {results.length} نتيجة لـ "
                  <span className="text-[#1A1A1A] font-medium">{debouncedQuery}</span>"
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {results.map((product) => (
                    <div key={product.id} onClick={handleClose}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                <Search size={48} className="text-[#D3C4AF]" />
                <p className="text-xl font-arabic font-semibold text-[#1A1A1A]">
                  لا توجد نتائج
                </p>
                <p className="font-arabic text-[#6B6560]">
                  لم نعثر على منتجات تطابق "
                  <span className="text-[#1A1A1A]">{debouncedQuery}</span>"
                </p>
              </div>
            )}

            {/* Initial prompt */}
            {!query && !searched && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-2">
                <Search size={48} className="text-[#D3C4AF]" />
                <p className="font-arabic text-[#6B6560]">
                  ابدأ الكتابة للبحث في مجموعتنا
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
