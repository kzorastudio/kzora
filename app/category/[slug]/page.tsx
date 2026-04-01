export const dynamic = 'force-dynamic'
export const revalidate = 0
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import CategoryProductsClient from './CategoryProductsClient'
import type { Category, ProductFull } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function getCategory(slug: string): Promise<Category | null> {
  const decodedSlug = decodeURIComponent(slug)
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', decodedSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null
  return data as Category
}

async function getCategoryProducts(categoryId: string): Promise<ProductFull[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      product_colors (*),
      product_sizes  (*),
      product_tags   (*),
      product_variants (*),
      categories     (*)
    `)
    .eq('is_published', true)
    .eq('category_id', categoryId)
    .order('stock_status', { ascending: true })
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return (data || []).map((p: any) => ({
    ...p,
    images: [...((p.product_images as { display_order: number }[]) ?? [])].sort(
      (a, b) => a.display_order - b.display_order
    ),
    colors: p.product_colors ?? [],
    sizes: ((p.product_sizes as { size: number; is_available: boolean }[]) ?? []).sort(
      (a, b) => a.size - b.size
    ),
    tags: ((p.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
    category: Array.isArray(p.categories) ? p.categories[0] ?? null : p.categories ?? null,
    variants: p.product_variants ?? [],
  })) as ProductFull[]
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: 'القسم غير موجود — كزورا' }

  return {
    title:       `${category.name_ar} — كزورا`,
    description: category.description || `تصفح منتجات ${category.name_ar} في متجر كزورا للأحذية`,
    openGraph: {
      title:  category.name_ar,
      images: category.image_url ? [{ url: category.image_url }] : [],
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params

  const category = await getCategory(slug)

  if (!category) notFound()

  const categoryProducts = await getCategoryProducts(category.id)

  return (
    <>
      <Header />

      <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-24">
        {/* Hero banner */}
        <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden bg-surface-container-low">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name_ar}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-l from-[#785600]/20 to-[#986D00]/10" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10 text-right">
            <h1 className="font-arabic text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-normal">
              {category.name_ar}
            </h1>
            {category.description && (
              <p className="font-arabic text-base text-white/90 mt-1 max-w-md leading-relaxed tracking-normal">
                {category.description}
              </p>
            )}
            <p className="font-arabic text-sm text-white/60 mt-1.5 opacity-80">
              {categoryProducts.length} منتج
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 pt-5 pb-0">
          <nav aria-label="مسار التنقل">
            <ol className="flex items-center flex-wrap gap-1.5 text-xs font-arabic text-secondary">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              </li>
              <li aria-hidden className="text-outline-variant">›</li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">المنتجات</Link>
              </li>
              <li aria-hidden className="text-outline-variant">›</li>
              <li className="text-on-surface font-medium">{category.name_ar}</li>
            </ol>
          </nav>
        </div>

        {/* Products with sort/filter */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 py-8">
          <CategoryProductsClient products={categoryProducts} />
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
