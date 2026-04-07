/**
 * Utility for Google Analytics 4 (GA4) Ecommerce Tracking
 * This help track product views, cart additions, and purchases.
 */

export const trackGAEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', eventName, params)
  }
}

export const trackAddToCart = (product: any, quantity: number = 1) => {
  trackGAEvent('add_to_cart', {
    currency: 'SYP',
    value: (product.discount_price_syp || product.price_syp) * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category?.name_ar || 'Shoes',
        price: product.discount_price_syp || product.price_syp,
        quantity: quantity,
      },
    ],
  })
}

export const trackPurchase = (orderId: string, total: number, items: any[]) => {
  trackGAEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'SYP',
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price_syp,
      quantity: item.quantity,
    })),
  })
}
