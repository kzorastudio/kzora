import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: methods, error: methodsError } = await supabase
      .from('shipping_methods')
      .select(`
        id,
        slug,
        name,
        description,
        badge,
        sort_order,
        shipping_governorates (
          governorate_name,
          fee_syp,
          fee_usd,
          is_active,
          branch_addresses
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (methodsError) throw methodsError

    // Filter active governorates only and simplify structure
    const formatted = (methods || []).map(m => ({
      ...m,
      governorates: m.shipping_governorates
        .filter((g: any) => g.is_active)
        .map((g: any) => ({
          name: g.governorate_name,
          fee_syp: g.fee_syp,
          fee_usd: g.fee_usd,
          branch_addresses: g.branch_addresses
        }))
    }))

    return NextResponse.json({ methods: formatted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
