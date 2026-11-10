import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { supabaseAdminLive as supabaseAdmin } from '@/lib/supabase'
import { revalidatePath, revalidateTag } from 'next/cache'
import { REVIEW_STATS_TAG } from '@/lib/reviewStats'

export const dynamic = 'force-dynamic'

// GET /api/admin/reviews
// ... (rest of the functions)

// ... existing GET ...
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_catalog')
    if ('response' in auth) return auth.response

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

// PATCH /api/admin/reviews — { id, is_published }: hide a review from the store or show it again
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_catalog')
    if ('response' in auth) return auth.response

    const body = await request.json().catch(() => ({}))
    const id = typeof body?.id === 'string' ? body.id : null
    if (!id || typeof body?.is_published !== 'boolean') {
      return NextResponse.json({ error: 'Missing review ID or visibility' }, { status: 400 })
    }

    const { data: review, error } = await supabaseAdmin
      .from('product_reviews')
      .update({ is_published: body.is_published })
      .eq('id', id)
      .select('id, is_published, products(slug)')
      .single()

    if (error || !review) {
      console.error('Admin Review PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    const slug = (review.products as any)?.slug
    if (slug) revalidatePath(`/product/${slug}`)
    revalidatePath('/')
    revalidatePath('/reviews')
    revalidateTag(REVIEW_STATS_TAG)

    return NextResponse.json({ review: { id: review.id, is_published: review.is_published } })
  } catch (err) {
    console.error('Admin Review PATCH unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews?id=[id]
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'manage_catalog')
    if ('response' in auth) return auth.response

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
    revalidateTag(REVIEW_STATS_TAG)
    revalidatePath('/reviews')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin Review DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
