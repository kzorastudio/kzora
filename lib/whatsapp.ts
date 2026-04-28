import type { CartItem, Currency } from '@/types'
import { formatPrice, SHIPPING_LABELS } from './utils'

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '963964514765'

interface OrderForWhatsApp {
  orderNumber: string
  customerName: string
  customerPhone: string
  governorate: string
  centerName?: string
  address: string
  deliveryType: 'delivery' | 'shipping'
  shippingCompany: string
  shippingCompanyName?: string
  items: CartItem[]
  couponCode?: string
  discountSyp?: number
  discountUsd?: number
  loyaltyDiscountSyp?: number
  loyaltyDiscountUsd?: number
  multiItemDiscountSyp?: number
  multiItemDiscountUsd?: number
  shippingFeeSyp?: number
  shippingFeeUsd?: number
  shippingFeeDetermined?: boolean
  subtotalSyp: number
  subtotalUsd: number
  totalSyp: number
  totalUsd: number
  currency: Currency
  paymentMethod?: string
  paymentTransactionId?: string
  shamCashNumber?: string
  loyaltyPointsCount?: number
  notes?: string
}

const DIVIDER = '--------------------'
const SUBDIVIDER = '- - - - - - - - - -'

// Define emoji constants using ES6 Unicode code points to ensure correct encoding across all mobile platforms
const EMOJI = {
  GIFT: '\u{1F381}',
  ID: '\u{1F194}',
  CALENDAR: '\u{1F4C5}',
  USER: '\u{1F464}',
  GREET: '\u{1F44B}',
  PHONE: '\u{1F4DE}',
  CITY: '\u{1F3D9}\u{FE0F}',
  HOME: '\u{1F3E0}',
  MAP_PIN: '\u{1F4CD}',
  TRUCK: '\u{1F69A}',
  ROCKET: '\u{1F680}',
  OFFICE: '\u{1F3E2}',
  SHOPPING: '\u{1F6CD}\u{FE0F}',
  PALETTE: '\u{1F3A8}',
  RULER: '\u{1F4CF}',
  NUMBERS: '\u{1F522}',
  CASH: '\u{1F4B5}',
  TAG: '\u{1F3F7}\u{FE0F}',
  MONEY_BAG: '\u{1F4B0}',
  STAR: '\u{2B50}',
  BULB: '\u{1F4A1}',
  CELEBRATION: '\u{1F389}',
  CARD: '\u{1F4B3}',
  MOBILE: '\u{1F4F1}',
  NOTE: '\u{1F4DD}',
  PRAY: '\u{1F64F}',
  CHECK: '\u{2705}',
}

