export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

const norm = (s: string | null) => (s || '').trim()

// ─── POST /api/admin/orders/[id]/confirm-reservation ──────────────────────────────
// Turns a ghost/reservation order into a real order:
//  • re-checks current availability for every item (stock may have changed)
//  • deducts the items' quantities from inventory (like a normal order)
//  • flips is_reservation = false
// If any item's size/color is unavailable or short on stock, nothing is changed and
// a clear error is returned so the admin can restock first.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session as any).role as 'super_admin' | 'employee' | undefined
    const { id } = params

    // ── Fetch order ──────────────────────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, created_by_admin_id, is_reservation')
      .eq('id', id)
      .single()

    if (orderErr || !order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    if (!order.is_reservation) {
      return NextResponse.json({ error: 'هذا الطلب ليس حجزاً مبدئياً' }, { status: 400 })
    }
    // Ownership: employees can only confirm their own reservations.
    if (role === 'employee' && order.created_by_admin_id !== (session as any).id) {
      return NextResponse.json({ error: 'غير مصرح لك بتثبيت هذا الطلب' }, { status: 403 })
    }

    // ── Fetch items ──────────────────────────────────────────────────────────────
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('product_id, product_name, color, size, quantity')
      .eq('order_id', id)
    if (itemsErr) return NextResponse.json({ error: 'تعذر جلب عناصر الطلب' }, { status: 500 })
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'الطلب لا يحتوي على منتجات' }, { status: 400 })
    }

    // ── Fetch involved products + variants ───────────────────────────────────────
    const productIds = Array.from(new Set(items.map((i) => i.product_id).filter(Boolean) as string[]))
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, stock_status, variants:product_variants(id, color, size, quantity)')
      .in('id', productIds)
    if (prodErr) return NextResponse.json({ error: 'تعذر التحقق من المنتجات' }, { status: 500 })

    const productMap = new Map((dbProducts || []).map((p: any) => [p.id, p]))

    // ── Validate availability + compute deductions (no DB writes yet) ────────────
    const deductions: { variantId: string; quantity: number; productId: string; productName: string }[] = []
    for (const it of items) {
      const p = productMap.get(it.product_id as string)
      const label = `${it.product_name}${it.color ? ` - ${it.color}` : ''}${it.size ? ` - مقاس ${it.size}` : ''}`
      if (!p) return NextResponse.json({ error: `المنتج "${it.product_name}" لم يعد موجوداً` }, { status: 400 })

      const variantsList: any[] = p.variants || []
      // Products without variants are treated as always-available (no per-size stock).
      if (variantsList.length === 0) continue

      const v = variantsList.find(
        (x: any) => norm(x.color) === norm(it.color) && (x.size || 0) === (it.size || 0)
      )
      if (!v) {
        return NextResponse.json(
          { error: `المقاس/اللون "${label}" غير موجود في المخزون — أضِفه للمخزون أولاً ثم ثبّت الطلب.` },
          { status: 400 }
        )
      }
      const available = v.quantity ?? 0
      if (it.quantity > available) {
        return NextResponse.json(
          { error: `الكمية المطلوبة من "${label}" (${it.quantity}) تتجاوز المتاح (${available}) — أضِف للمخزون أولاً.` },
          { status: 400 }
        )
      }
      deductions.push({
        variantId: v.id,
        quantity: it.quantity,
        productId: it.product_id as string,
        productName: label,
      })
    }

    // ── Apply deductions atomically (prevents overselling on concurrent confirms) ─
    // The pre-checks above give friendly per-item messages, but reserve_stock is the
    // real guard: it re-checks and decrements in one all-or-nothing transaction.
    const affectedProducts = new Set<string>()
    if (deductions.length > 0) {
      const reservePayload = deductions.map((d) => ({
        variant_id: d.variantId,
        quantity: d.quantity,
        product_name: d.productName,
      }))
      const { error: reserveError } = await supabaseAdmin.rpc('reserve_stock', { p_items: reservePayload })
      if (reserveError) {
        const soldOutName = reserveError.message?.split('OUT_OF_STOCK:')[1]?.trim()
        return NextResponse.json(
          {
            error: soldOutName
              ? `الكمية المتاحة من "${soldOutName}" لم تعد كافية — أضِف للمخزون ثم ثبّت الطلب.`
              : 'الكمية لم تعد كافية. أضِف للمخزون ثم حاول مجدداً.',
          },
          { status: 409 }
        )
      }
      deductions.forEach((d) => affectedProducts.add(d.productId))
    }

    // ── Re-evaluate stock_status for affected products ───────────────────────────
    for (const pid of Array.from(affectedProducts)) {
      const { data: vs } = await supabaseAdmin.from('product_variants').select('quantity').eq('product_id', pid)
      if (!vs) continue
      const total = vs.reduce((s: number, v: any) => s + (v.quantity ?? 0), 0)
      if (total <= 0) {
        await supabaseAdmin.from('products').update({ stock_status: 'out_of_stock' }).eq('id', pid)
      }
      revalidatePath('/')
      revalidatePath('/products')
    }

    // ── Promote reservation to a normal order ────────────────────────────────────
    await supabaseAdmin
      .from('orders')
      .update({ is_reservation: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Confirm reservation unexpected error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
