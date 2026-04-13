export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const governorate = searchParams.get('governorate')

    let query = supabaseAdmin
      .from('shipping_centers')
      .select('*')
      .order('name', { ascending: true })

    if (governorate) {
      query = query.eq('governorate', governorate)
    }

    const { data: centers, error } = await query

    if (error) throw error

    return NextResponse.json({ centers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
