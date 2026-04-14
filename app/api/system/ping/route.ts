import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, path } = await req.json()
    const ua = req.headers.get('user-agent') || ''
    
    // Basic bot/crawler filtering
    const isBot = /bot|crawler|spider|google|bing|yandex|slurp|duckduckbot|facebookexternalhit|linkedinbot|embedly|lighthouse|headless|screenshot|preview|whatsapp/i.test(ua)
    
    if (isBot) {
      return NextResponse.json({ success: true, skipped: 'bot' })
    }

    // Cooldown check: Don't record same session+path in last 60 seconds
    const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recent } = await supabaseAdmin
      .from('site_visits')
      .select('id')
      .eq('session_id', sessionId)
      .eq('page_path', path)
      .gte('visited_at', minuteAgo)
      .limit(1)

    if (recent && recent.length > 0) {
      return NextResponse.json({ success: true, skipped: 'cooldown' })
    }

    // Simplified visit tracking
    const { error } = await supabaseAdmin
      .from('site_visits')
      .insert({
        session_id: sessionId,
        page_path: path,
        user_agent: ua
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Analytics track error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
