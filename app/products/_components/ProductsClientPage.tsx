'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, Search, LayoutGrid } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useCurrencyStore } from '@/store/currencyStore'
import type { Category, ProductFull, ProductTag } from '@/types'
import { SHOE_SIZES } from '@/lib/constants'

const SORT_OPTIONS = [
  { value: 'newest',      label: 'الأحدث'         },
  { value: 'price_asc',   label: 'السعر: الأقل أولاً'  },
  { value: 'price_desc',  label: 'السعر: الأعلى أولاً' },
  { value: 'most_viewed', label: 'الأكثر مشاهدة'   },
]

const TAG_OPTIONS: { value: ProductTag; label: string }[] = [
  { value: 'new',         label: 'وصل حديثاً'    },
  { value: 'best_seller', label: 'الأكثر مبيعاً' },
  { value: 'on_sale',     label: 'عروض حصرية'    },
]

const SPECIAL_TABS = [
  { id: 'sale', label: 'عروض حصرية', onSale: false, tag: 'on_sale',     icon: '🔥', baseClass: 'text-rose-600 hover:bg-rose-50/80',   activeClass: 'bg-gradient-to-l from-rose-500 to-rose-600 text-white shadow-sm ring-1 ring-rose-200' },
  { id: 'new',  label: 'وصل حديثاً', onSale: false, tag: 'new',         icon: '✨', baseClass: 'text-amber-600 hover:bg-amber-50/80', activeClass: 'bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-sm ring-1 ring-amber-200' },
  { id: 'best', label: 'الأكثر مبيعاً', onSale: false, tag: 'best_seller', icon: '🏆', baseClass: 'text-indigo-600 hover:bg-indigo-50/80', activeClass: 'bg-gradient-to-l from-indigo-500 to-indigo-600 text-white shadow-sm ring-1 ring-indigo-200' },
]

const ITEMS_PER_PAGE = 24

interface Props {
  initialCategories: Category[]
  initialParams: {
    category?: string
    tag?:      string
    sort?:     string
    search?:   string
    page?:     string
    size?:     string
    min_price?: string
    max_price?: string
    on_sale?:  string
  }
}

