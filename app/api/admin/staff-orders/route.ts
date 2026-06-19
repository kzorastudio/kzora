export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { CreateStaffOrderPayload } from '@/types'
import { normalizePhone } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

// ─── GET /api/admin/staff-orders ────────────────────────────────────────────────
// Returns staff-created orders. Employees see only their own; super_admin sees all
// staff orders, optionally filtered by a specific employee.
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session as any).role as 'super_admin' | 'employee' | undefined
    const { searchParams } = new URL(request.url)
    const page    = parseInt(searchParams.get('page')  || '1', 10)
    const limit   = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const status  = searchParams.get('status')
    const search  = searchParams.get('search')
    const printed = searchParams.get('printed')
    const employee = searchParams.get('employee') // super_admin only
    const offset  = (page - 1) * limit

    let query = supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)', { count: 'exact' })
      .not('created_by_admin_id', 'is', null) // staff orders only
      .order('created_at', { ascending: false })

    if (role === 'employee') {
      query = query.eq('created_by_admin_id', (session as any).id)
    } else if (employee) {
      query = query.eq('created_by_admin_id', employee)
    }

    if (status)             query = query.eq('status', status)
    if (printed === 'true')  query = query.eq('printed', true)
    if (printed === 'false') query = query.eq('printed', false)
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_full_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
      )
    }

    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query
    if (error) {
      console.error('Staff orders GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    console.error('Staff orders GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/staff-orders ─────────────────────────────────────────────────
// Creates a manual order on behalf of a customer.
// IMPORTANT: skips ALL loyalty, coupons, and multi-item discounts.
// Prices are resolved server-side from the database (no manual pricing).
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminId = (session as any).id as string

    const body: CreateStaffOrderPayload = await request.json()
    const {
      items, customer, delivery_type, shipping_company,
      payment_method, currency_used, notes,
    } = body
    // Ghost/reservation order: skip stock validation + deduction; allow out-of-stock sizes.
    const isReservation = body.is_reservation === true

    // When the fee is "determined with the seller" (e.g. 4+ pieces shipping),
    // store 0 and flag it — mirrors the public checkout behaviour.
    const shippingFeeDetermined = body.shipping_fee_determined === true
    const shippingFeeSyp = shippingFeeDetermined ? 0 : Math.max(0, Number(body.shipping_fee_syp) || 0)
    const shippingFeeUsd = shippingFeeDetermined ? 0 : Math.max(0, Number(body.shipping_fee_usd) || 0)

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'يجب إضافة منتج واحد على الأقل' }, { status: 400 })
    }
    if (!customer?.full_name || !customer?.phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 })
    }
    if (!customer?.governorate) {
      return NextResponse.json({ error: 'المحافظة مطلوبة' }, { status: 400 })
    }
    if (delivery_type === 'delivery' && !customer?.address?.trim()) {
      return NextResponse.json({ error: 'العنوان مطلوب لخدمة التوصيل' }, { status: 400 })
    }
    if (delivery_type === 'shipping' && !shipping_company) {
      return NextResponse.json({ error: 'يرجى اختيار شركة الشحن' }, { status: 400 })
    }

    // ── Fetch DB products ───────────────────────────────────────────────────────
    const productIds = items.map((i) => i.product_id).filter((v, i, a) => a.indexOf(v) === i)
    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, slug, price_syp, price_usd, discount_price_syp, discount_price_usd,
        stock_status, is_published, categories(slug),
        multi_discount_enabled,
        multi_discount_2_items_syp,
        multi_discount_2_items_usd,
        multi_discount_3_plus_syp,
        multi_discount_3_plus_usd,
        colors:product_colors(name_ar, is_available),
        sizes:product_sizes(size, is_available),
        variants:product_variants(id, color, size, quantity),
        images:product_images(url, is_main)
      `)
      .in('id', productIds)

    if (productsError) {
      console.error('Staff products fetch error:', productsError)
      return NextResponse.json({ error: 'تعذر التحقق من المنتجات' }, { status: 500 })
    }

    const productMap = new Map((dbProducts || []).map((p: any) => [p.id, p]))

    // ── Validate items & resolve variants/prices (from DB only) ──────────────────
    const sanitizedItems: {
      product_id: string
      product_name: string
      product_image: string | null
      color: string | null
      size: number | null
      quantity: number
      unit_price_syp: number
      unit_price_usd: number
      variant_id: string | null
      available_quantity: number
    }[] = []

    for (const item of items) {
      const dbProduct = productMap.get(item.product_id)
      const qty = Math.max(1, Number(item.quantity) || 0)

      if (!dbProduct) {
        return NextResponse.json({ error: 'المنتج المطلوب غير موجود' }, { status: 400 })
      }
      // Reservation orders may include out-of-stock products / sizes; availability is
      // re-checked only at confirmation time.
      if (!isReservation && dbProduct.stock_status === 'out_of_stock') {
        return NextResponse.json({ error: `المنتج "${dbProduct.name}" نفد من المخزن` }, { status: 400 })
      }

      const targetColor = (item.color || '').trim()
      const targetSize  = item.size || 0
      let variantId: string | null = null
      let availableQuantity = 0
      const variantsList: any[] = dbProduct.variants || []

      if (variantsList.length > 0) {
        const found = variantsList.find(
          (v: any) => (v.color || '').trim() === targetColor && (v.size || 0) === targetSize
        )
        const colorLabel = item.color ? ` - اللون: ${item.color}` : ''
        const sizeLabel  = item.size  ? ` - المقاس: ${item.size}` : ''
        if (!found) {
          // Reservations allow sizes/colors that have no variant yet (out of inventory).
          if (!isReservation) {
            return NextResponse.json(
              { error: `المنتج "${dbProduct.name}"${colorLabel}${sizeLabel} غير متوفر. اختر تركيبة أخرى.` },
              { status: 400 }
            )
          }
        } else {
          variantId = found.id
          availableQuantity = found.quantity ?? 0
          if (!isReservation && qty > availableQuantity) {
            return NextResponse.json(
              { error: `الكمية المطلوبة من "${dbProduct.name}"${colorLabel}${sizeLabel} غير متوفرة. المتاح: ${availableQuantity}` },
              { status: 400 }
            )
          }
        }
      }

      const mainImage = (dbProduct.images || []).find((im: any) => im.is_main)?.url
        || (dbProduct.images || [])[0]?.url
        || null

      // Default price from DB (discount price if set, otherwise base price)
      const dbPriceSyp = dbProduct.discount_price_syp ?? dbProduct.price_syp
      const dbPriceUsd = dbProduct.discount_price_usd ?? dbProduct.price_usd
      // Allow an admin-supplied manual price (>= 0). Falls back to the DB price.
      const manualSyp = Number(item.unit_price_syp)
      const manualUsd = Number(item.unit_price_usd)
      const unitSyp = Number.isFinite(manualSyp) && manualSyp >= 0 ? manualSyp : dbPriceSyp
      const unitUsd = Number.isFinite(manualUsd) && manualUsd >= 0 ? manualUsd : dbPriceUsd

      sanitizedItems.push({
        product_id:     item.product_id,
        product_name:   dbProduct.name,
        product_image:  mainImage,
        color:          item.color || null,
        size:           item.size || null,
        quantity:       qty,
        unit_price_syp: unitSyp,
        unit_price_usd: unitUsd,
        variant_id:     variantId,
        available_quantity: availableQuantity,
      })
    }

    // ── Multi-item discount (per-product) ────────────────────────────────────
    let multiItemDiscountSyp = 0
    let multiItemDiscountUsd = 0
    {
      // Group quantities by product ID
      const productQuantities: Record<string, number> = {}
      sanitizedItems.forEach(item => {
        productQuantities[item.product_id] = (productQuantities[item.product_id] || 0) + item.quantity
      })

      // For each product, check its own discount settings
      const processedProducts = new Set<string>()
      sanitizedItems.forEach(item => {
        const pid = item.product_id
        if (processedProducts.has(pid)) return
        processedProducts.add(pid)

        const dbProduct = productMap.get(pid)
        if (!dbProduct?.multi_discount_enabled) return

        const qty = productQuantities[pid] || 0
        if (qty === 2) {
          multiItemDiscountSyp += dbProduct.multi_discount_2_items_syp || 0
          multiItemDiscountUsd += dbProduct.multi_discount_2_items_usd || 0
        } else if (qty >= 3) {
          multiItemDiscountSyp += dbProduct.multi_discount_3_plus_syp || 0
          multiItemDiscountUsd += dbProduct.multi_discount_3_plus_usd || 0
        }
      })
    }

    const subtotalSyp = sanitizedItems.reduce((s, i) => s + i.unit_price_syp * i.quantity, 0)
    const subtotalUsd = sanitizedItems.reduce((s, i) => s + i.unit_price_usd * i.quantity, 0)
    const totalSyp = Math.max(0, subtotalSyp - multiItemDiscountSyp + shippingFeeSyp)
    const totalUsd = Math.max(0, parseFloat((subtotalUsd - multiItemDiscountUsd + shippingFeeUsd).toFixed(2)))

    // ── Insert order ─────────────────────────────────────────────────────────────
    const { data: orderNumber, error: numberError } = await supabaseAdmin.rpc('next_order_number')
    if (numberError || !orderNumber) {
      console.error('Staff order number generation error:', numberError)
      return NextResponse.json({ error: 'تعذر إنشاء رقم الطلب' }, { status: 500 })
    }
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number:            orderNumber,
        customer_full_name:      customer.full_name,
        customer_phone:          normalizePhone(customer.phone),
        customer_governorate:    customer.governorate,
        // Match the store: never null (the column is NOT NULL). Empty string for shipping orders.
        customer_address:        customer.address || '',
        center_name:             customer.center_name || null,
        delivery_type:           delivery_type || 'delivery',
        shipping_company:        delivery_type === 'delivery' ? 'delivery' : (shipping_company || ''),
        shipping_fee_syp:        shippingFeeSyp,
        shipping_fee_usd:        shippingFeeUsd,
        shipping_fee_determined: shippingFeeDetermined,
        payment_method:          payment_method || 'cod',
        // NO loyalty discount, but include multi-item discount in discount_amount
        loyalty_discount_syp:    0,
        loyalty_discount_usd:    0,
        coupon_code:             null,
        discount_amount_syp:     multiItemDiscountSyp,
        discount_amount_usd:     multiItemDiscountUsd,
        subtotal_syp:            subtotalSyp,
        subtotal_usd:            subtotalUsd,
        total_syp:               totalSyp,
        total_usd:               totalUsd,
        currency_used:           currency_used || 'SYP',
        status:                  'pending',
        notes:                   notes || null,
        created_by_admin_id:     adminId,
        is_reservation:          isReservation,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Staff order insert error:', JSON.stringify(orderError))
      return NextResponse.json(
        { error: orderError?.message ? `تعذر إنشاء الطلب: ${orderError.message}` : 'تعذر إنشاء الطلب' },
        { status: 500 }
      )
    }

    // ── Insert order items ───────────────────────────────────────────────────────
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(
        sanitizedItems.map((item) => ({
          order_id:       order.id,
          product_id:     item.product_id,
          product_name:   item.product_name,
          product_image:  item.product_image,
          color:          item.color,
          size:           item.size,
          quantity:       item.quantity,
          unit_price_syp: item.unit_price_syp,
          unit_price_usd: item.unit_price_usd,
        }))
      )
    if (itemsError) console.error('Staff order items insert error:', itemsError)

    // ── Atomic stock reservation (same behaviour as the store) ───────────────────
    // Reservation orders do NOT touch inventory — stock is deducted only on confirmation.
    if (!isReservation) {
      const reservePayload = sanitizedItems
        .filter((item) => item.variant_id)
        .map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          product_name: item.product_name,
        }))

      if (reservePayload.length > 0) {
        const { error: reserveError } = await supabaseAdmin.rpc('reserve_stock', { p_items: reservePayload })
        if (reserveError) {
          // Roll back the just-created order (cascades to items / history)
          await supabaseAdmin.from('orders').delete().eq('id', order.id)
          const soldOutName = reserveError.message?.split('OUT_OF_STOCK:')[1]?.trim()
          return NextResponse.json(
            {
              error: reserveError.message?.includes('OUT_OF_STOCK')
                ? (soldOutName
                    ? `نفدت الكمية من "${soldOutName}". ربما سبق طلب آخر على القطعة الأخيرة.`
                    : 'نفدت الكمية المطلوبة.')
                : 'تعذر حجز الكمية. يرجى المحاولة مرة أخرى.',
            },
            { status: 409 }
          )
        }

        const productIdsToCheck = new Set<string>()
        sanitizedItems.forEach((item) => {
          if (item.variant_id) productIdsToCheck.add(item.product_id)
        })
        for (const pid of Array.from(productIdsToCheck)) {
          const { data: variants } = await supabaseAdmin
            .from('product_variants').select('quantity').eq('product_id', pid)
          if (variants) {
            const totalStock = variants.reduce((sum: number, v: any) => sum + (v.quantity ?? 0), 0)
            if (totalStock <= 0) {
              await supabaseAdmin.from('products').update({ stock_status: 'out_of_stock' }).eq('id', pid)
            }
          }
          // Refresh this product's own page on every sale so availability updates fast.
          const sold = productMap.get(pid) as any
          if (sold?.slug) revalidatePath(`/product/${sold.slug}`)
          const catSlug = sold?.categories?.slug
          if (catSlug) revalidatePath(`/category/${catSlug}`)
        }
        if (productIdsToCheck.size > 0) {
          revalidatePath('/')
          revalidatePath('/products')
        }
      }
    }

    // ── Status history (NO loyalty points inserted) ──────────────────────────────
    await supabaseAdmin.from('order_status_history').insert({
      order_id:   order.id,
      status:     'pending',
      changed_at: new Date().toISOString(),
    })

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.order_number },
      { status: 201 }
    )
  } catch (err) {
    console.error('Staff orders POST unexpected error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }
}
