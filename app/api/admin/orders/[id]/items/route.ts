export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

const norm = (s: string | null) => (s || '').trim()

// Use the client-provided manual price when it's a valid non-negative number, else the product's DB price.
const priceOf = (v: unknown, fallback: number): number => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

// ─── PUT /api/admin/orders/[id]/items ─────────────────────────────────────────────
// Edits the products of a STAFF order with full inventory reconciliation:
//  • returns the old items' quantities back to stock
//  • deducts the new items' quantities from stock
//  • validates availability, updates out_of_stock/in_stock status
//  • recomputes order totals (staff orders = subtotal + shipping, no discounts)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session as any).role as 'super_admin' | 'employee' | undefined
    const { id } = params
    const body = await request.json()
    const newItemsRaw: {
      product_id: string; color: string | null; size: number | null; quantity: number
      unit_price_syp?: number; unit_price_usd?: number
    }[] = Array.isArray(body?.items) ? body.items : []
    // Optional: change the order's currency (no exchange rate — just which price column the order uses).
    const currencyUsed: 'SYP' | 'USD' | null =
      body?.currency === 'USD' ? 'USD' : body?.currency === 'SYP' ? 'SYP' : null

    if (newItemsRaw.length === 0) {
      return NextResponse.json({ error: 'يجب أن يحتوي الطلب على منتج واحد على الأقل' }, { status: 400 })
    }

    // ── Fetch order ──────────────────────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, created_by_admin_id, shipping_fee_syp, shipping_fee_usd, is_reservation, discount_amount_syp, discount_amount_usd')
      .eq('id', id)
      .single()

    if (orderErr || !order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    // Reservation orders never touched inventory, so editing them must not either.
    const isReservation = order.is_reservation === true

    // Editing is allowed for both staff orders and store (customer) orders.
    // Ownership: employees can only edit their own staff orders. Store orders
    // (created_by_admin_id == null) are never owned by an employee, so this also
    // blocks employees from editing customer orders.
    if (role === 'employee' && order.created_by_admin_id !== (session as any).id) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل هذا الطلب' }, { status: 403 })
    }

    // ── Fetch current items ──────────────────────────────────────────────────────
    const { data: oldItems, error: oldErr } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id, color, size, quantity')
      .eq('order_id', id)
    if (oldErr) return NextResponse.json({ error: 'تعذر جلب عناصر الطلب' }, { status: 500 })

    // ── Fetch involved products (old + new) ──────────────────────────────────────
    const productIds = Array.from(new Set([
      ...(oldItems || []).map((i) => i.product_id).filter(Boolean) as string[],
      ...newItemsRaw.map((i) => i.product_id),
    ]))

    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, price_syp, price_usd, discount_price_syp, discount_price_usd, stock_status,
        variants:product_variants(id, color, size, quantity),
        images:product_images(url, is_main)
      `)
      .in('id', productIds)
    if (prodErr) return NextResponse.json({ error: 'تعذر التحقق من المنتجات' }, { status: 500 })

    const productMap = new Map((dbProducts || []).map((p: any) => [p.id, p]))

    // Maps for stock reconciliation
    const variantQty = new Map<string, number>()      // variantId -> current quantity
    const variantProduct = new Map<string, string>()  // variantId -> product_id
    for (const p of dbProducts || []) {
      for (const v of (p as any).variants || []) {
        variantQty.set(v.id, v.quantity ?? 0)
        variantProduct.set(v.id, p.id)
      }
    }

    // delta[variantId] = (returns from old) - (takes for new). Positive = back to stock.
    const delta = new Map<string, number>()
    const addDelta = (vid: string, d: number) => delta.set(vid, (delta.get(vid) || 0) + d)

    // ── Returns from old items (skipped for reservations — they never deducted) ──
    if (!isReservation) {
      for (const it of oldItems || []) {
        const p = productMap.get(it.product_id)
        if (!p || !p.variants?.length) continue
        const v = p.variants.find((x: any) => norm(x.color) === norm(it.color) && (x.size || 0) === (it.size || 0))
        if (v) addDelta(v.id, it.quantity)
      }
    }

    // ── Validate new items + takes ───────────────────────────────────────────────
    const sanitizedNew: {
      product_id: string; product_name: string; product_image: string | null
      color: string | null; size: number | null; quantity: number
      unit_price_syp: number; unit_price_usd: number
    }[] = []

    for (const it of newItemsRaw) {
      const p = productMap.get(it.product_id)
      const qty = Math.max(1, Number(it.quantity) || 0)
      if (!p) return NextResponse.json({ error: 'أحد المنتجات غير موجود' }, { status: 400 })

      // Reservations may include sizes/colors with no variant yet; they don't deduct stock.
      if (!isReservation && p.variants?.length) {
        const v = p.variants.find((x: any) => norm(x.color) === norm(it.color) && (x.size || 0) === (it.size || 0))
        const label = `${p.name}${it.color ? ` - ${it.color}` : ''}${it.size ? ` - مقاس ${it.size}` : ''}`
        if (!v) return NextResponse.json({ error: `التركيبة غير متوفرة: ${label}` }, { status: 400 })
        addDelta(v.id, -qty)
      }

      const mainImage = (p.images || []).find((im: any) => im.is_main)?.url || (p.images || [])[0]?.url || null
      sanitizedNew.push({
        product_id:     it.product_id,
        product_name:   p.name,
        product_image:  mainImage,
        color:          it.color || null,
        size:           it.size || null,
        quantity:       qty,
        unit_price_syp: priceOf(it.unit_price_syp, p.discount_price_syp ?? p.price_syp),
        unit_price_usd: priceOf(it.unit_price_usd, p.discount_price_usd ?? p.price_usd),
      })
    }

    // ── Stock validation + updates (skipped entirely for reservations) ───────────
    if (!isReservation) {
      // Validate final stock (no negative)
      for (const [vid, d] of Array.from(delta.entries())) {
        const final = (variantQty.get(vid) ?? 0) + d
        if (final < 0) {
          const pid = variantProduct.get(vid)
          const pName = productMap.get(pid as string)?.name || 'المنتج'
          return NextResponse.json(
            { error: `الكمية المطلوبة من "${pName}" تتجاوز المتاح في المخزون` },
            { status: 400 }
          )
        }
      }

      // Apply variant stock updates
      const affectedProducts = new Set<string>()
      for (const [vid, d] of Array.from(delta.entries())) {
        if (d === 0) continue
        const final = (variantQty.get(vid) ?? 0) + d
        await supabaseAdmin.from('product_variants').update({ quantity: final }).eq('id', vid)
        affectedProducts.add(variantProduct.get(vid) as string)
      }

      // Re-evaluate stock_status for affected products
      for (const pid of Array.from(affectedProducts)) {
        const { data: vs } = await supabaseAdmin.from('product_variants').select('quantity').eq('product_id', pid)
        if (!vs) continue
        const total = vs.reduce((s: number, v: any) => s + (v.quantity ?? 0), 0)
        const current = productMap.get(pid)?.stock_status
        if (total <= 0) {
          await supabaseAdmin.from('products').update({ stock_status: 'out_of_stock' }).eq('id', pid)
        } else if (current === 'out_of_stock') {
          await supabaseAdmin.from('products').update({ stock_status: 'in_stock' }).eq('id', pid)
        }
        revalidatePath('/')
        revalidatePath('/products')
      }
    }

    // ── Replace order items (delete old first, then insert new to prevent duplication) ────
    const oldIds = (oldItems || []).map((i) => i.id)
    if (oldIds.length > 0) {
      const { error: delErr } = await supabaseAdmin.from('order_items').delete().in('id', oldIds)
      if (delErr) {
        console.error('Items edit delete error:', delErr)
        return NextResponse.json({ error: 'تعذر حذف المنتجات القديمة' }, { status: 500 })
      }
    }

    const { error: insErr } = await supabaseAdmin.from('order_items').insert(
      sanitizedNew.map((it) => ({
        order_id:       id,
        product_id:     it.product_id,
        product_name:   it.product_name,
        product_image:  it.product_image,
        color:          it.color,
        size:           it.size,
        quantity:       it.quantity,
        unit_price_syp: it.unit_price_syp,
        unit_price_usd: it.unit_price_usd,
      }))
    )
    if (insErr) {
      console.error('Items edit insert error:', insErr)
      return NextResponse.json({ error: 'تعذر حفظ المنتجات الجديدة' }, { status: 500 })
    }

    // ── Recompute totals ─────────────────────────────────────────────────────────
    // total = new subtotal − stored discount + shipping. The stored discount amount
    // (coupon + loyalty + multi-piece for store orders, multi-piece for staff orders)
    // is preserved as-is so manual item edits don't silently wipe an applied discount.
    const subtotalSyp = sanitizedNew.reduce((s, i) => s + i.unit_price_syp * i.quantity, 0)
    const subtotalUsd = sanitizedNew.reduce((s, i) => s + i.unit_price_usd * i.quantity, 0)
    const discountSyp = order.discount_amount_syp || 0
    const discountUsd = order.discount_amount_usd || 0
    const totalSyp = Math.max(0, subtotalSyp - discountSyp + (order.shipping_fee_syp || 0))
    const totalUsd = Math.max(0, parseFloat((subtotalUsd - discountUsd + (order.shipping_fee_usd || 0)).toFixed(2)))

    await supabaseAdmin
      .from('orders')
      .update({
        subtotal_syp: subtotalSyp,
        subtotal_usd: subtotalUsd,
        total_syp:    totalSyp,
        total_usd:    totalUsd,
        ...(currencyUsed ? { currency_used: currencyUsed } : {}),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Order items PUT unexpected error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
