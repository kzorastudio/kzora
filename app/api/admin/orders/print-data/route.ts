export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST /api/admin/orders/print-data ───────────────────────────────────────────
// Returns full orders (with items) for a set of IDs, for the print-preparation page.
// Requires the print_orders capability. Does NOT change any data.
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'print_orders')
    if ('response' in auth) return auth.response

    const body = await request.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'لم يتم تحديد أي طلبات' }, { status: 400 })
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(
            id,
            name,
            category_id,
            is_published,
            category:categories(id, name_ar, slug)
          )
        )
      `)
      .in('id', ids)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Print-data fetch error:', error)
      return NextResponse.json({ error: 'تعذر جلب بيانات الطلبات' }, { status: 500 })
    }

    return NextResponse.json({ orders: orders ?? [] })
  } catch (err) {
    console.error('Print-data unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
