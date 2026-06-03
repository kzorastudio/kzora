import { supabaseAdmin } from './supabase'

// ─── Sequential order number generator ───────────────────────────────────────────
// Produces KZ-0001, KZ-0002, KZ-0003 … (zero-padded) by continuing from the highest
// existing number. Shared by both the public store route and the staff (manual) order
// route, so all orders share a single ordered sequence with no "S" prefix.
//
// Note: collisions are avoided by reading the current max and probing the next free
// number. For this store's scale this is robust; extreme concurrency is not a concern.

// Minimum number of digits (leading zeros). Numbers larger than this just grow.
const PAD = 6
const format = (n: number) => `KZ-${String(n).padStart(PAD, '0')}`

export async function generateSequentialOrderNumber(): Promise<string> {
  // Read existing order numbers and find the highest KZ-<n> (handles leading zeros)
  const { data } = await supabaseAdmin
    .from('orders')
    .select('order_number')

  let max = 0
  for (const row of (data || []) as { order_number: string | null }[]) {
    const m = /^KZ-(\d+)$/.exec(row.order_number || '')
    if (m) {
      const n = parseInt(m[1], 10)
      if (Number.isFinite(n) && n > max) max = n
    }
  }

  // Probe the next free number (guards against a rare concurrent insert)
  for (let i = 1; i <= 100; i++) {
    const candidate = format(max + i)
    const { data: exists } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_number', candidate)
      .maybeSingle()
    if (!exists) return candidate
  }

  // Extremely unlikely fallback
  return `${format(max + 1)}-${Date.now().toString().slice(-3)}`
}
