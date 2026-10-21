import type { ProductFull } from '@/types'

/** Same rule ProductCard uses to show "نفدت الكمية": flagged out of stock, or every variant at zero. */
export function isSoldOut(p: Pick<ProductFull, 'stock_status' | 'variants'>): boolean {
  if (p.stock_status === 'out_of_stock') return true
  return !!p.variants && p.variants.length > 0 && p.variants.every(v => (v.quantity ?? 0) <= 0)
}

/** Moves sold-out products to the end, keeping everything else in its current order. */
export function sortSoldOutLast<T extends Pick<ProductFull, 'stock_status' | 'variants'>>(products: T[]): T[] {
  return [...products].sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)))
}
