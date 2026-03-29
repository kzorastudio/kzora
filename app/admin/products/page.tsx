import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, ChevronRight, ChevronLeft } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import { ADMIN_ITEMS_PER_PAGE } from '@/lib/constants'
import { formatPrice, cn } from '@/lib/utils'
import type { Category } from '@/types'
import ProductsClient from './ProductsClient'
import DeleteProductButton from './DeleteProductButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    status?: string
    stock?: string
    sort?: string
    page?: string
  }
}

async function getCategories(): Promise<Category[]> {
  const { data } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  return (data as Category[]) ?? []
}

async function getProducts(
  search: string, 
  category: string, 
  status: string, 
  stock: string, 
  sort: string, 
  page: number
) {
  const offset = (page - 1) * ADMIN_ITEMS_PER_PAGE

  let query = supabaseAdmin
    .from('products')
    .select(
      `
      id, name, slug, price_syp, price_usd, discount_price_syp, discount_price_usd,
      stock_status, is_published, is_featured, sort_order, created_at,
      category:categories(id, name_ar),
      images:product_images(url, public_id, display_order),
      tags:product_tags(tag)
      `,
      { count: 'exact' }
    )

  // ─── Filters ───
  if (search)   query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category_id', category)
  
  if (status === 'published') query = query.eq('is_published', true)
  if (status === 'draft')     query = query.eq('is_published', false)
  
  if (stock) query = query.eq('stock_status', stock)

  // ─── Sorting ───
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'price_asc':
      query = query.order('price_syp', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_syp', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + ADMIN_ITEMS_PER_PAGE - 1)

  const { data, count } = await query

  return {
    products:   data ?? [],
    total:      count ?? 0,
    totalPages: Math.ceil((count ?? 0) / ADMIN_ITEMS_PER_PAGE),
  }
}

const STOCK_BADGE: Record<string, string> = {
  in_stock:     'bg-green-50 text-green-700',
  low_stock:    'bg-amber-50 text-amber-700',
  out_of_stock: 'bg-red-50 text-red-600',
}
const STOCK_LABEL: Record<string, string> = {
  in_stock:     'متوفر',
  low_stock:    'محدود',
  out_of_stock: 'نفذ',
}
const TAG_LABEL: Record<string, string> = {
  new:         'جديد',
  best_seller: 'الأكثر مبيعاً',
  on_sale:     'تخفيض',
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const search   = searchParams.search   ?? ''
  const category = searchParams.category ?? ''
  const status   = searchParams.status   ?? ''
  const stock    = searchParams.stock    ?? ''
  const sort     = searchParams.sort     ?? 'newest'
  const page     = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const [categories, { products, total, totalPages }] = await Promise.all([
    getCategories(),
    getProducts(search, category, status, stock, sort, page),
  ])

  function buildPageUrl(p: number) {
    const params = new URLSearchParams()
    if (search)   params.set('search',   search)
    if (category) params.set('category', category)
    if (status)   params.set('status',   status)
    if (stock)    params.set('stock',    stock)
    if (sort)     params.set('sort',     sort)
    if (p > 1)    params.set('page',     String(p))
    const qs = params.toString()
    return `/admin/products${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <AdminHeader />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-arabic font-medium text-secondary">
            إجمالي المنتجات: <span className="font-bold text-on-surface">{total.toLocaleString('ar-SY')}</span>
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-arabic font-medium hover:bg-primary-container transition-colors shadow-ambient"
          >
            <Plus size={16} />
            إضافة منتج
          </Link>
        </div>

        {/* Filters (client island) */}
        <ProductsClient
          categories={categories}
          search={search}
          category={category}
          status={status}
          stock={stock}
          sort={sort}
        />

        {/* ── MOBILE CARDS ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {products.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center text-sm font-arabic text-secondary shadow-ambient">لا توجد منتجات</div>
          ) : (
            (products as any[]).map((product) => {
              const sortedImages = [...((product.images as any[]) ?? [])].sort((a: any, b: any) => a.display_order - b.display_order)
              const thumbnail = sortedImages[0]
              const tags: string[] = (product.tags as any[])?.map((t: any) => t.tag) ?? []
              return (
                <div key={product.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-surface-container shrink-0">
                      {thumbnail?.url ? (
                        <Image src={thumbnail.url} alt={product.name} width={56} height={56} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><span className="text-secondary/40 text-lg">—</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-arabic font-semibold text-on-surface truncate">{product.name}</p>
                      <p className="text-xs font-arabic text-secondary mt-0.5">{(product.category as any)?.name_ar ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <p className="text-sm font-label font-semibold text-on-surface">{formatPrice(product.discount_price_syp ?? product.price_syp, 'SYP')}</p>
                      <p className="text-xs font-label text-secondary">{formatPrice(product.discount_price_usd ?? product.price_usd, 'USD')}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-arabic font-medium', STOCK_BADGE[product.stock_status] ?? 'bg-surface-container text-secondary')}>
                        {STOCK_LABEL[product.stock_status] ?? product.stock_status}
                      </span>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-arabic font-medium', product.is_published ? 'bg-green-50 text-green-700' : 'bg-surface-container text-secondary')}>
                        {product.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-arabic font-medium bg-primary-fixed/60 text-primary">{TAG_LABEL[tag] ?? tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                    <Link href={`/admin/products/${product.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-container text-sm font-arabic font-medium text-on-surface hover:bg-primary hover:text-white transition-colors"
                    >
                      <Pencil size={14} /> تعديل
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── DESKTOP TABLE ── */}
        <div className="hidden md:block bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-outline-variant/40">
                  {['الصورة والاسم', 'القسم', 'السعر', 'المخزون', 'الوسوم', 'الحالة', 'الإجراءات'].map((col) => (
                    <th key={col} className="px-4 py-3 text-right text-xs font-arabic font-semibold text-secondary uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-sm font-arabic text-secondary">لا توجد منتجات</td></tr>
                ) : (
                  (products as any[]).map((product) => {
                    const sortedImages = [...((product.images as any[]) ?? [])].sort((a: any, b: any) => a.display_order - b.display_order)
                    const thumbnail = sortedImages[0]
                    const tags: string[] = (product.tags as any[])?.map((t: any) => t.tag) ?? []
                    return (
                      <tr key={product.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-surface-container shrink-0">
                              {thumbnail?.url ? <Image src={thumbnail.url} alt={product.name} width={50} height={50} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><span className="text-xs font-arabic text-secondary/40">—</span></div>}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-arabic font-medium text-on-surface leading-tight truncate max-w-[200px]">{product.name}</span>
                              <span className="text-xs font-label text-secondary mt-0.5">#{product.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-arabic text-on-surface-variant whitespace-nowrap">{(product.category as any)?.name_ar ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-label font-semibold text-on-surface whitespace-nowrap">{formatPrice(product.discount_price_syp ?? product.price_syp, 'SYP')}</span>
                            <span className="text-xs font-label text-secondary whitespace-nowrap">{formatPrice(product.discount_price_usd ?? product.price_usd, 'USD')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-arabic font-medium', STOCK_BADGE[product.stock_status] ?? 'bg-surface-container text-secondary')}>{STOCK_LABEL[product.stock_status] ?? product.stock_status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {tags.length === 0 ? <span className="text-xs font-arabic text-secondary">—</span> : tags.map((tag) => <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-arabic font-medium bg-primary-fixed/60 text-primary">{TAG_LABEL[tag] ?? tag}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-arabic font-medium', product.is_published ? 'bg-green-50 text-green-700' : 'bg-surface-container text-secondary')}>{product.is_published ? 'منشور' : 'مسودة'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/products/${product.id}/edit`} className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-fixed/40 transition-colors" title="تعديل"><Pencil size={15} /></Link>
                            <DeleteProductButton id={product.id} name={product.name} />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-arabic text-secondary">
              صفحة {page} من {totalPages}
              <span className="hidden sm:inline"> — {total.toLocaleString('ar-SY')} نتيجة</span>
            </span>
            <div className="flex items-center gap-1">
              <Link
                href={page > 1 ? buildPageUrl(page - 1) : '#'}
                aria-disabled={page <= 1}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-xl text-sm transition-colors',
                  page <= 1
                    ? 'text-secondary/30 pointer-events-none'
                    : 'text-on-surface hover:bg-surface-container'
                )}
              >
                <ChevronRight size={16} />
              </Link>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number
                  if (totalPages <= 7)        p = i + 1
                  else if (page <= 4)         p = i + 1
                  else if (page >= totalPages - 3) p = totalPages - 6 + i
                  else                        p = page - 3 + i

                  return (
                    <Link
                      key={p}
                      href={buildPageUrl(p)}
                      className={cn(
                        'h-8 w-8 flex items-center justify-center rounded-xl text-sm font-label transition-colors',
                        p === page
                          ? 'bg-primary text-white font-semibold'
                          : 'text-on-surface hover:bg-surface-container'
                      )}
                    >
                      {p}
                    </Link>
                  )
                })}
              </div>

              <Link
                href={page < totalPages ? buildPageUrl(page + 1) : '#'}
                aria-disabled={page >= totalPages}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-xl text-sm transition-colors',
                  page >= totalPages
                    ? 'text-secondary/30 pointer-events-none'
                    : 'text-on-surface hover:bg-surface-container'
                )}
              >
                <ChevronLeft size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
