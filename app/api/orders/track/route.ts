export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── GET /api/orders/track?phone=09XXXXXXXX ───────────────────────────────────
// Public endpoint. Returns orders for the given phone number.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')?.trim()

    if (!phone || phone.length < 6) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم هاتف صحيح' },
        { status: 400 }
      )
    }

    // Fetch orders matching the phone number, newest first
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        order_number,
        customer_full_name,
        customer_phone,
        customer_governorate,
        customer_address,
        shipping_company,
        coupon_code,
        discount_amount_syp,
        discount_amount_usd,
        subtotal_syp,
        subtotal_usd,
        total_syp,
        total_usd,
        currency_used,
        status,
        notes,
        created_at,
        updated_at,
        items:order_items(
          id,
          product_name,
          product_image,
          color,
          size,
          quantity,
          unit_price_syp,
          unit_price_usd
        ),
        status_history:order_status_history(
          id,
          status,
          changed_at
        )
        `
      )
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Track orders error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء البحث عن الطلبات' },
        { status: 500 }
      )
    }

    // Sort status history ascending for each order
    if (orders) {
      for (const order of orders) {
        if (order.status_history) {
          order.status_history.sort(
            (a: { changed_at: string }, b: { changed_at: string }) =>
              new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
          )
        }
      }
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (err) {
    console.error('Track orders unexpected error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
