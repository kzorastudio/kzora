export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/utils'

// ─── GET /api/loyalty?phone=xxx ───────────────────────────────────────────────
// Public. Returns loyalty status for a customer phone number.
// Returns: confirmed points count, pending points count, has available discount
export async function GET(request: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(request.url)
    const rawPhone = searchParams.get('phone')?.trim()
    const phone = normalizePhone(rawPhone || '')

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Get all loyalty points for this phone
    const { data: points, error } = await supabaseAdmin
      .from('loyalty_points')
      .select('id, status, cycle_used, created_at, order_id')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Loyalty GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch loyalty' }, { status: 500 })
    }

    const allPoints = points || []

    // Count confirmed points that haven't been used in a completed cycle
    const confirmedUnused = allPoints.filter(p => p.status === 'confirmed' && !p.cycle_used)
    const pendingPoints = allPoints.filter(p => p.status === 'pending')

    const confirmedCount = confirmedUnused.length
    const pendingCount = pendingPoints.length

    // After every 3 confirmed (unused) orders, customer earns a discount
    // The discount is available when confirmedCount >= 3
    const hasDiscount = confirmedCount >= 3

    // Calculate how many points are in the current progress (0, 1, or 2)
    const currentProgress = confirmedCount % 3
    // But if hasDiscount is true, progress is "3" (ready to redeem)
    const progressDisplay = hasDiscount ? 3 : currentProgress

    return NextResponse.json({
      confirmed_count: confirmedCount,
      pending_count: pendingCount,
      current_progress: progressDisplay,
      has_discount: hasDiscount,
      discount_amount: hasDiscount ? 1000 : 0,
      total_points: allPoints.length,
    })
  } catch (err) {
    console.error('Loyalty GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