function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder
}: {
  options: { label: string, value: string }[]
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
            "[&::-webkit-scrollbar-thumb]:bg-[#E8E3DB] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#D6CFC4]"
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

export default function ProductsClientPage({ initialCategories, initialParams }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { currency } = useCurrencyStore()

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialParams.category ? initialParams.category.split(',') : [])
  const [selectedTags,      setSelectedTags]      = useState<string[]>(initialParams.tag ? initialParams.tag.split(',') : [])
  const [sort,             setSort]             = useState(initialParams.sort ?? 'newest')
  const [search,           setSearch]           = useState(initialParams.search ?? '')
  const [searchInput,      setSearchInput]      = useState(initialParams.search ?? '')
  const [selectedSizes,     setSelectedSizes]     = useState<string[]>(initialParams.size ? initialParams.size.split(',') : [])
  const [minPrice,         setMinPrice]         = useState(initialParams.min_price ?? '')
  const [maxPrice,         setMaxPrice]         = useState(initialParams.max_price ?? '')
  const [onSale,           setOnSale]           = useState(initialParams.on_sale === 'true')
  const [page,             setPage]             = useState(Number(initialParams.page ?? 1))

  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [products,     setProducts]     = useState<ProductFull[]>([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)

  // Build URL params and push to router
  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (selectedCategories.length) params.set('category', selectedCategories.join(','))
    if (selectedTags.length)      params.set('tag', selectedTags.join(','))
    if (sort !== 'newest') params.set('sort', sort)
    if (search)           params.set('search', search)
    if (selectedSizes.length)     params.set('size', selectedSizes.join(','))
    if (minPrice)         params.set('min_price', minPrice)
    if (maxPrice)         params.set('max_price', maxPrice)
    if (onSale)           params.set('on_sale', 'true')
    if (page > 1)         params.set('page', String(page))
    return params
  }, [selectedCategories, selectedTags, sort, search, selectedSizes, minPrice, maxPrice, onSale, page])

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = buildParams()
      params.set('limit', String(ITEMS_PER_PAGE))
      const res  = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch {
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    fetchProducts()
    // Update URL without hard navigation
    const params = buildParams()
    const qs = params.toString()
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    })
  }, [selectedCategories, selectedTags, sort, search, selectedSizes, minPrice, maxPrice, onSale, page, fetchProducts, buildParams, router, pathname])

  // Clear price inputs when currency changes
  useEffect(() => {
    setMinPrice('')
    setMaxPrice('')
  }, [currency])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedTags([])
    setSort('newest')
    setSearch('')
    setSearchInput('')
    setSelectedSizes([])
    setMinPrice('')
    setMaxPrice('')
    setOnSale(false)
    setPage(1)
  }

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val])
    setPage(1)
  }

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedTags.length > 0 || search || selectedSizes.length > 0 ||
    minPrice || maxPrice || onSale || sort !== 'newest'

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // ─── Filter Sidebar content ────────────────────────────────────────────────
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

      {/* Category */}
      <div>
        <h3 className="font-brand font-semibold text-on-surface text-sm mb-2">القسم</h3>
        <MultiSelectDropdown
          options={initialCategories.map(cat => ({ label: cat.name_ar, value: cat.slug }))}
          selectedValues={selectedCategories}
          onChange={(val) => toggleSelection(setSelectedCategories, val)}
          placeholder="اختر القسم..."
        />
      </div>

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
      <div>
        <h3 className="font-brand font-semibold text-on-surface text-sm mb-2">المقاس</h3>
        <MultiSelectDropdown
          options={SHOE_SIZES.map(size => ({ label: String(size), value: String(size) }))}
          selectedValues={selectedSizes}
          onChange={(val) => toggleSelection(setSelectedSizes, val)}
          placeholder="المقاس..."
        />
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-brand font-semibold text-on-surface text-sm mb-2">
          نطاق السعر ({currency === 'SYP' ? 'ل.س.ج' : 'دولار'})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="من"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
            className="w-full h-8 px-2 bg-[#F5F1EB] rounded-lg text-sm font-body text-on-surface placeholder:text-[#9E9890] focus:outline-none focus:ring-1 focus:ring-[#785600] transition-shadow"
            dir="ltr"
          />
          <span className="text-[#9E9890] font-arabic text-sm shrink-0">—</span>
          <input
            type="number"
            placeholder="إلى"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
            className="w-full h-8 px-2 bg-[#F5F1EB] rounded-lg text-sm font-body text-on-surface placeholder:text-[#9E9890] focus:outline-none focus:ring-1 focus:ring-[#785600] transition-shadow"
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
          onClick={() => { setOnSale((v) => !v); setPage(1) }}
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
    <div dir="rtl" className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 pt-4 pb-12">

      {/* Category tabs */}
      {initialCategories.length > 0 && (
        <div className="w-full overflow-x-auto no-scrollbar mb-8 -mx-4 px-4 md:mx-0 md:px-0 pb-1" dir="rtl">
          <div className="flex justify-start sm:justify-center w-max min-w-full sm:min-w-0 sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-[#F0EBE3] rounded-2xl p-1.5 shadow-sm">
              {/* All */}
              <button
                type="button"
                onClick={() => { setSelectedCategories([]); setOnSale(false); setSelectedTags([]); setPage(1) }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic font-semibold transition-all duration-200 shrink-0',
                  selectedCategories.length === 0 && !onSale && selectedTags.length === 0
                    ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-sm'
                    : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F5F1EB]'
                )}
              >
                <LayoutGrid size={15} />
                الكل
              </button>

              <div className="w-px h-6 bg-outline-variant/30 mx-0.5 shrink-0" />

              {/* Special Distingusihed Tabs */}
              {SPECIAL_TABS.map(tab => {
                const isActive = (tab.tag && selectedTags.length === 1 && selectedTags[0] === tab.tag);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategories([]);
                      setOnSale(false);
                      setSelectedTags(tab.tag ? [tab.tag] : []);
                      setPage(1);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic font-semibold transition-all duration-200 shrink-0',
                      isActive ? tab.activeClass : tab.baseClass
                    )}
                  >
                    <span className="text-sm leading-none">{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}

              <div className="w-px h-6 bg-outline-variant/30 mx-0.5 shrink-0" />

              {initialCategories.map((cat) => {
                const isActive = selectedCategories.length === 1 && selectedCategories[0] === cat.slug
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategories([cat.slug]); setOnSale(false); setSelectedTags([]); setPage(1) }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic font-semibold transition-all duration-200 shrink-0',
                      isActive
                        ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white shadow-sm'
                        : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F5F1EB]'
                    )}
                  >
                    {cat.image_url && (
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                        <Image src={cat.image_url} alt={cat.name_ar} width={20} height={20} className="object-cover w-full h-full" />
                      </div>
                    )}
                    {cat.name_ar}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[18rem] shrink-0">
          <div className="sticky top-[88px] bg-white rounded-2xl p-5 shadow-sm border border-[#F0EBE3]">

            <h2 className="font-brand font-bold text-[#1A1A1A] mb-4">تصفية النتائج</h2>
            {FilterSidebar}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white p-2 rounded-2xl shadow-sm border border-[#F0EBE3]">
            {/* Mobile filter button & Search wrapper */}
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
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#785600]" />
                )}
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
                    placeholder="ابحث عن تشكيلة، موديل..."
                    dir="rtl"
                    className={cn(
                      'w-full h-11 pr-10 pl-4 rounded-xl',
                      'bg-transparent border-none',
                      'font-arabic text-sm text-[#1A1A1A] placeholder:text-[#9E9890]',
                      'focus:outline-none focus:ring-1 focus:ring-[#785600]/30 focus:bg-[#FAF8F5]',
                      'transition-all duration-200'
                    )}
                  />
                </div>
              </form>
            </div>

            {/* Sort */}
            <div className="relative shrink-0 w-full sm:w-48">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                className={cn(
                  'appearance-none w-full h-11 pl-8 pr-4 rounded-xl',
                  'bg-[#F5F1EB] text-[#1A1A1A] font-arabic text-sm font-medium',
                  'focus:outline-none focus:ring-1 focus:ring-[#785600]',
                  'cursor-pointer transition-colors duration-150 hover:bg-[#EDE8E1]'
                )}
                dir="rtl"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6560]"
              />
            </div>
          </div>

          {/* Product grid */}
          <ProductGrid
            products={products}
            isLoading={loading || isPending}
            columns={3}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              dir="rtl"
              className="flex items-center justify-center gap-2 mt-10"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  'bg-surface-container-low text-on-surface',
                  'hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-colors duration-150'
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && typeof arr[i - 1] === 'number' && (p - (arr[i - 1] as number)) > 1) {
                    acc.push('…')
                  }
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-secondary font-body text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p as number)}
                      className={cn(
                        'w-9 h-9 rounded-xl font-body text-sm tabular-nums transition-all duration-150',
                        page === p
                          ? 'bg-gradient-to-l from-[#785600] to-[#986D00] text-white font-semibold'
                          : 'bg-surface-container-low text-secondary hover:bg-surface-container hover:text-on-surface'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  'bg-surface-container-low text-on-surface',
                  'hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-colors duration-150'
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            dir="rtl"
            className={cn(
              'fixed bottom-0 inset-x-0 z-50 lg:hidden',
              'bg-surface rounded-t-2xl shadow-ambient-xl',
              'max-h-[85vh] flex flex-col',
              'animate-fade-in'
            )}
          >
            {/* Handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <h2 className="font-brand font-bold text-on-surface">تصفية النتائج</h2>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-6">
              {FilterSidebar}
            </div>
            <div className="shrink-0 px-5 pb-6 pt-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'w-full h-11 rounded-xl font-arabic font-semibold text-white',
                  'bg-gradient-to-l from-[#785600] to-[#986D00]',
                  'hover:from-[#986D00] hover:to-[#B8860B]',
                  'transition-all duration-200'
                )}
              >
                عرض النتائج
                {total > 0 && ` (${total})`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
