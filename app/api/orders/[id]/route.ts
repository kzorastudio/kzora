import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { OrderStatus } from '@/types'
import { normalizePhone } from '@/lib/utils'

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
// Admin only. Returns full order with items and status history.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(_request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        items:order_items(*),
        status_history:order_status_history(*)
        `
      )
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Sort status history by changed_at ascending
    if (order.status_history) {
      order.status_history.sort(
        (a: { changed_at: string }, b: { changed_at: string }) =>
          new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
      )
    }

    return NextResponse.json({ order })
  } catch (err) {
    console.error('Order GET [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/orders/[id] ─────────────────────────────────────────────────────
// Admin only. Updates order status and appends to status history.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = params
    const { 
      status, 
      notes, 
      customer_full_name, 
      customer_phone, 
      customer_governorate, 
      customer_address, 
      center_name,
      shipping_company,
      delivery_type,
      payment_method
    } = body

    // ─── Fetch current order to check status change ───────────────────────
    const { data: currentOrder, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('status, loyalty_discount_syp, customer_phone')
      .eq('id', id)
      .single()

    if (fetchErr || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ─── Build update fields ──────────────────────────────────────────────
    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateFields.status = status
    }

    if (notes !== undefined) updateFields.notes = notes
    if (customer_full_name !== undefined) updateFields.customer_full_name = customer_full_name
    if (customer_phone !== undefined) updateFields.customer_phone = normalizePhone(customer_phone)
    if (customer_governorate !== undefined) updateFields.customer_governorate = customer_governorate
    if (customer_address !== undefined) updateFields.customer_address = customer_address
    if (center_name !== undefined) updateFields.center_name = center_name
    if (shipping_company !== undefined) updateFields.shipping_company = shipping_company
    if (delivery_type !== undefined) updateFields.delivery_type = delivery_type
    if (payment_method !== undefined) updateFields.payment_method = payment_method

    // ─── 1. PRIMARY UPDATE: Change the Order Status (Atomic) ─────────────
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedOrder) {
      console.error('[ORDER_UPDATE_API] Primary update failed:', updateError)
      return NextResponse.json({ 
        error: 'Update failed', 
        message: updateError?.message,
        code: updateError?.code
      }, { status: 500 })
    }

    // ─── 2. SECONDARY UPDATES: (Run in background or safely) ─────────────
    // These won't block the successful response if they fail
    
    // Status History
    if (status && status !== currentOrder.status) {
      try {
        await supabaseAdmin
          .from('order_status_history')
          .insert({
            order_id: id,
            status,
            changed_at: new Date().toISOString(),
          })
      } catch (e) {
        console.error('[ORDER_UPDATE_API] History insertion soft fail:', e)
      }

      // Loyalty Points Logic
      try {
        let pointStatus = 'pending'
        if (status === 'delivered') pointStatus = 'confirmed'
        else if (status === 'cancelled') pointStatus = 'cancelled'
        
        // Update order point
        await supabaseAdmin
          .from('loyalty_points')
          .update({ status: pointStatus })
          .eq('order_id', id)

        // Revert points if cancelled and discount was used
        if (status === 'cancelled' && currentOrder.loyalty_discount_syp > 0) {
          const { data: pointsToRevert } = await supabaseAdmin
            .from('loyalty_points')
            .select('id')
            .eq('customer_phone', normalizePhone(currentOrder.customer_phone))
            .eq('cycle_used', true)
            .order('created_at', { ascending: false })
            .limit(3)
          
          if (pointsToRevert && pointsToRevert.length > 0) {
            await supabaseAdmin
              .from('loyalty_points')
              .update({ cycle_used: false })
              .in('id', pointsToRevert.map(p => p.id))
          }
        }
      } catch (e) {
        console.error('[ORDER_UPDATE_API] Loyalty logic soft fail:', e)
      }
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (err) {
    console.error('Order PUT [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/orders/[id] ──────────────────────────────────────────────────
// Admin only. Deletes order.
// Query param: ?restore_stock=true  → restores product_variants quantities before deleting
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(_request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const url = new URL(_request.url)
    const restoreStock = url.searchParams.get('restore_stock') === 'true'

    // ─── Restore stock if requested ───────────────────────────────────────
    if (restoreStock) {
      // 1. Fetch all order items (product_id, color, size, quantity)
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .select('product_id, color, size, quantity')
        .eq('order_id', id)

      if (itemsErr) {
        console.error('[DELETE] Failed to fetch order items:', itemsErr)
        return NextResponse.json({ error: 'فشل جلب عناصر الطلب' }, { status: 500 })
      }

      // 2. For each item, find matching variant and restore quantity
      const productIdsToCheck = new Set<string>()
      for (const item of items ?? []) {
        if (!item.product_id) continue

        // Find variant by product_id + color + size
        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('id, quantity')
          .eq('product_id', item.product_id)
          .eq('color', item.color ?? '')
          .eq('size', item.size ?? 0)
          .single()

        if (variant) {
          await supabaseAdmin
            .from('product_variants')
            .update({ quantity: variant.quantity + item.quantity })
            .eq('id', variant.id)

          productIdsToCheck.add(item.product_id)
        }
      }

      // 3. If product was out_of_stock, update it back to in_stock
      for (const pid of Array.from(productIdsToCheck)) {
        const { data: variants } = await supabaseAdmin
          .from('product_variants')
          .select('quantity')
          .eq('product_id', pid)

        if (variants) {
          const totalStock = variants.reduce((sum: number, v: { quantity: number }) => sum + v.quantity, 0)
          if (totalStock > 0) {
            await supabaseAdmin
              .from('products')
              .update({ stock_status: 'in_stock' })
              .eq('id', pid)
              .eq('stock_status', 'out_of_stock') // only update if was out_of_stock
          }
        }
      }

      // 4. Revert loyalty points cycle_used if this order used a loyalty discount
      const { data: orderMeta } = await supabaseAdmin
        .from('orders')
        .select('loyalty_discount_syp, customer_phone')
        .eq('id', id)
        .single()

      if (orderMeta && orderMeta.loyalty_discount_syp > 0) {
        // Cancel this order's loyalty point
        await supabaseAdmin
          .from('loyalty_points')
          .update({ status: 'cancelled' })
          .eq('order_id', id)

        // Revert the 3 points that were marked cycle_used when the discount was applied
        const { data: pointsToRevert } = await supabaseAdmin
          .from('loyalty_points')
          .select('id')
          .eq('customer_phone', normalizePhone(orderMeta.customer_phone))
          .eq('cycle_used', true)
          .order('created_at', { ascending: false })
          .limit(3)

        if (pointsToRevert && pointsToRevert.length > 0) {
          await supabaseAdmin
            .from('loyalty_points')
            .update({ cycle_used: false })
            .in('id', pointsToRevert.map((p: { id: string }) => p.id))
        }
      }
    }

    // ─── Delete order (cascades to order_items, status_history, loyalty_points) ─
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'فشل حذف الطلب' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Order DELETE [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
