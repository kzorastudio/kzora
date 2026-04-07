import { supabase } from '@/lib/supabase'
import type { ProductFull } from '@/types'
import RelatedProductsClient from './RelatedProductsClient'

interface Props {
  categorySlug: string
  excludeId:    string
}

async function fetchRelated(categorySlug: string, excludeId: string): Promise<ProductFull[]> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (!cat) return []

  const { data, error } = await supabase
    .from('products')
    .select(`*, product_images (*), product_colors (*), product_sizes (*), product_tags (*), product_variants (*), categories (*)`)
    .eq('is_published', true)
    .eq('category_id', cat.id)
    .neq('id', excludeId)
    .order('stock_status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(8)

  if (error || !data) return []

  return (data || []).map((p: any) => ({
    ...p,
    images:   [...((p.product_images as { display_order: number }[]) ?? [])].sort((a, b) => a.display_order - b.display_order),
    colors:   p.product_colors ?? [],
    sizes:    ((p.product_sizes as { size: number; is_available: boolean }[]) ?? []).sort((a, b) => a.size - b.size),
    tags:     ((p.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
    category: Array.isArray(p.categories) ? (p.categories[0] ?? null) : (p.categories ?? null),
    variants: p.product_variants ?? [],
  })) as ProductFull[]
}

export default async function RelatedProducts({ categorySlug, excludeId }: Props) {
  const products = await fetchRelated(categorySlug, excludeId)
  if (products.length === 0) return null

  return <RelatedProductsClient products={products} />
}

