import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { getAuthSession } from '@/lib/getSession'

// GET all methods with governorates (admin)
export async function GET() {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select(`
      id, slug, name, description, badge, is_active, sort_order,
      shipping_governorates ( id, governorate_name, is_active, fee_syp, fee_usd, branch_addresses )
    `)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ methods: data })
}

// POST — create a new method
export async function POST(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { slug, name, description, badge, governorates } = body

  const { data: method, error: mErr } = await supabase
    .from('shipping_methods')
    .insert({ slug, name, description, badge: badge || null, sort_order: 99 })
    .select()
    .single()

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  if (governorates?.length) {
    const rows = governorates.map((g: any) => ({
      method_id: method.id,
      governorate_name: typeof g === 'string' ? g : g.name,
      branch_addresses: typeof g === 'string' ? null : (g.branch_addresses || null),
    }))
    await supabase.from('shipping_governorates').insert(rows)
  }

  return NextResponse.json({ method })
}

// PUT — update a method
export async function PUT(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, slug, name, description, badge, is_active, governorates } = body

  const { error: mErr } = await supabase
    .from('shipping_methods')
    .update({ slug, name, description, badge: badge || null, is_active })
    .eq('id', id)

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  // Replace governorates
  if (governorates) {
    await supabase.from('shipping_governorates').delete().eq('method_id', id)
    if (governorates.length > 0) {
      const rows = governorates.map((g: any) => ({
        method_id: id,
        governorate_name: typeof g === 'string' ? g : g.name,
        branch_addresses: typeof g === 'string' ? null : (g.branch_addresses || null),
      }))
      await supabase.from('shipping_governorates').insert(rows)
    }
  }

  return NextResponse.json({ success: true })
}

// DELETE — remove a method
export async function DELETE(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('shipping_methods').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
