export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { CreateOrderPayload } from '@/types'
import { revalidatePath } from 'next/cache'

// â”€â”€â”€ Helper: generate unique order number â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ GET /api/orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ POST /api/orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Public. Creates a new order with full validation.
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload = await request.json()
    const { items, customer, delivery_type, shipping_company, payment_method, payment_transaction_id, coupon_code, currency_used, notes } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!customer?.full_name || !customer?.phone || !customer?.governorate || !customer?.address) {
      return NextResponse.json({ error: 'Missing customer details' }, { status: 400 })
    }
    if (delivery_type === 'shipping' && !shipping_company) {
      return NextResponse.json({ error: 'Missing shipping company' }, { status: 400 })
    }

    // â”€â”€ Step 1: Validate cart items against DB and get current prices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const productIds = items.map((i) => i.product_id).filter((v, i, a) => a.indexOf(v) === i)

    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, price_syp, price_usd, discount_price_syp, discount_price_usd, stock_status, is_published,
        colors:product_colors(name_ar, is_available),
        sizes:product_sizes(size, is_available),
        variants:product_variants(id, color, size, quantity)
      `)
      .in('id', productIds)

    if (productsError) {
      return NextResponse.json({ error: 'Failed to validate cart items' }, { status: 500 })
    }

    const productMap = new Map(
      (dbProducts || []).map((p: any) => [p.id, p])
    )

    // Validate and build sanitized order items with DB prices
    const sanitizedItems: (typeof items[0] & { variant_id: string | null, available_quantity: number })[] = []
    for (const item of items) {
      const dbProduct = productMap.get(item.product_id)
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_id}` },
          { status: 400 }
        )
      }
      if (!dbProduct.is_published || dbProduct.stock_status === 'out_of_stock') {
        return NextResponse.json(
          { error: `المنتج "${dbProduct.name}" غير متوفر حالياً` },
          { status: 400 }
        )
      }

      // Check specific color availability
      if (item.color) {
        const color = dbProduct.colors?.find((c: any) => c.name_ar === item.color)
        if (color && !color.is_available) {
          return NextResponse.json(
            { error: `اللون "${item.color}" للمنتج "${dbProduct.name}" غير متوفر حالياً` },
            { status: 400 }
          )
        }
      }

      // Check specific size availability
      if (item.size) {
        const sizeObj = dbProduct.sizes?.find((s: any) => s.size === item.size)
        if (sizeObj && !sizeObj.is_available) {
          return NextResponse.json(
            { error: `المقاس "${item.size}" للمنتج "${dbProduct.name}" غير متوفر حالياً` },
            { status: 400 }
          )
        }
      }

      // Check variant quantity
      let variantId = null;
      let availableQuantity = 0; // Default to 0 for strict inventory management
      if (dbProduct.variants && dbProduct.variants.length > 0) {
        const c = item.color || ''
        const s = item.size || 0
        const v = dbProduct.variants.find((v: any) => v.color === c && v.size === s)
        if (v) {
           variantId = v.id
           availableQuantity = v.quantity
        } else {
           availableQuantity = 0 // Not defined = 0 stock
        }
      }

      if (item.quantity > availableQuantity) {
         return NextResponse.json(
            { error: `الكمية المطلوبة من ${item.color || ''} ${item.size || ''} للمنتج "${dbProduct.name}" غير متوفرة. المتاح: ${availableQuantity}` },
            { status: 400 }
         )
      }

      // Use effective (discounted if exists) prices from DB
      sanitizedItems.push({
        ...item,
        product_name:  dbProduct.name,
        unit_price_syp: dbProduct.discount_price_syp ?? dbProduct.price_syp,
        unit_price_usd: dbProduct.discount_price_usd ?? dbProduct.price_usd,
        variant_id: variantId,
        available_quantity: availableQuantity,
      })
    }

    // â”€â”€ Step 2: Calculate subtotals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let subtotalSyp = sanitizedItems.reduce(
      (sum, i) => sum + i.unit_price_syp * i.quantity, 0
    )
    let subtotalUsd = sanitizedItems.reduce(
      (sum, i) => sum + i.unit_price_usd * i.quantity, 0
    )

    // ─── Step 2.5: Multi-product discount calculation ───────────────────
    const totalItemsCount = sanitizedItems.reduce((acc, item) => acc + item.quantity, 0)
    let multiProductDiscountSyp = 0
    
    // Fetch settings for multi-item discount and shipping fees
    const { data: settings } = await supabaseAdmin
      .from('homepage_settings')
      .select('discount_multi_items_enabled, discount_2_items_syp, discount_3_items_plus_syp, shipping_fee_1_piece_syp, shipping_fee_1_piece_usd, shipping_fee_2_pieces_syp, shipping_fee_2_pieces_usd, shipping_fee_3_plus_pieces_syp, shipping_fee_3_plus_pieces_usd, delivery_fee_syp, delivery_fee_usd, delivery_fee_1_piece_syp, delivery_fee_1_piece_usd, delivery_fee_2_pieces_syp, delivery_fee_2_pieces_usd, delivery_fee_3_plus_pieces_syp, delivery_fee_3_plus_pieces_usd')
      .limit(1)
      .maybeSingle()

    if (settings?.discount_multi_items_enabled) {
      if (totalItemsCount >= 3) {
        multiProductDiscountSyp = settings.discount_3_items_plus_syp
      } else if (totalItemsCount >= 2) {
        multiProductDiscountSyp = settings.discount_2_items_syp
      }
    }

    // â”€â”€ Step 3: Validate coupon if provided â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let discountSyp = 0
    let discountUsd = 0
    let appliedCouponCode: string | null = null

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

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return NextResponse.json({ error: 'انتهت صلاحية الكوبون' }, { status: 400 })
      }

      // Check max uses
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ error: 'تم استنفاد استخدامات الكوبون' }, { status: 400 })
      }

      // Check minimum order
      if (subtotalSyp < coupon.min_order_syp) {
        return NextResponse.json(
          { error: `الحد الأدنى للطلب هو ${coupon.min_order_syp.toLocaleString()} ل.س` },
          { status: 400 }
        )
      }

      // Calculate discount
      if (coupon.type === 'percentage') {
        discountSyp = Math.round((subtotalSyp * coupon.value) / 100)
        discountUsd = parseFloat(((subtotalUsd * coupon.value) / 100).toFixed(2))
      } else {
        // fixed_amount â€” stored in SYP; approximate USD using ratio
        discountSyp = Math.min(coupon.value, subtotalSyp)
        const ratio = subtotalSyp > 0 ? subtotalUsd / subtotalSyp : 0
        discountUsd = parseFloat((discountSyp * ratio).toFixed(2))
      }

      appliedCouponCode = coupon.code

      // â”€â”€ Step 4: Increment coupon used_count â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id)
    }

    // ─── Step 2.7: Calculate shipping/delivery fee ───────────────
    let shippingFeeSyp = 0
    let shippingFeeUsd = 0

    if (delivery_type === 'delivery') {
      if (totalItemsCount >= 3) {
        shippingFeeSyp = settings?.delivery_fee_3_plus_pieces_syp || 0
        shippingFeeUsd = settings?.delivery_fee_3_plus_pieces_usd || 0
      } else if (totalItemsCount === 2) {
        shippingFeeSyp = settings?.delivery_fee_2_pieces_syp || 0
        shippingFeeUsd = settings?.delivery_fee_2_pieces_usd || 0
      } else {
        shippingFeeSyp = settings?.delivery_fee_1_piece_syp || 0
        shippingFeeUsd = settings?.delivery_fee_1_piece_usd || 0
      }
    } else {
      if (totalItemsCount >= 3) {
        shippingFeeSyp = settings?.shipping_fee_3_plus_pieces_syp || 0
        shippingFeeUsd = settings?.shipping_fee_3_plus_pieces_usd || 0
      } else if (totalItemsCount === 2) {
        shippingFeeSyp = settings?.shipping_fee_2_pieces_syp || 0
        shippingFeeUsd = settings?.shipping_fee_2_pieces_usd || 0
      } else {
        shippingFeeSyp = settings?.shipping_fee_1_piece_syp || 0
        shippingFeeUsd = settings?.shipping_fee_1_piece_usd || 0
      }
    }

    // Combine both discounts
    const finalDiscountSyp = discountSyp + multiProductDiscountSyp
    // Calculate USD equivalent for multi-product discount using current ratio
    const ratio = subtotalSyp > 0 ? subtotalUsd / subtotalSyp : 0
    const finalDiscountUsd = parseFloat((discountUsd + (multiProductDiscountSyp * ratio)).toFixed(2))

    const totalSyp = Math.max(0, subtotalSyp - finalDiscountSyp + shippingFeeSyp)
    const totalUsd = Math.max(0, parseFloat((subtotalUsd - finalDiscountUsd + shippingFeeUsd).toFixed(2)))

    // â”€â”€ Step 5: Generate unique order number â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const orderNumber = await generateOrderNumber()

    // â”€â”€ Step 6: Insert order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number:         orderNumber,
        customer_full_name:   customer.full_name,
        customer_phone:       customer.phone,
        customer_governorate: customer.governorate,
        customer_address:     customer.address,
        delivery_type:        delivery_type || 'shipping',
        shipping_company:     shipping_company || null,
        shipping_fee_syp:     shippingFeeSyp,
        shipping_fee_usd:     shippingFeeUsd,
        payment_method:       payment_method || 'cod',
        payment_transaction_id: payment_transaction_id || null,
        coupon_code:          appliedCouponCode,
        discount_amount_syp:  finalDiscountSyp,
        discount_amount_usd:  finalDiscountUsd,
        subtotal_syp:         subtotalSyp,
        subtotal_usd:         subtotalUsd,
        total_syp:            totalSyp,
        total_usd:            totalUsd,
        currency_used:        currency_used || 'SYP',
        status:               'pending',
        notes:                notes || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // â”€â”€ Insert order items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(
        sanitizedItems.map((item) => ({
          order_id:      order.id,
          product_id:    item.product_id,
          product_name:  item.product_name,
          product_image: item.product_image || null,
          color:         item.color         || null,
          size:          item.size          || null,
          quantity:      item.quantity,
          unit_price_syp: item.unit_price_syp,
          unit_price_usd: item.unit_price_usd,
        }))
      )

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
    }

    // ✨ Decrement variant quantities & handle out_of_stock
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

    // After updating variants, check if any products are now fully out of stock
    for (const pid of Array.from(productIdsToCheck)) {
      const { data: variants } = await supabaseAdmin.from('product_variants').select('quantity').eq('product_id', pid);
      if (variants) {
         const totalStock = variants.reduce((sum: number, v: any) => sum + v.quantity, 0);
         if (totalStock <= 0) {
            await supabaseAdmin.from('products').update({ stock_status: 'out_of_stock' }).eq('id', pid);
            // Revalidate frontend
            revalidatePath('/')
            revalidatePath('/products')
         }
      }
    }

    // â”€â”€ Insert initial status history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await supabaseAdmin.from('order_status_history').insert({
      order_id:   order.id,
      status:     'pending',
      changed_at: new Date().toISOString(),
    })

    // â”€â”€ Step 7: Loyalty coupon check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Count delivered orders with the same phone number
    const { count: deliveredCount } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_phone', customer.phone)
      .eq('status', 'delivered')

    if (deliveredCount !== null && deliveredCount > 0 && deliveredCount % 3 === 0) {
      // Auto-generate a loyalty coupon for this customer
      const loyaltyCode =
        'LOYAL-' +
        customer.phone.replace(/\D/g, '').slice(-4) +
        '-' +
        Date.now().toString().slice(-4)

      await supabaseAdmin.from('coupons').insert({
        code:            loyaltyCode,
        type:            'percentage',
        value:           10,               // 10% loyalty discount
        min_order_syp:   0,
        max_uses:        1,
        used_count:      0,
        expires_at:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active:       true,
        auto_generated:  true,
      })
    }

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.order_number },
      { status: 201 }
    )
  } catch (err) {
    console.error('Orders POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

