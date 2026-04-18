import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, path } = body
    const ua = req.headers.get('user-agent') || ''
    
    // Validate required fields
    if (!sessionId || !path) {
      return NextResponse.json({ success: false, error: 'missing fields' }, { status: 400 })
    }

    // Basic bot/crawler filtering
    const isBot = /bot|crawler|spider|google|bing|yandex|slurp|duckduckbot|facebookexternalhit|linkedinbot|embedly|lighthouse|headless|screenshot|preview|whatsapp/i.test(ua)
    
    if (isBot) {
      return NextResponse.json({ success: true, skipped: 'bot' })
    }

    // Cooldown check: Don't record same session+path in last 30 seconds
    const cooldownTime = new Date(Date.now() - 30 * 1000).toISOString()
    const { data: recent } = await supabaseAdmin
      .from('site_visits')
      .select('id')
      .eq('session_id', sessionId)
      .eq('page_path', path)
      .gte('visited_at', cooldownTime)
      .limit(1)

    if (recent && recent.length > 0) {
      return NextResponse.json({ success: true, skipped: 'cooldown' })
    }

    // Insert the visit
    const { error } = await supabaseAdmin
      .from('site_visits')
      .insert({
        session_id: sessionId,
        page_path: path,
        user_agent: ua
      })

    if (error) {
      console.error('Analytics insert error:', error.message, error.details, error.hint)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, recorded: true })
  } catch (err: any) {
    console.error('Analytics track error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
