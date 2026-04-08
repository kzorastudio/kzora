export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── GET /api/products/filters ────────────────────────────────────────────────
// Returns available filter options (sizes) based on published products.
// Optional ?category=slug to scope to a specific category.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Build published product IDs query
    let productQuery = supabaseAdmin
      .from('products')
      .select('id')
      .eq('is_published', true)

    if (category) {
      const slugs = category.split(',').map(s => s.trim()).filter(Boolean)
      const { data: cats } = await supabaseAdmin
        .from('categories')
        .select('id')
        .in('slug', slugs)

      const catIds = (cats || []).map((c: { id: string }) => c.id)
      if (catIds.length > 0) {
        productQuery = productQuery.in('category_id', catIds)
      }
    }

    const { data: publishedProducts } = await productQuery
    const productIds = (publishedProducts || []).map((p: { id: string }) => p.id)

    if (productIds.length === 0) {
      return NextResponse.json({ sizes: [] })
    }

    // Get sizes that are marked as available by admin
    const { data: sizesData } = await supabaseAdmin
      .from('product_sizes')
      .select('product_id, size')
      .in('product_id', productIds)
      .eq('is_available', true)

    // Check variants for these products to ensure stock exists
    const { data: allVariants } = await supabaseAdmin
      .from('product_variants')
      .select('product_id, size, quantity')
      .in('product_id', productIds)

    // Map: "product_id-size" -> max quantity
    const variantStock = new Map<string, number>()
    for (const v of (allVariants || [])) {
      if (v.size) {
        const key = `${v.product_id}-${v.size}`
        variantStock.set(key, Math.max(variantStock.get(key) ?? 0, v.quantity ?? 0))
      }
    }

    const availableSizesSet = new Set<number>()
    for (const s of (sizesData || [])) {
      const key = `${s.product_id}-${s.size}`
      const qty = variantStock.get(key)
      // Keep if no variant exists for this size OR stock > 0
      if (qty === undefined || qty > 0) {
        availableSizesSet.add(s.size)
      }
    }

    const uniqueSizes = Array.from(availableSizesSet).sort((a, b) => a - b)

    return NextResponse.json({ sizes: uniqueSizes })
  } catch (err) {
    console.error('Filters GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
