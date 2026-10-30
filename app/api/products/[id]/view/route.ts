import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Atomic increment using RPC
    const { error } = await supabaseAdmin.rpc('increment_product_view', { 
      product_id: id 
    })

    // PGRST202 = the function isn't in the database yet (supabase/add_increment_product_view.sql).
    // Fall back to a read-then-write; a lost increment under concurrency is acceptable for a view counter.
    if (error?.code === 'PGRST202') {
      const { data: product, error: readError } = await supabaseAdmin
        .from('products')
        .select('view_count')
        .eq('id', id)
        .maybeSingle()

      if (readError) {
        console.error('Product view read error:', readError)
        return NextResponse.json({ error: 'Failed to increment view' }, { status: 500 })
      }
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ view_count: (product.view_count ?? 0) + 1 })
        .eq('id', id)

      if (updateError) {
        console.error('Product view update error:', updateError)
        return NextResponse.json({ error: 'Failed to increment view' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (error) {
       console.error('RPC Error incrementing view:', error)
       return NextResponse.json({ error: 'Failed to increment view' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Product view increment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
