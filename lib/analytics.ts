/**
 * Utility for Google Analytics 4 (GA4) + Meta (Facebook) Pixel tracking.
 * تتبّع مشاهدة المنتجات، الإضافة للسلة، بدء الطلب، والشراء — على المنصّتين معاً.
 */

// ─── Google Analytics ────────────────────────────────────────────────────────
export const trackGAEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', eventName, params)
  }
}

// ─── Meta (Facebook) Pixel ───────────────────────────────────────────────────
/**
 * يطلق حدثاً على بكسل فيس بوك. eventID (اختياري) يُطابق حدث السيرفر (CAPI)
 * لمنع احتساب الحدث مرتين.
 */
export const trackFBEvent = (
  eventName: string,
  params?: Record<string, any>,
  eventID?: string
) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    if (eventID) {
      ;(window as any).fbq('track', eventName, params, { eventID })
    } else {
      ;(window as any).fbq('track', eventName, params)
    }
  }
}

// ─── تحويل بيانات المنتج إلى قيمة/عملة لفيس بوك ──────────────────────────────
// نعتمد الدولار كعملة موحّدة لأحداث فيس بوك (مدعوم عالمياً وأكثر استقراراً لتحسين
// الإعلانات). نرجع للّيرة فقط إذا لم يتوفّر سعر بالدولار.
function fbPrice(product: any): { value: number; currency: string } {
  const usd = product.discount_price_usd ?? product.price_usd
  if (usd && usd > 0) return { value: usd, currency: 'USD' }
  return { value: product.discount_price_syp ?? product.price_syp ?? 0, currency: 'SYP' }
}

// ─── ViewContent — مشاهدة منتج ───────────────────────────────────────────────
export const trackViewContent = (product: any) => {
  const { value, currency } = fbPrice(product)

  trackGAEvent('view_item', {
    currency,
    value,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category?.name_ar || 'Shoes',
        price: value,
      },
    ],
  })

  trackFBEvent('ViewContent', {
    content_type: 'product',
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category?.name_ar || 'Shoes',
    currency,
    value,
  })
}

// ─── AddToCart — إضافة للسلة ──────────────────────────────────────────────────
export const trackAddToCart = (product: any, quantity: number = 1) => {
  const { value, currency } = fbPrice(product)
  const lineValue = value * quantity

  trackGAEvent('add_to_cart', {
    currency,
    value: lineValue,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category?.name_ar || 'Shoes',
        price: value,
        quantity,
      },
    ],
  })

  trackFBEvent('AddToCart', {
    content_type: 'product',
    content_ids: [product.id],
    content_name: product.name,
    contents: [{ id: product.id, quantity }],
    currency,
    value: lineValue,
  })
}

// ─── InitiateCheckout — بدء إتمام الطلب ──────────────────────────────────────
export const trackInitiateCheckout = (
  items: any[],
  totalUsd: number,
  totalSyp: number
) => {
  const useUsd = totalUsd && totalUsd > 0
  const value = useUsd ? totalUsd : totalSyp
  const currency = useUsd ? 'USD' : 'SYP'
  const numItems = items.reduce((s, i) => s + (i.quantity || 1), 0)

  trackGAEvent('begin_checkout', {
    currency,
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, quantity: i.quantity })),
  })

  trackFBEvent('InitiateCheckout', {
    content_type: 'product',
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
    num_items: numItems,
    currency,
    value,
  })
}

// ─── Purchase — إتمام الشراء ─────────────────────────────────────────────────
// يُطلق بجانب حدث السيرفر (CAPI) بنفس eventID (رقم الطلب) لمنع التكرار.
export const trackPurchase = (
  orderId: string,
  total: number,
  items: any[],
  currency: string = 'SYP'
) => {
  trackGAEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price_syp,
      quantity: item.quantity,
    })),
  })

  trackFBEvent(
    'Purchase',
    {
      content_type: 'product',
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      num_items: items.reduce((s, i) => s + (i.quantity || 1), 0),
      currency,
      value: total,
    },
    orderId
  )
}
