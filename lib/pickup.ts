/**
 * Aleppo customers can collect their order from the delivery office instead of
 * home delivery. The orders table only allows delivery_type 'delivery' | 'shipping',
 * so a pickup order is stored as delivery_type 'delivery' + shipping_company PICKUP_SLUG.
 * Its on/off switch, fee and place name live on homepage_settings
 * (supabase/add_pickup_option.sql); before that runs, the option simply stays off.
 */
export const PICKUP_SLUG = 'pickup'
export const PICKUP_DEFAULT_LOCATION = 'مكتب الدليفري (الموكامبو)'

type PickupSettings = { pickup_enabled?: boolean | null; pickup_location?: string | null } | null | undefined

export function isPickupEnabled(settings: PickupSettings): boolean {
  return settings?.pickup_enabled === true
}

export function pickupLocation(settings: PickupSettings): string {
  return settings?.pickup_location?.trim() || PICKUP_DEFAULT_LOCATION
}

export function isPickupOrder(order: { shipping_company?: string | null }): boolean {
  return order.shipping_company === PICKUP_SLUG
}
