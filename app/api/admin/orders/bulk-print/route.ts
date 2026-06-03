export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST /api/admin/orders/bulk-print ───────────────────────────────────────────
// Marks a batch of orders as printed. super_admin only.
// Atomic single-statement update; idempotent (re-marking is harmless).
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

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        printed:     true,
        printed_at:  new Date().toISOString(),
        printed_by_id: (session as any).id,
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
