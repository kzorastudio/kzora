export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// â”€â”€â”€ GET /api/keep-alive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Called by Vercel Cron every 3 days to keep Supabase free-tier DB active.
// Protected by CRON_SECRET so only Vercel can trigger it.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Lightweight ping â€” just count products, doesn't load data
    const { count, error } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      pingedAt: new Date().toISOString(),
      productsCount: count,
    })
  } catch (err) {
    console.error('[keep-alive] Supabase ping failed:', err)
    return NextResponse.json({ ok: false, error: 'Ping failed' }, { status: 500 })
  }
}

