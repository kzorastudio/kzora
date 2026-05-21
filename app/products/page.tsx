import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { supabase } from '@/lib/supabase'
import type { Category, ProductFull, ProductTag } from '@/types'
import ProductsClientPage from './_components/ProductsClientPage'

// ISR: regenerate every 5 minutes. Filter combinations still render fresh on demand thanks to dynamic params.
export const revalidate = 300

interface PageProps {
  searchParams: Promise<{
    category?: string
    tag?:      string
    sort?:     string
    search?:   string
    page?:     string
    size?:     string
    min_price?: string
    max_price?: string
    on_sale?:  string
  }>
}

const FILTER_KEYS = ['category', 'tag', 'sort', 'search', 'page', 'size', 'min_price', 'max_price', 'on_sale'] as const

function isFilteredView(params: Record<string, string | undefined>): boolean {
  return FILTER_KEYS.some(k => {
    const v = params[k]
    if (!v) return false
    // sort=newest and page=1 are the defaults — they don't count as a real filter
    if (k === 'sort' && v === 'newest') return false
    if (k === 'page' && v === '1') return false
    return true
  })
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const filtered = isFilteredView(params)

  return {
    title: 'كافة المنتجات — تسوق أحدث موديلات الأحذية في سوريا | كزورا Kzora',
    description: 'اكتشف مجموعتنا الكاملة من الأحذية الرجالية والنسائية والرياضية. صبابات جلد طبيعي، سنيكرز، وأحذية رسمية بأعلى جودة في سوريا. كزورا Kzora.',
    alternates: {
      canonical: '/products',
    },
    // Filtered combinations have near-duplicate content — tell Google to follow links but not index this variant
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

// Fetch initial products server-side so crawlers see content without running JS.
// Mirrors the public /api/products listing for the same filter params.
async function getInitialProducts(params: Record<string, string | undefined>): Promise<{ products: ProductFull[]; total: number }> {
  try {
    let query = supabase
      .from('products')
      .select(
        `*,
        category:categories(id, name_ar, slug),
        images:product_images(id, url, public_id, color_variant, display_order, is_main),
        colors:product_colors(id, name_ar, hex_code, swatch_url, swatch_public_id, is_available),
        sizes:product_sizes(size, is_available),
        tags:product_tags(tag),
        variants:product_variants(id, color, size, quantity)
        `,
        { count: 'exact' }
      )
      .eq('is_published', true)

    if (params.category) {
      const slugs = params.category.split(',').filter(Boolean)
      const { data: cats } = await supabase.from('categories').select('id').in('slug', slugs)
      const ids = (cats ?? []).map(c => c.id)
      if (ids.length > 0) query = query.in('category_id', ids)
    }

    if (params.tag) {
      const tags = params.tag.split(',').filter(Boolean)
      const { data: tagRows } = await supabase.from('product_tags').select('product_id').in('tag', tags)
      const ids = (tagRows ?? []).map((r: { product_id: string }) => r.product_id)
      if (ids.length > 0) query = query.in('id', ids)
    }

    // Size filter — mirror /api/products so shared filtered links render correctly server-side.
    // A product qualifies if the size is marked available AND (has no variants for it OR has stock > 0).
    if (params.size) {
      const sizes = params.size.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s))
      if (sizes.length > 0) {
        const { data: availSizes } = await supabase
          .from('product_sizes')
          .select('product_id')
          .in('size', sizes)
          .eq('is_available', true)

        const candidateIds = Array.from(new Set((availSizes ?? []).map((r: { product_id: string }) => r.product_id)))

        if (candidateIds.length === 0) {
          query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
        } else {
          const { data: sizeVariants } = await supabase
            .from('product_variants')
            .select('product_id, quantity')
            .in('size', sizes)
            .in('product_id', candidateIds)

          const variantStock = new Map<string, number>()
          for (const v of (sizeVariants ?? [])) {
            variantStock.set(v.product_id, Math.max(variantStock.get(v.product_id) ?? 0, v.quantity ?? 0))
          }

          const finalIds = candidateIds.filter(id => {
            const qty = variantStock.get(id)
            return qty === undefined || qty > 0
          })

          query = query.in('id', finalIds.length > 0 ? finalIds : ['00000000-0000-0000-0000-000000000000'])
        }
      }
    }

    if (params.on_sale === 'true') {
      query = query.not('discount_price_syp', 'is', null)
    }

    if (params.min_price) query = query.gte('price_syp', parseInt(params.min_price, 10))
    if (params.max_price) query = query.lte('price_syp', parseInt(params.max_price, 10))

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    query = query.order('created_at', { ascending: false }).order('stock_status', { ascending: true })
    switch (params.sort) {
      case 'price_asc':   query = query.order('price_syp', { ascending: true }); break
      case 'price_desc':  query = query.order('price_syp', { ascending: false }); break
      case 'most_viewed': query = query.order('view_count', { ascending: false }); break
    }

    const limit = 24
    const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count } = await query
    const products = (data ?? []).map((p: any) => ({
      ...p,
      sizes: (p.sizes ?? []).map((s: { size: number; is_available: boolean }) => ({ size: s.size, is_available: s.is_available })),
      tags:  (p.tags  ?? []).map((t: { tag: ProductTag }) => t.tag),
    })) as ProductFull[]

    return { products, total: count ?? 0 }
  } catch {
    return { products: [], total: 0 }
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const [categoriesResult, initialResult] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('created_at'),
    getInitialProducts(params),
  ])

  const categories = (categoriesResult.data ?? []) as Category[]

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية',     item: 'https://www.kzora.co' },
      { '@type': 'ListItem', position: 2, name: 'كافة المنتجات', item: 'https://www.kzora.co/products' },
    ],
  }

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="min-h-screen bg-[#FAF8F5] pt-32 text-right">
        {/* SEO H1 */}
        <h1 className="sr-only">استعراض كافة المنتجات والأحذية في متجر كزورا Kzora - سوريا</h1>

        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          }
        >
          <ProductsClientPage
            initialCategories={categories}
            initialParams={params}
            initialProducts={initialResult.products}
            initialTotal={initialResult.total}
          />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
