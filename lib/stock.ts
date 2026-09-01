import { supabaseAdmin } from './supabase'

/**
 * At or below this many pieces in total, a product is shown as "كمية محدودة".
 * Counted across ALL variants (every colour and size added together), not per size.
 */
export const LOW_STOCK_THRESHOLD = 10

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

/** The status a given total quantity maps to. */
export function stockStatusForQuantity(total: number): StockStatus {
  if (total <= 0) return 'out_of_stock'
  if (total <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'in_stock'
}

/**
 * Recomputes `products.stock_status` from the live variant quantities.
 *
 * This is the single place that decides in_stock / low_stock / out_of_stock, so
 * every path that moves inventory (a customer order, a manual staff order, editing
 * an order's items, confirming a reservation, restoring stock on delete) ends up
 * with the same answer.
 *
 * Products with no variant rows at all are skipped: their stock is managed by hand
 * from the product form, and a missing variant list must not be read as "sold out".
 *
 * Writes only when the status actually changes, so it is safe to call on every
 * inventory movement. Never throws — inventory bookkeeping must not fail a sale.
 *
 * @returns the ids whose status changed, for logging/diagnostics.
 */
export async function syncStockStatus(productIds: Iterable<string>): Promise<string[]> {
  const ids = Array.from(new Set(Array.from(productIds).filter(Boolean)))
  if (ids.length === 0) return []

  const changed: string[] = []

  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, stock_status')
      .in('id', ids)

    if (!products || products.length === 0) return []

    const { data: variants } = await supabaseAdmin
      .from('product_variants')
      .select('product_id, quantity')
      .in('product_id', ids)

    // Sum every variant of a product; products absent from this map have no variants.
    const totals = new Map<string, number>()
    for (const v of variants ?? []) {
      totals.set(v.product_id, (totals.get(v.product_id) ?? 0) + (v.quantity ?? 0))
    }

    for (const product of products) {
      const total = totals.get(product.id)
      if (total === undefined) continue          // no variants → managed manually

      const next = stockStatusForQuantity(total)
      if (next === product.stock_status) continue

      const { error } = await supabaseAdmin
        .from('products')
        .update({ stock_status: next })
        .eq('id', product.id)

      if (!error) changed.push(product.id)
    }
  } catch (err) {
    console.error('[syncStockStatus] soft fail:', err)
  }

  return changed
}
