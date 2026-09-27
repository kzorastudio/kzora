export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * slug → display name for EVERY shipping company, including disabled ones, so
 * old orders keep showing the right name after a company is switched off.
 * Companies added from the admin panel get auto slugs like "shipping-muft79u6",
 * which must never reach the UI — screens resolve names through this endpoint.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('shipping_methods')
      .select('slug, name')

    if (error) throw error

    const names: Record<string, string> = {}
    for (const m of data || []) {
      if (m.slug && m.name) names[m.slug] = m.name
    }

    return NextResponse.json({ names }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ names: {}, error: error.message }, { status: 500 })
  }
}
