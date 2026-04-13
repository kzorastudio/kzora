import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, path } = await req.json()

    // Simplified visit tracking
    const { error } = await supabaseAdmin
      .from('site_visits')
      .insert({
        session_id: sessionId,
        page_path: path
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Analytics track error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
