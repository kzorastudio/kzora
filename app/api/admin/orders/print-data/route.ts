export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST /api/admin/orders/print-data ───────────────────────────────────────────
// Returns full orders (with items) for a set of IDs, for the print-preparation page.
// super_admin only. Does NOT change any data.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح لك بهذا الإجراء' }, { status: 403 })
    }

    const body = await request.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'لم يتم تحديد أي طلبات' }, { status: 400 })
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
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
