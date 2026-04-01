import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

// GET /api/admin/reviews
// ... (rest of the functions)

// ... existing GET ...
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page  = parseInt(searchParams.get('page') || '1', 10)
    const limit = 50
    const offset = (page - 1) * limit

    const { data: reviews, error, count } = await supabaseAdmin
      .from('product_reviews')
      .select('*, products(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Admin Reviews GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({
      reviews,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    console.error('Admin Reviews GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews?id=[id]
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing review ID' }, { status: 400 })
    }

    // Get the product_id/slug before deleting so we can revalidate
    const { data: reviewToDel } = await supabaseAdmin
      .from('product_reviews')
      .select('product_id, products(slug)')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Admin Review DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }

    // Revalidate the product page if we have the slug
    const slug = (reviewToDel?.products as any)?.slug
    if (slug) {
      revalidatePath(`/product/${slug}`)
      revalidatePath('/') // And homepage
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin Review DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
