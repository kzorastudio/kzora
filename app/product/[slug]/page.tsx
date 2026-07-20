// ISR: regenerate every 5 minutes. Admin actions also call revalidatePath on changes.
export const revalidate = 300
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFAB } from '@/components/layout/WhatsAppFAB'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { truncate, getDiscountPercent } from '@/lib/utils'
import { optimizeCloudinaryUrl } from '@/lib/cloudinary'
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

interface ReviewRow {
  user_name: string
  rating: number
  comment: string | null
  created_at: string
}

async function getProductReviews(productId: string): Promise<ReviewRow[]> {
  const { data } = await supabase
    .from('product_reviews')
    .select('user_name, rating, comment, created_at')
    .eq('product_id', productId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)
  return (data ?? []) as ReviewRow[]
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
      images: product.images[0] ? [{ url: optimizeCloudinaryUrl(product.images[0].url), width: 1200, height: 630, alt: product.name }] : [],
      url: `https://www.kzora.co/product/${product.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — كزورا Kzora`,
      description: description,
      images: product.images[0] ? [optimizeCloudinaryUrl(product.images[0].url)] : [],
    }
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const [settings, reviews] = await Promise.all([
    getSettings(),
    getProductReviews(product.id),
  ])

  const hasDiscountSchema = (product.discount_price_syp != null && product.discount_price_syp < product.price_syp) ||
                            (product.discount_price_usd != null && product.discount_price_usd < product.price_usd)

  // priceValidUntil — only meaningful when discounted. Default to 30 days from now.
  const priceValidUntil = (() => {
    if (!hasDiscountSchema) return undefined
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })()

  // Compute real aggregateRating from published reviews — omit entirely if no reviews
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 0

  // JSON-LD for Product
  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(img => optimizeCloudinaryUrl(img.url)),
    description: product.description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'كزورا Kzora',
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.kzora.co/product/${product.slug}`,
      priceCurrency: 'SYP',
      price: product.discount_price_syp || product.price_syp,
      availability: product.stock_status === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      ...(priceValidUntil ? { priceValidUntil } : {}),
      seller: {
        '@type': 'Organization',
        name: 'كزورا Kzora',
      },
    },
  }

  if (totalReviews > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
    productSchema.review = reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.user_name },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      datePublished: r.created_at,
      ...(r.comment ? { reviewBody: r.comment } : {}),
    }))
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://www.kzora.co',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category?.name_ar || 'الأقسام',
        item: product.category ? `https://www.kzora.co/category/${product.category.slug}` : 'https://www.kzora.co/categories',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://www.kzora.co/product/${product.slug}`,
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
            <RelatedProducts
              categorySlug={product.category.slug}
              excludeId={product.id}
              basePriceSyp={
                product.discount_price_syp && product.discount_price_syp > 0
                  ? product.discount_price_syp
                  : product.price_syp
              }
              baseMoldType={product.mold_type ?? null}
            />
          ) : null
        }
      />
      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </>
  )
}
