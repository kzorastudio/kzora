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
