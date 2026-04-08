'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useCurrencyStore } from '@/store/currencyStore'
import type { ProductFull } from '@/types'

// ─── MultiSelectDropdown (same as products page) ────────────────────────────
function MultiSelectDropdown({
  options, selectedValues, onChange, placeholder
}: {
  options: { label: string; value: string }[]
  selectedValues: string[]
  onChange: (val: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-10 px-3 bg-[#F5F1EB] rounded-xl text-sm font-arabic border border-transparent focus:outline-none focus:ring-1 focus:ring-[#785600] transition-colors"
      >
        <span className="truncate text-[#1A1A1A]">
          {selectedValues.length === 0 ? placeholder : `${placeholder} (${selectedValues.length})`}
        </span>
        <ChevronDown size={16} className={cn("transition-transform text-[#6B6560]", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto bg-white shadow-xl border border-[#F0EBE3] rounded-xl z-50 p-2 space-y-1",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-[#E8E3DB] [&::-webkit-scrollbar-thumb]:rounded-full"
          )}>
            {options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 p-2 hover:bg-[#F5F1EB] rounded-lg cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={() => onChange(opt.value)}
                  className="w-4 h-4 rounded border-[#D3C4AF] text-[#785600] focus:ring-[#785600] accent-[#785600]"
                />
                <span className="text-sm font-arabic text-on-surface group-hover:text-[#785600]">{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Constants ──────────────────────────────────────────────────────────────
const TAG_OPTIONS = [
  { value: 'new',         label: 'وصل حديثاً' },
  { value: 'best_seller', label: 'الأكثر مبيعاً' },
  { value: 'on_sale',     label: 'عروض' },
]

const SORT_OPTIONS = [
  { value: 'newest',     label: 'الأحدث' },
  { value: 'price_asc',  label: 'السعر: الأقل' },
  { value: 'price_desc', label: 'السعر: الأعلى' },
  { value: 'most_viewed', label: 'الأكثر مشاهدة' },
  { value: 'name_asc',   label: 'الاسم: أ-ي' },
]

interface Props {
  products: ProductFull[]
}

export default function CategoryProductsClient({ products }: Props) {
  const { currency } = useCurrencyStore()

  // Filter state
  const [sort, setSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onSale, setOnSale] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sizes that are actually in products AND marked as available in admin panel AND have stock > 0
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<number>()
    products.forEach(p => {
      p.sizes.forEach((s: any) => {
        if (s.is_available) {
          const matchingVariants = p.variants?.filter(v => v.size === s.size) || []
          if (matchingVariants.length === 0) {
            sizeSet.add(s.size) // No variants, treat as available
          } else if (matchingVariants.some(v => v.quantity > 0)) {
            sizeSet.add(s.size) // Has variant with stock
          }
        }
      })
    })
    return Array.from(sizeSet).sort((a, b) => a - b)
  }, [products])

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val])
  }

  const hasActiveFilters = selectedTags.length > 0 || search || selectedSizes.length > 0 ||
    minPrice || maxPrice || onSale || sort !== 'newest'

  function clearAllFilters() {
    setSort('newest')
    setSearch('')
    setSearchInput('')
    setSelectedTags([])
    setSelectedSizes([])
    setMinPrice('')
    setMaxPrice('')
    setOnSale(false)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  // Filtered + sorted products + unavailability map for size filters
  const { filtered, filterUnavailableMap } = useMemo(() => {
    let result = [...products]

    if (search) result = result.filter(p => p.name.includes(search))
    if (selectedTags.length > 0) result = result.filter(p => p.tags.some(t => selectedTags.includes(t)))

    // Size filter: include products that have the size listed, but mark as unavailable
    // if no variant has stock for that size
    const unavailableMap: Record<string, string> = {}
    if (selectedSizes.length > 0) {
      result = result.filter(p => {
        // Check if product has any of the selected sizes listed
        const hasSize = p.sizes.some((s: any) => selectedSizes.includes(String(s?.size ?? s)))
        if (!hasSize) return false // Product doesn't have this size at all — hide it

        // Check if ANY of the selected sizes is actually purchasable
        const canAddToCart = p.sizes.some((s: any) => {
          if (!selectedSizes.includes(String(s?.size ?? s)) || !s.is_available) return false
          const matchingVariants = p.variants?.filter(v => v.size === s.size) || []
          return matchingVariants.length === 0 || matchingVariants.some(v => v.quantity > 0)
        })

        if (!canAddToCart) {
          // Product has the size but it can't be added to cart — mark as unavailable
          unavailableMap[p.id] = 'غير متوفر بهذا المقاس'
        }

        return true // Show the product regardless (available or unavailable)
      })
    }

    if (onSale) result = result.filter(p => p.discount_price_syp !== null)
    if (minPrice) {
      const min = Number(minPrice)
      result = result.filter(p => currency === 'SYP' ? p.price_syp >= min : p.price_usd >= min)
    }
    if (maxPrice) {
      const max = Number(maxPrice)
      result = result.filter(p => currency === 'SYP' ? p.price_syp <= max : p.price_usd <= max)
    }

    // Sort: available products first, then unavailable
    // Then apply the selected sort order
    result.sort((a, b) => {
      const aUnavail = unavailableMap[a.id] ? 1 : 0
      const bUnavail = unavailableMap[b.id] ? 1 : 0
      if (aUnavail !== bUnavail) return aUnavail - bUnavail
      return 0
    })

    switch (sort) {
      case 'price_asc':   result.sort((a, b) => { const u = (unavailableMap[a.id] ? 1 : 0) - (unavailableMap[b.id] ? 1 : 0); return u || a.price_syp - b.price_syp }); break
      case 'price_desc':  result.sort((a, b) => { const u = (unavailableMap[a.id] ? 1 : 0) - (unavailableMap[b.id] ? 1 : 0); return u || b.price_syp - a.price_syp }); break
      case 'most_viewed': result.sort((a, b) => { const u = (unavailableMap[a.id] ? 1 : 0) - (unavailableMap[b.id] ? 1 : 0); return u || b.view_count - a.view_count }); break
      case 'name_asc':    result.sort((a, b) => { const u = (unavailableMap[a.id] ? 1 : 0) - (unavailableMap[b.id] ? 1 : 0); return u || a.name.localeCompare(b.name, 'ar') }); break
    }

    return { filtered: result, filterUnavailableMap: unavailableMap }
  }, [products, sort, search, selectedTags, selectedSizes, onSale, minPrice, maxPrice, currency])

  // ─── Filter Sidebar Content ────────────────────────────────────────────
  const FilterSidebar = (
    <div dir="rtl" className="space-y-5">
      {/* Clear all */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="flex items-center gap-1.5 text-xs font-arabic text-[#BA1A1A] hover:text-[#9E1515] transition-colors"
        >
          <X size={14} />
          مسح كل الفلاتر
        </button>
      )}

      {/* Tag */}
      <div>
        <h3 className="font-brand font-semibold text-on-surface text-sm mb-2">نوع المنتج</h3>
        <MultiSelectDropdown
          options={TAG_OPTIONS}
          selectedValues={selectedTags}
          onChange={(val) => toggleSelection(setSelectedTags, val)}
          placeholder="اختر النوع..."
        />
      </div>

      {/* Size */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="font-brand font-semibold text-on-surface text-sm mb-2">المقاس</h3>
          <MultiSelectDropdown
            options={availableSizes.map(s => ({ label: String(s), value: String(s) }))}
            selectedValues={selectedSizes}
            onChange={(val) => toggleSelection(setSelectedSizes, val)}
            placeholder="المقاس..."
          />
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="font-brand font-semibold text-on-surface text-sm mb-2">
          نطاق السعر ({currency === 'SYP' ? 'ل.س' : 'دولار'})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="من"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full h-8 px-2 bg-[#F5F1EB] rounded-lg text-sm text-on-surface placeholder:text-[#9E9890] focus:outline-none focus:ring-1 focus:ring-[#785600]"
            dir="ltr"
          />
          <span className="text-[#9E9890] text-sm shrink-0">—</span>
          <input
            type="number"
            placeholder="إلى"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full h-8 px-2 bg-[#F5F1EB] rounded-lg text-sm text-on-surface placeholder:text-[#9E9890] focus:outline-none focus:ring-1 focus:ring-[#785600]"
            dir="ltr"
          />
        </div>
      </div>

      {/* On sale toggle */}
      <div className="flex items-center justify-between bg-[#F5F1EB] rounded-xl px-3 py-2.5">
        <span className="text-sm font-arabic font-medium text-[#1A1A1A]">عروض فقط</span>
        <div
          role="switch"
          aria-checked={onSale}
          onClick={() => setOnSale(v => !v)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0',
            onSale ? 'bg-gradient-to-l from-[#785600] to-[#986D00]' : 'bg-[#D6CFC4]'
          )}
        >
          <span
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200',
              onSale ? 'right-1' : 'right-[1.375rem]'
            )}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[18rem] shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl p-5 shadow-sm border border-[#F0EBE3]">
            <h2 className="font-brand font-bold text-[#1A1A1A] mb-4">تصفية النتائج</h2>
            {FilterSidebar}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white p-2 rounded-2xl shadow-sm border border-[#F0EBE3]">
            {/* Mobile filter + Search */}
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={cn(
                  'lg:hidden flex shrink-0 items-center justify-center gap-2 h-11 px-4 rounded-xl',
                  'bg-[#F5F1EB] text-[#1A1A1A] font-arabic text-sm',
                  'hover:bg-[#EDE8E1] transition-colors duration-150',
                  hasActiveFilters && 'text-[#785600] font-bold ring-1 ring-[#785600]'
                )}
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">فلترة</span>
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#785600]" />}
              </button>

              <form onSubmit={handleSearchSubmit} className="flex-1 w-full max-w-md">
                <div className="relative w-full">
                  <button type="submit" className="absolute top-1/2 right-3 -translate-y-1/2 text-[#9E9890] hover:text-[#785600] transition-colors">
                    <Search size={18} />
                  </button>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="ابحث في هذا القسم..."
                    dir="rtl"
                    className="w-full h-11 pr-10 pl-4 rounded-xl bg-transparent border-none font-arabic text-sm text-[#1A1A1A] placeholder:text-[#9E9890] focus:outline-none focus:ring-1 focus:ring-[#785600]/30 focus:bg-[#FAF8F5] transition-all"
                  />
                </div>
              </form>
            </div>

            {/* Sort + Count */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-arabic text-[#9E9890] shrink-0 hidden sm:block">
                {filtered.length} منتج
              </span>
              <div className="relative shrink-0 w-full sm:w-48">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none w-full h-11 pl-8 pr-4 rounded-xl bg-[#F5F1EB] text-[#1A1A1A] font-arabic text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#785600] cursor-pointer hover:bg-[#EDE8E1] transition-colors"
                  dir="rtl"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6560]" />
              </div>
            </div>
          </div>

          {/* Product grid */}
          <ProductGrid
            products={filtered}
            isLoading={false}
            columns={3}
            filterUnavailableMap={filterUnavailableMap}
          />

          {/* No results */}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="font-arabic text-[#9E9890] text-lg mb-2">لا توجد منتجات تطابق البحث</p>
              <button
                onClick={clearAllFilters}
                className="font-arabic text-sm text-[#785600] hover:underline"
              >
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile Sidebar Drawer ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#F0EBE3]" dir="rtl">
              <h2 className="font-brand font-bold text-[#1A1A1A]">تصفية النتائج</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[#F5F1EB] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {FilterSidebar}
            </div>
            <div className="sticky bottom-0 p-4 bg-white border-t border-[#F0EBE3]">
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full h-11 rounded-xl bg-[#1A1A1A] text-white font-arabic font-bold text-sm hover:bg-[#333] transition-colors"
              >
                عرض {filtered.length} منتج
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
