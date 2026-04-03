import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/getSession'
import { supabaseAdmin } from '@/lib/supabase'
import type { OrderStatus } from '@/types'

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
    if (customer_phone !== undefined) updateFields.customer_phone = customer_phone
    if (customer_governorate !== undefined) updateFields.customer_governorate = customer_governorate
    if (customer_address !== undefined) updateFields.customer_address = customer_address
    if (shipping_company !== undefined) updateFields.shipping_company = shipping_company
    if (delivery_type !== undefined) updateFields.delivery_type = delivery_type
    if (payment_method !== undefined) updateFields.payment_method = payment_method

    // ─── Perform Update ──────────────────────────────────────────────────
    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !order) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // ─── Append status history only if status changed ─────────────────────
    if (status && status !== currentOrder.status) {
      await supabaseAdmin
        .from('order_status_history')
        .insert({
          order_id:   id,
          status,
          changed_at: new Date().toISOString(),
        })

      // ─── Handle Loyalty Point Updates ────────────────────────────────────
      const isConfirmedState = ['confirmed', 'shipped', 'delivered'].includes(status)
      const isCancelledState = status === 'cancelled'

      if (isConfirmedState || isCancelledState) {
        // 1. Update the loyalty point specifically for this order
        await supabaseAdmin
          .from('loyalty_points')
          .update({ status: isConfirmedState ? 'confirmed' : 'cancelled' })
          .eq('order_id', id)

        // 2. If cancelled AND this order used a loyalty discount, revert the 3 points
        if (isCancelledState && currentOrder.loyalty_discount_syp > 0) {
          // Find the 3 most recently used points for this customer
          const { data: recentUsedPoints } = await supabaseAdmin
            .from('loyalty_points')
            .select('id')
            .eq('customer_phone', currentOrder.customer_phone)
            .eq('cycle_used', true)
            .order('created_at', { ascending: false })
            .limit(3)
          
          if (recentUsedPoints && recentUsedPoints.length > 0) {
            await supabaseAdmin
              .from('loyalty_points')
              .update({ cycle_used: false })
              .in('id', recentUsedPoints.map(p => p.id))
          }
        }
      }
    }

    return NextResponse.json({ order })
  } catch (err) {
    console.error('Order PUT [id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/orders/[id] ──────────────────────────────────────────────────
// Admin only. Deletes order.
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

    // We assume cascading deletes are set up in Supabase for order_items and status_history
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
