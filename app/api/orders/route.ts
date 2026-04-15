export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { CreateOrderPayload } from '@/types'
import { revalidatePath } from 'next/cache'
import { normalizePhone } from '@/lib/utils'

// ─── Helper: generate unique order number ──────────────────────────────────────
async function generateOrderNumber(): Promise<string> {
  const maxAttempts = 10
  for (let i = 0; i < maxAttempts; i++) {
    const number = 'KZ-' + String(Math.floor(1000 + Math.random() * 9000))

    const { data } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_number', number)
      .maybeSingle()

    if (!data) return number
  }
  // Fallback: use timestamp
  return 'KZ-' + Date.now().toString().slice(-4)
}

// ─── GET /api/orders ───────────────────────────────────────────────────────────
// Admin only. Returns paginated orders list.
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page   = parseInt(searchParams.get('page')   || '1',  10)
    const limit  = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_full_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
      )
    }

    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Orders GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders,
      pagination: {
        total:      count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    console.error('Orders GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/orders ──────────────────────────────────────────────────────────
// Public. Creates a new order with full validation.
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload = await request.json()
    const {
      items, customer, delivery_type, shipping_company,
      payment_method, payment_transaction_id,
      shipping_fee_determined, coupon_code, currency_used, notes,
    } = body

    // ── Basic validation ───────────────────────────────────────────────────────
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 })
    }
    if (!customer?.full_name || !customer?.phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 })
    }
    if (!customer?.governorate) {
      return NextResponse.json({ error: 'المحافظة مطلوبة' }, { status: 400 })
    }
    // address is required for delivery (Aleppo); for shipping it's the center name
    if (delivery_type === 'delivery' && !customer?.address?.trim()) {
      return NextResponse.json({ error: 'العنوان مطلوب لخدمة التوصيل' }, { status: 400 })
    }
    if (delivery_type === 'shipping' && !shipping_company) {
      return NextResponse.json({ error: 'يرجى اختيار شركة الشحن' }, { status: 400 })
    }

    // ── Step 1: Fetch DB products ──────────────────────────────────────────────
    const productIds = items.map((i) => i.product_id).filter((v, i, a) => a.indexOf(v) === i)

    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, price_syp, price_usd, discount_price_syp, discount_price_usd,
        stock_status, is_published,
        colors:product_colors(name_ar, is_available),
        sizes:product_sizes(size, is_available),
        variants:product_variants(id, color, size, quantity)
      `)
      .in('id', productIds)

    if (productsError) {
      console.error('Products fetch error:', productsError)
      return NextResponse.json({ error: 'تعذر التحقق من المنتجات' }, { status: 500 })
    }

    const productMap = new Map(
      (dbProducts || []).map((p: any) => [p.id, p])
    )

    // ── Step 2: Validate items & resolve variants ──────────────────────────────
    const sanitizedItems: (typeof items[0] & {
      variant_id: string | null
      available_quantity: number
      has_variant_tracking: boolean
    })[] = []

    for (const item of items) {
      const dbProduct = productMap.get(item.product_id)

      if (!dbProduct) {
        return NextResponse.json(
          { error: `المنتج المطلوب غير موجود في قاعدة البيانات` },
          { status: 400 }
        )
      }

      if (!dbProduct.is_published) {
        return NextResponse.json(
          { error: `المنتج "${dbProduct.name}" غير منشور حالياً، يرجى التواصل معنا عبر الواتساب` },
          { status: 400 }
        )
      }

      if (dbProduct.stock_status === 'out_of_stock') {
        return NextResponse.json(
          { error: `المنتج "${dbProduct.name}" نفد من المخزن حالياً` },
          { status: 400 }
        )
      }

      // Check color availability
      if (item.color) {
        const color = dbProduct.colors?.find((c: any) => c.name_ar === item.color)
        if (color && !color.is_available) {
          return NextResponse.json(
            { error: `اللون "${item.color}" للمنتج "${dbProduct.name}" غير متوفر حالياً` },
            { status: 400 }
          )
        }
      }

      // Check size availability
      if (item.size) {
        const sizeObj = dbProduct.sizes?.find((s: any) => s.size === item.size)
        if (sizeObj && !sizeObj.is_available) {
          return NextResponse.json(
            { error: `المقاس "${item.size}" للمنتج "${dbProduct.name}" غير متوفر حالياً` },
            { status: 400 }
          )
        }
      }

      // ── Variant lookup ──────────────────────────────────────────────────────
      const targetColor = item.color || ''
      const targetSize  = item.size  || 0

      let variantId: string | null = null
      let availableQuantity = 0
      let has_variant_tracking = false

      const variantsList: any[] = dbProduct.variants || []

      if (variantsList.length > 0) {
        has_variant_tracking = true
        const found = variantsList.find(
          (v: any) => (v.color || '') === targetColor && (v.size || 0) === targetSize
        )

        if (found) {
          variantId = found.id
          availableQuantity = found.quantity ?? 0

          if (item.quantity > availableQuantity) {
            const colorLabel = item.color ? ` - اللون: ${item.color}` : ''
            const sizeLabel  = item.size  ? ` - المقاس: ${item.size}` : ''
            return NextResponse.json(
              {
                error: `الكمية المطلوبة من "${dbProduct.name}"${colorLabel}${sizeLabel} غير متوفرة. الكمية المتاحة: ${availableQuantity} فقط`,
              },
              { status: 400 }
            )
          }
        }
        // variant combo not in DB → allow (admin hasn't configured all combinations)
      }
      // no variants at all → rely on stock_status (checked above)

      sanitizedItems.push({
        ...item,
        product_name:   dbProduct.name,
        unit_price_syp: dbProduct.discount_price_syp ?? dbProduct.price_syp,
        unit_price_usd: dbProduct.discount_price_usd ?? dbProduct.price_usd,
        variant_id:     variantId,
        available_quantity: availableQuantity,
        has_variant_tracking,
      })
    }

    // ── Step 3: Subtotals ──────────────────────────────────────────────────────
    const subtotalSyp = sanitizedItems.reduce(
      (sum, i) => sum + i.unit_price_syp * i.quantity, 0
    )
    const subtotalUsd = sanitizedItems.reduce(
      (sum, i) => sum + i.unit_price_usd * i.quantity, 0
    )

    // ── Step 4: Fetch homepage settings ───────────────────────────────────────
    const totalItemsCount = sanitizedItems.reduce((acc, i) => acc + i.quantity, 0)

    const { data: settingsRaw } = await supabaseAdmin
      .from('homepage_settings')
      .select(
        'discount_multi_items_enabled, discount_2_items_syp, discount_3_items_plus_syp, ' +
        'shipping_fee_1_piece_syp, shipping_fee_1_piece_usd, ' +
        'shipping_fee_2_pieces_syp, shipping_fee_2_pieces_usd, ' +
        'shipping_fee_3_plus_pieces_syp, shipping_fee_3_plus_pieces_usd, ' +
        'delivery_fee_syp, delivery_fee_usd'
      )
      .limit(1)
      .maybeSingle()
    const settings = settingsRaw as any


    // ── Step 6: Coupon validation (NOT increment yet) ─────────────────────────
    let discountSyp = 0
    let discountUsd = 0
    let appliedCouponCode: string | null = null
    let couponId: string | null = null
    let couponUsedCount = 0

    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase().trim())
        .eq('is_active', true)
        .single()

      if (couponError || !coupon) {
        return NextResponse.json({ error: 'الكوبون غير صالح' }, { status: 400 })
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return NextResponse.json({ error: 'انتهت صلاحية الكوبون' }, { status: 400 })
      }
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ error: 'تم استنفاد استخدامات الكوبون' }, { status: 400 })
      }
      if (subtotalSyp < (coupon.min_order_syp ?? 0)) {
        return NextResponse.json(
          { error: `الحد الأدنى للطلب هو ${(coupon.min_order_syp ?? 0).toLocaleString()} ل.س` },
          { status: 400 }
        )
      }

      if (coupon.type === 'percentage') {
        discountSyp = Math.round((subtotalSyp * coupon.value) / 100)
        discountUsd = parseFloat(((subtotalUsd * coupon.value) / 100).toFixed(2))
      } else {
        discountSyp = Math.min(coupon.value, subtotalSyp)
        const ratio = subtotalSyp > 0 ? subtotalUsd / subtotalSyp : 0
        discountUsd = parseFloat((discountSyp * ratio).toFixed(2))
      }

      appliedCouponCode = coupon.code
      couponId = coupon.id
      couponUsedCount = coupon.used_count
    }

    // ── Step 7: Shipping fee ───────────────────────────────────────────────────
    let shipping_fee_syp = 0
    let shipping_fee_usd = 0

    if (shipping_fee_determined) {
      // Fee will be negotiated via WhatsApp — store as 0
      shipping_fee_syp = 0
      shipping_fee_usd = 0
    } else if (delivery_type === 'delivery') {
      shipping_fee_syp = settings?.delivery_fee_syp ?? 0
      shipping_fee_usd = settings?.delivery_fee_usd ?? 0
    } else if (delivery_type === 'shipping' && shipping_company) {
      // Try per-governorate fee
      const { data: shipMethod } = await supabaseAdmin
        .from('shipping_methods')
        .select('id, shipping_governorates(fee_syp, fee_usd)')
        .eq('slug', shipping_company)
        .eq('is_active', true)
        .eq('shipping_governorates.governorate_name', customer.governorate)
        .eq('shipping_governorates.is_active', true)
        .maybeSingle()

      const govFee = (shipMethod as any)?.shipping_governorates?.[0]

      if (govFee) {
        shipping_fee_syp = govFee.fee_syp ?? 0
        shipping_fee_usd = govFee.fee_usd ?? 0
      } else {
        // Fallback: piece-count-based from settings
        if (totalItemsCount >= 4) {
          shipping_fee_syp = 0
          shipping_fee_usd = 0
          shipping_fee_determined = true
        } else if (totalItemsCount === 1) {
          shipping_fee_syp = settings?.shipping_fee_1_piece_syp ?? 0
          shipping_fee_usd = settings?.shipping_fee_1_piece_usd ?? 0
        } else if (totalItemsCount === 2) {
          shipping_fee_syp = settings?.shipping_fee_2_pieces_syp ?? 0
          shipping_fee_usd = settings?.shipping_fee_2_pieces_usd ?? 0
        } else {
          // Exactly 3 pieces
          shipping_fee_syp = settings?.shipping_fee_3_plus_pieces_syp ?? 0
          shipping_fee_usd = settings?.shipping_fee_3_plus_pieces_usd ?? 0
          // If no fee set for 3 pieces, mark as determined
          if (shipping_fee_syp === 0) shipping_fee_determined = true
        }
      }
    }

    // ── Step 8: Loyalty discount ───────────────────────────────────────────────
    let loyaltyDiscountSyp = 0
    let loyaltyDiscountUsd = 0
    let loyaltyPointsToUpdate: string[] = []

    const normalizedPhone = normalizePhone(customer.phone)

    const { data: loyaltyPoints } = await supabaseAdmin
      .from('loyalty_points')
      .select('id')
      .eq('customer_phone', normalizedPhone)
      .eq('status', 'confirmed')
      .eq('cycle_used', false)
      .order('created_at', { ascending: true })

    if (loyaltyPoints && loyaltyPoints.length >= 3) {
      loyaltyDiscountSyp = 1000
      const orderRatio = subtotalSyp > 0 ? subtotalUsd / subtotalSyp : 0
      loyaltyDiscountUsd = parseFloat((1000 * orderRatio).toFixed(2))
      loyaltyPointsToUpdate = loyaltyPoints.slice(0, 3).map((p: any) => p.id)
    }

    // ── Step 9: Final totals ───────────────────────────────────────────────────
    // ── Multi-item discount ────────────────────────────────────────────────
    let multiItemDiscountSyp = 0
    let multiItemDiscountUsd = 0
    if (settings?.discount_multi_items_enabled) {
      if (totalItemsCount === 2) {
        multiItemDiscountSyp = settings.discount_2_items_syp || 0
      } else if (totalItemsCount >= 3) {
        multiItemDiscountSyp = settings.discount_3_items_plus_syp || 0
      }

      if (multiItemDiscountSyp > 0) {
        const orderRatio = subtotalSyp > 0 ? subtotalUsd / subtotalSyp : 0
        multiItemDiscountUsd = parseFloat((multiItemDiscountSyp * orderRatio).toFixed(2))
      }
    }

    const finalDiscountSyp = discountSyp + loyaltyDiscountSyp + multiItemDiscountSyp
    const currentRatio     = subtotalSyp > 0 ? subtotalUsd / subtotalSyp : 0
    const finalDiscountUsd = parseFloat(
      (discountUsd + (loyaltyDiscountSyp + multiItemDiscountSyp) * currentRatio).toFixed(2)
    )
    const totalSyp = Math.max(0, subtotalSyp - finalDiscountSyp + shipping_fee_syp)
    const totalUsd = Math.max(0, parseFloat((subtotalUsd - finalDiscountUsd + shipping_fee_usd).toFixed(2)))

    // ── Step 10: Generate order number ────────────────────────────────────────
    const orderNumber = await generateOrderNumber()

    // ── Step 11: Insert order ─────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number:            orderNumber,
        customer_full_name:      customer.full_name,
        customer_phone:          customer.phone,
        customer_governorate:    customer.governorate,
        customer_address:        customer.address || null,
        center_name:             customer.center_name || null,
        delivery_type:           delivery_type || 'delivery',
        shipping_company:        delivery_type === 'delivery' ? 'delivery' : (shipping_company || ''),
        shipping_fee_syp,
        shipping_fee_usd,
        payment_method:          payment_method || 'cod',
        payment_transaction_id:  payment_transaction_id || null,
        shipping_fee_determined: shipping_fee_determined ?? false,
        loyalty_discount_syp:    loyaltyDiscountSyp,
        loyalty_discount_usd:    loyaltyDiscountUsd,
        coupon_code:             appliedCouponCode,
        discount_amount_syp:     finalDiscountSyp,
        discount_amount_usd:     finalDiscountUsd,
        subtotal_syp:            subtotalSyp,
        subtotal_usd:            subtotalUsd,
        total_syp:               totalSyp,
        total_usd:               totalUsd,
        currency_used:           currency_used || 'SYP',
        status:                  'pending',
        notes:                   notes || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', JSON.stringify(orderError))
      return NextResponse.json(
        {
          error: orderError?.message
            ? `تعذر إنشاء الطلب: ${orderError.message}`
            : 'تعذر إنشاء الطلب. يرجى المحاولة مرة أخرى.',
        },
        { status: 500 }
      )
    }

    // ── Step 12: Insert order items ───────────────────────────────────────────
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(
        sanitizedItems.map((item) => ({
          order_id:      order.id,
          product_id:    item.product_id,
          product_name:  item.product_name,
          product_image: item.product_image || null,
          color:         item.color  || null,
          size:          item.size   || null,
          quantity:      item.quantity,
          unit_price_syp: item.unit_price_syp,
          unit_price_usd: item.unit_price_usd,
        }))
      )

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      // Order was created; items failure is logged but we don't abort
    }

    // ── Step 13: Decrement variant stock ──────────────────────────────────────
    const productIdsToCheck = new Set<string>()

    for (const item of sanitizedItems) {
      if (item.variant_id) {
        const newQty = Math.max(0, item.available_quantity - item.quantity)
        await supabaseAdmin
          .from('product_variants')
          .update({ quantity: newQty })
          .eq('id', item.variant_id)

        productIdsToCheck.add(item.product_id)
      }
    }

    // Mark product out_of_stock if all variants reached 0
    for (const pid of Array.from(productIdsToCheck)) {
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('quantity')
        .eq('product_id', pid)

      if (variants) {
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.quantity ?? 0), 0)
        if (totalStock <= 0) {
          await supabaseAdmin
            .from('products')
            .update({ stock_status: 'out_of_stock' })
            .eq('id', pid)
          revalidatePath('/')
          revalidatePath('/products')
        }
      }
    }

    // ── Step 14: Coupon increment (AFTER order succeeds) ──────────────────────
    if (couponId !== null) {
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: couponUsedCount + 1 })
        .eq('id', couponId)
    }

    // ── Step 15: Order status history ─────────────────────────────────────────
    await supabaseAdmin.from('order_status_history').insert({
      order_id:   order.id,
      status:     'pending',
      changed_at: new Date().toISOString(),
    })

    // ── Step 16: Loyalty points ────────────────────────────────────────────────
    // Add a pending point for this order
    await supabaseAdmin.from('loyalty_points').insert({
      customer_phone: normalizedPhone,
      order_id:       order.id,
      status:         'pending',
      cycle_used:     false,
    })

    // If a discount was applied, mark the 3 used points
    if (loyaltyPointsToUpdate.length === 3) {
      await supabaseAdmin
        .from('loyalty_points')
        .update({ cycle_used: true })
        .in('id', loyaltyPointsToUpdate)
    }

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.order_number },
      { status: 201 }
    )
  } catch (err) {
    console.error('Orders POST unexpected error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }
}
