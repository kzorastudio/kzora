import type { ProductFull } from '@/types'

/** Same rule ProductCard uses to show "نفدت الكمية": flagged out of stock, or every variant at zero. */
export function isSoldOut(p: Pick<ProductFull, 'stock_status' | 'variants'>): boolean {
  if (p.stock_status === 'out_of_stock') return true
  return !!p.variants && p.variants.length > 0 && p.variants.every(v => (v.quantity ?? 0) <= 0)
}

/** Same rule ProductCard uses to show "كمية محدودة". */
export function isLowStock(p: Pick<ProductFull, 'stock_status' | 'variants'>): boolean {
  return p.stock_status === 'low_stock' && !isSoldOut(p)
}

/** 0 = available, 1 = limited quantity, 2 = sold out. */
export function stockRank(p: Pick<ProductFull, 'stock_status' | 'variants'>): number {
  return isSoldOut(p) ? 2 : isLowStock(p) ? 1 : 0
}

/** Available models first, then limited quantity, then sold out — keeping the current order inside each group. */
export function sortByStock<T extends Pick<ProductFull, 'stock_status' | 'variants'>>(products: T[]): T[] {
  return [...products].sort((a, b) => stockRank(a) - stockRank(b))
}
