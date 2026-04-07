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
    .order('created_at', { ascending: false })
    .order('stock_status', { ascending: true })
    .order('sort_order', { ascending: true, nullsFirst: false })

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
  if (!category) return { title: 'القسم غير موجود — كزورا Kzora' }

  return {
    title: `${category.name_ar} — تشكيلة واسعة من كزورا Kzora سوريا`,
    description: category.description || `تصفح أحدث موديلات ${category.name_ar} في متجر كزورا Kzora للأحذية. جودة عالية وأسعار منافسة في سوريا.`,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name_ar} — كزورا Kzora`,
      description: category.description || `تصفح أحدث موديلات ${category.name_ar} في متجر كزورا Kzora للأحذية.`,
      images: category.image_url ? [{ url: category.image_url, width: 1200, height: 630, alt: category.name_ar }] : [],
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params

  const category = await getCategory(slug)

  if (!category) notFound()

  const categoryProducts = await getCategoryProducts(category.id)

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://kzora.co',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'كافة المنتجات',
        item: 'https://kzora.co/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name_ar,
        item: `https://kzora.co/category/${category.slug}`,
      },
    ],
  }

  // ItemList Schema for products in this category
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name_ar,
    description: category.description,
    numberOfItems: categoryProducts.length,
    itemListElement: categoryProducts.slice(0, 10).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: p.name,
      url: `https://kzora.co/product/${p.slug}`,
    })),
  }

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      
      <main dir="rtl" className="min-h-screen bg-[#FAF8F5] pt-32">
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
              {categoryProducts.length} منتج متوفر الآن
            </p>
          </div>
        </div>

        {/* Breadcrumb Navigation (Visible) */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 pt-5 pb-0">
          <nav aria-label="مسار التنقل">
            <ol className="flex items-center flex-wrap gap-1.5 text-xs font-arabic text-secondary">
              <li>
                <Link href="/" className="hover:text-primary transition-colors focus:outline-none">الرئيسية</Link>
              </li>
              <li aria-hidden className="text-outline-variant">›</li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors focus:outline-none">المنتجات</Link>
              </li>
              <li aria-hidden className="text-outline-variant">›</li>
              <li className="text-on-surface font-semibold underline decoration-primary/30 decoration-2 underline-offset-4">{category.name_ar}</li>
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
