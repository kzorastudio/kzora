export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeAnyAdmin } from '@/lib/adminGuard'
import { isOwnOrdersOnly } from '@/lib/permissions'
import { supabaseAdmin, fetchAllRows } from '@/lib/supabase'
import type { StaffOrderStat } from '@/types'

// ─── GET /api/admin/staff-orders/stats ───────────────────────────────────────────
// Per-employee performance summary. super_admin only.
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAnyAdmin(request)
    if ('response' in auth) return auth.response
    const { session } = auth

    // Optional ?month=YYYY-MM — bounds are midnight Syria time (UTC+3, no DST).
    const month = request.nextUrl.searchParams.get('month')
    let range: { from: string; to: string } | null = null
    if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      const [y, m] = month.split('-').map(Number)
      const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
      range = { from: `${month}-01T00:00:00+03:00`, to: `${next}-01T00:00:00+03:00` }
    }

    // Fetch ALL staff orders (lightweight columns only) using fetchAllRows
    // to bypass PostgREST's default 1000-row limit.
    const orders = await fetchAllRows((from, to) => {
      let q = supabaseAdmin
        .from('orders')
        .select('created_by_admin_id, status, total_syp, total_usd, created_at')
        .not('created_by_admin_id', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (range) q = q.gte('created_at', range.from).lt('created_at', range.to)
      if (isOwnOrdersOnly(session.role)) {
        q = q.eq('created_by_admin_id', session.id)
      }
      return q
    })

    // Fetch admin names
    const { data: admins } = await supabaseAdmin
      .from('admins')
      .select('id, name')

    const nameMap = new Map((admins || []).map((a: any) => [a.id, a.name]))

    const statMap = new Map<string, StaffOrderStat>()
    for (const o of orders || []) {
      const id = o.created_by_admin_id as string
      if (!statMap.has(id)) {
        statMap.set(id, {
          admin_id: id,
          admin_name: nameMap.get(id) || 'موظف محذوف',
          total_orders: 0,
          delivered_orders: 0,
          cancelled_orders: 0,
          total_sales_syp: 0,
          total_sales_usd: 0,
        })
      }
      const s = statMap.get(id)!
      s.total_orders += 1
      if (o.status === 'delivered') s.delivered_orders += 1
      if (o.status === 'cancelled') {
        s.cancelled_orders += 1
      } else {
        // Sales = every order that wasn't cancelled. Staff rarely move orders to
        // 'delivered', so counting only delivered left sales near zero.
        s.total_sales_syp += o.total_syp || 0
        s.total_sales_usd += o.total_usd || 0
      }
    }

    const stats = Array.from(statMap.values()).sort((a, b) => b.total_orders - a.total_orders)

    return NextResponse.json({ stats })
  } catch (err) {
    console.error('Staff stats unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
