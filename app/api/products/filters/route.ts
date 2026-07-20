export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, fetchAllRows } from '@/lib/supabase'

// ─── GET /api/products/filters ────────────────────────────────────────────────
// Returns available filter options (sizes) based on published products.
// Optional ?category=slug to scope to a specific category.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let catIds: string[] = []
    if (category) {
      const slugs = category.split(',').map(s => s.trim()).filter(Boolean)
      const { data: cats } = await supabaseAdmin
        .from('categories')
        .select('id')
        .in('slug', slugs)

      catIds = (cats || []).map((c: { id: string }) => c.id)
    }

    // Published product IDs. Paginated — PostgREST caps responses at 1000 rows,
    // so without this newer products silently drop out of the filter list.
    const publishedProducts = await fetchAllRows<{ id: string }>((from, to) => {
      let q = supabaseAdmin
        .from('products')
        .select('id')
        .eq('is_published', true)
      if (catIds.length > 0) q = q.in('category_id', catIds)
      return q.order('id', { ascending: true }).range(from, to)
    })

    const productIds = publishedProducts.map(p => p.id)

    if (productIds.length === 0) {
      return NextResponse.json({ sizes: [] })
    }

    const publishedIdSet = new Set(productIds)

    // Sizes marked available by admin (all published products, paginated).
    const sizesData = await fetchAllRows<{ product_id: string; size: number }>((from, to) =>
      supabaseAdmin
        .from('product_sizes')
        .select('product_id, size')
        .in('product_id', productIds)
        .eq('is_available', true)
        .order('product_id', { ascending: true })
        .order('size', { ascending: true })
        .range(from, to)
    )

    // Variant stock for the same products (paginated).
    const allVariants = await fetchAllRows<{ product_id: string; size: number; quantity: number }>((from, to) =>
      supabaseAdmin
        .from('product_variants')
        .select('product_id, size, quantity')
        .in('product_id', productIds)
        .order('product_id', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to)
    )

    // Map: "product_id-size" -> max quantity
    const variantStock = new Map<string, number>()
    for (const v of allVariants) {
      if (v.size) {
        const key = `${v.product_id}-${v.size}`
        variantStock.set(key, Math.max(variantStock.get(key) ?? 0, v.quantity ?? 0))
      }
    }

    const availableSizesSet = new Set<number>()

    for (const s of sizesData) {
      const qty = variantStock.get(`${s.product_id}-${s.size}`)
      // Keep if no variant exists for this size OR stock > 0
      if (qty === undefined || qty > 0) {
        availableSizesSet.add(s.size)
      }
    }

    // Also surface sizes that only exist as in-stock variants — a size added to
    // the stock table without a matching product_sizes row still belongs here.
    for (const v of allVariants) {
      if (v.size && (v.quantity ?? 0) > 0 && publishedIdSet.has(v.product_id)) {
        availableSizesSet.add(v.size)
      }
    }

    const uniqueSizes = Array.from(availableSizesSet).sort((a, b) => a - b)

    return NextResponse.json({ sizes: uniqueSizes })
  } catch (err) {
    console.error('Filters GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
