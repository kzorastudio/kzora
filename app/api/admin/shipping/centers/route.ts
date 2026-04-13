export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthSession } from '@/lib/getSession'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('shipping_centers')
    .select('*')
    .order('governorate', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ centers: data })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { governorate, name, supported_companies } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('shipping_centers')
    .insert({ governorate, name, supported_companies })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ center: data })
}

export async function PUT(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, governorate, name, supported_companies } = await req.json()
  const { error } = await supabaseAdmin
    .from('shipping_centers')
    .update({ governorate, name, supported_companies })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabaseAdmin.from('shipping_centers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