export function buildWhatsAppUrl(order: OrderForWhatsApp): string {
  const currency = order.currency
  const isAleppoDelivery = order.deliveryType === 'delivery'

  const lines: string[] = [
    `${EMOJI.GIFT} *طلب جديد من متجر كزورا* ${EMOJI.GIFT}`,
    ``,
    `${EMOJI.ID} *رقم الطلب:* #${order.orderNumber}`,
    `${EMOJI.CALENDAR} *التاريخ:* ${new Date().toLocaleDateString('ar-SY')}`,
    DIVIDER,
    ``,
    `${EMOJI.USER} *معلومات الزبون*`,
    `${EMOJI.GREET} *الاسم:* ${order.customerName}`,
    `${EMOJI.PHONE} *الهاتف:* ${order.customerPhone}`,
    `${EMOJI.CITY} *المحافظة:* ${order.governorate}`,
  ]

  // Task 9: Address formatting based on delivery type
  if (isAleppoDelivery) {
    // Aleppo: show address only, skip center
    if (order.address) {
      lines.push(`${EMOJI.HOME} *العنوان:* ${order.address}`)
    }
  } else {
    // Other governorates: show district/center only, skip address
    if (order.centerName) {
      lines.push(`${EMOJI.MAP_PIN} *المنطقة/المركز:* ${order.centerName}`)
    }
  }

  lines.push(``)
  lines.push(`${EMOJI.TRUCK} *تفاصيل الشحن*`)
  lines.push(`${EMOJI.ROCKET} *النوع:* ${isAleppoDelivery ? 'توصيل عادي (حلب)' : 'شحن للمحافظات'}`)

  if (!isAleppoDelivery) {
    lines.push(`${EMOJI.OFFICE} *الشركة:* ${order.shippingCompanyName || SHIPPING_LABELS[order.shippingCompany || ''] || order.shippingCompany}`)
  }

  lines.push(``)
  lines.push(`${EMOJI.SHOPPING} *المنتجات المطلوبة*`)

  order.items.forEach((item, i) => {
    const price = currency === 'SYP'
      ? formatPrice(item.discount_price_syp ?? item.price_syp, 'SYP')
      : formatPrice(item.discount_price_usd ?? item.price_usd, 'USD')

    lines.push(SUBDIVIDER)
    lines.push(`${i + 1}. *${item.name}*`)
    if (item.color) lines.push(`   ${EMOJI.PALETTE} *اللون:* ${item.color_name || item.color}`)
    if (item.size) {
      const moldNotice = item.mold_type === 'chinese' ? ' (قالب صيني)' : ' (قالب نظامي)'
      lines.push(`   ${EMOJI.RULER} *المقاس:* ${item.size}${moldNotice}`)
    }
    lines.push(`   ${EMOJI.NUMBERS} *الكمية:* ${item.quantity} × ${price}`)
  })

  lines.push(DIVIDER)

  const subtotal = currency === 'SYP'
    ? formatPrice(order.subtotalSyp, 'SYP')
    : formatPrice(order.subtotalUsd, 'USD')

  lines.push(`${EMOJI.CASH} *المجموع الفرعي:* ${subtotal}`)

  if (order.couponCode && (order.discountSyp || order.discountUsd)) {
    const discount = currency === 'SYP'
      ? formatPrice(order.discountSyp!, 'SYP')
      : formatPrice(order.discountUsd!, 'USD')
    lines.push(`${EMOJI.TAG} *خصم (${order.couponCode}):* -${discount}`)
  }

  if (order.loyaltyDiscountSyp || order.loyaltyDiscountUsd) {
    const loyaltyDisc = currency === 'SYP'
      ? formatPrice(order.loyaltyDiscountSyp!, 'SYP')
      : formatPrice(order.loyaltyDiscountUsd!, 'USD')
    lines.push(`${EMOJI.GIFT} *خصم الولاء:* -${loyaltyDisc}`)
  }
  
  if (order.multiItemDiscountSyp || order.multiItemDiscountUsd) {
    const multiDisc = currency === 'SYP'
      ? formatPrice(order.multiItemDiscountSyp!, 'SYP')
      : formatPrice(order.multiItemDiscountUsd!, 'USD')
    lines.push(`${EMOJI.CELEBRATION} *حسم تعدد القطع:* -${multiDisc}`)
  }

  if (order.shippingFeeDetermined) {
    const feeLabel = isAleppoDelivery ? 'أجرة التوصيل' : 'أجرة الشحن'
    lines.push(`${EMOJI.TRUCK} *${feeLabel}:* (يتم تحديدها مع البائع)`)
  } else {
    const shippingFee = currency === 'SYP' ? (order.shippingFeeSyp ?? 0) : (order.shippingFeeUsd ?? 0)
    const feeLabel = isAleppoDelivery ? 'أجرة التوصيل' : 'أجرة الشحن'
    lines.push(`${EMOJI.TRUCK} *${feeLabel}:* +${formatPrice(shippingFee, currency)}`)
  }

  const total = currency === 'SYP'
    ? formatPrice(order.totalSyp, 'SYP')
    : formatPrice(order.totalUsd, 'USD')

  lines.push(``)
  lines.push(`${EMOJI.MONEY_BAG} *الإجمالي النهائي: ${total}*`)

  lines.push(``)
  lines.push(`${EMOJI.GIFT} *مبروك! لقد كسبت نقطة ولاء من هذا الطلب*`)
  lines.push(`_(سيتم تفعيل النقطة فور استلام الطلب)_`)

  if (typeof order.loyaltyPointsCount === 'number') {
    const currentPoints = order.loyaltyPointsCount
    const remaining = Math.max(0, 3 - currentPoints)

    lines.push(``)
    lines.push(`${EMOJI.STAR} *نظام المكافآت* ${EMOJI.STAR}`)
    lines.push(`• النقاط المكتسبة من هذا الطلب: 1 نقطة`)
    lines.push(`• رصيد نقاطك حالياً: ${currentPoints} نقطة`)

    if (remaining > 0) {
      lines.push(`${EMOJI.BULB} بقي لك ${remaining} طلبات مؤكدة للحصول على خصم مكافأة!`)
    } else {
      lines.push(`${EMOJI.CELEBRATION} مبروك! هذا هو طلبك الرابع وقد حصلت على التخفيض!`)
    }
  }

  const pMethod = order.paymentMethod === 'sham_cash' ? 'شام كاش (تم التحويل)' : 'الدفع عند الاستلام'
  lines.push(``)
  lines.push(`${EMOJI.CARD} *طريقة الدفع:* ${pMethod}`)

  if (order.paymentMethod === 'sham_cash' && order.shamCashNumber) {
    lines.push(`${EMOJI.MOBILE} *رقم محفظة شام كاش:* ${order.shamCashNumber}`)
  }

  if (order.paymentMethod === 'sham_cash' && order.paymentTransactionId) {
    lines.push(`${EMOJI.NUMBERS} *رقم العملية:* ${order.paymentTransactionId}`)
  }

  // Task: Explicitly check and add notes
  if (order.notes && order.notes.trim()) {
    lines.push(``)
    lines.push(`${EMOJI.NOTE} *ملاحظات الزبون:*`)
    lines.push(order.notes.trim())
  }

  lines.push(``)
  lines.push(`${EMOJI.PRAY} *شكراً لتسوقكم من كزورا!*`)
  lines.push(`${EMOJI.CHECK} *سيتم تأكيد طلبكم قريباً...*`)

  const message = lines.join('\n')
  const encoded = encodeURIComponent(message)
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encoded}`
}
