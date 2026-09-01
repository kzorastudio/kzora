export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST /api/admin/orders/bulk-print ───────────────────────────────────────────
// Marks a batch of orders as printed. Requires the print_orders capability.
// Atomic single-statement update; idempotent (re-marking is harmless).
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'print_orders')
    if ('response' in auth) return auth.response

    const body = await request.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'لم يتم تحديد أي طلبات' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        printed:     true,
        printed_at:  new Date().toISOString(),
        printed_by_id: auth.session.id,
      })
      .in('id', ids)
      .select('id')

    if (error) {
      console.error('Bulk print update error:', error)
      return NextResponse.json({ error: 'تعذر تحديث حالة الطباعة' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: data?.length ?? 0 })
  } catch (err) {
    console.error('Bulk print unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
