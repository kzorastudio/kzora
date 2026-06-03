export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'

// ─── GET /api/admin/employees ────────────────────────────────────────────────────
// Returns the list of admins (for the super_admin "filter by employee" dropdown).
// super_admin only.
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, name, email, role')
      .order('name', { ascending: true })

    if (error) {
      console.error('Employees list error:', error)
      return NextResponse.json({ error: 'تعذر جلب الموظفين' }, { status: 500 })
    }

    return NextResponse.json({ employees: data ?? [] })
  } catch (err) {
    console.error('Employees list unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
