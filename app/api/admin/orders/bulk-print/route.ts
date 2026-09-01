export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/lib/adminGuard'
import { supabaseAdmin } from '@/lib/supabase'

/** Printing a label means the parcel is on its way, so these statuses advance to
 *  'shipped'. 'delivered' and 'cancelled' are final states and are never touched. */
const ADVANCES_TO_SHIPPED = ['pending', 'confirmed']

// ─── POST /api/admin/orders/bulk-print ───────────────────────────────────────────
// Marks a batch of orders as printed. Requires the print_orders capability.
// Idempotent (re-marking is harmless).
//
// Confirming the print also moves pending/confirmed orders to 'shipped' and writes
// a status-history row, so the customer sees "تم الشحن" on the tracking page.
//
// It deliberately does NOT send the Meta Purchase event that a manual status change
// sends: a print batch is mostly phone orders created by staff, which never came
// from an ad. Firing a burst of Purchase events for them would corrupt ad attribution.
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(request, 'print_orders')
    if ('response' in auth) return auth.response

    const body = await request.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'لم يتم تحديد أي طلبات' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        printed:     true,
        printed_at:  now,
        printed_by_id: auth.session.id,
      })
      .in('id', ids)
      .select('id')

    if (error) {
      console.error('Bulk print update error:', error)
      return NextResponse.json({ error: 'تعذر تحديث حالة الطباعة' }, { status: 500 })
    }

    // ── Advance to "shipped" ───────────────────────────────────────────────────
    // Soft-fail: the print itself is already saved, so a failure here must not
    // turn a successful print into an error for the user.
    let shipped = 0
    try {
      const { data: advanced } = await supabaseAdmin
        .from('orders')
        .update({ status: 'shipped', updated_at: now })
        .in('id', ids)
        .in('status', ADVANCES_TO_SHIPPED)   // never touches delivered/cancelled
        .select('id')

      const advancedIds = (advanced ?? []).map((o: { id: string }) => o.id)
      shipped = advancedIds.length

      if (advancedIds.length > 0) {
        await supabaseAdmin
          .from('order_status_history')
          .insert(advancedIds.map((orderId) => ({
            order_id:   orderId,
            status:     'shipped',
            changed_at: now,
          })))
      }
    } catch (e) {
      console.error('Bulk print status advance soft fail:', e)
    }

    return NextResponse.json({ success: true, updated: data?.length ?? 0, shipped })
  } catch (err) {
    console.error('Bulk print unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
