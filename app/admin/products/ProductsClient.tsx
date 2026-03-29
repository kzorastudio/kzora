'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import type { Category } from '@/types'

interface ProductsClientProps {
  categories: Category[]
  search: string
  category: string
  status: string
  stock: string
  sort: string
}

export default function ProductsClient({ 
  categories, 
  search, 
  category,
  status,
  stock,
  sort
}: ProductsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(search)

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams()
    
    // Existing values
    if (localSearch) params.set('search', localSearch)
    if (category)    params.set('category', category)
    if (status)      params.set('status', status)
    if (stock)       params.set('stock', stock)
    if (sort)        params.set('sort', sort)

    // Applied updates
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })

    // Reset page on filter change
    params.delete('page')

    const qs = params.toString()
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ''}`)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateFilters({ search: localSearch })
  }

  const FIELD_CLASS =
    'rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm font-arabic text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition h-[40px]'

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-2 sm:gap-3"
      >
        {/* Search */}
        <div className="relative flex items-center flex-1 min-w-[240px]">
          <Search size={15} className="absolute right-3 text-secondary pointer-events-none" />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="البحث باسم المنتج..."
            className={`${FIELD_CLASS} pr-9 w-full`}
          />
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className={`${FIELD_CLASS} w-full lg:w-auto sm:min-w-[140px]`}
        >
          <option value="">كل الأقسام</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_ar}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className={`${FIELD_CLASS} w-full lg:w-auto sm:min-w-[120px]`}
        >
          <option value="">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>

        {/* Stock Filter */}
        <select
          value={stock}
          onChange={(e) => updateFilters({ stock: e.target.value })}
          className={`${FIELD_CLASS} w-full lg:w-auto sm:min-w-[120px]`}
        >
          <option value="">كل المخزون</option>
          <option value="in_stock">متوفر</option>
          <option value="low_stock">محدود</option>
          <option value="out_of_stock">نفذ</option>
        </select>

        {/* Sort Filter */}
        <select
          value={sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className={`${FIELD_CLASS} w-full lg:w-auto sm:min-w-[140px] bg-primary/5 border-primary/20 font-bold`}
        >
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
          <option value="price_asc">السعر (الأقل)</option>
          <option value="price_desc">السعر (الأعلى)</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-arabic font-bold hover:bg-primary/90 transition-all disabled:opacity-60 h-[40px] shadow-sm"
        >
          بحث
        </button>

        {(search || category || status || stock || (sort && sort !== 'newest')) && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('')
              startTransition(() => {
                router.push(pathname)
              })
            }}
            className="px-4 py-2 rounded-xl text-sm font-arabic font-bold text-error hover:bg-error/10 transition-colors h-[40px]"
          >
            مسح الفلاتر
          </button>
        )}
      </form>
    </div>
  )
}
