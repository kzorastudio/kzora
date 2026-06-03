export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { StaffOrderStat } from '@/types'

// ─── GET /api/admin/staff-orders/stats ───────────────────────────────────────────
// Per-employee performance summary. super_admin only.
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const role = (session as any).role as 'super_admin' | 'employee' | undefined

    // Fetch staff orders (lightweight columns only).
    // Employees only get their own; super_admin gets everyone's.
    let statsQuery = supabaseAdmin
      .from('orders')
      .select('created_by_admin_id, status, total_syp, total_usd')
      .not('created_by_admin_id', 'is', null)

    if (role === 'employee') {
      statsQuery = statsQuery.eq('created_by_admin_id', (session as any).id)
    }

    const { data: orders, error } = await statsQuery

    if (error) {
      console.error('Staff stats fetch error:', error)
      return NextResponse.json({ error: 'تعذر جلب الإحصائيات' }, { status: 500 })
    }

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
      if (o.status === 'delivered') {
        s.delivered_orders += 1
        // Only count delivered orders toward sales
        s.total_sales_syp += o.total_syp || 0
        s.total_sales_usd += o.total_usd || 0
      }
      if (o.status === 'cancelled') s.cancelled_orders += 1
    }

    const stats = Array.from(statMap.values()).sort((a, b) => b.total_orders - a.total_orders)

    return NextResponse.json({ stats })
  } catch (err) {
    console.error('Staff stats unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
