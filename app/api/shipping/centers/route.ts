export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const governorate = searchParams.get('governorate')
    const type = searchParams.get('type')

    if (type === 'governorates') {
      const [centersRes, govsRes] = await Promise.all([
        supabaseAdmin.from('shipping_centers').select('governorate'),
        supabaseAdmin
          .from('shipping_governorates')
          .select('governorate_name, is_active, shipping_methods!inner(is_active)')
          .eq('is_active', true)
          .eq('shipping_methods.is_active', true),
      ])

      if (centersRes.error) throw centersRes.error
      if (govsRes.error) throw govsRes.error

      const fromCenters = (centersRes.data || []).map(d => (d.governorate || '').trim())
      const fromMethods = (govsRes.data || []).map((d: any) => (d.governorate_name || '').trim())

      const uniqueGovs = Array.from(new Set([...fromCenters, ...fromMethods]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'ar'))

      return NextResponse.json({ governorates: uniqueGovs }, { headers: NO_CACHE_HEADERS })
    }

    let query = supabaseAdmin
      .from('shipping_centers')
      .select('*')
      .order('name', { ascending: true })

    if (governorate) {
      query = query.eq('governorate', governorate.trim())
    }

    const { data: centers, error } = await query

    if (error) throw error

    return NextResponse.json({ centers }, { headers: NO_CACHE_HEADERS })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}
