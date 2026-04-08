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
      .select('size')
      .in('product_id', productIds)
      .eq('is_available', true)

    const uniqueSizes = [...new Set((sizesData || []).map((s: { size: number }) => s.size))]
      .sort((a, b) => a - b)

    return NextResponse.json({ sizes: uniqueSizes })
  } catch (err) {
    console.error('Filters GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
