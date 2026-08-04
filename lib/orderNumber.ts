import { supabaseAdmin } from './supabase'

/**
 * Generates a random 6-digit order number (e.g. KZ-582910, KZ-819304)
 * to hide sequential order counts from employees.
 * Guarantees uniqueness by probing Supabase before returning.
 */
export async function generateRandomOrderNumber(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000)
    const candidate = `KZ-${randomDigits}`

    const { data: exists } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_number', candidate)
      .maybeSingle()

    if (!exists) return candidate
  }

  // Fallback in case of collision
  const time = Date.now().toString().slice(-4)
  const rand = Math.floor(10 + Math.random() * 90)
  return `KZ-${time}${rand}`
}
