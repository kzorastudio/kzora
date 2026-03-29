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

    // Increment view_count using Supabase RPC or direct update
    // We use a raw SQL approach through Supabase to ensure atomic increment
    const { error } = await supabaseAdmin.rpc('increment_product_view', { x: 1, product_id: id })

    // If RPC doesn't exist, fallback to a simple update (though RPC is safer for concurrency)
    if (error) {
       await supabaseAdmin
        .from('products')
        .update({ view_count: supabaseAdmin.rpc('increment', { row_id: id }) }) // Note: This is an illustration, actually we'll use a direct increment if RPC fails
        .eq('id', id)
        
        // Let's use a simpler way that works directly if RPC isn't set up yet
        const { data: current } = await supabaseAdmin.from('products').select('view_count').eq('id', id).single()
        await supabaseAdmin.from('products').update({ view_count: (current?.view_count || 0) + 1 }).eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Product view increment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
