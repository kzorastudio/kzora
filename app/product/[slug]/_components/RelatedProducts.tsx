import { supabase } from '@/lib/supabase'
import type { ProductFull } from '@/types'
import RelatedProductsClient from './RelatedProductsClient'

interface Props {
  categorySlug: string
  excludeId:    string
  /** The product being viewed — suggestions are ranked by similarity to it. */
  basePriceSyp: number
  baseMoldType: 'chinese' | 'normal' | null
}

// How many candidates to score. Larger than the 8 we display so ranking has
// something to choose from, small enough to stay a cheap single query.
const CANDIDATE_LIMIT = 40
const DISPLAY_LIMIT = 8

/** Effective price: discount price when set, otherwise the base price. */
const effectivePrice = (p: { price_syp: number; discount_price_syp: number | null }): number =>
  p.discount_price_syp && p.discount_price_syp > 0 ? p.discount_price_syp : p.price_syp

/**
 * Similarity score against the viewed product. Higher ranks first.
 *
 *   price proximity   0..50   — the strongest intent signal we have
 *   same mold type       20   — someone who needs a normal fit still does
 *   popularity        0..10   — tiebreaker only, never outweighs the above
 *   low stock           -10
 *   out of stock       -100   — sinks below everything, but stays reachable
 */
function scoreOf(p: ProductFull, basePriceSyp: number, baseMoldType: string | null): number {
  let score = 0

  // Price proximity. Both prices must be real for the comparison to mean
  // anything — a missing price scores neutral rather than dead last, so a
  // product with incomplete data isn't silently buried.
  const price = effectivePrice(p)
  if (basePriceSyp > 0 && price > 0) {
    const ratio = Math.abs(price - basePriceSyp) / basePriceSyp
    // Identical price = 50, double (or half) the price = 0.
    score += Math.max(0, 50 * (1 - ratio))
  } else {
    score += 25
  }

  if (baseMoldType && p.mold_type === baseMoldType) score += 20

  // log10 keeps a viral product from dominating on views alone.
  score += Math.min(10, Math.log10((p.view_count || 0) + 1) * 4)

  if (p.stock_status === 'out_of_stock') score -= 100
  else if (p.stock_status === 'low_stock') score -= 10

  return score
}

async function fetchRelated(
  categorySlug: string,
  excludeId: string,
  basePriceSyp: number,
  baseMoldType: 'chinese' | 'normal' | null
): Promise<ProductFull[]> {
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
    .order('created_at', { ascending: false })
    .limit(CANDIDATE_LIMIT)

  if (error || !data) return []

  const mapped = (data || []).map((p: any) => ({
    ...p,
    images:   [...((p.product_images as { display_order: number }[]) ?? [])].sort((a, b) => a.display_order - b.display_order),
    colors:   p.product_colors ?? [],
    sizes:    ((p.product_sizes as { size: number; is_available: boolean }[]) ?? []).sort((a, b) => a.size - b.size),
    tags:     ((p.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
    category: Array.isArray(p.categories) ? (p.categories[0] ?? null) : (p.categories ?? null),
    variants: p.product_variants ?? [],
  })) as ProductFull[]

  // Rank by similarity, then take the top slice. Sorting a copy keeps this
  // independent of the order the query happened to return.
  return [...mapped]
    .sort((a, b) => scoreOf(b, basePriceSyp, baseMoldType) - scoreOf(a, basePriceSyp, baseMoldType))
    .slice(0, DISPLAY_LIMIT)
}

export default async function RelatedProducts({ categorySlug, excludeId, basePriceSyp, baseMoldType }: Props) {
  const products = await fetchRelated(categorySlug, excludeId, basePriceSyp, baseMoldType)
  if (products.length === 0) return null

  return <RelatedProductsClient products={products} />
}
