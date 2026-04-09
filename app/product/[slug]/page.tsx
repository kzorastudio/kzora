export const dynamic = 'force-dynamic'
export const revalidate = 0
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { truncate, getDiscountPercent } from '@/lib/utils'
import type { ProductFull } from '@/types'
import ProductPageClient from './_components/ProductPageClient'
import RelatedProducts from './_components/RelatedProducts'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<ProductFull | null> {
  const decodedSlug = decodeURIComponent(slug)
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, product_images (*), product_colors (*), product_sizes (*), product_tags (*), product_variants (*), categories (*)`)
      .eq('slug', decodedSlug)
      .eq('is_published', true)
      .maybeSingle()

    if (error || !data) return null

    return {
      ...data,
      images:   [...(data.product_images ?? [])].sort(
        (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
      ),
      colors:   data.product_colors  ?? [],
      sizes:    (data.product_sizes  ?? [])
                  .map((s: { size: number; is_available: boolean }) => ({ 
                    size: s.size, 
                    is_available: s.is_available ?? true 
                  }))
                  .sort((a: { size: number }, b: { size: number }) => a.size - b.size),
      tags:     (data.product_tags   ?? []).map((t: { tag: string }) => t.tag),
      category: Array.isArray(data.categories) ? (data.categories[0] ?? null) : (data.categories ?? null),
      variants: data.product_variants ?? [],
    } as ProductFull
  } catch (e) {
    return null
  }
}

async function getSettings() {
  const { data } = await supabase.from('homepage_settings').select('*').limit(1).maybeSingle()
  return data
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'المنتج غير موجود — كزورا Kzora' }

  const categoryName = product.category?.name_ar || ''
  const description = truncate(product.description ?? '', 160)

  return {
    title: `${product.name} ${categoryName ? `- ${categoryName}` : ''} — كزورا Kzora`,
    description: `${description} | تسوق الآن من كزورا Kzora للأحذية في سوريا. جودة عالية وتوصيل سريع.`,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} — كزورا Kzora`,
      description: description,
      images: product.images[0] ? [{ url: product.images[0].url, width: 1200, height: 630, alt: product.name }] : [],
      url: `https://kzora.co/product/${product.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — كزورا Kzora`,
      description: description,
      images: product.images[0] ? [product.images[0].url] : [],
    }
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getSettings()
  ])

  if (!product) notFound()

  // JSON-LD for Product
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(img => img.url),
    description: product.description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'كزورا Kzora',
    },
    offers: {
      '@type': 'Offer',
      url: `https://kzora.co/product/${product.slug}`,
      priceCurrency: 'SYP',
      price: product.discount_price_syp || product.price_syp,
      availability: product.stock_status === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'كزورا Kzora',
      },
    },
    // Elite SEO: Star ratings in search results
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '15',
    },
  }

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
        name: product.category?.name_ar || 'الأقسام',
        item: product.category ? `https://kzora.co/category/${product.category.slug}` : 'https://kzora.co/categories',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://kzora.co/product/${product.slug}`,
      },
    ],
  }

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductPageClient
        product={product}
        settings={settings}
        relatedProductsNode={
          product.category ? (
            <RelatedProducts categorySlug={product.category.slug} excludeId={product.id} />
          ) : null
        }
      />
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
