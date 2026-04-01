import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/products/[id]/reviews
// Public. Returns reviews for a specific product.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: reviews, error } = await supabaseAdmin
      .from('product_reviews')
      .select('*')
      .eq('product_id', id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Reviews GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Calculate metadata
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0

    return NextResponse.json({ 
      reviews,
      metadata: {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1))
      }
    })
  } catch (err) {
    console.error('Reviews GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/products/[id]/reviews
// Public. Submit a new review.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { user_name, rating, comment } = body

    if (!user_name || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }

    const { data: review, error } = await supabaseAdmin
      .from('product_reviews')
      .insert({
        product_id: id,
        user_name,
        rating,
        comment,
        is_published: true // Auto-publish for now
      })
      .select()
      .single()

    if (error) {
      console.error('Review POST error:', error)
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (err) {
    console.error('Review POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
