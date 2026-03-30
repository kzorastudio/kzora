export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'

// â”€â”€â”€ GET /api/coupons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(_request: NextRequest) {
  try {
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Coupons GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    return NextResponse.json({ coupons })
  } catch (err) {
    console.error('Coupons GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// â”€â”€â”€ POST /api/coupons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { code, type, value, min_order_syp, max_uses, expires_at, is_active } = body

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields: code, type, value' }, { status: 400 })
    }

    if (!['percentage', 'fixed_amount'].includes(type)) {
      return NextResponse.json({ error: 'type must be "percentage" or "fixed_amount"' }, { status: 400 })
    }

    if (type === 'percentage' && (value <= 0 || value > 100)) {
      return NextResponse.json({ error: 'Percentage value must be between 1 and 100' }, { status: 400 })
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code:          code.toUpperCase().trim(),
        type,
        value,
        min_order_syp: min_order_syp ?? 0,
        max_uses:      max_uses      ?? null,
        used_count:    0,
        expires_at:    expires_at    || null,
        is_active:     is_active     ?? true,
        auto_generated: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Coupon insert error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err) {
    console.error('Coupons POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

