import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST /api/coupons/validate ───────────────────────────────────────────────
// Public. Validates a coupon code without applying it.
// Body: { code, order_total_syp, order_total_usd }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, order_total_syp, order_total_usd } = body as {
      code: string
      order_total_syp: number
      order_total_usd: number
    }

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'يرجى إدخال كود الخصم' },
        { status: 400 }
      )
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ valid: false, message: 'كود الخصم غير صالح' })
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, message: 'انتهت صلاحية كود الخصم' })
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, message: 'تم استنفاد عدد مرات استخدام هذا الكوبون' })
    }

    // Check minimum order
    const orderSyp = Number(order_total_syp) || 0
    const orderUsd = Number(order_total_usd) || 0

    if (orderSyp < coupon.min_order_syp) {
      return NextResponse.json({
        valid: false,
        message: `الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${coupon.min_order_syp.toLocaleString('ar-SY')} ل.س.ج`,
      })
    }

    // Calculate discount
    let discount_syp = 0
    let discount_usd = 0

    if (coupon.type === 'percentage') {
      discount_syp = Math.round((orderSyp * coupon.value) / 100)
      discount_usd = parseFloat(((orderUsd * coupon.value) / 100).toFixed(2))
    } else {
      // fixed_amount — value stored in SYP
      discount_syp = Math.min(coupon.value, orderSyp)
      const ratio  = orderSyp > 0 ? orderUsd / orderSyp : 0
      discount_usd = parseFloat((discount_syp * ratio).toFixed(2))
    }

    return NextResponse.json({
      valid: true,
      coupon,
      discount_syp,
      discount_usd,
    })
  } catch (err) {
    console.error('Coupon validate unexpected error:', err)
    return NextResponse.json(
      { valid: false, message: 'حدث خطأ في التحقق من الكوبون' },
      { status: 500 }
    )
  }
}
