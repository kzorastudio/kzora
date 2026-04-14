export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const governorate = searchParams.get('governorate')
    const type = searchParams.get('type')

    if (type === 'governorates') {
      const { data, error } = await supabaseAdmin
        .from('shipping_centers')
        .select('governorate')
      
      if (error) throw error
      const uniqueGovs = Array.from(new Set((data || []).map(d => (d.governorate || '').trim()))).filter(Boolean).sort()
      return NextResponse.json({ governorates: uniqueGovs })
    }

    let query = supabaseAdmin
      .from('shipping_centers')
      .select('*')
      .order('name', { ascending: true })

    if (governorate) {
      query = query.ilike('governorate', governorate.trim())
    }

    const { data: centers, error } = await query

    if (error) throw error

    return NextResponse.json({ centers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
