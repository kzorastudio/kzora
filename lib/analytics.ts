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

// ─── معرّفات فيس بوك من المتصفح (fbp / fbc) ──────────────────────────────────
/**
 * يقرأ كوكيز فيس بوك (_fbp = معرّف المتصفح، _fbc = معرّف نقرة الإعلان).
 * إن فُقد كوكي _fbc (شائع على iOS بعد 7 أيام) نرجع للنسخة المحفوظة في
 * localStorage التي يلتقطها مكوّن MetaPixel من fbclid في رابط الإعلان.
 */
export const getFbBrowserData = (): { fbp?: string; fbc?: string } => {
  if (typeof document === 'undefined') return {}
  const readCookie = (name: string) =>
    document.cookie
      .split('; ')
      .find((c) => c.startsWith(name + '='))
      ?.split('=')
      .slice(1)
      .join('=')
  const fbp = readCookie('_fbp')
  let fbc = readCookie('_fbc')
  if (!fbc) {
    try {
      fbc = localStorage.getItem('_kz_fbc') || undefined
    } catch {}
  }
  return { fbp, fbc }
}

// ─── Advanced Matching — تمرير بيانات العميل للبكسل ──────────────────────────
/**
 * يعيد تهيئة البكسل مع بيانات العميل (هاتف، اسم، مدينة) فيهشّرها البكسل تلقائياً
 * ويرسلها مع كل الأحداث اللاحقة. يرفع جودة مطابقة الأحداث (Event Match Quality)
 * بشكل كبير، مما يحسّن استهداف الإعلانات. يُستدعى عند إتمام الطلب حيث تتوفر البيانات.
 */
export const setFbAdvancedMatching = (customer: {
  phone?: string
  fullName?: string
  city?: string
}) => {
  if (typeof window === 'undefined' || !(window as any).fbq) return
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID
  if (!pixelId) return

  const userData: Record<string, string> = { country: 'sy' }

  if (customer.phone) {
    let digits = customer.phone.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = '963' + digits.slice(1)
    if (digits) userData.ph = digits
  }
  const nameParts = customer.fullName?.trim().split(/\s+/) ?? []
  if (nameParts[0]) userData.fn = nameParts[0].toLowerCase()
  if (nameParts.length > 1) userData.ln = nameParts.slice(1).join('').toLowerCase()
  if (customer.city) userData.ct = customer.city.trim().toLowerCase().replace(/\s+/g, '')

  ;(window as any).fbq('init', pixelId, userData)
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
    contents: [{ id: product.id, quantity: 1 }],
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

// ─── Search — بحث داخل المتجر ────────────────────────────────────────────────
// إشارة اهتمام قوية: من يبحث عن منتج نيّته شرائية أعلى من المتصفّح العادي.
export const trackSearch = (query: string) => {
  trackGAEvent('search', { search_term: query })
  trackFBEvent('Search', { search_string: query })
}

// ─── Contact — تواصل عبر واتساب ──────────────────────────────────────────────
// كثير من مبيعات المتجر تتم عبر واتساب مباشرة؛ هذا الحدث يخبر ميتا أنّ الزائر
// تواصل، فيمكن الاستهداف/الاستبعاد بناءً عليه وبناء جماهير مشابهة.
export const trackContact = () => {
  trackGAEvent('contact', { method: 'whatsapp' })
  trackFBEvent('Contact', { content_category: 'whatsapp' })
}

// ─── AddPaymentInfo — إدخال بيانات الدفع/الشحن ───────────────────────────────
// يُطلق عند تعبئة الفورم وضغط تأكيد الطلب (قبل إنشائه) — يكمل قمع التحويل
// بين InitiateCheckout و Purchase فيتعلّم ميتا أين يتوقف الزبائن.
export const trackAddPaymentInfo = (
  items: any[],
  total: number,
  currency: string
) => {
  trackGAEvent('add_payment_info', { currency, value: total })
  trackFBEvent('AddPaymentInfo', {
    content_type: 'product',
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
    currency,
    value: total,
  })
}
