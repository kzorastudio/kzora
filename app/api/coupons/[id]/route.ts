import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'

// ─── PUT /api/coupons/[id] ────────────────────────────────────────────────────
// Admin only. Updates a coupon.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowed = ['code', 'type', 'value', 'min_order_syp', 'max_uses', 'expires_at', 'is_active']

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateFields[key] = key === 'code'
          ? String(body[key]).toUpperCase().trim()
          : body[key]
      }
    }

    if (updateFields.type && !['percentage', 'fixed_amount'].includes(updateFields.type as string)) {
      return NextResponse.json(
        { error: 'type must be "percentage" or "fixed_amount"' },
        { status: 400 }
      )
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error || !coupon) {
      console.error('Coupon update error:', error)
      return NextResponse.json({ error: 'Coupon not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('Coupon PUT [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/coupons/[id] ─────────────────────────────────────────────────
// Admin only.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Coupon delete error:', error)
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Coupon DELETE [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
